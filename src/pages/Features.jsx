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
  ['🎨', 'Noise Color Mixer', 'Mix white, pink, brown, grey, blue, violet, black and green noise in real-time with individual intensity, volume and texture controls.'],
  ['🌿', 'Nature Sound Layers', 'Add rain, thunderstorm, ocean waves, wind, campfire, waterfall, river, night forest or nightingale on top of your noise mix.'],
  ['🧠', 'Binaural Brainwave Entrainment', 'Guide your brain into alpha, theta, delta, beta or gamma states using precise binaural beats with adjustable carrier and beat frequencies.'],
  ['⚡', 'Real-time Audio Engine', 'All changes update instantly while playing — no restarts, no interruptions. Powered by a custom AudioWorklet engine.'],
  ['💾', 'High-Quality Export', 'Export your session as WAV 24-bit (44.1kHz or 48kHz) or MP3 up to 320kbps for up to 8 hours of audio.'],
  ['🎛️', 'Professional Processing', 'Stereo width, harmonic saturation, spectral drift, temporal smoothing and more advanced controls for audio professionals.'],
];

export default function Features() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
      `}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 32px' }}>
        <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 8px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Features</h1>
            <p style={{ color: 'rgba(254,240,138,0.6)', margin: 0, fontSize: '14px' }}>Everything you need to create the perfect audio environment.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {FEATURES.map(([icon, title, desc]) => (
              <div key={title} style={{ padding: '20px', borderRadius: '12px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>{icon}</span>
                <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '14px', margin: 0 }}>{title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}