import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div style={{
      padding: '24px 32px',
      borderBottom: '1px solid rgba(250,204,21,0.2)',
      background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span style={{
        fontSize: '24px', fontWeight: 900, letterSpacing: '2px',
        background: 'linear-gradient(90deg,#fde68a,#facc15,#f59e0b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>NEURIAL</span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {[['Features','/features'],['Pricing','/pricing'],['Use Cases','/use-cases']].map(([label, path]) => (
          <Link key={path} to={path} style={{ color: 'rgba(254,240,138,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>{label}</Link>
        ))}
        <Link to="/app" style={{
          padding: '8px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
          background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000',
          textDecoration: 'none', border: '2px solid rgba(234,179,8,0.5)',
          boxShadow: '0 4px 6px rgba(250,204,21,0.3)'
        }}>Open App ⚡</Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '64px', fontWeight: 900, letterSpacing: '4px', marginBottom: '16px',
          background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>NEURIAL</h1>
        <p style={{ fontSize: '20px', color: 'rgba(254,240,138,0.8)', marginBottom: '16px' }}>
          ✨ Professional 3D Audio Generator
        </p>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '48px', lineHeight: '1.7' }}>
          Generate custom soundscapes for focus, meditation, sleep and productivity.<br />
          Mix noise colors, nature sounds and binaural beats in real-time.
        </p>
        <Link to="/app" style={{
          display: 'inline-block', padding: '16px 40px', borderRadius: '16px',
          fontWeight: 700, fontSize: '18px',
          background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000',
          textDecoration: 'none', border: '2px solid rgba(234,179,8,0.5)',
          boxShadow: '0 8px 20px rgba(250,204,21,0.4)'
        }}>Start generating audio →</Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '80px' }}>
          {[
            ['🎨', 'Noise Colors', 'White, pink, brown, blue, violet and more'],
            ['🌿', 'Nature Sounds', 'Rain, ocean, fire, forest and 5 more'],
            ['🧠', 'Brainwaves', 'Alpha, theta, delta, beta and gamma waves'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{
              padding: '24px', borderRadius: '16px',
              background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
              <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}