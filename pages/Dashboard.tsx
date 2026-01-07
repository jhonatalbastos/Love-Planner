import React, { useState, useEffect, useMemo } from 'react';
import { Screen } from '../types';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

const RELATIONSHIP_TIPS = [
  "Nunca vá dormir sem resolver um desentendimento. A paz vale mais que a razão.",
  "Elogie seu parceiro em público e critique apenas em particular.",
  "Pergunte 'Como foi seu dia?' e realmente ouça a resposta.",
  "O toque físico não sexual (abraços, mãos dadas) libera oxitocina e reduz o estresse.",
  "Façam algo novo juntos pelo menos uma vez por mês para manter a chama acesa.",
  "Agradeça pelas pequenas coisas que o outro faz, como fazer café ou arrumar a cama.",
  "Em uma discussão, lembre-se: é vocês dois contra o problema, não um contra o outro."
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { stats, logs, userProfile, specialDates, agreements, goals, preferences } = useApp();
  
  // State for Month Navigation
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [dailyTip, setDailyTip] = useState('');
  
  // Photo Slideshow Logic
  const userPhotos = useMemo(() => {
    return logs
      .filter(l => l.photo && l.photo.trim().length > 0)
      .map(l => l.photo!)
      .reverse(); // Newest first
  }, [logs]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    // Select a random tip only once on mount
    const randomTip = RELATIONSHIP_TIPS[Math.floor(Math.random() * RELATIONSHIP_TIPS.length)];
    setDailyTip(randomTip);
  }, []);

  // Cycle through photos
  useEffect(() => {
    if (userPhotos.length > 1) {
        const interval = setInterval(() => {
            setCurrentPhotoIndex(prev => (prev + 1) % userPhotos.length);
        }, 5000); // Change photo every 5 seconds
        return () => clearInterval(interval);
    }
  }, [userPhotos.length]);
  
  const recentLogs = logs.slice(0, 2); 
  const xpPercent = Math.min(100, (stats.xp / stats.nextLevelXp) * 100);

  // Derived values from displayDate
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth(); // 0-indexed

  // Helper: Level Titles based on Soulmate Score
  const getLevelTitle = (score: number) => {
      if (score <= 20) return "Estranhos no Ninho";
      if (score <= 40) return "Paquera Constante";
      if (score <= 60) return "Namorados Apaixonados";
      if (score <= 80) return "Parceiros de Vida";
      return "Almas Gêmeas";
  };

  const levelTitle = getLevelTitle(stats.soulmateScore);

  // Helper to change months
  const changeMonth = (offset: number) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setDisplayDate(newDate);
    setSelectedDay(1);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);

  // Helper to construct local YYYY-MM-DD
  const getLocalDateStr = (day: number) => {
    const d = new Date(displayYear, displayMonth, day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const dayHasEvent = (day: number) => {
    const dateStr = getLocalDateStr(day);
    const hasLog = logs.some(log => log.date.startsWith(dateStr)); 
    const hasSpecial = specialDates.some(sd => sd.date === dateStr);
    const hasAgreement = agreements.some(a => a.completedDates.includes(dateStr));
    const hasGoal = goals.some(g => g.completedDates?.includes(dateStr));
    return hasLog || hasSpecial || hasAgreement || hasGoal;
  };

  const getDayEvents = () => {
    const events = [];
    const dateStr = getLocalDateStr(selectedDay);

    const dayLog = logs.find(log => log.date.startsWith(dateStr));
    if (dayLog) {
      // Build details string for Log
      let subText = `Nota: ${dayLog.rating}/10`;
      if(dayLog.partnerLoveLanguages?.length || dayLog.myLoveLanguages?.length) {
          subText += " • Linguagens do Amor registradas";
      }
      events.push({ type: 'log', title: 'Registro Diário', sub: subText, data: dayLog });
    }

    const daySpecials = specialDates.filter(sd => sd.date === dateStr);
    daySpecials.forEach(sd => {
      events.push({ type: 'date', title: sd.title, sub: sd.icon });
    });

    const dayAgreements = agreements.filter(a => a.completedDates.includes(dateStr));
    dayAgreements.forEach(a => {
        events.push({ type: 'agreement', title: a.title, sub: 'check_circle' });
    });

    const dayGoals = goals.filter(g => g.completedDates?.includes(dateStr));
    dayGoals.forEach(g => {
        events.push({ type: 'goal', title: g.title, sub: 'flag' });
    });

    return events;
  };

  const dayEvents = getDayEvents();
  const monthLabel = displayDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const currentPhoto = userPhotos.length > 0 ? userPhotos[currentPhotoIndex] : null;

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-rounded text-xl">all_inclusive</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Love Planner</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Coach Tip Section (Conditionally Rendered) */}
        {preferences.coachTips && (
            <section 
                onClick={() => onNavigate(Screen.AICoach)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 shadow-md text-white relative overflow-hidden cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <span className="material-symbols-rounded text-6xl">all_inclusive</span>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/20 p-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Dica do Mentor</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic">"{dailyTip}"</p>
                </div>
            </section>
        )}

        {/* Soulmates Score with Photo Slideshow Background */}
        <section 
          onClick={() => onNavigate(Screen.Milestones)}
          className="relative bg-card-light dark:bg-card-dark rounded-xl p-5 shadow-soft border border-primary/5 dark:border-white/5 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
          {/* Slideshow Background Layer */}
          {currentPhoto ? (
             <div className="absolute inset-0 z-0">
                 {/* Images are rendered here with transitions */}
                 {userPhotos.map((photo, index) => (
                     <img 
                        key={index}
                        src={photo}
                        alt="Background memory"
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentPhotoIndex ? 'opacity-30 blur-[2px]' : 'opacity-0'}`}
                     />
                 ))}
                 {/* Overlay to ensure text readability */}
                 <div className="absolute inset-0 bg-gradient-to-b from-card-light/90 via-card-light/80 to-card-light/90 dark:from-card-dark/90 dark:via-card-dark/80 dark:to-card-dark/90"></div>
             </div>
          ) : (
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-gray-100 dark:text-gray-800" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-primary transition-all duration-1000 ease-out" 
                  cx="50" 
                  cy="50" 
                  fill="none" 
                  r="45" 
                  stroke="currentColor" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * stats.soulmateScore / 100)} 
                  strokeLinecap="round" 
                  strokeWidth="8">
                </circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-extrabold">{stats.soulmateScore}%</span>
                <span className="text-xs font-medium text-text-muted">Nível {stats.level}</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{levelTitle}</h2>
              <p className="text-sm text-text-muted mt-1">
                Toque para ver os níveis e conquistas.
              </p>
            </div>
          </div>
        </section>

        {/* Level Progress */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-end px-1">
            <span className="text-sm font-semibold">Progresso do Nível</span>
            <span className="text-xs font-medium text-primary">{stats.xp} / {stats.nextLevelXp} XP</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-primary to-rose-400 rounded-full shadow-[0_0_10px_rgba(244,37,54,0.4)] transition-all duration-500" 
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-text-muted px-1">Faça um registro diário para ganhar +50 XP</p>
        </section>

        {/* Quick Links - UPDATED TO GRID FOR VISIBILITY */}
        <section className="grid grid-cols-3 gap-2">
           <button onClick={() => onNavigate(Screen.Journal)} className="flex flex-col items-center justify-center gap-1 p-2 h-20 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-95 transition-all hover:border-primary/20">
             <span className="material-symbols-rounded text-blue-500 text-[24px]">edit_note</span>
             <span className="text-xs font-bold text-center">Diário</span>
           </button>
           <button onClick={() => onNavigate(Screen.TimeCapsule)} className="flex flex-col items-center justify-center gap-1 p-2 h-20 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-95 transition-all hover:border-primary/20">
             <span className="material-symbols-rounded text-purple-500 text-[24px]">hourglass_top</span>
             <span className="text-xs font-bold text-center">Cápsula</span>
           </button>
           <button onClick={() => onNavigate(Screen.SpecialDates)} className="flex flex-col items-center justify-center gap-1 p-2 h-20 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-95 transition-all hover:border-primary/20">
             <span className="material-symbols-rounded text-rose-500 text-[24px]">event_upcoming</span>
             <span className="text-xs font-bold text-center">Datas</span>
           </button>
           <button onClick={() => onNavigate(Screen.AICoach)} className="flex flex-col items-center justify-center gap-1 p-2 h-20 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-95 transition-all hover:border-primary/20">
             <span className="material-symbols-rounded text-primary text-[24px]">all_inclusive</span>
             <span className="text-xs font-bold text-center">Coach</span>
           </button>
           <button onClick={() => onNavigate(Screen.Export)} className="flex flex-col items-center justify-center gap-1 p-2 h-20 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-95 transition-all hover:border-primary/20">
             <span className="material-symbols-rounded text-gray-500 text-[24px]">download</span>
             <span className="text-xs font-bold text-center">PDF</span>
           </button>
        </section>

        {/* Recent Activity (Dynamic) */}
        {recentLogs.length > 0 && (
          <section className="flex flex-col gap-2">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold">Atividade Recente</h3>
             </div>
             <div className="flex flex-col gap-3">
               {recentLogs.map(log => (
                 <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="relative size-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-primary/50 dark:bg-white/5">
                      <span className="material-symbols-rounded">favorite</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">Registro Diário</p>
                      <p className="text-xs text-text-muted truncate">Nota: {log.rating}/10</p>
                      {(log.partnerLoveLanguages?.length || 0) + (log.myLoveLanguages?.length || 0) > 0 && (
                         <div className="flex gap-1 mt-1 flex-wrap">
                            {[...(log.partnerLoveLanguages || []), ...(log.myLoveLanguages || [])].slice(0,3).map((l, i) => (
                                <span key={i} className="text-[9px] bg-pink-50 dark:bg-pink-900/20 text-pink-50 px-1.5 py-0.5 rounded">{l}</span>
                            ))}
                         </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                      +50 XP
                    </div>
                 </div>
               ))}
             </div>
          </section>
        )}

        {/* Monthly View */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Visão Mensal</h3>
            <button 
              onClick={() => onNavigate(Screen.MonthlyReview)} 
              className="text-primary text-sm font-semibold flex items-center gap-1 active:opacity-70"
            >
              Ver tudo <span className="material-symbols-rounded text-base">chevron_right</span>
            </button>
          </div>
          
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 shadow-card border border-gray-100 dark:border-gray-800">
             {/* Month Navigation */}
             <div className="flex items-center justify-between mb-4">
               <button onClick={() => changeMonth(-1)} className="p-1 text-text-muted hover:bg-black/5 rounded-full">
                 <span className="material-symbols-rounded">chevron_left</span>
               </button>
               <span className="text-sm font-bold capitalize">{monthLabel}</span>
               <button onClick={() => changeMonth(1)} className="p-1 text-text-muted hover:bg-black/5 rounded-full">
                 <span className="material-symbols-rounded">chevron_right</span>
               </button>
             </div>

             <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>
              ))}
              {/* Padding for empty days at start of month */}
              {[...Array(new Date(displayYear, displayMonth, 1).getDay())].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay;
                const hasEvent = dayHasEvent(day);
                
                let bgClass = "";
                
                // Logic: Only red if it has an event.
                if (hasEvent) {
                   bgClass = "bg-[#f43f5e] text-white font-bold shadow-md shadow-red-500/20";
                } else {
                   bgClass = "bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5";
                }

                // If selected, add a ring/border indication
                if (isSelected) {
                   bgClass += " ring-2 ring-primary ring-offset-2 dark:ring-offset-card-dark";
                   if (!hasEvent) bgClass += " text-primary font-bold";
                }
                
                return (
                  <button 
                    key={day} 
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] transition-all active:scale-95 ${bgClass}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Details */}
            {dayEvents.length > 0 ? (
               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
                 <p className="text-xs font-bold text-text-muted uppercase mb-1">{selectedDay} de {displayDate.toLocaleString('pt-BR', { month: 'long' })}</p>
                 {dayEvents.map((ev, i) => (
                   <div key={i} className="flex flex-col gap-1 bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                     <div className="flex items-center gap-2 text-sm">
                        <span className={`flex items-center justify-center size-6 rounded-full text-[14px] text-white ${ev.type === 'log' ? 'bg-primary' : ev.type === 'agreement' ? 'bg-blue-500' : ev.type === 'goal' ? 'bg-orange-500' : 'bg-purple-500'}`}>
                            <span className="material-symbols-rounded text-[14px]">{ev.type === 'log' ? 'edit' : ev.sub}</span>
                        </span>
                        <div className="flex flex-col leading-tight">
                            <span className="font-medium">{ev.title}</span>
                            {ev.type === 'agreement' && <span className="text-[10px] text-gray-400">Acordo cumprido</span>}
                            {ev.type === 'goal' && <span className="text-[10px] text-gray-400">Meta atingida</span>}
                        </div>
                        <span className="text-xs text-text-muted ml-auto">{ev.type === 'log' ? `Nota: ${(ev.data as any).rating}/10` : ''}</span>
                     </div>
                     
                     {/* Extended info for Log */}
                     {ev.type === 'log' && (ev.data as any) && (
                         <div className="pl-8 flex flex-col gap-1 mt-1">
                             <div className="flex gap-2">
                                 {!!(ev.data as any).intimacy && <span className="text-[10px] text-pink-500 bg-pink-50 px-1.5 rounded">Intimidade</span>}
                                 {!!(ev.data as any).conflict && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 rounded">Discussão</span>}
                             </div>
                             {((ev.data as any).partnerLoveLanguages?.length || 0) + ((ev.data as any).myLoveLanguages?.length || 0) > 0 && (
                                 <div className="text-[10px] text-gray-400">
                                     <span className="font-bold">Linguagens do Amor:</span> {
                                         [...((ev.data as any).partnerLoveLanguages || []), ...((ev.data as any).myLoveLanguages || [])].join(', ')
                                     }
                                 </div>
                             )}
                         </div>
                     )}
                   </div>
                 ))}
               </div>
            ) : (
               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 text-center">
                 <p className="text-xs text-text-muted">Nenhum evento registrado para o dia {selectedDay}.</p>
               </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};