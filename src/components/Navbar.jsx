import { Link } from "react-router-dom";

const NAV_LINKS = [["Home", "/"], ["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"], ["Blog", "/blog"]];

export default function Navbar() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .neurial-navbar {
            padding: 12px 16px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .neurial-nav-links {
            width: 100% !important;
            gap: 0 !important;
            justify-content: space-between !important;
          }
          .neurial-nav-link {
            font-size: 12px !important;
            white-space: nowrap !important;
          }
          .neurial-open-app {
            padding: 5px 10px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
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
            Open
          </Link>
        </div>
      </div>
    </>
  );
}