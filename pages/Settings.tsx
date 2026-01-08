import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { UserPreferences, Screen } from '../types';
import { supabase } from '../lib/supabase';

const AVAILABLE_ICONS = [
  'favorite', 'volunteer_activism', 'cleaning_services', 'hearing', 'warning',
  'restaurant', 'thumb_up', 'spa', 'sentiment_satisfied', 'park',
  'local_cafe', 'movie', 'shopping_bag', 'home', 'flight', 'bedtime',
  'fitness_center', 'music_note', 'local_bar', 'work'
];

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { userProfile, updateUserProfile, preferences, togglePreference, updatePreferences, connectPartner } = useApp();
  const { logout, user } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  // Sync editForm with userProfile whenever userProfile loads/changes
  useEffect(() => {
    if (!isEditingProfile) {
      setEditForm(userProfile);
    }
  }, [userProfile, isEditingProfile]);

  // Photo Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pairing State
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // States for list management
  const [editingList, setEditingList] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('star'); // Default icon
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [editItemIcon, setEditItemIcon] = useState('star');

  // Helper to parse names for display
  const getNames = () => {
    const names = userProfile.names.split(/&| e /).map(s => s.trim());
    return {
      partnerName: names[0] || 'Parceiro 1',
      myName: names[1] || 'Parceiro 2'
    };
  };
  const { partnerName, myName } = getNames();

  // Helper to parse names for the edit form
  const getEditFormNames = () => {
    const names = editForm.names.split(/&| e /).map(s => s.trim());
    return {
      name1: names[0] || '',
      name2: names[1] || ''
    };
  };
  const { name1, name2 } = getEditFormNames();

  const handleEditClick = () => {
    // Force sync before opening modal
    setEditForm(userProfile);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editForm);
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + (error.message || JSON.stringify(error)));
    }
  };

  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return; // User cancelled
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Use random string to prevent browser caching of same filename
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Use functional update to ensure we don't overwrite other fields if they changed
      setEditForm(prev => ({ ...prev, photoUrl: data.publicUrl }));

    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message + ' (Verifique se criou o bucket "avatars" como Público no Supabase)');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userProfile.pairingCode);
    alert('Código copiado para a área de transferência!');
  };

  const handleConnect = async () => {
    if (!pairingCodeInput.trim()) return;
    setIsConnecting(true);
    const success = await connectPartner(pairingCodeInput);
    setIsConnecting(false);
    if (success) {
      alert("Conectado com sucesso!");
      setPairingCodeInput('');
    } else {
      alert("Código inválido ou erro na conexão.");
    }
  };

  const handlePreferenceToggle = async (key: keyof UserPreferences) => {
    if (key === 'dailyReminder' && !preferences.dailyReminder) {
      // Request permission if turning ON
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          alert("Precisamos da sua permissão para enviar lembretes!");
          return; // Don't toggle if denied
        }
      }
    }
    togglePreference(key);
  };

  const addItem = (listKey: keyof UserPreferences) => {
    if (!newItemText.trim()) return;
    const currentList = preferences[listKey] as any[];

    let updatedList;
    if (typeof currentList[0] === 'string' || currentList.length === 0) {
      const isStringArray = listKey === 'intimacyReasons' || listKey === 'conflictReasons';

      if (isStringArray || typeof currentList[0] === 'string') {
        if (!currentList.includes(newItemText.trim())) {
          updatedList = [...currentList, newItemText.trim()];
        }
      } else {
        if (!currentList.some(item => item.label === newItemText.trim())) {
          updatedList = [...currentList, { label: newItemText.trim(), icon: newItemIcon }];
        }
      }
    } else {
      if (!currentList.some(item => item.label === newItemText.trim())) {
        updatedList = [...currentList, { label: newItemText.trim(), icon: newItemIcon }];
      }
    }

    if (updatedList) {
      updatePreferences({ [listKey]: updatedList });
    }

    setNewItemText('');
    setNewItemIcon('star');
  };

  const deleteItem = (listKey: keyof UserPreferences, index: number) => {
    const currentList = [...(preferences[listKey] as any[])];
    currentList.splice(index, 1);
    updatePreferences({ [listKey]: currentList });
  };

  const startEditingItem = (index: number, text: string, icon?: string) => {
    setEditingItemIndex(index);
    setEditItemText(text);
    if (icon) setEditItemIcon(icon);
  };

  const saveEditedItem = (listKey: keyof UserPreferences, index: number) => {
    if (!editItemText.trim()) return;
    const currentList = [...(preferences[listKey] as any[])];

    const isStringArray = listKey === 'intimacyReasons' || listKey === 'conflictReasons';

    if (isStringArray || typeof currentList[0] === 'string') {
      currentList[index] = editItemText.trim();
    } else {
      currentList[index] = { label: editItemText.trim(), icon: editItemIcon };
    }

    updatePreferences({ [listKey]: currentList });
    setEditingItemIndex(null);
    setEditItemText('');
    setEditItemIcon('star');
  };

  const renderIconGrid = (selectedIcon: string, onSelect: (icon: string) => void) => (
    <div className="grid grid-cols-6 gap-2 mt-2 max-h-32 overflow-y-auto no-scrollbar p-1">
      {AVAILABLE_ICONS.map(icon => (
        <button
          key={icon}
          onClick={() => onSelect(icon)}
          className={`aspect-square rounded-lg flex items-center justify-center transition-all ${selectedIcon === icon
            ? 'bg-primary text-white shadow-sm'
            : 'bg-white dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
        >
          <span className="material-symbols-rounded text-[18px]">{icon}</span>
        </button>
      ))}
    </div>
  );

  const renderListManager = (title: string, listKey: keyof UserPreferences) => {
    const list = preferences[listKey] as any[];
    const isEditingThis = editingList === listKey;
    const isStringList = listKey === 'intimacyReasons' || listKey === 'conflictReasons';

    return (
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
        <div
          className="flex items-center justify-between p-4 cursor-pointer active:bg-black/5 dark:active:bg-white/5"
          onClick={() => setEditingList(isEditingThis ? null : listKey)}
        >
          <span className="font-medium text-sm">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{list.length} itens</span>
            <span className={`material-symbols-rounded transition-transform ${isEditingThis ? 'rotate-180' : ''}`}>expand_more</span>
          </div>
        </div>

        {isEditingThis && (
          <div className="p-4 pt-0 border-t border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
            <div className="space-y-2 mb-4 mt-2">
              {list.map((item, idx) => {
                const itemLabel = isStringList ? item : item.label;
                const itemIcon = isStringList ? null : item.icon;

                return (
                  <div key={idx} className="bg-white dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                    {editingItemIndex === idx ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {!isStringList && (
                            <div className="size-8 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                              <span className="material-symbols-rounded text-[20px]">{editItemIcon}</span>
                            </div>
                          )}
                          <input
                            className="flex-1 bg-transparent border-b border-primary outline-none text-sm p-1"
                            value={editItemText}
                            onChange={e => setEditItemText(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => saveEditedItem(listKey, idx)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded">
                            <span className="material-symbols-rounded text-[18px]">check</span>
                          </button>
                        </div>
                        {!isStringList && (
                          <>
                            <div className="text-[10px] text-text-muted font-bold uppercase mt-1">Escolher Ícone</div>
                            {renderIconGrid(editItemIcon, setEditItemIcon)}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!isStringList && (
                            <span className="material-symbols-rounded text-text-muted text-[20px] opacity-70">{itemIcon}</span>
                          )}
                          <span className="text-sm">{itemLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEditingItem(idx, itemLabel, itemIcon)} className="text-gray-400 hover:text-primary p-1 rounded hover:bg-primary/5">
                            <span className="material-symbols-rounded text-[18px]">edit</span>
                          </button>
                          <button onClick={() => deleteItem(listKey, idx)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                            <span className="material-symbols-rounded text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add New Section */}
            <div className="bg-white dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
              <div className="text-[10px] text-text-muted font-bold uppercase mb-2">Adicionar Novo</div>
              <div className="flex gap-2 mb-2">
                {!isStringList && (
                  <div className="size-10 flex items-center justify-center bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500">
                    <span className="material-symbols-rounded text-[24px]">{newItemIcon}</span>
                  </div>
                )}
                <input
                  className="flex-1 p-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent outline-none focus:border-primary"
                  placeholder="Nome..."
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem(listKey)}
                />
                <button
                  onClick={() => addItem(listKey)}
                  className="bg-primary text-white px-3 rounded-lg shadow-sm active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded">add</span>
                </button>
              </div>
              {!isStringList && (
                <>
                  <div className="text-[10px] text-gray-400 mb-1">Selecionar ícone:</div>
                  {renderIconGrid(newItemIcon, setNewItemIcon)}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-rounded text-[24px]">all_inclusive</span>
        </div>
        <h1 className="text-lg font-bold leading-tight tracking-tight">Configurações</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">

        <div className="text-xs text-text-muted/60 text-center mb-2">
          Logado como: <span className="font-bold">{user?.email}</span>
        </div>

        {/* Profile Section with Edit Logic */}
        <section className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
          {!isEditingProfile ? (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-full bg-cover bg-center ring-2 ring-primary/20 bg-gray-100 dark:bg-gray-800" style={{ backgroundImage: `url("${userProfile.photoUrl}")` }}></div>
                <button
                  onClick={handleEditClick}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white border-2 border-white dark:border-card-dark shadow-sm"
                >
                  <span className="material-symbols-rounded !text-[14px]">edit</span>
                </button>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate">{userProfile.names}</h2>
                <div className="flex items-center gap-1 text-text-muted text-sm">
                  <span className="material-symbols-rounded !text-[14px] text-primary">favorite</span>
                  <span>Juntos desde {new Date(userProfile.startDate).getFullYear()}</span>
                </div>
              </div>
              <button onClick={handleEditClick} className="text-primary hover:bg-primary/5 p-2 rounded-full">
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold">Editar Perfil</h3>
                <button onClick={() => setIsEditingProfile(false)} className="text-text-muted">
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Nome da Pessoa 1</label>
                  <input
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                    value={name1}
                    placeholder="Ex: Romeu"
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, names: `${val} & ${name2}` }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Nome da Pessoa 2</label>
                  <input
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                    value={name2}
                    placeholder="Ex: Julieta"
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, names: `${name1} & ${val}` }));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Data de Início</label>
                <input
                  type="date"
                  className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                  value={editForm.startDate}
                  onChange={e => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              {/* Upload de Foto */}
              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Foto do Perfil</label>
                <div className="flex items-center gap-3">
                  <div className="size-12 shrink-0 rounded-full bg-cover bg-center bg-gray-100 dark:bg-gray-800" style={{ backgroundImage: `url("${editForm.photoUrl}")` }}></div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUploadPhoto}
                    disabled={uploading}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10"
                  >
                    {uploading ? (
                      <span className="material-symbols-rounded animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-rounded">cloud_upload</span>
                    )}
                    {uploading ? 'Enviando...' : 'Alterar Foto'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={uploading}
                className="w-full bg-primary text-white font-bold py-2 rounded-lg shadow-md mt-2 disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          )}
        </section>

        {/* Pairing / Connection Section - NEW */}
        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Conexão de Casal</h3>
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden p-4">
            {userProfile.connectionStatus === 'connected' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                  <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <span className="material-symbols-rounded">link</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 dark:text-green-200">Conectado</h4>
                    <p className="text-xs text-green-600 dark:text-green-400">Viculado com {userProfile.partnerName || 'Seu Amor'}</p>
                  </div>
                </div>
                <div className="text-xs text-center text-text-muted">
                  Para desconectar, entre em contato com o suporte.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-2">Seu código de pareamento:</p>
                  <div
                    onClick={handleCopyCode}
                    className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-3 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <span className="font-mono font-bold text-lg tracking-widest">{userProfile.pairingCode}</span>
                    <span className="material-symbols-rounded text-primary">content_copy</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Toque para copiar e envie para seu amor.</p>
                </div>

                <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                  <p className="text-sm font-bold mb-2">Vincular Parceiro</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-primary text-sm uppercase"
                      placeholder="INSIRA O CÓDIGO"
                      value={pairingCodeInput}
                      onChange={e => setPairingCodeInput(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || pairingCodeInput.length < 6}
                      className="bg-primary disabled:bg-gray-300 text-white px-4 rounded-xl font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      {isConnecting ? <span className="material-symbols-rounded animate-spin text-sm">sync</span> : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>



        {/* AI Configuration Section */}
        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Inteligência Artificial</h3>
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden p-4 space-y-4">

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-lg mt-0.5">info</span>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-snug">
                  Este aplicativo utiliza a tecnologia Groq (Llama) para fornecer respostas rápidas e inteligentes.
                </p>
              </div>
            </div>

            <div className="animate-[fadeIn_0.2s_ease-out]">
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Chave API da Groq</label>
              <input
                type="password"
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:border-primary text-sm font-mono"
                placeholder="Cole sua chave Groq aqui..."
                value={preferences.aiConfig?.groqKey || ''}
                onChange={e => updatePreferences({ aiConfig: { ...preferences.aiConfig, groqKey: e.target.value } })}
              />
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 hover:underline mt-1 flex items-center gap-1">
                <span className="material-symbols-rounded text-[12px]">open_in_new</span>
                Obter chave gratuita na Groq Cloud
              </a>
            </div>


          </div>


        </section>

        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Aparência & Navegação</h3>
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden p-2 space-y-4">

            {/* Start Screen Selector */}
            <div className="px-2">
              <label className="block text-xs font-bold text-text-muted uppercase mb-2">Tela Inicial Padrão</label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-2.5 text-gray-400 pointer-events-none">home_app_logo</span>
                <select
                  value={preferences.defaultScreen || Screen.Dashboard}
                  onChange={(e) => updatePreferences({ defaultScreen: e.target.value as Screen })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                >
                  <option value={Screen.DailyLog}>Diário</option>
                  <option value={Screen.Dashboard}>Estatísticas (Dashboard)</option>
                  <option value={Screen.Goals}>Metas</option>
                  <option value={Screen.Agreements}>Acordos</option>
                  <option value={Screen.Journal}>Diário do Casal (Perguntas)</option>
                </select>
                <span className="material-symbols-rounded absolute right-3 top-3 text-gray-400 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>

            <div className="h-px w-full bg-gray-100 dark:bg-white/5"></div>

            {/* Theme Selector */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { val: 'light', icon: 'light_mode', label: 'Claro' },
                { val: 'dark', icon: 'dark_mode', label: 'Escuro' },
                { val: 'system', icon: 'settings_brightness', label: 'Auto' }
              ].map(opt => (
                <label key={opt.val} className="cursor-pointer group">
                  <input
                    type="radio"
                    name="theme"
                    value={opt.val}
                    className="peer sr-only"
                    checked={theme === opt.val}
                    onChange={() => setTheme(opt.val as any)}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg py-3 px-2 transition-all duration-200 peer-checked:bg-primary/10 peer-checked:text-primary text-text-muted hover:bg-black/5 dark:hover:bg-white/5">
                    <span className="material-symbols-rounded">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Personalização</h3>
          <div className="space-y-3">
            {renderListManager(`Ações de ${partnerName}`, 'partnerActionOptions')}
            {renderListManager(`Ações de ${myName}`, 'myActionOptions')}
            {renderListManager('Motivos de Sem Intimidade', 'intimacyReasons')}
            {renderListManager('Motivos de Discussão', 'conflictReasons')}
          </div>
        </section>

        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Saúde e Bem-estar</h3>
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden p-4 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                  <span className="material-symbols-rounded">water_drop</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Rastrear Ciclo Menstrual</h4>
                  <p className="text-xs text-text-muted">Previsão e insights para o casal</p>
                </div>
              </div>

              <label className="relative inline-block w-12 align-middle select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!userProfile.cycleData?.enabled}
                  onChange={(e) => {
                    updateUserProfile({
                      cycleData: {
                        enabled: e.target.checked,
                        shareWithPartner: userProfile.cycleData?.shareWithPartner ?? true,
                        lastPeriodDate: userProfile.cycleData?.lastPeriodDate || new Date().toISOString().split('T')[0],
                        cycleLength: userProfile.cycleData?.cycleLength || 28,
                        periodLength: userProfile.cycleData?.periodLength || 5
                      }
                    });
                  }}
                  className="peer sr-only"
                />
                <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {userProfile.cycleData?.enabled && (
              <div className="pt-4 space-y-4 animate-[fadeIn_0.3s_ease-out] border-t border-black/5 dark:border-white/5">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Última Menstruação</label>
                    <input
                      type="date"
                      className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                      value={userProfile.cycleData.lastPeriodDate}
                      onChange={e => updateUserProfile({
                        cycleData: { ...userProfile.cycleData!, lastPeriodDate: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Duração do Ciclo</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                        value={userProfile.cycleData.cycleLength}
                        onChange={e => updateUserProfile({
                          cycleData: { ...userProfile.cycleData!, cycleLength: Number(e.target.value) }
                        })}
                      />
                      <span className="text-xs text-text-muted">dias</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-rose-500">favorite</span>
                    <span className="text-sm font-medium">Compartilhar com Parceiro(a)</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-rose-500"
                    checked={userProfile.cycleData.shareWithPartner}
                    onChange={e => updateUserProfile({
                      cycleData: { ...userProfile.cycleData!, shareWithPartner: e.target.checked }
                    })}
                  />
                </div>

                <p className="text-[10px] text-text-muted italic text-center">
                  *Com isso ativado, seu parceiro receberá dicas úteis baseadas na fase do seu ciclo.
                </p>

              </div>
            )}

          </div>
        </section>

        <section>
          <h3 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-text-muted/70">Preferências</h3>
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
            {[
              { id: 'dailyReminder', icon: 'notifications', label: 'Lembrete Diário', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { id: 'coachTips', icon: 'tips_and_updates', label: 'Dicas do Mentor', color: 'text-primary dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
              { id: 'biometrics', icon: 'fingerprint', label: 'Bloqueio com Biometria', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
            ].map((item) => {
              const prefKey = item.id as keyof UserPreferences;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 active:bg-black/5 dark:active:bg-white/5 cursor-pointer"
                  onClick={() => handlePreferenceToggle(prefKey)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.bg} ${item.color}`}>
                      <span className="material-symbols-rounded !text-[18px]">{item.icon}</span>
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={!!preferences[prefKey]}
                      readOnly
                      className="peer sr-only"
                    />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="pt-2 pb-8 flex flex-col items-center gap-4">
          <button
            onClick={logout}
            className="w-full rounded-xl bg-card-light dark:bg-card-dark border border-primary/20 p-3 text-primary font-bold text-sm shadow-sm active:scale-[0.98] transition-all hover:bg-primary/5 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-rounded">logout</span>
            Sair da Conta
          </button>
          <p className="text-xs text-text-muted/60 dark:text-text-muted/40 font-medium">Love Planner v2.3.0</p>
        </div>
      </main>
    </div >
  );
};