const modules = import.meta.glob("/src/content/blog/*.md", { query: '?raw', import: 'default', eager: true });

function parseFrontmatter(raw) {
  if (!raw || typeof raw !== 'string') return { data: {}, content: '' };
  
  const lines = raw.split(/\r?\n/);
  if (lines[0].trim() !== '---') return { data: {}, content: raw.trim() };
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { endIndex = i; break; }
  }
  if (endIndex === -1) return { data: {}, content: raw.trim() };

  const data = {};
  for (let i = 1; i < endIndex; i++) {
    const colonIndex = lines[i].indexOf(':');
    if (colonIndex === -1) continue;
    const key = lines[i].slice(0, colonIndex).trim();
    const value = lines[i].slice(colonIndex + 1).trim();
    data[key] = value;
  }

  const content = lines.slice(endIndex + 1).join('\n').trim();
  return { data, content };
}

export function getAllPosts() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw);
      const slug = data.slug || path.split('/').pop().replace('.md', '');
      return { ...data, slug, content };
    })
    .filter(p => p.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPostBySlug(slug) {
  for (const [path, raw] of Object.entries(modules)) {
    const { data, content } = parseFrontmatter(raw);
    const fileSlug = path.split('/').pop().replace('.md', '');
    const postSlug = data.slug || fileSlug;
    if (postSlug === slug || fileSlug === slug) {
      return { ...data, slug: postSlug, content };
    }
  }
  return null;
}