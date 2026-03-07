import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [isPro, setIsPro]   = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSession = async (session) => {
    if (!session) {
      setUser(null);
      setIsPro(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setUser(data.user);
      setIsPro(data.isPro ?? false);
    } catch {
      setUser(session.user ?? null);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Register onAuthStateChange BEFORE getSession so it catches the hash token on magic link redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        checkSession(session);
        // Clean hash from URL after magic link login
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://neurial.dev' }
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isPro, loading, signIn, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);