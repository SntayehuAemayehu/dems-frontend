// frontend/src/pages/Student/ExamDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, Calendar, FileText, CheckCircle, 
  ArrowLeft, Shield, AlertCircle, Award 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      // Assuming your backend has an endpoint to get a single exam by ID
      const response = await api.get(`/exams/${id}/`);
      setExam(response.data);
    } catch (err) {
      console.error('Failed to fetch exam details:', err);
      setError('Could not load exam details. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{error}</h2>
        <button 
          onClick={() => navigate('/exams')}
          style={{ marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Back to Exams
        </button>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  
  const isUpcoming = now < start;
  const isOngoing = now >= start && now <= end;
  const isCompleted = now > end;
  
  // Note: If your backend doesn't return attempt_count, this will default to false
  const isTaken = exam.attempt_count > 0 || exam.is_taken; 

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/exams')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '24px',
          padding: 0
        }}
      >
        <ArrowLeft size={18} /> Back to Exams
      </button>

      {/* Header Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        borderTop: `6px solid ${isOngoing ? '#22c55e' : isUpcoming ? '#f59e0b' : '#9ca3af'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              background: '#eff6ff',
              color: '#2563eb',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '12px',
              display: 'inline-block'
            }}>
              {exam.course_code} - {exam.course_title}
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {exam.title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              {exam.description || 'No description provided for this exam.'}
            </p>
          </div>

          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
            background: isOngoing ? '#dcfce7' : isUpcoming ? '#fef3c7' : '#f3f4f6',
            color: isOngoing ? '#16a34a' : isUpcoming ? '#d97706' : '#6b7280',
          }}>
            {isOngoing ? '● Ongoing' : isUpcoming ? '● Upcoming' : '● Completed'}
          </span>
        </div>
      </div>

      {/* Exam Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}><Clock size={20} color="#2563eb" /></div>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Duration</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{exam.duration_minutes} Minutes</p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px' }}><Award size={20} color="#d97706" /></div>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Total Marks</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{exam.total_marks} Marks</p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px' }}><Calendar size={20} color="#16a34a" /></div>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Start Time</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{new Date(exam.start_time).toLocaleString()}</p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '8px' }}><Calendar size={20} color="#dc2626" /></div>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>End Time</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{new Date(exam.end_time).toLocaleString()}</p>
        </div>
      </div>

      {/* Security Warning */}
      <div style={{ 
        background: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px',
        display: 'flex',
        gap: '16px'
      }}>
        <Shield size={24} color="#dc2626" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '16px' }}>Proctored Exam</h4>
          <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px', lineHeight: 1.5 }}>
            This exam is monitored. Your camera will be active. You must be alone in the room. 
            Do not switch tabs or open other applications.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        {isTaken ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#f0fdf4', 
            color: '#16a34a', 
            padding: '16px 32px', 
            borderRadius: '12px', 
            border: '1px solid #bbf7d0',
            fontSize: '16px',
            fontWeight: 600
          }}>
            <CheckCircle size={20} /> You have already taken this exam
          </div>
        ) : isUpcoming ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#fef3c7', 
            color: '#d97706', 
            padding: '16px 32px', 
            borderRadius: '12px', 
            border: '1px solid #fde68a',
            fontSize: '16px',
            fontWeight: 600
          }}>
            <Clock size={20} /> This exam has not started yet
          </div>
        ) : isCompleted ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#f3f4f6', 
            color: '#6b7280', 
            padding: '16px 32px', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            fontSize: '16px',
            fontWeight: 600
          }}>
            <AlertCircle size={20} /> This exam has ended
          </div>
        ) : (
          <button
            onClick={() => navigate(`/exams/${exam.id}/take`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#22c55e',
              color: 'white',
              padding: '16px 48px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
            }}
          >
            <FileText size={24} /> Start Exam Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamDetails;