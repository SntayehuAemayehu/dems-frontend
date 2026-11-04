import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Search, Tag } from 'lucide-react';
import api, { getMediaUrl } from '../../api/api';

const getArticles = (data) => Array.isArray(data) ? data : data?.results || [];

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/news/')
      .then(({ data }) => {
        if (active) setArticles(getArticles(data).filter((article) => (
          article.is_published
          || (article.scheduled_for && new Date(article.scheduled_for) <= new Date())
        )));
      })
      .catch(() => {
        if (active) setError('News could not be loaded. Please try again later.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(articles.map((article) => article.category).filter(Boolean))],
    [articles]
  );
  const filteredArticles = articles.filter((article) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${article.title} ${article.summary} ${article.content}`.toLowerCase().includes(term);
    return matchesSearch && (category === 'All' || article.category === category);
  });

  return (
    <main style={{ minHeight: '70vh', padding: '56px 24px 80px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ marginBottom: 32 }}>
          <span style={{ color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Campus updates</span>
          <h1 style={{ margin: '10px 0', color: '#0f172a', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>News & announcements</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 17 }}>The latest updates, stories, and announcements from DEMS.</p>
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <label style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={18} style={{ position: 'absolute', top: 13, left: 13, color: '#94a3b8' }} />
            <input aria-label="Search news" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search news..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px', border: '1px solid #cbd5e1', borderRadius: 10, background: 'white' }} />
          </label>
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} style={{ minWidth: 170, padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, background: 'white', color: '#334155' }}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {loading ? <p style={{ color: '#64748b' }}>Loading news...</p> : error ? (
          <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>
        ) : filteredArticles.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 22 }}>
            {filteredArticles.map((article) => (
              <article key={article.id} style={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', boxShadow: '0 8px 24px rgba(15,23,42,.05)' }}>
                <Link to={`/news/${article.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {article.image ? <img src={getMediaUrl(article.image)} alt="" style={{ display: 'block', width: '100%', height: 210, objectFit: 'cover' }} /> : article.video ? <video src={getMediaUrl(article.video)} controls preload="metadata" style={{ display: 'block', width: '100%', height: 210, objectFit: 'cover', background: '#0f172a' }} /> : <div style={{ height: 210, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#e0e7ff,#cffafe)', color: '#4338ca', fontSize: 38, fontWeight: 800 }}>DEMS</div>}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Tag size={14} />{article.category}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={14} />{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                    <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 20 }}>{article.title}</h2>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.65 }}>{article.summary}</p>
                    <span style={{ display: 'inline-block', marginTop: 16, color: '#4f46e5', fontWeight: 700 }}>Read story →</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : <div style={{ padding: 36, textAlign: 'center', borderRadius: 14, background: 'white', color: '#64748b' }}>No news articles match your search.</div>}
      </div>
    </main>
  );
};

export default NewsPage;
