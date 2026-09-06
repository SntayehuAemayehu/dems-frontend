import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Video, Users, Clock, Play, BookOpen, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const LiveClasses = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClasses, setActiveClasses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      const coursesData = Array.isArray(response.data) ? response.data : [];
      
      let filteredCourses = coursesData;
      if (user?.role === 'STUDENT') {
        filteredCourses = coursesData.filter(c => c.is_enrolled);
      } else if (user?.role === 'TEACHER') {
        filteredCourses = coursesData.filter(c => c.instructor === user.id);
      }
      
      setCourses(filteredCourses);
      
      // Simulate active classes (in real app, this would come from a WebSocket or API)
      const active = filteredCourses.filter(c => c.is_active).slice(0, 2);
      setActiveClasses(active);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
        }}>Live Classes</h1>
        <p style={{
          color: '#64748b',
          margin: '4px 0 0 0',
        }}>Join your ongoing live classes and interact with instructors</p>
      </div>

      {/* Active Live Classes */}
      {activeClasses.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '16px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              background: '#dc2626',
              borderRadius: '50%',
              marginRight: '8px',
              animation: 'pulse 1.5s infinite',
            }} />
            Live Now
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
          }}>
            {activeClasses.map((course) => (
              <div key={course.id} style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                border: '2px solid #dc2626',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  padding: '16px',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Video size={20} />
                    <span style={{ fontWeight: 600 }}>LIVE</span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    opacity: 0.9,
                  }}>
                    {course.course_code}
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 4px 0',
                  }}>{course.title}</h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0 0 12px 0',
                  }}>{course.instructor_name || 'Instructor'}</p>
                  <Link
                    to={`/live-class/${course.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    <Play size={16} />
                    Join Live Class
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Courses with Live Class Option */}
      {courses.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <Video size={64} style={{
            margin: '0 auto 16px',
            color: '#94a3b8',
          }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#0f172a',
            marginBottom: '8px',
          }}>No live classes available</h3>
          <p style={{
            color: '#64748b',
          }}>
            {user?.role === 'TEACHER' ? 'Create a course to start live teaching' : 'Enroll in a course to join live classes'}
          </p>
          {user?.role === 'TEACHER' && (
            <Link
              to="/teacher/courses"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '10px 24px',
                background: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '16px',
          }}>Available Courses</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
          }}>
            {courses.map((course) => (
              <div key={course.id} style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
                <div style={{
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  padding: '24px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '80px',
                }}>
                  <Video size={48} style={{ opacity: 0.5 }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '12px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}>
                      {course.course_code}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 4px 0',
                  }}>{course.title}</h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0 0 12px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>{course.description || 'No description available'}</p>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#6b7280',
                    }}>
                      <Users size={14} />
                      <span>Instructor: {course.instructor_name || 'Unknown'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#6b7280',
                    }}>
                      <Clock size={14} />
                      <span>{course.credit_hours} Credit Hours • Semester {course.semester}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#6b7280',
                    }}>
                      <Users size={14} />
                      <span>{course.enrolled_count || 0} / {course.capacity} students</span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/live-class/${course.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    <Play size={16} />
                    Join Live Class
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;