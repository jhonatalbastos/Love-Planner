import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, names: string, startDate?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.names
        });
      }
      setLoading(false);
    };

    checkSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.names
        });
        setError(null); // Clear errors on success
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Note: OAuth redirects away from the page, so setLoading(false) might not run if successful immediately, which is fine.
  };

  const register = async (email: string, pass: string, names: string, startDate?: string) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { names }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Initialize Profile in Supabase
    if (data.user) {
      const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Use provided startDate or default to today
      const profileStartDate = startDate || new Date().toISOString();

      // We use upsert to be safe if profile already exists (e.g. from previous attempt or trigger)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        names: names,
        start_date: profileStartDate,
        // Changed to a valid image URL generator instead of a Google Photos link (which is not an image file)
        photo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${names.replace('&', '+')}`,
        pairing_code: pairingCode,
        connection_status: 'single'
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't block flow, but log it
      }
    }

    // CRITICAL FIX: If email confirmation is ON, session is null.
    // We must stop loading and inform the user.
    if (data.user && !data.session) {
      setLoading(false);
      setError("Conta criada! Se o login não for automático, vá no Supabase > Auth > Email e desative 'Confirm Email' para facilitar.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};