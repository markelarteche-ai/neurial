import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const BENEFITS = [
  ['😴', 'Sleep', 'Block out noise and drift into deep, restful sleep with precisely tuned soundscapes.'],
  ['🧠', 'ADHD Focus', 'Reduce distractions and stay locked in for hours using binaural beats and noise layers.'],
  ['👂', 'Tinnitus Relief', 'Mask ringing with noise frequencies matched to your specific tinnitus profile.'],
];

export default function Home() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.5); border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.85); }
        * { scrollbar-width: thin; scrollbar-color: rgba(250,204,21,0.5) transparent; }

        @media (max-width: 768px) {
          .home-title { font-size: 38px !important; letter-spacing: 2px !important; }
          .home-grid { grid-template-columns: 1fr !important; }
          .home-card { flex-direction: row !important; text-align: left !important; align-items: flex-start !important; gap: 14px !important; }
          .home-card-text { text-align: left !important; }
        }
      `}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 32px 80px 32px', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
          <h1 className="home-title" style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '4px', margin: '0 0 10px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NEURIAL</h1>
          <p style={{ fontSize: '17px', color: 'rgba(254,240,138,0.8)', margin: '0 0 8px 0' }}>Professional 3D Audio Generator</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            Mix noise colors, nature sounds and binaural beats in real-time.<br />
            Designed for focus, sleep, relief and peak performance.
          </p>
          <Link to="/app" style={{ display: 'inline-block', padding: '13px 34px', borderRadius: '14px', fontWeight: 700, fontSize: '15px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', boxShadow: '0 8px 20px rgba(250,204,21,0.4)', marginBottom: '28px' }}>
            Start generating audio
          </Link>
          <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {BENEFITS.map(([icon, title, desc]) => (
              <div className="home-card" key={title} style={{ padding: '20px 16px', borderRadius: '14px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                <span style={{ fontSize: '26px', flexShrink: 0 }}>{icon}</span>
                <div className="home-card-text">
                  <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '14px', margin: '0 0 4px 0' }}>{title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}