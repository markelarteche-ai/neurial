import { Link } from "react-router-dom";

const NAV_LINKS = [["Home", "/"], ["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"], ["Blog", "/blog"]];

export default function Navbar() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .neurial-navbar {
            padding: 12px 16px !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .neurial-nav-links {
            gap: 14px !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            width: 100% !important;
          }
          .neurial-nav-links::-webkit-scrollbar {
            display: none !important;
          }
          .neurial-nav-link {
            font-size: 13px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .neurial-open-app {
            padding: 6px 12px !important;
            font-size: 13px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
      <div
        className="neurial-navbar"
        style={{
          width: '100%',
          padding: '20px 32px',
          background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '2px',
            background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          NEURIAL
        </Link>

        <div
          className="neurial-nav-links"
          style={{ display: 'flex', gap: '28px', alignItems: 'center' }}
        >
          {NAV_LINKS.map(([label, path]) => (
            <Link
              key={path}
              to={path}
              className="neurial-nav-link"
              style={{
                color: 'rgba(254,240,138,0.7)',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/app"
            className="neurial-open-app"
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              background: 'linear-gradient(to right,#facc15,#fde047)',
              color: '#000',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Open App
          </Link>
        </div>
      </div>
    </>
  );
}