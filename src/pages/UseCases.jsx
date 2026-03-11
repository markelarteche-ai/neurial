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

const USE_CASES = [
  ['🎯','Deep Focus and Work','Block distractions and enter flow state with brown or pink noise mixed with beta brainwaves.'],
  ['🧘','Meditation','Calm your mind with theta waves, gentle nature sounds and soft noise layers.'],
  ['😴','Sleep','Fall asleep faster with delta waves, deep brown noise and rain or ocean ambience.'],
  ['🧠','ADHD Support','Structured noise helps regulate attention — especially brown noise with light rain layers.'],
  ['🎵','Content Creation','Generate royalty-free background audio for YouTube, podcasts or streaming.'],
  ['💆','Stress Relief','Decompress after work with calming alpha waves and nature soundscapes.'],
  ['📚','Studying','Maintain concentration during long study sessions without lyrics or distractions.'],
  ['🔇','Tinnitus Masking','Cover ringing with broadband noise across white, blue and violet frequencies.'],
];

export default function UseCases() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`*, *::before, *::after { box-sizing: border-box !important; } html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }`}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 6px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Use Cases</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: 0, fontSize: '14px' }}>Neurial adapts to whatever mental state you need.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', width: '100%', maxWidth: '960px' }}>
          {USE_CASES.map(([icon, title, desc]) => (
            <div key={title} style={{ padding: '16px 14px', borderRadius: '10px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(250,204,21,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
              <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '12px', margin: '0 0 6px 0' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <Link to="/app" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', boxShadow: '0 8px 20px rgba(250,204,21,0.4)', marginTop: '4px' }}>
          Try it now
        </Link>
      </div>
    </div>
  );
}