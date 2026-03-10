import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import UseCases from "./pages/UseCases";
import AdvancedSoundEngine from "./App";
import LoginScreen from "./LoginScreen";

function ProtectedApp() {
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    const handler = () => setGuest(true);
    window.addEventListener('neurial:skip-login', handler);
    return () => window.removeEventListener('neurial:skip-login', handler);
  }, []);

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #020617, #0f172a, #020617)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{
        fontSize: '28px',
        fontWeight: 900,
        background: 'linear-gradient(90deg, #fde68a, #facc15, #f59e0b)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '2px'
      }}>NEURIAL</p>
    </div>
  );

  if (!user && !guest) return <LoginScreen />;

  return <AdvancedSoundEngine user={user} />;
}

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/app" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;