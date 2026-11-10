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
import api, { getAllPages } from '../api/api';
import CourseFilePreview from '../components/CourseFilePreview';
import { downloadCourseFile, getCourseFileName, isOfficeDocument, openCourseFile } from '../utils/courseFiles';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedCourse: course, isLoading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [materialsError, setMaterialsError] = useState('');
  const [assignmentsError, setAssignmentsError] = useState('');
  const [activeTab, setActiveTab] = useState('materials');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseDetail(id));
    fetchMaterials();
    fetchAssignments();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setMaterials(await getAllPages(`/courses/student/${id}/materials/`));
      setMaterialsError('');
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setMaterials([]);
      setMaterialsError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Could not load course materials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignments(await getAllPages(`/courses/student/${id}/assignments/`));
      setAssignmentsError('');
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
      setAssignmentsError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Could not load assignments.'
      );
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

  const handleOpen = (file) => {
    if (!file) {
      toast.error('No file available to open.');
      return;
    }
    if (isOfficeDocument(file)) {
      setPreviewFile({ file, title: getCourseFileName(file) });
      return;
    }
    if (!openCourseFile(file)) toast.error('No file available to open.');
  };

  const handleDownload = async (file, filename) => {
    try {
      await downloadCourseFile(file, filename);
    } catch (error) {
      console.error('Could not download course file:', error);
      toast.error(error.response?.data?.detail || 'Could not download this file.');
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

      <div style={{
        padding: '28px 32px',
        borderRadius: 16,
        marginBottom: 24,
        color: '#fff',
        background: 'linear-gradient(120deg, #1d4ed8, #4338ca 58%, #6d28d9)',
        boxShadow: '0 12px 30px rgba(37, 99, 235, .18)',
      }}>
        <div style={{ color: '#dbeafe', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {course.course_code || 'Course'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '8px 0', fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.2 }}>{course.title}</h1>
            <p style={{ margin: 0, color: '#e0e7ff' }}>
              {course.instructor_name ? `Instructor: ${course.instructor_name}` : 'Course materials and assignments'}
            </p>
          </div>
          {user?.role === 'TEACHER' && (
            <Link to={`/live-class/${course.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: '#fff', color: '#1d4ed8', borderRadius: 9, textDecoration: 'none', fontWeight: 700 }}>
              <Play size={17} /> Start Live Class
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 22, color: '#e0e7ff', fontSize: 14 }}>
          {course.credit_hours != null && <span><BookOpen size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{course.credit_hours} credits</span>}
          {course.semester && <span><Calendar size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Semester {course.semester}</span>}
          <span><FileText size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{materials.length} materials</span>
          <span><CheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{assignments.length} assignments</span>
        </div>
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
              {materialsError ? (
                <p role="alert" style={{ color: '#b91c1c', textAlign: 'center' }}>{materialsError}</p>
              ) : materials.length === 0 ? (
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
                      {(material.file_url || material.file) ? (
                        <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                          <button
                            onClick={() => handleOpen(material.file_url || material.file)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            <Eye size={16} /> Open
                          </button>
                          <button
                            onClick={() => handleDownload(material.file_url || material.file, material.title)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#eff6ff', color: '#1d4ed8', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            <Download size={16} /> Download
                          </button>
                        </div>
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
              {assignmentsError ? (
                <p role="alert" style={{ color: '#b91c1c', textAlign: 'center' }}>{assignmentsError}</p>
              ) : assignments.length === 0 ? (
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
                            <React.Fragment key="assignment-attachment-actions">
                              <button
                                type="button"
                                onClick={() => handleOpen(assignment.attachment)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                              >
                                <Eye size={14} /> Open Attachment
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(assignment.attachment, `${assignment.title}-attachment`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                              >
                                <Download size={14} /> Download
                              </button>
                            </React.Fragment>
                          )}
                          
                          {assignment.video_attachment && (
                            <React.Fragment key="assignment-video-actions">
                              <button
                                type="button"
                                onClick={() => handleOpen(assignment.video_url || assignment.video_attachment)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fef3c7', color: '#b45309', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                              >
                                <Video size={14} /> View Video
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(assignment.video_url || assignment.video_attachment, `${assignment.title}-video`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff7ed', color: '#9a3412', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                              >
                                <Download size={14} /> Download
                              </button>
                            </React.Fragment>
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
      {previewFile && (
        <CourseFilePreview
          file={previewFile.file}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default CourseDetail;