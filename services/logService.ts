import { supabase } from '../lib/supabase';
import { LogEntry } from '../types';

export const logService = {
    async getLogs() {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        // The store expects the raw row { id, data, ... } or mapped?
        // AppContext mapped it: logsData.map(l => ({ ...l.data, id: l.id }))
        // So this service should return the raw rows and let the store or service map it.
        // Let's return the Raw rows here to be flexible, or mapping it here? 
        // Better map it here to return LogEntry[] directly? 
        // No, AppContext implementation in store does the mapping. 
        // UseContentStore: set({ logs: logsData.map(l => ({ ...l.data, id: l.id })) });
        // So we return raw rows.
        return data as any[];
    },

    async addLog(payload: { id: string, user_id: string, date: string, data: LogEntry }) {
        const { data, error } = await supabase
            .from('logs')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLog(id: string) {
        const { error } = await supabase
            .from('logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
