// frontend/src/pages/CourseDetail.jsx
// COMPLETE - Students can view both Materials and Assignments

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Download, Video, FileText, Calendar, Users, BookOpen, 
  ChevronLeft, Play, Eye, Clock, CheckCircle, XCircle,
  Upload, ExternalLink, File, Image, FileArchive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourseDetail } from '../store/slices/courseSlice';
import api from '../api/api';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedCourse: course, isLoading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('materials');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    dispatch(fetchCourseDetail(id));
    fetchMaterials();
    fetchAssignments();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/student/${id}/materials/`);
      console.log('📚 Fetched materials:', response.data);
      let materialsData = response.data;
      if (materialsData && materialsData.results && Array.isArray(materialsData.results)) {
        materialsData = materialsData.results;
      } else if (!Array.isArray(materialsData)) {
        materialsData = [];
      }
      setMaterials(materialsData);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/courses/student/${id}/assignments/`);
      console.log('📝 Fetched assignments:', response.data);
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <Video size={24} color="#3b82f6" />;
      case 'PDF': return <FileText size={24} color="#ef4444" />;
      case 'DOC': return <FileText size={24} color="#2563eb" />;
      case 'SLIDE': return <FileText size={24} color="#f59e0b" />;
      case 'IMAGE': return <Image size={24} color="#22c55e" />;
      default: return <File size={24} color="#6b7280" />;
    }
  };

  const getAssignmentStatusBadge = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isOverdue = now > dueDate;
    const hasSubmitted = assignment.has_submitted;
    
    if (hasSubmitted) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          background: '#dcfce7',
          color: '#16a34a',
        }}>
          <CheckCircle size={12} />
          Submitted
        </span>
      );
    } else if (isOverdue) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          background: '#fee2e2',
          color: '#dc2626',
        }}>
          <XCircle size={12} />
          Overdue
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          background: '#fef3c7',
          color: '#d97706',
        }}>
          <Clock size={12} />
          Pending
        </span>
      );
    }
  };

  const handleDownload = (material) => {
    if (material.file) {
      window.open(material.file, '_blank');
    } else {
      toast.error('No file available for download');
    }
  };

  const handleSubmitAssignment = async (assignmentId, formData) => {
    setSubmitting(true);
    try {
      const response = await api.post(`/courses/student/assignments/${assignmentId}/submit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment submitted successfully!');
      setShowSubmitModal(false);
      await fetchAssignments();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
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

  if (!course) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: '#64748b',
      }}>
        <h2>Course not found</h2>
        <Link to="/courses" style={{ color: '#2563eb' }}>Back to Courses</Link>
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
          .course-header-content {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .course-meta {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .tab-button {
            padding: 12px 16px !important;
            font-size: 14px !important;
          }
          .assignment-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Back Button */}
      <Link
        to={user?.role === 'STUDENT' ? '/courses' : '/teacher/courses'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#3b82f6',
          textDecoration: 'none',
          marginBottom: '24px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
      >
        <ChevronLeft size={20} />
        Back to Courses
      </Link>

      {/* Course Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }} className="course-header-content">
          <div>
            <span style={{
              fontSize: '14px',
              opacity: 0.8,
            }}>{course.course_code}</span>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: '4px 0 8px 0',
            }}>{course.title}</h1>
            <p style={{
              opacity: 0.9,
            }}>Instructor: {course.instructor_name || 'Not assigned'}</p>
            <div style={{
              display: 'flex',
              gap: '24px',
              marginTop: '12px',
            }} className="course-meta">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}>
                <BookOpen size={16} />
                <span>{course.credit_hours} Credits</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}>
                <Users size={16} />
                <span>{course.enrolled_count || 0} Students</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}>
                <Calendar size={16} />
                <span>Semester {course.semester}</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}>
                <FileText size={16} />
                <span>{assignments.length} Assignments</span>
              </div>
            </div>
          </div>
          {user?.role === 'TEACHER' && (
            <Link
              to={`/live-class/${course.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'white',
                color: '#2563eb',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Play size={18} />
              Start Live Class
            </Link>
          )}
        </div>
      </div>

      {/* Course Description */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
        }}>Description</h2>
        <p style={{
          color: '#475569',
          lineHeight: '1.6',
        }}>{course.description || 'No description provided.'}</p>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setActiveTab('materials')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              fontWeight: 500,
              color: activeTab === 'materials' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'materials' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
            className="tab-button"
            onMouseEnter={(e) => {
              if (activeTab !== 'materials') e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'materials') e.currentTarget.style.color = '#64748b';
            }}
          >
            📚 Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              fontWeight: 500,
              color: activeTab === 'assignments' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'assignments' ? '2px solid #3b82f6' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
            className="tab-button"
            onMouseEnter={(e) => {
              if (activeTab !== 'assignments') e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'assignments') e.currentTarget.style.color = '#64748b';
            }}
          >
            📝 Assignments ({assignments.length})
            {assignments.filter(a => !a.has_submitted && new Date(a.due_date) > new Date()).length > 0 && (
              <span style={{
                marginLeft: '8px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '12px',
              }}>
                {assignments.filter(a => !a.has_submitted && new Date(a.due_date) > new Date()).length} pending
              </span>
            )}
          </button>
        </div>

        {/* Materials Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'materials' && (
            <>
              {materials.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#64748b',
                }}>
                  <FileText size={48} style={{
                    opacity: 0.5,
                    marginBottom: '12px',
                  }} />
                  <p>No course materials uploaded yet.</p>
                  {user?.role === 'TEACHER' && (
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Go to <Link to="/teacher/courses" style={{ color: '#2563eb' }}>Teacher Dashboard</Link> to upload materials.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {materials.map((material) => (
                    <div key={material.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: 0,
                      }}>
                        {getMaterialIcon(material.material_type)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 500,
                            color: '#0f172a',
                            fontSize: '15px',
                          }}>{material.title}</div>
                          {material.description && (
                            <div style={{
                              fontSize: '14px',
                              color: '#64748b',
                              marginTop: '2px',
                            }}>{material.description}</div>
                          )}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '4px',
                            fontSize: '12px',
                            color: '#94a3b8',
                          }}>
                            <span>Type: {material.material_type}</span>
                            {material.uploaded_at && (
                              <span>Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}</span>
                            )}
                            {material.file && (
                              <span style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}>
                                {material.file_extension || 'file'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {material.file ? (
                        <button
                          onClick={() => handleDownload(material)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      ) : (
                        <span style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                        }}>No file</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Assignments Tab Content */}
          {activeTab === 'assignments' && (
            <>
              {assignments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#64748b',
                }}>
                  <FileText size={48} style={{
                    opacity: 0.5,
                    marginBottom: '12px',
                  }} />
                  <p>No assignments posted yet.</p>
                  {user?.role === 'TEACHER' && (
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Go to <Link to="/teacher/courses" style={{ color: '#2563eb' }}>Teacher Dashboard</Link> to create assignments.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }} className="assignment-grid">
                  {assignments.map((assignment) => {
                    const isOverdue = new Date(assignment.due_date) < new Date();
                    const hasSubmitted = assignment.has_submitted;
                    
                    return (
                      <div key={assignment.id} style={{
                        padding: '16px',
                        border: `2px solid ${hasSubmitted ? '#22c55e' : isOverdue ? '#dc2626' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        background: hasSubmitted ? '#f0fdf4' : 'white',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!hasSubmitted) e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        if (!hasSubmitted) e.currentTarget.style.borderColor = isOverdue ? '#dc2626' : '#e2e8f0';
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#0f172a',
                              margin: '0 0 4px 0',
                            }}>{assignment.title}</h3>
                            <p style={{
                              color: '#64748b',
                              fontSize: '14px',
                              margin: '0 0 8px 0',
                            }}>{assignment.description}</p>
                          </div>
                          {getAssignmentStatusBadge(assignment)}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '12px',
                          fontSize: '13px',
                          color: '#64748b',
                          marginBottom: '12px',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={14} />
                            Marks: {assignment.total_marks}
                          </span>
                          {assignment.assignment_type && (
                            <span style={{
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                            }}>
                              {assignment.assignment_type}
                            </span>
                          )}
                        </div>

                        {hasSubmitted && (
                          <div style={{
                            padding: '8px 12px',
                            background: '#dcfce7',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#16a34a',
                          }}>
                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                            Submitted on {assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : 'N/A'}
                            {assignment.marks_obtained !== null && assignment.marks_obtained !== undefined && (
                              <span style={{ marginLeft: '8px', fontWeight: 600 }}>
                                • Score: {assignment.marks_obtained}/{assignment.total_marks}
                              </span>
                            )}
                            {assignment.feedback && (
                              <div style={{ marginTop: '4px', color: '#166534' }}>
                                Feedback: {assignment.feedback}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}>
                          {assignment.attachment && (
                            <a
                              href={assignment.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                            >
                              <FileText size={14} />
                              View Attachment
                            </a>
                          )}
                          
                          {assignment.video_attachment && (
                            <a
                              href={assignment.video_attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#fef3c7',
                                color: '#d97706',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                            >
                              <Video size={14} />
                              View Video
                            </a>
                          )}
                          
                          {assignment.link_url && (
                            <a
                              href={assignment.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#ede9fe',
                                color: '#7c3aed',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#ddd6fe'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#ede9fe'}
                            >
                              <ExternalLink size={14} />
                              Open Link
                            </a>
                          )}
                          
                          {user?.role === 'STUDENT' && !hasSubmitted && !isOverdue && (
                            <button
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowSubmitModal(true);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 16px',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                                marginLeft: 'auto',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                            >
                              <Upload size={14} />
                              Submit
                            </button>
                          )}
                          
                          {user?.role === 'STUDENT' && !hasSubmitted && isOverdue && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 500,
                              marginLeft: 'auto',
                            }}>
                              <XCircle size={14} />
                              Deadline Passed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowSubmitModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                <Upload size={20} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Submit Assignment
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>
            
            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <p style={{ margin: 0 }}>
                <strong>{selectedAssignment.title}</strong>
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Due: {new Date(selectedAssignment.due_date).toLocaleString()}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Total Marks: {selectedAssignment.total_marks}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSubmitAssignment(selectedAssignment.id, formData);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  Upload File (PDF, DOC, DOCX, JPG, PNG, MP4, etc.)
                </label>
                <input
                  type="file"
                  name="submission_file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.webm,.mov,.avi"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  required
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Max file size: 50MB
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  Submission Text (Optional)
                </label>
                <textarea
                  name="submission_text"
                  rows="3"
                  placeholder="Add any comments or notes..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'none',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: submitting ? '#94a3b8' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Upload size={18} />
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Info for Students */}
      {user?.role === 'STUDENT' && course.is_enrolled && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <BookOpen size={20} color="#16a34a" />
          <div>
            <p style={{ fontWeight: 500, color: '#16a34a', margin: 0 }}>
              You are enrolled in this course
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              {assignments.filter(a => !a.has_submitted).length} assignments pending · {materials.length} materials available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;