import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import api, { getMediaUrl } from '../../api/api';

const ProctoringImagesPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [examType, setExamType] = useState('QUIZ');
  const [students, setStudents] = useState([]);
  const [student, setStudent] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/courses/').then(({ data }) => {
      const courses = Array.isArray(data) ? data : data?.results || [];
      const found = courses.find((item) => Number(item.id) === Number(courseId));
      if (active) setCourse(found || null);
    }).catch((requestError) => {
      console.error('Failed to load course for proctoring images:', requestError);
    });
    return () => { active = false; };
  }, [courseId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { exam_type: examType, ...(student ? { student_id: student.id } : {}) };
    api.get(`/exams/course/${courseId}/proctoring-images/`, { params })
      .then(({ data }) => {
        if (!active) return;
        setImages(data.images || []);
        if (!student) setStudents(data.students || []);
      })
      .catch((requestError) => {
        console.error('Failed to load proctoring images:', requestError);
        if (active) setError(requestError.response?.data?.error || 'Failed to load proctoring images.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, examType, student]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Link to="/teacher/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}><ArrowLeft size={17} /> Back to exams</Link>
      <header style={{ margin: '22px 0' }}><h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, color: '#0f172a' }}><Camera size={25} /> Proctoring images</h1><p style={{ margin: '6px 0 0', color: '#64748b' }}>{course?.title || 'Course'} · Review captured student images by exam type.</p></header>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        { [['QUIZ', 'Quiz'], ['MID', 'Midterm'], ['FINAL', 'Final']].map(([value, label]) => <button key={value} type="button" onClick={() => { setStudent(null); setExamType(value); }} aria-pressed={examType === value} style={{ padding: '9px 16px', border: 0, borderRadius: 8, background: examType === value ? '#2563eb' : '#e2e8f0', color: examType === value ? 'white' : '#334155', fontWeight: 700, cursor: 'pointer' }}>{label}</button>)}
      </div>
      {error && <p role="alert" style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>{error}</p>}
      {loading ? <p style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading captured images...</p> : student ? (
        <section>
          <button type="button" onClick={() => setStudent(null)} style={{ marginBottom: 14, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', color: '#334155', cursor: 'pointer' }}>All students</button>
          <h2 style={{ color: '#0f172a' }}>{student.name}{student.student_id ? ` (${student.student_id})` : ''}</h2>
          {images.length === 0 ? <p style={{ color: '#64748b' }}>No images found for this student.</p> : <ImageGrid images={images} />}
        </section>
      ) : students.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
          {students.map((item) => <button type="button" key={item.id} onClick={() => setStudent(item)} style={{ padding: 16, textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', color: '#0f172a', cursor: 'pointer' }}><strong>{item.name}</strong><span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 13 }}>{item.student_id || 'View captured images'}</span><span style={{ display: 'block', marginTop: 10, color: '#4f46e5', fontWeight: 700 }}>{item.image_count} image(s)</span></button>)}
        </div>
      ) : images.length ? <ImageGrid images={images} /> : <div style={{ padding: 40, borderRadius: 12, background: 'white', textAlign: 'center', color: '#64748b' }}>No images have been captured for this exam type.</div>}
    </main>
  );
};

const ImageGrid = ({ images }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16 }}>
    {images.map((image) => <article key={image.id} style={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
      {image.image ? <a href={getMediaUrl(image.image)} target="_blank" rel="noreferrer"><img src={getMediaUrl(image.image)} alt={`Proctor capture for ${image.student_name}`} loading="lazy" style={{ display: 'block', width: '100%', height: 190, objectFit: 'cover', background: '#0f172a' }} /></a> : <div style={{ height: 190, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>Image unavailable</div>}
      <div style={{ padding: 12, color: '#475569', fontSize: 13 }}><strong>{image.student_name}</strong><span style={{ display: 'block', marginTop: 5 }}>{image.exam_title}</span><span style={{ display: 'block', marginTop: 4 }}>{image.capture_time ? new Date(image.capture_time).toLocaleString() : 'Capture time unavailable'}</span>{image.is_suspicious && <span style={{ display: 'block', marginTop: 6, color: '#b91c1c', fontWeight: 600 }}>Flagged{image.suspicious_reason ? `: ${image.suspicious_reason}` : ''}</span>}</div>
    </article>)}
  </div>
);

export default ProctoringImagesPage;
