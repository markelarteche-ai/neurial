import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/Navbar";
import { getPostBySlug } from "../hooks/useBlogPosts";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#94a3b8', fontSize: '18px' }}>Article not found.</p>
          <Link to="/blog" style={{ color: '#facc15', textDecoration: 'none', fontSize: '14px' }}>← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        .article-body p { color: #cbd5e1; font-size: 16px; line-height: 2; margin: 0 0 28px 0; text-align: center; }
        .article-body h2 { color: #fef08a; font-size: 24px; font-weight: 700; margin: 48px 0 16px 0; text-align: center; }
        .article-body h3 { color: #fef08a; font-size: 19px; font-weight: 700; margin: 36px 0 12px 0; text-align: center; }
        .article-body ul, .article-body ol { color: #cbd5e1; font-size: 16px; line-height: 1.9; padding-left: 24px; margin: 0 0 28px 0; text-align: center; list-style-position: inside; }
        .article-body li { margin-bottom: 8px; }
        .article-body strong { color: #fef08a; font-weight: 600; }
      `}</style>
      <Navbar />



      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 32px 100px 32px' }}>
        <div style={{ width: '100%', maxWidth: '680px', textAlign: 'center' }}>
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <Link to="/blog" style={{ color: 'rgba(250,204,21,0.6)', textDecoration: 'none', fontSize: '13px' }}>← Back to Blog</Link>
          </div>
          <p style={{ color: 'rgba(254,240,138,0.4)', fontSize: '13px', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>{post.date}</p>
          <h1 style={{ fontSize: '40px', fontWeight: 900, margin: '0 0 48px 0', background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.15 }}>
            {post.title}
          </h1>
          <div className="article-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          <div style={{ marginTop: '64px', padding: '32px', borderRadius: '14px', background: 'rgba(250,204,21,0.06)', border: '2px solid rgba(250,204,21,0.25)' }}>
            <p style={{ color: '#fef08a', fontWeight: 700, fontSize: '17px', margin: '0 0 10px 0' }}>Try it yourself in Neurial</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>Build your perfect audio environment for focus, sleep or relief.</p>
            <Link to="/app" style={{ display: 'inline-block', padding: '16px 48px', borderRadius: '12px', fontWeight: 700, fontSize: '17px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', textDecoration: 'none' }}>
              Open the generator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}