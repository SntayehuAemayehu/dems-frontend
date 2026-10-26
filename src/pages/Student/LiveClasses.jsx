// frontend/src/pages/Student/LiveClasses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Users, Clock, Play, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const LiveClasses = () => {
  const { user } = useSelector((state) => state.auth || {});
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/');
      let coursesData = [];
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        coursesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        coursesData = response.data;
      }
      
      let filteredCourses = [];
      if (user?.role === 'STUDENT') {
        filteredCourses = coursesData.filter(c => c.is_enrolled === true);
        try {
          const enrollResponse = await api.get('/courses/enrollments/');
          let enrollments = [];
          if (enrollResponse.data && enrollResponse.data.results) {
            enrollments = enrollResponse.data.results;
          } else if (Array.isArray(enrollResponse.data)) {
            enrollments = enrollResponse.data;
          }
          const enrolledCourseIds = enrollments.filter(e => e.status === 'ACTIVE').map(e => e.course);
          const enrolledFromApi = coursesData.filter(c => enrolledCourseIds.includes(c.id));
          filteredCourses = [...filteredCourses, ...enrolledFromApi];
          filteredCourses = filteredCourses.filter((c, index, self) => self.findIndex(c2 => c2.id === c.id) === index);
        } catch (e) {
          console.log('Could not fetch enrollments, using is_enrolled field');
        }
      } else if (user?.role === 'TEACHER') {
        filteredCourses = coursesData.filter(c => c.instructor === user.id);
      } else {
        filteredCourses = coursesData;
      }
      
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleJoinLiveClass = (courseId) => {
    navigate(`/live-class/${courseId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) { .live-class-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Live Classes</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{user?.role === 'TEACHER' ? 'Start live classes for your courses' : `You have ${courses.length} course${courses.length !== 1 ? 's' : ''} available`}</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Link to="/teacher/courses" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
            <BookOpen size={18} /> My Courses
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <Video size={64} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>No live classes available</h3>
          <p style={{ color: '#64748b' }}>{user?.role === 'TEACHER' ? 'Create a course to start live teaching' : 'You are not enrolled in any courses. Browse courses to enroll.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }} className="live-class-grid">
          {courses.map((course) => {
            const isLive = course.is_live === true; 
            const isTeacher = user?.role === 'TEACHER';

            return (
              <div key={course.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
                <div style={{ background: isLive ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #64748b, #475569)', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={48} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  {isLive && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', color: '#dc2626', fontSize: '12px', padding: '4px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                      LIVE NOW
                    </span>
                  )}
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>{course.course_code}</span>
                    {course.is_enrolled && <span style={{ fontSize: '12px', background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', marginLeft: '8px' }}>✓ Enrolled</span>}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{course.title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description || 'No description available'}</p>
                  
                  <div style={{ marginBottom: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={14} color="#6b7280" /><span style={{ fontSize: '13px', color: '#6b7280' }}>Instructor: {course.instructor_name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="#6b7280" /><span style={{ fontSize: '13px', color: '#6b7280' }}>{course.credit_hours} Credit Hours • Semester {course.semester}</span>
                    </div>
                  </div>
                  
                  {/* ✅ THE FIX: Teachers always see "Start", Students wait if not live */}
                  {isTeacher ? (
                    <button onClick={() => handleJoinLiveClass(course.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'} onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                      <Play size={16} /> Start Live Class
                    </button>
                  ) : isLive ? (
                    <button onClick={() => handleJoinLiveClass(course.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'} onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                      <Play size={16} /> Join Live Class
                    </button>
                  ) : (
                    <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed' }}>
                      <Clock size={16} /> Waiting for Teacher...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveClasses;