// frontend/src/pages/Student/Exams.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, FileText, CheckCircle, Eye } from 'lucide-react';
import { fetchExams } from '../../store/slices/examSlice';
import api from '../../api/api';

const Exams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], isLoading = false } = useSelector((state) => state.exams || { exams: [] });
  const [localExams, setLocalExams] = useState([]);

  useEffect(() => {
    fetchAllExams();
  }, []);

  const fetchAllExams = async () => {
    try {
      const result = await dispatch(fetchExams()).unwrap();
      setLocalExams(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      try {
        const response = await api.get('/exams/');
        setLocalExams(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Direct API call failed:', err);
      }
    }
  };

  const displayExams = localExams.length > 0 ? localExams : (Array.isArray(exams) ? exams : []);
  const publishedExams = displayExams.filter(e => e.is_published === true);
  const now = new Date();
  
  const upcomingExams = publishedExams.filter(exam => new Date(exam.start_time) > now);
  const ongoingExams = publishedExams.filter(exam => new Date(exam.start_time) <= now && new Date(exam.end_time) >= now);
  const pastExams = publishedExams.filter(exam => new Date(exam.end_time) < now);

  const getExamStatus = (exam) => {
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    
    if (now < start) return { label: 'Upcoming', color: '#d97706', bg: '#fef3c7' };
    if (now >= start && now <= end) return { label: 'Ongoing', color: '#16a34a', bg: '#dcfce7' };
    return { label: 'Completed', color: '#6b7280', bg: '#f3f4f6' };
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) { .exam-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>My Exams</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{publishedExams.length} exams available</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>Ongoing</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', margin: '4px 0 0 0' }}>{ongoingExams.length}</p>
        </div>
        <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#d97706', margin: 0 }}>Upcoming</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', margin: '4px 0 0 0' }}>{upcomingExams.length}</p>
        </div>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Completed</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#6b7280', margin: '4px 0 0 0' }}>{pastExams.length}</p>
        </div>
      </div>

      {ongoingExams.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', marginRight: '8px', animation: 'pulse 1.5s infinite' }} />
            Ongoing Exams
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="exam-grid">
            {ongoingExams.map((exam) => {
              const status = getExamStatus(exam);
              const isTaken = exam.attempt_count > 0 || exam.is_taken; 

              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #22c55e', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{exam.title}</h3>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{exam.course_title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {exam.duration_minutes} min</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(exam.start_time).toLocaleString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {exam.total_marks} marks</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} /> View Details
                    </button>

                    {isTaken ? (
                      <span style={{ display: 'inline-block', padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                        <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} /> Already Taken
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/take`); }}
                        style={{ display: 'inline-block', padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#16a34a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#22c55e'; }}
                      >
                        Take Exam
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcomingExams.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Upcoming Exams</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="exam-grid">
            {upcomingExams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{exam.title}</h3>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{exam.course_title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {exam.duration_minutes} min</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(exam.start_time).toLocaleString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {exam.total_marks} marks</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} /> View Details
                    </button>
                    <span style={{ display: 'inline-block', padding: '8px 16px', background: '#e5e7eb', color: '#9ca3af', borderRadius: '8px', fontSize: '14px' }}>Not Available Yet</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastExams.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Past Exams</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="exam-grid">
            {pastExams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #9ca3af', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{exam.title}</h3>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{exam.course_title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(exam.start_time).toLocaleDateString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {exam.total_marks} marks</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} /> View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;