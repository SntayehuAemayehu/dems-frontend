// frontend/src/pages/teacher/TeacherCourses.jsx
// COMPLETE - WITH VIDEO UPLOAD SUPPORT AND FIXES

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Plus, BookOpen, Users, Clock, Eye, Video, 
  Upload, FileText, Trash2, X, Calendar, 
  Paperclip, Download, CheckCircle, AlertCircle,
  Edit, Copy, Link as LinkIcon, MessageSquare,
  File, FolderOpen, Archive, Play, Music,
  Image, FileSpreadsheet, FileCode, FileJson
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourses } from '../../store/slices/courseSlice';
import api from '../../api/api';

const TeacherCourses = () => {
  const dispatch = useDispatch();
  const { courses = [], isLoading = false } = useSelector((state) => state.courses || { courses: [] });
  const { user } = useSelector((state) => state.auth || {});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    course_code: '',
    title: '',
    description: '',
    credit_hours: 3,
    semester: '1',
    capacity: 30,
  });
  const [materialData, setMaterialData] = useState({
    title: '',
    description: '',
    material_type: 'PDF',
    file: null,
  });
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    due_date: '',
    total_marks: 100,
    attachment: null,
    video_attachment: null,
    link_url: '',
  });
  const [filePreview, setFilePreview] = useState(null);
  const [assignmentFilePreview, setAssignmentFilePreview] = useState(null);
  const [assignmentVideoPreview, setAssignmentVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const fetchTeacherCourses = async () => {
    try {
      await dispatch(fetchCourses());
      console.log('📚 All courses:', courses);
      console.log('👤 Current user:', user);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  // Filter courses created by this teacher
  const myCourses = Array.isArray(courses) ? courses.filter(c => c.instructor === user?.id) : [];

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const coursePayload = {
        ...courseData,
        instructor: user?.id,
      };
      
      console.log('📝 Creating course with payload:', coursePayload);
      
      const response = await api.post('/courses/', coursePayload);
      console.log('✅ Course created:', response.data);
      
      toast.success('Course created successfully!');
      setShowCreateModal(false);
      setCourseData({
        course_code: '',
        title: '',
        description: '',
        credit_hours: 3,
        semester: '1',
        capacity: 30,
      });
      await dispatch(fetchCourses());
    } catch (error) {
      console.error('❌ Failed to create course:', error);
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // ============ MATERIAL FUNCTIONS ============
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialData.file) {
      toast.error('Please select a file');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('title', materialData.title);
    formData.append('description', materialData.description);
    formData.append('material_type', materialData.material_type);
    formData.append('file', materialData.file);
    
    try {
      const response = await api.post(`/courses/${selectedCourse.id}/materials/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Ensure token is sent
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      
      console.log('✅ Material uploaded:', response.data);
      toast.success('Material uploaded successfully!');
      setShowMaterialModal(false);
      fetchMaterials(selectedCourse.id);
      setMaterialData({
        title: '',
        description: '',
        material_type: 'PDF',
        file: null,
      });
      setFilePreview(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('❌ Failed to upload material:', error);
      if (error.response?.status === 403) {
        toast.error('Permission denied. Please make sure you are the instructor of this course.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload material');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/materials/`);
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setMaterials([]);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await api.delete(`/courses/materials/${materialId}/`);
      toast.success('Material deleted');
      fetchMaterials(selectedCourse.id);
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  // ============ ASSIGNMENT FUNCTIONS ============
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentData.title) {
      toast.error('Assignment title is required');
      return;
    }
    if (!assignmentData.due_date) {
      toast.error('Due date is required');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('title', assignmentData.title);
    formData.append('description', assignmentData.description || '');
    formData.append('due_date', assignmentData.due_date);
    formData.append('total_marks', assignmentData.total_marks);
    
    if (assignmentData.attachment) {
      formData.append('attachment', assignmentData.attachment);
    }
    
    if (assignmentData.video_attachment) {
      formData.append('video_attachment', assignmentData.video_attachment);
    }
    
    if (assignmentData.link_url) {
      formData.append('link_url', assignmentData.link_url);
    }
    
    try {
      const response = await api.post(`/courses/${selectedCourse.id}/assignments/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      
      console.log('✅ Assignment created:', response.data);
      toast.success('Assignment created successfully!');
      setShowAssignmentModal(false);
      fetchAssignments(selectedCourse.id);
      setAssignmentData({
        title: '',
        description: '',
        due_date: '',
        total_marks: 100,
        attachment: null,
        video_attachment: null,
        link_url: '',
      });
      setAssignmentFilePreview(null);
      setAssignmentVideoPreview(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('❌ Failed to create assignment:', error);
      if (error.response?.status === 403) {
        toast.error('Permission denied. Please make sure you are the instructor of this course.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create assignment');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (courseId) => {
    setAssignmentsLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}/assignments/`);
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/courses/assignments/${assignmentId}/`);
      toast.success('Assignment deleted');
      fetchAssignments(selectedCourse.id);
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const startLiveClass = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/start-live/`);
      toast.success('Live class started! Students can now join.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start live class');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Allow videos up to 500MB
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size exceeds 500MB limit');
        return;
      }
      
      // Check if it's a video
      const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      const isVideo = videoTypes.includes(file.type) || file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i);
      
      setMaterialData({ 
        ...materialData, 
        file: file,
        material_type: isVideo ? 'VIDEO' : materialData.material_type 
      });
      setFilePreview(file.name);
    }
  };

  const handleAssignmentFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setAssignmentData({ ...assignmentData, attachment: file });
      setAssignmentFilePreview(file.name);
    }
  };

  const handleAssignmentVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Video file size exceeds 500MB limit');
        return;
      }
      
      // Validate video type
      const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      if (!videoTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
        toast.error('Please select a valid video file (MP4, WebM, MOV, AVI, MKV)');
        return;
      }
      
      setAssignmentData({ ...assignmentData, video_attachment: file });
      setAssignmentVideoPreview(file.name);
    }
  };

  const openMaterialModal = (course) => {
    setSelectedCourse(course);
    fetchMaterials(course.id);
    setMaterialData({
      title: '',
      description: '',
      material_type: 'PDF',
      file: null,
    });
    setFilePreview(null);
    setUploadProgress(0);
    setShowMaterialModal(true);
  };

  const openAssignmentModal = (course) => {
    setSelectedCourse(course);
    fetchAssignments(course.id);
    setAssignmentData({
      title: '',
      description: '',
      due_date: '',
      total_marks: 100,
      attachment: null,
      video_attachment: null,
      link_url: '',
    });
    setAssignmentFilePreview(null);
    setAssignmentVideoPreview(null);
    setUploadProgress(0);
    setShowAssignmentModal(true);
  };

  const getMaterialIcon = (type) => {
    switch(type?.toUpperCase()) {
      case 'PDF': return <FileText size={16} />;
      case 'VIDEO': return <Play size={16} />;
      case 'SLIDE': return <FileSpreadsheet size={16} />;
      case 'DOC': return <File size={16} />;
      case 'IMAGE': return <Image size={16} />;
      default: return <File size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '256px',
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          height: '48px',
          width: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#2563eb',
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
          .action-buttons {
            flex-wrap: wrap !important;
          }
        }
      `}</style>

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
          }}>My Courses</h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            {myCourses.length} course{myCourses.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
        >
          <Plus size={18} />
          Create Course
        </button>
      </div>

      {myCourses.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <BookOpen size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#111827',
            marginBottom: '8px',
          }}>No courses created yet</h3>
          <p style={{ color: '#6b7280' }}>Click the button above to create your first course.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }} className="course-grid">
          {myCourses.map((course) => (
            <div key={course.id} style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>{course.course_code}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    background: course.is_approved ? '#dcfce7' : '#fef3c7',
                    color: course.is_approved ? '#16a34a' : '#d97706',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {course.is_approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginTop: '8px',
                  marginBottom: '8px',
                }}>{course.title}</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{course.description || 'No description provided'}</p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    <Users size={16} style={{ marginRight: '8px' }} />
                    {course.enrolled_count || 0} / {course.capacity} students
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    <Clock size={16} style={{ marginRight: '8px' }} />
                    Semester {course.semester}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} />
                    {course.credit_hours} Credit Hours
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                }} className="action-buttons">
                  <Link
                    to={`/courses/${course.id}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '6px',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    View
                  </Link>
                  
                  <button
                    onClick={() => openMaterialModal(course)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#dbeafe',
                      color: '#2563eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
                  >
                    <Upload size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Materials
                  </button>
                  
                  <button
                    onClick={() => openAssignmentModal(course)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#fef3c7',
                      color: '#d97706',
                      borderRadius: '6px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                  >
                    <Paperclip size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Assignments
                  </button>
                  
                  <button
                    onClick={() => startLiveClass(course.id)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#22c55e',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                  >
                    <Video size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Live
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ CREATE COURSE MODAL ============ */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                margin: 0,
              }}>Create New Course</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS101"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  value={courseData.course_code}
                  onChange={(e) => setCourseData({ ...courseData, course_code: e.target.value.toUpperCase() })}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Course Title *</label>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Description</label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="Course description..."
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}>Credit Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    value={courseData.credit_hours}
                    onChange={(e) => setCourseData({ ...courseData, credit_hours: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    value={courseData.capacity}
                    onChange={(e) => setCourseData({ ...courseData, capacity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Semester</label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                  value={courseData.semester}
                  onChange={(e) => setCourseData({ ...courseData, semester: e.target.value })}
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'none',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: loading ? '#94a3b8' : '#2563eb',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MATERIAL UPLOAD MODAL ============ */}
      {showMaterialModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowMaterialModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                margin: 0,
              }}>
                <Upload size={20} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                Course Materials - {selectedCourse.title}
              </h2>
              <button
                onClick={() => setShowMaterialModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* List existing materials */}
            {materials.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}>Uploaded Materials ({materials.length})</h3>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}>
                  {materials.map((material) => (
                    <div key={material.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        {getMaterialIcon(material.material_type)}
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{material.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{material.material_type}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {material.file && (
                          <a
                            href={material.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 10px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textDecoration: 'none',
                            }}
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload form */}
            <form onSubmit={handleUploadMaterial}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Title *</label>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  value={materialData.title}
                  onChange={(e) => setMaterialData({ ...materialData, title: e.target.value })}
                  placeholder="Enter material title"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Description</label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '60px',
                    resize: 'vertical',
                  }}
                  value={materialData.description}
                  onChange={(e) => setMaterialData({ ...materialData, description: e.target.value })}
                  placeholder="Brief description of the material..."
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Material Type</label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                  value={materialData.material_type}
                  onChange={(e) => setMaterialData({ ...materialData, material_type: e.target.value })}
                >
                  <option value="PDF">PDF Document</option>
                  <option value="VIDEO">Video (MP4, WebM, etc.)</option>
                  <option value="SLIDE">Presentation</option>
                  <option value="DOC">Document</option>
                  <option value="IMAGE">Image</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>File * (Max 500MB for videos)</label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    required
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Upload size={24} style={{ color: '#9ca3af', marginBottom: '8px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {filePreview ? `Selected: ${filePreview}` : 'Click to browse or drag and drop'}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
                    Supported: PDF, DOC, DOCX, PPT, PPTX, MP4, WebM, MOV, AVI, MKV, JPG, PNG (Max 500MB)
                  </p>
                </div>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: '#2563eb',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'none',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || !materialData.file}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: loading || !materialData.file ? '#94a3b8' : '#2563eb',
                    color: 'white',
                    cursor: loading || !materialData.file ? 'not-allowed' : 'pointer',
                    opacity: loading || !materialData.file ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ ASSIGNMENT MODAL ============ */}
      {showAssignmentModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAssignmentModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                margin: 0,
              }}>
                <Paperclip size={20} style={{ display: 'inline', marginRight: '8px', color: '#d97706' }} />
                Assignments - {selectedCourse.title}
              </h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* List existing assignments */}
            {assignments.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}>Posted Assignments ({assignments.length})</h3>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {assignments.map((assignment) => (
                    <div key={assignment.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      background: new Date(assignment.due_date) < new Date() ? '#fef2f2' : 'white',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {assignment.title}
                          {new Date(assignment.due_date) < new Date() && (
                            <span style={{ fontSize: '10px', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                              Overdue
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Due: {new Date(assignment.due_date).toLocaleString()} • {assignment.total_marks} marks
                        </div>
                        {assignment.link_url && (
                          <div style={{ fontSize: '12px', color: '#2563eb' }}>
                            <LinkIcon size={12} style={{ display: 'inline' }} /> {assignment.link_url}
                          </div>
                        )}
                        {assignment.video_attachment && (
                          <div style={{ fontSize: '12px', color: '#dc2626' }}>
                            <Video size={12} style={{ display: 'inline' }} /> Video attached
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {assignment.attachment && (
                          <a
                            href={assignment.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 10px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textDecoration: 'none',
                            }}
                          >
                            <Download size={14} />
                          </a>
                        )}
                        {assignment.video_attachment && (
                          <a
                            href={assignment.video_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 10px',
                              background: '#dbeafe',
                              color: '#dc2626',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textDecoration: 'none',
                            }}
                          >
                            <Video size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Assignment Form */}
            <form onSubmit={handleCreateAssignment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Assignment Title *</label>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  placeholder="e.g., Midterm Assignment"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>Description</label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '60px',
                    resize: 'vertical',
                  }}
                  value={assignmentData.description}
                  onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                  placeholder="Describe the assignment requirements..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}>Due Date *</label>
                  <input
                    type="datetime-local"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    value={assignmentData.due_date}
                    onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}>Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    value={assignmentData.total_marks}
                    onChange={(e) => setAssignmentData({ ...assignmentData, total_marks: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>

              {/* Attachment Section */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>
                  Attachment (Optional)
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                onClick={() => document.getElementById('assignmentFileInput').click()}
                >
                  <input
                    id="assignmentFileInput"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleAssignmentFileChange}
                  />
                  <Paperclip size={20} style={{ color: '#9ca3af', marginBottom: '4px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {assignmentFilePreview ? `Selected: ${assignmentFilePreview}` : 'Click to attach a file (Optional)'}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '11px', margin: '4px 0 0 0' }}>
                    PDF, DOC, DOCX, PPT, PPTX, JPG, PNG (Max 50MB)
                  </p>
                </div>
              </div>

              {/* Video Attachment Section */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>
                  Video Attachment (Optional - Max 500MB)
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                onClick={() => document.getElementById('videoInput').click()}
                >
                  <input
                    id="videoInput"
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={handleAssignmentVideoChange}
                  />
                  <Video size={20} style={{ color: '#9ca3af', marginBottom: '4px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {assignmentVideoPreview ? `Selected: ${assignmentVideoPreview}` : 'Click to attach a video (Optional)'}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '11px', margin: '4px 0 0 0' }}>
                    MP4, WebM, MOV, AVI, MKV (Max 500MB)
                  </p>
                </div>
              </div>

              {/* Link URL Section */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}>
                  Link URL (Optional)
                </label>
                <input
                  type="url"
                  value={assignmentData.link_url || ''}
                  onChange={(e) => setAssignmentData({ ...assignmentData, link_url: e.target.value })}
                  placeholder="https://example.com/resource"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: '#d97706',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'none',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !assignmentData.title || !assignmentData.due_date}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: loading || !assignmentData.title || !assignmentData.due_date ? '#94a3b8' : '#d97706',
                    color: 'white',
                    cursor: loading || !assignmentData.title || !assignmentData.due_date ? 'not-allowed' : 'pointer',
                    opacity: loading || !assignmentData.title || !assignmentData.due_date ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;