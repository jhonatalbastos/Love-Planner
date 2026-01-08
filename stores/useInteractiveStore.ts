import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Quiz, Vision, DecisionList } from '../types';
import { interactiveService } from '../services/interactiveService';

interface InteractiveState {
    quizzes: Quiz[];
    visions: Vision[];
    decisionLists: DecisionList[];

    // Actions
    fetchInteractive: () => Promise<void>;

    // Quiz
    createQuiz: (quiz: Quiz) => Promise<void>;
    answerQuiz: (quizId: string, answer: string, userId: string) => Promise<boolean>;

    // Vision
    addVision: (vision: Vision) => Promise<void>;
    deleteVision: (id: string) => Promise<void>;

    // Decision Lists
    addDecisionList: (list: DecisionList) => Promise<void>;
    updateDecisionList: (id: string, items: string[]) => Promise<void>;
    deleteDecisionList: (id: string) => Promise<void>;
}

export const useInteractiveStore = create<InteractiveState>((set, get) => ({
    quizzes: [],
    visions: [],
    decisionLists: [],

    fetchInteractive: async () => {
        try {
            const q = await interactiveService.getQuizzes();
            const v = await interactiveService.getVisions();
            const d = await interactiveService.getDecisionLists();

            set({
                quizzes: q || [],
                visions: v || [],
                decisionLists: d || []
            });
        } catch (e) { console.error(e); }
    },

    createQuiz: async (quiz) => {
        set(state => ({ quizzes: [...state.quizzes, quiz] }));
        try {
            await interactiveService.createQuiz({ ...quiz } as any);
        } catch (e) { console.error(e); }
    },

    answerQuiz: async (quizId, answer, userId) => {
        const quiz = get().quizzes.find(q => q.id === quizId);
        if (!quiz) return false;
        const isCorrect = answer === quiz.correct_answer;

        set(state => ({
            quizzes: state.quizzes.map(q => q.id === quizId ? { ...q, partner_answer: answer, status: 'completed' } : q)
        }));

        await supabase.from('quizzes').update({
            partner_answer: answer,
            status: 'completed'
        }).eq('id', quizId);

        return isCorrect;
    },

    addVision: async (vision) => {
        set(state => ({ visions: [vision, ...state.visions] }));
        try {
            await interactiveService.addVision({ ...vision } as any);
        } catch (e) { console.error(e); }
    },

    deleteVision: async (id) => {
        set(state => ({ visions: state.visions.filter(v => v.id !== id) }));
        try {
            await interactiveService.deleteVision(id);
        } catch (e) { console.error(e); }
    },

    addDecisionList: async (list) => {
        set(state => ({ decisionLists: [list, ...state.decisionLists] }));
        try {
            await interactiveService.addDecisionList({ ...list } as any);
        } catch (e) { console.error(e); }
    },

    updateDecisionList: async (id, items) => {
        set(state => ({ decisionLists: state.decisionLists.map(l => l.id === id ? { ...l, items } : l) }));
        await supabase.from('decision_lists').update({ items }).eq('id', id);
    },

    deleteDecisionList: async (id) => {
        set(state => ({ decisionLists: state.decisionLists.filter(l => l.id !== id) }));
        try {
            await interactiveService.deleteDecisionList(id);
        } catch (e) { console.error(e); }
    }
}));
