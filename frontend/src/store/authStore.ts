import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch {
      set({ loading: false, error: 'Failed to initialize authentication' });
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signOut: async () => {
    if (!supabase) {
      return;
    }

    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, loading: false });
  },

  resetPassword: async (email: string) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
