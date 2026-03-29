import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const BENEFITS = [
  ['😴', 'Sleep', 'Block out noise and drift into deep, restful sleep with precisely tuned soundscapes.'],
  ['🧠', 'ADHD Focus', 'Reduce distractions and stay locked in for hours using binaural beats and noise layers.'],
  ['👂', 'Tinnitus Relief', 'Mask ringing with noise frequencies matched to your specific tinnitus profile.'],
];

export default function Home() {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#020617,#0f172a,#020617)',
      fontFamily: 'system-ui,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      // desktop: no scroll / mobile: scroll
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
        padding: isMobile ? '32px 20px 48px 20px' : '0 32px 80px 32px',
        width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: isMobile ? '44px' : '56px',
            fontWeight: 900,
            letterSpacing: isMobile ? '2px' : '4px',
            margin: '0 0 10px 0',
            background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>NEURIAL</h1>
          <p style={{ fontSize: isMobile ? '15px' : '17px', color: 'rgba(254,240,138,0.8)', margin: '0 0 8px 0' }}>
            Professional 3D Audio Generator
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 28px 0', lineHeight: '1.6' }}>
            Mix noise colors, nature sounds and binaural beats in real-time.<br />
            Designed for focus, sleep, relief and peak performance.
          </p>
          <Link to="/app" style={{
            display: 'inline-block',
            padding: isMobile ? '14px 32px' : '13px 34px',
            borderRadius: '14px', fontWeight: 700,
            fontSize: isMobile ? '16px' : '15px',
            background: 'linear-gradient(to right,#facc15,#fde047)',
            color: '#000', textDecoration: 'none',
            boxShadow: '0 8px 20px rgba(250,204,21,0.4)',
            marginBottom: '32px',
          }}>
            Start generating audio
          </Link>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '14px',
          }}>
            {BENEFITS.map(([icon, title, desc]) => (
              <div key={title} style={{
                padding: '20px 16px', borderRadius: '14px',
                background: 'rgba(30,41,59,0.5)',
                border: '2px solid rgba(250,204,21,0.2)',
                display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'flex-start' : 'center',
                textAlign: isMobile ? 'left' : 'center',
                gap: isMobile ? '14px' : '8px',
              }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{icon}</span>
                <div>
                  <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '15px', margin: '0 0 4px 0' }}>{title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}