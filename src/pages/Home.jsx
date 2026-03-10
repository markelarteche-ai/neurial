import { Link } from "react-router-dom";

const NAV_LINKS = [["Features", "/features"], ["Pricing", "/pricing"], ["Use Cases", "/use-cases"]];

function Navbar() {
  return (
    <div style={{ width: "100%", borderBottom: "1px solid rgba(250,204,21,0.2)", background: "linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))" }}>
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "2px", background: "linear-gradient(90deg,#fde68a,#facc15,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>NEURIAL</Link>
        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          {NAV_LINKS.map(([label, path]) => (
            <Link key={path} to={path} style={{ color: "rgba(254,240,138,0.7)", textDecoration: "none", fontSize: "14px" }}>{label}</Link>
          ))}
          <Link to="/app" style={{ padding: "8px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", background: "linear-gradient(to right,#facc15,#fde047)", color: "#000", textDecoration: "none" }}>Open App</Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#020617)", fontFamily: "system-ui,sans-serif", overflowX: "hidden" }}>
      <Navbar />
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "64px", fontWeight: 900, letterSpacing: "4px", marginBottom: "16px", background: "linear-gradient(to right,#fef9c3,#fde047,#facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NEURIAL</h1>
        <p style={{ fontSize: "20px", color: "rgba(254,240,138,0.8)", marginBottom: "16px" }}>Professional 3D Audio Generator</p>
        <p style={{ fontSize: "16px", color: "#94a3b8", marginBottom: "48px", lineHeight: "1.7" }}>
          Generate custom soundscapes for focus, meditation, sleep and productivity.
          Mix noise colors, nature sounds and binaural beats in real-time.
        </p>
        <Link to="/app" style={{ display: "inline-block", padding: "16px 40px", borderRadius: "16px", fontWeight: 700, fontSize: "18px", background: "linear-gradient(to right,#facc15,#fde047)", color: "#000", textDecoration: "none", boxShadow: "0 8px 20px rgba(250,204,21,0.4)" }}>
          Start generating audio
        </Link>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginTop: "80px", padding: "0 32px" }}>
          {[
            ["🎨", "Noise Colors", "White, pink, brown, blue, violet and more"],
            ["🌿", "Nature Sounds", "Rain, ocean, fire, forest and 5 more"],
            ["🧠", "Brainwaves", "Alpha, theta, delta, beta and gamma waves"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ padding: "24px", borderRadius: "16px", background: "rgba(30,41,59,0.5)", border: "2px solid rgba(250,204,21,0.2)" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
              <h3 style={{ color: "#fef08a", fontWeight: 700, fontSize: "16px", margin: "0 0 8px 0" }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}