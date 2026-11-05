// frontend/src/pages/teacher/TeacherExams.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Clock, Calendar, Eye, Trash2, CheckCircle, XCircle,
  X, Edit, AlertTriangle, MoreVertical, ArrowLeft, BookOpen, Search, RefreshCw, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getMediaUrl, getWebSocketUrl } from '../../api/api';

const TeacherExams = () => {
  const navigate = useNavigate();
  const [liveStreams, setLiveStreams] = useState({}); // { studentId: MediaStream }
  const liveWsRef = useRef(null);
  const livePcsRef = useRef({}); // peer connections
  const { user } = useSelector((state) => state.auth || {});
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Two-level navigation
  const [viewLevel, setViewLevel] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEssayGradingModal, setShowEssayGradingModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showLiveMonitoring, setShowLiveMonitoring] = useState(false);
  const [showProctoringImages, setShowProctoringImages] = useState(false);
  const [proctoringImages, setProctoringImages] = useState([]);
  const [proctoringStudents, setProctoringStudents] = useState([]);
  const [selectedProctoringStudent, setSelectedProctoringStudent] = useState(null);
  const [proctoringImagesType, setProctoringImagesType] = useState('QUIZ');
  const [proctoringImagesLoading, setProctoringImagesLoading] = useState(false);
  const [proctoringImagesError, setProctoringImagesError] = useState('');
  const [proctoringImagesCourse, setProctoringImagesCourse] = useState(null);

  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [essayAnswers, setEssayAnswers] = useState([]);
  const [liveStudents, setLiveStudents] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveExam, setLiveExam] = useState(null);
  const liveWsExamIdRef = useRef(null);
  const liveIceCandidatesRef = useRef({});

  const [isEditing, setIsEditing] = useState(false);
  const [editExamId, setEditExamId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const [creatingExam, setCreatingExam] = useState(false);
  const [gradingLoading, setGradingLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [formData, setFormData] = useState({
    course: '', title: '', description: '', duration_minutes: 60,
    start_time: '', end_time: '', total_marks: 100,
    is_published: true, proctoring_enabled: true,
    exam_type: 'MID',
  });

  const [questionForm, setQuestionForm] = useState({
    text: '', type: 'MCQ', options: { A: '', B: '', C: '', D: '' },
    correct_answer: '', marks: 1,
  });

  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/');
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
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
      if (data && data.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      const teacherCourses = data.filter((c) => Number(c.instructor) === Number(user?.id));
      setCourses(teacherCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    } finally {
      setCoursesLoaded(true);
    }
  };

  const fetchQuestions = async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}/questions/`);
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      setQuestions(data);
    } catch (error) {
      setQuestions([]);
    }
  };

  const fetchSubmissions = async (examId) => {
    try {
      const response = await api.get(`/exams/submissions/${examId}/`);
      if (response.data && Array.isArray(response.data.submissions)) {
        setSubmissions(response.data.submissions);
      } else if (Array.isArray(response.data)) {
        setSubmissions(response.data);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      setSubmissions([]);
    }
  };

  // ==================== LIVE MONITORING ====================
  const openLiveMonitoring = (exam) => {
    setOpenMenuId(null);
    navigate(`/teacher/exams/${exam.id}/live`);
  };

  const connectLiveWebSocket = (examId) => {
  // Already open → do nothing
  if (
    liveWsRef.current &&
    liveWsExamIdRef.current === examId &&
    liveWsRef.current.readyState === WebSocket.OPEN
  ) {
    return;
  }

  // Already connecting → do nothing
  if (
    liveWsRef.current &&
    liveWsExamIdRef.current === examId &&
    liveWsRef.current.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  // Close old one cleanly
  if (liveWsRef.current) {
    try {
      liveWsRef.current.onclose = null; // prevent old onclose from running
      liveWsRef.current.close();
    } catch (e) {}
  }
  Object.values(livePcsRef.current).forEach((pc) => pc.close());
  livePcsRef.current = {};
  liveIceCandidatesRef.current = {};
  setLiveStreams({});

  const token = localStorage.getItem('access_token');
  if (!token) return;

  const wsUrl = getWebSocketUrl(`/ws/exam-proctor/${examId}/`, { token });

  const ws = new WebSocket(wsUrl);
  liveWsRef.current = ws;
  liveWsExamIdRef.current = examId;

  ws.onopen = () => {
    console.log('📡 Teacher connected to exam proctor room');
  };

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'offer' && data.sender_id) {
        await handleStudentOffer(data);
      }

      if (data.type === 'ice_candidate' && data.candidate && data.sender_id) {
        const pc = livePcsRef.current[data.sender_id];
        if (pc) {
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.warn('ICE error:', e);
            }
          } else {
            const candidates = liveIceCandidatesRef.current[data.sender_id] || [];
            candidates.push(data.candidate);
            liveIceCandidatesRef.current[data.sender_id] = candidates;
          }
        }
      }

      if (data.type === 'user_leave' && data.user_id) {
        livePcsRef.current[data.user_id]?.close();
        delete livePcsRef.current[data.user_id];
        delete liveIceCandidatesRef.current[data.user_id];
        setLiveStreams((prev) => {
          const next = { ...prev };
          delete next[data.user_id];
          return next;
        });
      }
    } catch (err) {
      console.error('Teacher WS message error:', err);
    }
  };

  ws.onclose = () => {
    console.log('Teacher proctor WebSocket closed');
    // Only clear the ref if this is still the current socket
    if (liveWsRef.current === ws) {
      liveWsRef.current = null;
      liveWsExamIdRef.current = null;
    }
  };

  ws.onerror = (err) => {
    console.error('Teacher WS error:', err);
  };
};

  const handleStudentOffer = async (data) => {
    const studentId = data.sender_id;
    livePcsRef.current[studentId]?.close();
    liveIceCandidatesRef.current[studentId] = [];

    // Create peer connection for this student
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);
    livePcsRef.current[studentId] = pc;

    // When we receive the student's video track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setLiveStreams((prev) => ({
          ...prev,
          [studentId]: event.streams[0],
        }));
      }
    };

    // Send ICE candidates back to student
    pc.onicecandidate = (event) => {
      if (event.candidate && liveWsRef.current?.readyState === WebSocket.OPEN) {
        liveWsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate,
            sender_id: user?.id,
          })
        );
      }
    };

    // Set remote description and create answer
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const pendingCandidates = liveIceCandidatesRef.current[studentId];
    liveIceCandidatesRef.current[studentId] = [];
    for (const candidate of pendingCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('ICE error:', error);
      }
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer back
    liveWsRef.current.send(
      JSON.stringify({
        type: 'answer',
        answer: answer,
        sender: user?.full_name,
        sender_role: user?.role,
        sender_id: user?.id,
      })
    );
  };

  useEffect(() => () => {
    Object.values(livePcsRef.current).forEach((pc) => pc.close());
    livePcsRef.current = {};
    if (liveWsRef.current) {
      liveWsRef.current.onclose = null;
      liveWsRef.current.close();
      liveWsRef.current = null;
    }
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreatingExam(true);
    try {
      const TYPE_MAP = { Quiz: 'QUIZ', Mid: 'MID', Final: 'FINAL' };
      const payload = {
        ...formData,
        exam_type: TYPE_MAP[formData.title] || 'MID',
        created_by: user?.id,
      };
      if (isEditing) {
        await api.patch(`/exams/${editExamId}/`, payload);
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/exams/', payload);
        toast.success('Exam created successfully!');
      }
      setShowCreateModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} exam`);
    } finally {
      setCreatingExam(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditExamId(null);
    setFormData({
      course: selectedCourse ? selectedCourse.id : '',
      title: '', description: '', duration_minutes: 60,
      start_time: '', end_time: '', total_marks: 100,
      is_published: true, proctoring_enabled: true,
      exam_type: 'MID',
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
      exam_type: exam.exam_type || 'MID',
    });
    setShowCreateModal(true);
    setOpenMenuId(null);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) { toast.error('No exam selected'); return; }
    setLoading(true);
    try {
      let questionData = {
        text: questionForm.text,
        type: questionForm.type,
        marks: parseFloat(questionForm.marks) || 1,
      };
      if (questionForm.type === 'MCQ') {
        const options = Object.values(questionForm.options).filter((opt) => opt && opt.trim() !== '');
        if (options.length < 2) { toast.error('Please provide at least 2 options'); setLoading(false); return; }
        questionData.options = options;
        questionData.correct_answer = questionForm.correct_answer;
      } else if (questionForm.type === 'TF') {
        if (!questionForm.correct_answer) { toast.error('Please select the correct answer'); setLoading(false); return; }
        questionData.correct_answer = questionForm.correct_answer;
      } else if (questionForm.type === 'SHORT') {
        questionData.correct_answer = '';
      }
      if (editingQuestionId) {
        await api.patch(`/exams/questions/${editingQuestionId}/`, questionData);
        toast.success('Question updated!');
        setEditingQuestionId(null);
      } else {
        await api.post(`/exams/${selectedExam.id}/questions/`, questionData);
        toast.success('Question added!');
      }
      fetchQuestions(selectedExam.id);
      setQuestionForm({
        text: '', type: 'MCQ', options: { A: '', B: '', C: '', D: '' },
        correct_answer: '', marks: 1,
      });
    } catch (error) {
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
        if (index < 4) optionsObj[['A', 'B', 'C', 'D'][index]] = opt;
      });
    } else if (question.options) {
      optionsObj = { ...optionsObj, ...question.options };
    }
    setQuestionForm({
      text: question.text, type: question.type, options: optionsObj,
      correct_answer: question.correct_answer || '', marks: question.marks,
    });
    const modal = document.getElementById('questions-modal-scroll');
    if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerDeleteQuestion = (questionId) => {
    setDeleteType('question');
    setDeleteId(questionId);
    setShowDeleteModal(true);
  };

  const triggerDeleteExam = (examId) => {
    setDeleteType('exam');
    setDeleteId(examId);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

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
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to update exam status');
    }
  };

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
      await api.post('/exams/grade-essay/', { answer_id: answerId, marks_obtained: marks, feedback });
      toast.success('Essay graded!');
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
      toast.success('Answer graded!');
      if (selectedExam) fetchSubmissions(selectedExam.id);
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
      text: '', type: 'MCQ', options: { A: '', B: '', C: '', D: '' },
      correct_answer: '', marks: 1,
    });
    setShowQuestionsModal(true);
    setOpenMenuId(null);
  };

  const openSubmissionsModal = (exam) => {
    setSelectedExam(exam);
    fetchSubmissions(exam.id);
    setShowSubmissions(true);
    setOpenMenuId(null);
  };

  const loadProctoringImages = async (course, examType, student = null) => {
    setProctoringImagesCourse(course);
    setProctoringImagesType(examType);
    setProctoringImagesLoading(true);
    setProctoringImagesError('');
    setProctoringImages([]);
    setProctoringStudents([]);
    try {
      const response = await api.get(`/exams/course/${course.id}/proctoring-images/`, {
        params: {
          exam_type: examType,
          ...(student ? { student_id: student.id } : {}),
        },
      });
      setProctoringImages(response.data.images || []);
      setProctoringStudents(student ? [] : response.data.students || []);
    } catch (error) {
      console.error('Failed to load proctoring images:', error);
      setProctoringImagesError(
        error.response?.data?.error || 'Failed to load proctoring images.'
      );
    } finally {
      setProctoringImagesLoading(false);
    }
  };

  const openProctoringImages = (course) => {
    navigate(`/teacher/courses/${course.id}/proctoring-images`);
  };

  const selectProctoringStudent = (student) => {
    setSelectedProctoringStudent(student);
    loadProctoringImages(proctoringImagesCourse, proctoringImagesType, student);
  };

  const showProctoringStudents = () => {
    setSelectedProctoringStudent(null);
    loadProctoringImages(proctoringImagesCourse, proctoringImagesType);
  };

  const toggleMenu = (examId) => setOpenMenuId((prev) => (prev === examId ? null : examId));
  const handleCourseClick = (course) => { setSelectedCourse(course); setViewLevel('exams'); };
  const handleBackToCourses = () => { setViewLevel('courses'); setSelectedCourse(null); };

  const getStatusBadge = (exam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    const base = { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 };
    if (!exam.is_published) return <span style={{ ...base, background: '#f3f4f6', color: '#6b7280' }}>Draft</span>;
    if (now < start) return <span style={{ ...base, background: '#fef3c7', color: '#d97706' }}>Scheduled</span>;
    if (now >= start && now <= end) return <span style={{ ...base, background: '#d1fae5', color: '#059669' }}>Ongoing</span>;
    return <span style={{ ...base, background: '#dbeafe', color: '#2563eb' }}>Completed</span>;
  };

  const filteredExams = selectedCourse
    ? exams.filter((e) => Number(e.course) === Number(selectedCourse.id))
    : exams;

  const filteredCourses = courses.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (c.title || '').toLowerCase().includes(term) || (c.course_code || '').toLowerCase().includes(term);
  });
  const ownedCourseIds = new Set(courses.map((course) => Number(course.id)));
  const assignedExams = coursesLoaded
    ? exams.filter((exam) => !ownedCourseIds.has(Number(exam.course)))
    : [];

  const getExamCountForCourse = (courseId) =>
    exams.filter((e) => Number(e.course) === Number(courseId)).length;

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
        @keyframes dropdownFade { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .menu-dropdown { animation: dropdownFade 0.15s ease-out; }
        .menu-item:hover { background: #f1f5f9; }
        .course-card-clickable:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
        @media (max-width: 768px) { .exam-grid { grid-template-columns: 1fr !important; } .courses-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* LEVEL 1: COURSES */}
      {viewLevel === 'courses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Exams</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Select a course to manage its exams</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 500, color: '#92400e', margin: 0 }}>You don't have any courses yet.</p>
                <p style={{ fontSize: '14px', color: '#78350f', margin: '4px 0 0 0' }}>Go to <strong>My Courses</strong> tab. The admin should assign courses to you.</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search courses by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }} className="courses-grid">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="course-card-clickable"
                    style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #e5e7eb' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>{course.course_code}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, background: getExamCountForCourse(course.id) > 0 ? '#dcfce7' : '#f3f4f6', color: getExamCountForCourse(course.id) > 0 ? '#16a34a' : '#6b7280', padding: '4px 8px', borderRadius: '4px' }}>
                        {getExamCountForCourse(course.id)} exam{getExamCountForCourse(course.id) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>{course.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description || 'No description provided'}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> {course.credit_hours || 0} Credit Hours
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {assignedExams.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: 21 }}>Exams assigned to you</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {assignedExams.map((exam) => (
                  <article key={exam.id} style={{ padding: 18, border: '1px solid #c7d2fe', borderRadius: 10, background: '#eef2ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#4338ca', fontWeight: 600 }}>{exam.course_code || 'Course'}</span>
                      {getStatusBadge(exam)}
                    </div>
                    <h3 style={{ margin: '10px 0 4px', color: '#0f172a' }}>{exam.title}</h3>
                    <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 14 }}>{exam.course_title || 'Assigned exam'}</p>
                    <button
                      type="button"
                      onClick={() => openLiveMonitoring(exam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 12px', border: 0, borderRadius: 7, background: '#4f46e5', color: 'white', cursor: 'pointer' }}
                    >
                      <Eye size={16} /> View assigned students
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* LEVEL 2: EXAMS */}
      {viewLevel === 'exams' && selectedCourse && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <button
                onClick={handleBackToCourses}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
              >
                <ArrowLeft size={18} /> Back to Courses
              </button>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedCourse.title}</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{selectedCourse.course_code} • Manage exams for this course</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => openProctoringImages(selectedCourse)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}
              >
                <Camera size={18} /> Proctoring Images
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setFormData((prev) => ({ ...prev, course: selectedCourse.id }));
                  setShowCreateModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}
              >
                <Plus size={18} /> Create Exam
              </button>
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
              <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>No exams yet</h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Create your first exam for this course</p>
              <button
                onClick={() => {
                  resetForm();
                  setFormData((prev) => ({ ...prev, course: selectedCourse.id }));
                  setShowCreateModal(true);
                }}
                style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Create Exam
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }} className="exam-grid">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>{exam.title}</h3>
                      {getStatusBadge(exam)}
                    </div>
                    <div style={{ position: 'relative' }} ref={openMenuId === exam.id ? menuRef : null}>
                      <button
                        onClick={() => toggleMenu(exam.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === exam.id && (
                        <div
                          className="menu-dropdown"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            zIndex: 50,
                            minWidth: '180px',
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            onClick={() => openQuestionsModal(exam)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#334155' }}
                          >
                            <FileText size={16} /> Manage Questions
                          </button>
                          <button
                            onClick={() => openSubmissionsModal(exam)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#334155' }}
                          >
                            <Eye size={16} /> View Submissions
                          </button>
                          <button
                            onClick={() => openLiveMonitoring(exam)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#2563eb', fontWeight: 500 }}
                          >
                            <Eye size={16} /> Live Monitoring
                          </button>
                          <button
                            onClick={() => handleEditClick(exam)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#334155' }}
                          >
                            <Edit size={16} /> Edit Exam
                          </button>
                          <button
                            onClick={() => handlePublishExam(exam.id, !exam.is_published)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#334155' }}
                          >
                            {exam.is_published ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            {exam.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => triggerDeleteExam(exam.id)}
                            className="menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#dc2626' }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {exam.duration_minutes} minutes
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {new Date(exam.start_time).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> {exam.total_marks} marks
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openQuestionsModal(exam)}
                      style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#334155' }}
                    >
                      Questions
                    </button>
                    <button
                      onClick={() => openLiveMonitoring(exam)}
                      style={{ flex: 1, padding: '8px', background: '#eff6ff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#2563eb', fontWeight: 500 }}
                    >
                      Live View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== CREATE / EDIT EXAM MODAL ==================== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{isEditing ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateExam}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Title</label>
                <select
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                >
                  <option value="">Select exam type</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Mid">Mid</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Description</label>
                <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '80px' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Duration (minutes)</label>
                  <input required type="number" min="1" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Total Marks</label>
                  <input required type="number" min="1" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) || 100 })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Start Time</label>
                  <input required type="datetime-local" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>End Time</label>
                  <input required type="datetime-local" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} />
                  Publish immediately
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.proctoring_enabled} onChange={(e) => setFormData({ ...formData, proctoring_enabled: e.target.checked })} />
                  Enable AI Proctoring
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creatingExam} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', background: creatingExam ? '#94a3b8' : '#2563eb', color: 'white', cursor: creatingExam ? 'not-allowed' : 'pointer' }}>
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
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Manage Questions - {selectedExam.title}</h2>
              <button onClick={() => setShowQuestionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h3>
              <form onSubmit={handleAddQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Type</label>
                    <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }} value={questionForm.type} onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value, correct_answer: '' })}>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="TF">True / False</option>
                      <option value="SHORT">Short Answer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Marks</label>
                    <input type="number" step="0.5" min="0.5" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Question Text</label>
                  <textarea required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '60px', resize: 'vertical' }} value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} placeholder="Enter your question here..." />
                </div>
                {questionForm.type === 'MCQ' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div key={letter}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Option {letter}</label>
                        <input type="text" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} value={questionForm.options[letter] || ''} onChange={(e) => setQuestionForm({ ...questionForm, options: { ...questionForm.options, [letter]: e.target.value } })} placeholder={`Option ${letter}`} />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Correct Answer</label>
                      <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }} value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}>
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
                    <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }} value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}>
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
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '6px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Saving...' : (editingQuestionId ? 'Update Question' : 'Add Question')}
                </button>
              </form>
            </div>

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
                        <button onClick={() => handleEditQuestionClick(q)} style={{ padding: '4px', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} title="Edit Question">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => triggerDeleteQuestion(q.id)} disabled={loading} style={{ padding: '4px', background: 'none', border: 'none', color: '#dc2626', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <button onClick={() => setShowQuestionsModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && selectedExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSubmissions(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedExam.title} - Submissions ({submissions.length})</h2>
              <button onClick={() => setShowSubmissions(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
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
                    {submissions.map((sub, idx) => (
                      <tr key={sub.attempt_id || sub.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{sub.student_name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{sub.student_id}</div>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>{sub.score} / {sub.total_marks}</td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>{Math.round(sub.percentage)}%</td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>
                          {sub.passed ? (
                            <span style={{ color: '#16a34a', fontWeight: 500 }}>Passed</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 500 }}>Failed</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '14px' }}>
                          <button
                            onClick={() => viewEssayAnswers(sub.attempt_id)}
                            style={{ padding: '4px 12px', background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <button onClick={() => setShowSubmissions(false)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer' }}>Close</button>
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
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} /> Student Submission
              </h2>
              <button onClick={() => setShowEssayGradingModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span><strong>Student:</strong> {essayAnswers.student_name}</span>
              <span><strong>Exam:</strong> {essayAnswers.exam_title}</span>
              <span><strong>Progress:</strong> {essayAnswers.graded_count}/{essayAnswers.total_count} graded</span>
              <span><strong>Score:</strong> {essayAnswers.essay_obtained_marks || 0}/{essayAnswers.total_essay_marks || 0}</span>
            </div>
            {essayAnswers.essay_answers && essayAnswers.essay_answers.length > 0 ? (
              essayAnswers.essay_answers.map((answer, index) => (
                <div key={answer.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: answer.graded ? '#f0fdf4' : 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Question {index + 1}: {answer.question_text}</h4>
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, background: answer.graded ? '#dcfce7' : '#fef3c7', color: answer.graded ? '#16a34a' : '#d97706' }}>
                      {answer.graded ? '✅ Graded' : '⏳ Pending'}
                    </span>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{answer.answer_text || 'No answer provided'}</p>
                  </div>
                  {answer.graded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 500, color: '#16a34a' }}>Marks: {answer.marks_obtained}/{answer.max_marks}</span>
                      {answer.feedback && (<span style={{ color: '#64748b', fontSize: '13px' }}>Feedback: {answer.feedback}</span>)}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginRight: '8px' }}>Marks (0-{answer.max_marks}):</label>
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
                        style={{ padding: '6px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                      >
                        Grade
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No essay answers found. This exam may only contain multiple choice and true/false questions.</p>
            )}
            {essayAnswers.total_count > 0 && essayAnswers.all_graded && (
              <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <CheckCircle size={24} color="#16a34a" style={{ display: 'inline', marginRight: '8px' }} />
                <span style={{ fontWeight: 600, color: '#16a34a' }}>All essays graded! Student can now view results.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
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

      {/* ==================== LIVE MONITORING MODAL ==================== */}
      {showProctoringImages && proctoringImagesCourse && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100, padding: 16 }}
          onClick={() => setShowProctoringImages(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: 24, width: 'min(1100px, 96vw)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Proctoring Images</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                  {proctoringImagesCourse.title} • captured images by exam type
                </p>
              </div>
              <button
                type="button"
                aria-label="Close proctoring images"
                onClick={() => setShowProctoringImages(false)}
                style={{ background: 'none', border: 0, color: '#64748b', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              {[
                ['QUIZ', 'Quiz'],
                ['MID', 'Mid'],
                ['FINAL', 'Final'],
              ].map(([type, label]) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setSelectedProctoringStudent(null);
                    loadProctoringImages(proctoringImagesCourse, type);
                  }}
                  aria-pressed={proctoringImagesType === type}
                  style={{
                    padding: '9px 18px',
                    border: 0,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: proctoringImagesType === type ? 'white' : '#475569',
                    background: proctoringImagesType === type ? '#2563eb' : '#f1f5f9',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {proctoringImagesLoading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading captured images...</div>
            ) : proctoringImagesError ? (
              <div role="alert" style={{ padding: 24, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>
                {proctoringImagesError}
              </div>
            ) : selectedProctoringStudent ? (
              <>
                <button
                  type="button"
                  onClick={showProctoringStudents}
                  style={{ marginBottom: 16, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', color: '#334155', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  All students
                </button>
                <h3 style={{ margin: '0 0 16px', color: '#0f172a' }}>
                  {selectedProctoringStudent.name}
                  {selectedProctoringStudent.student_id ? ` (${selectedProctoringStudent.student_id})` : ''}
                </h3>
                {proctoringImages.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>No images found for this student.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
                    {proctoringImages.map((image) => (
                      <article key={image.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#f8fafc' }}>
                        {image.image ? (
                          <a href={getMediaUrl(image.image)} target="_blank" rel="noreferrer">
                            <img
                              src={getMediaUrl(image.image)}
                              alt={`Proctor capture for ${image.student_name}`}
                              loading="lazy"
                              style={{ display: 'block', width: '100%', height: 190, objectFit: 'cover', background: '#0f172a' }}
                            />
                          </a>
                        ) : (
                          <div style={{ height: 190, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>Image unavailable</div>
                        )}
                        <div style={{ padding: 12, fontSize: 13, color: '#475569' }}>
                          <span>{image.exam_title}</span>
                          <span style={{ display: 'block', marginTop: 4 }}>
                            {image.capture_time ? new Date(image.capture_time).toLocaleString() : 'Capture time unavailable'}
                          </span>
                          {image.is_suspicious && (
                            <span style={{ display: 'block', marginTop: 6, color: '#b91c1c', fontWeight: 600 }}>
                              Flagged{image.suspicious_reason ? `: ${image.suspicious_reason}` : ''}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : proctoringStudents.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                No images have been captured for {proctoringImagesType === 'MID' ? 'midterm' : proctoringImagesType.toLowerCase()} exams in this course.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                {proctoringStudents.map((student) => (
                  <button
                    type="button"
                    key={student.id}
                    onClick={() => selectProctoringStudent(student)}
                    style={{ textAlign: 'left', padding: 16, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', color: '#0f172a', cursor: 'pointer' }}
                  >
                    <strong style={{ display: 'block', fontSize: 15 }}>{student.name}</strong>
                    {student.student_id && (
                      <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 13 }}>
                        Student ID: {student.student_id}
                      </span>
                    )}
                    <span style={{ display: 'block', marginTop: 8, color: '#475569', fontSize: 13 }}>
                      {student.image_count} {student.image_count === 1 ? 'image' : 'images'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showLiveMonitoring && liveExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => {
            setShowLiveMonitoring(false);
            Object.values(livePcsRef.current).forEach((pc) => pc.close());
            livePcsRef.current = {};
            if (liveWsRef.current) liveWsRef.current.close();
            setLiveStreams({});
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 1200,
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Live Monitoring</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                  {liveExam.title} • {liveStudents.length} student(s) currently taking the exam
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLiveMonitoring(false);
                  Object.values(livePcsRef.current).forEach((pc) => pc.close());
                  livePcsRef.current = {};
                  if (liveWsRef.current) liveWsRef.current.close();
                  setLiveStreams({});
                }}
                style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            {liveLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 12, color: '#64748b' }}>Loading live students...</p>
              </div>
            ) : liveStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                No students are currently taking this exam.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 20,
                }}
              >
                {liveStudents.map((student) => {
                  const stream = liveStreams[student.user_id] || liveStreams[student.student_id];

                  return (
                    <div
                      key={student.attempt_id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#f8fafc',
                      }}
                    >
                      {/* Live Video */}
                      <div
                        style={{
                          height: 200,
                          background: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {stream ? (
                          <video
                            autoPlay
                            playsInline
                            muted
                            ref={(el) => {
                              if (el && stream) {
                                el.srcObject = stream;
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Waiting for live video...</span>
                        )}

                        {/* Live indicator */}
                        {stream && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              background: 'rgba(220,38,38,0.9)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            ● LIVE
                          </div>
                        )}
                      </div>

                      <div style={{ padding: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{student.student_name}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                          {student.student_id}
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                          <span
                            style={{
                              background: student.face_verified ? '#dcfce7' : '#fee2e2',
                              color: student.face_verified ? '#16a34a' : '#dc2626',
                              padding: '2px 8px',
                              borderRadius: 20,
                            }}
                          >
                            {student.face_verified ? 'Verified' : 'Not Verified'}
                          </span>
                          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 20 }}>
                            Violations: {student.violations_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                onClick={() => openLiveMonitoring(liveExam)}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginRight: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                onClick={() => {
                  setShowLiveMonitoring(false);
                  Object.values(livePcsRef.current).forEach((pc) => pc.close());
                  livePcsRef.current = {};
                  if (liveWsRef.current) liveWsRef.current.close();
                  setLiveStreams({});
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExams;