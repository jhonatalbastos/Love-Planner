import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface Props {
  onBack: () => void;
}

const AVAILABLE_ICONS = ['event', 'restaurant', 'movie', 'flight', 'favorite', 'cake', 'fitness_center', 'pets', 'home', 'local_bar', 'hiking', 'music_note'];

export const SpecialDates: React.FC<Props> = ({ onBack }) => {
  const { specialDates, addSpecialDate, updateSpecialDate, deleteSpecialDate } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formIcon, setFormIcon] = useState('event');
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const upcoming = specialDates.filter(d => d.type === 'upcoming');

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDate('');
    setFormIcon('event');
    setShowModal(true);
    setOpenMenuId(null);
  };

  const openEditModal = (id: string) => {
    const item = specialDates.find(d => d.id === id);
    if (item) {
      setEditingId(id);
      setFormTitle(item.title);
      setFormDate(item.date);
      setFormIcon(item.icon);
      setShowModal(true);
      setOpenMenuId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta data?')) {
      deleteSpecialDate(id);
      setOpenMenuId(null);
    }
  };

  const handleSave = () => {
    if(formTitle && formDate) {
      if (editingId) {
        // Edit Mode
        const original = specialDates.find(d => d.id === editingId);
        if (original) {
            updateSpecialDate({
                ...original,
                title: formTitle,
                date: formDate,
                icon: formIcon
            });
        }
      } else {
        // Add Mode
        addSpecialDate({
            id: Date.now().toString(),
            title: formTitle,
            description: 'Evento Personalizado',
            date: formDate,
            icon: formIcon,
            type: 'upcoming'
        });
      }
      setShowModal(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-6 animate-[fadeIn_0.3s_ease-out]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/5 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
          <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-primary/10 transition-colors">
            <span className="material-symbols-rounded text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Datas Especiais</h2>
          <div className="flex size-10 items-center justify-end">
            <button onClick={openAddModal} className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-primary/5 text-primary active:scale-95 transition-all">
              <span className="material-symbols-rounded text-[24px]">calendar_add_on</span>
            </button>
          </div>
        </div>
      </header>
      <div className="h-20"></div>
      
      <main className="flex flex-col gap-6 px-4 max-w-md mx-auto w-full pt-4">
        <section>
          <div className="flex items-center justify-between mb-3 px-1 mt-2">
            <h3 className="text-lg font-bold tracking-tight">Próximos Eventos</h3>
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.map((ev) => {
              // Fix timezone issue: construct date with time to prevent UTC rollback
              const dateObj = new Date(`${ev.date}T12:00:00`);
              
              return (
                <div key={ev.id} className="relative group">
                  <div className="flex items-center p-3 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm active:bg-gray-50 dark:active:bg-white/5 transition-colors">
                      <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 mr-4">
                      <span className="text-[10px] font-bold text-text-muted dark:text-white/60 uppercase tracking-wide">{dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                      <span className="text-xl font-bold">{dateObj.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold truncate">{ev.title}</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400 truncate flex items-center gap-1">
                          <span className="material-symbols-rounded text-[14px]">{ev.icon}</span>
                          {ev.description}
                      </p>
                      </div>
                      <div className="relative">
                          <button 
                              onClick={() => setOpenMenuId(openMenuId === ev.id ? null : ev.id)}
                              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full active:bg-black/5"
                          >
                              <span className="material-symbols-rounded text-[20px]">more_horiz</span>
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === ev.id && (
                              <div className="absolute right-0 top-8 w-32 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-20 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                                  <button 
                                      onClick={() => openEditModal(ev.id)}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                  >
                                      <span className="material-symbols-rounded text-[16px]">edit</span> Editar
                                  </button>
                                  <button 
                                      onClick={() => handleDelete(ev.id)}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                  >
                                      <span className="material-symbols-rounded text-[16px]">delete</span> Excluir
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
                  {/* Click outside closer helper could act here or simple state toggle */}
                  {openMenuId === ev.id && (
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold">{editingId ? 'Editar Data' : 'Nova Data'}</h3>
             
             <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Título</label>
                <input 
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-primary"
                    placeholder="Título (ex: Aniversário)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                />
             </div>
             
             <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Data</label>
                <input 
                    type="date"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-primary"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                />
             </div>

             <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map(icon => (
                        <button 
                            key={icon}
                            onClick={() => setFormIcon(icon)}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                                formIcon === icon 
                                ? 'bg-primary text-white shadow-md scale-110' 
                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <span className="material-symbols-rounded text-[20px]">{icon}</span>
                        </button>
                    ))}
                </div>
             </div>

             <div className="flex gap-2 justify-end mt-4">
               <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-text-muted">Cancelar</button>
               <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30">Salvar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};