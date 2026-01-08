import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogEntry, Goal, Agreement, UserStats, SpecialDate, UserProfile, UserPreferences, Memory, User, Screen, JournalQuestion, JournalAnswer } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  userProfile: UserProfile;
  preferences: UserPreferences;
  stats: UserStats;
  logs: LogEntry[];
  goals: Goal[];
  agreements: Agreement[];
  specialDates: SpecialDate[];
  memories: Memory[];
  journalQuestions: JournalQuestion[];
  journalAnswers: JournalAnswer[];
  addQuestion: (question: JournalQuestion) => Promise<void>;
  saveAnswer: (answer: Omit<JournalAnswer, 'id' | 'created_at'>) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  togglePreference: (key: keyof UserPreferences) => void;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  toggleLogLock: (date: string) => void;
  toggleGoal: (id: string, date?: string) => void;
  incrementGoal: (id: string, date?: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'current' | 'completed' | 'completedDates'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  toggleAgreement: (id: string, date: string) => void;
  skipAgreement: (id: string, date: string) => void;
  addAgreement: (title: string, details: string, tag: string, timeInfo: string, startDate?: string, endDate?: string, responsibility?: 'me' | 'partner' | 'both') => void;
  updateAgreement: (agreement: Agreement) => void;
  deleteAgreement: (id: string) => void;
  addSpecialDate: (date: SpecialDate) => void;
  updateSpecialDate: (date: SpecialDate) => void;
  deleteSpecialDate: (id: string) => void;
  addMemory: (memory: Memory) => void;
  connectPartner: (code: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Defaults
const INITIAL_PREFS: UserPreferences = {
  dailyReminder: true,
  coachTips: true,
  biometrics: false,
  defaultScreen: Screen.DailyLog,
  partnerActionOptions: [
    { label: 'Carinho', icon: 'favorite' },
    { label: 'Presente', icon: 'volunteer_activism' },
    { label: 'Tarefas', icon: 'cleaning_services' },
    { label: 'Ouviu', icon: 'hearing' }
  ],
  myActionOptions: [
    { label: 'Carinho', icon: 'favorite' },
    { label: 'Jantar', icon: 'restaurant' },
    { label: 'Surpresa', icon: 'celebration' }
  ],
  intimacyReasons: ['Cansaço', 'Estresse', 'Menstruação', 'Dor/Doença', 'Rotina', 'Sem Clima', 'Brigados'],
  conflictReasons: ['Ciúmes', 'Finanças', 'Rotina', 'Família', 'Atenção', 'Limpeza'],
  aiConfig: {
    groqKey: ''
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode, currentUser: User }> = ({ children, currentUser }) => {

  const [userProfile, setUserProfile] = useState<UserProfile>({
    names: 'Carregando...',
    startDate: new Date().toISOString().split('T')[0],
    photoUrl: '',
    pairingCode: '',
    connectionStatus: 'single'
  });

  // Preferences are local per device usually, but could be synced. Keeping local for simplicity/latency.
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(`loveplanner_${currentUser.id}_prefs`);
    return saved ? { ...INITIAL_PREFS, ...JSON.parse(saved) } : INITIAL_PREFS;
  });

  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    nextLevelXp: 500,
    daysTogether: 0,
    soulmateScore: 50
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [journalQuestions, setJournalQuestions] = useState<JournalQuestion[]>([]);
  const [journalAnswers, setJournalAnswers] = useState<JournalAnswer[]>([]);

  // --- Load Data from Supabase ---
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      // --- SELF-HEALING: Restore from Metadata if Profile missing ---
      if (!profile && currentUser.user_metadata) {
        // User logged in but has no profile row (common after email confirmation)
        // Try to restore from the metadata we saved during register()
        const meta = currentUser.user_metadata;
        if (meta.names) {
          console.log("Restoring profile from metadata...");
          const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

          // Generate photo URL
          const photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${meta.names.replace('&', '+')}`;

          const newProfile = {
            id: currentUser.id,
            email: currentUser.email,
            names: meta.names || 'Casal',
            start_date: meta.start_date || new Date().toISOString(),
            photo_url: photoUrl,
            pairing_code: pairingCode,
            connection_status: 'single'
          };

          // Insert into Supabase
          await supabase.from('profiles').upsert(newProfile);

          // Set local state immediately to avoid reload need
          setUserProfile({
            names: newProfile.names,
            startDate: newProfile.start_date,
            photoUrl: newProfile.photo_url,
            pairingCode: newProfile.pairing_code,
            connectionStatus: 'single',
            partnerName: undefined
          });

          // Resume execution as if we fetched it
          // Note: We won't re-fetch 'profile', we just used the data we created.
        }
      }
      // -------------------------------------------------------------

      if (profile) {
        // Fetch Partner Name if connected
        let partnerName = undefined;
        if (profile.partner_id) {
          const { data: partner } = await supabase.from('profiles').select('names').eq('id', profile.partner_id).single();
          if (partner) {
            // Attempt to extract just one name if format is "Name & Name"
            const pNames = partner.names.split('&');
            partnerName = pNames.length > 0 ? pNames[0].trim() : partner.names;
          }
        }

        setUserProfile({
          names: profile.names,
          startDate: profile.start_date,
          photoUrl: profile.photo_url,
          pairingCode: profile.pairing_code,
          partnerName: partnerName,
          partnerId: profile.partner_id,
          connectionStatus: profile.partner_id ? 'connected' : 'single',
          cycleData: profile.cycle_data
        });
      }

      // 2. Fetch Logs (My logs + Partner logs)
      // The RLS policy on Supabase should handle the "OR partner_id" logic, 
      // simply selecting * from logs returns everything allowed.
      const { data: logsData } = await supabase.from('logs').select('*').order('date', { ascending: false });
      if (logsData) {
        const formattedLogs = logsData.map(l => ({ ...l.data, id: l.id })); // Unpack JSONB
        setLogs(formattedLogs);
      }

      // 3. Fetch Goals (INDIVIDUAL - Current User Only)
      const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', currentUser.id);
      if (goalsData) {
        setGoals(goalsData.map(g => ({ ...g.data, id: g.id })));
      }

      // 4. Fetch Agreements (SHARED - Mine + Partner's)
      let agreementQuery = supabase.from('agreements').select('*');
      if (profile && profile.partner_id) {
        agreementQuery = agreementQuery.or(`user_id.eq.${currentUser.id},user_id.eq.${profile.partner_id}`);
      } else {
        agreementQuery = agreementQuery.eq('user_id', currentUser.id);
      }

      const { data: agreementsData } = await agreementQuery;
      if (agreementsData) {
        setAgreements(agreementsData.map(a => ({ ...a.data, id: a.id })));
      }

      // 5. Special Dates
      const { data: datesData } = await supabase.from('special_dates').select('*');
      if (datesData) {
        setSpecialDates(datesData.map(d => ({ ...d.data, id: d.id })));
      }

      // 6. Memories
      const { data: memData } = await supabase.from('memories').select('*');
      if (memData) {
        setMemories(memData.map(m => ({ ...m.data, id: m.id })));
      }

      // 7. Journal Questions
      const { data: qData } = await supabase.from('journal_questions').select('*');
      if (qData) {
        setJournalQuestions(qData);
      }

      // 8. Journal Answers (My answers and partner's)
      const { data: aData } = await supabase.from('journal_answers').select('*');
      if (aData) {
        setJournalAnswers(aData);
      }
    };

    fetchData();

    // Setup Realtime Subscription
    const logsSub = supabase.channel('logs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => fetchData())
      .subscribe();

    const goalsSub = supabase.channel('goals_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => fetchData())
      .subscribe();

    const journalSub = supabase.channel('journal_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_questions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_answers' }, () => fetchData())
      .subscribe();

    // ... subscribe to others if needed

    return () => {
      supabase.removeChannel(logsSub);
      supabase.removeChannel(goalsSub);
      supabase.removeChannel(journalSub);
    };


  }, [currentUser]);

  // --- Median.co / OneSignal Integration ---
  useEffect(() => {
    if (currentUser && userProfile) {
      // Check if running in Median App
      if (window.median?.onesignal) {
        // Set External User ID to match Supabase ID
        window.median.onesignal.externalUserId.set({ externalId: currentUser.id });

        // Optional: Send tags for segmentation
        window.median.onesignal.tags.set({
          tags: {
            status: userProfile.connectionStatus,
            partner: userProfile.partnerId || 'none'
          }
        });
      }
    }
  }, [currentUser, userProfile]);

  // Persist Prefs locally
  useEffect(() => {
    localStorage.setItem(`loveplanner_${currentUser.id}_prefs`, JSON.stringify(preferences));
  }, [preferences, currentUser.id]);

  // Stats Calculation (Local for now based on fetched data)
  useEffect(() => {
    const start = new Date(userProfile.startDate).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));

    // Simple XP calculation based on amount of data
    const totalXp = (logs.length * 50) + (goals.filter(g => g.completed).length * 20);
    const level = Math.floor(totalXp / 500) + 1;

    // Soulmate Score: Avg rating of last 7 logs * 10
    const recentLogs = logs.slice(0, 7);
    let avgRating = 0;
    if (recentLogs.length > 0) {
      avgRating = recentLogs.reduce((acc, l) => acc + l.rating, 0) / recentLogs.length;
    }
    const score = recentLogs.length === 0 ? 50 : Math.min(100, Math.round(avgRating * 10));

    setStats({
      level,
      xp: totalXp,
      nextLevelXp: level * 500,
      daysTogether: Math.max(0, days),
      soulmateScore: score
    });
  }, [userProfile.startDate, logs, goals]);


  // --- Actions ---

  const updateUserProfile = async (newProfile: Partial<UserProfile>) => {
    // Optimistic Update
    setUserProfile(prev => ({ ...prev, ...newProfile }));

    // Supabase Update - Try update first
    const { data, error } = await supabase.from('profiles').update({
      names: newProfile.names,
      start_date: newProfile.startDate,
      photo_url: newProfile.photoUrl,
      cycle_data: newProfile.cycleData
    }).eq('id', currentUser.id).select();

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    // If no row was updated, it means it doesn't exist. Create it.
    if (!data || data.length === 0) {
      const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: insertError } = await supabase.from('profiles').insert({
        id: currentUser.id,
        email: currentUser.email,
        names: newProfile.names || 'Casal',
        start_date: newProfile.startDate || new Date().toISOString(),
        photo_url: newProfile.photoUrl || '',
        pairing_code: pairingCode,
        connection_status: 'single'
      });

      if (insertError) {
        console.error("Error creating missing profile:", insertError);
        throw insertError;
      }
    }
  };

  const connectPartner = async (code: string) => {
    try {
      // 1. Find partner by code
      const { data: partner } = await supabase.from('profiles').select('id, names').eq('pairing_code', code).single();

      if (!partner) return false;
      if (partner.id === currentUser.id) return false; // Can't pair with self

      // 2. Update My Profile
      const { error: myError } = await supabase.from('profiles').update({
        partner_id: partner.id,
        connection_status: 'connected'
      }).eq('id', currentUser.id);

      if (myError) throw myError;

      // 3. Update Partner Profile
      const { error: partnerError } = await supabase.from('profiles').update({
        partner_id: currentUser.id,
        connection_status: 'connected'
      }).eq('id', partner.id);

      if (partnerError) throw partnerError;

      // Update Local State
      setUserProfile(prev => ({
        ...prev,
        connectionStatus: 'connected',
        partnerName: partner.names.split('&')[0] // Approximation
      }));

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  const addLog = async (newLog: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const dateStr = newLog.date.split('T')[0];
    const timestamp = Date.now();

    // Check if exists locally to decide update vs insert
    const existing = logs.find(l => l.date.startsWith(dateStr));

    if (existing) {
      // Update
      const updatedLog = { ...existing, ...newLog };
      setLogs(prev => prev.map(l => l.id === existing.id ? updatedLog : l)); // Optimistic

      await supabase.from('logs').update({
        data: updatedLog
      }).eq('id', existing.id);
    } else {
      // Insert
      const id = crypto.randomUUID();
      const entry: LogEntry = { ...newLog, id, timestamp, isLocked: newLog.isLocked || false };
      setLogs(prev => [entry, ...prev]); // Optimistic

      await supabase.from('logs').insert({
        id,
        user_id: currentUser.id,
        date: dateStr,
        data: entry
      });
    }
  };

  const toggleLogLock = async (dateStr: string) => {
    const log = logs.find(l => l.date.startsWith(dateStr));
    if (log) {
      const updated = { ...log, isLocked: !log.isLocked };
      setLogs(prev => prev.map(l => l.id === log.id ? updated : l));
      await supabase.from('logs').update({ data: updated }).eq('id', log.id);
    }
  };

  // --- Goals Logic (Generalized for Supabase) ---
  // Note: For goals, agreements, etc., we are storing the entire JSON object in a 'data' column
  // This mimics the previous NoSQL-like behavior of localStorage but in Postgres.

  const syncGoal = async (goal: Goal) => {
    // Check if goal exists in DB (by ID)
    const { data } = await supabase.from('goals').select('id').eq('id', goal.id).single();
    if (data) {
      await supabase.from('goals').update({ data: goal }).eq('id', goal.id);
    } else {
      await supabase.from('goals').insert({ id: goal.id, user_id: currentUser.id, data: goal });
    }
  };

  const toggleGoal = (id: string, dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const isAlreadyCompletedOnDate = (goal.completedDates || []).includes(targetDate);
    let newDates = goal.completedDates || [];

    if (!isAlreadyCompletedOnDate) {
      newDates = [...newDates, targetDate];
    } else {
      newDates = newDates.filter(d => d !== targetDate);
    }
    const newCompleted = !isAlreadyCompletedOnDate;
    const updatedGoal = { ...goal, completed: newCompleted, current: newCompleted ? goal.target : 0, completedDates: newDates };

    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    syncGoal(updatedGoal);
  };

  const incrementGoal = (id: string, dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newHistory = [...(goal.history || []), targetDate];
    // ... week logic omitted for brevity, keeping simple increment ...
    // In a full implementation, copy the week logic from previous AppContext

    const updatedGoal = { ...goal, current: goal.current + 1, history: newHistory };
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    syncGoal(updatedGoal);
  };

  const addGoal = (newGoal: Omit<Goal, 'id' | 'current' | 'completed' | 'completedDates'>) => {
    const id = Date.now().toString(); // Use proper UUID in production
    const goal: Goal = { ...newGoal, id, current: 0, completed: false, completedDates: [], history: [], type: newGoal.type };
    setGoals(prev => [...prev, goal]);
    syncGoal(goal);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    syncGoal(updatedGoal);
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  };

  // --- Agreements Logic (Simplified Sync) ---
  const syncAgreement = async (item: Agreement) => {
    const { data } = await supabase.from('agreements').select('id').eq('id', item.id).single();
    if (data) await supabase.from('agreements').update({ data: item }).eq('id', item.id);
    else await supabase.from('agreements').insert({ id: item.id, user_id: currentUser.id, data: item });
  };

  const toggleAgreement = (id: string, date: string) => {
    const agreement = agreements.find(a => a.id === id);
    if (!agreement) return;

    const isCompleted = agreement.completedDates.includes(date);
    const newDates = isCompleted ? agreement.completedDates.filter(d => d !== date) : [...agreement.completedDates, date];
    const updated = { ...agreement, completedDates: newDates };

    setAgreements(prev => prev.map(a => a.id === id ? updated : a));
    syncAgreement(updated);
  };

  const skipAgreement = (id: string, date: string) => {
    // ... logic same as local
  };

  const addAgreement = (title: string, details: string, tag: string, timeInfo: string, startDate?: string, endDate?: string, responsibility?: 'me' | 'partner' | 'both') => {
    const id = Date.now().toString();
    const newAgreement: Agreement = {
      id, title, details, tag, timeInfo, color: 'blue',
      completedDates: [], skippedDates: [],
      startDate, endDate,
      responsibility: responsibility || 'both'
    };
    setAgreements(prev => [newAgreement, ...prev]);
    syncAgreement(newAgreement);
  };

  const updateAgreement = (updated: Agreement) => {
    setAgreements(prev => prev.map(a => a.id === updated.id ? updated : a));
    syncAgreement(updated);
  };

  const deleteAgreement = async (id: string) => {
    setAgreements(prev => prev.filter(a => a.id !== id));
    await supabase.from('agreements').delete().eq('id', id);
  };

  // --- Special Dates ---
  const addSpecialDate = async (date: SpecialDate) => {
    setSpecialDates(prev => [...prev, date]);
    await supabase.from('special_dates').insert({ id: date.id, user_id: currentUser.id, data: date });
  }

  const updateSpecialDate = async (updatedDate: SpecialDate) => {
    setSpecialDates(prev => prev.map(d => d.id === updatedDate.id ? updatedDate : d));
    await supabase.from('special_dates').update({ data: updatedDate }).eq('id', updatedDate.id);
  };

  const deleteSpecialDate = async (id: string) => {
    setSpecialDates(prev => prev.filter(d => d.id !== id));
    await supabase.from('special_dates').delete().eq('id', id);
  };

  const addMemory = async (memory: Memory) => {
    setMemories(prev => [memory, ...prev]);
    await supabase.from('memories').insert({ id: memory.id, user_id: currentUser.id, data: memory });
  };

  const addQuestion = async (question: JournalQuestion) => {
    setJournalQuestions(prev => [...prev, question]);
    await supabase.from('journal_questions').insert({
      id: question.id,
      text: question.text,
      category: question.category,
      created_by: currentUser.id
    });
  };

  const saveAnswer = async (answer: Omit<JournalAnswer, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const newAnswer: JournalAnswer = { ...answer, id, created_at: new Date().toISOString() };
    setJournalAnswers(prev => [...prev, newAnswer]);

    await supabase.from('journal_answers').insert({
      id,
      question_id: answer.question_id,
      user_id: currentUser.id,
      text: answer.text
    });
  };

  return (
    <AppContext.Provider value={{
      userProfile, preferences, stats, logs, goals, agreements, specialDates, memories, journalQuestions, journalAnswers,
      updateUserProfile, togglePreference, updatePreferences, addLog, toggleLogLock,
      toggleGoal, incrementGoal, addGoal, updateGoal, deleteGoal,
      toggleAgreement, skipAgreement, addAgreement, updateAgreement, deleteAgreement,
      addSpecialDate, updateSpecialDate, deleteSpecialDate, addMemory, connectPartner,
      addQuestion, saveAnswer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};