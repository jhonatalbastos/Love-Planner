import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { sendNotification } from '../lib/notifications';


interface DailyLogProps {
  onSaved?: () => void;
}

const LOVE_LANGUAGES = [
  { label: 'Palavras', icon: 'chat', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Tempo', icon: 'schedule', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: 'Presentes', icon: 'card_giftcard', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { label: 'Serviço', icon: 'cleaning_services', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { label: 'Toque', icon: 'favorite', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' }
];

export const DailyLog: React.FC<DailyLogProps> = ({ onSaved }) => {
  const { addLog, preferences, logs, toggleLogLock, userProfile, agreements, toggleAgreement, goals, toggleGoal, incrementGoal } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  // State from Log
  const [rating, setRating] = useState(8);
  const [summary, setSummary] = useState('');
  const [gratitude, setGratitude] = useState('');

  const [selectedPartnerActions, setSelectedPartnerActions] = useState<string[]>([]);
  const [selectedMyActions, setSelectedMyActions] = useState<string[]>([]);

  const [partnerLoveLanguages, setPartnerLoveLanguages] = useState<string[]>([]);
  const [myLoveLanguages, setMyLoveLanguages] = useState<string[]>([]);

  const [hasIntimacy, setHasIntimacy] = useState<boolean | null>(null);
  const [noIntimacyReason, setNoIntimacyReason] = useState<string>('');

  const [hasConflict, setHasConflict] = useState<boolean | null>(null);
  const [discussionReason, setDiscussionReason] = useState<string>('');

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse names
  const getNames = () => {
    const names = userProfile.names.split(/&| e /).map(s => s.trim());
    return {
      partnerName: names[0] || 'Parceiro 1',
      myName: names[1] || 'Parceiro 2'
    };
  };
  const { partnerName, myName } = getNames();

  // --- Date Helpers ---
  const toLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = toLocalDateStr(currentDate);
  const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // --- Agreements Logic (Strict Schedule Mode) ---
  const activeAgreements = agreements.filter(a => {
    if (a.startDate && selectedDateStr < a.startDate) return false;
    if (a.endDate && selectedDateStr > a.endDate) return false;
    if (a.skippedDates.includes(selectedDateStr)) return false;

    if (a.tag === 'Semanal') {
      const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const agreementTimeNorm = normalizeStr(a.timeInfo);
      const hasDayConstraint = days.some(d => agreementTimeNorm.includes(d));

      if (hasDayConstraint) {
        const selectedDayName = normalizeStr(currentDate.toLocaleDateString('pt-BR', { weekday: 'long' }));
        const todayKey = selectedDayName.split('-')[0];
        if (!agreementTimeNorm.includes(todayKey)) return false;
      }
    }

    if (a.tag === 'Mensal') {
      const match = a.timeInfo.match(/\d+/);
      if (match) {
        const scheduledDay = parseInt(match[0], 10);
        if (currentDate.getDate() !== scheduledDay) return false;
      }
    }

    return true;
  });

  const sortedAgreements = [...activeAgreements].sort((a, b) => {
    const aCompleted = a.completedDates.includes(selectedDateStr);
    const bCompleted = b.completedDates.includes(selectedDateStr);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });

  // --- Goals Logic ---
  const activeGoals = goals.filter(g => {
    if (g.startDate && selectedDateStr < g.startDate) return false;
    if (g.endDate && selectedDateStr > g.endDate) return false;
    return true;
  });

  // Load log data when date changes
  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date.startsWith(dateStr));

    if (existingLog) {
      setRating(existingLog.rating);
      setSummary(existingLog.summary);
      setGratitude(existingLog.gratitude);
      setSelectedPartnerActions(existingLog.partnerActions);
      setSelectedMyActions(existingLog.myActions);
      setPartnerLoveLanguages(existingLog.partnerLoveLanguages || []);
      setMyLoveLanguages(existingLog.myLoveLanguages || []);
      setHasIntimacy(existingLog.intimacy !== undefined ? existingLog.intimacy : null);
      setNoIntimacyReason(existingLog.noIntimacyReason || '');
      setHasConflict(existingLog.conflict !== undefined ? existingLog.conflict : null);
      setDiscussionReason(existingLog.discussionReason || '');
      setPhoto(existingLog.photo);
      setIsLocked(!!existingLog.isLocked);
    } else {
      // Reset defaults
      setRating(8);
      setSummary('');
      setGratitude('');
      setSelectedPartnerActions([]);
      setSelectedMyActions([]);
      setPartnerLoveLanguages([]);
      setMyLoveLanguages([]);
      setHasIntimacy(null);
      setNoIntimacyReason('');
      setHasConflict(null);
      setDiscussionReason('');
      setPhoto(undefined);
      setIsLocked(false);
    }
  }, [currentDate, logs]);

  // --- Auto-Save Effect ---
  useEffect(() => {
    if (isLocked) return;

    // Debounce save operation to avoid excessive context updates
    const timer = setTimeout(() => {
      setIsSaving(true);
      addLog({
        date: currentDate.toISOString(),
        rating,
        partnerActions: selectedPartnerActions,
        myActions: selectedMyActions,
        partnerLoveLanguages,
        myLoveLanguages,
        conflict: hasConflict === true,
        discussionReason: hasConflict === true ? discussionReason : undefined,
        intimacy: hasIntimacy === true,
        noIntimacyReason: hasIntimacy === false ? noIntimacyReason : undefined,
        summary,
        gratitude,
        photo
      });

      // Short delay to show saving feedback if we wanted to
      setTimeout(() => setIsSaving(false), 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    rating, summary, gratitude, selectedPartnerActions, selectedMyActions,
    partnerLoveLanguages, myLoveLanguages, hasIntimacy, noIntimacyReason,
    hasConflict, discussionReason, photo, currentDate, isLocked
    // Note: addLog is excluded to prevent infinite loops since it changes on render in current context impl
  ]);

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const togglePartnerAction = (action: string) => {
    if (isLocked) return;
    setSelectedPartnerActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const toggleMyAction = (action: string) => {
    if (isLocked) return;
    setSelectedMyActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const togglePartnerLoveLanguage = (lang: string) => {
    if (isLocked) return;
    setPartnerLoveLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleMyLoveLanguage = (lang: string) => {
    if (isLocked) return;
    setMyLoveLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleLock = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date.startsWith(dateStr));

    if (existingLog) {
      toggleLogLock(dateStr);
    } else {
      // If no log exists yet, save it first as locked
      addLog({
        date: currentDate.toISOString(),
        rating,
        partnerActions: selectedPartnerActions,
        myActions: selectedMyActions,
        partnerLoveLanguages,
        myLoveLanguages,
        conflict: hasConflict === true,
        discussionReason: hasConflict === true ? discussionReason : undefined,
        intimacy: hasIntimacy === true,
        noIntimacyReason: hasIntimacy === false ? noIntimacyReason : undefined,
        summary,
        gratitude,
        photo,
        isLocked: true
      });
    }
  };

  const handleSaveAndLock = async () => {
    addLog({
      date: currentDate.toISOString(),
      rating,
      partnerActions: selectedPartnerActions,
      myActions: selectedMyActions,
      partnerLoveLanguages,
      myLoveLanguages,
      conflict: hasConflict === true,
      discussionReason: hasConflict === true ? discussionReason : undefined,
      intimacy: hasIntimacy === true,
      noIntimacyReason: hasIntimacy === false ? noIntimacyReason : undefined,
      summary,
      gratitude,
      photo,
      isLocked: true
    });

    // Notify Partner
    if (userProfile.partnerId) {
      await sendNotification(
        [userProfile.partnerId],
        "Diário do Amor",
        `${myName} acabou de preencher o diário de hoje! 💕`
      );
    }

    // Optional: could scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Date Formatting
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const dayNumber = currentDate.getDate();
  const monthShort = currentDate.toLocaleString('pt-BR', { month: 'short' });
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col pb-24 animate-[fadeIn_0.3s_ease-out] bg-background-light dark:bg-background-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 justify-between border-b border-border-light dark:border-border-dark">
        {/* Logo */}
        <div className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-rounded text-xl">all_inclusive</span>
        </div>

        {/* Title & Spinner */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Registrar Dia</h2>
          {isSaving && <span className="material-symbols-rounded text-primary animate-spin text-sm">sync</span>}
        </div>

        {/* Lock Button */}
        <div className="flex items-center gap-1 justify-end size-10">
          <button
            onClick={handleToggleLock}
            className={`flex size-10 items-center justify-center rounded-full active:scale-95 transition-all ${isLocked ? 'text-primary bg-primary/10' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <span className="material-symbols-rounded">{isLocked ? 'lock' : 'lock_open'}</span>
          </button>
        </div>
      </header>

      {/* Date Selector */}
      <div className="flex flex-col items-center pt-2 pb-2">
        <div className="flex items-center justify-between w-full px-6 mb-4 mt-2 select-none">
          <button
            onClick={() => changeDate(-1)}
            className="p-3 -m-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-muted active:scale-90 transition-transform cursor-pointer"
            aria-label="Dia anterior"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <div className="text-center">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-0.5 capitalize">{monthName} {currentDate.getFullYear()}</p>
            <div className="flex items-center gap-1 justify-center">
              <span className="material-symbols-rounded text-[18px]">calendar_month</span>
              <p className="text-lg font-bold capitalize">{isToday ? 'Hoje' : new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(currentDate)}, {dayNumber} {monthShort}</p>
            </div>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-3 -m-2 rounded-full transition-transform cursor-pointer ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-muted active:scale-90'}`}
            aria-label="Próximo dia"
          >
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-border-light dark:via-border-dark to-transparent my-2 opacity-60"></div>

      {isLocked && (
        <div className="px-4 mb-4">
          <div className="w-full p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-center gap-2 text-red-500 text-sm font-bold">
            <span className="material-symbols-rounded">lock</span>
            Dia trancado. Destranque para editar.
          </div>
        </div>
      )}

      <main className={`flex flex-col gap-8 px-4 py-2 ${isLocked ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
        {/* Mood Rating */}
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between px-1">
            <h3 className="text-lg font-bold tracking-tight">Nota do dia</h3>
            <span className="text-2xl animate-bounce">
              {rating >= 8 ? '😍' : rating >= 5 ? '🙂' : '😔'}
            </span>
          </div>
          <div className="bg-card-light dark:bg-card-dark p-6 pt-10 rounded-3xl border border-border-light dark:border-border-dark shadow-soft relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none overflow-hidden"></div>
            <div className="flex flex-col gap-6 relative z-10">
              <div className="relative h-10 w-full flex items-center select-none cursor-pointer">
                <div className="absolute w-full h-3 bg-border-light/50 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${rating * 10}%` }}></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={rating}
                  disabled={isLocked}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-10"
                  style={{ left: `${rating * 10}%`, transform: `translate(-50%, -50%)` }}
                >
                  <div className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-card-dark border-[3px] border-primary rounded-full shadow-lg">
                    <span className="material-symbols-rounded text-primary text-[20px]">favorite</span>
                  </div>
                  <div className="absolute -top-10 bg-text-main dark:bg-white text-white dark:text-text-main text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md">
                    {rating}/10
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
                <span>Difícil</span>
                <span>Incrível</span>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Goals Section */}
        {activeGoals.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-bold">Metas Semanais</h3>
            </div>
            <div className="flex flex-col gap-2">
              {activeGoals.map(goal => {
                // Check logic for 'check' type
                const isCheckedToday = (goal.completedDates || []).includes(selectedDateStr);

                // Count logic for 'count' type
                const timesDoneToday = (goal.history || []).filter(d => d === selectedDateStr).length;

                // Determine if we should show it as "Done" stylistically
                const isVisuallyDone = goal.type === 'check' ? isCheckedToday : (timesDoneToday > 0);
                const isGoalFullyMet = goal.type === 'count' && goal.completed; // Weekly target met

                return (
                  <div key={goal.id} className="flex items-center gap-3 bg-white dark:bg-card-dark p-3 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm transition-all">
                    <button
                      onClick={() => {
                        if (isLocked) return;
                        if (goal.type === 'check') {
                          toggleGoal(goal.id, selectedDateStr);
                        } else {
                          incrementGoal(goal.id, selectedDateStr);
                        }
                      }}
                      disabled={isLocked}
                      className={`flex items-center justify-center rounded-lg shrink-0 size-8 border-2 transition-all duration-200 active:scale-95 ${isVisuallyDone
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-transparent border-gray-300 dark:border-gray-500 text-gray-400 hover:border-orange-500/50'
                        }`}
                    >
                      {goal.type === 'check' ? (
                        <span className={`material-symbols-rounded text-[20px] font-bold ${isVisuallyDone ? 'opacity-100' : 'opacity-0'}`}>check</span>
                      ) : (
                        <span className="material-symbols-rounded text-[20px] font-bold">add</span>
                      )}
                    </button>
                    <div className={`flex-1 min-w-0 ${isVisuallyDone && goal.type === 'check' ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{goal.title}</p>
                        {goal.type === 'count' && isGoalFullyMet && (
                          <span className="text-[9px] bg-green-100 text-green-600 px-1.5 rounded-md font-bold uppercase">Concluída</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="material-symbols-rounded text-[14px]">{goal.icon}</span>
                        {goal.type === 'count' ? (
                          <span>Feito hoje: {timesDoneToday} vez(es)</span>
                        ) : (
                          <span>Meta Semanal</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Agreements Section */}
        {sortedAgreements.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-bold">Acordos do Dia</h3>
            </div>
            <div className="flex flex-col gap-2">
              {sortedAgreements.map(agreement => {
                const isCompleted = agreement.completedDates.includes(selectedDateStr);
                return (
                  <div key={agreement.id} className="flex items-center gap-3 bg-white dark:bg-card-dark p-3 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm transition-all">
                    <button
                      onClick={() => !isLocked && toggleAgreement(agreement.id, selectedDateStr)}
                      disabled={isLocked}
                      className={`flex items-center justify-center rounded-full shrink-0 size-6 border-2 transition-all duration-200 ${isCompleted
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-transparent border-gray-300 dark:border-gray-500 text-transparent'
                        }`}
                    >
                      <span className="material-symbols-rounded text-[16px] font-bold">check</span>
                    </button>
                    <div className={`flex-1 min-w-0 ${isCompleted ? 'opacity-50 line-through' : ''}`}>
                      <p className="text-sm font-bold truncate">{agreement.title}</p>
                      {agreement.timeInfo !== 'Geral' && <p className="text-xs text-text-muted">{agreement.timeInfo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Partner Actions & Love Language */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            <h3 className="text-lg font-bold">Ações de {partnerName}</h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {preferences.partnerActionOptions.map(option => (
              <button
                key={option.label}
                onClick={() => togglePartnerAction(option.label)}
                disabled={isLocked}
                className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl transition-all active:scale-95 border ${selectedPartnerActions.includes(option.label)
                  ? 'bg-primary text-white shadow-soft border-primary'
                  : 'bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark shadow-sm hover:border-primary/50'
                  }`}
              >
                <span className={`material-symbols-rounded text-[20px] ${selectedPartnerActions.includes(option.label) ? 'text-white' : 'text-text-muted opacity-70'}`}>
                  {option.icon}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
            <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Linguagem do Amor Usada</h4>
            <div className="grid grid-cols-5 gap-1">
              {LOVE_LANGUAGES.map(lang => (
                <button
                  key={lang.label}
                  onClick={() => togglePartnerLoveLanguage(lang.label)}
                  disabled={isLocked}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all w-full ${partnerLoveLanguages.includes(lang.label)
                    ? `bg-white dark:bg-card-dark shadow-sm border border-primary/20 ${lang.color}`
                    : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                >
                  <div className={`p-1.5 rounded-full mb-1 ${partnerLoveLanguages.includes(lang.label) ? lang.bg : 'bg-gray-200 dark:bg-white/10'}`}>
                    <span className="material-symbols-rounded text-[16px]">{lang.icon}</span>
                  </div>
                  <span className="text-[9px] font-bold leading-tight">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* My Actions & Love Language */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            <h3 className="text-lg font-bold">Ações de {myName}</h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {preferences.myActionOptions.map(option => (
              <button
                key={option.label}
                onClick={() => toggleMyAction(option.label)}
                disabled={isLocked}
                className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl transition-all active:scale-95 border ${selectedMyActions.includes(option.label)
                  ? 'bg-primary text-white shadow-soft border-primary'
                  : 'bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark shadow-sm hover:border-primary/50'
                  }`}
              >
                <span className={`material-symbols-rounded text-[20px] ${selectedMyActions.includes(option.label) ? 'text-white' : 'text-text-muted opacity-70'}`}>
                  {option.icon}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
            <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Linguagem do Amor Usada</h4>
            <div className="grid grid-cols-5 gap-1">
              {LOVE_LANGUAGES.map(lang => (
                <button
                  key={lang.label}
                  onClick={() => toggleMyLoveLanguage(lang.label)}
                  disabled={isLocked}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all w-full ${myLoveLanguages.includes(lang.label)
                    ? `bg-white dark:bg-card-dark shadow-sm border border-primary/20 ${lang.color}`
                    : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                >
                  <div className={`p-1.5 rounded-full mb-1 ${myLoveLanguages.includes(lang.label) ? lang.bg : 'bg-gray-200 dark:bg-white/10'}`}>
                    <span className="material-symbols-rounded text-[16px]">{lang.icon}</span>
                  </div>
                  <span className="text-[9px] font-bold leading-tight">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Couple Dynamics (Sex & Conflict) */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            <h3 className="text-lg font-bold">Dinâmica do Casal</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sex Toggle */}
            <div className="flex flex-col gap-2 bg-card-light dark:bg-card-dark p-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <span className="text-xs font-bold text-text-muted uppercase text-center">Teve Amor?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setHasIntimacy(true)}
                  disabled={isLocked}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${hasIntimacy === true ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <span className="material-symbols-rounded">favorite</span> Sim
                </button>
                <button
                  onClick={() => setHasIntimacy(false)}
                  disabled={isLocked}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${hasIntimacy === false ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <span className="material-symbols-rounded">ac_unit</span> Não
                </button>
              </div>
            </div>

            {/* Conflict Toggle */}
            <div className="flex flex-col gap-2 bg-card-light dark:bg-card-dark p-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <span className="text-xs font-bold text-text-muted uppercase text-center">Teve Discussão?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setHasConflict(true)}
                  disabled={isLocked}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${hasConflict === true ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <span className="material-symbols-rounded">warning</span> Sim
                </button>
                <button
                  onClick={() => setHasConflict(false)}
                  disabled={isLocked}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${hasConflict === false ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <span className="material-symbols-rounded">sentiment_satisfied</span> Não
                </button>
              </div>
            </div>
          </div>

          {/* Reasons - No Sex */}
          {hasIntimacy === false && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300">
                <span className="material-symbols-rounded text-[20px]">psychology_alt</span>
                <p className="text-sm font-bold uppercase tracking-wide">Motivo da falta de intimidade</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.intimacyReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setNoIntimacyReason(reason)}
                    disabled={isLocked}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${noIntimacyReason === reason
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-background-dark border-blue-100 dark:border-blue-800 text-text-muted hover:border-blue-300'
                      }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reasons - Conflict */}
          {hasConflict === true && (
            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-2 mb-3 text-red-700 dark:text-red-300">
                <span className="material-symbols-rounded text-[20px]">warning</span>
                <p className="text-sm font-bold uppercase tracking-wide">Motivo da Discussão</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.conflictReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setDiscussionReason(reason)}
                    disabled={isLocked}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${discussionReason === reason
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-background-dark border-red-100 dark:border-red-800 text-text-muted hover:border-red-300'
                      }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Inputs & Photo */}
        <section className="flex flex-col gap-6 mt-2">

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold flex items-center gap-2 pl-1">
              <div className="p-1 bg-primary-soft dark:bg-primary/20 rounded-md">
                <span className="material-symbols-rounded text-primary text-[18px]">image</span>
              </div>
              Foto do Dia
            </label>
            <div
              onClick={() => !isLocked && fileInputRef.current?.click()}
              className={`relative w-full h-40 rounded-2xl bg-card-light dark:bg-card-dark border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary/50 group ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                className="hidden"
                accept="image/*"
                disabled={isLocked}
              />
              {photo ? (
                <img src={photo} alt="Daily memory" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-primary transition-colors">
                  <span className="material-symbols-rounded text-3xl">add_a_photo</span>
                  <span className="text-xs font-bold">Toque para adicionar foto</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold flex items-center gap-2 pl-1">
              <div className="p-1 bg-primary-soft dark:bg-primary/20 rounded-md">
                <span className="material-symbols-rounded text-primary text-[18px]">edit_note</span>
              </div>
              Resumo do Dia
            </label>
            <textarea
              value={summary}
              disabled={isLocked}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-32 p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-base placeholder:text-text-muted/40 shadow-sm transition-all"
              placeholder="Como vocês se sentiram hoje? O que marcou o dia?"
            ></textarea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold flex items-center gap-2 pl-1">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                <span className="material-symbols-rounded text-yellow-600 dark:text-yellow-400 text-[18px]">hotel_class</span>
              </div>
              Mural de Gratidão
            </label>
            <div className="relative">
              <textarea
                value={gratitude}
                disabled={isLocked}
                onChange={(e) => setGratitude(e.target.value)}
                className="w-full h-28 p-4 pl-11 rounded-2xl bg-gradient-to-br from-white to-primary-soft/20 dark:from-card-dark dark:to-primary/5 border border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-base placeholder:text-text-muted/40 shadow-sm transition-all"
                placeholder="Uma coisa pela qual sou grato hoje..."
              ></textarea>
              <span className="material-symbols-rounded absolute left-3.5 top-4 text-primary/30 text-[20px]">format_quote</span>
            </div>
          </div>
        </section>


        {/* Save and Lock Button */}
        {!isLocked && (
          <section className="mt-2 text-center pb-4">
            <button
              onClick={handleSaveAndLock}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-rounded">lock</span>
              Salvar e Trancar o Dia
            </button>
            <p className="text-xs text-text-muted mt-3 opacity-60">
              Isso salva suas respostas e previne edições acidentais.<br />
              Você pode destrancar no ícone de cadeado no topo.
            </p>
          </section>
        )}
      </main>
    </div >
  );
};