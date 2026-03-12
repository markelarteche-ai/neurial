import { Link } from "react-router-dom";

const NAV_LINKS = [["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"]];

function Navbar() {
  return (
    <div style={{ width: '100%', padding: '20px 32px', borderBottom: '1px solid rgba(250,204,21,0.2)', background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
      <Link to="/" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>NEURIAL</Link>
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {NAV_LINKS.map(([label, path]) => (
          <Link key={path} to={path} style={{ color: 'rgba(254,240,138,0.7)', textDecoration: 'none', fontSize: '14px' }}>{label}</Link>
        ))}
        <Link to="/app" style={{ padding: '8px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none' }}>Open App</Link>
      </div>
    </div>
  );
}

const FEATURES = [
  ['🎨', 'Noise Colors', 'White, pink, brown, grey, blue, violet, black and green noise.'],
  ['🌿', 'Nature Sounds', 'Rain, ocean, fire, wind, waterfall, river, forest and more.'],
  ['🧠', 'Brainwaves', 'Alpha, theta, delta, beta and gamma binaural beats.'],
  ['⚡', 'Real-time Engine', 'All changes apply instantly while playing.'],
  ['💾', 'Export', 'WAV 24-bit or MP3 up to 320kbps, up to 8 hours.'],
  ['🎛️', 'Processing', 'Stereo width, saturation, spectral drift and more.'],
];

export default function Features() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
      `}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        <div style={{ margin: 'auto', width: '100%', maxWidth: '900px', padding: '0 32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 900, margin: '0 0 6px 0', textAlign: 'center', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Features</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'center' }}>Everything you need to create the perfect audio environment.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {FEATURES.map(([icon, title, desc]) => (
              <div key={title} style={{ padding: '24px 16px', borderRadius: '12px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>{icon}</span>
                <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '14px', margin: 0 }}>{title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}