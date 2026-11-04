import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Share2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getMediaUrl } from '../../api/api';

const NewsDetailPage = () => {
  const { newsId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/news/${newsId}/`)
      .then(({ data }) => { if (active) setArticle(data); })
      .catch(() => { if (active) setError('This news story is unavailable or has been unpublished.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [newsId]);

  const shareArticle = async () => {
    try {
      if (navigator.share) await navigator.share({ title: article.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Could not share this story');
    }
  };

  if (loading) return <main style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading story...</main>;
  if (error || !article) return <main style={{ maxWidth: 850, margin: '0 auto', padding: '56px 24px', color: '#b91c1c' }}><p role="alert">{error || 'News story not found.'}</p><Link to="/news">Back to news</Link></main>;

  return (
    <main style={{ minHeight: '70vh', padding: '48px 24px 80px', background: '#f8fafc' }}>
      <article style={{ maxWidth: 900, margin: '0 auto', borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: '0 12px 36px rgba(15,23,42,.08)' }}>
        {article.image && <img src={getMediaUrl(article.image)} alt="" style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />}
        {article.video && <video src={getMediaUrl(article.video)} controls style={{ width: '100%', maxHeight: 520, display: 'block', background: '#0f172a' }} />}
        <div style={{ padding: 'clamp(24px, 6vw, 56px)' }}>
          <Link to="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}><ArrowLeft size={17} /> All news</Link>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 28, color: '#64748b', fontSize: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Tag size={15} />{article.category}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CalendarDays size={15} />{new Date(article.created_at).toLocaleDateString()}</span>
            {article.author_name && <span>By {article.author_name}</span>}
          </div>
          <h1 style={{ margin: '18px 0 12px', color: '#0f172a', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.15 }}>{article.title}</h1>
          <p style={{ margin: '0 0 28px', color: '#475569', fontSize: 19, lineHeight: 1.6 }}>{article.summary}</p>
          <div style={{ color: '#334155', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{article.content}</div>
          <button type="button" onClick={shareArticle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 32, padding: '11px 16px', border: '1px solid #cbd5e1', borderRadius: 9, background: 'white', color: '#334155', fontWeight: 600, cursor: 'pointer' }}><Share2 size={16} /> Share story</button>
        </div>
      </article>
    </main>
  );
};

export default NewsDetailPage;
