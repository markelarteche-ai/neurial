import { Link } from "react-router-dom";

const NAV_LINKS = [["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"]];

function Navbar() {
  return (
    <div style={{ padding: '16px 40px', borderBottom: '1px solid rgba(250,204,21,0.2)', background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <Link to="/" style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>NEURIAL</Link>
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {NAV_LINKS.map(([label, path]) => (
          <Link key={path} to={path} style={{ color: 'rgba(254,240,138,0.7)', textDecoration: 'none', fontSize: '14px' }}>{label}</Link>
        ))}
        <Link to="/app" style={{ padding: '8px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none' }}>Open App</Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`*, *::before, *::after { box-sizing: border-box !important; } html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }`}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 40px', textAlign: 'center', gap: '14px' }}>
        <h1 style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '4px', margin: 0, background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>NEURIAL</h1>
        <p style={{ fontSize: '18px', color: 'rgba(254,240,138,0.8)', margin: 0 }}>Professional 3D Audio Generator</p>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: '1.6', maxWidth: '520px' }}>
          Generate custom soundscapes for focus, meditation, sleep and productivity.<br />
          Mix noise colors, nature sounds and binaural beats in real-time.
        </p>
        <Link to="/app" style={{ display: 'inline-block', padding: '13px 36px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', boxShadow: '0 8px 20px rgba(250,204,21,0.4)', marginTop: '6px' }}>
          Start generating audio
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', width: '100%', maxWidth: '820px', marginTop: '20px' }}>
          {[
            ['🎨', 'Noise Colors', 'White, pink, brown, blue, violet and more'],
            ['🌿', 'Nature Sounds', 'Rain, ocean, fire, forest and 5 more'],
            ['🧠', 'Brainwaves', 'Alpha, theta, delta, beta and gamma waves'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ padding: '20px 16px', borderRadius: '14px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(250,204,21,0.2)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
              <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '14px', margin: '0 0 6px 0' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}