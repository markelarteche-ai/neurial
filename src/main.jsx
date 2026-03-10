import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import App from "./App";
import LoginScreen from './LoginScreen';

// Root wrapper — decides what to show
const Root = () => {
  const { user, isPro, loading, signOut } = useAuth();
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    const handler = () => setGuest(true);
    window.addEventListener('neurial:skip-login', handler);
    return () => window.removeEventListener('neurial:skip-login', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
            NEURIAL
          </p>
          <p className="text-yellow-400/60 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !guest) {
    return <LoginScreen />;
  }

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
);