import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
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
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

  const initSession = async () => {
    const { data } = await supabase.auth.getSession();
    checkSession(data.session);
  };

  initSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      checkSession(session);
    }
  );

  return () => subscription.unsubscribe();

}, []);

  const signIn = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://neurial.dev" }
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isPro, loading, signIn, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);