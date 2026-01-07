import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useApp } from '../contexts/AppContext';
import { generateAIResponse } from '../lib/ai';
import ReactMarkdown from 'react-markdown';

interface Props {
  onBack: () => void;
}

const BASE_SYSTEM_INSTRUCTION = `
Você é um Coach de Relacionamentos sênior e psicólogo especializado em terapia de casal, com mais de 20 anos de experiência clínica.
Seu objetivo é ajudar casais a melhorarem a qualidade de vida a dois, resolverem conflitos e aprofundarem a conexão emocional.
Você tem acesso aos dados do casal (Diário, Acordos, Nível). Use isso para personalizar seus conselhos.

Diretrizes de comportamento:
1. Responda sempre em Português do Brasil de forma calorosa, empática, mas profissional e direta.
2. Cite eventos específicos do diário se relevante (ex: "Vi que vocês brigaram ontem por causa de louça...").
3. Ofereça conselhos práticos baseados em psicologia comportamental e comunicação não-violenta.
4. Se a nota do dia foi baixa, seja acolhedor. Se foi alta, celebre.
5. Seja conciso nas respostas.
6. USE FORMATAÇÃO:
   - Use **Negrito** para títulos de seções e palavras-chave.
   - Use listas (hífens) para dar passos práticos.
   - Não use blocos de código para texto normal.
`;

