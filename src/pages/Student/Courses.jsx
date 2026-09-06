// frontend/src/pages/Student/Courses.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Users, Clock, FileText, CheckCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourses, enrollCourse } from '../../store/slices/courseSlice';
import api from '../../api/api';

const Courses = () => {
  const dispatch = useDispatch();
  const { courses = [], isLoading = false } = useSelector((state) => state.courses || { courses: [] });
  const { user } = useSelector((state) => state.auth || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [localCourses, setLocalCourses] = useState([]);

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    try {
      const result = await dispatch(fetchCourses()).unwrap();
      console.log('Fetched courses from API:', result);
      setLocalCourses(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
      // Try direct API call as fallback
      try {
        const response = await api.get('/courses/');
        console.log('Direct API call response:', response.data);
        // Handle paginated response
        let coursesData = response.data;
        if (coursesData && coursesData.results && Array.isArray(coursesData.results)) {
          coursesData = coursesData.results;
        } else if (!Array.isArray(coursesData)) {
          coursesData = [];
        }
        setLocalCourses(coursesData);
      } catch (err) {
        console.error('Direct API call failed:', err);
      }
    }
  };

  // Use localCourses if available, otherwise use courses from Redux
  const displayCourses = localCourses.length > 0 ? localCourses : (Array.isArray(courses) ? courses : []);
  
  // Filter courses - only show APPROVED courses for students
  const approvedCourses = displayCourses.filter(c => c.is_approved === true);
  
  // Get enrolled course IDs
  const enrolledCourseIds = approvedCourses.filter(c => c.is_enrolled).map(c => c.id);

  const filteredCourses = approvedCourses.filter(course => {
    if (!course) return false;
    const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.course_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = !selectedSemester || course.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await dispatch(enrollCourse(courseId)).unwrap();
      toast.success('Successfully enrolled in course!');
      await fetchAllCourses();
    } catch (error) {
      toast.error(error || 'Failed to enroll');
    }
    setEnrolling(null);
  };

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .course-grid {
            grid-template-columns: 1fr !important;
          }
          .search-filter-bar {
            flex-direction: column !important;
          }
          .course-actions {
            flex-direction: column !important;
          }
          .course-actions a, .course-actions button {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>Available Courses</h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            {approvedCourses.length} courses available for enrollment
          </p>
        </div>
        <div style={{
          background: '#dbeafe',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          color: '#2563eb',
          fontWeight: 500,
        }}>
          {approvedCourses.length} Courses
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
        }} className="search-filter-bar">
          <div style={{
            flex: 1,
            position: 'relative',
            minWidth: '200px',
          }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }} size={20} />
            <input
              type="text"
              placeholder="Search courses by title or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 44px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Filter size={20} style={{ color: '#94a3b8' }} />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <BookOpen size={64} style={{
            color: '#94a3b8',
            marginBottom: '16px',
          }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>No courses available</h3>
          <p style={{
            color: '#64748b',
            margin: 0,
          }}>
            {searchTerm || selectedSemester ? 'Try adjusting your search or filters' : 'Check back later for new courses'}
          </p>
          <button
            onClick={fetchAllCourses}
            style={{
              marginTop: '16px',
              padding: '8px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            Refresh Courses
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }} className="course-grid">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const isFull = course.enrolled_count >= course.capacity;

            return (
              <div key={course.id} style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'none';
              }}>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      background: '#eff6ff',
                      color: '#3b82f6',
                      padding: '4px 10px',
                      borderRadius: '4px',
                    }}>{course.course_code}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      background: '#dcfce7',
                      color: '#16a34a',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>✅ Approved</span>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px 0',
                  }}>{course.title}</h3>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    margin: '0 0 16px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>{course.description || 'No description available'}</p>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#64748b',
                      fontSize: '14px',
                    }}>
                      <Users size={16} style={{ color: '#94a3b8' }} />
                      <span>{course.enrolled_count || 0} / {course.capacity} students</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#64748b',
                      fontSize: '14px',
                    }}>
                      <Clock size={16} style={{ color: '#94a3b8' }} />
                      <span>Semester {course.semester}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#64748b',
                      fontSize: '14px',
                    }}>
                      <BookOpen size={16} style={{ color: '#94a3b8' }} />
                      <span>{course.credit_hours} Credit Hours</span>
                    </div>
                    {course.instructor_name && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#64748b',
                        fontSize: '14px',
                      }}>
                        <Users size={16} style={{ color: '#94a3b8' }} />
                        <span>Instructor: {course.instructor_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Course Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                  }} className="course-actions">
                    <Link
                      to={`/courses/${course.id}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '10px',
                        border: '2px solid #3b82f6',
                        color: '#3b82f6',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} />
                      View Details
                    </Link>
                    
                    {user?.role === 'STUDENT' && (
                      <>
                        {isEnrolled ? (
                          // If enrolled, show "View Materials" button
                          <Link
                            to={`/courses/${course.id}`}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '10px',
                              background: '#22c55e',
                              color: 'white',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              fontWeight: 500,
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                          >
                            <FileText size={16} style={{ display: 'inline', marginRight: '4px' }} />
                            Materials
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            disabled={isFull || enrolling === course.id}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 500,
                              fontSize: '14px',
                              cursor: isFull || enrolling === course.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              background: isFull ? '#94a3b8' : '#3b82f6',
                              color: 'white',
                              opacity: isFull || enrolling === course.id ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isFull && enrolling !== course.id) {
                                e.currentTarget.style.background = '#2563eb';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isFull && enrolling !== course.id) {
                                e.currentTarget.style.background = '#3b82f6';
                              }
                            }}
                          >
                            {enrolling === course.id ? 'Enrolling...' : 
                             isFull ? 'Full' : 'Enroll'}
                          </button>
                        )}
                      </>
                    )}
                    
                    {user?.role === 'TEACHER' && (
                      <Link
                        to={`/courses/${course.id}`}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '10px',
                          background: '#8b5cf6',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                      >
                        <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        Manage
                      </Link>
                    )}
                  </div>
                  
                  {/* Enrollment Status Badge */}
                  {isEnrolled && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: '#f0fdf4',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#16a34a',
                    }}>
                      <CheckCircle size={16} />
                      <span>You are enrolled in this course</span>
                    </div>
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

export default Courses;