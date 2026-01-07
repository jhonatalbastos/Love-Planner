import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '../lib/ai';
import { JournalQuestion } from '../types';
import { useApp } from '../contexts/AppContext';

interface Props {
  onBack: () => void;
}

// Initial seed questions if completely empty
const SEED_QUESTIONS = [
  { id: 'seed-1', text: "Qual é a sua memória favorita de nós dois no último ano?", category: 'Intimidade' },
  { id: 'seed-2', text: "O que eu faço que faz você se sentir mais amado(a)?", category: 'Comunicação' },
  { id: 'seed-3', text: "Onde você nos vê daqui a 5 anos?", category: 'Planos & Futuro' },
  { id: 'seed-4', text: "Se pudéssemos viajar para qualquer lugar amanhã, para onde iríamos?", category: 'Planos & Futuro' },
  { id: 'seed-5', text: "Qual foi o momento mais engraçado que já vivemos juntos?", category: 'Quebra-Gelo' },
  { id: 'seed-6', text: "O que você gostaria de tentar na cama que nunca tentamos?", category: 'Intimidade' },
  { id: 'seed-7', text: "Como podemos melhorar nossa rotina matinal?", category: 'Comunicação' },
];

export const Journal: React.FC<Props> = ({ onBack }) => {
  const { userProfile, logs, preferences, updatePreferences, journalQuestions, journalAnswers, addQuestion, saveAnswer } = useApp();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // State to track if we are waiting for a specific question to appear
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);

  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [streak, setStreak] = useState(0); // This could be calculated from answers in future

  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  // Combine Seed questions (mapped to proper shape if needed for UI) with Context questions
  const displayQuestions = journalQuestions.length > 0
    ? journalQuestions
    : SEED_QUESTIONS.map(q => ({ ...q, created_by: 'system', created_at: new Date().toISOString() } as JournalQuestion));

  const filteredQuestions = activeCategory
    ? displayQuestions.filter(q => q.category === activeCategory)
    : displayQuestions;

  // EFFECT: Watch for target question appearance
  useEffect(() => {
    if (targetQuestionId && displayQuestions.length > 0) {
      // Search in the CURRENT filtered view first
      let idx = filteredQuestions.findIndex(q => q.id === targetQuestionId);

      // If found in current filter, set it
      if (idx !== -1) {
        setCurrentQuestionIndex(idx);
        setTargetQuestionId(null); // Clear target
      } else {
        // Not in current filter? Maybe check if it exists globally and switch filter?
        const globalIdx = displayQuestions.findIndex(q => q.id === targetQuestionId);
        if (globalIdx !== -1) {
          // If it exists but not in current filter, remove filter to show it
          if (activeCategory) setActiveCategory(null);
          // We'll let the next render pick it up via the same effect (since activeCategory changes, filteredQuestions changes)
        }
      }
    }
  }, [journalQuestions, targetQuestionId, activeCategory]);

  const currentQuestion = filteredQuestions[currentQuestionIndex % filteredQuestions.length];

  // Calculate if answered by me
  const myAnswer = currentQuestion ? journalAnswers.find(a => a.question_id === currentQuestion.id && a.user_id === userProfile.connectionStatus) : null;

  const handleShuffle = () => {
    if (filteredQuestions.length > 0) {
      const nextIndex = Math.floor(Math.random() * filteredQuestions.length);
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const targetCategory = activeCategory || 'Geral';
      const prompt = `
            Com base no perfil do casal:
            - Nomes: ${userProfile.names}
            - Categoria Focada: ${targetCategory}
            
            Gere UMA pergunta CURTA (máximo 15 palavras) e direto ao ponto para o diário do casal.
            ${targetCategory !== 'Geral' ? `A pergunta DEVE ser obrigatoriamente sobre a categoria: ${targetCategory}.` : ''}
            
            Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
            {
              "text": "Pergunta curta aqui?",
              "category": "${targetCategory}"
            }
          `;

      const systemInstruction = "Você é um especialista em dinâmicas de casal. Gere perguntas curtas e diretas.";

      const responseText = await generateAIResponse(prompt, systemInstruction, preferences.aiConfig);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      if (cleanJson) {
        const result = JSON.parse(cleanJson);
        if (!result.text || result.text.length < 3) throw new Error("Pergunta inválida gerada");

        const newQ: JournalQuestion = {
          id: crypto.randomUUID(),
          text: result.text,
          category: result.category || targetCategory,
          created_at: new Date().toISOString()
        };

        setTargetQuestionId(newQ.id); // Set target BEFORE adding to trigger effect later
        await addQuestion(newQ);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (activeCategory === category) {
      handleViewAll();
    } else {
      setActiveCategory(category);
      setCurrentQuestionIndex(0); // Reset to start of category
      scrollToTop();
    }
  };

  const handleViewAll = () => {
    setActiveCategory(null);
    setCurrentQuestionIndex(Math.floor(Math.random() * displayQuestions.length));
    scrollToTop();
  };

  const scrollToTop = () => {
    if (topRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    setIsSaving(true);
    await saveAnswer({
      question_id: currentQuestion.id,
      user_id: 'me', // handled by context actually
      text: answer
    });
    setAnswer('');
    setIsAnswering(false);
    setStreak(s => s + 1);
    alert("Resposta salva e compartilhada com seu amor!");
    setIsSaving(false);
  };

  const selectQuestionFromId = (id: string) => {
    const idx = displayQuestions.findIndex(q => q.id === id);
    if (idx !== -1) {
      setActiveCategory(null);
      setCurrentQuestionIndex(idx);
      setShowFavorites(false);
      scrollToTop();
    }
  };

  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const isBookmarked = currentQuestion && bookmarked.includes(currentQuestion.id);
  const toggleBookmark = () => {
    if (!currentQuestion) return;
    setBookmarked(prev => prev.includes(currentQuestion.id) ? prev.filter(id => id !== currentQuestion.id) : [...prev, currentQuestion.id]);
  };

  return (
    <div ref={topRef} className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-6 animate-[fadeIn_0.3s_ease-out]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/5 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center px-4 py-3 justify-between max-w-md mx-auto w-full">
          <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-primary/10 transition-colors">
            <span className="material-symbols-rounded text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Diário do Casal</h2>
          <div className="flex size-10 items-center justify-end relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors text-primary"
            >
              <span className="material-symbols-rounded">settings</span>
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)}></div>
                <div className="absolute top-12 right-0 z-20 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden min-w-[160px] animate-[fadeIn_0.1s_ease-out]">
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase mb-2 px-2">Provedor IA</p>
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                      {[
                        { id: 'gemini', label: 'Gemini', icon: 'auto_awesome' },
                        { id: 'groq', label: 'Groq', icon: 'speed' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => updatePreferences({ aiConfig: { ...preferences.aiConfig, provider: opt.id as any } })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${preferences.aiConfig?.provider === opt.id
                              ? 'bg-white dark:bg-card-dark shadow-sm text-primary'
                              : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          <span className="material-symbols-rounded text-[14px]">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="px-4 pb-3 max-w-md mx-auto w-full">
          <div className="flex items-center justify-between bg-white dark:bg-white/5 rounded-xl p-2 px-3 border border-primary/5 dark:border-white/5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-orange-100 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400">
                <span className="material-symbols-rounded text-[18px] filled">local_fire_department</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-muted dark:text-white/60 uppercase">Sequência</span>
                <span className="text-sm font-bold leading-none">{streak} Dias</span>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-text-muted dark:text-white/60 uppercase">Respondidas</span>
                <span className="text-sm font-bold leading-none">{journalAnswers.length}</span>
              </div>
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                <span className="material-symbols-rounded text-[18px]">done_all</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[140px]"></div>

      <main className="flex flex-col gap-6 px-4 max-w-md mx-auto w-full">
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="material-symbols-rounded text-primary filled">lightbulb</span>
              {activeCategory ? `Categoria: ${activeCategory}` : 'Para hoje'}
            </h3>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-rose-400 p-6 shadow-soft dark:shadow-glow transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30"></div>
            <div className="absolute -right-6 -top-6 text-white/10 rotate-12">
              <span className="material-symbols-rounded text-[140px] filled">favorite</span>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                  {currentQuestion?.category || 'Geral'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
                    title="Gerar com IA"
                  >
                    <span className={`material-symbols-rounded text-[18px] ${isGenerating ? 'animate-spin' : ''}`}>{isGenerating ? 'refresh' : 'auto_awesome'}</span>
                    <span className="text-xs font-bold hidden sm:inline">{isGenerating ? 'Gerando...' : 'Nova Pergunta'}</span>
                  </button>
                  <button
                    onClick={handleShuffle}
                    className="flex size-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors active:scale-90"
                    title="Aleatório"
                  >
                    <span className="material-symbols-rounded text-[18px]">shuffle</span>
                  </button>
                  <button
                    onClick={() => setShowFavorites(true)}
                    className="flex size-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors active:scale-90 relative"
                    title="Favoritos"
                  >
                    <span className="material-symbols-rounded text-[18px]">bookmarks</span>
                    {bookmarked.length > 0 && <span className="absolute top-1 right-1 size-2 bg-primary rounded-full border border-white"></span>}
                  </button>
                  <button
                    onClick={toggleBookmark}
                    className={`flex size-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors active:scale-90 ${isBookmarked ? 'bg-white/40 ring-2 ring-white/50' : ''}`}
                    title="Favoritar Atual"
                  >
                    <span className={`material-symbols-rounded text-[18px] ${isBookmarked ? 'filled' : ''}`}>bookmark</span>
                  </button>
                </div>
              </div>

              {!isAnswering ? (
                <>
                  <div className="py-2 min-h-[80px] flex items-center">
                    <h2 className="text-2xl font-bold leading-snug text-white drop-shadow-sm animate-[fadeIn_0.5s_ease-out]">
                      "{currentQuestion?.text}"
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <button
                      onClick={() => setIsAnswering(true)}
                      className="flex-1 rounded-xl bg-white text-primary py-3.5 px-4 font-bold shadow-lg shadow-black/10 active:scale-95 transition-transform flex items-center justify-center gap-2 group-hover:shadow-xl"
                    >
                      <span className="material-symbols-rounded text-[20px]">edit_note</span>
                      Responder Juntos
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <textarea
                    autoFocus
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Escrevam a resposta aqui..."
                    className="w-full h-32 rounded-xl bg-white/10 border border-white/30 p-3 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 mb-3 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAnswering(false)}
                      className="flex-1 py-2 rounded-lg bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAnswer}
                      className="flex-1 py-2 rounded-lg bg-white text-primary font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1 mt-2">
            <h3 className="text-lg font-bold tracking-tight">Explorar Categorias</h3>
            <button
              onClick={handleViewAll}
              className={`text-sm font-bold transition-colors ${!activeCategory ? 'text-primary bg-primary/10 px-2 py-0.5 rounded-md' : 'text-text-muted hover:text-primary'}`}
            >
              Ver todas
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Comunicação', icon: 'chat_bubble', title: 'Comunicação', sub: 'Entender melhor', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { id: 'Intimidade', icon: 'favorite', title: 'Intimidade', sub: 'Conexão profunda', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
              { id: 'Planos & Futuro', icon: 'flight', title: 'Planos & Futuro', sub: 'Sonhos em comum', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { id: 'Quebra-Gelo', icon: 'sentiment_very_satisfied', title: 'Quebra-Gelo', sub: 'Diversão leve', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
            ].map((cat, i) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={i}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex flex-col gap-3 p-4 rounded-2xl border shadow-sm active:scale-95 transition-all text-left group
                    ${isActive
                      ? 'bg-primary/5 border-primary ring-1 ring-primary dark:bg-primary/10'
                      : 'bg-white dark:bg-card-dark border-gray-100 dark:border-white/5 hover:border-primary/20'
                    }`}
                >
                  <div className={`size-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center transition-colors duration-300`}>
                    <span className="material-symbols-rounded text-[22px]">{cat.icon}</span>
                  </div>
                  <div>
                    <h4 className={`font-bold text-base ${isActive ? 'text-primary' : ''}`}>{cat.title}</h4>
                    <p className="text-xs text-text-muted dark:text-gray-400 mt-0.5">{cat.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Favorites Modal */}
      {showFavorites && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowFavorites(false)}>
          <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-primary filled">bookmarks</span>
                <h3 className="font-bold text-lg">Perguntas Favoritas</h3>
              </div>
              <button onClick={() => setShowFavorites(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {bookmarked.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <span className="material-symbols-rounded text-4xl mb-2">bookmark_border</span>
                  <p className="text-sm">Nenhuma pergunta salva ainda.</p>
                </div>
              ) : (
                bookmarked.map(id => {
                  const q = displayQuestions.find(qi => qi.id === id);
                  if (!q) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => selectQuestionFromId(id)}
                      className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className="material-symbols-rounded text-[18px] text-primary filled">bookmark</span>
                      </div>
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                        "{q.text}"
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};