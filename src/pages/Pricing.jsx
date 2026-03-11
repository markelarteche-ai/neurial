import { Link } from "react-router-dom";

const NAV_LINKS = [["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"]];
const STRIPE_URL = "https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=" + encodeURIComponent(window.location.origin + "?upgraded=true");

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

export default function Pricing() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`*, *::before, *::after { box-sizing: border-box !important; } html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }`}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 6px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pricing</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: 0, fontSize: '14px' }}>Start free. Upgrade when you need more.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', maxWidth: '700px', alignItems: 'start' }}>
          {/* Free */}
          <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(30,41,59,0.7)', border: '2px solid rgba(71,85,105,0.5)' }}>
            <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '16px', margin: '0 0 4px 0' }}>Free</p>
            <p style={{ color: '#475569', fontSize: '26px', fontWeight: 900, margin: '0 0 18px 0' }}>0€</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[['✓','10 minute sessions'],['✓','All noise colors'],['✓','Nature sounds'],['✕','No audio export'],['✕','No commercial use']].map(([icon, text]) => (
                <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                  <span style={{ color: icon === '✕' ? '#f87171' : '#64748b', flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: icon === '✕' ? '#475569' : '#94a3b8' }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Pro */}
          <div style={{ padding: '24px', borderRadius: '14px', position: 'relative', background: 'rgba(250,204,21,0.08)', border: '2px solid rgba(250,204,21,0.5)', boxShadow: '0 8px 32px rgba(250,204,21,0.1)' }}>
            <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>RECOMMENDED</div>
            <p style={{ color: '#fde047', fontWeight: 700, fontSize: '16px', margin: '0 0 4px 0' }}>Pro</p>
            <p style={{ color: '#facc15', fontSize: '26px', fontWeight: 900, margin: '0 0 18px 0' }}>9.99€/month</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {['Unlimited sessions','Unlimited audio export','WAV 24-bit and MP3 up to 320kbps','Up to 8 hours per export','Commercial use allowed','Royalty-free audio'].map((text) => (
                <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#e2e8f0' }}>
                  <span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>{text}
                </li>
              ))}
            </ul>
            <a href={STRIPE_URL} style={{ display: 'block', width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', textAlign: 'center' }}>
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}