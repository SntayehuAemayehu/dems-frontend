// src/pages/LiveClasses.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Video, Users, Clock, Play, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './LiveClasses.css';

const LiveClasses = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/courses/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const coursesData = Array.isArray(response.data) ? response.data : [];
      
      let filteredCourses = coursesData;
      
      // FIX: Filter based on role
      if (user?.role === 'STUDENT') {
        filteredCourses = coursesData.filter(c => c.is_enrolled);
      } else if (user?.role === 'TEACHER') {
        filteredCourses = coursesData.filter(c => c.instructor === user.id);
      }
      
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e5e7eb', 
          borderTopColor: '#2563eb', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          Live Classes
        </h1>
        <p style={{ color: '#6b7280' }}>
          {user?.role === 'TEACHER' ? 'Start live classes for your courses' : 'Join your ongoing live classes and interact with instructors'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <Video size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>No live classes available</h3>
          <p style={{ color: '#6b7280' }}>
            {user?.role === 'TEACHER' ? 'Create a course to start live teaching' : 'Enroll in a course to join live classes'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {courses.map((course) => {
            const isLive = course.is_live === true;

            return (
              <div key={course.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                <div style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={48} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  
                  {/* FIX: Only show LIVE badge if course is actually live */}
                  {isLive && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#dc2626', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                      LIVE
                    </span>
                  )}
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>
                      {course.course_code}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{course.title}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>{course.description || 'No description available'}</p>
                  
                  <div style={{ marginBottom: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={14} color="#6b7280" />
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Instructor: {course.instructor_name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="#6b7280" />
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{course.credit_hours} Credit Hours • Semester {course.semester}</span>
                    </div>
                  </div>
                  
                  <Link to={`/live-class/${course.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                    <Play size={16} />
                    {user?.role === 'TEACHER' ? 'Start Live Class' : 'Join Live Class'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LiveClasses;