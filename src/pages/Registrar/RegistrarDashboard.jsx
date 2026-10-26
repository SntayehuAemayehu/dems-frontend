// frontend/src/pages/Registrar/RegistrarDashboard.jsx
// COMPLETE FIXED - Full workflow: Notify → Upload → Verify → Activate
// WITH DOCUMENT VIEWER AND DOWNLOAD FUNCTIONALITY
// WITH BATCH PROCESSING

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, CheckCircle, XCircle, Clock,
  Search, Filter, RefreshCw, Download,
  CreditCard, FileText, Bell, Upload, Eye,
  Send, Check, X, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import BatchProcessor from '../../components/BatchProcessor/BatchProcessor';

// ✅ Import the document viewer component from the SAME folder
import RegistrarDocumentViewer from './RegistrarDocumentViewer';

// ============================================================
// MAIN REGISTRAR DASHBOARD
// ============================================================

const RegistrarDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // ============ STATE ============
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUsingSampleData, setIsUsingSampleData] = useState(false);
  const [dataSource, setDataSource] = useState('none');
  
  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    active: 0,
    documents_submitted: 0,
    ready_for_activation: 0,
    pending_upload: 0,
    notification_sent: 0
  });

  // ============ FETCH STUDENTS ============
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setIsUsingSampleData(false);
      
      console.log('🔄 ========================================');
      console.log('🔄 REGISTRAR: FETCHING STUDENTS');
      console.log('🔄 ========================================');
      console.log('👤 User:', user?.email);
      console.log('👤 Role:', user?.role);
      
      let studentsData = [];
      let source = 'none';
      
      // ============================================================
      // ATTEMPT 1: /auth/registrar/students/
      // ============================================================
      try {
        console.log('📡 Trying /auth/registrar/students/...');
        const response = await api.get('/auth/registrar/students/');
        console.log('✅ Response:', response.data);
        
        if (response.data && response.data.results) {
          studentsData = response.data.results;
          source = 'registrar';
        } else if (Array.isArray(response.data)) {
          studentsData = response.data;
          source = 'registrar';
        }
        console.log(`📊 Got ${studentsData.length} students from /auth/registrar/students/`);
      } catch (e) {
        console.log('❌ /auth/registrar/students/ failed:', e.message);
      }
      
      // ============================================================
      // ATTEMPT 2: /auth/users/?role=STUDENT
      // ============================================================
      if (studentsData.length === 0) {
        try {
          console.log('📡 Trying /auth/users/?role=STUDENT...');
          const response = await api.get('/auth/users/?role=STUDENT');
          console.log('✅ Response:', response.data);
          
          if (response.data && response.data.results) {
            studentsData = response.data.results;
            source = 'users';
          } else if (Array.isArray(response.data)) {
            studentsData = response.data;
            source = 'users';
          }
          console.log(`📊 Got ${studentsData.length} students from /auth/users/`);
        } catch (e) {
          console.log('❌ /auth/users/ failed:', e.message);
        }
      }
      
      // ============================================================
      // ATTEMPT 3: /students/
      // ============================================================
      if (studentsData.length === 0) {
        try {
          console.log('📡 Trying /students/...');
          const response = await api.get('/students/');
          console.log('✅ Response:', response.data);
          
          if (response.data && response.data.results) {
            studentsData = response.data.results;
            source = 'students';
          } else if (Array.isArray(response.data)) {
            studentsData = response.data;
            source = 'students';
          }
          console.log(`📊 Got ${studentsData.length} students from /students/`);
        } catch (e) {
          console.log('❌ /students/ failed:', e.message);
        }
      }
      
      // ============================================================
      // PROCESS DATA
      // ============================================================
      console.log('📊 ========================================');
      console.log('📊 TOTAL STUDENTS FOUND:', studentsData.length);
      console.log('📊 SOURCE:', source);
      console.log('📊 ========================================');
      
      if (studentsData.length > 0) {
        const processed = studentsData.map((s, i) => ({
          id: s.id || i + 1,
          user: {
            full_name: s.full_name || s.user?.full_name || s.student_name || `Student ${i+1}`,
            email: s.email || s.user?.email || '',
          },
          student_id: s.student_id || s.user?.student_id || '',
          department: s.department || s.user?.department || s.department_name || 'Not Assigned',
          payment_status: s.payment_status || 'PENDING',
          documents_verified: s.documents_verified || false,
          documents_submitted: s.documents_submitted || false,
          is_enrolled: s.is_enrolled || false,
          grade_8_certificate: s.grade_8_certificate || null,
          grade_12_certificate: s.grade_12_certificate || null,
          transcript: s.transcript || null,
          other_documents: s.other_documents || null,
          cgpa: s.cgpa || '0.00',
          notification_sent: s.notification_sent || false,
        }));
        
        setStudents(processed);
        setFilteredStudents(processed);
        setDataSource(source);
        calculateStats(processed);
        toast.success(`✅ Loaded ${processed.length} students from database`);
      } else {
        setStudents([]);
        setFilteredStudents([]);
        setDataSource('none');
        setError('No students found. Click "Load Sample Data" to test.');
        toast.info('No students found in database');
      }
      
    } catch (error) {
      console.error('❌ ERROR:', error);
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // ============ LOAD SAMPLE DATA ============
  const loadSampleData = () => {
    const sampleStudents = [
      {
        id: 1,
        user: { full_name: 'Abebe Kebede', email: 'abebe@example.com' },
        student_id: 'STU20240001',
        department: 'Computer Science',
        payment_status: 'VERIFIED',
        documents_verified: false,
        documents_submitted: true,
        is_enrolled: false,
        grade_8_certificate: 'grade8.pdf',
        grade_12_certificate: 'grade12.pdf',
        transcript: 'transcript.pdf',
        other_documents: null,
        cgpa: '3.20',
        notification_sent: true
      },
      {
        id: 2,
        user: { full_name: 'Betelehem Tesfaye', email: 'bete@example.com' },
        student_id: 'STU20240002',
        department: 'Software Engineering',
        payment_status: 'VERIFIED',
        documents_verified: true,
        documents_submitted: true,
        is_enrolled: false,
        grade_8_certificate: 'grade8.pdf',
        grade_12_certificate: 'grade12.pdf',
        transcript: 'transcript.pdf',
        other_documents: null,
        cgpa: '3.45',
        notification_sent: true
      },
      {
        id: 3,
        user: { full_name: 'Chala Desta', email: 'chala@example.com' },
        student_id: 'STU20240003',
        department: 'Information Systems',
        payment_status: 'VERIFIED',
        documents_verified: true,
        documents_submitted: true,
        is_enrolled: true,
        grade_8_certificate: 'grade8.pdf',
        grade_12_certificate: 'grade12.pdf',
        transcript: 'transcript.pdf',
        other_documents: 'other.pdf',
        cgpa: '3.78',
        notification_sent: true
      },
      {
        id: 4,
        user: { full_name: 'Daniel Worku', email: 'daniel@example.com' },
        student_id: 'STU20240004',
        department: 'Computer Science',
        payment_status: 'VERIFIED',
        documents_verified: false,
        documents_submitted: false,
        is_enrolled: false,
        grade_8_certificate: null,
        grade_12_certificate: null,
        transcript: null,
        other_documents: null,
        cgpa: '0.00',
        notification_sent: false
      },
    ];
    setStudents(sampleStudents);
    setFilteredStudents(sampleStudents);
    setDataSource('sample');
    setIsUsingSampleData(true);
    calculateStats(sampleStudents);
    toast.success('📊 Sample data loaded for testing');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'REGISTRAR' && userRole !== 'ADMIN') {
      toast.error(`Access denied. Role: ${user?.role}. Registrar only.`);
      navigate('/');
      return;
    }
    fetchStudents();
  }, [isAuthenticated, navigate, user, fetchStudents]);

  // ============ CALCULATE STATISTICS ============
  const calculateStats = (data) => {
    const arr = Array.isArray(data) ? data : [];
    setStats({
      total: arr.length,
      verified: arr.filter(s => s.documents_verified === true).length,
      pending: arr.filter(s => !s.documents_verified && s.payment_status !== 'REJECTED').length,
      rejected: arr.filter(s => s.payment_status === 'REJECTED').length,
      active: arr.filter(s => s.is_enrolled === true).length,
      documents_submitted: arr.filter(s => s.documents_submitted === true).length,
      ready_for_activation: arr.filter(s => s.documents_verified === true && s.payment_status === 'VERIFIED' && !s.is_enrolled).length,
      pending_upload: arr.filter(s => s.payment_status === 'VERIFIED' && !s.documents_submitted).length,
      notification_sent: arr.filter(s => s.notification_sent === true).length,
    });
  };

  // ============ SEND NOTIFICATION TO STUDENT ============
  const sendDocumentNotification = async (studentId) => {
    setActionLoading(true);
    try {
      const message = notificationMessage || 'Please upload your required documents (Grade 8, Grade 12, Transcript) for verification.';
      
      console.log(`📧 Sending notification to student:`, studentId);
      console.log(`📝 Message:`, message);
      
      const response = await api.post(`/auth/registrar/students/${studentId}/notify-document/`, {
        message: message
      });
      
      console.log('✅ Response:', response.data);
      toast.success('📧 Notification sent to student successfully!');
      
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, notification_sent: true } : s
      ));
      setFilteredStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, notification_sent: true } : s
      ));
      
      calculateStats(students.map(s => 
        s.id === studentId ? { ...s, notification_sent: true } : s
      ));
      
      setShowNotifyModal(false);
      setNotificationMessage('');
      setSelectedStudent(null);
      
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Only Registrar can send notifications.');
      } else if (error.response?.status === 404) {
        toast.error('Student not found.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to send notification');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ============ VERIFY STUDENT DOCUMENTS ============
  const verifyStudentDocuments = async (studentId, action, reason = '') => {
    setActionLoading(true);
    try {
      console.log(`🔍 ${action === 'verify' ? 'Verifying' : 'Rejecting'} documents for student:`, studentId);
      
      const response = await api.post(`/auth/registrar/students/${studentId}/verify/`, {
        action: action,
        reason: reason
      });
      
      console.log('✅ Response:', response.data);
      toast.success(`Documents ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      
      await fetchStudents();
      setShowVerifyModal(false);
      setSelectedStudent(null);
      
    } catch (error) {
      console.error('❌ Failed to verify documents:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Only Registrar can verify documents.');
      } else if (error.response?.status === 404) {
        toast.error('Student not found.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to verify documents');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ============ GENERATE STUDENT ID ============
  const generateStudentId = async (studentId) => {
    setActionLoading(true);
    try {
      console.log('🔍 Generating ID for student:', studentId);
      
      const response = await api.post(`/auth/registrar/students/${studentId}/generate-id/`);
      console.log('✅ Response:', response.data);
      
      toast.success('Student ID generated successfully!');
      await fetchStudents();
      setShowIdModal(false);
      setSelectedStudent(null);
      
    } catch (error) {
      console.error('❌ Failed to generate student ID:', error);
      toast.error(error.response?.data?.error || 'Failed to generate student ID');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ ACTIVATE STUDENT ACCOUNT ============
  const activateAccount = async (studentId) => {
    setActionLoading(true);
    try {
      console.log('🔍 Activating student account:', studentId);
      
      const student = students.find(s => s.id === studentId);
      if (student) {
        if (!student.documents_verified) {
          toast.error('Documents not verified. Please verify documents first.');
          setActionLoading(false);
          return;
        }
        if (student.payment_status !== 'VERIFIED') {
          toast.error('Payment not verified. Finance must verify payment first.');
          setActionLoading(false);
          return;
        }
        if (!student.student_id) {
          toast.error('Student ID not generated. Please generate ID first.');
          setActionLoading(false);
          return;
        }
      }
      
      const response = await api.post(`/auth/registrar/students/${studentId}/activate/`);
      console.log('✅ Response:', response.data);
      
      toast.success('✅ Account activated successfully! Student can now enroll.');
      await fetchStudents();
      setShowActivateModal(false);
      setSelectedStudent(null);
      
    } catch (error) {
      console.error('❌ Failed to activate account:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Only Registrar can activate accounts.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Cannot activate account. Please check conditions.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to activate account');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ============ FILTER AND SEARCH ============
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterData(term, filterStatus);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    filterData(searchTerm, status);
  };

  const filterData = (term, status) => {
    let filtered = students;
    
    if (term) {
      filtered = filtered.filter(s => 
        (s.user?.full_name?.toLowerCase() || '').includes(term) ||
        (s.user?.email?.toLowerCase() || '').includes(term) ||
        (s.student_id?.toLowerCase() || '').includes(term)
      );
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(s => {
        if (status === 'verified') return s.documents_verified === true;
        if (status === 'pending') return !s.documents_verified && s.payment_status !== 'REJECTED';
        if (status === 'rejected') return s.payment_status === 'REJECTED';
        if (status === 'active') return s.is_enrolled === true;
        if (status === 'documents') return s.documents_submitted === true;
        if (status === 'ready') return s.documents_verified === true && s.payment_status === 'VERIFIED' && !s.is_enrolled;
        if (status === 'pending_upload') return s.payment_status === 'VERIFIED' && !s.documents_submitted;
        if (status === 'notified') return s.notification_sent === true;
        return true;
      });
    }
    
    setFilteredStudents(filtered);
  };

  // ============ STATUS BADGE ============
  const getStatusBadge = (student) => {
    if (student.is_enrolled && student.documents_verified) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#dcfce7',
          color: '#16a34a',
        }}>
          <CheckCircle size={16} />
          Active
        </span>
      );
    } else if (student.documents_verified && student.payment_status === 'VERIFIED' && !student.is_enrolled) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#dbeafe',
          color: '#2563eb',
        }}>
          <CheckCircle size={16} />
          Ready to Activate
        </span>
      );
    } else if (student.documents_verified) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#dbeafe',
          color: '#2563eb',
        }}>
          <CheckCircle size={16} />
          Verified
        </span>
      );
    } else if (student.documents_submitted && student.payment_status === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#fef3c7',
          color: '#d97706',
        }}>
          <Upload size={16} />
          Docs Uploaded
        </span>
      );
    } else if (student.payment_status === 'VERIFIED' && !student.documents_submitted && student.notification_sent) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#fef3c7',
          color: '#d97706',
        }}>
          <Bell size={16} />
          Notified
        </span>
      );
    } else if (student.payment_status === 'VERIFIED' && !student.documents_submitted) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#f3f4f6',
          color: '#6b7280',
        }}>
          <Clock size={16} />
          Awaiting Docs
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#f3f4f6',
          color: '#6b7280',
        }}>
          <Clock size={16} />
          Pending
        </span>
      );
    }
  };

  // ============ LOADING STATE ============
  if (loading && students.length === 0) {
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
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .search-filter-bar { flex-direction: column !important; }
          .students-table-container { overflow-x: auto; }
          .action-buttons { flex-wrap: wrap !important; }
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
            <FileText size={28} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
            Registrar Dashboard
          </h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            Manage student registrations, documents, and accounts
            <br />
            <span style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: 'bold', color: '#2563eb' }}>📋 Workflow:</span> 
              <span style={{ color: '#64748b' }}> Notify → Upload → Verify → Activate</span>
            </span>
            {dataSource === 'none' && !isUsingSampleData && (
              <span style={{ display: 'block', color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>⚠️ No data loaded</span>
            )}
            {isUsingSampleData && (
              <span style={{ display: 'block', color: '#f59e0b', fontSize: '14px', marginTop: '4px' }}>⚠️ Using SAMPLE data</span>
            )}
            {dataSource !== 'none' && !isUsingSampleData && students.length > 0 && (
              <span style={{ display: 'block', color: '#16a34a', fontSize: '14px', marginTop: '4px' }}>✅ {students.length} students from database</span>
            )}
            {error && (
              <span style={{ display: 'block', color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>⚠️ {error}</span>
            )}
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={fetchStudents}
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
          <button
            onClick={loadSampleData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Load Sample Data
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => toast.info('Export feature coming soon')}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }} className="stats-grid">
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
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.total}</span>
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
          borderLeft: '4px solid #f59e0b',
          cursor: 'pointer',
        }}
        onClick={() => handleFilter('pending_upload')}>
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
            <Bell size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pending_upload}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Awaiting Docs</span>
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
        onClick={() => handleFilter('documents')}>
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
            <Upload size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.documents_submitted}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Docs Uploaded</span>
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
        onClick={() => handleFilter('ready')}>
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
            <UserPlus size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.ready_for_activation}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Ready to Activate</span>
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
          cursor: 'pointer',
        }}
        onClick={() => handleFilter('active')}>
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
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.active}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Active</span>
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
        onClick={() => handleFilter('notified')}>
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
            <Send size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.notification_sent}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Notified</span>
          </div>
        </div>
      </div>

      {/* ============ BATCH PROCESSING SECTION ============ */}
      
      {/* Batch Student Activation */}
      <BatchProcessor
        endpoint="/analytics/batch/activate-students/"
        title="Batch Student Activation"
        description="Activate multiple students at once"
        icon={UserPlus}
        batchTypes={[
          { value: 'ids', label: 'By Student IDs', icon: '📋', description: 'Comma separated IDs' },
          { value: 'department', label: 'By Department', icon: '🏛️', description: 'Department name' },
          { value: 'semester', label: 'By Semester', icon: '📚', description: 'Semester number (1-8)' },
          { value: 'all', label: 'All Eligible', icon: '👥', description: 'All students ready for activation' },
        ]}
        onSuccess={() => {
          fetchStudents();
        }}
        color="blue"
        bgColor="#eff6ff"
      />

      {/* Batch ID Generation */}
      <BatchProcessor
        endpoint="/analytics/batch/generate-ids/"
        title="Batch Student ID Generation"
        description="Generate IDs for multiple students at once"
        icon={CreditCard}
        batchTypes={[
          { value: 'ids', label: 'By Student IDs', icon: '📋', description: 'Comma separated IDs' },
          { value: 'department', label: 'By Department', icon: '🏛️', description: 'Department name' },
          { value: 'all', label: 'All Eligible', icon: '👥', description: 'All verified students without ID' },
        ]}
        onSuccess={() => {
          fetchStudents();
        }}
        color="purple"
        bgColor="#f5f3ff"
      />

      {/* Batch Document Verification */}
      <BatchProcessor
        endpoint="/analytics/batch/verify-documents/"
        title="Batch Document Verification"
        description="Verify documents for multiple students at once"
        icon={FileText}
        batchTypes={[
          { value: 'ids', label: 'By Student IDs', icon: '📋', description: 'Comma separated IDs' },
          { value: 'department', label: 'By Department', icon: '🏛️', description: 'Department name' },
          { value: 'all', label: 'All Pending', icon: '📄', description: 'All students with uploaded documents' },
        ]}
        onSuccess={() => {
          fetchStudents();
        }}
        color="orange"
        bgColor="#fff7ed"
      />
{/* ============ BATCH NOTIFY — UPLOAD DOCUMENTS ============ */}
<BatchProcessor
  endpoint="/analytics/batch/send-notifications/"
  title="Batch Notify — Upload Documents"
  description="Send 'Please upload your documents' notifications to multiple students at once"
  icon={Bell}
  color="purple"
  bgColor="#f5f3ff"
  defaultPayload={{
    title: '📄 Document Upload Required',
    message:
      'Your payment has been verified. Please upload your Grade 8 Certificate, Grade 12 Certificate, and Transcript for verification.',
    notification_type: 'SYSTEM_ALERT',
    link: '/upload-documents',
  }}
  batchTypes={[
    {
      value: 'all_pending_upload',
      label: 'All Awaiting Documents',
      icon: '📄',
      description:
        'Notify every student whose payment is VERIFIED but has not uploaded documents yet',
    },
    {
      value: 'department',
      label: 'By Department',
      icon: '🏛️',
      description:
        'Notify pending-upload students in a specific department',
    },
    {
      value: 'ids',
      label: 'By Student DB IDs',
      icon: '📋',
      description:
        'Notify specific students by their database IDs (comma separated)',
    },
  ]}
  onSuccess={() => {
    fetchStudents();
  }}
/>
      {/* SEARCH AND FILTER */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
      }} className="search-filter-bar">
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }} />
          <input
            type="text"
            placeholder="Search by Name, Email, or Student ID..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              background: 'white',
              transition: 'all 0.3s ease',
            }}
          >
            <option value="all">All Students</option>
            <option value="pending_upload">Awaiting Documents</option>
            <option value="documents">Documents Uploaded</option>
            <option value="ready">Ready to Activate</option>
            <option value="active">Active</option>
            <option value="notified">Notified</option>
          </select>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }} className="students-table-container">
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
                }}>Student ID</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Department</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Payment</th>
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
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{
                    textAlign: 'center',
                    padding: '48px',
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#94a3b8',
                    }}>
                      <Users size={48} style={{ opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '16px' }}>
                        {error || 'No students found in database'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          onClick={fetchStudents}
                          style={{
                            padding: '8px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Refresh
                        </button>
                        <button
                          onClick={loadSampleData}
                          style={{
                            padding: '8px 20px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Load Sample Data
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id || Math.random()}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      <div>
                        <span style={{
                          fontWeight: 500,
                          color: '#0f172a',
                          display: 'block',
                        }}>{student.user?.full_name || 'Unknown'}</span>
                        <span style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}>{student.user?.email || ''}</span>
                      </div>
                    </td>

                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#475569',
                    }}>
                      {student.student_id || '—'}
                    </td>

                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#475569',
                    }}>
                      {student.department || '—'}
                    </td>

                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      {student.payment_status === 'VERIFIED' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#dcfce7',
                          color: '#16a34a',
                        }}>
                          <DollarSign size={14} />
                          VERIFIED
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#fef3c7',
                          color: '#d97706',
                        }}>
                          <Clock size={14} />
                          PENDING
                        </span>
                      )}
                    </td>

                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      {getStatusBadge(student)}
                    </td>

                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }} className="action-buttons">
                        
                        {/* 1. SEND NOTIFICATION - Only for verified payment students who haven't uploaded docs */}
                        {student.payment_status === 'VERIFIED' && !student.documents_submitted && (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowNotifyModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: '#dbeafe',
                              color: '#2563eb',
                              fontSize: '12px',
                            }}
                            title="Send Document Upload Notification"
                          >
                            <Bell size={16} />
                            Notify
                          </button>
                        )}
{/* 2. VIEW DOCUMENTS — show if ANY file exists */}
{(student.grade_8_certificate ||
  student.grade_12_certificate ||
  student.transcript ||
  student.other_documents ||
  student.documents_submitted) && (
  <button
    onClick={() => { setSelectedStudent(student); setShowDocumentModal(true); }}
    style={{ /* same styles */ }}
  >
    <Eye size={16} />
    View Docs
  </button>
)}

                        {/* 3. VERIFY DOCUMENTS - Only if docs uploaded but not verified */}
                        {student.documents_submitted && !student.documents_verified && student.payment_status === 'VERIFIED' && (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowVerifyModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: '#dcfce7',
                              color: '#22c55e',
                              fontSize: '12px',
                            }}
                            title="Verify Documents"
                          >
                            <Check size={16} />
                            Verify
                          </button>
                        )}

                        {/* 4. GENERATE ID - Only if documents verified but no ID */}
                        {student.documents_verified && student.payment_status === 'VERIFIED' && !student.student_id && (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowIdModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: '#dbeafe',
                              color: '#3b82f6',
                              fontSize: '12px',
                            }}
                            title="Generate Student ID"
                          >
                            <CreditCard size={16} />
                            Generate ID
                          </button>
                        )}

                        {/* 5. ACTIVATE - Only if all conditions met */}
                        {student.documents_verified && student.payment_status === 'VERIFIED' && student.student_id && !student.is_enrolled && (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowActivateModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              background: '#22c55e',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                            title="Activate Account"
                          >
                            <UserPlus size={16} />
                            Activate
                          </button>
                        )}

                        {/* 6. ACTIVE badge */}
                        {student.is_enrolled && (
                          <span style={{
                            padding: '4px 12px',
                            background: '#dcfce7',
                            color: '#16a34a',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <CheckCircle size={14} />
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {students.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span>Showing {filteredStudents.length} of {students.length} students</span>
            <span>
              📋 Workflow: <span style={{ color: '#2563eb' }}>Notify</span> → 
              <span style={{ color: '#f59e0b' }}> Upload</span> → 
              <span style={{ color: '#8b5cf6' }}> Verify</span> → 
              <span style={{ color: '#22c55e' }}> Activate ✅</span>
            </span>
          </div>
        )}
      </div>

      {/* ============ NOTIFY MODAL ============ */}
      {showNotifyModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowNotifyModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Bell size={24} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                Send Document Notification
              </h2>
              <button
                onClick={() => setShowNotifyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Name:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Department:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.department || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span style={{ fontWeight: 500, color: '#f59e0b' }}>⏳ Awaiting Documents</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ VERIFIED</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '4px',
              }}>
                Notification Message
              </label>
              <textarea
                rows="4"
                placeholder="Please upload your required documents (Grade 8, Grade 12, Transcript) for verification."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
              />
              <p style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '4px',
              }}>
                This notification will be sent to the student via email and in-app notification.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowNotifyModal(false)}
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
                onClick={() => sendDocumentNotification(selectedStudent.id)}
                disabled={actionLoading}
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
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#2563eb',
                  color: 'white',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <Send size={18} />
                {actionLoading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DOCUMENT VIEWER MODAL ============ */}
      {showDocumentModal && selectedStudent && (
        <RegistrarDocumentViewer
          studentId={selectedStudent.id}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedStudent(null);
            fetchStudents();
          }}
          onVerify={(studentId, action) => {
            verifyStudentDocuments(studentId, action);
          }}
        />
      )}

      {/* ============ VERIFY MODAL ============ */}
      {showVerifyModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowVerifyModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Check size={24} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Verify Student Documents
              </h2>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Name:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Department:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.department || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ VERIFIED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Documents:</span>
                <span style={{ fontWeight: 500, color: '#f59e0b' }}>📄 Uploaded - Pending Review</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => verifyStudentDocuments(selectedStudent.id, 'reject', 'Incomplete documents')}
                disabled={actionLoading}
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
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#fee2e2',
                  color: '#dc2626',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <XCircle size={18} />
                Reject
              </button>
              <button
                onClick={() => verifyStudentDocuments(selectedStudent.id, 'verify')}
                disabled={actionLoading}
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
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#dcfce7',
                  color: '#16a34a',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <CheckCircle size={18} />
                {actionLoading ? 'Processing...' : 'Verify Documents'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ GENERATE ID MODAL ============ */}
      {showIdModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowIdModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <CreditCard size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Generate Student ID
              </h2>
              <button
                onClick={() => setShowIdModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Name:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Department:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.department || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ VERIFIED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Documents:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ Verified</span>
              </div>
            </div>

            <p style={{
              color: '#64748b',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              This will generate a unique Student ID for this student. The student will be notified.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowIdModal(false)}
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
                onClick={() => generateStudentId(selectedStudent.id)}
                disabled={actionLoading}
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
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#dbeafe',
                  color: '#2563eb',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <CreditCard size={18} />
                {actionLoading ? 'Generating...' : 'Generate ID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ACTIVATE MODAL ============ */}
      {showActivateModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowActivateModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <UserPlus size={24} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Activate Student Account
              </h2>
              <button
                onClick={() => setShowActivateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Name:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.user?.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Student ID:</span>
                <span style={{ fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                  {selectedStudent.student_id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Department:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedStudent.department || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ VERIFIED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Documents:</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>✅ Verified</span>
              </div>
            </div>

            <div style={{
              background: '#f0fdf4',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              marginBottom: '16px',
            }}>
              <p style={{
                color: '#166534',
                margin: 0,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle size={18} color="#16a34a" />
                All conditions met! This student is ready for activation.
              </p>
            </div>

            <p style={{
              color: '#64748b',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              This will ACTIVATE the student's account. They will be able to:
              <ul style={{
                marginTop: '8px',
                paddingLeft: '20px',
                listStyle: 'disc',
              }}>
                <li>Enroll in courses</li>
                <li>Access all learning materials</li>
                <li>Take exams</li>
                <li>View their dashboard</li>
              </ul>
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowActivateModal(false)}
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
                onClick={() => activateAccount(selectedStudent.id)}
                disabled={actionLoading}
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
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#22c55e',
                  color: 'white',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <UserPlus size={18} />
                {actionLoading ? 'Activating...' : '✅ Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDashboard;