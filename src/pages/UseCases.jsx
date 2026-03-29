import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const CASES = [
  ['🎯','Deep Focus','Block distractions and enter flow state with brown or pink noise mixed with beta brainwaves.'],
  ['🧘','Meditation','Calm your mind with theta waves, gentle nature sounds and soft noise layers.'],
  ['😴','Sleep','Fall asleep faster with delta waves, deep brown noise and rain or ocean ambience.'],
  ['🧠','ADHD Support','Structured noise helps regulate attention — especially brown noise with light rain layers.'],
  ['🎵','Content Creation','Generate royalty-free background audio for YouTube, podcasts or streaming.'],
  ['💆','Stress Relief','Decompress after work with calming alpha waves and nature soundscapes.'],
  ['📚','Studying','Maintain concentration during long study sessions without lyrics or distractions.'],
  ['🔇','Tinnitus Masking','Cover ringing with broadband noise across white, blue and violet frequencies.'],
  ['▶️','Try it now', null],
];

export default function UseCases() {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#020617,#0f172a,#020617)',
      fontFamily: 'system-ui,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      height: isMobile ? undefined : '100vh',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        html, body, #root {
          height: ${isMobile ? 'auto' : '100%'} !important;
          overflow: ${isMobile ? 'visible' : 'hidden'} !important;
        }
      `}</style>
      <Navbar />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '28px 20px 48px 20px' : '0 32px 60px 32px',
        width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: '960px' }}>
          <h1 style={{
            fontSize: isMobile ? '30px' : '32px',
            fontWeight: 900, margin: '0 0 4px 0', textAlign: 'center',
            background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Use Cases</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'center' }}>
            Neurial adapts to whatever mental state you need.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : '10px',
          }}>
            {CASES.map(([icon, title, desc]) =>
              desc === null ? (
                <Link key={title} to="/app" style={{
                  padding: '16px', borderRadius: '10px',
                  background: 'linear-gradient(to right,#facc15,#fde047)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: '6px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px rgba(250,204,21,0.3)',
                  minHeight: isMobile ? '80px' : undefined,
                }}>
                  <span style={{ fontSize: '22px' }}>🚀</span>
                  <span style={{ color: '#000', fontWeight: 700, fontSize: '14px' }}>Try it now</span>
                </Link>
              ) : (
                <div key={title} style={{
                  padding: isMobile ? '14px 12px' : '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(30,41,59,0.5)',
                  border: '2px solid rgba(250,204,21,0.2)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center', gap: '5px',
                }}>
                  <span style={{ fontSize: '20px' }}>{icon}</span>
                  <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: isMobile ? '13px' : '12px', margin: 0 }}>{title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: isMobile ? '11px' : '11px', lineHeight: '1.4', margin: 0 }}>{desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}