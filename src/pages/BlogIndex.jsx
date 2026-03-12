import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAllPosts } from "../hooks/useBlogPosts";

const POSTS = getAllPosts();

export default function BlogIndex() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`*, *::before, *::after { box-sizing: border-box !important; } html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }`}</style>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px 32px 80px 32px' }}>
        <div style={{ width: '100%', maxWidth: '700px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 900, margin: '0 0 8px 0', textAlign: 'center', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Neurial Blog</h1>
          <p style={{ color: 'rgba(254,240,138,0.6)', margin: '0 0 36px 0', fontSize: '14px', textAlign: 'center' }}>Learn how sound can improve sleep, focus, productivity and mental clarity.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {POSTS.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}
                style={{ padding: '22px 28px', borderRadius: '12px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)', textDecoration: 'none', display: 'block', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(250,204,21,0.6)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(250,204,21,0.2)'}
              >
                <h2 style={{ color: '#fef08a', fontWeight: 700, fontSize: '17px', margin: '0 0 8px 0' }}>{post.title}</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', margin: '0 0 6px 0' }}>{post.description}</p>
                <span style={{ color: 'rgba(254,240,138,0.3)', fontSize: '12px' }}>{post.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}