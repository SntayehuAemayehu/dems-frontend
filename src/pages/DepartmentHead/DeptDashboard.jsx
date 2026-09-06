// frontend/src/pages/DepartmentHead/DeptDashboard.jsx
// COMPLETE - Full Department Head functionality with all management features

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
  FileCheck, BadgeCheck, UserMinus, UserPlus as UserPlusIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
// Add to imports:
import { Send } from 'lucide-react';
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
  // Add to state:
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
  
  // ============ FORM STATES ============
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    title: '',
    description: '',
    credit_hours: 3,
    semester: '1',
    capacity: 30,
    instructor: '',
    department: ''
  });
  
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    course: '',
    date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 120,
    total_marks: 100,
    passing_mark: 40,
    is_published: true,
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
// ============ ADD THESE TO DeptDashboard.jsx ============

// Add to imports:


// Add year options:
const yearOptions = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
    { value: '5', label: '5th Year' },
    { value: '6', label: '6th Year' },
    { value: '7', label: '7th Year' },
    { value: '8', label: '8th Year' },
];

// Add fetch function for sent results:
const fetchSentResults = async () => {
    try {
        const response = await api.get('/auth/dept-head/sent-results/');
        setSentResults(response.data.results || []);
    } catch (error) {
        console.error('Failed to fetch sent results:', error);
    }
};

// Add handleSendResult function:
const handleSendResultToRegistrar = async (studentId, courseId = null) => {
    setSendingResults(true);
    try {
        const payload = studentId ? { student_id: studentId } : { send_all: true };
        const response = await api.post('/auth/dept-head/send-results/', payload);
        toast.success(response.data.message);
        await fetchData();
        await fetchSentResults();
    } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to send results');
    } finally {
        setSendingResults(false);
    }
};

// Add view student results function:
const viewStudentResults = async (studentId) => {
    try {
        const response = await api.get(`/auth/dept-head/students/${studentId}/results/`);
        setSelectedStudentResults(response.data);
        setShowResultsModal(true);
    } catch (error) {
        toast.error('Failed to load student results');
    }
};

// Add year filter dropdown in the search bar:
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Filter size={18} />
    <select
        value={yearFilter}
        onChange={(e) => {
            setYearFilter(e.target.value);
            // Refetch with year filter
            fetchDataWithFilter(e.target.value);
        }}
        style={{
            padding: '10px 12px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            transition: 'all 0.3s ease',
        }}
    >
        <option value="">All Years</option>
        {yearOptions.map(year => (
            <option key={year.value} value={year.value}>{year.label}</option>
        ))}
    </select>
</div>

