// frontend/src/pages/Student/Dashboard.jsx
// COMPLETE - ALL EXISTING CODE PRESERVED + LAYOUT/RESPONSIVENESS FIXES ONLY

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, Award, Clock, CheckCircle, 
  RefreshCw, Video, Bell, Upload, X, User,
  CreditCard, AlertCircle, LogOut, Send, Eye, Lock,
  ClipboardList, BarChart3, Home, GraduationCap,Languages, Globe, Sparkles, Map, Trophy, 
  FileCheck, TrendingUp, MessageSquare, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchExams } from '../../store/slices/examSlice';
import api from '../../api/api';
import '../../styles/dashboard-responsive.css';
import PaymentStatusBanner from '../../components/PaymentStatusBanner';
import GradeBadge from '../../components/Grade/GradeBadge';
import AIInsights from '../../components/AI/AIInsights'
import LanguageSelector from '../../components/i18n/LanguageSelector';

// ============================================================
// SIDEBAR NAVIGATION COMPONENT (UNTOUCHED)
// ============================================================
const StudentSidebar = ({ activeTab, onTabChange, user, unreadCount }) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'grades', label: 'My Grades', icon: Award },
    { id: 'results', label: 'Exam Results', icon: BarChart3 },
    { id: 'assignment-results', label: 'Assignment Results', icon: ClipboardList },
    { id: 'live-classes', label: 'Live Classes', icon: Video },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div style={{
      width: '280px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      padding: '20px',
      height: 'fit-content',
      position: 'sticky',
      top: '24px',
    }}>
      {/* User Info */}
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
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '20px',
          }}>
            {user?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <p style={{
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
              fontSize: '15px',
            }}>
              {user?.full_name || 'Student'}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '2px 0 0 0',
            }}>
              {user?.email || ''}
            </p>
            {user?.student_profile?.cgpa !== undefined && (
              <p style={{
                fontSize: '11px',
                color: '#8b5cf6',
                margin: '2px 0 0 0',
                fontWeight: 600,
              }}>
                CGPA: {user.student_profile.cgpa || '0.00'}
              </p>
            )}
          </div>
        </div>
        <div style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#16a34a',
          background: '#dcfce7',
          padding: '4px 12px',
          borderRadius: '20px',
          width: 'fit-content',
        }}>
          <CheckCircle size={14} />
          <span>Student</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                width: '100%',
                border: 'none',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <Icon size={20} />
              {item.label}
              {item.id === 'grades' && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '10px',
                  background: '#8b5cf6',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}>
                  View
                </span>
              )}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}>
                  {unreadCount}
                </span>
              )}
              {item.id === 'assignment-results' && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '10px',
                  color: '#8b5cf6',
                  background: '#ede9fe',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}>
                  New
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: '#dc2626',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD COMPONENT - LAYOUT FIXED, LOGIC PRESERVED
// ============================================================
const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const { courses = [], isLoading: coursesLoading = false } = useSelector((state) => state.courses || { courses: [] });
  const { exams = [], isLoading: examsLoading = false } = useSelector((state) => state.exams || { exams: [] });
  
  // ============ STATE ============
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ============================================================
  // ✅ ADDED: Course Grades State
  // ============================================================
  const [courseGrades, setCourseGrades] = useState([]);
  const [gradeSummary, setGradeSummary] = useState(null);
  
  // ============ ACCESS LOCK STATE ============
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [lockStatus, setLockStatus] = useState('');
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [amountDue, setAmountDue] = useState(0);
  
  const [documents, setDocuments] = useState({
    grade_8_certificate: null,
    grade_12_certificate: null,
    transcript: null,
    other_documents: null
  });

  // ============ FETCH STUDENT PROFILE ============
  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const response = await api.get('/auth/profile/student/');
      setProfile(response.data);
      console.log('👤 Student Profile:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ============================================================
  // ✅ ADDED: Fetch Course Grades
  // ============================================================
  const fetchCourseGrades = useCallback(async () => {
    try {
      const response = await api.get('/courses/my-grades/');
      console.log('📊 Course Grades:', response.data);
      setGradeSummary(response.data);
      setCourseGrades(response.data.courses || []);
      return response.data;
    } catch (error) {
      console.error('Error fetching grades:', error);
      return null;
    }
  }, []);

  // ============ FETCH NOTIFICATIONS ============
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      console.log('🔔 Notifications:', response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // ============ CHECK ACCESS LOCK ============
const checkAccessLock = useCallback(async () => {
  try {
    const response = await api.get('/analytics/check-access/?service_type=COURSE_ENROLLMENT');
    console.log('✅ Access check response:', response.data);
    
    if (response.data && response.data.has_access === true) {
      setIsLocked(false);
      setLockMessage('');
      return true;
    }
    
    if (response.data && response.data.has_access === false) {
      if (response.data.status === 'REGISTRATION_FLOW') {
        setIsLocked(false);
        return true;
      }
      
      setIsLocked(true);
      setLockMessage(response.data.message || 'Account locked. Please make payment.');
      setLockStatus(response.data.status || 'LOCKED');
      setDaysOverdue(response.data.days_overdue || 0);
      setAmountDue(response.data.amount_due || 0);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Access check failed:', error);
    
    if (error.response && error.response.status === 403) {
      const data = error.response.data;
      
      if (data && (data.status === 'REGISTRATION_FLOW' || data.is_locked === false)) {
        setIsLocked(false);
        return true;
      }
      
      setIsLocked(true);
      setLockMessage(data.message || 'Account locked. Please make payment.');
      setLockStatus(data.status || 'LOCKED');
      setDaysOverdue(data.days_overdue || 0);
      setAmountDue(data.amount_due || 0);
      return false;
    }
    
    setIsLocked(false);
    return true;
  }
}, []);

  // ============ LOAD DASHBOARD DATA ============
const loadDashboardData = async () => {
  setRefreshing(true);
  try {
    console.log('🔄 Loading dashboard data...');
    
    const hasAccess = await checkAccessLock();
    
    if (!hasAccess) {
      toast.error(`🔒 ${lockMessage}`);
      setRefreshing(false);
      return;
    }
    
    const coursesResult = await dispatch(fetchCourses()).unwrap();
    console.log('📚 Dashboard - Courses:', coursesResult);
    
    const examsResult = await dispatch(fetchExams()).unwrap();
    console.log('📝 Dashboard - Exams:', examsResult);
    
    await fetchStudentProfile();
    await fetchCourseGrades();
    await fetchNotifications();
    
    toast.success('Dashboard refreshed');
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    toast.error('Failed to load dashboard data');
  } finally {
    setRefreshing(false);
  }
};
      
  // ============ INITIAL LOAD ============
  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============ HANDLE TAB CHANGE ============
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const routes = {
      'dashboard': '/dashboard',
      'courses': '/courses',
      'exams': '/exams',
      'grades': '/grades',
      'results': '/results',
      'assignment-results': '/assignment-results',
      'live-classes': '/live-classes',
      'payments': '/payments',
      'profile': '/profile',
    };
    navigate(routes[tabId] || '/dashboard');
  };

  // ============ MARK NOTIFICATION AS READ ============
  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // ============ HANDLE DOCUMENT UPLOAD ============
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const uploadDocuments = async () => {
    const hasFiles = Object.values(documents).some(f => f !== null);
    if (!hasFiles) {
      toast.error('Please select at least one document to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      const response = await api.post('/auth/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('✅ Documents uploaded successfully!');
      setShowUploadModal(false);
      setDocuments({
        grade_8_certificate: null,
        grade_12_certificate: null,
        transcript: null,
        other_documents: null
      });
      
      await fetchStudentProfile();
      await fetchNotifications();
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const isPaymentVerified = profile?.payment_status === 'VERIFIED';
  const isActivated = profile?.is_enrolled === true;

  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeExams = Array.isArray(exams) ? exams : [];
  
  const enrolledCourses = safeCourses.filter((c) => c && c.is_enrolled) || [];
  const upcomingExams = safeExams.filter((e) => e && new Date(e.start_time) > new Date()) || [];
  const completedExams = safeExams.filter((e) => e && new Date(e.end_time) < new Date()) || [];

  const isLoading = coursesLoading || examsLoading || loadingProfile;

  const stats = [
    { name: 'Enrolled Courses', value: enrolledCourses.length, icon: BookOpen, color: '#3b82f6' },
    { name: 'Upcoming Exams', value: upcomingExams.length, icon: Clock, color: '#f59e0b' },
    { name: 'Completed Exams', value: completedExams.length, icon: CheckCircle, color: '#22c55e' },
    { name: 'CGPA', value: profile?.cgpa || '0.00', icon: Award, color: '#8b5cf6' },
  ];

  // ✅ FIXED: Only filter for classes that are actually LIVE, not just active courses
  const activeLiveClasses = enrolledCourses.filter(c => c && c.is_live === true) || [];

  const handleJoinLiveClass = (courseId) => {
    console.log('🔴 Joining live class from dashboard:', courseId);
    window.location.href = `/live-class/${courseId}`;
  };

  // ============ RENDER LOCK BANNER ============
const renderLockBanner = () => {
  if (!isLocked) return null;
  
  if (profile && !profile.is_enrolled) {
    return null;
  }
  
  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '12px',
      marginBottom: '16px',
      background: '#fef2f2',
      border: '2px solid #fecaca',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px',
      }}>
        <Lock size={20} color="#dc2626" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: '#dc2626', margin: 0, fontSize: '16px' }}>
          🔒 Account Locked
        </p>
        <p style={{ fontSize: '14px', color: '#991b1b', margin: '4px 0 0 0' }}>
          {lockMessage}
        </p>
        {daysOverdue > 0 && (
          <p style={{ fontSize: '14px', color: '#991b1b', margin: '4px 0 0 0', fontWeight: 500 }}>
            ⏰ {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue • Amount Due: ETB {amountDue.toFixed(2)}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <Link
            to="/payments"
            style={{
              padding: '6px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CreditCard size={16} />
            Make Payment Now
          </Link>
          <button
            onClick={async () => {
              const hasAccess = await checkAccessLock();
              if (hasAccess) {
                toast.success('✅ Access restored!');
                loadDashboardData();
              } else {
                toast.error('Still locked. Please make payment.');
              }
            }}
            style={{
              padding: '6px 16px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
};
  // ============ MAIN RENDER ============
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start',
    }}>
      
      <style>{`
        .dashboard-wrapper {
          display: flex !important;
          flex-direction: row !important;
          gap: 24px !important;
          align-items: flex-start !important;
          width: 100% !important;
          max-width: 1400px !important;
          margin: 0 auto !important;
          padding: 24px !important;
          box-sizing: border-box !important;
        }
        .sidebar-container {
          width: 280px !important;
          flex: 0 0 280px !important;
          position: sticky !important;
          top: 24px !important;
          align-self: flex-start !important;
        }
        .main-content-container {
          flex: 1 !important;
          min-width: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .dashboard-header-wrapper {
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .dashboard-header-inner {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .dashboard-header-actions {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
        }
        .stats-grid-wrapper {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 16px !important;
          margin-bottom: 24px !important;
          width: 100% !important;
        }
        .notification-panel-fix {
          position: absolute !important;
          top: 100% !important;
          right: 0 !important;
          width: 380px !important;
          max-height: 500px !important;
          overflow-y: auto !important;
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
          padding: 16px !important;
          z-index: 1000 !important;
        }
        @media (max-width: 1024px) {
          .dashboard-wrapper {
            flex-direction: column !important;
          }
          .sidebar-container {
            width: 100% !important;
            flex: none !important;
            position: relative !important;
            top: 0 !important;
            margin-bottom: 24px !important;
          }
          .stats-grid-wrapper {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .notification-panel-fix {
            width: 95vw !important;
            right: 2.5vw !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-wrapper {
            padding: 12px !important;
          }
          .stats-grid-wrapper {
            grid-template-columns: 1fr !important;
          }
          .dashboard-header-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .dashboard-header-actions {
            width: 100% !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>

      <div className="dashboard-wrapper">
        
        <div className="sidebar-container">
          <StudentSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            user={user}
            unreadCount={unreadCount}
          />
        </div>

        <div className="main-content-container">
          
          {/* ============ HEADER WITH NOTIFICATIONS ============ */}
          <div className="dashboard-header-wrapper" style={{
            marginBottom: '16px',
            padding: '16px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div className="dashboard-header-inner">
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Welcome back, {user?.full_name || 'Student'}!
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {isActivated ? '✅ Account Activated - Full Access' :
                   isPaymentVerified ? '📄 Payment Verified - Upload Documents' :
                   '⏳ Payment Pending - Please Make Payment'}
                  {profile?.cgpa > 0 && ` • CGPA: ${profile.cgpa}`}
                </p>
              </div>

              <div className="dashboard-header-actions">
                {/* Notification Bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Bell size={24} color="#475569" />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotificationPanel && (
                    <div className="notification-panel-fix">
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '12px',
                      }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                          Notifications
                          {unreadCount > 0 && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              background: '#2563eb',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                            }}>
                              {unreadCount} new
                            </span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: '13px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '32px 0',
                          color: '#94a3b8',
                        }}>
                          <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <p style={{ margin: 0 }}>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="notification-item"
                            onClick={() => markAsRead(notif.id)}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: notif.is_read ? 'white' : '#eff6ff',
                              border: notif.is_read ? '1px solid transparent' : '1px solid #dbeafe',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = notif.is_read ? '#f8fafc' : '#dbeafe'}
                            onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? 'white' : '#eff6ff'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div>
                                <p style={{
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  color: '#0f172a',
                                  margin: '0 0 4px 0',
                                }}>
                                  {notif.title}
                                </p>
                                <p style={{
                                  fontSize: '13px',
                                  color: '#475569',
                                  margin: 0,
                                  lineHeight: 1.5,
                                }}>
                                  {notif.message}
                                </p>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#94a3b8',
                                  marginTop: '4px',
                                }}>
                                  {new Date(notif.created_at).toLocaleString()}
                                </p>
                              </div>
                              {!notif.is_read && (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#2563eb',
                                  flexShrink: 0,
                                  marginTop: '4px',
                                }} />
                              )}
                            </div>
                            {notif.link && (
                              <div style={{ marginTop: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(notif.link);
                                    setShowNotificationPanel(false);
                                  }}
                                  style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                  }}
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={loadDashboardData} 
                  className="btn-refresh"
                  disabled={refreshing || isLoading}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  <RefreshCw size={18} className={refreshing || isLoading ? 'spinning' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ============ LOCK BANNER ============ */}
          {renderLockBanner()}

          {/* ============ STATUS BANNER ============ */}
          {!isLocked && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              background: isActivated ? '#dcfce7' :
                         isPaymentVerified ? '#fef3c7' : '#f3f4f6',
              border: isActivated ? '1px solid #bbf7d0' :
                     isPaymentVerified ? '1px solid #fde68a' : '1px solid #e5e7eb',
            }}>
              {isActivated ? (
                <>
                  <CheckCircle size={24} color="#16a34a" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#16a34a', margin: 0 }}>
                      ✅ Account Activated
                    </p>
                    <p style={{ fontSize: '14px', color: '#166534', margin: '4px 0 0 0' }}>
                      You have full access to all services: enroll in courses, take exams, attend live classes, and more.
                    </p>
                  </div>
                </>
              ) : isPaymentVerified ? (
                <>
                  <Upload size={24} color="#f59e0b" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#d97706', margin: 0 }}>
                      📄 Payment Verified - Upload Documents
                    </p>
                    <p style={{ fontSize: '14px', color: '#92400e', margin: '4px 0 0 0' }}>
                      Your payment has been verified. Please upload your documents to activate your account.
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      style={{
                        marginTop: '8px',
                        padding: '8px 20px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Upload size={16} />
                      Upload Documents Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Clock size={24} color="#64748b" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#475569', margin: 0 }}>
                      ⏳ Payment Pending
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Please make your payment and upload the receipt for verification.
                    </p>
                    <Link to="/payments" style={{
                      marginTop: '8px',
                      display: 'inline-block',
                      padding: '8px 20px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}>
                      Go to Payments
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============ STATS GRID ============ */}
          <div className="stats-grid-wrapper">
            {stats.map((stat, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <stat.icon size={24} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: '#64748b',
                      fontSize: '14px',
                      margin: 0,
                    }}>{stat.name}</p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '4px 0 0 0',
                    }}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ============================================================ */}
          {/* ✅ ADDED / FIXED: COURSE GRADES SECTION */}
          {/* ============================================================ */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Award size={20} color="#8b5cf6" />
                My Course Grades
                {gradeSummary?.cgpa > 0 && (
                  <span style={{
                    fontSize: '12px',
                    background: '#8b5cf6',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    marginLeft: '8px',
                  }}>
                    CGPA: {gradeSummary.cgpa}
                  </span>
                )}
              </h2>
              <Link
                to="/grades"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                View All →
              </Link>
            </div>

            {isLoading || refreshing ? (
              <div className="loading-spinner" />
            ) : courseGrades.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                color: '#64748b',
              }}>
                <Award size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p>No grades available yet. Complete your courses to see your grades.</p>
                <Link
                  to="/courses"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}>
                {courseGrades.slice(0, 4).map((course) => (
                  <Link
                    key={course.course_id}
                    to={`/courses/${course.course_id}`}
                    style={{
                      textDecoration: 'none',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      transition: 'all 0.3s ease',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#8b5cf6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: 500,
                        }}>
                          {course.course_code}
                        </div>
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#0f172a',
                          margin: '4px 0 0 0',
                        }}>
                          {course.course_title}
                        </h4>
                      </div>
                      <GradeBadge 
                        grade={course.grade_letter} 
                        percentage={course.percentage}
                        size="sm"
                      />
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px',
                      }}>
                        <span>Progress</span>
                        <span>{course.percentage.toFixed(1)}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min(course.percentage, 100)}%`,
                          height: '100%',
                          background: course.percentage >= 70 ? '#22c55e' :
                                    course.percentage >= 50 ? '#f59e0b' : '#dc2626',
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '8px',
                    }}>
                      <span>Marks: {course.total_marks_obtained.toFixed(1)} / {course.total_marks_possible.toFixed(1)}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 500,
                        background: course.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                        color: course.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                      }}>
                        {course.status || 'ACTIVE'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {courseGrades.length > 4 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Link
                  to="/grades"
                  style={{
                    color: '#8b5cf6',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  View all {courseGrades.length} courses →
                </Link>
              </div>
            )}
          </div>

          {/* ==================== LIVE CLASSES SECTION ==================== */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Video size={20} color="#dc2626" />
                Live Classes
                {activeLiveClasses.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    background: '#dc2626',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    marginLeft: '8px',
                  }}>
                    {activeLiveClasses.length} LIVE
                  </span>
                )}
              </h2>
              <Link
                to="/live-classes"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                View All →
              </Link>
            </div>

            {isLoading || refreshing ? (
              <div className="loading-spinner" />
            ) : activeLiveClasses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#64748b',
              }}>
                <Video size={48} style={{
                  opacity: 0.5,
                  marginBottom: '12px',
                }} />
                <p>No active live classes right now.</p>
                <Link
                  to="/courses"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  Browse Courses to Enroll
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}>
                {activeLiveClasses.slice(0, 3).map((course) => (
                  <div key={course.id} className="live-class-item" style={{
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    padding: '16px',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div className="live-badge" style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span className="live-dot" style={{
                        width: '6px',
                        height: '6px',
                        background: 'white',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite',
                      }} />
                      LIVE
                    </div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                    }}>{course.title}</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '0 0 4px 0',
                    }}>{course.course_code}</p>
                    <p style={{
                      fontSize: '13px',
                      color: '#475569',
                      margin: '0 0 12px 0',
                    }}>
                      Instructor: {course.instructor_name || 'Unknown'}
                    </p>
                    <button
                      onClick={() => handleJoinLiveClass(course.id)}
                      className="join-live-btn"
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '8px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                    >
                      <Video size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Join Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==================== MY COURSES SECTION ==================== */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}>My Courses</h2>
              <Link
                to="/courses"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                View All →
              </Link>
            </div>

            {isLoading || refreshing ? (
              <div className="loading-spinner" />
            ) : enrolledCourses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#64748b',
              }}>
                <BookOpen size={48} style={{
                  opacity: 0.5,
                  marginBottom: '12px',
                }} />
                <p>You haven't enrolled in any courses yet.</p>
                <Link
                  to="/courses"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}>
                {enrolledCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    style={{
                      textDecoration: 'none',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      transition: 'all 0.3s ease',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                    }}>{course.title}</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '0 0 4px 0',
                    }}>{course.course_code}</p>
                    <p style={{
                      fontSize: '13px',
                      color: '#475569',
                      margin: '0 0 8px 0',
                    }}>
                      Instructor: {course.instructor_name}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#22c55e',
                      fontSize: '14px',
                    }}>
                      <CheckCircle size={16} />
                      <span>In Progress</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ==================== UPCOMING EXAMS SECTION ==================== */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}>Upcoming Exams</h2>
              <Link
                to="/exams"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                View All →
              </Link>
            </div>

            {isLoading || refreshing ? (
              <div className="loading-spinner" />
            ) : upcomingExams.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#64748b',
              }}>
                <FileText size={48} style={{
                  opacity: 0.5,
                  marginBottom: '12px',
                }} />
                <p>No upcoming exams scheduled.</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {upcomingExams.slice(0, 3).map((exam) => (
                  <div key={exam.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: '0 0 4px 0',
                      }}>{exam.title}</h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '0',
                      }}>{exam.course_title}</p>
                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        margin: '4px 0 0 0',
                      }}>
                        Date: {new Date(exam.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/exams/${exam.id}/take`}
                      style={{
                        padding: '8px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============ UPLOAD DOCUMENTS MODAL ============ */}
          {showUploadModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }} onClick={() => setShowUploadModal(false)}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                    <Upload size={24} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                    Upload Documents
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
                  >×</button>
                </div>

                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  Please upload the following documents for verification. 
                  Your account will be activated after verification by the Registrar.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Grade 8 Certificate */}
                  <div style={{
                    padding: '16px',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                      📄 Grade 8 Certificate
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                      {documents.grade_8_certificate ? (
                        <span style={{ color: '#16a34a' }}>✅ {documents.grade_8_certificate.name}</span>
                      ) : (
                        'Click to upload'
                      )}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                      onChange={(e) => handleFileChange(e, 'grade_8_certificate')}
                    />
                  </div>

                  {/* Grade 12 Certificate */}
                  <div style={{
                    padding: '16px',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                      📄 Grade 12 Certificate
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                      {documents.grade_12_certificate ? (
                        <span style={{ color: '#16a34a' }}>✅ {documents.grade_12_certificate.name}</span>
                      ) : (
                        'Click to upload'
                      )}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                      onChange={(e) => handleFileChange(e, 'grade_12_certificate')}
                    />
                  </div>

                  {/* Transcript */}
                  <div style={{
                    padding: '16px',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                      📄 Transcript
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                      {documents.transcript ? (
                        <span style={{ color: '#16a34a' }}>✅ {documents.transcript.name}</span>
                      ) : (
                        'Click to upload'
                      )}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                      onChange={(e) => handleFileChange(e, 'transcript')}
                    />
                  </div>

                  {/* Other Documents */}
                  <div style={{
                    padding: '16px',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                      📄 Other Documents
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                      {documents.other_documents ? (
                        <span style={{ color: '#16a34a' }}>✅ {documents.other_documents.name}</span>
                      ) : (
                        'Click to upload (optional)'
                      )}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                      onChange={(e) => handleFileChange(e, 'other_documents')}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '24px',
                }}>
                  <button
                    onClick={() => setShowUploadModal(false)}
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
                    onClick={uploadDocuments}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      background: '#2563eb',
                      color: 'white',
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;