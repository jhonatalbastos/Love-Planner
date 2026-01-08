import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { LogEntry, Goal, Agreement, SpecialDate, Memory, JournalQuestion, JournalAnswer, UserStats } from '../types';
import { logService } from '../services/logService';
import { useAuthStore } from './useAuthStore';

interface ContentState {
    logs: LogEntry[];
    goals: Goal[];
    agreements: Agreement[];
    specialDates: SpecialDate[];
    memories: Memory[];
    journalQuestions: JournalQuestion[];
    journalAnswers: JournalAnswer[];
    stats: UserStats;

    // Actions
    fetchContent: (userId: string, partnerId?: string) => Promise<void>;

    // Logs
    addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>, userId: string) => Promise<void>;
    toggleLogLock: (date: string) => Promise<void>;

    // Goals
    addGoal: (goal: Omit<Goal, 'id' | 'current' | 'completed' | 'completedDates'>, userId: string) => void;
    toggleGoal: (id: string, date?: string, userId?: string) => void;
    incrementGoal: (id: string, date?: string, userId?: string) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;

    // Agreements
    addAgreement: (agreementData: any, userId: string) => void;
    toggleAgreement: (id: string, date: string) => void;
    updateAgreement: (agreement: Agreement) => void;
    deleteAgreement: (id: string) => void;

    // Others
    addSpecialDate: (date: SpecialDate, userId: string) => void;
    updateSpecialDate: (date: SpecialDate) => void;
    deleteSpecialDate: (id: string) => void;
    addMemory: (memory: Memory, userId: string) => void;

    // Journal
    addQuestion: (question: JournalQuestion) => Promise<void>;
    saveAnswer: (answer: Omit<JournalAnswer, 'id' | 'created_at'>, userId: string) => Promise<void>;

    calculateStats: (startDate: string) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
    logs: [],
    goals: [],
    agreements: [],
    specialDates: [],
    memories: [],
    journalQuestions: [],
    journalAnswers: [],
    stats: { level: 1, xp: 0, nextLevelXp: 500, daysTogether: 0, soulmateScore: 50 },

    fetchContent: async (userId, partnerId) => {
        // 1. Logs
        try {
            const logsData = await logService.getLogs();
            if (logsData) {
                set({ logs: logsData.map(l => ({ ...l.data, id: l.id })) });
            }
        } catch (e) { console.error(e); }

        // 2. Goals (My Goals)
        const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', userId);
        if (goalsData) {
            set({ goals: goalsData.map(g => ({ ...g.data, id: g.id })) });
        }

        // 3. Agreements (Shared)
        let agreementQuery = supabase.from('agreements').select('*');
        if (partnerId) {
            agreementQuery = agreementQuery.or(`user_id.eq.${userId},user_id.eq.${partnerId}`);
        } else {
            agreementQuery = agreementQuery.eq('user_id', userId);
        }
        const { data: agreementsData } = await agreementQuery;
        if (agreementsData) {
            set({ agreements: agreementsData.map(a => ({ ...a.data, id: a.id })) });
        }

        // 4. Special Dates
        const { data: datesData } = await supabase.from('special_dates').select('*');
        if (datesData) {
            set({ specialDates: datesData.map(d => ({ ...d.data, id: d.id })) });
        }

        // 5. Memories
        const { data: memData } = await supabase.from('memories').select('*');
        if (memData) {
            set({ memories: memData.map(m => ({ ...m.data, id: m.id })) });
        }

        // 6. Journal
        const { data: qData } = await supabase.from('journal_questions').select('*');
        if (qData) set({ journalQuestions: qData });

        const { data: aData } = await supabase.from('journal_answers').select('*');
        if (aData) set({ journalAnswers: aData });
    },

    calculateStats: (startDate) => {
        const { logs, goals } = get();
        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));

        const totalXp = (logs.length * 50) + (goals.filter(g => g.completed).length * 20);
        const level = Math.floor(totalXp / 500) + 1;

        const recentLogs = logs.slice(0, 7);
        let avgRating = 0;
        if (recentLogs.length > 0) {
            avgRating = recentLogs.reduce((acc, l) => acc + l.rating, 0) / recentLogs.length;
        }
        const score = recentLogs.length === 0 ? 50 : Math.min(100, Math.round(avgRating * 10));

        set({ stats: { level, xp: totalXp, nextLevelXp: level * 500, daysTogether: Math.max(0, days), soulmateScore: score } });
    },

    addLog: async (newLog, userId) => {
        const dateStr = newLog.date.split('T')[0];
        const timestamp = Date.now();
        const id = crypto.randomUUID();

        const existing = get().logs.find(l => l.date.startsWith(dateStr));

        if (existing) {
            const updatedLog = { ...existing, ...newLog };
            set(state => ({ logs: state.logs.map(l => l.id === existing.id ? updatedLog : l) }));
            await supabase.from('logs').update({ data: updatedLog }).eq('id', existing.id);
        } else {
            const entry: LogEntry = { ...newLog, id, timestamp, isLocked: newLog.isLocked || false };
            set(state => ({ logs: [entry, ...state.logs] }));
            try {
                await logService.addLog({ id, user_id: userId, date: dateStr, data: entry } as any);
            } catch (e) { console.error(e); }
        }
    },

    toggleLogLock: async (dateStr) => {
        const log = get().logs.find(l => l.date.startsWith(dateStr));
        if (log) {
            const updated = { ...log, isLocked: !log.isLocked };
            set(state => ({ logs: state.logs.map(l => l.id === log.id ? updated : l) }));
            await supabase.from('logs').update({ data: updated }).eq('id', log.id);
        }
    },

    // Goals
    addGoal: (newGoal, userId) => {
        const id = Date.now().toString();
        const goal: Goal = { ...newGoal, id: id, current: 0, completed: false, completedDates: [], history: [], type: newGoal.type };
        set(state => ({ goals: [...state.goals, goal] }));

        // Sync
        supabase.from('goals').insert({ id: goal.id, user_id: userId, data: goal }).then();
    },

    toggleGoal: (id, dateStr) => {
        const targetDate = dateStr || new Date().toISOString().split('T')[0];
        const goal = get().goals.find(g => g.id === id);
        if (!goal) return;

        const isAlreadyCompleted = (goal.completedDates || []).includes(targetDate);
        let newDates = goal.completedDates || [];
        if (!isAlreadyCompleted) newDates = [...newDates, targetDate];
        else newDates = newDates.filter(d => d !== targetDate);

        const newCompleted = !isAlreadyCompleted;
        const updatedGoal = { ...goal, completed: newCompleted, current: newCompleted ? goal.target : 0, completedDates: newDates };

        set(state => ({ goals: state.goals.map(g => g.id === id ? updatedGoal : g) }));
        supabase.from('goals').update({ data: updatedGoal }).eq('id', id).then();
    },

    incrementGoal: (id, dateStr) => {
        const targetDate = dateStr || new Date().toISOString().split('T')[0];
        const goal = get().goals.find(g => g.id === id);
        if (!goal) return;

        const newHistory = [...(goal.history || []), targetDate];
        const updatedGoal = { ...goal, current: goal.current + 1, history: newHistory };
        set(state => ({ goals: state.goals.map(g => g.id === id ? updatedGoal : g) }));
        supabase.from('goals').update({ data: updatedGoal }).eq('id', id).then();
    },

    updateGoal: (updatedGoal) => {
        set(state => ({ goals: state.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g) }));
        supabase.from('goals').update({ data: updatedGoal }).eq('id', updatedGoal.id).then();
    },

    deleteGoal: async (id) => {
        set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
        await supabase.from('goals').delete().eq('id', id);
    },

    // Agreements
    addAgreement: (data, userId) => { // data: {title, details, ...}
        const id = Date.now().toString();
        const newAgreement: Agreement = {
            id, ...data,
            completedDates: [], skippedDates: [], color: 'blue'
        };
        set(state => ({ agreements: [newAgreement, ...state.agreements] }));
        supabase.from('agreements').insert({ id, user_id: userId, data: newAgreement }).then();
    },

    toggleAgreement: (id, date) => {
        const agreement = get().agreements.find(a => a.id === id);
        if (!agreement) return;

        const isCompleted = agreement.completedDates.includes(date);
        const newDates = isCompleted ? agreement.completedDates.filter(d => d !== date) : [...agreement.completedDates, date];
        const updated = { ...agreement, completedDates: newDates };

        set(state => ({ agreements: state.agreements.map(a => a.id === id ? updated : a) }));
        supabase.from('agreements').update({ data: updated }).eq('id', id).then();
    },

    updateAgreement: (updated) => {
        set(state => ({ agreements: state.agreements.map(a => a.id === updated.id ? updated : a) }));
        supabase.from('agreements').update({ data: updated }).eq('id', updated.id).then();
    },

    deleteAgreement: async (id) => {
        set(state => ({ agreements: state.agreements.filter(a => a.id !== id) }));
        await supabase.from('agreements').delete().eq('id', id);
    },

    addSpecialDate: async (date, userId) => {
        set(state => ({ specialDates: [...state.specialDates, date] }));
        await supabase.from('special_dates').insert({ id: date.id, user_id: userId, data: date });
    },

    updateSpecialDate: async (updated) => {
        set(state => ({ specialDates: state.specialDates.map(d => d.id === updated.id ? updated : d) }));
        await supabase.from('special_dates').update({ data: updated }).eq('id', updated.id);
    },

    deleteSpecialDate: async (id) => {
        set(state => ({ specialDates: state.specialDates.filter(d => d.id !== id) }));
        await supabase.from('special_dates').delete().eq('id', id);
    },

    addMemory: async (memory, userId) => {
        set(state => ({ memories: [memory, ...state.memories] }));
        await supabase.from('memories').insert({ id: memory.id, user_id: userId, data: memory });
    },

    addQuestion: async (question) => {
        set(state => ({ journalQuestions: [...state.journalQuestions, question] }));
        await supabase.from('journal_questions').insert({
            id: question.id,
            text: question.text,
            category: question.category,
            created_by: question.created_by // careful with userId need
        });
    },

    saveAnswer: async (answer, userId) => {
        const id = crypto.randomUUID();
        const newAnswer: JournalAnswer = { ...answer, id, created_at: new Date().toISOString() };
        set(state => ({ journalAnswers: [...state.journalAnswers, newAnswer] }));

        await supabase.from('journal_answers').insert({
            id,
            question_id: answer.question_id,
            user_id: userId,
            text: answer.text
        });
    }
}));
