// frontend/src/pages/teacher/TeacherExams.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, FileText, Clock, Calendar, Eye, Trash2, CheckCircle, XCircle, X, Edit, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const TeacherExams = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [creatingExam, setCreatingExam] = useState(false);
  
  // State for editing EXAMS
  const [isEditing, setIsEditing] = useState(false);
  const [editExamId, setEditExamId] = useState(null);

  // State for editing QUESTIONS
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // NEW: State for Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'exam' or 'question'
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    description: '',
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    total_marks: 100,
    is_published: false,
    proctoring_enabled: true,
  });
  
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'MCQ',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: '',
    marks: 1,
  });

  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/');
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) {
        data = data.results;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      toast.error('Failed to load exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) {
        data = data.results;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      const teacherCourses = data.filter(c => c.instructor === user?.id);
      setCourses(teacherCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    }
  };

  const fetchQuestions = async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}/questions/`);
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) {
        data = data.results;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setQuestions([]);
    }
  };

  const fetchSubmissions = async (examId) => {
    try {
      const response = await api.get(`/exams/submissions/${examId}/`);
      setSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreatingExam(true);
    try {
      const payload = {
        ...formData,
        created_by: user?.id,
      };
      
      let response;
      if (isEditing) {
        response = await api.patch(`/exams/${editExamId}/`, payload);
        toast.success('Exam updated successfully!');
      } else {
        response = await api.post('/exams/', payload);
        toast.success('Exam created successfully!');
      }
      
      setShowCreateModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('❌ Failed to save exam:', error);
      toast.error(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} exam`);
    } finally {
      setCreatingExam(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditExamId(null);
    setFormData({
      course: '',
      title: '',
      description: '',
      duration_minutes: 60,
      start_time: '',
      end_time: '',
      total_marks: 100,
      is_published: false,
      proctoring_enabled: true,
    });
  };

  const handleEditClick = (exam) => {
    setIsEditing(true);
    setEditExamId(exam.id);
    
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      course: exam.course,
      title: exam.title,
      description: exam.description || '',
      duration_minutes: exam.duration_minutes,
      start_time: formatDateTime(exam.start_time),
      end_time: formatDateTime(exam.end_time),
      total_marks: exam.total_marks,
      is_published: exam.is_published,
      proctoring_enabled: exam.proctoring_enabled !== false,
    });
    
    setShowCreateModal(true);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) {
      toast.error('No exam selected');
      return;
    }
    
    setLoading(true);
    try {
      let questionData = {
        text: questionForm.text,
        type: questionForm.type,
        marks: parseFloat(questionForm.marks) || 1,
      };
      
      if (questionForm.type === 'MCQ') {
        const options = Object.values(questionForm.options).filter(opt => opt && opt.trim() !== '');
        if (options.length < 2) {
          toast.error('Please provide at least 2 options');
          setLoading(false);
          return;
        }
        questionData.options = options;
        questionData.correct_answer = questionForm.correct_answer;
      } else if (questionForm.type === 'TF') {
        if (!questionForm.correct_answer) {
          toast.error('Please select the correct answer (True/False)');
          setLoading(false);
          return;
        }
        questionData.correct_answer = questionForm.correct_answer;
      } else if (questionForm.type === 'SHORT') {
        questionData.correct_answer = '';
      }
      
      if (editingQuestionId) {
        await api.patch(`/exams/questions/${editingQuestionId}/`, questionData);
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
      } else {
        await api.post(`/exams/${selectedExam.id}/questions/`, questionData);
        toast.success('Question added successfully!');
      }
      
      fetchQuestions(selectedExam.id);
      setQuestionForm({
        text: '',
        type: 'MCQ',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: '',
        marks: 1,
      });
    } catch (error) {
      console.error('❌ Failed to save question:', error);
      toast.error(error.response?.data?.error || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestionClick = (question) => {
    setEditingQuestionId(question.id);
    
    let optionsObj = { A: '', B: '', C: '', D: '' };
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((opt, index) => {
        if (index < 4) {
          optionsObj[['A', 'B', 'C', 'D'][index]] = opt;
        }
      });
    } else if (question.options) {
      optionsObj = { ...optionsObj, ...question.options };
    }

    setQuestionForm({
      text: question.text,
      type: question.type,
      options: optionsObj,
      correct_answer: question.correct_answer || '',
      marks: question.marks,
    });

    const modal = document.getElementById('questions-modal-scroll');
    if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Trigger delete modal for questions
  const triggerDeleteQuestion = (questionId) => {
    setDeleteType('question');
    setDeleteId(questionId);
    setShowDeleteModal(true);
  };

  // NEW: Trigger delete modal for exams
  const triggerDeleteExam = (examId) => {
    setDeleteType('exam');
    setDeleteId(examId);
    setShowDeleteModal(true);
  };

  // NEW: Confirm delete function
  const confirmDelete = async () => {
    setLoading(true);
    try {
      if (deleteType === 'question') {
        await api.delete(`/exams/questions/${deleteId}/`);
        toast.success('Question deleted');
        fetchQuestions(selectedExam.id);
      } else if (deleteType === 'exam') {
        await api.delete(`/exams/${deleteId}/`);
        toast.success('Exam deleted');
        fetchExams();
      }
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteType('');
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishExam = async (examId, publish) => {
    try {
      await api.patch(`/exams/${examId}/`, { is_published: publish });
      toast.success(publish ? 'Exam published!' : 'Exam unpublished');
      fetchExams();
    } catch (error) {
      toast.error('Failed to update exam status');
    }
  };

  // Essay Grading State and Functions
  const [showEssayGradingModal, setShowEssayGradingModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [essayAnswers, setEssayAnswers] = useState([]);
  const [gradingLoading, setGradingLoading] = useState(false);

  const viewEssayAnswers = async (attemptId) => {
    try {
      setGradingLoading(true);
      const response = await api.get(`/exams/attempt/${attemptId}/essay-answers/`);
      setEssayAnswers(response.data);
      setSelectedAttempt(attemptId);
      setShowEssayGradingModal(true);
    } catch (error) {
      toast.error('Failed to load essay answers');
    } finally {
      setGradingLoading(false);
    }
  };

  const gradeEssayAnswer = async (answerId, marks, feedback = '') => {
    try {
      await api.post('/exams/grade-essay/', {
        answer_id: answerId,
        marks_obtained: marks,
        feedback: feedback
      });
      toast.success('Essay graded successfully!');
      if (selectedAttempt) {
        const response = await api.get(`/exams/attempt/${selectedAttempt}/essay-answers/`);
        setEssayAnswers(response.data);
      }
    } catch (error) {
      toast.error('Failed to grade essay');
    }
  };

  const handleGradeAnswer = async (answerId, marks) => {
    try {
      await api.post(`/exams/answers/${answerId}/grade/`, { marks_obtained: marks });
      toast.success('Answer graded successfully!');
      if (selectedExam) {
        fetchSubmissions(selectedExam.id);
      }
      setShowGradeModal(false);
    } catch (error) {
      toast.error('Failed to grade answer');
    }
  };

  const openQuestionsModal = (exam) => {
    setSelectedExam(exam);
    fetchQuestions(exam.id);
    setEditingQuestionId(null);
    setQuestionForm({
      text: '',
      type: 'MCQ',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: '',
      marks: 1,
    });
    setShowQuestionsModal(true);
  };
  
  const openSubmissionsModal = (exam) => {
    setSelectedExam(exam);
    fetchSubmissions(exam.id);
    setShowSubmissions(true);
  };

  const getStatusBadge = (exam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    
    if (!exam.is_published) {
      return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#f3f4f6', color: '#6b7280' }}>Draft</span>;
    } else if (now < start) {
      return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fef3c7', color: '#d97706' }}>Scheduled</span>;
    } else if (now >= start && now <= end) {
      return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#d1fae5', color: '#059669' }}>Ongoing</span>;
    } else {
      return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#dbeafe', color: '#2563eb' }}>Completed</span>;
    }
  };

  if (loading && exams.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
        <div style={{ animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '48px', width: '48px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .exam-grid { grid-template-columns: 1fr !important; }
          .exam-actions { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Exams</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            {exams.length} exam{exams.length !== 1 ? 's' : ''} created
            {courses.length === 0 && ' • Create a course first'}
          </p>
        </div>
        <button
          onClick={() => {
            if (courses.length === 0) {
              toast.error('Please create a course first before creating an exam');
              return;
            }
            resetForm();
            setShowCreateModal(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: courses.length === 0 ? '#94a3b8' : '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', cursor: courses.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <Plus size={16} />
          Create Exam
        </button>
      </div>

      {courses.length === 0 && (
        <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 500, color: '#92400e', margin: 0 }}>You need to create a course before you can create an exam.</p>
            <p style={{ fontSize: '14px', color: '#78350f', margin: '4px 0 0 0' }}>Go to <strong>My Courses</strong> tab to create a course first.</p>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>No exams created yet</h3>
          <p style={{ color: '#6b7280' }}>
            {courses.length > 0 ? 'Click the button above to create your first exam.' : 'Create a course first, then you can create exams.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="exam-grid">
          {exams.map((exam) => (
            <div key={exam.id} style={{
              background: 'white', borderRadius: '12px', padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{exam.title}</h3>
                    {getStatusBadge(exam)}
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{exam.course_title} - {exam.course_code}</p>
                  <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>{exam.description || 'No description'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                      <Clock size={14} /> {exam.duration_minutes} minutes
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                      <Calendar size={14} /> {new Date(exam.start_time).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                      <FileText size={14} /> {exam.total_marks} marks
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                      <CheckCircle size={14} color={exam.is_published ? '#22c55e' : '#6b7280'} />
                      {exam.is_published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }} className="exam-actions">
                  <button
                    onClick={() => openQuestionsModal(exam)}
                    style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: '#eff6ff', color: '#2563eb' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                    title="Add Questions"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => openSubmissionsModal(exam)}
                    style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: '#fef3c7', color: '#d97706' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                    title="View Submissions"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handlePublishExam(exam.id, !exam.is_published)}
                    style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: exam.is_published ? '#fef3c7' : '#dcfce7', color: exam.is_published ? '#d97706' : '#16a34a' }}
                    onMouseEnter={(e) => {
                      if (exam.is_published) e.currentTarget.style.background = '#fde68a';
                      else e.currentTarget.style.background = '#bbf7d0';
                    }}
                    onMouseLeave={(e) => {
                      if (exam.is_published) e.currentTarget.style.background = '#fef3c7';
                      else e.currentTarget.style.background = '#dcfce7';
                    }}
                    title={exam.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {exam.is_published ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => handleEditClick(exam)}
                    style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: '#f3f4f6', color: '#4b5563' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    title="Edit Exam"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => triggerDeleteExam(exam.id)}
                    style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: '#fee2e2', color: '#dc2626' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EXAM MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                {isEditing ? 'Edit Exam' : 'Create New Exam'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateExam}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Course *</label>
                <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}>
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.course_code} - {course.title}</option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>You need to create a course first. Go to "My Courses" tab.</p>
                )}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Exam Title *</label>
                <input type="text" required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Midterm Exam" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Description</label>
                <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Exam description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Start Time *</label>
                  <input type="datetime-local" required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>End Time *</label>
                  <input type="datetime-local" required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Duration (min)</label>
                  <input type="number" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Total Marks</label>
                  <input type="number" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingExam || courses.length === 0}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', background: (creatingExam || courses.length === 0) ? '#94a3b8' : '#2563eb', color: 'white', cursor: (creatingExam || courses.length === 0) ? 'not-allowed' : 'pointer', opacity: (creatingExam || courses.length === 0) ? 0.6 : 1, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { if (!creatingExam && courses.length > 0) e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { if (!creatingExam && courses.length > 0) e.currentTarget.style.background = '#2563eb'; }}>
                  {creatingExam ? 'Saving...' : (isEditing ? 'Update Exam' : 'Create Exam')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTIONS MODAL */}
      {showQuestionsModal && selectedExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowQuestionsModal(false)}>
          <div id="questions-modal-scroll" style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedExam.title} - Questions</h2>
              <button onClick={() => setShowQuestionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>
            
            {/* Add / Edit Question Form */}
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: editingQuestionId ? '2px solid #2563eb' : '1px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                </h3>
                {editingQuestionId && (
                  <button 
                    onClick={() => {
                      setEditingQuestionId(null);
                      setQuestionForm({ text: '', type: 'MCQ', options: { A: '', B: '', C: '', D: '' }, correct_answer: '', marks: 1 });
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleAddQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Question Type</label>
                    <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value, options: { A: '', B: '', C: '', D: '' }, correct_answer: '' })}>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="TF">True/False</option>
                      <option value="SHORT">Short Answer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Marks</label>
                    <input type="number" step="0.5" min="0.5" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Question Text</label>
                  <textarea required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
                    value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} placeholder="Enter your question here..." />
                </div>
                
                {questionForm.type === 'MCQ' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div key={letter}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Option {letter}</label>
                        <input type="text" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                          value={questionForm.options[letter] || ''}
                          onChange={(e) => setQuestionForm({ ...questionForm, options: { ...questionForm.options, [letter]: e.target.value } })}
                          placeholder={`Option ${letter}`} />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Correct Answer</label>
                      <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                        value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}>
                        <option value="">Select correct answer</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {questionForm.type === 'TF' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Correct Answer</label>
                    <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                      value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}>
                      <option value="">Select answer</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  </div>
                )}
                
                {questionForm.type === 'SHORT' && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Short answer questions are manually graded by the instructor.</p>
                  </div>
                )}
                
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '6px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}>
                  {loading ? 'Saving...' : (editingQuestionId ? 'Update Question' : 'Add Question')}
                </button>
              </form>
            </div>
            
            {/* Questions List */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Questions ({questions.length})</h3>
              {questions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '16px' }}>No questions added yet.</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{q.type}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Marks: {q.marks}</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#111827', marginTop: '4px', marginBottom: '4px' }}><strong>Q{idx + 1}:</strong> {q.text}</p>
                        {q.type === 'MCQ' && q.options && (
                          <div style={{ marginTop: '4px' }}>
                            {Object.entries(q.options).map(([key, value]) => (
                              <p key={key} style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 2px 16px' }}>
                                <strong>{key}:</strong> {value} {q.correct_answer === key && <span style={{ color: '#16a34a' }}>✓</span>}
                              </p>
                            ))}
                          </div>
                        )}
                        {q.type === 'TF' && (
                          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}><strong>Correct:</strong> {q.correct_answer}</p>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleEditQuestionClick(q)} 
                          style={{ padding: '4px', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                          title="Edit Question"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button onClick={() => triggerDeleteQuestion(q.id)} disabled={loading}
                          style={{ padding: '4px', background: 'none', border: 'none', color: '#dc2626', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <button onClick={() => setShowQuestionsModal(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && selectedExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSubmissions(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedExam.title} - Submissions</h2>
              <button onClick={() => setShowSubmissions(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>
            
            {submissions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>No submissions yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Student</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Score</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Percentage</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>{sub.student_name}</td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>{sub.score || 'Pending'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>{sub.percentage || '0'}%</td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>
                          {sub.passed ? (
                            <span style={{ color: '#16a34a' }}>Passed</span>
                          ) : (
                            <span style={{ color: '#dc2626' }}>Failed</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              const marks = prompt('Enter marks for this student:');
                              if (marks !== null && sub.id) {
                                handleGradeAnswer(sub.id, parseFloat(marks));
                              }
                            }}
                            style={{ padding: '4px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
                            Grade
                          </button>
                          <button
                            onClick={() => viewEssayAnswers(sub.attempt_id)}
                            style={{ padding: '4px 12px', background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            View Essays
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <button onClick={() => setShowSubmissions(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESSAY GRADING MODAL */}
      {showEssayGradingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowEssayGradingModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                Essay Answers
              </h2>
              <button onClick={() => setShowEssayGradingModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span><strong>Student:</strong> {essayAnswers.student_name}</span>
              <span><strong>Exam:</strong> {essayAnswers.exam_title}</span>
              <span><strong>Progress:</strong> {essayAnswers.graded_count}/{essayAnswers.total_count} graded</span>
              <span><strong>Score:</strong> {essayAnswers.essay_obtained_marks || 0}/{essayAnswers.total_essay_marks || 0}</span>
            </div>

            {essayAnswers.essay_answers?.map((answer, index) => (
              <div key={answer.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: answer.graded ? '#f0fdf4' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    Question {index + 1}: {answer.question_text}
                  </h4>
                  <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, background: answer.graded ? '#dcfce7' : '#fef3c7', color: answer.graded ? '#16a34a' : '#d97706' }}>
                    {answer.graded ? '✅ Graded' : '⏳ Pending'}
                  </span>
                </div>
                
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                    {answer.answer_text || 'No answer provided'}
                  </p>
                </div>

                {answer.graded ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 500, color: '#16a34a' }}>
                      Marks: {answer.marks_obtained}/{answer.max_marks}
                    </span>
                    {answer.feedback && (
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        Feedback: {answer.feedback}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Graded by: {answer.graded_by}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginRight: '8px' }}>
                        Marks (0-{answer.max_marks}):
                      </label>
                      <input type="number" id={`marks_${answer.id}`} min="0" max={answer.max_marks} step="0.5" style={{ width: '80px', padding: '4px 8px', border: '2px solid #e2e8f0', borderRadius: '4px', fontSize: '14px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="text" id={`feedback_${answer.id}`} placeholder="Add feedback (optional)" style={{ width: '100%', padding: '4px 8px', border: '2px solid #e2e8f0', borderRadius: '4px', fontSize: '14px' }} />
                    </div>
                    <button
                      onClick={() => {
                        const marksInput = document.getElementById(`marks_${answer.id}`);
                        const feedbackInput = document.getElementById(`feedback_${answer.id}`);
                        const marks = parseFloat(marksInput.value);
                        if (isNaN(marks) || marks < 0 || marks > answer.max_marks) {
                          toast.error(`Please enter valid marks (0-${answer.max_marks})`);
                          return;
                        }
                        gradeEssayAnswer(answer.id, marks, feedbackInput.value);
                      }}
                      style={{ padding: '6px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                      Grade
                    </button>
                  </div>
                )}
              </div>
            ))}

            {essayAnswers.total_count > 0 && essayAnswers.all_graded && (
              <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <CheckCircle size={24} color="#16a34a" style={{ display: 'inline', marginRight: '8px' }} />
                <span style={{ fontWeight: 600, color: '#16a34a' }}>All essays graded! Student can now view results.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '50%' }}>
                <AlertTriangle size={32} color="#dc2626" />
              </div>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
              Delete {deleteType === 'exam' ? 'Exam' : 'Question'}?
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px 0' }}>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#dc2626', color: 'white', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExams;