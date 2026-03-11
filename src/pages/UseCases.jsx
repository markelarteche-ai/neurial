import { Link } from "react-router-dom";

const NAV_LINKS = [["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"]];

function Navbar() {
  return (
    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(250,204,21,0.2)', background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

export default function UseCases() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', overflowX: 'hidden' }}>
      <style>{`*, *::before, *::after { box-sizing: border-box !important; } html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }`}</style>
      <Navbar />
      <div style={{ padding: '24px 32px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 900, margin: '0 0 8px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Use Cases</h1>
        <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 32px 0', fontSize: '16px' }}>Neurial adapts to whatever mental state you need.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            ['🎯','Deep Focus and Work','Block distractions and enter flow state with brown or pink noise mixed with beta brainwaves.'],
            ['🧘','Meditation','Calm your mind with theta waves, gentle nature sounds and soft noise layers.'],
            ['😴','Sleep','Fall asleep faster with delta waves, deep brown noise and rain or ocean ambience.'],
            ['🧠','ADHD Support','Structured noise helps regulate attention — especially brown noise with light rain layers.'],
            ['🎵','Content Creation','Generate royalty-free background audio for YouTube, podcasts or streaming.'],
            ['💆','Stress Relief','Decompress after work with calming alpha waves and nature soundscapes.'],
            ['📚','Studying','Maintain concentration during long study sessions without lyrics or distractions.'],
            ['🔇','Tinnitus Masking','Cover ringing with broadband noise across white, blue and violet frequencies.'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ padding: '16px', borderRadius: '8px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
              <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '15px', margin: '0 0 8px 0' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <Link to="/app" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: '16px', fontWeight: 700, fontSize: '18px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', boxShadow: '0 8px 20px rgba(250,204,21,0.4)' }}>
            Try it now
          </Link>
        </div>
      </div>
    </div>
  );
}