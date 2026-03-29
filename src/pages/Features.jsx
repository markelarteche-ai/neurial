import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const FEATURES = [
  ['🎨', 'Noise Color Mixer', 'Mix 8 noise types — white, pink, brown, grey, blue, violet, black and green — each with individual intensity, volume and texture controls.'],
  ['🌿', 'Nature Sound Layers', 'Layer rain, thunderstorm, ocean waves, wind, campfire, waterfall, river, night forest or nightingale over your noise mix.'],
  ['🧠', 'Binaural Brainwave Entrainment', 'Precisely tuned binaural beats with adjustable carrier and beat frequencies to guide your brain into alpha, theta, delta, beta or gamma states.'],
  ['⚡', 'Real-time Audio Engine', 'Built on a custom AudioWorklet engine. Every parameter updates instantly — no restarts, no interruptions, no latency.'],
  ['💾', 'High-Quality Export', 'Export up to 8 hours of audio as WAV 24-bit at 44.1kHz or 48kHz, or MP3 up to 320kbps.'],
  ['🎛️', 'Professional Processing', 'Stereo width control, harmonic saturation, spectral drift, temporal smoothing and advanced mixing for audiophiles and professionals.'],
];

export default function Features() {
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
        padding: isMobile ? '28px 20px 48px 20px' : '10px 32px 50px 32px',
        width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: '700px' }}>
          <h1 style={{
            fontSize: isMobile ? '30px' : '34px',
            fontWeight: 900, margin: '0 0 4px 0', textAlign: 'center',
            background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Features</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'center' }}>
            Everything under the hood.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {FEATURES.map(([icon, title, desc]) => (
              <div key={title} style={{
                padding: isMobile ? '14px 16px' : '11px 20px',
                borderRadius: '10px',
                background: 'rgba(30,41,59,0.5)',
                border: '2px solid rgba(250,204,21,0.2)',
                borderLeft: '4px solid #facc15',
                textAlign: isMobile ? 'left' : 'center',
              }}>
                <h3 style={{ color: '#fef08a', fontWeight: 700, fontSize: '14px', margin: '0 0 4px 0' }}>
                  {icon} {title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}