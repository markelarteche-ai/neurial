import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(250,204,21,0.2)', background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(90deg,#fde68a,#facc15,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>NEURIAL</Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {[['Features','/features'],['Pricing','/pricing'],['Use Cases','/use-cases']].map(([label, path]) => (
          <Link key={path} to={path} style={{ color: 'rgba(254,240,138,0.7)', textDecoration: 'none', fontSize: '14px' }}>{label}</Link>
        ))}
        <Link to="/app" style={{ padding: '8px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none' }}>Open App ⚡</Link>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '8px', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pricing</h1>
        <p style={{ color: 'rgba(254,240,138,0.6)', marginBottom: '48px', fontSize: '16px' }}>Start free. Upgrade when you need more.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'left' }}>
          <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(30,41,59,0.7)', border: '2px solid rgba(71,85,105,0.5)' }}>
            <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>Free</p>
            <p style={{ color: '#475569', fontSize: '28px', fontWeight: 900, margin: '0 0 24px 0' }}>€0</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['✓','10 minute sessions'],['✓','All noise colors'],['✓','Nature sounds'],['✕','No audio export'],['✕','No commercial use']].map(([icon, text]) => (
                <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: icon === '✕' ? '#475569' : '#94a3b8' }}>
                  <span style={{ color: icon === '✕' ? '#f87171' : '#64748b', flexShrink: 0 }}>{icon}</span>{text}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ padding: '32px', borderRadius: '20px', position: 'relative', background: 'rgba(250,204,21,0.08)', border: '2px solid rgba(250,204,21,0.5)', boxShadow: '0 8px 32px rgba(250,204,21,0.1)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>RECOMMENDED</div>
            <p style={{ color: '#fde047', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>Pro</p>
            <p style={{ color: '#facc15', fontSize: '28px', fontWeight: 900, margin: '0 0 24px 0' }}>€9.99<span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(250,204,21,0.6)' }}>/month</span></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Unlimited sessions','Unlimited audio export','WAV 24-bit & MP3 up to 320kbps','Up to 8 hours per export','Commercial use allowed','Royalty-free audio'].map(text => (
                <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#e2e8f0' }}>
                  <span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>{text}
                </li>
              ))}
            </ul>
            <a href={`https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=${encodeURIComponent(window.location.origin + '?upgraded=true')}`}
              style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
              ⚡ Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}