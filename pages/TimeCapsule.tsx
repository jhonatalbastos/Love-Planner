import React, { useState } from 'react';
import { Screen } from '../types';
import { useApp } from '../contexts/AppContext';
import { generateAIResponse } from '../lib/ai';

interface TimeCapsuleProps {
  onBack: () => void;
}

export const TimeCapsule: React.FC<TimeCapsuleProps> = ({ onBack }) => {
  const { logs, memories, addMemory, userProfile, preferences, updatePreferences } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const currentDate = new Date();

  const handleGenerateMemory = async () => {
    if (logs.length === 0) {
      alert("Precisamos de alguns registros no diário para criar uma memória!");
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare context from last 10 logs
      const recentLogs = logs.slice(0, 10).map(l => ({
        date: l.date,
        rating: l.rating,
        summary: l.summary,
        gratitude: l.gratitude,
        actions: [...l.partnerActions, ...l.myActions].join(', ')
      }));

      const systemInstruction = `
        Atue como um narrador romântico e nostálgico.
        Seu objetivo é criar memórias digitais emocionantes baseadas em registros de diário.
        Retorne APENAS um JSON válido.
      `;

      const prompt = `
        Analise os seguintes registros de diário de um casal (${userProfile.names}):
        ${JSON.stringify(recentLogs)}
        
        Crie um texto curto (máximo 150 palavras) emocionante e inspirador que resume essa fase do relacionamento deles. 
        Destaque os momentos felizes, a gratidão e o esforço mútuo.
        O título deve ser criativo.
        
        Retorne APENAS um JSON neste formato (sem markdown):
        {
          "title": "Título da Memória",
          "content": "Texto da memória...",
          "mood": "love" 
        }
        (mood pode ser 'happy', 'reflective', ou 'love')
      `;

      const responseText = await generateAIResponse(
        prompt,
        systemInstruction,
        preferences.aiConfig
      );

      const cleanJson = responseText.replace(/```json|```/g, '').trim();

      if (cleanJson) {
        const result = JSON.parse(cleanJson);
        addMemory({
          id: Date.now().toString(),
          dateCreated: new Date().toISOString(),
          title: result.title,
          content: result.content,
          mood: result.mood,
          relatedLogIds: logs.slice(0, 10).map(l => l.id)
        });
      }

    } catch (error) {
      console.error("Erro ao gerar memória:", error);
      alert("Não foi possível conectar com a IA no momento. Verifique sua chave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-6 animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center truncate px-2">
          Cápsula do Tempo
        </h2>

      </header>

      <div className="flex flex-col items-center pt-6 pb-2 px-6 text-center">
        <h1 className="text-primary text-[22px] font-bold leading-tight tracking-[-0.015em] mb-2 capitalize">
          Hoje é {currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h1>
        <p className="text-text-muted text-base font-normal leading-normal max-w-[280px]">
          Suas memórias eternizadas pela IA.
        </p>
      </div>

      <div className="px-6 mt-6 mb-4">
        <button
          onClick={handleGenerateMemory}
          disabled={isGenerating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-primary text-white font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin material-symbols-rounded">refresh</span>
              Criando Memória...
            </>
          ) : (
            <>
              <span className="material-symbols-rounded filled">auto_awesome</span>
              Gerar Nova Memória com IA
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col flex-1 px-4 gap-4 pb-20">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 gap-4 opacity-50">
            <span className="material-symbols-rounded text-6xl text-primary/30">hourglass_disabled</span>
            <p className="text-sm font-bold text-text-muted">Nenhuma memória guardada ainda.</p>
            <p className="text-xs text-text-muted/70 max-w-[200px] text-center">Registre momentos no Diário e clique em gerar para criar memórias mágicas.</p>
          </div>
        ) : (
          memories.map(mem => (
            <div key={mem.id} className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-rounded text-6xl">{mem.mood === 'love' ? 'favorite' : mem.mood === 'happy' ? 'sentiment_very_satisfied' : 'auto_awesome'}</span>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wide mb-2 inline-block">
                {new Date(mem.dateCreated).toLocaleDateString('pt-BR')}
              </span>
              <h3 className="text-xl font-bold mb-2 relative z-10">{mem.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed relative z-10">
                "{mem.content}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};