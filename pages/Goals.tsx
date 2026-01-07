import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Goal } from '../types';

const ICON_SUGGESTIONS = [
  'favorite', 'event_available', 'phonelink_off', 'fitness_center',
  'restaurant', 'movie', 'flight', 'savings', 'home',
  'pets', 'spa', 'local_cafe', 'hiking', 'bedtime', 'book'
];

export const Goals: React.FC = () => {
  const { goals, toggleGoal, incrementGoal, addGoal, updateGoal, deleteGoal } = useApp();

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTarget, setFormTarget] = useState(1);
  const [formIcon, setFormIcon] = useState('favorite');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [noSpecificDate, setNoSpecificDate] = useState(true);

  // Menu State for Goals
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Helper to format local date string YYYY-MM-DD
  const toLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to get week days
  const getWeekDays = (date: Date) => {
    const days = [];
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();

    for (let i = 0; i < 7; i++) {
      const next = new Date(curr);
      next.setDate(first + i);
      days.push({
        d: next.getDate().toString().padStart(2, '0'),
        w: next.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        fullDate: next
      });
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const selectedDateObj = weekDays[selectedDayIndex].fullDate;
  // Use local date string comparison to avoid timezone issues
  const selectedDateStr = toLocalDateStr(selectedDateObj);

  // Calculate Week Range for filtering
  const weekStart = weekDays[0].fullDate;
  const weekEnd = weekDays[6].fullDate;
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  const filteredGoals = goals.filter(goal => {
    // If no dates are set, show always
    if (!goal.startDate && !goal.endDate) return true;

    // Check Date Range
    if (goal.startDate && selectedDateStr < goal.startDate) return false;
    if (goal.endDate && selectedDateStr > goal.endDate) return false;

    return true;
  });

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      setCurrentDate(newDate);
      setSelectedDayIndex(newDate.getDay());
    }
  };

  const formatWeekRange = () => {
    const start = weekDays[0].fullDate;
    const end = weekDays[6].fullDate;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('pt-BR', options)} - ${end.toLocaleDateString('pt-BR', options)}`;
  };

  // CRUD Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormTarget(1);
    setFormIcon('favorite');
    setFormStartDate('');
    setFormEndDate('');
    setNoSpecificDate(true);
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setFormTitle(goal.title);
    setFormDesc(goal.description);
    setFormTarget(goal.target);
    setFormIcon(goal.icon);
    setFormStartDate(goal.startDate || '');
    setFormEndDate(goal.endDate || '');
    setNoSpecificDate(!goal.startDate && !goal.endDate);
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoal(id);
    }
    setMenuOpenId(null);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;

    const goalData = {
      title: formTitle,
      description: formDesc,
      target: formTarget,
      icon: formIcon,
      type: 'count' as const,
      startDate: noSpecificDate ? undefined : formStartDate,
      endDate: noSpecificDate ? undefined : formEndDate,
    };

    if (editingId) {
      const existing = goals.find(g => g.id === editingId);
      if (existing) {
        updateGoal({ ...existing, ...goalData });
      }
    } else {
      addGoal(goalData);
    }
    setShowModal(false);
  };

  // Compute Weekly Progress
  const getWeekStats = (goal: Goal) => {
    if (goal.type === 'check') {
      // For check goals, if it's done anytime this week, it's done for the week view
      const isDoneInWeek = (goal.completedDates || []).some(d => {
        const dObj = new Date(d + 'T12:00:00');
        return dObj >= weekStart && dObj <= weekEnd;
      });
      return { current: isDoneInWeek ? goal.target : 0, completed: isDoneInWeek };
    } else {
      // For count goals, calculate number of increments in history that fall in this week
      const countInWeek = (goal.history || []).filter(d => {
        const dObj = new Date(d + 'T12:00:00');
        return dObj >= weekStart && dObj <= weekEnd;
      }).length;

      // Fallback for legacy data (if history is missing but current exists globally)
      // This prevents data loss appearance for old goals, though they won't reset correctly until new history is added.
      // If history is empty but current > 0, we might show current? 
      // No, better to stick to weekly logic. If history empty, it's 0 for this week.

      return { current: countInWeek, completed: countInWeek >= goal.target };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-48 animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-rounded text-xl">all_inclusive</span>
        </div>

        <h1 className="text-lg font-bold leading-tight tracking-tight text-center flex-1">
          Planejamento
          <span className="block text-[10px] font-normal text-text-muted opacity-80 mt-0.5">Área Individual de Crescimento</span>
        </h1>

        <div className="flex items-center gap-1 justify-end size-10">
          <div className="relative">
            <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-primary active:bg-primary/10">
              <span className="material-symbols-rounded text-[24px]">calendar_month</span>
            </button>
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleDateSelect}
            />
          </div>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <button onClick={() => changeWeek(-1)} className="p-2 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
          <span className="material-symbols-rounded">chevron_left</span>
        </button>
        <span className="text-sm font-bold uppercase tracking-wider">{formatWeekRange()}</span>
        <button onClick={() => changeWeek(1)} className="p-2 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      <div className="pt-2 pb-2">
        <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar snap-x scroll-pl-4">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDayIndex(i)}
              className={`snap-start flex flex-col items-center gap-1 min-w-[3.5rem] p-2 rounded-xl transition-all ${i === selectedDayIndex
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'
                }`}
            >
              <span className={`text-xs font-medium uppercase ${i === selectedDayIndex ? 'opacity-90' : 'text-text-muted'}`}>{day.w}</span>
              <span className="text-base font-bold">{day.d}</span>
              {i === selectedDayIndex && <div className="size-1 rounded-full bg-white mt-0.5"></div>}
            </button>
          ))}
          <div className="min-w-[1rem] snap-start"></div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent my-2"></div>

      <div className="p-4 space-y-6">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Metas Semanais</h2>
            <p className="text-sm text-text-muted mt-1">
              {weekDays[selectedDayIndex].w}, {weekDays[selectedDayIndex].d}
            </p>
          </div>
          <div className="bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full text-xs font-medium text-primary border border-primary/20">
            Semana {Math.ceil((currentDate.getDate() - 1 - currentDate.getDay()) / 7) + 1}
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <span className="material-symbols-rounded text-4xl mb-2">event_busy</span>
            <p className="text-sm">Nenhuma meta ativa para esta data.</p>
          </div>
        ) : (
          filteredGoals.map(goal => {
            // Computed state for this specific week
            const { current, completed } = getWeekStats(goal);

            return (
              <div key={goal.id} className="relative overflow-visible rounded-2xl bg-card-light dark:bg-card-dark shadow-[0_4px_20px_-4px_rgba(244,37,54,0.1)] border border-primary/10 group transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none overflow-hidden h-full rounded-2xl">
                  <span className="material-symbols-rounded text-[80px] text-primary translate-x-4 -translate-y-4">{goal.icon}</span>
                </div>

                {/* Context Menu Button */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === goal.id ? null : goal.id)}
                    className="size-8 flex items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted backdrop-blur-sm transition-colors"
                  >
                    <span className="material-symbols-rounded text-[20px]">more_horiz</span>
                  </button>
                  {menuOpenId === goal.id && (
                    <div className="absolute right-0 top-9 w-32 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-30 overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <span className="material-symbols-rounded text-[16px]">edit</span> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                      >
                        <span className="material-symbols-rounded text-[16px]">delete</span> Excluir
                      </button>
                    </div>
                  )}
                  {menuOpenId === goal.id && <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)}></div>}
                </div>

                <div className="p-5 flex flex-col gap-4 relative z-10">
                  <div className="flex justify-between items-start pr-8">
                    <div className="flex gap-3">
                      <div className={`size-10 rounded-full flex items-center justify-center text-primary ${completed ? 'bg-green-100 text-green-600' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <span className="material-symbols-rounded text-[24px]">{completed ? 'check' : goal.icon}</span>
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold leading-tight ${completed ? 'line-through opacity-60' : ''}`}>{goal.title}</h3>
                        <p className="text-sm text-text-muted">{goal.description}</p>
                        {goal.startDate && goal.endDate && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(goal.startDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - {new Date(goal.endDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">{current}<span className="text-base text-text-muted font-normal">/{goal.target}</span></span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(244,37,54,0.5)]"
                        style={{ width: `${Math.min(100, (current / goal.target) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-text-muted">
                      <span>{Math.round(Math.min(100, (current / goal.target) * 100))}% completado</span>
                      <span className="font-medium">{completed ? 'Parabéns!' : `Faltam ${Math.max(0, goal.target - current)}`}</span>
                    </div>
                  </div>

                  {!completed && (
                    <button
                      onClick={() => goal.type === 'count' ? incrementGoal(goal.id) : toggleGoal(goal.id)}
                      className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 py-3 text-sm font-bold text-primary transition-colors active:scale-95"
                    >
                      <span className="material-symbols-rounded text-[18px]">{goal.type === 'count' ? 'add_circle' : 'check_circle'}</span>
                      {goal.type === 'count' ? 'Registrar Progresso' : 'Marcar como Feito'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Button - Updated Style */}
      <div className="fixed bottom-24 right-5 z-30">
        <button
          onClick={handleOpenAdd}
          className="group flex items-center justify-center size-14 bg-white dark:bg-card-dark text-primary shadow-xl rounded-[16px] hover:scale-105 active:scale-95 transition-all duration-200 border border-primary/10"
        >
          <span className="material-symbols-rounded text-4xl">add</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-lg font-bold">{editingId ? 'Editar Meta' : 'Nova Meta Semanal'}</h3>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Nome da Meta</label>
              <input
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-primary"
                placeholder="Ex: Correr no parque"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Descrição (Opcional)</label>
              <input
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-primary text-sm"
                placeholder="Ex: 30 minutos juntos"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Meta Semanal (Qtd)</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setFormTarget(Math.max(1, formTarget - 1))} className="size-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200">
                  <span className="material-symbols-rounded">remove</span>
                </button>
                <span className="text-xl font-bold w-8 text-center">{formTarget}</span>
                <button onClick={() => setFormTarget(formTarget + 1)} className="size-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200">
                  <span className="material-symbols-rounded">add</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-white/5 pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-text-muted uppercase block">Período de Validade</label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={noSpecificDate} onChange={(e) => setNoSpecificDate(e.target.checked)} className="accent-primary" />
                  Sempre ativo
                </label>
              </div>

              {!noSpecificDate && (
                <div className="grid grid-cols-2 gap-2 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold">Início (Inclusivo)</span>
                    <input type="date" className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-bold">Fim (Inclusivo)</span>
                    <input type="date" className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Ícone</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_SUGGESTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${formIcon === icon
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                  >
                    <span className="material-symbols-rounded text-[20px]">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-text-muted">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};