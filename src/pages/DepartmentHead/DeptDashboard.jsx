// frontend/src/pages/DepartmentHead/DeptDashboard.jsx
// COMPLETE - Full Department Head functionality with all requested fixes

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, CheckCircle, XCircle, Clock,
  Eye, Search, RefreshCw, UserCheck, UserPlus,
  GraduationCap, Calendar, BarChart3,
  Award, AlertTriangle, TrendingUp, TrendingDown,
  Filter, Download, Printer, Plus, Settings,
  Building2, Shield, Trash2, Edit2,
  Lock, Unlock, Activity, Video, User,
  Mail, Phone, MapPin, Briefcase, School,
  ChevronLeft, ChevronRight, UserCog, FileSpreadsheet,
  ClipboardList, PenSquare, Save, X, Edit3, Star,
  Upload, FileText, Users as UsersIcon,
  Calendar as CalendarIcon, Clock as ClockIcon,
  ChevronDown, ChevronUp, Menu, LogOut,
  LayoutDashboard, CreditCard, DollarSign,
  FileCheck, BadgeCheck, UserMinus, UserPlus as UserPlusIcon,
  MoreVertical, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import * as XLSX from 'xlsx';

// Simple GradeBadge component (used in results modal)
const GradeBadge = ({ grade, percentage, size = 'md' }) => {
  const g = (grade || 'NON').toUpperCase();
  let bg = '#f1f5f9';
  let color = '#64748b';
  if (['A+', 'A', 'A-'].includes(g)) { bg = '#dcfce7'; color = '#16a34a'; }
  else if (['B+', 'B', 'B-'].includes(g)) { bg = '#dbeafe'; color = '#2563eb'; }
  else if (['C+', 'C', 'C-'].includes(g)) { bg = '#fef3c7'; color = '#d97706'; }
  else if (['D+', 'D'].includes(g)) { bg = '#ffedd5'; color = '#ea580c'; }
  else if (g === 'F') { bg = '#fee2e2'; color = '#dc2626'; }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: '12px',
      fontSize: size === 'sm' ? '11px' : '13px',
      fontWeight: 600,
      background: bg,
      color: color,
    }}>
      {g}{percentage != null ? ` (${Number(percentage).toFixed(1)}%)` : ''}
    </span>
  );
};

const DeptDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // ============ REFS ============
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  // ============ STATE ============
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('');
  const [selectedStudentResults, setSelectedStudentResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [sendingResults, setSendingResults] = useState(false);
  const [sentResults, setSentResults] = useState([]);

  // ============ DATA STATES ============
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [finalExams, setFinalExams] = useState([]);
  const [filteredFinalExams, setFilteredFinalExams] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState('');

  // ============ SELECTED ITEMS ============
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);

  // ============ MODAL STATES ============
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  // Confirmation modals (no window.confirm)
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showRescheduleExamModal, setShowRescheduleExamModal] = useState(false);
  const [examToReschedule, setExamToReschedule] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ start_time: '', end_time: '' });
  const [showRejectCourseModal, setShowRejectCourseModal] = useState(false);
  const [rejectCourseId, setRejectCourseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 3-dots menu state
  const [openActionMenu, setOpenActionMenu] = useState(null); // e.g. 'course-12', 'exam-5'

  // ============ FORM STATES ============
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    title: '',
    description: '',
    class_credit_hours: 2,
    lab_credit_hours: 1,
    credit_hours: 3,
    semester: '1',
    year: '1',
    capacity: 30,
    capacity_mode: '0-50', // '0-50' | '50-100' | '100-150' | '150-200' | 'custom'
    capacity_custom: 30,
    instructor: '',
    department: ''
  });

  const [examForm, setExamForm] = useState({
    title: 'Quiz', // restricted: Quiz | Mid | Final | Bonus
    description: '',
    course: '',
    date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 120,
    total_marks: 100,
    passing_mark: 40,
    is_published: false, // always false when created by dept head
    proctoring_enabled: true
  });

  const [assignTeacherForm, setAssignTeacherForm] = useState({
    course_id: '',
    teacher_id: '',
  });

  // ============ STATISTICS ============
  const [stats, setStats] = useState({
    totalStudents: 0,
    enrolledStudents: 0,
    pendingStudents: 0,
    verifiedStudents: 0,
    totalTeachers: 0,
    verifiedTeachers: 0,
    totalCourses: 0,
    approvedCourses: 0,
    pendingCourses: 0,
    totalExams: 0,
    publishedExams: 0,
    totalEnrollments: 0,
    activeEnrollments: 0
  });

  const yearOptions = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
    { value: '5', label: '5th Year' },
  ];

  const examTitleOptions = [
    { value: 'Quiz', label: 'Quiz' },
    { value: 'Mid', label: 'Mid' },
    { value: 'Final', label: 'Final' },
    { value: 'Bonus', label: 'Bonus' },
  ];

  // ============================================================
  // FETCH SENT RESULTS
  // ============================================================
  const fetchSentResults = async () => {
    try {
      const response = await api.get('/auth/dept-head/sent-results/');
      setSentResults(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch sent results:', error);
    }
  };

  const handleSendResultToRegistrar = async (studentId, courseId = null) => {
    setSendingResults(true);
    try {
      const payload = studentId ? { student_id: studentId } : { send_all: true };
      const response = await api.post('/auth/dept-head/send-results/', payload);
      toast.success(response.data.message || 'Results sent successfully');
      await fetchData();
      await fetchSentResults();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send results');
    } finally {
      setSendingResults(false);
    }
  };

  const viewStudentResults = async (studentId) => {
    try {
      const response = await api.get(`/auth/dept-head/students/${studentId}/results/`);
      setSelectedStudentResults(response.data);
      setShowResultsModal(true);
    } catch (error) {
      toast.error('Failed to load student results');
    }
  };

  // ============================================================
  // FETCH DEPARTMENT INFO
  // ============================================================
  const fetchDepartmentInfo = async () => {
    try {
      const deptRes = await api.get('/auth/departments/');
      let departments = [];
      if (deptRes.data && deptRes.data.results) {
        departments = deptRes.data.results;
      } else if (Array.isArray(deptRes.data)) {
        departments = deptRes.data;
      }

      let userDept = null;
      for (const dept of departments) {
        if (dept.head === user?.id || dept.head?.id === user?.id) {
          userDept = dept;
          break;
        }
        if (dept.head_name === user?.full_name) {
          userDept = dept;
          break;
        }
      }

      if (!userDept && departments.length > 0) {
        userDept = departments[0];
      }

      if (userDept) {
        setDepartmentInfo(userDept);
        setDepartmentId(userDept.id);
        setDepartmentName(userDept.name || '');
        return userDept;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch department info:', error);
      toast.error('Failed to fetch department info');
      return null;
    }
  };

  // ============================================================
  // MAIN FETCH DATA
  // ============================================================
  const fetchData = async (year = '') => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      setLoading(true);
      setRefreshing(true);

      const dept = await fetchDepartmentInfo();
      const deptName = dept?.name || '';

      // STUDENTS
      try {
        const params = year ? { year } : {};
        const response = await api.get('/auth/dept-head/students/', { params });
        let data = response.data;
        if (data && data.results && Array.isArray(data.results)) {
          const processedStudents = data.results.map(s => ({
            ...s,
            full_name: s.full_name || s.user?.full_name || 'Unknown',
            email: s.email || s.user?.email || '',
            is_enrolled: s.is_enrolled || false,
            documents_verified: s.documents_verified || false,
            payment_status: s.payment_status || 'PENDING'
          }));
          setStudents(processedStudents);
          setFilteredStudents(processedStudents);
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              totalStudents: data.stats.total || 0,
              enrolledStudents: data.stats.enrolled || 0,
              pendingStudents: data.stats.pending || 0,
              verifiedStudents: data.stats.verified || 0,
            }));
          }
        }
      } catch (e) {
        console.warn('/auth/dept-head/students/ failed:', e.message);
        setStudents([]);
        setFilteredStudents([]);
      }

          // TEACHERS
      try {
        const response = await api.get('/auth/dept-head/teachers/');
        let data = response.data;
        if (data && data.results && Array.isArray(data.results)) {
          const processedTeachers = data.results.map(t => ({
            ...t,
            full_name: t.full_name || t.user?.full_name || 'Unknown',
            email: t.email || t.user?.email || '',
            is_verified: t.is_verified || false
          }));
          
          setTeachers(processedTeachers);
          setFilteredTeachers(processedTeachers);
          
          // ✅ FIX: Calculate stats based ONLY on the actual returned array length
          setStats(prev => ({
            ...prev,
            totalTeachers: processedTeachers.length,
            verifiedTeachers: processedTeachers.filter(t => t.is_verified).length
          }));
        } else {
           setTeachers([]);
           setFilteredTeachers([]);
           setStats(prev => ({ ...prev, totalTeachers: 0, verifiedTeachers: 0 }));
        }
      } catch (e) {
        console.warn('/auth/dept-head/teachers/ failed:', e.message);
        setTeachers([]);
        setFilteredTeachers([]);
        setStats(prev => ({ ...prev, totalTeachers: 0, verifiedTeachers: 0 }));
      }

      // COURSES
      try {
        const response = await api.get('/auth/dept-head/courses/');
        let data = response.data;
        if (data && data.results && Array.isArray(data.results)) {
          setCourses(data.results);
          setFilteredCourses(data.results);
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              totalCourses: data.stats.total || 0,
              approvedCourses: data.stats.approved || 0,
              pendingCourses: data.stats.pending || 0,
            }));
          }
        }
      } catch (e) {
        console.warn('/auth/dept-head/courses/ failed:', e.message);
        setCourses([]);
        setFilteredCourses([]);
      }

      // EXAMS
      try {
        const response = await api.get('/auth/dept-head/final-exams/');
        let data = response.data;
        if (data && data.results && Array.isArray(data.results)) {
          setFinalExams(data.results);
          setFilteredFinalExams(data.results);
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              totalExams: data.stats.total || 0,
              publishedExams: data.stats.published || 0,
            }));
          }
        }
      } catch (e) {
        console.warn('/auth/dept-head/final-exams/ failed:', e.message);
        setFinalExams([]);
        setFilteredFinalExams([]);
      }

      // ENROLLMENTS - improved to correctly list department enrollments
      try {
        const response = await api.get('/courses/enrollments/');
        let data = response.data;
        let list = [];
        if (data && data.results && Array.isArray(data.results)) {
          list = data.results;
        } else if (Array.isArray(data)) {
          list = data;
        }

        // Prefer department-filtered list; fall back to all if filtering yields nothing
        let deptEnrollments = list.filter(e =>
          e.course_department === deptName ||
          e.department === deptName ||
          e.course?.department === deptName ||
          e.course?.department_name === deptName ||
          (departmentId && (e.course?.department_id === departmentId || e.department_id === departmentId))
        );

        if (deptEnrollments.length === 0 && list.length > 0) {
          // fallback: show everything returned by the endpoint
          deptEnrollments = list;
        }

        const normalized = deptEnrollments.map(e => ({
          ...e,
          student_name: e.student_name || e.student?.user?.full_name || e.student?.full_name || 'Unknown',
          course_title: e.course_title || e.course?.title || '—',
          course_code: e.course_code || e.course?.course_code || '',
          status: e.status || 'PENDING',
          enrollment_date: e.enrollment_date || e.created_at,
          grade: e.grade_letter || e.grade || '—',
        }));

        setEnrollments(normalized);
        setStats(prev => ({
          ...prev,
          totalEnrollments: normalized.length || 0,
          activeEnrollments: normalized.filter(e => e.status === 'ACTIVE').length || 0
        }));
      } catch (e) {
        console.warn('/courses/enrollments/ failed:', e.message);
        setEnrollments([]);
      }

      // DASHBOARD STATS
      try {
        const response = await api.get('/auth/dept-head/dashboard/');
        if (response.data) {
          const d = response.data;
          setStats(prev => ({
            ...prev,
            totalStudents: d.students?.total ?? prev.totalStudents,
            enrolledStudents: d.students?.enrolled ?? prev.enrolledStudents,
            pendingStudents: d.students?.pending ?? prev.pendingStudents,
            verifiedStudents: d.students?.verified ?? prev.verifiedStudents,
            totalCourses: d.courses?.total ?? prev.totalCourses,
            approvedCourses: d.courses?.approved ?? prev.approvedCourses,
            pendingCourses: d.courses?.pending ?? prev.pendingCourses,
            totalTeachers: d.teachers?.total ?? prev.totalTeachers,
            verifiedTeachers: d.teachers?.verified ?? prev.verifiedTeachers,
            totalExams: d.exams?.total ?? prev.totalExams,
            publishedExams: d.exams?.published ?? prev.publishedExams,
            totalEnrollments: d.enrollments?.total ?? prev.totalEnrollments,
            activeEnrollments: d.enrollments?.active ?? prev.activeEnrollments,
          }));
        }
      } catch (e) {
        console.warn('/auth/dept-head/dashboard/ failed:', e.message);
      }

      initialFetchDone.current = true;
    } catch (error) {
      console.error('Failed to fetch department data:', error);
      toast.error('Failed to load department data');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchInProgress.current = false;
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    isMounted.current = true;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'DEPT_HEAD') {
      toast.error(`Access denied. Your role is ${user?.role}. Department Head only.`);
      navigate('/');
      return;
    }

    if (!initialFetchDone.current && !fetchInProgress.current) {
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, navigate, user]);

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    const handler = () => setOpenActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ============================================================
  // SEARCH & FILTER
  // ============================================================
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (activeTab === 'students') {
      const filtered = students.filter(s =>
        (s.full_name?.toLowerCase() || '').includes(term) ||
        (s.student_id?.toLowerCase() || '').includes(term) ||
        (s.email?.toLowerCase() || '').includes(term)
      );
      setFilteredStudents(filtered);
    } else if (activeTab === 'teachers') {
      const filtered = teachers.filter(t =>
        (t.full_name?.toLowerCase() || '').includes(term) ||
        (t.email?.toLowerCase() || '').includes(term) ||
        (t.employee_id?.toLowerCase() || '').includes(term)
      );
      setFilteredTeachers(filtered);
    } else if (activeTab === 'courses') {
      const filtered = courses.filter(c =>
        (c.title?.toLowerCase() || '').includes(term) ||
        (c.course_code?.toLowerCase() || '').includes(term) ||
        (c.instructor_name?.toLowerCase() || '').includes(term)
      );
      setFilteredCourses(filtered);
    } else if (activeTab === 'exams') {
      const filtered = finalExams.filter(ex =>
        (ex.title?.toLowerCase() || '').includes(term) ||
        (ex.course_title?.toLowerCase() || '').includes(term) ||
        (ex.course_code?.toLowerCase() || '').includes(term)
      );
      setFilteredFinalExams(filtered);
    }
  };

  // ============================================================
  // HELPERS
 const getTeacherOptions = () => {
  if (teachers.length === 0) {
    return <option value="" disabled>No teachers available</option>;
  }
  return teachers.map(t => (
    // ✅ FIX: Use t.user_id here as well
    <option key={t.user_id} value={String(t.user_id)}>{t.full_name}</option>
  ));
};

  const getCourseOptions = () => {
    const approvedCourses = courses.filter(c => c.is_approved);
    if (approvedCourses.length === 0) {
      return <option value="" disabled>No approved courses available</option>;
    }
    return approvedCourses.map(c => (
      <option key={c.id} value={c.id}>{c.course_code} - {c.title}</option>
    ));
  };

  // Update credit hours when class/lab change
  const updateCreditHours = (classHrs, labHrs) => {
    const total = (parseInt(classHrs) || 0) + (parseInt(labHrs) || 0);
    setCourseForm(prev => ({
      ...prev,
      class_credit_hours: parseInt(classHrs) || 0,
      lab_credit_hours: parseInt(labHrs) || 0,
      credit_hours: total
    }));
  };

  // Capacity helper
  const getCapacityValue = () => {
    if (courseForm.capacity_mode === 'custom') {
      return parseInt(courseForm.capacity_custom) || 30;
    }
    const map = {
      '0-50': 50,
      '50-100': 100,
      '100-150': 150,
      '150-200': 200,
    };
    return map[courseForm.capacity_mode] || 30;
  };

  // ============================================================
  // CREATE COURSE
  // ============================================================
  const handleCreateCourse = async () => {
    setActionLoading(true);
    try {
      if (!courseForm.course_code || !courseForm.title) {
        toast.error('Course code and title are required');
        setActionLoading(false);
        return;
      }

      const instructorId = courseForm.instructor ? parseInt(courseForm.instructor) : null;
      const capacity = getCapacityValue();

      const payload = {
        course_code: courseForm.course_code.toUpperCase(),
        title: courseForm.title,
        description: courseForm.description || '',
        class_credit_hours: courseForm.class_credit_hours || 0,
        lab_credit_hours: courseForm.lab_credit_hours || 0,
        credit_hours: courseForm.credit_hours || 0,
        semester: courseForm.semester || '1',
        year: courseForm.year || '1',
        capacity: capacity,
        instructor: instructorId,
        department: departmentId,
      };

      const response = await api.post('/courses/', payload);
      toast.success('Course created successfully!');
      setShowCreateCourseModal(false);
      setCourseForm({
        course_code: '',
        title: '',
        description: '',
        class_credit_hours: 2,
        lab_credit_hours: 1,
        credit_hours: 3,
        semester: '1',
        year: '1',
        capacity: 30,
        capacity_mode: '0-50',
        capacity_custom: 30,
        instructor: '',
        department: ''
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // APPROVE / REJECT COURSE
  // ============================================================
  const handleApproveCourse = async (courseId, action, reason = '') => {
    setActionLoading(true);
    try {
      await api.post(`/auth/dept-head/courses/${courseId}/approve/`, {
        action: action,
        reason: reason
      });
      toast.success(`Course ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowRejectCourseModal(false);
      setRejectReason('');
      setRejectCourseId(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to approve/reject course:', error);
      toast.error(error.response?.data?.error || 'Failed to process course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // DELETE COURSE (modal only)
  // ============================================================
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/courses/${courseToDelete}/`);
      toast.success('Course deleted successfully');
      setShowDeleteCourseModal(false);
      setCourseToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // ASSIGN TEACHER
  // ============================================================
  const handleAssignTeacher = async (courseId, teacherId) => {
    if (!teacherId) {
      toast.error('Please select a teacher');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/courses/${courseId}/`, {
        instructor: parseInt(teacherId, 10),
      });
      toast.success('Teacher assigned successfully!');
      setShowAssignTeacherModal(false);
      setAssignTeacherForm({ course_id: '', teacher_id: '' });
      setSelectedCourse(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to assign teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to assign teacher');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // CREATE EXAM (never published by dept head)
  // ============================================================
  const handleCreateExam = async () => {
    setActionLoading(true);
    try {
      if (!examForm.title || !examForm.course) {
        toast.error('Title and course are required');
        setActionLoading(false);
        return;
      }

      const startDateTime = examForm.date ? `${examForm.date}T${examForm.start_time || '00:00'}` : null;
      const endDateTime = examForm.date ? `${examForm.date}T${examForm.end_time || '23:59'}` : null;

      const payload = {
        title: examForm.title, // Quiz | Mid | Final | Bonus
        description: examForm.description || '',
        course: parseInt(examForm.course),
        start_time: startDateTime,
        end_time: endDateTime,
        duration_minutes: parseInt(examForm.duration_minutes) || 120,
        total_marks: parseInt(examForm.total_marks) || 100,
        passing_mark: parseInt(examForm.passing_mark) || 40,
        is_published: false, // forced false – teacher publishes after adding questions
        proctoring_enabled: examForm.proctoring_enabled !== false,
      };

      await api.post('/exams/', payload);
      toast.success('Exam created successfully! It is visible only to the course teacher until published.');
      setShowCreateExamModal(false);
      setExamForm({
        title: 'Quiz',
        description: '',
        course: '',
        date: '',
        start_time: '',
        end_time: '',
        duration_minutes: 120,
        total_marks: 100,
        passing_mark: 40,
        is_published: false,
        proctoring_enabled: true
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to create exam:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule exam');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // DELETE EXAM (modal only)
  // ============================================================
  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/exams/${examToDelete}/`);
      toast.success('Exam deleted successfully');
      setShowDeleteExamModal(false);
      setExamToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete exam:', error);
      toast.error('Failed to delete exam');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // UPDATE EXAM SCHEDULE
  // ============================================================
  const handleUpdateExam = async (examId, startTime, endTime) => {
    setActionLoading(true);
    try {
      await api.patch(`/exams/${examId}/`, {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      toast.success('Exam schedule updated successfully!');
      setShowRescheduleExamModal(false);
      setExamToReschedule(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to update exam:', error);
      toast.error(error.response?.data?.detail || 'Failed to update exam schedule');
    } finally {
      setActionLoading(false);
    }
  };

  const formatForDateTimeInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const submitReschedule = (event) => {
    event.preventDefault();
    const start = new Date(rescheduleForm.start_time);
    const end = new Date(rescheduleForm.end_time);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error('End time must be later than the start time');
      return;
    }
    if (examToReschedule) {
      handleUpdateExam(examToReschedule.id, rescheduleForm.start_time, rescheduleForm.end_time);
    }
  };

  // ============================================================
  // DOWNLOAD STUDENTS
  // ============================================================
  const downloadStudents = (format = 'csv') => {
    if (!filteredStudents || filteredStudents.length === 0) {
      toast.error('No students to download');
      return;
    }

    const headers = ['Full Name', 'Student ID', 'Email', 'Department', 'Year', 'Status', 'Payment Status'];
    const rows = filteredStudents.map(s => [
      s.full_name || '',
      s.student_id || '',
      s.email || '',
      s.department || '',
      s.year || '',
      s.is_enrolled ? 'Enrolled' : (s.documents_verified ? 'Verified' : 'Pending'),
      s.payment_status || 'PENDING'
    ]);

    if (format === 'csv') {
      const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${departmentName || 'dept'}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      XLSX.writeFile(
        workbook,
        `students_${departmentName || 'dept'}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success('Excel file downloaded');
    } else if (format === 'pdf') {
      // Simple printable HTML → PDF via browser print
      const printWindow = window.open('', '_blank');
      const html = `
        <html><head><title>Students List</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f1f5f9; }
        </style></head><body>
        <h1>Students – ${departmentName || 'Department'}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        toast.success('PDF print dialog opened');
      }, 400);
    } else {
      toast.error('Unsupported format');
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================
  const handleRefresh = () => {
    if (!fetchInProgress.current) {
      initialFetchDone.current = false;
      fetchData(yearFilter);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading && !initialFetchDone.current) {
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
        <p style={{ color: '#64748b' }}>Loading department data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tabs-header { overflow-x: auto; flex-wrap: nowrap; }
          .tab-btn { white-space: nowrap; font-size: 13px; padding: 10px 14px; }
          .search-filter-bar { flex-direction: column !important; }
          .modal-content { padding: 16px; }
          .sidebar-mobile { display: block !important; }
          .sidebar-desktop { display: none !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
          .sidebar-desktop { display: block !important; }
        }
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
        }
        .btn-danger {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
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
          max-width: 700px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          background: none;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }
        .sidebar-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .sidebar-item.active {
          background: #eff6ff;
          color: #3b82f6;
        }
        .action-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          z-index: 50;
          min-width: 160px;
          overflow: hidden;
        }
        .action-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: none;
          text-align: left;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
        }
        .action-menu button:hover {
          background: #f8fafc;
        }
      `}</style>

      {/* MOBILE SIDEBAR TOGGLE */}
      <div className="sidebar-mobile" style={{ marginBottom: '16px', display: 'none' }}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            width: '100%',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 500,
            color: '#0f172a',
          }}
        >
          <Menu size={20} />
          {mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          <span style={{ marginLeft: 'auto', color: '#64748b' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>
        </button>

        {mobileMenuOpen && (
          <div style={{
            marginTop: '8px',
            background: 'white',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}>
              <LayoutDashboard size={20} /> Overview
            </button>
            <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}>
              <Users size={20} /> Students <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{stats.totalStudents}</span>
            </button>
            <button className={`sidebar-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => { setActiveTab('teachers'); setMobileMenuOpen(false); }}>
              <UserCheck size={20} /> Teachers <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{stats.totalTeachers}</span>
            </button>
            <button className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}>
              <BookOpen size={20} /> Courses <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{stats.totalCourses}</span>
            </button>
            <button className={`sidebar-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => { setActiveTab('exams'); setMobileMenuOpen(false); }}>
              <FileText size={20} /> Exams <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{stats.totalExams}</span>
            </button>
            <button className={`sidebar-item ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => { setActiveTab('enrollments'); setMobileMenuOpen(false); }}>
              <ClipboardList size={20} /> Enrollments <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{stats.totalEnrollments}</span>
            </button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* SIDEBAR - DESKTOP */}
        <div className="sidebar-desktop" style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            padding: '20px',
          }}>
            <div style={{
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>
                    {departmentName || 'Department'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    {user?.full_name || 'Department Head'}
                  </p>
                </div>
              </div>
               <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <LayoutDashboard size={20} /> Overview
              </button>
              <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                <Users size={20} /> Students
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalStudents}</span>
              </button>
              
              {/* ✅ FIX: Changed stats.totalTeachers to filteredTeachers.length */}
              <button className={`sidebar-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
                <UserCheck size={20} /> Teachers
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{filteredTeachers.length}</span>
              </button>
              
              <button className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                <BookOpen size={20} /> Courses
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalCourses}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
                <FileText size={20} /> Exams
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalExams}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => setActiveTab('enrollments')}>
                <ClipboardList size={20} /> Enrollments
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalEnrollments}</span>
              </button>
            </nav>         
            </div>
      

          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* HEADER */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                <Building2 size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Department Dashboard
              </h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                {departmentName || 'Your Department'} • Manage students, teachers, courses, and exams
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || fetchInProgress.current}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                color: '#475569',
                cursor: (refreshing || fetchInProgress.current) ? 'not-allowed' : 'pointer',
                opacity: (refreshing || fetchInProgress.current) ? 0.6 : 1,
              }}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* STATS CARDS - CLICKABLE */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div
              onClick={() => setActiveTab('students')}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                borderLeft: '4px solid #3b82f6',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalStudents}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Students</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('courses')}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                borderLeft: '4px solid #22c55e',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dcfce7', color: '#22c55e' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalCourses}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Courses</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('courses')}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                borderLeft: '4px solid #f59e0b',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pendingCourses}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Pending Approvals</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('students')}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                borderLeft: '4px solid #8b5cf6',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ede9fe', color: '#8b5cf6' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.enrolledStudents}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Enrolled Students</span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }} className="tabs-header">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'students', label: `Students (${stats.totalStudents})`, icon: Users, badge: stats.pendingStudents },
                { id: 'teachers', label: `Teachers (${filteredTeachers.length})`, icon: UserCheck },                { id: 'courses', label: `Courses (${stats.totalCourses})`, icon: BookOpen, badge: stats.pendingCourses },
                { id: 'exams', label: `Exams (${stats.totalExams})`, icon: FileText },
                { id: 'enrollments', label: `Enrollments (${stats.totalEnrollments})`, icon: ClipboardList },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '14px 24px',
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span style={{
                      marginLeft: '4px',
                      background: '#f59e0b',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      {tab.badge} pending
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                  Department Overview
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '24px',
                }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Students</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.totalStudents}</p>
                    <p style={{ fontSize: '12px', color: '#22c55e' }}>✅ {stats.enrolledStudents} enrolled</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Teachers</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.totalTeachers}</p>
                    <p style={{ fontSize: '12px', color: '#22c55e' }}>✅ {stats.verifiedTeachers} verified</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Courses</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.totalCourses}</p>
                    <p style={{ fontSize: '12px', color: '#22c55e' }}>✅ {stats.approvedCourses} approved</p>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Quick Actions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <button onClick={() => setShowCreateCourseModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
                      <Plus size={18} /> Create Course
                    </button>
                    <button
                      onClick={() => setShowCreateExamModal(true)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px', background: '#8b5cf6' }}
                    >
                      <FileText size={18} /> Schedule Exam
                    </button>
                    <button onClick={() => setActiveTab('students')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
                      <Users size={18} /> View Students
                    </button>
                    <button onClick={() => setActiveTab('courses')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
                      <BookOpen size={18} /> Manage Courses
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Recent Activity</h3>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                    {courses.length === 0 && students.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No recent activity</p>
                    ) : (
                      <>
                        {courses.slice(0, 3).map((course) => (
                          <div key={course.id} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                            <span><BookOpen size={14} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />{course.title} ({course.course_code})</span>
                            <span style={{ fontSize: '12px', color: course.is_approved ? '#16a34a' : '#f59e0b' }}>{course.is_approved ? '✅ Approved' : '⏳ Pending'}</span>
                          </div>
                        ))}
                        {students.slice(0, 3).map((student) => (
                          <div key={student.id} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                            <span><Users size={14} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />{student.full_name}</span>
                            <span style={{ fontSize: '12px', color: student.is_enrolled ? '#16a34a' : '#f59e0b' }}>{student.is_enrolled ? '✅ Enrolled' : '⏳ Pending'}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STUDENTS TAB ==================== */}
            {activeTab === 'students' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <Users size={18} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                      Students in Department
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {students.length} students • {stats.enrolledStudents} enrolled • {stats.pendingStudents} pending
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenActionMenu(openActionMenu === 'download-students' ? null : 'download-students'); }}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={16} /> Download
                      </button>
                      {openActionMenu === 'download-students' && (
                        <div className="action-menu" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { downloadStudents('csv'); setOpenActionMenu(null); }}>
                            <FileSpreadsheet size={14} /> CSV
                          </button>
                          <button onClick={() => { downloadStudents('excel'); setOpenActionMenu(null); }}>
                            <FileSpreadsheet size={14} /> Excel (.xlsx)
                          </button>
                          <button onClick={() => { downloadStudents('pdf'); setOpenActionMenu(null); }}>
                            <FileText size={14} /> PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); handleSearch(e); }}
                      style={{ width: '100%', padding: '10px 12px 10px 40px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <select
                    value={yearFilter}
                    onChange={(e) => {
                      setYearFilter(e.target.value);
                      fetchData(e.target.value);
                    }}
                    style={{ padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                  >
                    <option value="">All Years</option>
                    {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                  <select
                    style={{ padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                    onChange={(e) => {
                      const filter = e.target.value;
                      let filtered = students;
                      if (filter === 'enrolled') filtered = students.filter(s => s.is_enrolled);
                      else if (filter === 'pending') filtered = students.filter(s => !s.is_enrolled && !s.documents_verified);
                      else if (filter === 'verified') filtered = students.filter(s => s.documents_verified);
                      else if (filter === 'not_enrolled') filtered = students.filter(s => !s.is_enrolled);
                      setFilteredStudents(filtered);
                    }}
                  >
                    <option value="all">All Students</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="not_enrolled">Not Enrolled</option>
                    <option value="verified">Documents Verified</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No students found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <div>
                                <span style={{ fontWeight: 500, color: '#0f172a', display: 'block' }}>{student.full_name}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{student.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569', fontFamily: 'monospace' }}>{student.student_id || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{student.department || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {student.is_enrolled ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><CheckCircle size={14} /> Enrolled</span>
                              ) : student.documents_verified ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}><Clock size={14} /> Verified</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><Clock size={14} /> Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenu(openActionMenu === `student-${student.id}` ? null : `student-${student.id}`);
                                }}
                                style={{ padding: '6px', border: 'none', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer' }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openActionMenu === `student-${student.id}` && (
                                <div className="action-menu" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setSelectedStudent(student); setShowStudentModal(true); setOpenActionMenu(null); }}>
                                    <Eye size={14} /> View
                                  </button>
                                  <button onClick={() => { viewStudentResults(student.id); setOpenActionMenu(null); }}>
                                    <Award size={14} /> Results
                                  </button>
                                  <button onClick={() => { handleSendResultToRegistrar(student.id); setOpenActionMenu(null); }}>
                                    <Send size={14} /> Send to Registrar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', borderRadius: '8px' }}>
                  <span>Showing {filteredStudents.length} of {students.length} students</span>
                  <span>✅ Enrolled: {stats.enrolledStudents} | ⏳ Pending: {stats.pendingStudents}</span>
                </div>
              </div>
            )}

            {/* ==================== TEACHERS TAB ==================== */}
            {activeTab === 'teachers' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <UserCheck size={18} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                      Teachers in Department
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {filteredTeachers.length} teachers • {stats.verifiedTeachers} verified
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); handleSearch(e); }}
                      style={{ width: '100%', padding: '10px 12px 10px 40px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <select
                    style={{ padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                    onChange={(e) => {
                      const filter = e.target.value;
                      let filtered = teachers;
                      if (filter === 'verified') filtered = teachers.filter(t => t.is_verified);
                      else if (filter === 'unverified') filtered = teachers.filter(t => !t.is_verified);
                      setFilteredTeachers(filtered);
                    }}
                  >
                    <option value="all">All Teachers</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Teacher</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <UserCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No teachers found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher) => (
                          <tr key={teacher.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{teacher.full_name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{teacher.email}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{teacher.department || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {teacher.is_verified ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><CheckCircle size={14} /> Verified</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><Clock size={14} /> Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenu(openActionMenu === `teacher-${teacher.id}` ? null : `teacher-${teacher.id}`);
                                }}
                                style={{ padding: '6px', border: 'none', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer' }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openActionMenu === `teacher-${teacher.id}` && (
                                <div className="action-menu" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setSelectedTeacher(teacher); setShowTeacherModal(true); setOpenActionMenu(null); }}>
                                    <Eye size={14} /> View
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', borderRadius: '8px' }}>
                  <span>Showing {filteredTeachers.length} of {teachers.length} teachers</span>
                  <span>✅ Verified: {stats.verifiedTeachers}</span>
                </div>
              </div>
            )}

            {/* ==================== COURSES TAB ==================== */}
            {activeTab === 'courses' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <BookOpen size={18} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                      Department Courses
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {courses.length} courses • {stats.approvedCourses} approved • {stats.pendingCourses} pending
                    </p>
                  </div>
                  <button onClick={() => setShowCreateCourseModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Create Course
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); handleSearch(e); }}
                      style={{ width: '100%', padding: '10px 12px 10px 40px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <select
                    style={{ padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                    onChange={(e) => {
                      const filter = e.target.value;
                      let filtered = courses;
                      if (filter === 'approved') filtered = courses.filter(c => c.is_approved);
                      else if (filter === 'pending') filtered = courses.filter(c => !c.is_approved);
                      else if (filter === 'active') filtered = courses.filter(c => c.is_active);
                      setFilteredCourses(filtered);
                    }}
                  >
                    <option value="all">All Courses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Approval</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Code</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Title</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Instructor</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Students</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No courses found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.map((course) => (
                          <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{course.course_code}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>{course.title}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {course.instructor_name || 'Not Assigned'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{course.enrolled_count || 0}/{course.capacity}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {course.is_approved ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><CheckCircle size={14} /> Approved</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><Clock size={14} /> Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenu(openActionMenu === `course-${course.id}` ? null : `course-${course.id}`);
                                }}
                                style={{ padding: '6px', border: 'none', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer' }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openActionMenu === `course-${course.id}` && (
                                <div className="action-menu" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setSelectedCourse(course); setShowCourseModal(true); setOpenActionMenu(null); }}>
                                    <Eye size={14} /> View
                                  </button>
                                  <button onClick={() => {
                                    setSelectedCourse(course);
                                    setAssignTeacherForm({ course_id: course.id, teacher_id: course.instructor ? String(course.instructor) : '' });
                                    setShowAssignTeacherModal(true);
                                    setOpenActionMenu(null);
                                  }}>
                                    <UserCog size={14} /> {course.instructor_name ? 'Reassign Teacher' : 'Assign Teacher'}
                                  </button>
                                  {!course.is_approved && (
                                    <>
                                      <button onClick={() => { handleApproveCourse(course.id, 'approve'); setOpenActionMenu(null); }}>
                                        <CheckCircle size={14} /> Approve
                                      </button>
                                      <button onClick={() => { setRejectCourseId(course.id); setShowRejectCourseModal(true); setOpenActionMenu(null); }}>
                                        <XCircle size={14} /> Reject
                                      </button>
                                    </>
                                  )}
                                  {course.is_approved && (
                                    <button onClick={() => { setCourseToDelete(course.id); setShowDeleteCourseModal(true); setOpenActionMenu(null); }} style={{ color: '#dc2626' }}>
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', borderRadius: '8px' }}>
                  <span>Showing {filteredCourses.length} of {courses.length} courses</span>
                  <span>✅ Approved: {stats.approvedCourses} | ⏳ Pending: {stats.pendingCourses}</span>
                </div>
              </div>
            )}

            {/* ==================== EXAMS TAB ==================== */}
            {activeTab === 'exams' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <FileText size={18} style={{ display: 'inline', marginRight: '8px', color: '#ec4899' }} />
                      Exams
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {finalExams.length} exams • {stats.publishedExams} published
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateExamModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#8b5cf6' }}
                  >
                    <Plus size={16} /> Schedule Exam
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Title</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Course</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFinalExams.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No exams scheduled</p>
                          </td>
                        </tr>
                      ) : (
                        filteredFinalExams.map((exam) => (
                          <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{exam.title}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{exam.course_title}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {exam.start_time ? new Date(exam.start_time).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{exam.duration_minutes} min</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {exam.is_published ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><CheckCircle size={14} /> Published</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><Clock size={14} /> Draft (Teacher)</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenu(openActionMenu === `exam-${exam.id}` ? null : `exam-${exam.id}`);
                                }}
                                style={{ padding: '6px', border: 'none', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer' }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openActionMenu === `exam-${exam.id}` && (
                                <div className="action-menu" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setSelectedExam(exam); setShowExamModal(true); setOpenActionMenu(null); }}>
                                    <Eye size={14} /> View
                                  </button>
                                  <button onClick={() => {
                                    setExamToReschedule(exam);
                                    setRescheduleForm({
                                      start_time: formatForDateTimeInput(exam.start_time),
                                      end_time: formatForDateTimeInput(exam.end_time),
                                    });
                                    setShowRescheduleExamModal(true);
                                    setOpenActionMenu(null);
                                  }}>
                                    <Edit2 size={14} /> Reschedule
                                  </button>
                                  <button onClick={() => { setExamToDelete(exam.id); setShowDeleteExamModal(true); setOpenActionMenu(null); }} style={{ color: '#dc2626' }}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', borderRadius: '8px' }}>
                  <span>Showing {filteredFinalExams.length} of {finalExams.length} exams</span>
                  <span>📢 Published: {stats.publishedExams}</span>
                </div>
              </div>
            )}

            {/* ==================== ENROLLMENTS TAB ==================== */}
            {activeTab === 'enrollments' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <ClipboardList size={18} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                      Enrollments
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {enrollments.length} total enrollments • {stats.activeEnrollments} active
                    </p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Course</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No enrollments found</p>
                          </td>
                        </tr>
                      ) : (
                        enrollments.map((enrollment) => (
                          <tr key={enrollment.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                              {enrollment.student_name || 'Unknown'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {enrollment.course_title || '—'}
                              {enrollment.course_code && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{enrollment.course_code}</div>}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {enrollment.status === 'ACTIVE' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><CheckCircle size={14} /> Active</span>
                              ) : enrollment.status === 'COMPLETED' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}><Award size={14} /> Completed</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><Clock size={14} /> {enrollment.status || 'Pending'}</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                              {enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                              {enrollment.grade || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', borderRadius: '8px' }}>
                  <span>Showing {enrollments.length} enrollments</span>
                  <span>✅ Active: {stats.activeEnrollments}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== CREATE COURSE MODAL ==================== */}
      {showCreateCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCreateCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Plus size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Create New Course
              </h2>
              <button onClick={() => setShowCreateCourseModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateCourse(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Course Code *</label>
                <input
                  type="text"
                  required
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS101"
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows="3"
                  placeholder="Course description..."
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              {/* Year */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Year *</label>
                <select
                  value={courseForm.year}
                  onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                >
                  {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>

              {/* Class + Lab credit hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Class Credit Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={courseForm.class_credit_hours}
                    onChange={(e) => updateCreditHours(e.target.value, courseForm.lab_credit_hours)}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Lab Credit Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={courseForm.lab_credit_hours}
                    onChange={(e) => updateCreditHours(courseForm.class_credit_hours, e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Total Credit Hours</label>
                  <input
                    type="number"
                    value={courseForm.credit_hours}
                    readOnly
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Semester</label>
                  <select
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Summer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Instructor *</label>

<select
  required
  value={courseForm.instructor}
  onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
>
  <option value="">Select Instructor</option>
  {teachers.length > 0 ? teachers.map(t => (
    // ✅ FIX: Use t.user_id instead of t.id so the backend gets the actual User ID
    <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
  )) : <option value="" disabled>No teachers available</option>}
</select>
                </div>
              </div>

              {/* Capacity */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Capacity</label>
                <select
                  value={courseForm.capacity_mode}
                  onChange={(e) => setCourseForm({ ...courseForm, capacity_mode: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white', marginBottom: '8px' }}
                >
                  <option value="0-50">0 – 50</option>
                  <option value="50-100">50 – 100</option>
                  <option value="100-150">100 – 150</option>
                  <option value="150-200">150 – 200</option>
                  <option value="custom">Type your own</option>
                </select>
                {courseForm.capacity_mode === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={courseForm.capacity_custom}
                    onChange={(e) => setCourseForm({ ...courseForm, capacity_custom: parseInt(e.target.value) || 30 })}
                    placeholder="Enter capacity"
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateCourseModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={actionLoading || teachers.length === 0} className="btn-primary" style={{ flex: 1 }}>
                  {actionLoading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE EXAM MODAL ==================== */}
      {showCreateExamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                Schedule Exam
              </h2>
              <button onClick={() => setShowCreateExamModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateExam(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Exam Title *</label>
                <select
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                >
                  {examTitleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Exam will be created as Draft. Only the course teacher can add questions and publish it.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Course *</label>
                <select
                  required
                  value={examForm.course}
                  onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                >
                  <option value="">Select Course</option>
                  {getCourseOptions()}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Exam Date *</label>
                <input
                  type="date"
                  required
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Start Time *</label>
                  <input type="time" required value={examForm.start_time} onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>End Time *</label>
                  <input type="time" required value={examForm.end_time} onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Duration (minutes)</label>
                  <input type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) || 120 })} min="15" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Total Marks</label>
                  <input type="number" value={examForm.total_marks} onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 100 })} min="1" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Passing Mark</label>
                  <input type="number" value={examForm.passing_mark} onChange={(e) => setExamForm({ ...examForm, passing_mark: parseInt(e.target.value) || 40 })} min="1" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={examForm.proctoring_enabled} onChange={(e) => setExamForm({ ...examForm, proctoring_enabled: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                    Enable Proctoring
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateExamModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={actionLoading || courses.filter(c => c.is_approved).length === 0} className="btn-primary" style={{ flex: 1, background: '#8b5cf6' }}>
                  {actionLoading ? 'Scheduling...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ASSIGN TEACHER MODAL ==================== */}
      {showAssignTeacherModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowAssignTeacherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <UserCog size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Assign Teacher to Course
              </h2>
              <button onClick={() => setShowAssignTeacherModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0 }}><strong>Course:</strong> {selectedCourse.course_code} - {selectedCourse.title}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}><strong>Department:</strong> {departmentName}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAssignTeacher(selectedCourse.id, assignTeacherForm.teacher_id); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Select Teacher *</label>
                <select
                  required
                  value={assignTeacherForm.teacher_id}
                  onChange={(e) => setAssignTeacherForm({ ...assignTeacherForm, teacher_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                >
                  <option value="">Select a teacher</option>
                  {getTeacherOptions()}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAssignTeacherModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={actionLoading || teachers.length === 0} className="btn-primary" style={{ flex: 1 }}>
                  {actionLoading ? 'Assigning...' : 'Assign Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE COURSE CONFIRM MODAL ==================== */}
      {showDeleteCourseModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Delete Course?</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>This action cannot be undone. Are you sure you want to delete this course?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteCourseModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmDeleteCourse} disabled={actionLoading} className="btn-danger" style={{ flex: 1 }}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE EXAM CONFIRM MODAL ==================== */}
      {showRescheduleExamModal && examToReschedule && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRescheduleExamModal(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="reschedule-exam-title" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 id="reschedule-exam-title" style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Reschedule exam</h2>
            <p style={{ color: '#64748b', margin: '0 0 20px' }}>{examToReschedule.title}</p>
            <form onSubmit={submitReschedule}>
              <label style={{ display: 'block', marginBottom: 14, color: '#334155', fontWeight: 600 }}>
                Start date and time
                <input
                  type="datetime-local"
                  required
                  value={rescheduleForm.start_time}
                  onChange={(event) => setRescheduleForm({ ...rescheduleForm, start_time: event.target.value })}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 22, color: '#334155', fontWeight: 600 }}>
                End date and time
                <input
                  type="datetime-local"
                  required
                  value={rescheduleForm.end_time}
                  min={rescheduleForm.start_time || undefined}
                  onChange={(event) => setRescheduleForm({ ...rescheduleForm, end_time: event.target.value })}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn-secondary" disabled={actionLoading} onClick={() => setShowRescheduleExamModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteExamModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Delete Exam?</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>This action cannot be undone. Are you sure you want to delete this exam?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteExamModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmDeleteExam} disabled={actionLoading} className="btn-danger" style={{ flex: 1 }}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REJECT COURSE MODAL ==================== */}
      {showRejectCourseModal && (
        <div className="modal-overlay" onClick={() => setShowRejectCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Reject Course</h2>
            <p style={{ color: '#64748b', marginBottom: '12px' }}>Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="3"
              placeholder="Rejection reason..."
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowRejectCourseModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button
                onClick={() => handleApproveCourse(rejectCourseId, 'reject', rejectReason)}
                disabled={actionLoading || !rejectReason.trim()}
                className="btn-danger"
                style={{ flex: 1 }}
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW STUDENT MODAL ==================== */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Users size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Student Details
              </h2>
              <button onClick={() => setShowStudentModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Full Name</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedStudent.full_name}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedStudent.email}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Student ID</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0', fontFamily: 'monospace' }}>{selectedStudent.student_id || 'Not Generated'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedStudent.department || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedStudent.is_enrolled ? <span style={{ color: '#16a34a' }}>✅ Enrolled</span> :
                    selectedStudent.documents_verified ? <span style={{ color: '#2563eb' }}>⏳ Documents Verified</span> :
                      <span style={{ color: '#f59e0b' }}>⏳ Pending</span>}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Payment Status</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedStudent.payment_status === 'VERIFIED' ? <span style={{ color: '#16a34a' }}>✅ Verified</span> : <span style={{ color: '#f59e0b' }}>⏳ Pending</span>}
                </p>
              </div>
            </div>

            <button onClick={() => setShowStudentModal(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* ==================== VIEW TEACHER MODAL ==================== */}
      {showTeacherModal && selectedTeacher && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <UserCheck size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                Teacher Details
              </h2>
              <button onClick={() => setShowTeacherModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Full Name</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedTeacher.full_name}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedTeacher.email}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Employee ID</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0', fontFamily: 'monospace' }}>{selectedTeacher.employee_id || 'Not Generated'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedTeacher.department || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedTeacher.is_verified ? <span style={{ color: '#16a34a' }}>✅ Verified</span> : <span style={{ color: '#f59e0b' }}>⏳ Pending</span>}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Specialization</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedTeacher.specialization || '—'}</p>
              </div>
            </div>

            <button onClick={() => setShowTeacherModal(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* ==================== VIEW COURSE MODAL ==================== */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <BookOpen size={24} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Course Details
              </h2>
              <button onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Course Code</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedCourse.course_code}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Title</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedCourse.title}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Instructor</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedCourse.instructor_name || 'Not Assigned'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedCourse.department_name || departmentName}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Credit Hours</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedCourse.credit_hours}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Capacity</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedCourse.enrolled_count || 0} / {selectedCourse.capacity}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Semester</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>Semester {selectedCourse.semester}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedCourse.is_approved ? <span style={{ color: '#16a34a' }}>✅ Approved</span> : <span style={{ color: '#f59e0b' }}>⏳ Pending</span>}
                </p>
              </div>
            </div>

            {selectedCourse.description && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Description</span>
                <p style={{ margin: '4px 0 0 0', background: 'white', padding: '12px', borderRadius: '6px' }}>{selectedCourse.description}</p>
              </div>
            )}

            <button onClick={() => setShowCourseModal(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* ==================== VIEW EXAM MODAL ==================== */}
      {showExamModal && selectedExam && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#ec4899' }} />
                Exam Details
              </h2>
              <button onClick={() => setShowExamModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Title</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedExam.title}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Course</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedExam.course_title}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Date</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedExam.start_time ? new Date(selectedExam.start_time).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Time</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedExam.start_time ? new Date(selectedExam.start_time).toLocaleTimeString() : '—'} - {selectedExam.end_time ? new Date(selectedExam.end_time).toLocaleTimeString() : '—'}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Duration</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedExam.duration_minutes} minutes</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Total Marks</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedExam.total_marks}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Passing Mark</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{selectedExam.passing_mark}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedExam.is_published ? <span style={{ color: '#16a34a' }}>📢 Published</span> : <span style={{ color: '#f59e0b' }}>📝 Draft (Teacher)</span>}
                </p>
              </div>
            </div>

            {selectedExam.description && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Description</span>
                <p style={{ margin: '4px 0 0 0', background: 'white', padding: '12px', borderRadius: '6px' }}>{selectedExam.description}</p>
              </div>
            )}

            <button onClick={() => setShowExamModal(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* ==================== RESULTS MODAL ==================== */}
      {showResultsModal && selectedStudentResults && (
        <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  <Award size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                  Student Results
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedStudentResults.student?.full_name} • {selectedStudentResults.student?.student_id}
                </p>
              </div>
              <button onClick={() => setShowResultsModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedStudentResults.student?.department}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Year</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedStudentResults.student?.year || 'N/A'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>CGPA</span>
                <p style={{ fontWeight: 600, color: '#2563eb', margin: '4px 0 0 0' }}>{selectedStudentResults.summary?.cgpa || '0.00'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Overall Grade</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>
                  <GradeBadge grade={selectedStudentResults.summary?.overall_grade?.letter || 'NON'} percentage={selectedStudentResults.summary?.overall_percentage} />
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Course Grades</h3>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Course</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Marks</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Grade</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedStudentResults.course_results || []).map((course) => (
                    <tr key={course.course_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{course.course_title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{course.course_code}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {(course.marks_obtained || 0).toFixed(1)} / {(course.marks_possible || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <GradeBadge grade={course.grade} percentage={course.percentage} size="sm" />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: course.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                          color: course.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                        }}>
                          {course.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Total Marks</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>
                  {(selectedStudentResults.summary?.total_marks_obtained || 0).toFixed(1)} / {(selectedStudentResults.summary?.total_marks_possible || 0).toFixed(1)}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Percentage</span>
                <p style={{ fontWeight: 600, color: '#2563eb', margin: '4px 0 0 0' }}>
                  {(selectedStudentResults.summary?.overall_percentage || 0).toFixed(1)}%
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Completed Courses</span>
                <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>
                  {selectedStudentResults.summary?.completed_courses || 0} / {selectedStudentResults.summary?.total_courses || 0}
                </p>
              </div>
            </div>

            {!selectedStudentResults.sent_to_registrar ? (
              <button
                onClick={() => handleSendResultToRegistrar(selectedStudentResults.student?.id)}
                disabled={sendingResults}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: sendingResults ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: sendingResults ? 0.6 : 1,
                }}
              >
                <Send size={18} />
                {sendingResults ? 'Sending...' : 'Send Results to Registrar'}
              </button>
            ) : (
              <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '8px', textAlign: 'center', color: '#16a34a' }}>
                <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Results sent to Registrar on {selectedStudentResults.sent_at ? new Date(selectedStudentResults.sent_at).toLocaleDateString() : '—'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptDashboard;