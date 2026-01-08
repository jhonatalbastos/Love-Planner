import { supabase } from '../lib/supabase';
import { LogEntry } from '../types';

export const logService = {
    async getLogs() {
        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data as LogEntry[];
    },

    async addLog(log: Omit<LogEntry, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('daily_logs')
            .insert([log])
            .select()
            .single();

        if (error) throw error;
        return data as LogEntry;
    },

    async deleteLog(id: string) {
        const { error } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
