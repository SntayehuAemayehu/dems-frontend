// frontend/src/pages/teacher/TeacherDashboard.jsx
// COMPLETE - Full teacher grading functionality - WITH GRADE FEATURES ADDED

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, FileText, CheckCircle, XCircle, Clock,
  Eye, Search, RefreshCw, UserCheck, UserPlus,
  GraduationCap, Calendar, BarChart3,
  Award, AlertTriangle, TrendingUp, TrendingDown,
  Filter, Download, Printer, Plus, Settings,
  Building2, Shield, Trash2, Edit2,
  Lock, Unlock, Activity, Video, User,
  Mail, Phone, MapPin, Briefcase, School,
  ChevronLeft, ChevronRight, UserCog, FileSpreadsheet,
  ClipboardList, PenSquare, Save, X, Edit3, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import '../../styles/dashboard-responsive.css';
// ============================================================
// ✅ ADDED: Import GradeBadge component
// ============================================================
import GradeBadge from '../../components/Grade/GradeBadge';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // ============ STATE ============
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('exams');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // ============================================================
  // ✅ ADDED: Course Grades State
  // ============================================================
  const [courseGrades, setCourseGrades] = useState([]);
  const [selectedCourseForGrades, setSelectedCourseForGrades] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [showCourseGradesModal, setShowCourseGradesModal] = useState(false);
  
  // ============ MODAL STATES ============
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showEditAnswerModal, setShowEditAnswerModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // ============ GRADING FORM STATE ============
  const [gradingForm, setGradingForm] = useState({
    marks_obtained: '',
    feedback: '',
    essay_answers: {}
  });
  
  const [bonusForm, setBonusForm] = useState({
    bonus_marks: '',
    reason: '',
    apply_to_all: true
  });
  
  // ============ STATS ============
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingExams: 0,
    pendingAssignments: 0,
    gradedExams: 0,
    gradedAssignments: 0,
    totalSubmissions: 0,
    // ✅ ADDED: Grade stats
    avgGrade: 0,
    passRate: 0
  });

  // ============ FETCH DATA ============
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      console.log('🔄 Fetching teacher dashboard data...');
      
      // Fetch courses taught by this teacher
      const coursesRes = await api.get('/courses/');
      let coursesData = [];
      if (coursesRes.data && coursesRes.data.results) {
        coursesData = coursesRes.data.results;
      } else if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
      }
      
      // Filter courses where this user is the instructor
      const teacherCourses = coursesData.filter(c => c.instructor === user?.id);
      setCourses(teacherCourses);
      
      // Get all submissions for teacher's courses
      const allSubmissions = [];
      const allAssignments = [];
      let totalStudents = 0;
      let pendingExams = 0;
      let pendingAssignments = 0;
      let gradedExams = 0;
      let gradedAssignments = 0;
      
      // ============================================================
      // ✅ ADDED: Fetch course grades
      // ============================================================
      const allCourseGrades = [];
      let totalGrades = 0;
      let totalPassing = 0;
      
      for (const course of teacherCourses) {
        // Get students in this course (enrollments)
        try {
          const enrollRes = await api.get(`/courses/enrollments/?course=${course.id}`);
          let enrollData = [];
          if (enrollRes.data && enrollRes.data.results) {
            enrollData = enrollRes.data.results;
          } else if (Array.isArray(enrollRes.data)) {
            enrollData = enrollRes.data;
          }
          totalStudents += enrollData.filter(e => e.status === 'ACTIVE').length;
        } catch (e) {
          console.warn(`Could not fetch enrollments for course ${course.id}`);
        }
        
        // ============================================================
        // ✅ ADDED: Fetch grades for this course
        // ============================================================
        try {
          const gradeRes = await api.get(`/courses/teacher/course/${course.id}/grades/`);
          if (gradeRes.data) {
            allCourseGrades.push(gradeRes.data);
            if (gradeRes.data.average_percentage) {
              totalGrades += gradeRes.data.average_percentage;
            }
            if (gradeRes.data.pass_rate) {
              totalPassing += gradeRes.data.pass_rate;
            }
          }
        } catch (e) {
          console.warn(`Could not fetch grades for course ${course.id}`);
        }
        
        // Get exams for this course
        try {
          const examsRes = await api.get(`/exams/?course=${course.id}`);
          let examsData = [];
          if (examsRes.data && examsRes.data.results) {
            examsData = examsRes.data.results;
          } else if (Array.isArray(examsRes.data)) {
            examsData = examsRes.data;
          }
          
          for (const exam of examsData) {
            // Get submissions for this exam
            try {
              const subRes = await api.get(`/exams/submissions/${exam.id}/`);
              let subData = [];
              if (subRes.data && subRes.data.submissions) {
                subData = subRes.data.submissions;
              } else if (Array.isArray(subRes.data)) {
                subData = subRes.data;
              }
              
              for (const sub of subData) {
                // Check if essay answers need grading
                const hasUngradedEssay = sub.essay_answers?.some(a => !a.graded) || false;
                const isFullyGraded = sub.all_essay_graded || false;
                
                allSubmissions.push({
                  ...sub,
                  exam_id: exam.id,
                  exam_title: exam.title,
                  course_id: course.id,
                  course_title: course.title,
                  has_essay: sub.essay_answers?.length > 0 || false,
                  essay_count: sub.essay_answers?.length || 0,
                  graded_count: sub.essay_answers?.filter(a => a.graded).length || 0,
                  needs_grading: hasUngradedEssay || false,
                  is_fully_graded: isFullyGraded || sub.all_essay_graded || false,
                  type: 'exam'
                });
                
                if (!isFullyGraded && sub.status === 'SUBMITTED') {
                  pendingExams++;
                }
                if (isFullyGraded || sub.status === 'GRADED') {
                  gradedExams++;
                }
              }
            } catch (e) {
              console.warn(`Could not fetch submissions for exam ${exam.id}`);
            }
          }
        } catch (e) {
          console.warn(`Could not fetch exams for course ${course.id}`);
        }
        
        // Get assignments for this course
        try {
          const assignRes = await api.get(`/courses/${course.id}/assignments/`);
          let assignData = [];
          if (assignRes.data && assignRes.data.results) {
            assignData = assignRes.data.results;
          } else if (Array.isArray(assignRes.data)) {
            assignData = assignRes.data;
          }
          
          for (const assignment of assignData) {
            // Get submissions for this assignment
            try {
              const subRes = await api.get(`/courses/assignments/${assignment.id}/submissions/`);
              let subData = [];
              if (subRes.data && subRes.data.results) {
                subData = subRes.data.results;
              } else if (Array.isArray(subRes.data)) {
                subData = subRes.data;
              }
              
              for (const sub of subData) {
                const isGraded = sub.marks_obtained !== null && sub.marks_obtained !== undefined;
                
                allAssignments.push({
                  ...sub,
                  assignment_id: assignment.id,
                  assignment_title: assignment.title,
                  course_id: course.id,
                  course_title: course.title,
                  total_marks: assignment.total_marks,
                  due_date: assignment.due_date,
                  is_graded: isGraded,
                  needs_grading: !isGraded && sub.submitted_at,
                  type: 'assignment'
                });
                
                if (!isGraded && sub.submitted_at) {
                  pendingAssignments++;
                }
                if (isGraded) {
                  gradedAssignments++;
                }
              }
            } catch (e) {
              console.warn(`Could not fetch submissions for assignment ${assignment.id}`);
            }
          }
        } catch (e) {
          console.warn(`Could not fetch assignments for course ${course.id}`);
        }
      }
      
      setSubmissions(allSubmissions);
      setAssignmentSubmissions(allAssignments);
      setExamSubmissions(allSubmissions.filter(s => s.type === 'exam'));
      
      // ============================================================
      // ✅ ADDED: Set course grades
      // ============================================================
      setCourseGrades(allCourseGrades);
      
      // Calculate averages
      const avgGrade = allCourseGrades.length > 0 ? totalGrades / allCourseGrades.length : 0;
      const passRate = allCourseGrades.length > 0 ? totalPassing / allCourseGrades.length : 0;
      
      setStats({
        totalCourses: teacherCourses.length,
        totalStudents: totalStudents,
        pendingExams: pendingExams,
        pendingAssignments: pendingAssignments,
        gradedExams: gradedExams,
        gradedAssignments: gradedAssignments,
        totalSubmissions: allSubmissions.length + allAssignments.length,
        // ✅ ADDED: Grade stats
        avgGrade: Math.round(avgGrade * 10) / 10,
        passRate: Math.round(passRate * 10) / 10
      });
      
      console.log('✅ Teacher data loaded:', {
        courses: teacherCourses.length,
        examSubmissions: allSubmissions.length,
        assignmentSubmissions: allAssignments.length,
        pendingExams,
        pendingAssignments,
        avgGrade,
        passRate
      });
      
    } catch (error) {
      console.error('❌ Failed to fetch teacher data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      toast.error('Access denied. Teacher only.');
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, user, fetchData]);

  // ============ FILTER DATA ============
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    let data = [];
    
    if (activeTab === 'exams') {
      data = examSubmissions;
    } else if (activeTab === 'assignments') {
      data = assignmentSubmissions;
    } else if (activeTab === 'all') {
      data = [...examSubmissions, ...assignmentSubmissions.map(a => ({ ...a, type: 'assignment' }))];
    }
    
    return data.filter(item => {
      const searchable = `${item.student_name || ''} ${item.exam_title || ''} ${item.assignment_title || ''} ${item.course_title || ''}`.toLowerCase();
      return searchable.includes(term);
    });
  };

  // ============================================================
  // ✅ ADDED: View Course Grades
  // ============================================================
  const viewCourseGrades = async (courseId) => {
    try {
      setActionLoading(true);
      const response = await api.get(`/courses/teacher/course/${courseId}/grades/`);
      setSelectedCourseForGrades(response.data);
      setCourseStudents(response.data.students || []);
      setShowCourseGradesModal(true);
    } catch (error) {
      console.error('Failed to fetch course grades:', error);
      toast.error('Failed to load course grades');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ VIEW SUBMISSION DETAILS ============
  const viewSubmissionDetails = async (submission, type) => {
    setSelectedSubmission(submission);
    
    if (type === 'exam') {
      try {
        const response = await api.get(`/exams/attempt/${submission.attempt_id}/essay-answers/`);
        console.log('📝 Essay answers:', response.data);
        setSelectedSubmission({
          ...submission,
          essay_details: response.data
        });
      } catch (error) {
        console.error('Failed to fetch essay details:', error);
      }
    }
    
    setShowSubmissionModal(true);
  };

  // ============ GRADE ESSAY ANSWER ============
  const gradeEssayAnswer = async (answerId, marks, feedback) => {
    setActionLoading(true);
    try {
      const response = await api.post('/exams/grade-essay/', {
        answer_id: answerId,
        marks_obtained: marks,
        feedback: feedback
      });
      
      toast.success('✅ Essay graded successfully!');
      setShowGradingModal(false);
      await fetchData();
      
      // Refresh the submission details
      if (selectedSubmission) {
        const subRes = await api.get(`/exams/submissions/${selectedSubmission.exam_id}/`);
        if (subRes.data && subRes.data.submissions) {
          const updated = subRes.data.submissions.find(s => s.attempt_id === selectedSubmission.attempt_id);
          if (updated) {
            setSelectedSubmission({
              ...selectedSubmission,
              ...updated,
              essay_details: updated
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to grade essay:', error);
      toast.error(error.response?.data?.error || 'Failed to grade essay');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ GRADE ASSIGNMENT ============
  const gradeAssignment = async (submissionId, marks, feedback) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/courses/submissions/${submissionId}/grade/`, {
        marks_obtained: marks,
        feedback: feedback
      });
      
      toast.success('✅ Assignment graded successfully!');
      setShowGradingModal(false);
      await fetchData();
      
    } catch (error) {
      console.error('Failed to grade assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to grade assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ BONUS MARKS ============
  const applyBonusMarks = async () => {
    if (!selectedSubmission) return;
    
    setActionLoading(true);
    try {
      const payload = {
        exam_id: selectedSubmission.exam_id,
        bonus_marks: parseFloat(bonusForm.bonus_marks),
        reason: bonusForm.reason,
        apply_to_all: bonusForm.apply_to_all
      };
      
      const response = await api.post('/exams/bonus-marks/', payload);
      
      toast.success(`✅ ${bonusForm.apply_to_all ? 'All students' : 'Student'} got bonus marks!`);
      setShowBonusModal(false);
      setBonusForm({ bonus_marks: '', reason: '', apply_to_all: true });
      await fetchData();
      
    } catch (error) {
      console.error('Failed to apply bonus:', error);
      toast.error(error.response?.data?.error || 'Failed to apply bonus marks');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ EDIT AUTO-GRADED ANSWER ============
  const editAnswer = async (answerId, newMarks) => {
    setActionLoading(true);
    try {
      const response = await api.post('/exams/edit-answer/', {
        answer_id: answerId,
        marks_obtained: newMarks
      });
      
      toast.success('✅ Answer updated successfully!');
      setShowEditAnswerModal(false);
      await fetchData();
      
    } catch (error) {
      console.error('Failed to edit answer:', error);
      toast.error(error.response?.data?.error || 'Failed to update answer');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ GET STATUS BADGE ============
  const getStatusBadge = (item) => {
    if (item.type === 'exam') {
      if (item.is_fully_graded || item.status === 'GRADED') {
        return <span className="status-badge approved">✅ Graded</span>;
      } else if (item.needs_grading && item.essay_count > 0) {
        return <span className="status-badge pending">📝 Needs Essay Grading</span>;
      } else if (item.status === 'SUBMITTED') {
        return <span className="status-badge pending">⏳ Submitted</span>;
      } else {
        return <span className="status-badge inactive">📋 Not Submitted</span>;
      }
    } else {
      if (item.is_graded) {
        return <span className="status-badge approved">✅ Graded</span>;
      } else if (item.submitted_at) {
        return <span className="status-badge pending">⏳ Pending Grading</span>;
      } else {
        return <span className="status-badge inactive">📋 Not Submitted</span>;
      }
    }
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading teacher dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .spinning { animation: spin 1s linear infinite; }
        .status-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.approved { background: #dcfce7; color: #16a34a; }
        .status-badge.pending { background: #fef3c7; color: #d97706; }
        .status-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .status-badge.rejected { background: #fee2e2; color: #dc2626; }
        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-success {
          background: #22c55e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-success:hover { background: #16a34a; }
        .btn-danger {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-danger:hover { background: #b91c1c; }
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover { background: #e2e8f0; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 800px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tabs-header { overflow-x: auto; flex-wrap: nowrap; }
          .tab-btn { white-space: nowrap; font-size: 13px; padding: 10px 14px; }
          .search-filter-bar { flex-direction: column !important; }
          .modal-content { padding: 16px; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
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
            <GraduationCap size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
            Teacher Dashboard
          </h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            Manage your courses, grade exams and assignments
            {/* ✅ ADDED: Grade stats in header */}
            {stats.avgGrade > 0 && (
              <span style={{ marginLeft: '12px', color: '#8b5cf6', fontWeight: 500 }}>
                📊 Avg Grade: {stats.avgGrade}% • Pass Rate: {stats.passRate}%
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
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

      {/* STATS CARDS */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#dbeafe',
            color: '#3b82f6',
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalCourses}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Courses</span>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #8b5cf6',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ede9fe',
            color: '#8b5cf6',
          }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalStudents}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Students</span>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b',
          cursor: 'pointer',
        }}
        onClick={() => setActiveTab('exams')}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fef3c7',
            color: '#f59e0b',
          }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pendingExams}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Pending Exams</span>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #22c55e',
          cursor: 'pointer',
        }}
        onClick={() => setActiveTab('assignments')}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#dcfce7',
            color: '#22c55e',
          }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pendingAssignments}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Pending Assignments</span>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#d1fae5',
            color: '#10b981',
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.gradedExams + stats.gradedAssignments}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Graded</span>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ec4899',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fce7f3',
            color: '#ec4899',
          }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalSubmissions}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Total Submissions</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ✅ ADDED: COURSE GRADES SECTION */}
      {/* ============================================================ */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Award size={20} color="#8b5cf6" />
            Course Grades & Performance
          </h2>
        </div>

        {courseGrades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
            <p>No grades available yet. Grade exams and assignments to see course performance.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
          }}>
            {courseGrades.map((course) => (
              <div
                key={course.course_id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => viewCourseGrades(course.course_id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {course.course_title}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {course.course_code} • {course.total_students} students
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: '#dbeafe',
                    color: '#2563eb',
                  }}>
                    {course.completed_students || 0} Completed
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Average</span>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>
                      {course.average_percentage?.toFixed(1) || 'N/A'}%
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {Object.entries(course.grade_distribution || {}).map(([grade, count]) => (
                      <span key={grade} style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        background: grade.startsWith('A') ? '#dcfce7' :
                                  grade.startsWith('B') ? '#dbeafe' :
                                  grade.startsWith('C') ? '#fef3c7' :
                                  grade === 'F' ? '#fee2e2' : '#f3f4f6',
                        color: grade.startsWith('A') ? '#166534' :
                               grade.startsWith('B') ? '#1e40af' :
                               grade.startsWith('C') ? '#92400e' :
                               grade === 'F' ? '#991b1b' : '#6b7280',
                      }}>
                        {grade}: {count}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '6px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                >
                  <Eye size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  View Student Grades
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto',
        }} className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
            style={{
              padding: '14px 24px',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'exams' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'exams' ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Exam Submissions ({examSubmissions.length})
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b' }}>
              ({examSubmissions.filter(s => s.needs_grading).length} pending)
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '14px 24px',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'assignments' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'assignments' ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Assignment Submissions ({assignmentSubmissions.length})
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b' }}>
              ({assignmentSubmissions.filter(s => !s.is_graded && s.submitted_at).length} pending)
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{
              padding: '14px 24px',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'all' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            📊 All Submissions
          </button>
        </div>

        {/* SEARCH BAR */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div className="search-filter-bar" style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              minWidth: '200px',
            }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }} />
              <input
                type="text"
                placeholder={`Search submissions...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
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
              <Filter size={18} />
              <select
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                }}
                onChange={(e) => {
                  const filter = e.target.value;
                  // Filter logic here
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Grading</option>
                <option value="graded">Graded</option>
                <option value="not_submitted">Not Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUBMISSIONS TABLE */}
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>Student</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Course / Title</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Score</th>
                {/* ✅ ADDED: Grade column */}
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Grade</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Status</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Submitted</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData().length === 0 ? (
                <tr>
                  <td colSpan="7" style={{
                    textAlign: 'center',
                    padding: '48px',
                    color: '#94a3b8',
                  }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No submissions found</p>
                  </td>
                </tr>
              ) : (
                getFilteredData().map((item, index) => {
                  // ✅ ADDED: Calculate percentage for grade
                  let percentage = 0;
                  if (item.type === 'exam') {
                    if (item.score && item.total_marks) {
                      percentage = (item.score / item.total_marks) * 100;
                    }
                  } else {
                    if (item.marks_obtained && item.total_marks) {
                      percentage = (item.marks_obtained / item.total_marks) * 100;
                    }
                  }
                  
                  return (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        <div>
                          <span style={{
                            fontWeight: 500,
                            color: '#0f172a',
                            display: 'block',
                          }}>{item.student_name || 'Unknown'}</span>
                          <span style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                          }}>{item.student_id || ''}</span>
                        </div>
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#475569',
                      }}>
                        <div>
                          <span style={{ fontWeight: 500, color: '#0f172a' }}>
                            {item.exam_title || item.assignment_title || 'Unknown'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>
                            {item.course_title || ''}
                            {item.type === 'exam' ? ' 📝 Exam' : ' 📄 Assignment'}
                          </span>
                        </div>
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}>
                        {item.type === 'exam' ? (
                          <>
                            {item.score || 0} / {item.total_marks || 0}
                            {item.essay_count > 0 && (
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                                Essays: {item.graded_count || 0}/{item.essay_count} graded
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {item.marks_obtained !== null && item.marks_obtained !== undefined ? (
                              `${item.marks_obtained} / ${item.total_marks || 0}`
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Not graded</span>
                            )}
                          </>
                        )}
                      </td>
                      
                      {/* ✅ ADDED: Grade cell */}
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        <GradeBadge 
                          grade={item.grade_letter || 'NON'} 
                          percentage={percentage}
                          size="sm"
                        />
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        {getStatusBadge(item)}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#64748b',
                      }}>
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 
                         item.start_time ? new Date(item.start_time).toLocaleDateString() : '—'}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => viewSubmissionDetails(item, item.type)}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: '#eff6ff',
                              color: '#3b82f6',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          
                          {item.type === 'exam' && item.needs_grading && (
                            <button
                              onClick={() => {
                                setSelectedSubmission(item);
                                setShowGradingModal(true);
                              }}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: '#fef3c7',
                                color: '#d97706',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                            >
                              <PenSquare size={14} />
                              Grade Essay
                            </button>
                          )}
                          
                          {item.type === 'assignment' && !item.is_graded && item.submitted_at && (
                            <button
                              onClick={() => {
                                setSelectedSubmission(item);
                                setShowGradingModal(true);
                              }}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: '#fef3c7',
                                color: '#d97706',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                            >
                              <PenSquare size={14} />
                              Grade
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUBMISSION DETAIL MODAL */}
      {/* ============================================================ */}
      {showSubmissionModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowSubmissionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  {selectedSubmission.type === 'exam' ? '📝 Exam Submission' : '📄 Assignment Submission'}
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedSubmission.student_name} - {selectedSubmission.exam_title || selectedSubmission.assignment_title}
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ×
              </button>
            </div>

            {/* Student Info */}
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
            }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Student</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedSubmission.student_name}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Student ID</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedSubmission.student_id || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>{getStatusBadge(selectedSubmission)}</p>
              </div>
            </div>

            {/* Exam Details - Auto-graded answers */}
            {selectedSubmission.type === 'exam' && selectedSubmission.auto_graded_answers && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <CheckCircle size={16} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                  Auto-Graded Answers (MCQ / True-False)
                </h3>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {selectedSubmission.auto_graded_answers && selectedSubmission.auto_graded_answers.map((answer, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: idx < selectedSubmission.auto_graded_answers.length - 1 ? '1px solid #e2e8f0' : 'none',
                    }}>
                      <div>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>Q{idx + 1}:</span>
                        <span style={{ fontSize: '13px', color: '#475569', marginLeft: '8px' }}>
                          {answer.question_text?.substring(0, 50)}...
                        </span>
                      </div>
                      <div>
                        <span style={{ 
                          fontWeight: 600,
                          color: answer.is_correct ? '#22c55e' : '#dc2626',
                          fontSize: '14px',
                        }}>
                          {answer.marks_obtained || 0} / {answer.max_marks || 0}
                          {answer.is_correct ? ' ✅' : ' ❌'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSubmission({ ...selectedSubmission, editingAnswer: answer });
                            setShowEditAnswerModal(true);
                          }}
                          style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Auto-graded Score: {selectedSubmission.auto_graded_score || 0} / {selectedSubmission.total_marks - selectedSubmission.total_essay_marks || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Essay Answers */}
            {selectedSubmission.type === 'exam' && selectedSubmission.essay_answers && selectedSubmission.essay_answers.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <PenSquare size={16} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
                  Essay Answers ({selectedSubmission.essay_answers.filter(a => a.graded).length}/{selectedSubmission.essay_answers.length} graded)
                </h3>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  {selectedSubmission.essay_answers.map((answer, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      borderBottom: idx < selectedSubmission.essay_answers.length - 1 ? '1px solid #e2e8f0' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, fontSize: '14px', margin: '0 0 4px 0' }}>
                            Q{idx + 1}: {answer.question_text}
                          </p>
                          <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px 0', background: 'white', padding: '8px', borderRadius: '4px' }}>
                            {answer.answer_text || 'No answer provided'}
                          </p>
                          {answer.feedback && (
                            <p style={{ fontSize: '13px', color: '#2563eb', margin: '4px 0 0 0' }}>
                              Feedback: {answer.feedback}
                            </p>
                          )}
                        </div>
                        <div style={{ minWidth: '100px', textAlign: 'right' }}>
                          {answer.graded ? (
                            <span style={{ fontWeight: 600, color: '#22c55e' }}>
                              {answer.marks_obtained || 0} / {answer.max_marks || 0} ✅
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedSubmission({
                                  ...selectedSubmission,
                                  editingEssay: answer
                                });
                                setGradingForm({
                                  marks_obtained: '',
                                  feedback: '',
                                  essay_answers: {}
                                });
                                setShowGradingModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#fef3c7',
                                color: '#d97706',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              <PenSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
                              Grade
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Essay Score: {selectedSubmission.essay_score || 0} / {selectedSubmission.total_essay_marks || 0}
                  </span>
                  {selectedSubmission.essay_answers.some(a => !a.graded) && (
                    <button
                      onClick={() => {
                        setShowGradingModal(true);
                      }}
                      style={{
                        padding: '6px 16px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      <PenSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Grade All Essays
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Details */}
            {selectedSubmission.type === 'assignment' && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                  Assignment Details
                </h3>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b' }}>Title</span>
                    <span style={{ fontWeight: 500 }}>{selectedSubmission.assignment_title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b' }}>Total Marks</span>
                    <span style={{ fontWeight: 600 }}>{selectedSubmission.total_marks || 0}</span>
                  </div>
                  {selectedSubmission.submission_file && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#64748b' }}>File</span>
                      <a
                        href={selectedSubmission.submission_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'underline' }}
                      >
                        View File
                      </a>
                    </div>
                  )}
                  {selectedSubmission.submission_text && (
                    <div style={{ padding: '4px 0' }}>
                      <span style={{ color: '#64748b' }}>Submission Text</span>
                      <p style={{ margin: '4px 0 0 0', background: 'white', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
                        {selectedSubmission.submission_text}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.is_graded && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                        <span style={{ color: '#64748b' }}>Marks Obtained</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>
                          {selectedSubmission.marks_obtained} / {selectedSubmission.total_marks || 0}
                        </span>
                      </div>
                      {selectedSubmission.feedback && (
                        <div style={{ padding: '4px 0' }}>
                          <span style={{ color: '#64748b' }}>Feedback</span>
                          <p style={{ margin: '4px 0 0 0', background: '#f0fdf4', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
                            {selectedSubmission.feedback}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              
              {/* Bonus Marks Button */}
              {selectedSubmission.type === 'exam' && (
                <button
                  onClick={() => setShowBonusModal(true)}
                  className="btn-primary"
                  style={{ background: '#8b5cf6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                >
                  <Star size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  Add Bonus Marks
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GRADING MODAL */}
      {/* ============================================================ */}
      {showGradingModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowGradingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  <PenSquare size={24} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
                  {selectedSubmission.type === 'exam' ? 'Grade Essay' : 'Grade Assignment'}
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedSubmission.student_name} - {selectedSubmission.exam_title || selectedSubmission.assignment_title}
                </p>
              </div>
              <button
                onClick={() => setShowGradingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ×
              </button>
            </div>

            {/* Essay Content to Grade */}
            {selectedSubmission.type === 'exam' && selectedSubmission.editingEssay && (
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>
                  Question: {selectedSubmission.editingEssay.question_text}
                </p>
                <p style={{ background: 'white', padding: '12px', borderRadius: '6px', margin: '0 0 8px 0' }}>
                  <strong>Student Answer:</strong><br />
                  {selectedSubmission.editingEssay.answer_text || 'No answer provided'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
                  <span>Max Marks: {selectedSubmission.editingEssay.max_marks || 0}</span>
                  {selectedSubmission.editingEssay.graded && (
                    <span style={{ color: '#22c55e' }}>
                      Previously graded: {selectedSubmission.editingEssay.marks_obtained || 0}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Content to Grade */}
            {selectedSubmission.type === 'assignment' && (
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>
                  Assignment: {selectedSubmission.assignment_title}
                </p>
                {selectedSubmission.submission_text && (
                  <div style={{ background: 'white', padding: '12px', borderRadius: '6px', margin: '0 0 8px 0' }}>
                    <strong>Submission:</strong><br />
                    {selectedSubmission.submission_text}
                  </div>
                )}
                {selectedSubmission.submission_file && (
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href={selectedSubmission.submission_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'underline' }}
                    >
                      📎 View Attached File
                    </a>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                  <span>Total Marks: {selectedSubmission.total_marks || 0}</span>
                </div>
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedSubmission.type === 'exam') {
                gradeEssayAnswer(
                  selectedSubmission.editingEssay?.id || selectedSubmission.attempt_id,
                  parseFloat(gradingForm.marks_obtained),
                  gradingForm.feedback
                );
              } else {
                gradeAssignment(
                  selectedSubmission.id,
                  parseFloat(gradingForm.marks_obtained),
                  gradingForm.feedback
                );
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  Marks Obtained <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  max={selectedSubmission.type === 'exam' 
                    ? selectedSubmission.editingEssay?.max_marks || 100
                    : selectedSubmission.total_marks || 100
                  }
                  value={gradingForm.marks_obtained}
                  onChange={(e) => setGradingForm({ ...gradingForm, marks_obtained: e.target.value })}
                  placeholder="Enter marks..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Max marks: {selectedSubmission.type === 'exam' 
                    ? selectedSubmission.editingEssay?.max_marks || 0
                    : selectedSubmission.total_marks || 0
                  }
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
                  Feedback (Optional)
                </label>
                <textarea
                  rows="4"
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                  placeholder="Provide feedback to the student..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
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
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-success"
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Saving...' : '✅ Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BONUS MARKS MODAL */}
      {/* ============================================================ */}
      {showBonusModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowBonusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  <Star size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                  Add Bonus Marks
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedSubmission.exam_title} - Bonus for all students
                </p>
              </div>
              <button
                onClick={() => setShowBonusModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              applyBonusMarks();
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  Bonus Marks <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  max="20"
                  value={bonusForm.bonus_marks}
                  onChange={(e) => setBonusForm({ ...bonusForm, bonus_marks: e.target.value })}
                  placeholder="Enter bonus marks..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Recommended: 1-5 marks for minor issues, 5-10 for significant errors
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
                  Reason for Bonus <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                  placeholder="Explain why bonus marks are being given..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={bonusForm.apply_to_all}
                    onChange={(e) => setBonusForm({ ...bonusForm, apply_to_all: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Apply to all students in this exam
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '26px' }}>
                  {bonusForm.apply_to_all ? '✅ All students will receive bonus marks' : 'ℹ️ Only this student will receive bonus marks'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ flex: 1, background: '#8b5cf6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                >
                  {actionLoading ? 'Applying...' : '⭐ Apply Bonus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT ANSWER MODAL */}
      {/* ============================================================ */}
      {showEditAnswerModal && selectedSubmission && selectedSubmission.editingAnswer && (
        <div className="modal-overlay" onClick={() => setShowEditAnswerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  <Edit3 size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                  Edit Auto-Graded Answer
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedSubmission.student_name} - {selectedSubmission.exam_title}
                </p>
              </div>
              <button
                onClick={() => setShowEditAnswerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>
                Question: {selectedSubmission.editingAnswer.question_text}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Student Answer:</strong> {selectedSubmission.editingAnswer.answer_text || 'No answer'}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Correct Answer:</strong> {selectedSubmission.editingAnswer.correct_answer || 'N/A'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
                <span>Current Marks: {selectedSubmission.editingAnswer.marks_obtained || 0}</span>
                <span>Max Marks: {selectedSubmission.editingAnswer.max_marks || 0}</span>
                <span style={{ color: selectedSubmission.editingAnswer.is_correct ? '#22c55e' : '#dc2626' }}>
                  {selectedSubmission.editingAnswer.is_correct ? '✅ Correct' : '❌ Incorrect'}
                </span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const newMarks = parseFloat(e.target.marks.value);
              editAnswer(selectedSubmission.editingAnswer.id, newMarks);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  New Marks <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  name="marks"
                  required
                  step="0.5"
                  min="0"
                  max={selectedSubmission.editingAnswer.max_marks || 0}
                  defaultValue={selectedSubmission.editingAnswer.marks_obtained || 0}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Max marks: {selectedSubmission.editingAnswer.max_marks || 0}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowEditAnswerModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Saving...' : '💾 Update Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ✅ ADDED: COURSE GRADES MODAL */}
      {/* ============================================================ */}
      {showCourseGradesModal && selectedCourseForGrades && (
        <div className="modal-overlay" onClick={() => setShowCourseGradesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  <Award size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                  Course Grades: {selectedCourseForGrades.course_title}
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedCourseForGrades.course_code} • {selectedCourseForGrades.total_students} students
                </p>
              </div>
              <button
                onClick={() => setShowCourseGradesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                ×
              </button>
            </div>

            {/* Stats Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Students</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{selectedCourseForGrades.total_students}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Completed</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{selectedCourseForGrades.completed_students || 0}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Average</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{selectedCourseForGrades.average_percentage?.toFixed(1) || 'N/A'}%</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Pass Rate</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                  {selectedCourseForGrades.pass_rate ? `${selectedCourseForGrades.pass_rate.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Grade Distribution */}
            {selectedCourseForGrades.grade_distribution && Object.keys(selectedCourseForGrades.grade_distribution).length > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Grade Distribution</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(selectedCourseForGrades.grade_distribution).map(([grade, count]) => (
                    <span key={grade} style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: grade.startsWith('A') ? '#dcfce7' :
                                grade.startsWith('B') ? '#dbeafe' :
                                grade.startsWith('C') ? '#fef3c7' :
                                grade === 'F' ? '#fee2e2' : '#f3f4f6',
                      color: grade.startsWith('A') ? '#166534' :
                             grade.startsWith('B') ? '#1e40af' :
                             grade.startsWith('C') ? '#92400e' :
                             grade === 'F' ? '#991b1b' : '#6b7280',
                    }}>
                      {grade}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Students Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}>Student</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}>Marks</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}>Grade</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStudents.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        No students enrolled
                      </td>
                    </tr>
                  ) : (
                    courseStudents.map((student) => (
                      <tr key={student.student_id} style={{
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 500 }}>{student.student_name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{student.student_number}</div>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {student.total_marks_obtained.toFixed(1)} / {student.total_marks_possible.toFixed(1)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <GradeBadge 
                            grade={student.grade_letter} 
                            percentage={student.percentage}
                            size="sm"
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: student.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                            color: student.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                          }}>
                            {student.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;