export const AICoach: React.FC<Props> = ({ onBack }) => {
  const { userProfile, stats, logs, agreements, preferences, goals, specialDates, updatePreferences } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Olá, ${userProfile.names.split('&')[0].trim()} e ${userProfile.names.split('&')[1]?.trim() || 'Parceiro'}! ♾️ Sou seu Mentor. Estou analisando todos os seus dados: metas, acordos, datas especiais e diário. Como posso ajudar a melhorar o relacionamento hoje?`,
      sender: 'ai',
      timestamp: Date.now()
    }
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  // Helper to build context
  const buildContext = () => {
    // 1. Richer Log Context (Last 14 entries for trend analysis)
    const recentLogs = logs.slice(0, 14).map(l => ({
      date: l.date.split('T')[0],
      rating: l.rating,
      conflict: l.conflict ? `SIM (${l.discussionReason || 'Sem motivo'})` : 'Não',
      intimacy: l.intimacy ? 'SIM' : `NÃO (${l.noIntimacyReason || '-'})`,
      summary: l.summary,
      discussionReason: l.discussionReason
    }));

    // 2. Detailed Agreements with Responsibility
    const detailedAgreements = agreements.map(a =>
      `- ${a.title} (${a.tag}, Resp: ${a.responsibility === 'me' ? 'Eu' : a.responsibility === 'partner' ? 'Parceiro' : 'Ambos'}). Status: ${a.completedDates.length > 0 ? 'Ativo' : 'Novo'}`
    ).join('\n');

    // 3. Individual Goals
    const myGoals = goals.map(g =>
      `- ${g.title} (Alvo: ${g.target}, Atual: ${g.current}). Tipo: ${g.type}`
    ).join('\n');

    // 4. Special Dates (Next 3 upcoming)
    const upcomingDates = specialDates
      .filter(d => new Date(d.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
      .map(d => `${d.title} em ${d.date} (${d.type})`)
      .join(', ');

    return `
      DADOS COMPLETOS DO CASAL:
      - Nomes: ${userProfile.names}
      - Tempo juntos: ${stats.daysTogether} dias
      - Nível: ${stats.level} (Score: ${stats.soulmateScore}%)
      
      ACORDOS COMPARTILHADOS:
      ${detailedAgreements || "Nenhum acordo definido."}

      METAS INDIVIDUAIS (DO USUÁRIO):
      ${myGoals || "Nenhuma meta definida."}

      PRÓXIMAS DATAS ESPECIAIS:
      ${upcomingDates || "Nenhuma data próxima."}

      DIÁRIO (ÚLTIMOS 14 DIAS):
      ${JSON.stringify(recentLogs)}
      `;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const userText = textOverride || input;
    if (!userText.trim() || isLoading) return;

    if (!textOverride) setInput('');
    setIsLoading(true);

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const fullInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${buildContext()}`;

      // Prepare simplified history for the service
      const history = messages.map(m => ({
        role: m.sender === 'ai' ? 'model' as const : 'user' as const,
        text: m.text
      }));

      const responseText = await generateAIResponse(
        userText,
        fullInstruction,
        preferences.aiConfig,
        history
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        text: `Erro: ${error.message || "Falha na conexão com a IA"}. Verifique suas chaves na Configuração.`,
        sender: 'ai',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const ICEBREAKERS = [
    { label: "Análise da Semana", icon: "date_range", prompt: "Faça uma análise detalhada da nossa última semana com base no diário. Pontue altos e baixos e sugira uma melhoria." },
    { label: "Análise do Mês", icon: "calendar_month", prompt: "Como foi nosso último mês? Identifique tendências de humor e conexão. Estamos evoluindo?" },
    { label: "Coach de Conflitos", icon: "diversity_4", prompt: "Com base nos nossos conflitos registrados, qual parece ser a causa raiz recorrente? Me dê 3 passos práticos para resolver isso." },
    { label: "Guru Romântico", icon: "favorite", prompt: "Preciso de uma ideia criativa e personalizada para surpreender meu amor hoje. Use o que sabe sobre nós." },
    { label: "Tendências", icon: "trending_up", prompt: "Quais tendências você observa no nosso relacionamento (intimidade, comunicação, brigas) nas últimas semanas?" }
  ];

  const handleResetChat = () => {
    setMessages([{
      id: Date.now().toString(),
      text: "Reiniciando nossa conversa... Pronto! O que manda?",
      sender: 'ai',
      timestamp: Date.now()
    }]);
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white animate-[fadeIn_0.3s_ease-out]">
      <header className="flex-none bg-background-light dark:bg-background-dark pt-2 pb-2 px-4 shadow-sm z-10 border-b border-primary/10 dark:border-white/5 relative">
        <div className="flex items-center justify-between h-14">
          <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-primary">
            <span className="material-symbols-rounded text-[24px]">close</span>
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-[24px]">{preferences.aiConfig.provider === 'groq' ? 'speed' : 'auto_awesome'}</span>
              <h1 className="text-lg font-bold tracking-tight">Mentor ({preferences.aiConfig.provider === 'groq' ? 'Groq' : 'Gemini'})</h1>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Conectado aos seus dados
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
          >
            <span className="material-symbols-rounded text-[24px]">settings</span>
          </button>

          {/* Settings Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute top-14 right-4 z-20 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden min-w-[160px] animate-[fadeIn_0.1s_ease-out]">
                <div className="p-2 border-b border-gray-100 dark:border-white/5">
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

                <button
                  onClick={handleResetChat}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 font-medium"
                >
                  <span className="material-symbols-rounded text-[18px]">restart_alt</span> Reiniciar
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scroll-smooth no-scrollbar relative">
        <div className="flex justify-center">
          <span className="text-[11px] font-medium text-text-muted bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">Hoje</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 group ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="bg-primary/10 rounded-full size-9 shrink-0 flex items-center justify-center shadow-sm border border-primary/20 text-primary">
                <span className="material-symbols-rounded text-[20px]">all_inclusive</span>
              </div>
            )}
            <div className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
              {msg.sender === 'ai' && <span className="text-text-muted text-[11px] ml-1">Mentor IA</span>}
              <div className={`rounded-2xl px-4 py-3 shadow-sm text-[15px] leading-relaxed ${msg.sender === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-white dark:bg-[#492225] text-gray-800 dark:text-pink-50 border border-primary/10 dark:border-transparent rounded-bl-none'
                }`}>
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown
                      components={{
                        strong: (props) => <span className="font-bold text-primary dark:text-pink-300" {...props} />,
                        ul: (props) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                        ol: (props) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                        li: (props) => <li className="mb-0.5" {...props} />,
                        h1: (props) => <h3 className="font-bold text-lg mb-2 mt-4" {...props} />,
                        h2: (props) => <h4 className="font-bold text-md mb-2 mt-3" {...props} />,
                        h3: (props) => <h5 className="font-bold text-sm mb-1 mt-2 uppercase tracking-wide opacity-80" {...props} />,
                        p: (props) => <p className="mb-2 last:mb-0" {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Icebreakers - Show only if few messages or tailored to current context */}
        {messages.length < 4 && !isLoading && (
          <div className="grid grid-cols-2 gap-2 mt-4 animate-[fadeIn_0.5s_ease-out]">
            {ICEBREAKERS.map(ib => (
              <button
                key={ib.label}
                onClick={() => handleSend(ib.prompt)}
                className={`p-3 rounded-xl border border-primary/10 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-primary/5 active:scale-95 transition-all text-left flex flex-col gap-1 ${ib.label === 'Tendências' ? 'col-span-2' : ''}`}
              >
                <span className="material-symbols-rounded text-primary text-xl mb-1">{ib.icon}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{ib.label}</span>
              </button>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="bg-primary/10 rounded-full size-9 shrink-0 flex items-center justify-center shadow-sm border border-primary/20 text-primary">
              <span className="material-symbols-rounded text-[20px] animate-pulse">all_inclusive</span>
            </div>
            <div className="bg-white dark:bg-[#492225] text-gray-800 dark:text-pink-50 border border-primary/10 dark:border-transparent rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
        <div className="h-24"></div>
      </main>

      <div className="flex-none fixed bottom-0 w-full z-20">
        <div className="h-12 w-full bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pointer-events-none"></div>
        <div className="bg-background-light dark:bg-background-dark px-4 pb-6 pt-1">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white dark:bg-[#2F1517] rounded-[24px] min-h-[50px] flex items-center px-1 border border-primary/10 dark:border-pink-500/10 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 py-3 px-4"
                placeholder="Pergunte sobre seu relacionamento..."
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading}
              className={`size-[50px] rounded-full flex items-center justify-center text-white shadow-lg transition-all shrink-0 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-red-600 active:scale-90'}`}
            >
              <span className="material-symbols-rounded filled">send</span>
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};