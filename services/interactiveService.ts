import { supabase } from '../lib/supabase';
import { Quiz, Vision, DecisionList } from '../types';

export const interactiveService = {
    // --- Quizzes ---
    async getQuizzes() {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Quiz[];
    },

    async createQuiz(quiz: Omit<Quiz, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('quizzes')
            .insert([quiz])
            .select()
            .single();
        if (error) throw error;
        return data as Quiz;
    },

    async answerQuiz(quizId: string, answerIndex: number) {
        // Note: In a real backend, we'd validate the answer here. 
        // For now, we update the local state or separate answers table.
        // This function might be more complex if we track score server-side.
        // For this MVP, we might just return success.
        return true;
    },

    // --- Visions ---
    async getVisions() {
        const { data, error } = await supabase
            .from('visions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Vision[];
    },

    async addVision(vision: Omit<Vision, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('visions')
            .insert([vision])
            .select()
            .single();
        if (error) throw error;
        return data as Vision;
    },

    async deleteVision(id: string) {
        const { error } = await supabase.from('visions').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Decision Lists ---
    async getDecisionLists() {
        const { data, error } = await supabase
            .from('decision_lists')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as DecisionList[];
    },

    async addDecisionList(list: Omit<DecisionList, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('decision_lists')
            .insert([list])
            .select()
            .single();
        if (error) throw error;
        return data as DecisionList;
    },

    async deleteDecisionList(id: string) {
        const { error } = await supabase.from('decision_lists').delete().eq('id', id);
        if (error) throw error;
    }
};