// Add Results Modal:
{showResultsModal && selectedStudentResults && (
    <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
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
                        Student Results
                    </h2>
                    <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                        {selectedStudentResults.student?.full_name} • {selectedStudentResults.student?.student_id}
                    </p>
                </div>
                <button onClick={() => setShowResultsModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Student Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '20px',
            }}>
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
                        <GradeBadge 
                            grade={selectedStudentResults.summary?.overall_grade?.letter || 'NON'} 
                            percentage={selectedStudentResults.summary?.overall_percentage}
                        />
                    </p>
                </div>
            </div>

            {/* Course Results Table */}
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
                        {selectedStudentResults.course_results?.map((course) => (
                            <tr key={course.course_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px' }}>
                                    <div style={{ fontWeight: 500 }}>{course.course_title}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{course.course_code}</div>
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                    {course.marks_obtained.toFixed(1)} / {course.marks_possible.toFixed(1)}
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

            {/* Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                marginBottom: '16px',
            }}>
                <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Total Marks</span>
                    <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>
                        {selectedStudentResults.summary?.total_marks_obtained.toFixed(1)} / {selectedStudentResults.summary?.total_marks_possible.toFixed(1)}
                    </p>
                </div>
                <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Percentage</span>
                    <p style={{ fontWeight: 600, color: '#2563eb', margin: '4px 0 0 0' }}>
                        {selectedStudentResults.summary?.overall_percentage.toFixed(1)}%
                    </p>
                </div>
                <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Completed Courses</span>
                    <p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>
                        {selectedStudentResults.summary?.completed_courses} / {selectedStudentResults.summary?.total_courses}
                    </p>
                </div>
            </div>

            {/* Send Result Button */}
            {!selectedStudentResults.sent_to_registrar && (
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
            )}
            {selectedStudentResults.sent_to_registrar && (
                <div style={{
                    padding: '12px',
                    background: '#dcfce7',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#16a34a',
                }}>
                    <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Results sent to Registrar on {new Date(selectedStudentResults.sent_at).toLocaleDateString()}
                </div>
            )}
        </div>
    </div>
)}
  // ============================================================
  // FETCH DEPARTMENT INFO
  // ============================================================
  const fetchDepartmentInfo = async () => {
    try {
      console.log('🔄 Fetching department info...');
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
        setDepartmentName(userDept.name);
        return userDept;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch department info:', error);
      toast.error('Failed to fetch department info');
      return null;
    }
  };

  // ============================================================
  // MAIN FETCH DATA
  // ============================================================
  const fetchData = async () => {
    if (fetchInProgress.current) {
      console.log('⚠️ Fetch already in progress, skipping...');
      return;
    }
    
    fetchInProgress.current = true;
    
    try {
      setLoading(true);
      setRefreshing(true);
      
      console.log('🔄 ========================================');
      console.log('🔄 FETCHING DEPARTMENT DATA');
      console.log('🔄 ========================================');
      
      const dept = await fetchDepartmentInfo();
      const deptName = dept?.name || '';
      console.log('📚 Department Name:', deptName);
      
      // ============ FETCH STUDENTS ============
      try {
        const response = await api.get('/auth/dept-head/students/');
        console.log('✅ Students response:', response.data);
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
        console.warn('⚠️ /auth/dept-head/students/ failed:', e.message);
        setStudents([]);
        setFilteredStudents([]);
      }
      
      // ============ FETCH TEACHERS ============
      try {
        const response = await api.get('/auth/dept-head/teachers/');
        console.log('✅ Teachers response:', response.data);
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
          setStats(prev => ({
            ...prev,
            totalTeachers: data.count || data.results.length || 0,
            verifiedTeachers: processedTeachers.filter(t => t.is_verified).length || 0
          }));
        }
      } catch (e) {
        console.warn('⚠️ /auth/dept-head/teachers/ failed:', e.message);
        setTeachers([]);
        setFilteredTeachers([]);
      }
      
      // ============ FETCH COURSES ============
      try {
        const response = await api.get('/auth/dept-head/courses/');
        console.log('✅ Courses response:', response.data);
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
        console.warn('⚠️ /auth/dept-head/courses/ failed:', e.message);
        setCourses([]);
        setFilteredCourses([]);
      }
      
      // ============ FETCH FINAL EXAMS ============
      try {
        const response = await api.get('/auth/dept-head/final-exams/');
        console.log('✅ Final exams response:', response.data);
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
        console.warn('⚠️ /auth/dept-head/final-exams/ failed:', e.message);
        setFinalExams([]);
        setFilteredFinalExams([]);
      }
      
      // ============ FETCH ENROLLMENTS ============
      try {
        const response = await api.get('/courses/enrollments/');
        console.log('✅ Enrollments response:', response.data);
        let data = response.data;
        if (data && data.results && Array.isArray(data.results)) {
          // Filter enrollments for this department
          const deptEnrollments = data.results.filter(e => 
            e.course_department === deptName || 
            e.department === deptName ||
            e.course?.department === deptName
          );
          setEnrollments(deptEnrollments);
          setStats(prev => ({
            ...prev,
            totalEnrollments: deptEnrollments.length || 0,
            activeEnrollments: deptEnrollments.filter(e => e.status === 'ACTIVE').length || 0
          }));
        }
      } catch (e) {
        console.warn('⚠️ /courses/enrollments/ failed:', e.message);
        setEnrollments([]);
      }
      
      // ============ FETCH DASHBOARD STATS ============
      try {
        const response = await api.get('/auth/dept-head/dashboard/');
        console.log('✅ Dashboard stats:', response.data);
        if (response.data) {
          if (response.data.students) {
            setStats(prev => ({
              ...prev,
              totalStudents: response.data.students.total || prev.totalStudents,
              enrolledStudents: response.data.students.enrolled || prev.enrolledStudents,
              pendingStudents: response.data.students.pending || prev.pendingStudents,
              verifiedStudents: response.data.students.verified || prev.verifiedStudents,
            }));
          }
          if (response.data.courses) {
            setStats(prev => ({
              ...prev,
              totalCourses: response.data.courses.total || prev.totalCourses,
              approvedCourses: response.data.courses.approved || prev.approvedCourses,
              pendingCourses: response.data.courses.pending || prev.pendingCourses,
            }));
          }
          if (response.data.teachers) {
            setStats(prev => ({
              ...prev,
              totalTeachers: response.data.teachers.total || prev.totalTeachers,
              verifiedTeachers: response.data.teachers.verified || prev.verifiedTeachers,
            }));
          }
          if (response.data.exams) {
            setStats(prev => ({
              ...prev,
              totalExams: response.data.exams.total || prev.totalExams,
              publishedExams: response.data.exams.published || prev.publishedExams,
            }));
          }
          if (response.data.enrollments) {
            setStats(prev => ({
              ...prev,
              totalEnrollments: response.data.enrollments.total || prev.totalEnrollments,
              activeEnrollments: response.data.enrollments.active || prev.activeEnrollments,
            }));
          }
        }
      } catch (e) {
        console.warn('⚠️ /auth/dept-head/dashboard/ failed:', e.message);
      }
      
      console.log('✅ All data loaded successfully');
      initialFetchDone.current = true;
      
    } catch (error) {
      console.error('❌ Failed to fetch department data:', error);
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
      const filtered = finalExams.filter(e =>
        (e.title?.toLowerCase() || '').includes(term) ||
        (e.course_title?.toLowerCase() || '').includes(term) ||
        (e.course_code?.toLowerCase() || '').includes(term)
      );
      setFilteredFinalExams(filtered);
    }
  };

  // ============================================================
  // GET TEACHER OPTIONS
  // ============================================================
  const getTeacherOptions = () => {
    if (teachers.length === 0) {
      return <option value="" disabled>No teachers available</option>;
    }
    return teachers.map(t => (
      <option key={t.id} value={t.id}>{t.full_name}</option>
    ));
  };

  // ============================================================
  // GET COURSE OPTIONS
  // ============================================================
  const getCourseOptions = () => {
    const approvedCourses = courses.filter(c => c.is_approved);
    if (approvedCourses.length === 0) {
      return <option value="" disabled>No approved courses available</option>;
    }
    return approvedCourses.map(c => (
      <option key={c.id} value={c.id}>{c.course_code} - {c.title}</option>
    ));
  };

  // ============================================================
  // CREATE COURSE
  // ============================================================
  const handleCreateCourse = async () => {
    setActionLoading(true);
    try {
      console.log('📚 Creating course:', courseForm);
      
      if (!courseForm.course_code || !courseForm.title) {
        toast.error('Course code and title are required');
        setActionLoading(false);
        return;
      }
      
      const instructorId = courseForm.instructor ? parseInt(courseForm.instructor) : null;
      
      const payload = {
        course_code: courseForm.course_code.toUpperCase(),
        title: courseForm.title,
        description: courseForm.description || '',
        credit_hours: parseInt(courseForm.credit_hours) || 3,
        semester: courseForm.semester || '1',
        capacity: parseInt(courseForm.capacity) || 30,
        instructor: instructorId,
        department: departmentId,
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await api.post('/courses/', payload);
      console.log('✅ Course created:', response.data);
      toast.success('Course created successfully!');
      setShowCreateCourseModal(false);
      setCourseForm({
        course_code: '',
        title: '',
        description: '',
        credit_hours: 3,
        semester: '1',
        capacity: 30,
        instructor: '',
        department: ''
      });
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to create course:', error);
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // APPROVE COURSE
  // ============================================================
  const handleApproveCourse = async (courseId, action, reason = '') => {
    setActionLoading(true);
    try {
      const response = await api.post(`/auth/dept-head/courses/${courseId}/approve/`, {
        action: action,
        reason: reason
      });
      
      toast.success(`Course ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to approve/reject course:', error);
      toast.error(error.response?.data?.error || 'Failed to process course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // DELETE COURSE
  // ============================================================
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/courses/${courseId}/`);
      toast.success('Course deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to delete course:', error);
      toast.error('Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // ASSIGN TEACHER TO COURSE
  // ============================================================
  const handleAssignTeacher = async (courseId, teacherId) => {
    if (!teacherId) {
      toast.error('Please select a teacher');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.put(`/courses/${courseId}/`, {
        instructor: parseInt(teacherId)
      });
      
      console.log('✅ Teacher assigned:', response.data);
      toast.success('Teacher assigned successfully!');
      setShowAssignTeacherModal(false);
      setAssignTeacherForm({ course_id: '', teacher_id: '' });
      setSelectedCourse(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to assign teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to assign teacher');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // CREATE FINAL EXAM
  // ============================================================
  const handleCreateExam = async () => {
    setActionLoading(true);
    try {
      console.log('📝 Creating final exam:', examForm);
      
      if (!examForm.title || !examForm.course) {
        toast.error('Title and course are required');
        setActionLoading(false);
        return;
      }
      
      const startDateTime = examForm.date ? `${examForm.date}T${examForm.start_time || '00:00'}` : null;
      const endDateTime = examForm.date ? `${examForm.date}T${examForm.end_time || '23:59'}` : null;
      
      const payload = {
        title: examForm.title,
        description: examForm.description || '',
        course: parseInt(examForm.course),
        start_time: startDateTime,
        end_time: endDateTime,
        duration_minutes: parseInt(examForm.duration_minutes) || 120,
        total_marks: parseInt(examForm.total_marks) || 100,
        passing_mark: parseInt(examForm.passing_mark) || 40,
        is_published: examForm.is_published || false,
        proctoring_enabled: examForm.proctoring_enabled !== false,
      };
      
      console.log('📤 Sending exam payload:', payload);
      
      const response = await api.post('/exams/', payload);
      console.log('✅ Final exam created:', response.data);
      toast.success('Final exam scheduled successfully!');
      setShowCreateExamModal(false);
      setExamForm({
        title: '',
        description: '',
        course: '',
        date: '',
        start_time: '',
        end_time: '',
        duration_minutes: 120,
        total_marks: 100,
        passing_mark: 40,
        is_published: true,
        proctoring_enabled: true
      });
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to create final exam:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule final exam');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // DELETE FINAL EXAM
  // ============================================================
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this final exam?')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/exams/${examId}/`);
      toast.success('Final exam deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to delete final exam:', error);
      toast.error('Failed to delete final exam');
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
      const response = await api.put(`/exams/${examId}/`, {
        start_time: startTime,
        end_time: endTime
      });
      
      toast.success('Exam schedule updated successfully!');
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to update exam:', error);
      toast.error('Failed to update exam');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // GET STATUS BADGE
  // ============================================================
  const getStatusBadge = (status, type) => {
    const styles = {
      'approved': { bg: '#dcfce7', color: '#16a34a', label: '✅ Approved' },
      'pending': { bg: '#fef3c7', color: '#d97706', label: '⏳ Pending' },
      'rejected': { bg: '#fee2e2', color: '#dc2626', label: '❌ Rejected' },
      'active': { bg: '#dcfce7', color: '#16a34a', label: '✅ Active' },
      'inactive': { bg: '#f3f4f6', color: '#6b7280', label: '⚪ Inactive' },
      'enrolled': { bg: '#dcfce7', color: '#16a34a', label: '✅ Enrolled' },
      'not_enrolled': { bg: '#fef3c7', color: '#d97706', label: '⏳ Not Enrolled' },
      'verified': { bg: '#dbeafe', color: '#2563eb', label: '✅ Verified' },
      'unverified': { bg: '#fee2e2', color: '#dc2626', label: '❌ Unverified' },
      'published': { bg: '#dcfce7', color: '#16a34a', label: '📢 Published' },
      'draft': { bg: '#fef3c7', color: '#d97706', label: '📝 Draft' },
    };
    
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        display: 'inline-flex',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        background: style.bg,
        color: style.color,
      }}>
        {style.label}
      </span>
    );
  };

  // ============================================================
  // REFRESH
  // ============================================================
  const handleRefresh = () => {
    if (!fetchInProgress.current) {
      initialFetchDone.current = false;
      fetchData();
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    navigate('/login');
    toast.success('Logged out successfully');
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
        .status-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
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
        .sidebar-item.active svg {
          color: #3b82f6;
        }
      `}</style>

      {/* ============================================================ */}
      {/* MOBILE SIDEBAR TOGGLE */}
      {/* ============================================================ */}
      <div className="sidebar-mobile" style={{
        marginBottom: '16px',
        display: 'none',
      }}>
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
            {/* Mobile nav items */}
            <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}>
              <LayoutDashboard size={20} /> Overview
            </button>
            <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}>
              <Users size={20} /> Students
            </button>
            <button className={`sidebar-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => { setActiveTab('teachers'); setMobileMenuOpen(false); }}>
              <UserCheck size={20} /> Teachers
            </button>
            <button className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}>
              <BookOpen size={20} /> Courses
            </button>
            <button className={`sidebar-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => { setActiveTab('exams'); setMobileMenuOpen(false); }}>
              <FileText size={20} /> Final Exams
            </button>
            <button className={`sidebar-item ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => { setActiveTab('enrollments'); setMobileMenuOpen(false); }}>
              <ClipboardList size={20} /> Enrollments
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================================ */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
      }}>
        {/* ============================================================ */}
        {/* SIDEBAR - DESKTOP */}
        {/* ============================================================ */}
        <div className="sidebar-desktop" style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            padding: '20px',
          }}>
            {/* Department Info */}
            <div style={{
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '20px',
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <p style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: 0,
                    fontSize: '15px',
                  }}>
                    {departmentName || 'Department'}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: '2px 0 0 0',
                  }}>
                    {user?.full_name || 'Department Head'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <LayoutDashboard size={20} /> Overview
              </button>
              <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                <Users size={20} /> Students
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalStudents}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
                <UserCheck size={20} /> Teachers
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalTeachers}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                <BookOpen size={20} /> Courses
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalCourses}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
                <FileText size={20} /> Final Exams
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalExams}</span>
              </button>
              <button className={`sidebar-item ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => setActiveTab('enrollments')}>
                <ClipboardList size={20} /> Enrollments
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{stats.totalEnrollments}</span>
              </button>
            </nav>

            {/* Logout */}
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
            }}>
              <button
                onClick={handleLogout}
                className="sidebar-item"
                style={{ color: '#dc2626' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN CONTENT */}
        {/* ============================================================ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ============ HEADER ============ */}
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
                <Building2 size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Department Dashboard
              </h1>
              <p style={{
                color: '#64748b',
                margin: '4px 0 0 0',
              }}>
                {departmentName || 'Your Department'} • Manage students, teachers, courses, and final exams
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
                transition: 'all 0.3s ease',
                opacity: (refreshing || fetchInProgress.current) ? 0.6 : 1,
              }}
            >
              <RefreshCw size={18} className={(refreshing || fetchInProgress.current) ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {/* ============ STATS CARDS ============ */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalStudents}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Students</span>
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
            }}>
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
                <BookOpen size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalCourses}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Courses</span>
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
            onClick={() => setActiveTab('courses')}>
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
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pendingCourses}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Pending Approvals</span>
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
                <UserCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.enrolledStudents}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Enrolled Students</span>
              </div>
            </div>
          </div>

          {/* ============ TABS ============ */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            {/* Tab Headers */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
            }} className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === 'overview' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <LayoutDashboard size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
                style={{
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === 'students' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'students' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Users size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Students ({stats.totalStudents})
                {stats.pendingStudents > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#f59e0b',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {stats.pendingStudents} pending
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                onClick={() => setActiveTab('teachers')}
                style={{
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === 'teachers' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'teachers' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Teachers ({stats.totalTeachers})
              </button>
              <button
                className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
                style={{
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === 'courses' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'courses' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <BookOpen size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Courses ({stats.totalCourses})
                {stats.pendingCourses > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#f59e0b',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {stats.pendingCourses} pending
                  </span>
                )}
              </button>
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
                Final Exams ({stats.totalExams})
              </button>
              <button
                className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
                onClick={() => setActiveTab('enrollments')}
                style={{
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === 'enrollments' ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'enrollments' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Enrollments ({stats.totalEnrollments})
              </button>
            </div>

            {/* ============================================================ */}
            {/* OVERVIEW TAB */}
            {/* ============================================================ */}
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

                {/* Quick Actions */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                    Quick Actions
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  }}>
                    <button
                      onClick={() => setShowCreateCourseModal(true)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}
                    >
                      <Plus size={18} /> Create Course
                    </button>
                    <button
                      onClick={() => setShowCreateExamModal(true)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px', background: '#8b5cf6' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                    >
                      <FileText size={18} /> Schedule Exam
                    </button>
                    <button
                      onClick={() => { setActiveTab('students'); }}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}
                    >
                      <Users size={18} /> View Students
                    </button>
                    <button
                      onClick={() => { setActiveTab('courses'); }}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}
                    >
                      <BookOpen size={18} /> Manage Courses
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                    Recent Activity
                  </h3>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    {courses.length === 0 && students.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>
                        No recent activity
                      </p>
                    ) : (
                      <>
                        {courses.slice(0, 3).map((course) => (
                          <div key={course.id} style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '14px',
                          }}>
                            <span>
                              <BookOpen size={14} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                              {course.title} ({course.course_code})
                            </span>
                            <span style={{ fontSize: '12px', color: course.is_approved ? '#16a34a' : '#f59e0b' }}>
                              {course.is_approved ? '✅ Approved' : '⏳ Pending'}
                            </span>
                          </div>
                        ))}
                        {students.slice(0, 3).map((student) => (
                          <div key={student.id} style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '14px',
                          }}>
                            <span>
                              <Users size={14} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                              {student.full_name}
                            </span>
                            <span style={{ fontSize: '12px', color: student.is_enrolled ? '#16a34a' : '#f59e0b' }}>
                              {student.is_enrolled ? '✅ Enrolled' : '⏳ Pending'}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STUDENTS TAB */}
            {/* ============================================================ */}
            {activeTab === 'students' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <Users size={18} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                      Students in Department
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {students.length} students • {stats.enrolledStudents} enrolled • {stats.pendingStudents} pending
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        // Export student list
                        toast.info('Export feature coming soon');
                      }}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={16} /> Export
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
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
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearch(e);
                      }}
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

                {/* Students Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
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
                          <tr key={student.id} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <div>
                                <span style={{ fontWeight: 500, color: '#0f172a', display: 'block' }}>{student.full_name}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{student.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569', fontFamily: 'monospace' }}>
                              {student.student_id || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {student.department || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {student.is_enrolled ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                                  <CheckCircle size={14} /> Enrolled
                                </span>
                              ) : student.documents_verified ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>
                                  <Clock size={14} /> Verified
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                  <Clock size={14} /> Pending
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentModal(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: '#eff6ff',
                                  color: '#3b82f6',
                                  fontSize: '13px',
                                  transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                              >
                                <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '16px',
                  borderRadius: '8px',
                }}>
                  <span>Showing {filteredStudents.length} of {students.length} students</span>
                  <span>
                    ✅ Enrolled: {stats.enrolledStudents} | ⏳ Pending: {stats.pendingStudents}
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TEACHERS TAB */}
            {/* ============================================================ */}
            {activeTab === 'teachers' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <UserCheck size={18} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                      Teachers in Department
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {teachers.length} teachers • {stats.verifiedTeachers} verified
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
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
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearch(e);
                      }}
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

                {/* Teachers Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
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
                          <tr key={teacher.id} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                              {teacher.full_name}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {teacher.email}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {teacher.department || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {teacher.is_verified ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                                  <CheckCircle size={14} /> Verified
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                  <Clock size={14} /> Pending
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <button
                                onClick={() => {
                                  setSelectedTeacher(teacher);
                                  setShowTeacherModal(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: '#eff6ff',
                                  color: '#3b82f6',
                                  fontSize: '13px',
                                  transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                              >
                                <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '16px',
                  borderRadius: '8px',
                }}>
                  <span>Showing {filteredTeachers.length} of {teachers.length} teachers</span>
                  <span>✅ Verified: {stats.verifiedTeachers}</span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* COURSES TAB */}
            {/* ============================================================ */}
            {activeTab === 'courses' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <BookOpen size={18} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                      Department Courses
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {courses.length} courses • {stats.approvedCourses} approved • {stats.pendingCourses} pending
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateCourseModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Create Course
                  </button>
                </div>

                {/* Search */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
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
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearch(e);
                      }}
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

                {/* Courses Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
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
                          <tr key={course.id} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                              {course.course_code}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>
                              {course.title}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {course.instructor_name || 'Not Assigned'}
                              {!course.instructor_name && (
                                <button
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setAssignTeacherForm({ course_id: course.id, teacher_id: '' });
                                    setShowAssignTeacherModal(true);
                                  }}
                                  style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#dbeafe',
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                  }}
                                >
                                  Assign
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {course.enrolled_count || 0}/{course.capacity}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {course.is_approved ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                                  <CheckCircle size={14} /> Approved
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                  <Clock size={14} /> Pending
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setShowCourseModal(true);
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: '#eff6ff',
                                    color: '#3b82f6',
                                    fontSize: '12px',
                                    transition: 'all 0.3s ease',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                                >
                                  <Eye size={14} /> View
                                </button>
                                {!course.is_approved && (
                                  <>
                                    <button
                                      onClick={() => handleApproveCourse(course.id, 'approve')}
                                      disabled={actionLoading}
                                      className="btn-success"
                                      style={{ padding: '6px 10px', fontSize: '12px' }}
                                    >
                                      <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt('Enter rejection reason:');
                                        if (reason) handleApproveCourse(course.id, 'reject', reason);
                                      }}
                                      disabled={actionLoading}
                                      className="btn-danger"
                                      style={{ padding: '6px 10px', fontSize: '12px' }}
                                    >
                                      <XCircle size={14} /> Reject
                                    </button>
                                  </>
                                )}
                                {course.is_approved && (
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    disabled={actionLoading}
                                    className="btn-danger"
                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '16px',
                  borderRadius: '8px',
                }}>
                  <span>Showing {filteredCourses.length} of {courses.length} courses</span>
                  <span>✅ Approved: {stats.approvedCourses} | ⏳ Pending: {stats.pendingCourses}</span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINAL EXAMS TAB */}
            {/* ============================================================ */}
            {activeTab === 'exams' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      <FileText size={18} style={{ display: 'inline', marginRight: '8px', color: '#ec4899' }} />
                      Final Exams
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {finalExams.length} exams • {stats.publishedExams} published
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateExamModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#8b5cf6' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                  >
                    <Plus size={16} /> Schedule Exam
                  </button>
                </div>

                {/* Exams Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
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
                            <p>No final exams scheduled</p>
                          </td>
                        </tr>
                      ) : (
                        filteredFinalExams.map((exam) => (
                          <tr key={exam.id} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                              {exam.title}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {exam.course_title}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {exam.start_time ? new Date(exam.start_time).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {exam.duration_minutes} min
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {exam.is_published ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                                  <CheckCircle size={14} /> Published
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                  <Clock size={14} /> Draft
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setShowExamModal(true);
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: '#eff6ff',
                                    color: '#3b82f6',
                                    fontSize: '12px',
                                    transition: 'all 0.3s ease',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                                >
                                  <Eye size={14} /> View
                                </button>
                                <button
                                  onClick={() => {
                                    const newStart = prompt('Enter new start time (YYYY-MM-DD HH:MM):', exam.start_time);
                                    const newEnd = prompt('Enter new end time (YYYY-MM-DD HH:MM):', exam.end_time);
                                    if (newStart && newEnd) {
                                      handleUpdateExam(exam.id, newStart, newEnd);
                                    }
                                  }}
                                  disabled={actionLoading}
                                  style={{
                                    padding: '6px 10px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    background: '#dbeafe',
                                    color: '#2563eb',
                                    fontSize: '12px',
                                    transition: 'all 0.3s ease',
                                    opacity: actionLoading ? 0.6 : 1,
                                  }}
                                >
                                  <Edit2 size={14} /> Schedule
                                </button>
                                <button
                                  onClick={() => handleDeleteExam(exam.id)}
                                  disabled={actionLoading}
                                  className="btn-danger"
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '16px',
                  borderRadius: '8px',
                }}>
                  <span>Showing {filteredFinalExams.length} of {finalExams.length} exams</span>
                  <span>📢 Published: {stats.publishedExams}</span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* ENROLLMENTS TAB */}
            {/* ============================================================ */}
            {activeTab === 'enrollments' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
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
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
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
                          <tr key={enrollment.id} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                              {enrollment.student_name || 'Unknown'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                              {enrollment.course_title || enrollment.course?.title || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {enrollment.status === 'ACTIVE' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                                  <CheckCircle size={14} /> Active
                                </span>
                              ) : enrollment.status === 'COMPLETED' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>
                                  <Award size={14} /> Completed
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                  <Clock size={14} /> {enrollment.status || 'Pending'}
                                </span>
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
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '16px',
                  borderRadius: '8px',
                }}>
                  <span>Showing {enrollments.length} enrollments</span>
                  <span>✅ Active: {stats.activeEnrollments}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CREATE COURSE MODAL */}
      {/* ============================================================ */}
      {showCreateCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCreateCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Plus size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Create New Course
              </h2>
              <button
                onClick={() => setShowCreateCourseModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateCourse(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS101"
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows="3"
                  placeholder="Course description..."
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Credit Hours
                  </label>
                  <input
                    type="number"
                    value={courseForm.credit_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, credit_hours: parseInt(e.target.value) || 3 })}
                    min="1"
                    max="6"
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
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Semester
                  </label>
                  <select
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Summer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={courseForm.capacity}
                    onChange={(e) => setCourseForm({ ...courseForm, capacity: parseInt(e.target.value) || 30 })}
                    min="1"
                    max="200"
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
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Instructor *
                  </label>
                  <select
                    required
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                    <option value="">Select Instructor</option>
                    {teachers.length > 0 ? (
                      teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No teachers available</option>
                    )}
                  </select>
                  {teachers.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                      No teachers available in your department. Please add teachers first.
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || teachers.length === 0}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE EXAM MODAL */}
      {/* ============================================================ */}
      {showCreateExamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                Schedule Final Exam
              </h2>
              <button
                onClick={() => setShowCreateExamModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateExam(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="e.g., Final Exam - CS101"
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Course *
                </label>
                <select
                  required
                  value={examForm.course}
                  onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                  <option value="">Select Course</option>
                  {getCourseOptions()}
                </select>
                {courses.filter(c => c.is_approved).length === 0 && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    No approved courses available. Please approve a course first.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Exam Date *
                </label>
                <input
                  type="date"
                  required
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={examForm.start_time}
                    onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
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
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={examForm.end_time}
                    onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
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
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) || 120 })}
                    min="15"
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
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={examForm.total_marks}
                    onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 100 })}
                    min="1"
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
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Passing Mark
                  </label>
                  <input
                    type="number"
                    value={examForm.passing_mark}
                    onChange={(e) => setExamForm({ ...examForm, passing_mark: parseInt(e.target.value) || 40 })}
                    min="1"
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
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={examForm.is_published}
                      onChange={(e) => setExamForm({ ...examForm, is_published: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Publish immediately
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={examForm.proctoring_enabled}
                      onChange={(e) => setExamForm({ ...examForm, proctoring_enabled: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Enable Proctoring
                  </label>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || courses.filter(c => c.is_approved).length === 0}
                  className="btn-primary"
                  style={{ flex: 1, background: '#8b5cf6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                >
                  {actionLoading ? 'Scheduling...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ASSIGN TEACHER MODAL */}
      {/* ============================================================ */}
      {showAssignTeacherModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowAssignTeacherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <UserCog size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Assign Teacher to Course
              </h2>
              <button
                onClick={() => setShowAssignTeacherModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <p style={{ margin: 0 }}>
                <strong>Course:</strong> {selectedCourse.course_code} - {selectedCourse.title}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                <strong>Department:</strong> {departmentName}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAssignTeacher(selectedCourse.id, assignTeacherForm.teacher_id);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Select Teacher *
                </label>
                <select
                  required
                  value={assignTeacherForm.teacher_id}
                  onChange={(e) => setAssignTeacherForm({ ...assignTeacherForm, teacher_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                  <option value="">Select a teacher</option>
                  {getTeacherOptions()}
                </select>
                {teachers.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    No teachers found in your department. Please add teachers first.
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowAssignTeacherModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || teachers.length === 0}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Assigning...' : 'Assign Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW STUDENT MODAL */}
      {/* ============================================================ */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Users size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Student Details
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
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
                <p style={{ fontWeight: 500, margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedStudent.student_id || 'Not Generated'}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedStudent.department || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedStudent.is_enrolled ? (
                    <span style={{ color: '#16a34a' }}>✅ Enrolled</span>
                  ) : selectedStudent.documents_verified ? (
                    <span style={{ color: '#2563eb' }}>⏳ Documents Verified</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>⏳ Pending</span>
                  )}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Payment Status</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedStudent.payment_status === 'VERIFIED' ? (
                    <span style={{ color: '#16a34a' }}>✅ Verified</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>⏳ Pending</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStudentModal(false)}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW TEACHER MODAL */}
      {/* ============================================================ */}
      {showTeacherModal && selectedTeacher && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <UserCheck size={24} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                Teacher Details
              </h2>
              <button
                onClick={() => setShowTeacherModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
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
                <p style={{ fontWeight: 500, margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedTeacher.employee_id || 'Not Generated'}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Department</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedTeacher.department || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedTeacher.is_verified ? (
                    <span style={{ color: '#16a34a' }}>✅ Verified</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>⏳ Pending</span>
                  )}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Specialization</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedTeacher.specialization || '—'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTeacherModal(false)}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW COURSE MODAL */}
      {/* ============================================================ */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <BookOpen size={24} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Course Details
              </h2>
              <button
                onClick={() => setShowCourseModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
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
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedCourse.instructor_name || 'Not Assigned'}
                </p>
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
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedCourse.enrolled_count || 0} / {selectedCourse.capacity}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Semester</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>Semester {selectedCourse.semester}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  {selectedCourse.is_approved ? (
                    <span style={{ color: '#16a34a' }}>✅ Approved</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>⏳ Pending</span>
                  )}
                </p>
              </div>
            </div>

            {selectedCourse.description && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Description</span>
                <p style={{ margin: '4px 0 0 0', background: 'white', padding: '12px', borderRadius: '6px' }}>
                  {selectedCourse.description}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowCourseModal(false)}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW EXAM MODAL */}
      {/* ============================================================ */}
      {showExamModal && selectedExam && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: '#ec4899' }} />
                Exam Details
              </h2>
              <button
                onClick={() => setShowExamModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
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
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedExam.start_time ? new Date(selectedExam.start_time).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Time</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {selectedExam.start_time ? new Date(selectedExam.start_time).toLocaleTimeString() : '—'} -
                  {selectedExam.end_time ? new Date(selectedExam.end_time).toLocaleTimeString() : '—'}
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
                  {selectedExam.is_published ? (
                    <span style={{ color: '#16a34a' }}>📢 Published</span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>📝 Draft</span>
                  )}
                </p>
              </div>
            </div>

            {selectedExam.description && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Description</span>
                <p style={{ margin: '4px 0 0 0', background: 'white', padding: '12px', borderRadius: '6px' }}>
                  {selectedExam.description}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowExamModal(false)}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptDashboard;