import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Screen, Achievement, UserStats, LogEntry } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

const LEVELS = [
    { range: '0-20%', title: 'Estranhos no Ninho', desc: 'O começo de tudo. Vocês estão se conhecendo.' },
    { range: '21-40%', title: 'Paquera Constante', desc: 'A chama está acesa e o interesse é mútuo.' },
    { range: '41-60%', title: 'Namorados Apaixonados', desc: 'Laços fortes e muitos momentos felizes.' },
    { range: '61-80%', title: 'Parceiros de Vida', desc: 'Confiança, respeito e planos para o futuro.' },
    { range: '81-100%', title: 'Almas Gêmeas', desc: 'Conexão perfeita. Vocês são um só coração.' }
];

const ACHIEVEMENTS_LIST: Achievement[] = [
    {
        id: 'first_step',
        title: 'Primeiro Passo',
        description: 'Faça o primeiro registro no diário.',
        icon: 'footprint',
        condition: (stats, logs) => logs.length >= 1
    },
    {
        id: 'streak_7',
        title: 'Semana de Ouro',
        description: '7 registros no total.',
        icon: 'calendar_view_week',
        condition: (stats, logs) => logs.length >= 7
    },
    {
        id: 'streak_30',
        title: 'Mês Completo',
        description: '30 registros no total.',
        icon: 'calendar_month',
        condition: (stats, logs) => logs.length >= 30
    },
    {
        id: 'level_5',
        title: 'Subindo de Nível',
        description: 'Alcance o Nível 5.',
        icon: 'military_tech',
        condition: (stats) => stats.level >= 5
    },
    {
        id: 'level_10',
        title: 'Veteranos',
        description: 'Alcance o Nível 10.',
        icon: 'workspace_premium',
        condition: (stats) => stats.level >= 10
    },
    {
        id: 'love_birds',
        title: 'Pombinhos',
        description: 'Registre 10 momentos de intimidade.',
        icon: 'favorite',
        condition: (stats, logs) => logs.filter(l => l.intimacy).length >= 10
    },
    {
        id: 'peace_maker',
        title: 'Paz e Amor',
        description: '5 registros seguidos sem discussão.',
        icon: 'handshake',
        condition: (stats, logs) => {
            if (logs.length < 5) return false;
            // Check last 5 logs for conflict
            return !logs.slice(0, 5).some(l => l.conflict);
        }
    },
     {
        id: 'soulmate_master',
        title: 'Sintonia Pura',
        description: 'Atinja 90% no Score de Almas Gêmeas.',
        icon: 'volunteer_activism',
        condition: (stats) => stats.soulmateScore >= 90
    }
];

export const Milestones: React.FC<Props> = ({ onNavigate }) => {
  const { stats, logs } = useApp();
  const [showLevelModal, setShowLevelModal] = useState(false);

  const getLevelTitle = (score: number) => {
      if (score <= 20) return "Estranhos no Ninho";
      if (score <= 40) return "Paquera Constante";
      if (score <= 60) return "Namorados Apaixonados";
      if (score <= 80) return "Parceiros de Vida";
      return "Almas Gêmeas";
  };
  const currentLevelTitle = getLevelTitle(stats.soulmateScore);

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-light dark:bg-background-dark pb-6 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2 border-b border-primary/5 dark:border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => onNavigate(Screen.Dashboard)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Nossos Marcos</h1>
          <button 
            onClick={() => onNavigate(Screen.Settings)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-rounded text-2xl">settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6">
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white dark:bg-card-dark p-4 shadow-soft border border-pink-100 dark:border-white/5">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary mb-1">
              <span className="material-symbols-rounded text-xl">calendar_today</span>
            </div>
            <p className="text-3xl font-extrabold leading-tight">{stats.daysTogether}</p>
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Dias Juntos</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white dark:bg-card-dark p-4 shadow-soft border border-pink-100 dark:border-white/5">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary mb-1">
              <span className="material-symbols-rounded text-xl">favorite</span>
            </div>
            <p className="text-3xl font-extrabold leading-tight">Nível {stats.level}</p>
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Nível do Casal</p>
          </div>
        </section>

        {/* Level Progression */}
        <section 
            onClick={() => setShowLevelModal(true)}
            className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-soft border border-pink-100 dark:border-white/5 cursor-pointer hover:border-primary/30 transition-colors group"
        >
          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
                <span className="text-xs text-text-muted uppercase font-bold">Título Atual</span>
                <p className="text-base font-bold text-primary group-hover:underline">{currentLevelTitle}</p>
            </div>
            <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded-full">
              {stats.soulmateScore}% Score
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out shadow-glow" 
              style={{width: `${stats.soulmateScore}%`}}
            ></div>
          </div>
          <p className="text-text-muted text-[10px] mt-2 text-right">Toque para ver a tabela de níveis</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold px-1">Conquistas</h2>
          
          <div className="grid gap-3">
              {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = ach.condition(stats, logs);
                  return (
                    <div 
                        key={ach.id} 
                        className={`group relative flex items-center gap-4 rounded-xl p-4 border transition-all ${
                            unlocked 
                            ? 'bg-gradient-to-br from-white to-orange-50 dark:from-card-dark dark:to-white/5 border-orange-100 dark:border-white/10 shadow-sm' 
                            : 'bg-gray-50 dark:bg-white/5 border-transparent opacity-60 grayscale'
                        }`}
                    >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
                            unlocked ? 'bg-orange-100 text-orange-500 dark:bg-orange-500/20' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                        }`}>
                            <span className="material-symbols-rounded">{ach.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold truncate ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{ach.title}</h3>
                                {unlocked && <span className="material-symbols-rounded text-green-500 text-[18px]">check_circle</span>}
                            </div>
                            <p className="text-xs text-text-muted dark:text-gray-400">{ach.description}</p>
                        </div>
                    </div>
                  );
              })}
          </div>
        </section>
      </main>

      {/* Levels Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowLevelModal(false)}>
          <div className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-center flex-1">Níveis de Conexão</h3>
                 <button onClick={() => setShowLevelModal(false)} className="text-gray-400"><span className="material-symbols-rounded">close</span></button>
             </div>
             
             <div className="space-y-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-white/10"></div>
                {LEVELS.map((lvl, i) => {
                    const isActive = currentLevelTitle === lvl.title;
                    return (
                        <div key={i} className={`relative flex gap-4 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                            <div className={`size-10 shrink-0 rounded-full flex items-center justify-center border-4 z-10 ${isActive ? 'bg-primary border-primary/30 text-white shadow-lg' : 'bg-white dark:bg-card-dark border-gray-200 dark:border-white/10 text-gray-400'}`}>
                                <span className="text-[10px] font-bold">{lvl.range.split('-')[1]}</span>
                            </div>
                            <div className={`flex-1 p-3 rounded-xl border ${isActive ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                                <h4 className={`font-bold text-sm ${isActive ? 'text-primary' : ''}`}>{lvl.title}</h4>
                                <p className="text-xs text-text-muted mt-1">{lvl.desc}</p>
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};