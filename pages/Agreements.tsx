import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Agreement } from '../types';

export const Agreements: React.FC = () => {
  const { agreements, toggleAgreement, addAgreement, updateAgreement, deleteAgreement, userProfile } = useApp();

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

  // Modals & Menu
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newFrequency, setNewFrequency] = useState('Diário');
  const [newTime, setNewTime] = useState('');
  const [newResponsibility, setNewResponsibility] = useState<'me' | 'partner' | 'both'>('both');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  // Helpers
  const toLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const weekDays = getWeekDays(currentDate);
  const selectedDateObj = weekDays[selectedDayIndex].fullDate;
  const selectedDateStr = toLocalDateStr(selectedDateObj);

  const formatWeekRange = () => {
    const start = weekDays[0].fullDate;
    const end = weekDays[6].fullDate;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('pt-BR', options)} - ${end.toLocaleDateString('pt-BR', options)}`;
  };

  // Filter Active Agreements
  const activeAgreements = agreements.filter(a => {
    // 1. Check Date Range validity
    if (a.startDate && selectedDateStr < a.startDate) return false;
    if (a.endDate && selectedDateStr > a.endDate) return false;

    // 2. Check if skipped specifically for this date
    if (a.skippedDates.includes(selectedDateStr)) return false;

    // 3. Logic for 'Mensal' (Monthly)
    // If completed in the current month, only show it on the specific day it was completed.
    if (a.tag === 'Mensal') {
      const [selYear, selMonth] = selectedDateStr.split('-').map(Number);

      const completedInSameMonth = a.completedDates.some(date => {
        const [cYear, cMonth] = date.split('-').map(Number);
        return cYear === selYear && cMonth === selMonth;
      });

      // If completed this month AND the selected day is NOT the day it was completed, hide it.
      if (completedInSameMonth && !a.completedDates.includes(selectedDateStr)) {
        return false;
      }
    }

    // 4. Logic for 'Semanal' (Weekly)
    // If completed in the current visible week, only show it on the specific day it was completed.
    if (a.tag === 'Semanal') {
      // Check if any completed date falls within the currently calculated weekDays
      const completedInThisWeek = a.completedDates.some(completedDate =>
        weekDays.some(wd => toLocalDateStr(wd.fullDate) === completedDate)
      );

      if (completedInThisWeek && !a.completedDates.includes(selectedDateStr)) {
        return false;
      }
    }

    return true;
  });

  // Sort: Not completed first, then completed
  const sortedAgreements = [...activeAgreements].sort((a, b) => {
    const aCompleted = a.completedDates.includes(selectedDateStr);
    const bCompleted = b.completedDates.includes(selectedDateStr);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });

  // Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    setNewTitle('');
    setNewDetails('');
    setNewFrequency('Diário');
    setNewTime('');
    setNewResponsibility('both');
    setFormStartDate('');
    setFormEndDate('');
    setShowAddModal(true);
    setMenuOpenId(null);
  };

  const handleOpenEdit = (agreement: Agreement) => {
    setEditingId(agreement.id);
    setNewTitle(agreement.title);
    setNewDetails(agreement.details || '');
    setNewFrequency(agreement.tag);
    setNewTime(agreement.timeInfo === 'Geral' ? '' : agreement.timeInfo);
    setNewResponsibility(agreement.responsibility || 'both');
    setFormStartDate(agreement.startDate || '');
    setFormEndDate(agreement.endDate || '');
    setShowAddModal(true);
    setMenuOpenId(null);
  };

  const handleSave = () => {
    if (!newTitle.trim()) return;

    const displayTimeInfo = newTime || 'Geral';

    if (editingId) {
      const existing = agreements.find(a => a.id === editingId);
      if (existing) {
        updateAgreement({
          ...existing,
          title: newTitle,
          details: newDetails,
          tag: newFrequency,
          timeInfo: displayTimeInfo,
          startDate: formStartDate || undefined,
          endDate: formEndDate || undefined,
          responsibility: newResponsibility
        });
      }
    } else {
      addAgreement(
        newTitle,
        newDetails,
        newFrequency,
        displayTimeInfo,
        formStartDate || undefined,
        formEndDate || undefined,
        newResponsibility
      );
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este acordo permanentemente?")) {
      deleteAgreement(id);
    }
    setMenuOpenId(null);
  }

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark pb-24 animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background-light/90 dark:bg-background-dark/90 border-b border-primary/10 transition-all duration-300">
        <div className="flex items-center px-4 py-3 justify-between">
          <div className="w-10 flex justify-start">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-rounded text-xl">all_inclusive</span>
            </div>
          </div>


          <h2 className="text-xl font-bold leading-tight tracking-tight flex-1 text-center">
            Meus Acordos
            <span className="block text-[10px] font-normal text-text-muted opacity-80 mt-0.5">Área Compartilhada do Casal</span>
          </h2>

          <div className="w-10 flex justify-end">
            <div className="relative">
              <button className="flex size-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-primary active:bg-primary/10">
                <span className="material-symbols-rounded text-[24px]">calendar_month</span>
              </button>
              <input
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleDateSelect}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-6 pt-2 pb-1">
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

      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent my-1"></div>

      <main className="flex-1 px-4 pt-4 flex flex-col gap-2">
        {/* Date Header for List */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-sm font-bold text-text-muted uppercase">
            {weekDays[selectedDayIndex].w}, {weekDays[selectedDayIndex].d}
          </span>
          <span className="text-xs font-medium bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">{sortedAgreements.length} Tarefas</span>
        </div>

        {sortedAgreements.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-10 text-center opacity-50">
            <span className="material-symbols-rounded text-6xl mb-4 text-primary/30">event_available</span>
            <p className="font-bold text-lg">Dia livre!</p>
            <p className="text-sm text-text-muted">Nenhum acordo agendado para esta data.</p>
          </div>
        )}

        {sortedAgreements.map((item) => {
          const isCompleted = item.completedDates.includes(selectedDateStr);
          return (
            <div key={item.id} className="group relative flex items-start gap-3 bg-white dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-all hover:border-primary/20">
              {/* Checkbox Area */}
              <button
                onClick={() => toggleAgreement(item.id, selectedDateStr)}
                className={`mt-0.5 flex items-center justify-center rounded-full shrink-0 size-6 border-2 transition-all duration-200 ${isCompleted
                  ? 'bg-primary border-primary text-white scale-110'
                  : 'bg-transparent border-gray-300 dark:border-gray-500 hover:border-primary text-transparent'
                  }`}
              >
                <span className="material-symbols-rounded text-[16px] font-bold">check</span>
              </button>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                <h3 className={`text-base font-semibold leading-snug transition-all ${isCompleted ? 'text-gray-400 line-through' : ''}`}>
                  {item.title}
                </h3>
                {item.details && (
                  <p className={`text-sm mt-0.5 ${isCompleted ? 'text-gray-300' : 'text-text-muted'}`}>
                    {item.details}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${isCompleted ? 'bg-gray-100 text-gray-400 dark:bg-white/5' : 'bg-primary/5 text-primary'}`}>
                    <span className="material-symbols-rounded text-[12px]">repeat</span>
                    {item.tag}
                  </span>
                  {item.timeInfo !== 'Geral' && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>
                      <span className="material-symbols-rounded text-[12px]">schedule</span>
                      {item.timeInfo}
                    </span>
                  )}
                  {/* Responsibility Badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${item.responsibility === 'me' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40' :
                    item.responsibility === 'partner' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40' :
                      'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40'
                    }`}>
                    <span className="material-symbols-rounded text-[12px]">
                      {item.responsibility === 'me' ? 'person' : item.responsibility === 'partner' ? 'favorite' : 'group'}
                    </span>
                    {item.responsibility === 'me' ? 'Eu' : item.responsibility === 'partner' ? 'Parceiro' : 'Ambos'}
                  </span>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                  className="p-1 text-gray-300 hover:text-primary transition-colors rounded-full active:bg-black/5"
                >
                  <span className="material-symbols-rounded text-[20px]">more_vert</span>
                </button>
                {menuOpenId === item.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-20 overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <span className="material-symbols-rounded text-[18px]">edit</span> Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 border-t border-gray-100 dark:border-white/5"
                    >
                      <span className="material-symbols-rounded text-[18px]">delete</span> Excluir
                    </button>
                  </div>
                )}
                {menuOpenId === item.id && <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)}></div>}
              </div>
            </div>
          )
        })}
      </main>

      {/* FAB - Google Style */}
      <div className="fixed bottom-24 right-5 z-30">
        <button
          onClick={handleOpenAdd}
          className="group flex items-center justify-center size-14 bg-white dark:bg-card-dark text-primary shadow-xl rounded-[16px] hover:scale-105 active:scale-95 transition-all duration-200 border border-primary/10"
        >
          <span className="material-symbols-rounded text-4xl">add</span>
        </button>
      </div>

      {/* Add/Edit Modal (Bottom Sheet Style) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-card-dark rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Editar Acordo' : 'Novo Acordo'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-rounded">close</span></button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <input
                  className="w-full p-2 bg-transparent text-lg font-bold placeholder-gray-300 border-none outline-none focus:ring-0"
                  placeholder="Título da tarefa"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-rounded text-gray-400 mt-2">notes</span>
                <textarea
                  className="w-full p-2 bg-gray-50 dark:bg-white/5 rounded-lg border-none outline-none text-sm resize-none h-20 placeholder-gray-400"
                  placeholder="Adicionar detalhes"
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-gray-400">update</span>
                <select
                  className="flex-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg border-none outline-none text-sm"
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                >
                  <option>Diário</option>
                  <option>Semanal</option>
                  <option>Mensal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Responsabilidade</label>
                <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                  {[
                    { id: 'both', label: 'Ambos', icon: 'group' },
                    { id: 'me', label: 'Eu', icon: 'person' },
                    { id: 'partner', label: 'Parceiro', icon: 'favorite' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setNewResponsibility(opt.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${newResponsibility === opt.id
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

              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-gray-400">schedule</span>
                <input
                  type="time"
                  className="flex-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg border-none outline-none text-sm"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              {/* Advanced: Date Range */}
              <details className="text-xs text-gray-400 cursor-pointer">
                <summary className="hover:text-primary transition-colors">Opções de validade</summary>
                <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <div>
                    <label className="block mb-1">Início</label>
                    <input type="date" className="w-full bg-white dark:bg-black/20 rounded p-1" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block mb-1">Fim</label>
                    <input type="date" className="w-full bg-white dark:bg-black/20 rounded p-1" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                  </div>
                </div>
              </details>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="px-6 py-2 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30">
                Salvar
              </button>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};