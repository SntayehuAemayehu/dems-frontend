// frontend/src/pages/Admin/ProctoringReview.jsx
// COMPLETE FIXED VERSION

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, XCircle, Camera, RefreshCw } from 'lucide-react';

const ProctoringReview = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentImages, setStudentImages] = useState([]);
  const [loadingStudentImages, setLoadingStudentImages] = useState(false);
  const [showFlagReasonModal, setShowFlagReasonModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showClearFlagModal, setShowClearFlagModal] = useState(false);
  
  const token = localStorage.getItem('access_token');
  const API_BASE_URL = 'http://localhost:8000/api';
  
  // ============ FETCH SESSIONS ============
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching proctoring sessions...');
      
      const response = await axios.get(`${API_BASE_URL}/proctoring/review/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Sessions response:', response.data);
      const data = response.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Failed to fetch sessions:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin or Teacher only.');
      } else {
        toast.error('Failed to load proctoring sessions');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/proctoring/review/students/`, {
        headers: { Authorization: `****** },
      });
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setDepartments([]);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDepartmentChange = async (department) => {
    setSelectedDepartment(department);
    setStudents([]);
    setSelectedStudent(null);
    setStudentImages([]);
    if (!department) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/proctoring/review/students/`, {
        params: { department },
        headers: { Authorization: `****** },
      });
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load department students');
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setStudentImages([]);
    setLoadingStudentImages(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/proctoring/review/students/`, {
        params: { department: selectedDepartment, student_id: student.id },
        headers: { Authorization: `****** },
      });
      setStudentImages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load student proctoring images');
    } finally {
      setLoadingStudentImages(false);
    }
  };

  const submitFlag = async () => {
    if (!flagReason.trim() || !selectedImage) return;
    if (await flagImage(selectedImage.id, flagReason.trim())) {
      setShowFlagReasonModal(false);
      setFlagReason('');
      setSelectedImage(null);
    }
  };
  
  // ============ FETCH IMAGES ============
  const fetchImages = useCallback(async (attemptId) => {
    try {
      console.log(`🔄 Fetching images for attempt: ${attemptId}`);
      
      const response = await axios.get(`${API_BASE_URL}/proctoring/sessions/${attemptId}/images/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Images response:', response.data);
      const data = response.data;
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Failed to fetch images:', error);
      toast.error('Failed to load proctoring images');
      setImages([]);
    }
  }, [token]);
  
  // ============ HANDLE SESSION CLICK ============
  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setImages([]); // Clear previous images
    fetchImages(session.attempt);
  };
  
  // ============ FLAG IMAGE ============
  const flagImage = async (imageId, reason) => {
    try {
      console.log(`🔄 Flagging image: ${imageId}`);
      
      await axios.post(
        `${API_BASE_URL}/proctoring/images/${imageId}/flag/`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Image flagged for review');
      
      // Refresh images
      if (selectedSession) {
        fetchImages(selectedSession.attempt);
      }
      fetchSessions(); // Refresh sessions to update status
      return true;
    } catch (error) {
      console.error('❌ Failed to flag image:', error);
      toast.error('Failed to flag image');
      return false;
    }
  };
  
  // ============ CLEAR FLAG ============
  const clearFlag = async (imageId) => {
    try {
      console.log(`🔄 Clearing flag for image: ${imageId}`);
      
      await axios.post(
        `${API_BASE_URL}/proctoring/images/${imageId}/clear/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Flag cleared successfully');
      
      // Refresh images
      if (selectedSession) {
        fetchImages(selectedSession.attempt);
      }
      fetchSessions();
      return true;
    } catch (error) {
      console.error('❌ Failed to clear flag:', error);
      toast.error('Failed to clear flag');
      return false;
    }
  };
  
  // ============ REFRESH ============
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    if (selectedSession) {
      await fetchImages(selectedSession.attempt);
    }
    setRefreshing(false);
    toast.success('Refreshed');
  };
  
  // ============ GET IMAGE URL ============
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };
  
  // ============ LOADING STATE ============
  if (loading && sessions.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading proctoring sessions...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // ============ RENDER ============
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .proctoring-grid { grid-template-columns: 1fr !important; }
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
          }}>
            <Camera size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
            Proctoring Review
          </h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            Review proctored exam sessions and flag suspicious activity
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            color: '#475569',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      <section style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>Browse captures by department</h2>
        <select
          aria-label="Select proctoring department"
          value={selectedDepartment}
          onChange={(event) => handleDepartmentChange(event.target.value)}
          style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '240px', background: 'white' }}
        >
          <option value="">Select department</option>
          {departments.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}
        </select>

        {selectedDepartment && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {students.map((student) => (
              <button
                type="button"
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${selectedStudent?.id === student.id ? '#2563eb' : '#cbd5e1'}`,
                  borderRadius: '6px',
                  color: selectedStudent?.id === student.id ? '#1d4ed8' : '#334155',
                  background: selectedStudent?.id === student.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                }}
              >
                {student.full_name}
              </button>
            ))}
            {students.length === 0 && <span style={{ color: '#64748b', padding: '8px 0' }}>No students in this department.</span>}
          </div>
        )}

        {selectedStudent && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>{selectedStudent.full_name}'s images</h3>
            {loadingStudentImages ? <p style={{ color: '#64748b' }}>Loading images…</p> : studentImages.length === 0 ? (
              <p style={{ color: '#64748b' }}>No captured images found for this student.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {studentImages.map((image) => (
                  <a key={image.id} href={getImageUrl(image.image)} target="_blank" rel="noreferrer" style={{ color: '#334155', textDecoration: 'none', fontSize: '12px' }}>
                    <img src={getImageUrl(image.image)} alt={`${selectedStudent.full_name} proctor capture`} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: `2px solid ${image.is_suspicious ? '#dc2626' : '#e2e8f0'}` }} />
                    <span>{image.exam_title} · {image.capture_time ? new Date(image.capture_time).toLocaleString() : '—'}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="proctoring-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
      }}>
        {/* LEFT PANEL - Sessions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          padding: '24px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Sessions to Review</span>
            <span style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: 400,
            }}>
              {sessions.length} found
            </span>
          </h2>
          
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#94a3b8',
            }}>
              <CheckCircle size={48} style={{ margin: '0 auto 12px', color: '#22c55e', opacity: 0.5 }} />
              <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>No sessions pending review</p>
              <p style={{ fontSize: '14px' }}>Create a proctored exam and have a student take it</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {sessions.map((session) => (
                <div
                  key={session.id || Math.random()}
                  onClick={() => handleSessionClick(session)}
                  style={{
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedSession?.id === session.id ? '#eff6ff' : 'white',
                    borderColor: selectedSession?.id === session.id ? '#2563eb' : '#e2e8f0',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div>
                      <p style={{
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: 0,
                      }}>
                        {session.student_name || 'Unknown Student'}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '4px 0 0 0',
                      }}>
                        {session.exam_title || 'Unknown Exam'}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '4px',
                      }}>
                        {session.started_at ? new Date(session.started_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: session.review_status === 'FLAGGED' ? '#fee2e2' :
                                  session.review_status === 'REVIEWED' ? '#dcfce7' : '#fef3c7',
                      color: session.review_status === 'FLAGGED' ? '#dc2626' :
                             session.review_status === 'REVIEWED' ? '#16a34a' : '#d97706',
                    }}>
                      {session.review_status || 'PENDING'}
                    </span>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#64748b',
                    display: 'flex',
                    gap: '16px',
                  }}>
                    <span>📸 Captures: {session.total_captures || 0}</span>
                    <span>⚠️ Suspicious: {session.suspicious_events || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* RIGHT PANEL - Images */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          padding: '24px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          {selectedSession ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Camera size={18} style={{ color: '#3b82f6' }} />
                    {selectedSession.student_name || 'Student'}
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '4px 0 0 0',
                  }}>
                    {selectedSession.exam_title || 'Exam'}
                  </p>
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  background: '#f8fafc',
                  padding: '4px 12px',
                  borderRadius: '6px',
                }}>
                  Total: {images.length} images
                </div>
              </div>
              
              {images.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#94a3b8',
                }}>
                  <Camera size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 500 }}>No images captured for this session</p>
                  <p style={{ fontSize: '14px' }}>The student may not have started the exam yet</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}>
                  {images.map((image) => (
                    <div
                      key={image.id || Math.random()}
                      onClick={() => setSelectedImage(image)}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `2px solid ${image.is_suspicious ? '#dc2626' : '#e2e8f0'}`,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img
                        src={getImageUrl(image.image)}
                        alt="Proctoring capture"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150x120?text=Image+Error';
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '4px 8px',
                        textAlign: 'center',
                      }}>
                        {image.capture_time ? new Date(image.capture_time).toLocaleTimeString() : ''}
                      </div>
                      {image.is_suspicious && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(220,38,38,0.9)',
                          borderRadius: '50%',
                          padding: '4px',
                        }}>
                          <AlertTriangle size={16} color="white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#94a3b8',
            }}>
              <Camera size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, fontSize: '16px' }}>Select a session to view images</p>
              <p style={{ fontSize: '14px' }}>Click on a session from the left panel</p>
            </div>
          )}
        </div>
      </div>
      
      {/* ============ IMAGE DETAIL MODAL ============ */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setSelectedImage(null)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ position: 'relative' }}>
              <img
                src={getImageUrl(selectedImage.image)}
                alt="Proctoring capture"
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'white',
                  borderRadius: '50%',
                  padding: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <XCircle size={24} color="#374151" />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0,
                  }}>
                    📅 {selectedImage.capture_time ? new Date(selectedImage.capture_time).toLocaleString() : '—'}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '4px 0 0 0',
                  }}>
                    Face Detected: {selectedImage.face_detected ? '✅ Yes' : '❌ No'}
                    {selectedImage.multiple_faces && ' | 👥 Multiple Faces'}
                    {selectedImage.mobile_detected && ' | 📱 Mobile Detected'}
                  </p>
                </div>
                {selectedImage.is_suspicious && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}>
                    <AlertTriangle size={16} />
                    Suspicious
                  </span>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                {!selectedImage.is_suspicious ? (
                  <button
                    onClick={() => {
                      setFlagReason('');
                      setShowFlagReasonModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      minWidth: '120px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    🚨 Flag as Suspicious
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowClearFlagModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      minWidth: '120px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                  >
                    ✅ Clear Flag
                  </button>
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#e2e8f0',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    minWidth: '120px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFlagReasonModal && selectedImage && (
        <div role="dialog" aria-modal="true" aria-labelledby="flag-image-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h2 id="flag-image-title" style={{ margin: '0 0 12px', fontSize: '20px' }}>Flag image as suspicious</h2>
            <label style={{ display: 'block', marginBottom: '6px', color: '#475569' }} htmlFor="flag-reason">Reason</label>
            <textarea id="flag-reason" autoFocus rows="4" value={flagReason} onChange={(event) => setFlagReason(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowFlagReasonModal(false)} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={submitFlag} disabled={!flagReason.trim()} style={{ padding: '9px 14px', border: 'none', borderRadius: '6px', background: '#dc2626', color: 'white', cursor: flagReason.trim() ? 'pointer' : 'not-allowed', opacity: flagReason.trim() ? 1 : 0.6 }}>Flag image</button>
            </div>
          </div>
        </div>
      )}

      {showClearFlagModal && selectedImage && (
        <div role="dialog" aria-modal="true" aria-labelledby="clear-flag-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h2 id="clear-flag-title" style={{ margin: '0 0 10px', fontSize: '20px' }}>Clear image flag?</h2>
            <p style={{ margin: 0, color: '#475569' }}>This image will no longer be marked suspicious.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" onClick={() => setShowClearFlagModal(false)} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={async () => { if (await clearFlag(selectedImage.id)) { setShowClearFlagModal(false); setSelectedImage(null); } }} style={{ padding: '9px 14px', border: 'none', borderRadius: '6px', background: '#16a34a', color: 'white', cursor: 'pointer' }}>Clear flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringReview;