// frontend/src/pages/Student/Exams.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, FileText, CheckCircle, Eye, Loader, ArrowLeft, Shield, BookOpen } from 'lucide-react';
import { fetchExams } from '../../store/slices/examSlice';
import api, { getAllPages } from '../../api/api';
import toast from 'react-hot-toast';

const Exams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], isLoading = false } = useSelector((state) => state.exams || { exams: [] });
  const [localExams, setLocalExams] = useState([]);
  const [checkingFace, setCheckingFace] = useState(false);
  const [loadError, setLoadError] = useState('');

  // ✅ NEW: View Level (courses | exams)
  const [viewLevel, setViewLevel] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchAllExams();
  }, []);

  const fetchAllExams = async () => {
    setLoadError('');
    try {
      const result = await dispatch(fetchExams()).unwrap();
      setLocalExams(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      try {
        setLocalExams(await getAllPages('/exams/'));
      } catch (err) {
        console.error('Direct API call failed:', err);
        setLocalExams([]);
        setLoadError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Could not load exams. Please try again.'
        );
      }
    }
  };

  // ============================================================
  // ✅ SEB: Launch SEB directly via protocol
  // ============================================================
  const handleLaunchSEB = async (exam) => {
    setCheckingFace(true);

    try {
      // Check face enrollment first
      const res = await api.get('/auth/face-status/');
      const isEnrolled = res.data?.face_enrolled === true;

      if (!isEnrolled) {
        toast.error('Please enroll your face before taking the exam');
        localStorage.setItem('pending_exam_id', exam.id);
        navigate('/enroll-face');
        return;
      }

      if (exam.seb_available && exam.seb_file_url) {
        let fileUrl = exam.seb_file_url;
        let protocolUrl;

        // Convert URL to SEB protocol
        if (fileUrl.startsWith('https://')) {
          protocolUrl = fileUrl.replace('https://', 'sebs://');
        } else if (fileUrl.startsWith('http://')) {
          protocolUrl = fileUrl.replace('http://', 'seb://');
        } else {
          toast.error('Invalid SEB file URL.');
          return;
        }

        // Trigger browser modal for SEB launch
        window.location.href = protocolUrl;
        toast.success('Launching Safe Exam Browser...', { duration: 4000 });

      } else {
        // Fallback: non-SEB exam
        navigate(`/exams/${exam.id}/start`);
      }
    } catch (err) {
      console.error('Launch failed:', err);
      toast.error('Could not launch SEB. Please try again.');
    } finally {
      setCheckingFace(false);
    }
  };

  // ✅ Grouping logic
  const publishedExams = localExams.filter(e => e.is_published === true);
  
  const coursesMap = {};
  publishedExams.forEach(exam => {
    const cid = exam.course;
    if (!coursesMap[cid]) {
      coursesMap[cid] = {
        id: cid,
        title: exam.course_title || 'Unknown Course',
        code: exam.course_code || 'N/A',
        exams: []
      };
    }
    coursesMap[cid].exams.push(exam);
  });
  const courses = Object.values(coursesMap);

  const filteredExams = selectedCourse
    ? publishedExams.filter(e => Number(e.course) === Number(selectedCourse.id))
    : [];

  const now = new Date();

  const getExamStatus = (exam) => {
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    if (now < start) return { label: 'Upcoming', color: '#d97706', bg: '#fef3c7' };
    if (now >= start && now <= end) return { label: 'Ongoing', color: '#16a34a', bg: '#dcfce7' };
    return { label: 'Completed', color: '#6b7280', bg: '#f3f4f6' };
  };

  if (isLoading && localExams.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader className="spin" size={48} color="#3b82f6" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
        .exam-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        @media (max-width: 768px) { .exam-grid, .course-grid { grid-template-columns: 1fr; } }
      `}</style>

      {loadError && (
        <div role="alert" style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
          {loadError}{' '}
          <button type="button" onClick={fetchAllExams} style={{ color: '#1d4ed8', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* ==================== LEVEL 1: COURSES ==================== */}
      {viewLevel === 'courses' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>My Exams</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Select a course to view available exams</p>
          </div>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
              <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>No exams available</h3>
              <p style={{ color: '#64748b' }}>You don't have any published exams yet.</p>
            </div>
          ) : (
            <div className="course-grid">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => { setSelectedCourse(course); setViewLevel('exams'); }}
                  className="card-hover"
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #e5e7eb' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>
                      {course.code}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px' }}>
                      {course.exams.length} exam{course.exams.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>{course.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b' }}>
                    <BookOpen size={16} /> Click to view exams
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== LEVEL 2: EXAMS ==================== */}
      {viewLevel === 'exams' && selectedCourse && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <button
                onClick={() => { setViewLevel('courses'); setSelectedCourse(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
              >
                <ArrowLeft size={18} /> Back to Courses
              </button>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedCourse.title}</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{selectedCourse.code} • Available Exams</p>
            </div>
          </div>

          <div className="exam-grid">
            {filteredExams.map((exam) => {
              const status = getExamStatus(exam);
              const isTaken = exam.attempt_count > 0 || exam.is_taken;

              return (
                <div
                  key={exam.id}
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  className="card-hover"
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: `4px solid ${status.color}`, cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{exam.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {exam.duration_minutes} min</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(exam.start_time).toLocaleString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {exam.total_marks} marks</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <Eye size={16} style={{ marginRight: '6px' }} /> View Details
                    </button>

                    {isTaken ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                        <CheckCircle size={16} style={{ marginRight: '6px' }} /> Already Taken
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLaunchSEB(exam); }}
                        disabled={checkingFace}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '8px 16px',
                          background: checkingFace ? '#94a3b8' : '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: checkingFace ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { if (!checkingFace) e.currentTarget.style.background = '#1d4ed8'; }}
                        onMouseLeave={(e) => { if (!checkingFace) e.currentTarget.style.background = '#2563eb'; }}
                      >
                        {checkingFace ? (
                          <><Loader size={16} className="spin" style={{ marginRight: '6px' }} /> Checking...</>
                        ) : (
                          <><Shield size={16} style={{ marginRight: '6px' }} /> Open with SEB</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Exams;