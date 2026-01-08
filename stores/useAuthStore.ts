import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserProfile, UserPreferences, User } from '../types';
import { profileService } from '../services/profileService';
import { Screen } from '../types';

interface AuthState {
    user: User | null;
    userProfile: UserProfile;
    preferences: UserPreferences;
    loading: boolean;

    // Actions
    error: string | null;

    // Actions
    initializeAuthListener: () => () => void;
    setUser: (user: User | null) => void;
    fetchProfile: (userId: string) => Promise<void>;
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
    togglePreference: (key: keyof UserPreferences) => void;
    updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
    connectPartner: (code: string) => Promise<boolean>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (email: string, pass: string, names: string, startDate?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const INITIAL_PROFILE: UserProfile = {
    names: 'Carregando...',
    startDate: new Date().toISOString().split('T')[0],
    photoUrl: '',
    pairingCode: '',
    connectionStatus: 'single'
};

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

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    userProfile: INITIAL_PROFILE,
    preferences: INITIAL_PREFS,
    loading: true,

    setUser: (user) => {
        set({ user });
        if (user) {
            // Load preferences from local storage on login
            const saved = localStorage.getItem(`loveplanner_${user.id}_prefs`);
            let loadedPrefs = INITIAL_PREFS;

            if (saved) {
                loadedPrefs = { ...INITIAL_PREFS, ...JSON.parse(saved) };
            }

            // Restore global Groq Key if missing in user prefs
            if (!loadedPrefs.aiConfig.groqKey) {
                const globalKey = localStorage.getItem('loveplanner_global_groq_key');
                if (globalKey) {
                    console.log("Restoring Groq Key from global storage");
                    loadedPrefs.aiConfig.groqKey = globalKey;
                }
            }

            set({ preferences: loadedPrefs });
        }
    },

    fetchProfile: async (userId: string) => {
        try {
            let profile = await profileService.getProfile(userId);

            // Self-healing / Restoration logic
            if (!profile) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.user_metadata?.names) {
                    console.log("Restoring profile from metadata...");
                    const meta = user.user_metadata;
                    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${meta.names.replace('&', '+')}`;

                    const newProfile = {
                        id: user.id,
                        email: user.email,
                        names: meta.names || 'Casal',
                        start_date: meta.start_date || new Date().toISOString(),
                        photo_url: photoUrl,
                        pairing_code: pairingCode,
                        connection_status: 'single'
                    };
                    await supabase.from('profiles').upsert(newProfile);
                    profile = newProfile as any;
                }
            }

            if (profile) {
                const p = profile as any; // Cast to access snake_case properties from DB

                let partnerName = undefined;
                if (p.partner_id) {
                    const partner = await profileService.getProfile(p.partner_id);
                    const pData = partner as any;
                    if (pData) {
                        const pNames = pData.names.split('&');
                        partnerName = pNames.length > 0 ? pNames[0].trim() : pData.names;
                    }
                }

                set({
                    userProfile: {
                        names: p.names,
                        startDate: p.start_date,
                        photoUrl: p.photo_url,
                        pairingCode: p.pairing_code,
                        partnerName: partnerName,
                        partnerId: p.partner_id,
                        connectionStatus: p.partner_id ? 'connected' : 'single',
                        cycleData: p.cycle_data,
                        mood: p.mood,
                        energy: p.energy
                    },
                    loading: false
                });
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
            set({ loading: false });
        }
    },

    updateUserProfile: async (newProfile) => {
        const current = get().userProfile;
        const user = get().user;
        if (!user) return;

        const updated = { ...current, ...newProfile };
        set({ userProfile: updated });

        try {
            await profileService.updateProfile(user.id, {
                names: updated.names,
                // @ts-ignore
                start_date: updated.startDate,
                // @ts-ignore
                photo_url: updated.photoUrl,
                // @ts-ignore
                cycle_data: updated.cycleData,
                mood: updated.mood,
                energy: updated.energy
            } as any);
        } catch (e) {
            console.error("Profile update failed", e);
        }
    },

    togglePreference: (key) => {
        set(state => {
            const newPrefs = { ...state.preferences, [key]: !state.preferences[key] };
            const user = state.user;
            if (user) localStorage.setItem(`loveplanner_${user.id}_prefs`, JSON.stringify(newPrefs));
            return { preferences: newPrefs };
        });
    },

    updatePreferences: (newPrefs) => {
        set(state => {
            const updated = { ...state.preferences, ...newPrefs };

            // Persist Groq Key Globally if it's being updated
            if (newPrefs.aiConfig?.groqKey !== undefined) {
                if (newPrefs.aiConfig.groqKey) {
                    localStorage.setItem('loveplanner_global_groq_key', newPrefs.aiConfig.groqKey);
                } else {
                    localStorage.removeItem('loveplanner_global_groq_key');
                }
            }

            const user = state.user;
            if (user) localStorage.setItem(`loveplanner_${user.id}_prefs`, JSON.stringify(updated));
            return { preferences: updated };
        });
    },

    connectPartner: async (code) => {
        const user = get().user;
        if (!user) return false;

        try {
            const { data: partner } = await supabase.from('profiles').select('id, names').eq('pairing_code', code).single();

            if (!partner) return false;
            if (partner.id === user.id) return false;

            // Update My Profile
            const { error: myError } = await supabase.from('profiles').update({
                partner_id: partner.id,
                connection_status: 'connected'
            }).eq('id', user.id);
            if (myError) throw myError;

            // Update Partner Profile
            const { error: partnerError } = await supabase.from('profiles').update({
                partner_id: user.id,
                connection_status: 'connected'
            }).eq('id', partner.id);
            if (partnerError) throw partnerError;

            set(state => ({
                userProfile: {
                    ...state.userProfile,
                    connectionStatus: 'connected',
                    partnerName: partner.names.split('&')[0]
                }
            }));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    error: null,

    initializeAuthListener: () => {
        set({ loading: true });
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                set({ user: session.user, loading: false });
                get().fetchProfile(session.user.id);
            } else {
                set({ user: null, loading: false });
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                set({ user: session.user });
                get().fetchProfile(session.user.id);
            } else {
                set({ user: null, userProfile: INITIAL_PROFILE });
            }
            set({ loading: false });
        });

        return () => subscription.unsubscribe();
    },

    login: async (email, pass) => {
        set({ loading: true, error: null });
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (error) {
            set({
                error: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message,
                loading: false
            });
        }
    },

    loginWithGoogle: async () => {
        set({ loading: true, error: null });
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) {
            set({ error: error.message, loading: false });
        }
    },

    register: async (email, pass, names, startDate) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    names,
                    start_date: startDate // Persist in metadata as backup
                }
            }
        });

        if (error) {
            set({ error: error.message, loading: false });
            return;
        }

        // Initialize Profile in Supabase
        if (data.user) {
            const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const profileStartDate = startDate || new Date().toISOString();

            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                names: names,
                start_date: profileStartDate,
                photo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${names.replace('&', '+')}`,
                pairing_code: pairingCode,
                connection_status: 'single'
                // @ts-ignore
            } as any);

            if (profileError) {
                console.error("Error creating profile:", profileError);
            }
        }

        if (data.user && !data.session) {
            set({
                loading: false,
                error: "Conta criada! Se o login não for automático, vá no Supabase > Auth > Email e desative 'Confirm Email'."
            });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, userProfile: INITIAL_PROFILE });
    }
}));
