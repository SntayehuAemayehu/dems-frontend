// src/components/AI/AILearningPath.jsx
// COMPLETE ADAPTIVE LEARNING PATH COMPONENT

import React, { useState, useEffect } from 'react';
import { 
  Map, CheckCircle, Clock, BookOpen, Target, 
  RefreshCw, GraduationCap, AlertCircle, Sparkles 
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const AILearningPath = () => {
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // ✅ CALL BACKEND API
      const response = await api.get('/analytics/adaptive/learning-path/');
      setLearningPath(response.data);
      console.log('🎯 Learning Path:', response.data);
    } catch (error) {
      console.error('Failed to fetch learning path:', error);
      toast.error('Failed to load learning path');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        color: 'white',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '16px', fontSize: '16px' }}>Creating your personalized path...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <Map size={48} color="#8b5cf6" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ color: '#0f172a' }}>No Learning Path Available</h3>
        <p style={{ color: '#64748b' }}>Enroll in courses to get a personalized learning path.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .path-header {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }
        .path-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .course-recommendation {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          background: white;
        }
        .course-recommendation:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: #8b5cf6;
        }
        .milestone-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-left: 3px solid #8b5cf6;
          background: #faf5ff;
          border-radius: 0 8px 8px 0;
          margin-bottom: 8px;
        }
        .priority-score {
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="path-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={40} />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Your Learning Path</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
                Personalized for {learningPath.student} • Semester {learningPath.current_semester}
              </p>
            </div>
          </div>
          <button
            onClick={fetchLearningPath}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="path-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <GraduationCap size={24} color="#8b5cf6" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
              Semester {learningPath.current_semester}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Current Semester</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Target size={24} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
              {learningPath.current_cgpa}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Current CGPA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <BookOpen size={24} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
              {learningPath.recommended_courses?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Recommended Courses</div>
          </div>
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="path-section">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="#3b82f6" /> Recommended Courses
        </h3>
        {learningPath.recommended_courses?.map((course, index) => (
          <div key={index} className="course-recommendation">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>
                  {course.course} - {course.title}
                </h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>
                  {course.credit_hours} Credit Hours
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#8b5cf6' }}>
                  {course.recommendation}
                </p>
              </div>
              <span className="priority-score" style={{
                background: course.priority_score > 80 ? '#dcfce7' : course.priority_score > 60 ? '#fef3c7' : '#f1f5f9',
                color: course.priority_score > 80 ? '#16a34a' : course.priority_score > 60 ? '#d97706' : '#64748b',
              }}>
                {course.priority_score}% Match
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Skill Gaps */}
      {learningPath.skill_gaps?.length > 0 && (
        <div className="path-section">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} color="#ef4444" /> Skill Gaps
          </h3>
          {learningPath.skill_gaps.map((gap, index) => (
            <div key={index} style={{
              padding: '8px 12px',
              background: '#fef2f2',
              borderLeft: '3px solid #ef4444',
              borderRadius: '0 6px 6px 0',
              marginBottom: '8px',
              color: '#991b1b',
              fontSize: '14px',
            }}>
              {gap}
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      <div className="path-section">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="#8b5cf6" /> Milestones
        </h3>
        {learningPath.milestones?.map((milestone, index) => (
          <div key={index} className="milestone-item">
            <CheckCircle size={20} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: 0, color: '#0f172a' }}>{milestone.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>{milestone.description}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8b5cf6' }}>
                Target: {milestone.target}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AILearningPath;