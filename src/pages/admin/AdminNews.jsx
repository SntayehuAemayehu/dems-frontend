import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Edit3, Eye, Image, Newspaper, Search, Star, Trash2, Upload, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getAllPages, getMediaUrl } from '../../api/api';

const emptyForm = { title: '', summary: '', content: '', category: 'Announcement', is_published: false, is_featured: false };

const getApiErrorMessage = (error) => {
  const data = error.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (data && typeof data === 'object') {
    const firstError = Object.entries(data).find(([, value]) => value);
    if (firstError) return `${firstError[0]}: ${Array.isArray(firstError[1]) ? firstError[1].join(', ') : firstError[1]}`;
  }
  return error.response?.status
    ? `Request failed (${error.response.status}). Please try again.`
    : 'Could not connect to the server. Please try again.';
};

const AdminNews = () => {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const loadArticles = async () => {
    try {
      setArticles(await getAllPages('/news/'));
    } catch (error) {
      console.error('Failed to load news articles:', error);
      toast.error('Could not load news articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, []);

  const filteredArticles = useMemo(() => articles.filter((article) => {
    const matchesSearch = `${article.title} ${article.summary} ${article.category}`.toLowerCase().includes(search.toLowerCase());
    const isScheduled = article.scheduled_for && new Date(article.scheduled_for) > new Date() && !article.is_published;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'published' && (article.is_published || (article.scheduled_for && new Date(article.scheduled_for) <= new Date())))
      || (statusFilter === 'scheduled' && isScheduled)
      || (statusFilter === 'draft' && !article.is_published && !isScheduled);
    return matchesSearch && matchesStatus;
  }), [articles, search, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setImage(null);
    setVideo(null);
    setEditingId(null);
    setScheduleDate('');
    setShowScheduleModal(false);
  };

  const startEditing = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title || '',
      summary: article.summary || '',
      content: article.content || '',
      category: article.category || 'Announcement',
      is_published: article.is_published,
      is_featured: article.is_featured,
    });
    setScheduleDate(article.scheduled_for ? new Date(new Date(article.scheduled_for).getTime() - new Date(article.scheduled_for).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
    setImage(null);
    setVideo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitArticle = async (event, scheduledFor = '') => {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error('Add a title, summary, and story text before saving');
      return;
    }
    if ((image && image.size > 10 * 1024 * 1024) || (video && video.size > 50 * 1024 * 1024)) {
      toast.error('Images must be 10 MB or smaller and videos 50 MB or smaller');
      return;
    }
    if (scheduledFor && new Date(scheduledFor) <= new Date()) {
      toast.error('Choose a future date and time to schedule this story');
      return;
    }
    const body = new FormData();
    Object.entries({ ...form, is_published: scheduledFor ? false : form.is_published }).forEach(([key, value]) => body.append(key, value));
    if (scheduledFor) body.append('scheduled_for', new Date(scheduledFor).toISOString());
    else if (!editingId) body.append('scheduled_for', '');
    if (image) body.append('image', image);
    if (video) body.append('video', video);

    setSaving(true);
    try {
      if (editingId) await api.patch(`/news/${editingId}/`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/news/', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(scheduledFor ? 'News story scheduled' : editingId ? 'News updated' : 'News article created');
      resetForm();
      await loadArticles();
    } catch (error) {
      console.error('Failed to save news article:', error);
      toast.error(`Could not save this article: ${getApiErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = async (article, field) => {
    try {
      await api.patch(`/news/${article.id}/`, { [field]: !article[field] });
      await loadArticles();
      toast.success(field === 'is_published' ? (article.is_published ? 'Article unpublished' : 'Article published') : 'Featured setting updated');
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      toast.error('Could not update this article');
    }
  };

  const deleteArticle = async () => {
    try {
      await api.delete(`/news/${deletingId}/`);
      setDeletingId(null);
      await loadArticles();
      toast.success('Article deleted');
    } catch (error) {
      console.error('Failed to delete news article:', error);
      toast.error('Could not delete this article');
    }
  };

  const labelStyle = { display: 'block', marginBottom: 6, color: '#334155', fontSize: 14, fontWeight: 600 };
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 9, background: 'white', color: '#0f172a', font: 'inherit' };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <header style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4f46e5' }}><Newspaper size={25} /><span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Content management</span></div>
        <h1 style={{ margin: '8px 0', color: '#0f172a', fontSize: 30 }}>News & announcements</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Publish stories, updates, images, and video for the DEMS community.</p>
      </header>

      <form onSubmit={submitArticle} style={{ marginBottom: 32, padding: 24, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white', boxShadow: '0 6px 20px rgba(15,23,42,.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>{editingId ? 'Edit news story' : 'Create news story'}</h2>
          {editingId && <button type="button" onClick={resetForm} aria-label="Cancel edit" style={{ border: 0, background: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          <label><span style={labelStyle}>Title</span><input style={inputStyle} maxLength={200} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Story headline" /></label>
          <label><span style={labelStyle}>Category</span><input style={inputStyle} maxLength={80} required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Announcement" /></label>
        </div>
        <label style={{ display: 'block', marginTop: 16 }}><span style={labelStyle}>Summary</span><textarea style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }} maxLength={400} required value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="A short overview shown on news cards" /></label>
        <label style={{ display: 'block', marginTop: 16 }}><span style={labelStyle}>Story text</span><textarea style={{ ...inputStyle, minHeight: 170, resize: 'vertical' }} required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Write the full news story..." /></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'block', padding: 14, border: '1px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer' }}><span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}><Image size={17} />Cover image (max 10 MB)</span><input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />{image && <small style={{ display: 'block', marginTop: 7, color: '#475569' }}>{image.name}</small>}</label>
          <label style={{ display: 'block', padding: 14, border: '1px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer' }}><span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}><Video size={17} />Video (max 50 MB)</span><input type="file" accept="video/*" onChange={(event) => setVideo(event.target.files?.[0] || null)} />{video && <small style={{ display: 'block', marginTop: 7, color: '#475569' }}>{video.name}</small>}</label>
        </div>
        {editingId && <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>Leave the file inputs empty to keep the current media.</p>}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '18px 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155' }}><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />Publish now</label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155' }}><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} />Feature this story</label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button disabled={saving} type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', border: 0, borderRadius: 9, background: saving ? '#94a3b8' : '#4f46e5', color: 'white', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}><Upload size={17} />{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create story'}</button>
          <button disabled={saving} type="button" onClick={() => setShowScheduleModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', border: '1px solid #c7d2fe', borderRadius: 9, background: '#eef2ff', color: '#4338ca', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}><CalendarClock size={17} />Schedule news</button>
        </div>
      </form>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 21 }}>Your stories ({articles.length})</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} /><input aria-label="Search stories" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." style={{ ...inputStyle, width: 210, paddingLeft: 32 }} /></label>
            <select aria-label="Filter stories by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ ...inputStyle, width: 150 }}><option value="all">All stories</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="draft">Drafts</option></select>
          </div>
        </div>
        {loading ? <p style={{ color: '#64748b' }}>Loading stories...</p> : filteredArticles.length === 0 ? <p style={{ padding: 24, borderRadius: 10, background: 'white', color: '#64748b' }}>No stories found.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredArticles.map((article) => (
              <article key={article.id} style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', padding: 14, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
                {article.image ? <img src={getMediaUrl(article.image)} alt="" style={{ width: 92, height: 70, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 92, height: 70, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#eef2ff', color: '#4f46e5' }}>{article.video ? <Video size={22} /> : <Newspaper size={22} />}</div>}
                <div style={{ flex: '1 1 240px' }}><h3 style={{ margin: '0 0 5px', color: '#0f172a' }}>{article.title}</h3><p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{article.category} · {new Date(article.created_at).toLocaleDateString()}</p></div>
                <span style={{ padding: '5px 9px', borderRadius: 99, background: article.is_published ? '#dcfce7' : article.scheduled_for && new Date(article.scheduled_for) > new Date() ? '#e0e7ff' : '#f1f5f9', color: article.is_published ? '#15803d' : article.scheduled_for && new Date(article.scheduled_for) > new Date() ? '#4338ca' : '#64748b', fontSize: 12, fontWeight: 700 }}>{article.is_published ? 'Published' : article.scheduled_for && new Date(article.scheduled_for) > new Date() ? `Scheduled · ${new Date(article.scheduled_for).toLocaleString()}` : 'Draft'}</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" title={article.is_featured ? 'Unfeature story' : 'Feature story'} onClick={() => toggleFlag(article, 'is_featured')} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', color: article.is_featured ? '#d97706' : '#64748b', cursor: 'pointer' }}><Star size={16} fill={article.is_featured ? 'currentColor' : 'none'} /></button>
                  {article.is_published && <a title="View story" href={`/news/${article.id}`} target="_blank" rel="noreferrer" style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, color: '#475569' }}><Eye size={16} /></a>}
                  {(!article.scheduled_for || new Date(article.scheduled_for) <= new Date()) && <button type="button" title={article.is_published ? 'Unpublish' : 'Publish'} onClick={() => toggleFlag(article, 'is_published')} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{article.is_published ? 'Unpublish' : 'Publish'}</button>}
                  <button type="button" title="Edit story" onClick={() => startEditing(article)} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#475569', cursor: 'pointer' }}><Edit3 size={16} /></button>
                  <button type="button" title="Delete story" onClick={() => setDeletingId(article.id)} style={{ padding: 8, border: '1px solid #fee2e2', borderRadius: 8, background: 'white', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deletingId && <div role="dialog" aria-modal="true" aria-labelledby="delete-news-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,23,42,.55)' }} onClick={() => setDeletingId(null)}><div style={{ width: 'min(420px, 100%)', padding: 24, borderRadius: 14, background: 'white' }} onClick={(event) => event.stopPropagation()}><h2 id="delete-news-title" style={{ marginTop: 0 }}>Delete this story?</h2><p style={{ color: '#64748b' }}>This action cannot be undone.</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={() => setDeletingId(null)} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={deleteArticle} style={{ padding: '9px 14px', border: 0, borderRadius: 8, background: '#dc2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Delete</button></div></div></div>}
      {showScheduleModal && <div role="dialog" aria-modal="true" aria-labelledby="schedule-news-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,23,42,.55)' }} onClick={() => !saving && setShowScheduleModal(false)}><div style={{ width: 'min(460px, 100%)', padding: 24, borderRadius: 14, background: 'white' }} onClick={(event) => event.stopPropagation()}><h2 id="schedule-news-title" style={{ margin: '0 0 8px', color: '#0f172a' }}>Schedule news</h2><p style={{ margin: '0 0 18px', color: '#64748b' }}>Choose when this story should become visible to everyone.</p><form onSubmit={(event) => submitArticle(event, scheduleDate)}><label style={{ ...labelStyle, marginBottom: 18 }}>Publish date and time<input type="datetime-local" required min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} style={{ ...inputStyle, display: 'block', marginTop: 7 }} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" disabled={saving} onClick={() => setShowScheduleModal(false)} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Cancel</button><button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', border: 0, borderRadius: 8, background: '#4f46e5', color: 'white', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}><CalendarClock size={16} />{saving ? 'Scheduling...' : 'Schedule story'}</button></div></form></div></div>}
    </main>
  );
};

export default AdminNews;
