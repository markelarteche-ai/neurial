import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const STRIPE_URL = "https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=" + encodeURIComponent(window.location.origin + "?upgraded=true");

export default function Pricing() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }

        @media (max-width: 768px) {
          html, body, #root { height: auto !important; overflow-y: auto !important; overflow-x: hidden !important; }
          .pricing-page { height: auto !important; overflow-y: auto !important; overflow: visible !important; }
          .pricing-wrap { height: auto !important; overflow: visible !important; padding: 28px 20px 48px 20px !important; align-items: flex-start !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-pro { margin-top: 10px !important; }
        }
      `}</style>
      <Navbar />
      <div className="pricing-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="pricing-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px 60px 32px', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <h1 style={{ fontSize: '34px', fontWeight: 900, margin: '0 0 4px 0', textAlign: 'center', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pricing</h1>
            <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'center' }}>Start free. Upgrade when you need more.</p>
            <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(30,41,59,0.7)', border: '2px solid rgba(71,85,105,0.5)' }}>
                <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>Free</p>
                <p style={{ color: '#475569', fontSize: '28px', fontWeight: 900, margin: '0 0 24px 0' }}>0€</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[['✓','10 minute sessions'],['✓','All noise colors'],['✓','Nature sounds'],['✕','No audio export'],['✕','No commercial use']].map(([icon, text]) => (
                    <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                      <span style={{ color: icon === '✕' ? '#f87171' : '#64748b', flexShrink: 0 }}>{icon}</span>
                      <span style={{ color: icon === '✕' ? '#475569' : '#94a3b8' }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pricing-pro" style={{ padding: '24px', borderRadius: '12px', position: 'relative', background: 'rgba(250,204,21,0.08)', border: '2px solid rgba(250,204,21,0.5)', boxShadow: '0 8px 32px rgba(250,204,21,0.1)' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>RECOMMENDED</div>
                <p style={{ color: '#fde047', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>Pro</p>
                <p style={{ color: '#facc15', fontSize: '28px', fontWeight: 900, margin: '0 0 24px 0' }}>9.99€/month</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Unlimited sessions','Unlimited audio export','WAV 24-bit and MP3 up to 320kbps','Up to 8 hours per export','Commercial use allowed','Royalty-free audio'].map((text) => (
                    <li key={text} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#e2e8f0' }}>
                      <span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>{text}
                    </li>
                  ))}
                </ul>
                <a href={STRIPE_URL} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
                  Upgrade to Pro
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}