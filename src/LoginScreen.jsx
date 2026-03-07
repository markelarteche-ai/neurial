import { useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(250, 204, 21, 0.3)',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '90%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(250, 204, 21, 0.08)',
      }}>

        {sent ? (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
            <h2 style={{ color: '#facc15', fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
              Check your email
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
              We sent a magic link to<br />
              <span style={{ color: '#fde68a' }}>{email}</span>.<br />
              Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{ marginTop: '24px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              background: 'linear-gradient(90deg, #fde68a, #facc15, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              letterSpacing: '2px',
            }}>
              NEURIAL
            </h1>
            <p style={{ color: 'rgba(253, 230, 138, 0.7)', fontSize: '13px', marginBottom: '32px' }}>
              ✨ Professional 3D Audio Generator
            </p>

            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', lineHeight: '1.6' }}>
              Sign in with your email to access your subscription.
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '28px' }}>
              No account? Just sign in — we'll create one automatically.
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.8)',
                color: 'white',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                fontSize: '14px',
                marginBottom: '12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '15px',
                background: '#facc15',
                color: '#000',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '20px',
                boxSizing: 'border-box',
              }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <p style={{ color: '#475569', fontSize: '12px' }}>
              You can also use the generator for free without signing in —{' '}
              <button
                onClick={() => window.dispatchEvent(new Event('neurial:skip-login'))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(250, 204, 21, 0.7)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}
              >
                continue as guest
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}