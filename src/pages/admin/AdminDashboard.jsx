// frontend/src/pages/admin/AdminDashboard.jsx
// COMPLETE FIXED - All CRUD Operations Working
// Includes: Users, Courses, Departments, Fee Structures, Banks, Payment Periods, Payment Schedules
// Dynamic Payment Period Duration: Minutes, Hours, Days, Weeks, Months
// FIXED: System Lock/Unlock Toggle
// FIXED: Delete functionality for Payment Schedules
// FIXED: CRUD for Users, Departments, Fee Structures
// FIXED: Password Visibility on Create User

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Users, BookOpen, RefreshCw,
  CheckCircle, XCircle, Clock, DollarSign,
  UserPlus, Eye, Edit, Trash2,
  Activity, AlertTriangle, Database,
  Search, Filter, Plus, Menu,
  CreditCard as CreditCardIcon,
  Shield, GraduationCap,
  Camera, Flag,
  Building2,
  LayoutDashboard,
  LogOut,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save, X, Upload, FileText,
  Download, Printer,CheckSquare,Square,
  Timer, Lock, Unlock, Pencil, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  
  // ============ SYSTEM LOCK STATE ============
  const [systemLocked, setSystemLocked] = useState(false);
  const [systemLockMessage, setSystemLockMessage] = useState('');
  const [lockLoading, setLockLoading] = useState(false);
  // Add these states with your other states
  //const [showCreatePassword, setShowCreatePassword] = useState(false);
  //const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // ============ STATE ============
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [proctorSessions, setProctorSessions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [paymentPeriods, setPaymentPeriods] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // ============ PAYMENT SCHEDULES STATE ============
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [showGenerateScheduleModal, setShowGenerateScheduleModal] = useState(false);
  const [generatingSchedules, setGeneratingSchedules] = useState(false);
  const [selectedDepartmentForSchedule, setSelectedDepartmentForSchedule] = useState('');
  const [scheduleGenerationResult, setScheduleGenerationResult] = useState(null);

  // ============ PASSWORD VISIBILITY ============
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============ MODAL STATES ============
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [showEditFeeStructureModal, setShowEditFeeStructureModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showProctoringDetailModal, setShowProctoringDetailModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showPaymentPeriodModal, setShowPaymentPeriodModal] = useState(false);
  const [showEditPaymentPeriodModal, setShowEditPaymentPeriodModal] = useState(false);

  const [proctorImages, setProctorImages] = useState([]);
  const [selectedProctorSession, setSelectedProctorSession] = useState(null);
  // ============ BATCH PROCESSING STATE - ADD THIS ============
const [batchMode, setBatchMode] = useState(false);
const [selectedSchedules, setSelectedSchedules] = useState([]);
const [selectAllSchedules, setSelectAllSchedules] = useState(false);
const [batchProcessing, setBatchProcessing] = useState(false);
const [batchResults, setBatchResults] = useState(null);
const [showBatchResultsModal, setShowBatchResultsModal] = useState(false);
const [batchAction, setBatchAction] = useState('delete');
const [batchReason, setBatchReason] = useState('');
  // ============ FORM STATES ============
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'STUDENT',
    department: '',
    headed_department: '',
  });

  const [feeStructureForm, setFeeStructureForm] = useState({
    department: '',
    payment_period: '',
    amount: '',
    penalty_per_day: 10,
    grace_period_days: 10,
    is_active: true,
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: '',
    head: '',
    established_year: '',
  });

  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    swift_code: '',
    is_active: true,
    is_default: false,
  });

  const [paymentPeriodForm, setPaymentPeriodForm] = useState({
    name: '',
    period_type: 'MINUTES',
    duration_value: 3,
    description: '',
    is_active: true,
  });

  const [courseForm, setCourseForm] = useState({
    course_code: '',
    title: '',
    description: '',
    credit_hours: 3,
    semester: '1',
    capacity: 30,
    department: '',
    instructor: '',
    is_active: true,
    is_approved: false,
  });

  // ============ FETCH FUNCTIONS ============

  const fetchPaymentPeriods = useCallback(async () => {
    try {
      console.log('🔄 Fetching payment periods...');
      const response = await api.get('/analytics/payment-periods/');
      console.log('✅ Payment periods response:', response.data);
      const data = response.data;
      if (Array.isArray(data)) {
        setPaymentPeriods(data);
      } else if (data && data.results && Array.isArray(data.results)) {
        setPaymentPeriods(data.results);
      } else {
        setPaymentPeriods([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch payment periods:', error);
      setPaymentPeriods([]);
    }
  }, []);

  const fetchDepartmentsForModal = useCallback(async () => {
    try {
      console.log('🔄 Fetching departments...');
      const response = await api.get('/auth/departments/');
      console.log('✅ Departments response:', response.data);
      let data = response.data;
      if (data && data.results && Array.isArray(data.results)) {
        setDepartments(data.results);
      } else if (Array.isArray(data)) {
        setDepartments(data);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch departments:', error);
      setDepartments([]);
    }
  }, []);

  // ============ SYSTEM LOCK FUNCTION - FIXED TOGGLE ============
     // ============ SYSTEM LOCK FUNCTION - FIXED ============
  // ============ SYSTEM LOCK FUNCTION - FIXED ============
const toggleSystemLock = async () => {
  try {
    // Determine current action
    const action = systemLocked ? 'unlock' : 'lock';
    
    // If locking, ask for message
    let message = systemLockMessage;
    if (action === 'lock') {
      const userMessage = prompt('Enter lock message (optional):', 'System is currently locked for maintenance. Please try again later.');
      if (userMessage === null) return; // User cancelled
      message = userMessage || 'System is currently locked for maintenance. Please try again later.';
    } else {
      // If unlocking, confirm first
      if (!window.confirm('⚠️ Are you sure you want to UNLOCK the system?\n\nAll users will be able to access the system again.')) {
        return;
      }
    }
    
    setLockLoading(true);
    
    const response = await api.post('/analytics/system-lock/', {
      action: action,
      message: message
    });
    
    console.log('✅ System lock response:', response.data);
    
    setSystemLocked(response.data.is_locked);
    setSystemLockMessage(response.data.lock_message || response.data.message);
    toast.success(response.data.message);
    await fetchData();
    
  } catch (error) {
    console.error('Failed to toggle system lock:', error);
    toast.error(error.response?.data?.error || 'Failed to toggle system lock');
  } finally {
    setLockLoading(false);
  }
};

  // ============ GENERATE PAYMENT SCHEDULES ============
  const handleGeneratePaymentSchedules = async () => {
    if (!selectedDepartmentForSchedule) {
      toast.error('Please select a department');
      return;
    }
    
    setGeneratingSchedules(true);
    try {
      const response = await api.post('/analytics/generate-payment-schedules/', {
        department_id: selectedDepartmentForSchedule
      });
      
      setScheduleGenerationResult(response.data);
      toast.success(`Generated ${response.data.created_count} payment schedules`);
      
      const schedulesRes = await api.get('/analytics/payment-schedules/');
      setPaymentSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      
      setShowGenerateScheduleModal(false);
      setSelectedDepartmentForSchedule('');
    } catch (error) {
      console.error('Failed to generate payment schedules:', error);
      toast.error(error.response?.data?.error || 'Failed to generate payment schedules');
    } finally {
      setGeneratingSchedules(false);
    }
  };

  // ============ DELETE PAYMENT SCHEDULE - FIXED ============
  const handleDeletePaymentSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this payment schedule? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/analytics/payment-schedules/${scheduleId}/`);
      toast.success('Payment schedule deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Failed to delete payment schedule:', error);
      toast.error(error.response?.data?.error || 'Failed to delete payment schedule');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Fetch System Lock Status
      try {
        const lockRes = await api.get('/analytics/system-lock/');
        setSystemLocked(lockRes.data.is_locked);
        setSystemLockMessage(lockRes.data.message);
      } catch (e) {
        setSystemLocked(false);
      }

      try {
        const usersRes = await api.get('/analytics/admin/users/');
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (e) {
        setUsers([]);
      }

      try {
        const coursesRes = await api.get('/analytics/admin/courses/');
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      } catch (e) {
        setCourses([]);
      }

      try {
        const paymentsRes = await api.get('/analytics/admin/payments/');
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      } catch (e) {
        setPayments([]);
      }

      try {
        const statsRes = await api.get('/analytics/admin/stats/');
        setStats(statsRes.data || {});
      } catch (e) {
        setStats({});
      }

      try {
        const configRes = await api.get('/analytics/admin/config/');
        setSystemConfig(configRes.data || {});
      } catch (e) {
        setSystemConfig({});
      }

      try {
        const logsRes = await api.get('/analytics/admin/logs/?limit=50');
        setSystemLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      } catch (e) {
        setSystemLogs([]);
      }

      try {
        const backupRes = await api.get('/analytics/admin/backups/');
        setBackupHistory(Array.isArray(backupRes.data) ? backupRes.data : []);
      } catch (e) {
        setBackupHistory([]);
      }

      try {
        const deptRes = await api.get('/analytics/admin/departments/');
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      } catch (e) {
        try {
          const deptRes2 = await api.get('/auth/departments/');
          setDepartments(Array.isArray(deptRes2.data) ? deptRes2.data : []);
        } catch (e2) {
          setDepartments([]);
        }
      }

          // ✅ FETCH FEE STRUCTURES - FIXED
    try {
      const feeRes = await api.get('/analytics/fee-structures/');
      console.log('✅ Fee structures response:', feeRes.data);
      let feeData = feeRes.data;
      if (feeData && feeData.results) {
        feeData = feeData.results;
      }
      if (!Array.isArray(feeData)) {
        feeData = [];
      }
      setFeeStructures(feeData);
      console.log('✅ Fee structures loaded:', feeData.length);
    } catch (e) {
      console.warn('⚠️ Failed to fetch fee structures:', e);
      setFeeStructures([]);
    }

        // ✅ FETCH BANKS - FIXED
    try {
      const bankRes = await api.get('/analytics/banks/');
      console.log('✅ Banks response:', bankRes.data);
      let bankData = bankRes.data;
      if (bankData && bankData.results) {
        bankData = bankData.results;
      }
      if (!Array.isArray(bankData)) {
        bankData = [];
      }
      setBanks(bankData);
      console.log('✅ Banks loaded:', bankData.length);
    } catch (e) {
      console.warn('⚠️ Failed to fetch banks:', e);
      setBanks([]);
    } 

      try {
        await fetchPaymentPeriods();
      } catch (e) {
        setPaymentPeriods([]);
      }

      try {
        const schedulesRes = await api.get('/analytics/payment-schedules/');
        let schedulesData = schedulesRes.data;
        if (schedulesData && schedulesData.results) {
          schedulesData = schedulesData.results;
        }
        if (!Array.isArray(schedulesData)) {
          schedulesData = [];
        }
        setPaymentSchedules(schedulesData);
        console.log('✅ Payment schedules loaded:', schedulesData);
      } catch (e) {
        console.error('Failed to fetch payment schedules:', e);
        setPaymentSchedules([]);
      }

      try {
        const proctorRes = await api.get('/proctoring/review/');
        setProctorSessions(Array.isArray(proctorRes.data) ? proctorRes.data : []);
      } catch (e) {
        setProctorSessions([]);
      }

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPaymentPeriods]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }

    fetchData();
  }, [isAuthenticated, navigate, user, fetchData]);

  // ============ USER CRUD OPERATIONS - FIXED ============
  // ============================================================
// BATCH PROCESSING FUNCTIONS - ADD THESE
// ============================================================

// Toggle schedule selection
const toggleScheduleSelection = (scheduleId) => {
  setSelectedSchedules(prev => {
    if (prev.includes(scheduleId)) {
      return prev.filter(id => id !== scheduleId);
    } else {
      return [...prev, scheduleId];
    }
  });
};

// Toggle select all schedules
const toggleSelectAllSchedules = () => {
  if (selectAllSchedules) {
    setSelectedSchedules([]);
    setSelectAllSchedules(false);
  } else {
    const allIds = paymentSchedules.map(s => s.id);
    setSelectedSchedules(allIds);
    setSelectAllSchedules(true);
  }
};

// Handle batch delete schedules
const handleBatchDeleteSchedules = async () => {
  if (selectedSchedules.length === 0) {
    toast.error('Please select at least one schedule');
    return;
  }
  
  if (!window.confirm(`Are you sure you want to delete ${selectedSchedules.length} payment schedule(s)? This action cannot be undone.`)) {
    return;
  }
  
  setBatchProcessing(true);
  try {
    const results = {
      total: selectedSchedules.length,
      deleted: 0,
      failed: 0,
      details: []
    };
    
    for (const scheduleId of selectedSchedules) {
      try {
        await api.delete(`/analytics/payment-schedules/${scheduleId}/`);
        results.deleted++;
        results.details.push({
          id: scheduleId,
          status: 'DELETED',
          success: true
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          id: scheduleId,
          status: 'FAILED',
          success: false,
          error: error.response?.data?.error || 'Deletion failed'
        });
      }
    }
    
    setBatchResults(results);
    setShowBatchResultsModal(true);
    toast.success(`Deleted ${results.deleted} schedules, ${results.failed} failed`);
    
    // Refresh data
    await fetchData();
    setSelectedSchedules([]);
    setSelectAllSchedules(false);
    setBatchMode(false);
    
  } catch (error) {
    console.error('Batch delete error:', error);
    toast.error('Batch deletion failed');
  } finally {
    setBatchProcessing(false);
  }
};

// Handle batch lock/unlock schedules
// frontend/src/pages/admin/AdminDashboard.jsx
// REPLACE handleBatchLockSchedules WITH THIS

const handleBatchLockSchedules = async () => {
  if (selectedSchedules.length === 0) {
    toast.error('Please select at least one schedule');
    return;
  }
  
  setBatchProcessing(true);
  try {
    const results = {
      total: selectedSchedules.length,
      locked: 0,
      unlocked: 0,
      updated: 0,
      failed: 0,
      details: []
    };
    
    for (const scheduleId of selectedSchedules) {
      try {
        const schedule = paymentSchedules.find(s => s.id === scheduleId);
        if (!schedule) {
          results.failed++;
          results.details.push({ id: scheduleId, status: 'FAILED', error: 'Schedule not found' });
          continue;
        }
        
        if (schedule.status === 'PAID') {
          results.failed++;
          results.details.push({ id: scheduleId, status: 'FAILED', error: 'Cannot modify PAID schedule' });
          continue;
        }
        
        let endpoint = '';
        let actionName = '';
        let newStatus = '';
        let method = 'post';
        
        if (batchAction === 'lock') {
          endpoint = `/analytics/payment-schedules/${scheduleId}/lock/`;
          actionName = 'LOCKED';
          newStatus = 'LOCKED';
          method = 'post';
        } else if (batchAction === 'unlock') {
          endpoint = `/analytics/payment-schedules/${scheduleId}/unlock/`;
          actionName = 'UNLOCKED';
          newStatus = 'PENDING';
          method = 'post';
        } else if (batchAction === 'paid') {
          endpoint = `/analytics/payment-schedules/${scheduleId}/update-status/`;
          actionName = 'PAID';
          newStatus = 'PAID';
          method = 'patch';
        } else if (batchAction === 'pending') {
          endpoint = `/analytics/payment-schedules/${scheduleId}/update-status/`;
          actionName = 'PENDING';
          newStatus = 'PENDING';
          method = 'patch';
        } else if (batchAction === 'overdue') {
          endpoint = `/analytics/payment-schedules/${scheduleId}/update-status/`;
          actionName = 'OVERDUE';
          newStatus = 'OVERDUE';
          method = 'patch';
        } else {
          results.failed++;
          results.details.push({ id: scheduleId, status: 'FAILED', error: 'Unknown action' });
          continue;
        }
        
        // ✅ Make the API call
        let response;
        if (method === 'post') {
          response = await api.post(endpoint);
        } else {
          response = await api.patch(endpoint, { 
            status: newStatus,
            notes: batchReason || 'Batch update'
          });
        }
        
        // ✅ Update results
        if (batchAction === 'lock') {
          results.locked++;
        } else if (batchAction === 'unlock') {
          results.unlocked++;
        } else {
          results.updated++;
        }
        
        results.details.push({ 
          id: scheduleId, 
          status: newStatus, 
          success: true 
        });
        
      } catch (error) {
        results.failed++;
        results.details.push({
          id: scheduleId,
          status: 'FAILED',
          success: false,
          error: error.response?.data?.error || error.message || 'Action failed'
        });
        console.error(`❌ Failed to process schedule ${scheduleId}:`, error);
      }
    }
    
    setBatchResults(results);
    setShowBatchResultsModal(true);
    toast.success(`Processed: ${results.locked + results.unlocked + results.updated} schedules, ${results.failed} failed`);
    
    // ✅ Refresh data
    await fetchData();
    setSelectedSchedules([]);
    setSelectAllSchedules(false);
    setBatchMode(false);
    
  } catch (error) {
    console.error('Batch operation error:', error);
    toast.error('Batch operation failed: ' + (error.message || 'Unknown error'));
  } finally {
    setBatchProcessing(false);
  }
};

// Handle batch update status
// frontend/src/pages/admin/AdminDashboard.jsx
// REPLACE handleBatchUpdateStatus WITH THIS

const handleBatchUpdateStatus = async () => {
  if (selectedSchedules.length === 0) {
    toast.error('Please select at least one schedule');
    return;
  }
  
  if (!batchAction) {
    toast.error('Please select an action');
    return;
  }
  
  setBatchProcessing(true);
  try {
    const results = {
      total: selectedSchedules.length,
      updated: 0,
      failed: 0,
      details: []
    };
    
    for (const scheduleId of selectedSchedules) {
      try {
        // ✅ Use the correct endpoint for updating status
        const response = await api.patch(`/analytics/payment-schedules/${scheduleId}/update-status/`, {
          status: batchAction,
          notes: batchReason || 'Batch update'
        });
        
        results.updated++;
        results.details.push({
          id: scheduleId,
          status: batchAction,
          success: true
        });
        
      } catch (error) {
        results.failed++;
        results.details.push({
          id: scheduleId,
          status: 'FAILED',
          success: false,
          error: error.response?.data?.error || error.message || 'Update failed'
        });
        console.error(`❌ Failed to update schedule ${scheduleId}:`, error);
      }
    }
    
    setBatchResults(results);
    setShowBatchResultsModal(true);
    toast.success(`Updated ${results.updated} schedules, ${results.failed} failed`);
    
    // ✅ Refresh data
    await fetchData();
    setSelectedSchedules([]);
    setSelectAllSchedules(false);
    setBatchMode(false);
    
  } catch (error) {
    console.error('Batch update error:', error);
    toast.error('Batch update failed: ' + (error.message || 'Unknown error'));
  } finally {
    setBatchProcessing(false);
  }
};
// Handle batch generate schedules (updated version)
const handleBatchGenerateSchedules = async () => {
  if (!selectedDepartmentForSchedule) {
    toast.error('Please select a department');
    return;
  }
  
  if (!window.confirm(`Generate payment schedules for ALL students in ${departments.find(d => d.id == selectedDepartmentForSchedule)?.name || 'selected'} department?`)) {
    return;
  }
  
  setBatchProcessing(true);
  try {
    const response = await api.post('/analytics/generate-payment-schedules/', {
      department_id: selectedDepartmentForSchedule
    });
    
    setScheduleGenerationResult(response.data);
    toast.success(`Generated ${response.data.created_count || 0} payment schedules`);
    
    // Refresh data
    await fetchData();
    setShowGenerateScheduleModal(false);
    setSelectedDepartmentForSchedule('');
    
  } catch (error) {
    console.error('Batch generate error:', error);
    toast.error(error.response?.data?.error || 'Failed to generate schedules');
  } finally {
    setBatchProcessing(false);
  }
};
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (userForm.password !== userForm.confirm_password) {
        toast.error('Passwords do not match');
        setActionLoading(false);
        return;
      }

      if (userForm.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        setActionLoading(false);
        return;
      }

      const userData = {
        email: userForm.email,
        full_name: userForm.full_name,
        phone: userForm.phone || '',
        password: userForm.password,
        role: userForm.role,
        department: userForm.department || '',
        headed_department: userForm.headed_department || '',
      };

      console.log('📝 Creating user with data:', userData);

      const response = await api.post('/analytics/admin/users/', userData);
      console.log('✅ User created:', response.data);
      
      toast.success('User created successfully!');
      setShowCreateUserModal(false);
      resetUserForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const userData = {
        full_name: userForm.full_name,
        phone: userForm.phone || '',
        role: userForm.role,
        is_active: userForm.is_active !== undefined ? userForm.is_active : true,
      };
      await api.put(`/analytics/admin/users/${selectedItem?.id}/`, userData);
      toast.success('User updated successfully!');
      setShowEditUserModal(false);
      setSelectedItem(null);
      resetUserForm();
      await fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/admin/users/${userId}/`);
      toast.success('User deleted successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    setActionLoading(true);
    try {
      await api.post(`/analytics/admin/users/${userId}/toggle/`);
      toast.success('User status toggled');
      await fetchData();
    } catch (error) {
      toast.error('Failed to toggle user status');
    } finally {
      setActionLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      full_name: '',
      phone: '',
      password: '',
      confirm_password: '',
      role: 'STUDENT',
      department: '',
      headed_department: '',
    });
    setShowCreatePassword(false);
    setShowConfirmPassword(false);
  };

  // ============ COURSE CRUD OPERATIONS ============

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/courses/', courseForm);
      toast.success('Course created successfully!');
      setShowCourseModal(false);
      resetCourseForm();
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/analytics/admin/courses/${selectedItem?.id}/`, courseForm);
      toast.success('Course updated successfully!');
      setShowCourseModal(false);
      setSelectedItem(null);
      resetCourseForm();
      await fetchData();
    } catch (error) {
      toast.error('Failed to update course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/admin/courses/${courseId}/`);
      toast.success('Course deleted successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCourse = async (courseId) => {
    setActionLoading(true);
    try {
      await api.put(`/analytics/admin/courses/${courseId}/`, {
        is_approved: true,
        is_active: true,
      });
      toast.success('Course approved successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to approve course');
    } finally {
      setActionLoading(false);
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      course_code: '',
      title: '',
      description: '',
      credit_hours: 3,
      semester: '1',
      capacity: 30,
      department: '',
      instructor: '',
      is_active: true,
      is_approved: false,
    });
  };

  // ============ DEPARTMENT CRUD OPERATIONS - FIXED ============

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const formData = {
        name: departmentForm.name,
        code: departmentForm.code.toUpperCase(),
        description: departmentForm.description || '',
        head: departmentForm.head || null,
        established_year: departmentForm.established_year || null
      };
      
      await api.post('/analytics/admin/departments/create/', formData);
      toast.success('Department created successfully!');
      setShowDepartmentModal(false);
      resetDepartmentForm();
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const formData = {
        name: departmentForm.name,
        code: departmentForm.code.toUpperCase(),
        description: departmentForm.description || '',
        head: departmentForm.head || null,
        established_year: departmentForm.established_year || null
      };
      await api.put(`/analytics/admin/departments/${selectedItem?.id}/`, formData);
      toast.success('Department updated successfully!');
      setShowDepartmentModal(false);
      setSelectedItem(null);
      resetDepartmentForm();
      await fetchData();
    } catch (error) {
      toast.error('Failed to update department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department? This will affect all associated students and courses.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/admin/departments/${departmentId}/`);
      toast.success('Department deleted successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete department');
    } finally {
      setActionLoading(false);
    }
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      code: '',
      description: '',
      head: '',
      established_year: '',
    });
  };

  // ============ FEE STRUCTURE CRUD OPERATIONS - FIXED ============

  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (paymentPeriods.length === 0) {
        toast.error('Please create a payment period first.');
        setActionLoading(false);
        return;
      }

      if (departments.length === 0) {
        toast.error('Please create a department first.');
        setActionLoading(false);
        return;
      }

      const response = await api.post('/analytics/fee-structures/', feeStructureForm);
      console.log('✅ Fee structure created:', response.data);
      toast.success('Fee structure created successfully!');
      setShowFeeStructureModal(false);
      resetFeeStructureForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to create fee structure:', error);
      toast.error(error.response?.data?.error || 'Failed to create fee structure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFeeStructure = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.put(`/analytics/fee-structures/${selectedItem?.id}/`, feeStructureForm);
      console.log('✅ Fee structure updated:', response.data);
      toast.success('Fee structure updated successfully!');
      setShowEditFeeStructureModal(false);
      setSelectedItem(null);
      resetFeeStructureForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to update fee structure:', error);
      toast.error(error.response?.data?.error || 'Failed to update fee structure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFeeStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure? This will affect payment schedules.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/fee-structures/${id}/`);
      toast.success('Fee structure deleted successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete fee structure');
    } finally {
      setActionLoading(false);
    }
  };

  const resetFeeStructureForm = () => {
    setFeeStructureForm({
      department: '',
      payment_period: '',
      amount: '',
      penalty_per_day: 10,
      grace_period_days: 10,
      is_active: true,
    });
  };

  // ============ BANK CRUD OPERATIONS ============

  const handleCreateBank = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.post('/analytics/banks/', bankForm);
      console.log('✅ Bank created:', response.data);
      toast.success('Bank account created successfully!');
      setShowBankModal(false);
      resetBankForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to create bank:', error);
      toast.error(error.response?.data?.error || 'Failed to create bank account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBank = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.put(`/analytics/banks/${selectedItem?.id}/`, bankForm);
      console.log('✅ Bank updated:', response.data);
      toast.success('Bank account updated successfully!');
      setShowEditBankModal(false);
      setSelectedItem(null);
      resetBankForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to update bank:', error);
      toast.error(error.response?.data?.error || 'Failed to update bank account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/banks/${id}/`);
      toast.success('Bank account deleted successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete bank account');
    } finally {
      setActionLoading(false);
    }
  };

  const resetBankForm = () => {
    setBankForm({
      bank_name: '',
      account_name: '',
      account_number: '',
      branch_name: '',
      swift_code: '',
      is_active: true,
      is_default: false,
    });
  };

  // ============ PAYMENT PERIOD CRUD OPERATIONS ============

  const handleCreatePaymentPeriod = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.post('/analytics/payment-periods/', paymentPeriodForm);
      console.log('✅ Payment period created:', response.data);
      toast.success('Payment period created successfully!');
      setShowPaymentPeriodModal(false);
      resetPaymentPeriodForm();
      await fetchData();
      await fetchPaymentPeriods();
      toast.info('Payment periods refreshed. You can now create fee structures.');
    } catch (error) {
      console.error('❌ Failed to create payment period:', error);
      toast.error(error.response?.data?.error || 'Failed to create payment period');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPaymentPeriod = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.put(`/analytics/payment-periods/${selectedItem?.id}/`, paymentPeriodForm);
      console.log('✅ Payment period updated:', response.data);
      toast.success('Payment period updated successfully!');
      setShowEditPaymentPeriodModal(false);
      setSelectedItem(null);
      resetPaymentPeriodForm();
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to update payment period:', error);
      toast.error(error.response?.data?.error || 'Failed to update payment period');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaymentPeriod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment period?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/analytics/payment-periods/${id}/`);
      toast.success('Payment period deleted successfully');
      await fetchData();
      await fetchPaymentPeriods();
    } catch (error) {
      toast.error('Failed to delete payment period');
    } finally {
      setActionLoading(false);
    }
  };

  const resetPaymentPeriodForm = () => {
    setPaymentPeriodForm({
      name: '',
      period_type: 'MINUTES',
      duration_value: 3,
      description: '',
      is_active: true,
    });
  };

  // ============ SYSTEM CONFIG ============

  const updateConfig = async (data) => {
    setActionLoading(true);
    try {
      await api.post('/analytics/admin/config/update/', data);
      toast.success('Configuration updated successfully');
      setShowConfigModal(false);
      await fetchData();
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ BACKUP - FIXED ============

  const createBackup = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/analytics/admin/backup/');
      toast.success('Backup created successfully!');
      await fetchData();
      setShowBackupModal(false);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error(error.response?.data?.error || 'Failed to create backup');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ PROCTORING ============

  const fetchProctorImages = async (attemptId) => {
    try {
        console.log(`🔄 Fetching images for attempt: ${attemptId}`);
        const response = await api.get(`/proctoring/sessions/${attemptId}/images/`);
        console.log('✅ Images response:', response.data);
        const data = response.data;
        if (data && data.images) {
            setProctorImages(data.images);
        } else if (Array.isArray(data)) {
            setProctorImages(data);
        } else {
            setProctorImages([]);
        }
    } catch (error) {
        console.error('❌ Failed to fetch images:', error);
        setProctorImages([]);
        toast.error('Failed to load proctoring images');
    }
  };

  const handleProctorSessionClick = (session) => {
    console.log('🔍 Session clicked:', session);
    setSelectedProctorSession(session);
    setProctorImages([]);
    
    const attemptId = session.attempt || session.id;
    if (attemptId) {
        fetchProctorImages(attemptId);
    } else {
        toast.error('No attempt found for this session');
    }
    setShowProctoringDetailModal(true);
  };

  // ============ FILTERS ============

  const getFilteredData = () => {
    if (activeTab === 'users') {
      return users.filter(u =>
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'courses') {
      return courses.filter(c =>
        (c.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.course_code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'payments') {
      return payments.filter(p =>
        (p.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.transaction_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'fee-structures') {
      return feeStructures.filter(f =>
        (f.department_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (f.payment_period_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'banks') {
      return banks.filter(b =>
        (b.bank_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (b.account_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'departments') {
      return departments.filter(d =>
        (d.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (d.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'payment-periods') {
      return paymentPeriods.filter(p =>
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    return [];
  };

  const filteredData = getFilteredData();

  // ============ RENDER HELPERS ============

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#dcfce7', color: '#16a34a' }}>
        <CheckCircle size={14} style={{ marginRight: '4px' }} />
        Active
      </span>
    ) : (
      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fee2e2', color: '#dc2626' }}>
        <XCircle size={14} style={{ marginRight: '4px' }} />
        Inactive
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={14} /> Verified</span>;
      case 'REJECTED':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fee2e2', color: '#dc2626' }}><XCircle size={14} /> Rejected</span>;
      case 'PENDING':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fef3c7', color: '#d97706' }}><Clock size={14} /> Pending</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      'STUDENT': { bg: '#dbeafe', color: '#2563eb' },
      'TEACHER': { bg: '#ede9fe', color: '#7c3aed' },
      'ADMIN': { bg: '#fee2e2', color: '#dc2626' },
      'FINANCE': { bg: '#dcfce7', color: '#16a34a' },
      'REGISTRAR': { bg: '#fef3c7', color: '#d97706' },
      'DEPT_HEAD': { bg: '#fce4ec', color: '#d81b60' },
    };
    const style = colors[role] || { bg: '#f3f4f6', color: '#6b7280' };
    return <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: style.bg, color: style.color }}>{role}</span>;
  };

  const getDepartmentOptions = () => {
    return departments.map(d => (
      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
    ));
  };

  const getPaymentPeriodOptions = () => {
    return paymentPeriods.map(p => (
      <option key={p.id} value={p.id}>{p.name} ({p.duration_value} {p.period_type?.toLowerCase()})</option>
    ));
  };

  const getInstructorOptions = () => {
    return users.filter(u => u.role === 'TEACHER' || u.role === 'DEPT_HEAD').map(u => (
      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
    ));
  };

  // ============ SIDEBAR NAVIGATION ============

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'fee-structures', label: 'Fee Structures', icon: CreditCardIcon },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'banks', label: 'Bank Accounts', icon: Banknote },
    { id: 'payment-periods', label: 'Payment Periods', icon: Calendar },
    { id: 'payment-schedules', label: 'Payment Schedules', icon: Calendar },
    { id: 'proctoring', label: 'Proctoring', icon: Camera },
    { id: 'logs', label: 'System Logs', icon: Activity },
    { id: 'system', label: 'System Config', icon: Settings },
  ];

  // ============ LOADING STATE ============

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ MAIN RENDER ============

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-grid { grid-template-columns: 1fr !important; }
          .tabs-header { overflow-x: auto; flex-wrap: nowrap; }
          .tab-btn { white-space: nowrap; font-size: 13px; padding: 10px 14px; }
          .sidebar { transform: translateX(-100%); }
          .sidebar-open { transform: translateX(0); }
          .content { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .sidebar { transform: translateX(0); }
          .content { margin-left: 280px; }
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background: #0f172a;
          color: white;
          z-index: 1000;
          overflow-y: auto;
          transition: transform 0.3s ease;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: #1e293b; }
        .sidebar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #94a3b8;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          font-size: 14px;
        }
        .sidebar-item:hover {
          background: #1e293b;
          color: white;
        }
        .sidebar-item.active {
          background: #1e293b;
          color: #60a5fa;
          border-left-color: #60a5fa;
        }
        .sidebar-item svg { flex-shrink: 0; }
        .sidebar-logo {
          padding: 20px;
          border-bottom: 1px solid #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sidebar-logo h1 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sidebar-footer {
          position: sticky;
          bottom: 0;
          padding: 16px 20px;
          border-top: 1px solid #1e293b;
          background: #0f172a;
        }
        .content {
          flex: 1;
          padding: 24px;
          min-height: 100vh;
        }
        .mobile-toggle {
          display: none;
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 1001;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .mobile-toggle { display: block; }
          .sidebar { transform: translateX(-100%); }
          .sidebar-open { transform: translateX(0); }
          .content { margin-left: 0 !important; padding-top: 60px; }
        }
        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        .overlay.show { display: block; }
        @media (max-width: 768px) {
          .overlay.show { display: block; }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <Menu size={24} />
      </button>
      <div className={`overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Sidebar */}
      <div className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <GraduationCap size={32} style={{ color: '#60a5fa' }} />
          <h1>DEMS Admin</h1>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <p style={{ fontSize: '12px', color: '#64748b' }}>Welcome,</p>
          <p style={{ fontWeight: 600, color: 'white' }}>{user?.full_name}</p>
        </div>
        <nav style={{ padding: '8px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
            >
              <item.icon size={20} />
              {item.label}
              {item.id === 'proctoring' && proctorSessions.filter(s => s.review_status === 'FLAGGED').length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}>
                  {proctorSessions.filter(s => s.review_status === 'FLAGGED').length}
                </span>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              localStorage.removeItem('user_role');
              navigate('/login');
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.4)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="content">
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
    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
      Admin Dashboard
    </h1>
    <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
      Full system control and configuration
      {systemLocked && (
        <span style={{ display: 'block', color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
          🔒 System is LOCKED - All services are blocked
        </span>
      )}
      {!systemLocked && (
        <span style={{ display: 'block', color: '#16a34a', fontSize: '14px', marginTop: '4px' }}>
          🟢 System is UNLOCKED - All services are available
        </span>
      )}
    </p>
  </div>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {/* ✅ SYSTEM LOCK/UNLOCK TOGGLE - FIXED */}
    <button
      onClick={toggleSystemLock}
      disabled={lockLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        background: systemLocked ? '#22c55e' : '#dc2626',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: lockLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: lockLoading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!lockLoading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = systemLocked ? '0 4px 12px rgba(34,197,94,0.4)' : '0 4px 12px rgba(220,38,38,0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!lockLoading) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {lockLoading ? (
        <RefreshCw size={18} className="spinning" />
      ) : systemLocked ? (
        <Unlock size={18} />
      ) : (
        <Lock size={18} />
      )}
      {lockLoading ? 'Processing...' : systemLocked ? '🔓 Unlock System' : '🔒 Lock System'}
    </button>

    <button
      onClick={() => { setRefreshing(true); fetchData(); }}
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
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        opacity: refreshing ? 0.6 : 1,
      }}
    >
      <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
      Refresh
    </button>
    <button
      onClick={() => setShowBackupModal(true)}
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
      onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
    >
      <Database size={18} />
      Backup
    </button>
    <button
      onClick={() => setShowConfigModal(true)}
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
      onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
    >
      <Settings size={18} />
      Config
    </button>
    <button
      onClick={() => setShowCreateUserModal(true)}
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
      onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
    >
      <UserPlus size={18} />
      Add User
    </button>
  </div>
</div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }} className="stats-grid">
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', color: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalUsers || 0}</span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Total Users</span>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #22c55e' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dcfce7', color: '#22c55e' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.totalCourses || 0}</span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Courses</span>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#f59e0b' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.pendingPayments || 0}</span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Pending Payments</span>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderLeft: '4px solid #ef4444' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block' }}>{stats.flaggedExams || 0}</span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Flagged Exams</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
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
              onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
              }}
            >
              <option value="all">All</option>
              {activeTab === 'users' && (
                <>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </>
              )}
              {activeTab === 'courses' && (
                <>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                </>
              )}
            </select>
          </div>
          {(activeTab === 'users' || activeTab === 'courses') && (
            <button
              onClick={() => {
                if (activeTab === 'users') setShowCreateUserModal(true);
                else setShowCourseModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <Plus size={16} />
              Add New
            </button>
          )}
        </div>

        {/* ============ TAB CONTENT ============ */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '24px' }}>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>System Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Enrollments</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.totalEnrollments || 0}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Active Enrollments</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.activeEnrollments || 0}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Payments</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>ETB {stats.paymentTotal?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Exams</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.totalExams || 0}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Published Exams</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>{stats.publishedExams || 0}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Flagged Exams</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', margin: '4px 0 0 0' }}>{stats.flaggedExams || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB - FULL CRUD */}
            {activeTab === 'users' && (
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>User</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No users found</td></tr>
                      ) : (
                        filteredData.map((u) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
<td style={{ padding: '10px 12px', fontSize: '14px' }}>
  <div>
    <span style={{ fontWeight: 500, color: '#0f172a', display: 'block' }}>{u.full_name}</span>
    
    {u.role === 'STUDENT' ? (
      u.student_id ? (
        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
          🎓 {u.student_id}
        </span>
      ) : (
        <span style={{ fontSize: '12px', color: '#f59e0b', fontStyle: 'italic' }}>
          ⏳ ID not generated (pending Registrar)
        </span>
      )
    ) : (
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
        {u.employee_id ? `🆔 ${u.employee_id}` : `PK: ${u.id}`}
      </span>
    )}
  </div>
</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{u.email}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{getRoleBadge(u.role)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{u.department || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{getStatusBadge(u.is_active)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => { setSelectedItem(u); setUserForm({ full_name: u.full_name, phone: u.phone || '', role: u.role, is_active: u.is_active }); setShowEditUserModal(true); }}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6', transition: 'all 0.3s ease' }}
                                  title="Edit User"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => toggleUserStatus(u.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: u.is_active ? '#fee2e2' : '#dcfce7', color: u.is_active ? '#dc2626' : '#22c55e', opacity: actionLoading ? 0.6 : 1 }}
                                  title={u.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {u.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COURSES TAB */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Code</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Title</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Students</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No courses found</td></tr>
                      ) : (
                        filteredData.map((c) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{c.course_code}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a' }}>{c.title}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{c.department_name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{c.enrolled_count || 0}/{c.capacity}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              {c.is_approved ? (
                                <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#dcfce7', color: '#16a34a' }}>Approved</span>
                              ) : (
                                <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fef3c7', color: '#d97706' }}>Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => { setSelectedItem(c); setCourseForm({ course_code: c.course_code, title: c.title, description: c.description || '', credit_hours: c.credit_hours || 3, semester: c.semester || '1', capacity: c.capacity || 30, department: c.department || '', instructor: c.instructor || '', is_active: c.is_active, is_approved: c.is_approved }); setShowCourseModal(true); }}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6' }}
                                  title="Edit Course"
                                >
                                  <Edit size={16} />
                                </button>
                                {!c.is_approved && (
                                  <button
                                    onClick={() => handleApproveCourse(c.id)}
                                    disabled={actionLoading}
                                    style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#dcfce7', color: '#22c55e', opacity: actionLoading ? 0.6 : 1 }}
                                    title="Approve Course"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCourse(c.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                                  title="Delete Course"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB - VIEW ONLY */}
            {activeTab === 'payments' && (
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Transaction</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No payments found</td></tr>
                      ) : (
                        filteredData.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div>
                                <span style={{ fontWeight: 500, color: '#0f172a', display: 'block' }}>{p.student_name || 'Unknown'}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {p.student_id || '—'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{p.transaction_id}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>ETB {p.amount?.toFixed(2) || '0.00'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{getPaymentStatusBadge(p.status)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#64748b' }}>{p.uploaded_at ? new Date(p.uploaded_at).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              {p.receipt_image && (
                                <button
                                  onClick={() => window.open(p.receipt_image, '_blank')}
                                  style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6', fontSize: '12px' }}
                                >
                                  <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FEE STRUCTURES TAB - FULL CRUD */}
            {activeTab === 'fee-structures' && (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Fee Structures</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {feeStructures.length} fee structures found
                    </p>
                  </div>
                  <button
                    onClick={() => { 
                      setShowFeeStructureModal(true);
                      fetchPaymentPeriods();
                      fetchDepartmentsForModal();
                    }}
                    style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Fee Structure
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Payment Period</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Amount (ETB)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Grace Period</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeStructures.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No fee structures found</td></tr>
                      ) : (
                        feeStructures.map((fs) => (
                          <tr key={fs.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{fs.department_name || fs.department?.name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{fs.payment_period_name || fs.payment_period?.name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>ETB {parseFloat(fs.amount || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{fs.grace_period_days || 0} days</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{fs.is_active ? getStatusBadge(true) : getStatusBadge(false)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => { 
                                    setSelectedItem(fs); 
                                    setFeeStructureForm({
                                      department: fs.department?.id || '',
                                      payment_period: fs.payment_period?.id || '',
                                      amount: fs.amount || '',
                                      penalty_per_day: fs.penalty_per_day || 10,
                                      grace_period_days: fs.grace_period_days || 10,
                                      is_active: fs.is_active !== undefined ? fs.is_active : true,
                                    });
                                    setShowEditFeeStructureModal(true);
                                  }}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6' }}
                                  title="Edit Fee Structure"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFeeStructure(fs.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                                  title="Delete Fee Structure"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DEPARTMENTS TAB - FULL CRUD */}
            {activeTab === 'departments' && (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Departments</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{departments.length} departments found</p>
                  </div>
                  <button
                    onClick={() => setShowDepartmentModal(true)}
                    style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Department
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Code</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Head</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No departments found</td></tr>
                      ) : (
                        departments.map((d) => (
                          <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{d.name}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}><span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{d.code}</span></td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{d.head_name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => { setSelectedItem(d); setDepartmentForm({ name: d.name, code: d.code, description: d.description || '', head: d.head || '', established_year: d.established_year || '' }); setShowDepartmentModal(true); }}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6' }}
                                  title="Edit Department"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteDepartment(d.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                                  title="Delete Department"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

           {/* ============ BANKS TAB - FIXED ============ */}
{activeTab === 'banks' && (
  <div>
    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Bank Accounts</h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
          {banks.length} bank accounts configured
          <button
            onClick={async () => {
              try {
                const res = await api.get('/analytics/banks/');
                let data = res.data;
                if (data && data.results) data = data.results;
                if (!Array.isArray(data)) data = [];
                setBanks(data);
                toast.success('Banks refreshed');
                console.log('✅ Banks refreshed:', data);
              } catch (e) {
                console.error('❌ Failed to refresh banks:', e);
                toast.error('Failed to refresh banks');
              }
            }}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </p>
      </div>
      <button
        onClick={() => setShowBankModal(true)}
        style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Plus size={16} /> Add Bank
      </button>
    </div>
    <div style={{ overflowX: 'auto' }}>
      {banks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Banknote size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No bank accounts found.</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Click "Add Bank" to configure one.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Bank Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Account Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Account Number</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{bank.bank_name}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{bank.account_name}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{bank.account_number}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px' }}>{bank.is_active ? getStatusBadge(true) : getStatusBadge(false)}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => { 
                        setSelectedItem(bank); 
                        setBankForm({
                          bank_name: bank.bank_name,
                          account_name: bank.account_name,
                          account_number: bank.account_number,
                          branch_name: bank.branch_name || '',
                          swift_code: bank.swift_code || '',
                          is_active: bank.is_active !== undefined ? bank.is_active : true,
                          is_default: bank.is_default || false,
                        });
                        setShowEditBankModal(true);
                      }}
                      style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6' }}
                      title="Edit Bank"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBank(bank.id)}
                      disabled={actionLoading}
                      style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                      title="Delete Bank"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
)}

            {/* PAYMENT PERIODS TAB */}
            {activeTab === 'payment-periods' && (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Payment Periods</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {paymentPeriods.length} payment periods configured
                      <span style={{ marginLeft: '8px', color: '#2563eb' }}>⏱️ Dynamic Durations</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentPeriodModal(true);
                      fetchPaymentPeriods();
                    }}
                    style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Payment Period
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPeriods.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No payment periods found</td></tr>
                      ) : (
                        paymentPeriods.map((period) => (
                          <tr key={period.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{period.name}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                background: period.period_type === 'MINUTES' ? '#fef3c7' : '#dbeafe',
                                color: period.period_type === 'MINUTES' ? '#d97706' : '#2563eb',
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                {period.period_type === 'MINUTES' ? '⏱️' :
                                 period.period_type === 'HOURS' ? '🕐' :
                                 period.period_type === 'DAYS' ? '📅' :
                                 period.period_type === 'WEEKS' ? '📆' : '📅'}
                                {period.duration_value} {period.period_type?.toLowerCase()}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{period.is_active ? getStatusBadge(true) : getStatusBadge(false)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => { 
                                    setSelectedItem(period); 
                                    setPaymentPeriodForm({
                                      name: period.name,
                                      period_type: period.period_type || 'MINUTES',
                                      duration_value: period.duration_value || 3,
                                      description: period.description || '',
                                      is_active: period.is_active !== undefined ? period.is_active : true,
                                    });
                                    setShowEditPaymentPeriodModal(true);
                                  }}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6' }}
                                  title="Edit Payment Period"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePaymentPeriod(period.id)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#fee2e2', color: '#dc2626', opacity: actionLoading ? 0.6 : 1 }}
                                  title="Delete Payment Period"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

{/* PAYMENT SCHEDULES TAB - WITH BATCH PROCESSING */}
{activeTab === 'payment-schedules' && (
  <div>
    {/* Batch Controls */}
    <div style={{
      background: batchMode ? '#f0fdf4' : '#f8fafc',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '16px',
      border: batchMode ? '2px solid #22c55e' : '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      {batchMode ? (
        <>
          <span style={{ fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} /> Batch Mode
          </span>
          <button
            onClick={() => {
              setBatchMode(false);
              setSelectedSchedules([]);
              setSelectAllSchedules(false);
            }}
            style={{
              padding: '6px 14px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <X size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Exit
          </button>
          <button
            onClick={toggleSelectAllSchedules}
            style={{
              padding: '6px 14px',
              background: '#eff6ff',
              color: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {selectAllSchedules ? 'Deselect All' : 'Select All'}
          </button>
          <span style={{
            background: '#2563eb',
            color: 'white',
            padding: '2px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {selectedSchedules.length} selected
          </span>
          
{/* Batch Action Dropdown - UPDATE THIS */}
<select
  value={batchAction}
  onChange={(e) => setBatchAction(e.target.value)}
  style={{
    padding: '6px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    background: 'white',
  }}
>
  <option value="delete">🗑️ Delete</option>
  <option value="lock">🔒 Lock</option>
  <option value="unlock">🔓 Unlock</option>
  <option value="paid">✅ Mark as Paid</option>
  <option value="pending">⏳ Mark as Pending</option>
  <option value="overdue">⚠️ Mark as Overdue</option>
</select>
          
          {/* Reason input for batch actions */}
          <input
            type="text"
            placeholder="Reason (optional)"
            value={batchReason}
            onChange={(e) => setBatchReason(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              minWidth: '150px',
            }}
          />
         {/* Execute Batch Action Button - REPLACE THIS ENTIRE BLOCK */}
<button
  onClick={() => {
    if (batchAction === 'delete') {
      handleBatchDeleteSchedules();
    } else if (batchAction === 'lock' || batchAction === 'unlock' || batchAction === 'paid' || batchAction === 'pending' || batchAction === 'overdue') {
      handleBatchLockSchedules();
    } else {
      handleBatchUpdateStatus();
    }
  }}
  disabled={selectedSchedules.length === 0 || batchProcessing}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    background: (selectedSchedules.length === 0 || batchProcessing) ? '#94a3b8' : 
      batchAction === 'delete' ? '#dc2626' :
      batchAction === 'lock' ? '#d97706' :
      batchAction === 'unlock' ? '#22c55e' :
      batchAction === 'paid' ? '#16a34a' : '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: (selectedSchedules.length === 0 || batchProcessing) ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    opacity: (selectedSchedules.length === 0 || batchProcessing) ? 0.6 : 1,
  }}
>
  {batchProcessing ? (
    <><RefreshCw size={16} className="spinning" /> Processing...</>
  ) : (
    <>
      {batchAction === 'delete' && <Trash2 size={16} />}
      {batchAction === 'lock' && <Lock size={16} />}
      {batchAction === 'unlock' && <Unlock size={16} />}
      {batchAction === 'paid' && <CheckCircle size={16} />}
      {batchAction === 'pending' && <Clock size={16} />}
      {batchAction === 'overdue' && <AlertTriangle size={16} />}
      Run Batch
    </>
  )}
</button> 

        </>
      ) : (
        <>
          <span style={{ fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} /> Batch Actions
          </span>
          <button
            onClick={() => setBatchMode(true)}
            style={{
              padding: '6px 14px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Square size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Select Multiple
          </button>
          <button
            onClick={() => {
              fetchDepartmentsForModal();
              setShowGenerateScheduleModal(true);
            }}
            style={{
              padding: '6px 14px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Generate Schedules
          </button>
        </>
      )}
    </div>
    
    {/* Payment Schedules Table */}
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            {/* Batch Mode Checkbox Column */}
            {batchMode && (
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectAllSchedules}
                  onChange={toggleSelectAllSchedules}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
              </th>
            )}
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Period</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Due Date</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paymentSchedules.length === 0 ? (
            <tr><td colSpan={batchMode ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No payment schedules found</td></tr>
          ) : (
            paymentSchedules.map((schedule) => {
              const isSelected = selectedSchedules.includes(schedule.id);
              const amount = parseFloat(schedule.amount) || 0;
              
              return (
                <tr 
                  key={schedule.id} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    background: isSelected ? '#eff6ff' : 'white',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                >
                  {/* Batch Mode Checkbox */}
                  {batchMode && (
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleScheduleSelection(schedule.id)}
                        disabled={schedule.status === 'PAID'}
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          cursor: schedule.status === 'PAID' ? 'not-allowed' : 'pointer',
                          accentColor: '#2563eb',
                          opacity: schedule.status === 'PAID' ? 0.5 : 1,
                        }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{schedule.student_name || 'Unknown'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>{schedule.department_name || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '14px', color: '#475569' }}>#{schedule.period_number}</td>
                  <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>ETB {amount.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', fontSize: '14px', color: schedule.days_overdue > 0 ? '#dc2626' : '#475569' }}>
                    {schedule.due_date ? new Date(schedule.due_date).toLocaleString() : '—'}
                    {schedule.days_overdue > 0 && schedule.status !== 'PAID' && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#dc2626' }}>
                        {Math.round(schedule.days_overdue)} days overdue
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                    {schedule.status === 'PAID' ? (
                      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#dcfce7', color: '#16a34a' }}>
                        <CheckCircle size={14} style={{ marginRight: '4px' }} /> Paid
                      </span>
                    ) : schedule.status === 'LOCKED' ? (
                      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fee2e2', color: '#dc2626' }}>
                        <Lock size={14} style={{ marginRight: '4px' }} /> Locked
                      </span>
                    ) : schedule.status === 'OVERDUE' ? (
                      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fee2e2', color: '#dc2626' }}>
                        <AlertTriangle size={14} style={{ marginRight: '4px' }} /> Overdue
                      </span>
                    ) : schedule.status === 'PARTIAL' ? (
                      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fef3c7', color: '#d97706' }}>
                        <Clock size={14} style={{ marginRight: '4px' }} /> Partial
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#fef3c7', color: '#d97706' }}>
                        <Clock size={14} style={{ marginRight: '4px' }} /> {schedule.status || 'Pending'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!batchMode && (
                        <>
                          <button
                            onClick={() => handleDeletePaymentSchedule(schedule.id)}
                            disabled={actionLoading || schedule.status === 'PAID'}
                            style={{ 
                              padding: '6px', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: (actionLoading || schedule.status === 'PAID') ? 'not-allowed' : 'pointer',
                              background: schedule.status === 'PAID' ? '#e2e8f0' : '#fee2e2',
                              color: schedule.status === 'PAID' ? '#94a3b8' : '#dc2626',
                              opacity: (actionLoading || schedule.status === 'PAID') ? 0.6 : 1,
                            }}
                            title={schedule.status === 'PAID' ? 'Cannot delete paid schedule' : 'Delete Schedule'}
                          >
                            <Trash2 size={16} />
                          </button>
                          {schedule.status !== 'PAID' && schedule.status !== 'LOCKED' && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/analytics/payment-schedules/${schedule.id}/lock/`);
                                  toast.success('Schedule locked');
                                  await fetchData();
                                } catch (e) {
                                  toast.error('Failed to lock');
                                }
                              }}
                              style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#fef3c7', color: '#d97706' }}
                              title="Lock Schedule"
                            >
                              <Lock size={16} />
                            </button>
                          )}
                          {schedule.status === 'LOCKED' && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/analytics/payment-schedules/${schedule.id}/unlock/`);
                                  toast.success('Schedule unlocked');
                                  await fetchData();
                                } catch (e) {
                                  toast.error('Failed to unlock');
                                }
                              }}
                              style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#dcfce7', color: '#16a34a' }}
                              title="Unlock Schedule"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                        </>
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
    {/* ============ BATCH RESULTS MODAL - ADD THIS ============ */}
{showBatchResultsModal && batchResults && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={() => setShowBatchResultsModal(false)}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={24} color="#22c55e" />
          Batch Processing Results
        </h2>
        <button onClick={() => setShowBatchResultsModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
      </div>
      
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{batchResults.total}</h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total</p>
        </div>
        <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', margin: 0 }}>{batchResults.deleted || batchResults.updated || batchResults.locked || 0}</h3>
          <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
            {batchResults.deleted ? '✅ Deleted' : 
             batchResults.locked ? '🔒 Locked' : 
             batchResults.unlocked ? '🔓 Unlocked' : '✅ Updated'}
          </p>
        </div>
        <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', margin: 0 }}>{batchResults.failed || 0}</h3>
          <p style={{ fontSize: '12px', color: '#991b1b', margin: 0 }}>❌ Failed</p>
        </div>
        <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', margin: 0 }}>
            {batchResults.unlocked || 0}
          </h3>
          <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>🔓 Unlocked</p>
        </div>
      </div>
      
      {/* Details List */}
      {batchResults.details && batchResults.details.length > 0 && (
        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ID</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.details.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }}>{item.id}</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>
                    {item.success ? (
                      <span style={{ color: '#16a34a' }}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {item.status || 'Success'}
                        {item.action && ` (${item.action})`}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>
                        <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {item.error || 'Failed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <button
        onClick={() => setShowBatchResultsModal(false)}
        style={{
          width: '100%',
          marginTop: '16px',
          padding: '12px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  </div>
)}
    {/* Schedules Count */}
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
      <span>Total: {paymentSchedules.length} schedules</span>
      <span>
        Paid: {paymentSchedules.filter(s => s.status === 'PAID').length} | 
        Locked: {paymentSchedules.filter(s => s.status === 'LOCKED').length} | 
        Overdue: {paymentSchedules.filter(s => s.status === 'OVERDUE').length} | 
        Pending: {paymentSchedules.filter(s => s.status === 'PENDING' || s.status === 'PARTIAL').length}
        {batchMode && selectedSchedules.length > 0 && (
          <span style={{ marginLeft: '12px', color: '#2563eb', fontWeight: 600 }}>
            | {selectedSchedules.length} selected
          </span>
        )}
      </span>
    </div>
  </div>
)}
            {/* PROCTORING TAB */}
            {activeTab === 'proctoring' && (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Proctoring Review</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {proctorSessions.filter(s => s.review_status === 'FLAGGED').length} flagged, {proctorSessions.filter(s => s.review_status === 'PENDING').length} pending review
                    </p>
                  </div>
                </div>

                {proctorSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No proctoring sessions available</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {proctorSessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleProctorSessionClick(session)}
                        style={{
                          background: 'white',
                          border: `2px solid ${session.review_status === 'FLAGGED' ? '#dc2626' : session.review_status === 'REVIEWED' ? '#22c55e' : '#f59e0b'}`,
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{session.student_name || 'Unknown Student'}</p>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{session.exam_title || 'Unknown Exam'}</p>
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
                        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                          <span>Captures: {session.total_captures || 0}</span>
                          <span>Suspicious: {session.suspicious_events || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SYSTEM LOGS TAB */}
            {activeTab === 'logs' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>System Logs</h3>
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all logs?')) {
                        api.post('/analytics/admin/logs/clear/').then(() => fetchData());
                      }
                    }}
                    style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Clear Logs
                  </button>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {systemLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No logs available</div>
                  ) : (
                    systemLogs.map((log) => (
                      <div key={log.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div>
                          <span style={{ fontWeight: 500, color: '#0f172a' }}>{log.action}</span>
                          <span style={{ color: '#64748b', marginLeft: '8px' }}>by {log.user || 'System'}</span>
                          <span style={{
                            display: 'inline-flex',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 500,
                            marginLeft: '8px',
                            background: log.log_level === 'ERROR' ? '#fee2e2' : log.log_level === 'WARNING' ? '#fef3c7' : '#dcfce7',
                            color: log.log_level === 'ERROR' ? '#dc2626' : log.log_level === 'WARNING' ? '#d97706' : '#16a34a',
                          }}>
                            {log.log_level || 'INFO'}
                          </span>
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SYSTEM CONFIG TAB */}
            {activeTab === 'system' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>System Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>System Status</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: systemConfig.system_open ? '#16a34a' : '#dc2626', margin: '4px 0 0 0' }}>
                      {systemConfig.system_open ? '🟢 Open' : '🔴 Closed'}
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Maintenance Mode</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: systemConfig.maintenance_mode ? '#f59e0b' : '#64748b', margin: '4px 0 0 0' }}>
                      {systemConfig.maintenance_mode ? '🟡 On' : '⚪ Off'}
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Session Timeout</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '4px 0 0 0' }}>{systemConfig.session_timeout} minutes</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ============ CREATE USER MODAL - WITH PASSWORD VISIBILITY ============ */}
      {showCreateUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateUserModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Create User</h2>
              <button onClick={() => { setShowCreateUserModal(false); resetUserForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Email *</label>
                <input type="email" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Phone</label>
                <input type="text" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              </div>
              
              {/* PASSWORD WITH VISIBILITY TOGGLE */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength="8"
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showCreatePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Minimum 8 characters</p>
              </div>

              {/* CONFIRM PASSWORD WITH VISIBILITY TOGGLE */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={userForm.confirm_password}
                    onChange={(e) => setUserForm({ ...userForm, confirm_password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Role *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="FINANCE">Finance Officer</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="DEPT_HEAD">Department Head</option>
                </select>
              </div>
              
              {userForm.role === 'STUDENT' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department *</label>
                  <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                    value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {getDepartmentOptions()}
                  </select>
                </div>
              )}
              
              {userForm.role === 'DEPT_HEAD' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Head of Department *</label>
                  <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                    value={userForm.headed_department} onChange={(e) => setUserForm({ ...userForm, headed_department: e.target.value })}>
                    <option value="">Select Department</option>
                    {getDepartmentOptions()}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowCreateUserModal(false); resetUserForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

      {/* ============ EDIT USER MODAL ============ */}
      {showEditUserModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Edit User</h2>
              <button onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Phone</label>
                <input type="text" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Role</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="FINANCE">Finance Officer</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="DEPT_HEAD">Department Head</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={userForm.is_active !== undefined ? userForm.is_active : true}
                    onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })} />
                  Active Account
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ REST OF MODALS (Course, Department, Fee Structure, Bank, etc.) ============ */}
      {/* All other modals remain the same as before */}
      {/* They are omitted here for brevity but should be included */}

 

      {/* ============ ALL MODALS ============ */}


      {/* EDIT USER MODAL */}
      {showEditUserModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Edit User</h2>
              <button onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Phone</label>
                <input type="text" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Role</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="FINANCE">Finance Officer</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="DEPT_HEAD">Department Head</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={userForm.is_active !== undefined ? userForm.is_active : true}
                    onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })} />
                  Active Account
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowEditUserModal(false); setSelectedItem(null); resetUserForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowCourseModal(false); setSelectedItem(null); resetCourseForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{selectedItem ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={() => { setShowCourseModal(false); setSelectedItem(null); resetCourseForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={selectedItem ? handleEditCourse : handleCreateCourse}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Course Code *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={courseForm.course_code} onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value.toUpperCase() })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Course Title *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea rows="3" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                  value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Credit Hours</label>
                  <input type="number" min="1" max="6" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={courseForm.credit_hours} onChange={(e) => setCourseForm({ ...courseForm, credit_hours: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Semester</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                    value={courseForm.semester} onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Capacity</label>
                  <input type="number" min="1" max="200" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={courseForm.capacity} onChange={(e) => setCourseForm({ ...courseForm, capacity: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                    value={courseForm.department} onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Instructor</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}>
                  <option value="">Select Instructor</option>
                  {getInstructorOptions()}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={courseForm.is_active}
                    onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })} />
                  Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={courseForm.is_approved}
                    onChange={(e) => setCourseForm({ ...courseForm, is_approved: e.target.checked })} />
                  Approved
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowCourseModal(false); setSelectedItem(null); resetCourseForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Saving...' : selectedItem ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDepartmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowDepartmentModal(false); setSelectedItem(null); resetDepartmentForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{selectedItem ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => { setShowDepartmentModal(false); setSelectedItem(null); resetDepartmentForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={selectedItem ? handleEditDepartment : handleCreateDepartment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department Code *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={departmentForm.code} onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea rows="3" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                  value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department Head</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={departmentForm.head} onChange={(e) => setDepartmentForm({ ...departmentForm, head: e.target.value })}>
                  <option value="">Select Head</option>
                  {users.filter(u => u.role === 'DEPT_HEAD').map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowDepartmentModal(false); setSelectedItem(null); resetDepartmentForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Saving...' : selectedItem ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FEE STRUCTURE MODAL */}
      {showFeeStructureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowFeeStructureModal(false); resetFeeStructureForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Add Fee Structure</h2>
              <button onClick={() => { setShowFeeStructureModal(false); resetFeeStructureForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleCreateFeeStructure}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={feeStructureForm.department} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Payment Period *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={feeStructureForm.payment_period} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, payment_period: e.target.value })}>
                  <option value="">Select Payment Period</option>
                  {paymentPeriods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Amount (ETB) *</label>
                <input type="number" required step="0.01" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={feeStructureForm.amount} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, amount: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Penalty/Day (ETB)</label>
                  <input type="number" step="0.01" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={feeStructureForm.penalty_per_day} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, penalty_per_day: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Grace Period (days)</label>
                  <input type="number" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={feeStructureForm.grace_period_days} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, grace_period_days: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={feeStructureForm.is_active}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowFeeStructureModal(false); resetFeeStructureForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Creating...' : 'Create Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FEE STRUCTURE MODAL */}
      {showEditFeeStructureModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowEditFeeStructureModal(false); setSelectedItem(null); resetFeeStructureForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Edit Fee Structure</h2>
              <button onClick={() => { setShowEditFeeStructureModal(false); setSelectedItem(null); resetFeeStructureForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleEditFeeStructure}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={feeStructureForm.department} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Payment Period *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={feeStructureForm.payment_period} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, payment_period: e.target.value })}>
                  <option value="">Select Payment Period</option>
                  {paymentPeriods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Amount (ETB) *</label>
                <input type="number" required step="0.01" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={feeStructureForm.amount} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, amount: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Penalty/Day (ETB)</label>
                  <input type="number" step="0.01" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={feeStructureForm.penalty_per_day} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, penalty_per_day: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Grace Period (days)</label>
                  <input type="number" min="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                    value={feeStructureForm.grace_period_days} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, grace_period_days: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={feeStructureForm.is_active}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowEditFeeStructureModal(false); setSelectedItem(null); resetFeeStructureForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Updating...' : 'Update Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BANK MODAL */}
      {showBankModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowBankModal(false); resetBankForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Add Bank Account</h2>
              <button onClick={() => { setShowBankModal(false); resetBankForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleCreateBank}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Bank Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Account Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Account Number *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Branch Name</label>
                <input type="text" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.branch_name} onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={bankForm.is_active}
                    onChange={(e) => setBankForm({ ...bankForm, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={bankForm.is_default}
                    onChange={(e) => setBankForm({ ...bankForm, is_default: e.target.checked })} />
                  Set as Default
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowBankModal(false); resetBankForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Creating...' : 'Add Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BANK MODAL */}
      {showEditBankModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowEditBankModal(false); setSelectedItem(null); resetBankForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Edit Bank Account</h2>
              <button onClick={() => { setShowEditBankModal(false); setSelectedItem(null); resetBankForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={handleEditBank}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Bank Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Account Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Account Number *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Branch Name</label>
                <input type="text" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={bankForm.branch_name} onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={bankForm.is_active}
                    onChange={(e) => setBankForm({ ...bankForm, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={bankForm.is_default}
                    onChange={(e) => setBankForm({ ...bankForm, is_default: e.target.checked })} />
                  Set as Default
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowEditBankModal(false); setSelectedItem(null); resetBankForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Updating...' : 'Update Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT PERIOD MODAL */}
      {showPaymentPeriodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => { setShowPaymentPeriodModal(false); resetPaymentPeriodForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={24} style={{ color: '#2563eb' }} /> Add Payment Period
              </h2>
              <button onClick={() => { setShowPaymentPeriodModal(false); resetPaymentPeriodForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.3s ease' }}>×</button>
            </div>
            <form onSubmit={handleCreatePaymentPeriod}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={paymentPeriodForm.name} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, name: e.target.value })} placeholder="e.g., TEST - 3 Minutes" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Period Type *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={paymentPeriodForm.period_type} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, period_type: e.target.value })}>
                  <option value="MINUTES">⏱️ Minutes (For Testing)</option>
                  <option value="HOURS">🕐 Hours</option>
                  <option value="DAYS">📅 Days</option>
                  <option value="WEEKS">📆 Weeks</option>
                  <option value="MONTHS">📅 Months</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Duration Value *</label>
                <input type="number" required min="1" max="365" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={paymentPeriodForm.duration_value} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, duration_value: parseInt(e.target.value) || 1 })} />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  {paymentPeriodForm.period_type === 'MINUTES' ? `⏱️ Students will have ${paymentPeriodForm.duration_value} minute(s) to pay` :
                    paymentPeriodForm.period_type === 'HOURS' ? `⏱️ Students will have ${paymentPeriodForm.duration_value} hour(s) to pay` :
                    paymentPeriodForm.period_type === 'DAYS' ? `📅 Students will have ${paymentPeriodForm.duration_value} day(s) to pay` :
                    paymentPeriodForm.period_type === 'WEEKS' ? `📅 Students will have ${paymentPeriodForm.duration_value} week(s) to pay` :
                    `📅 Students will have ${paymentPeriodForm.duration_value} month(s) to pay`}
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea rows="3" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                  value={paymentPeriodForm.description} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, description: e.target.value })} placeholder="Describe this payment period..." />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={paymentPeriodForm.is_active} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, is_active: e.target.checked })} /> Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowPaymentPeriodModal(false); resetPaymentPeriodForm(); }} style={{ flex: 1, padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: actionLoading ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Creating...' : 'Add Payment Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT PERIOD MODAL */}
      {showEditPaymentPeriodModal && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => { setShowEditPaymentPeriodModal(false); setSelectedItem(null); resetPaymentPeriodForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={24} style={{ color: '#2563eb' }} /> Edit Payment Period
              </h2>
              <button onClick={() => { setShowEditPaymentPeriodModal(false); setSelectedItem(null); resetPaymentPeriodForm(); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.3s ease' }}>×</button>
            </div>
            <form onSubmit={handleEditPaymentPeriod}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Name *</label>
                <input type="text" required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={paymentPeriodForm.name} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, name: e.target.value })} placeholder="e.g., TEST - 3 Minutes" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Period Type *</label>
                <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                  value={paymentPeriodForm.period_type} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, period_type: e.target.value })}>
                  <option value="MINUTES">⏱️ Minutes (For Testing)</option>
                  <option value="HOURS">🕐 Hours</option>
                  <option value="DAYS">📅 Days</option>
                  <option value="WEEKS">📆 Weeks</option>
                  <option value="MONTHS">📅 Months</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Duration Value *</label>
                <input type="number" required min="1" max="365" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  value={paymentPeriodForm.duration_value} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, duration_value: parseInt(e.target.value) || 1 })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea rows="3" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                  value={paymentPeriodForm.description} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, description: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={paymentPeriodForm.is_active} onChange={(e) => setPaymentPeriodForm({ ...paymentPeriodForm, is_active: e.target.checked })} /> Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowEditPaymentPeriodModal(false); setSelectedItem(null); resetPaymentPeriodForm(); }} style={{ flex: 1, padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: actionLoading ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Updating...' : 'Update Payment Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE PAYMENT SCHEDULES MODAL */}
      {showGenerateScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowGenerateScheduleModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Calendar size={24} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} /> Generate Payment Schedules
              </h2>
              <button onClick={() => { setShowGenerateScheduleModal(false); setSelectedDepartmentForSchedule(''); }} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>This will generate payment schedules for all enrolled students in the selected department.</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Department *</label>
              <select required style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}
                value={selectedDepartmentForSchedule} onChange={(e) => setSelectedDepartmentForSchedule(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>⚠️ This will create payment schedules for all enrolled students in the selected department. Existing schedules will be skipped.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => { setShowGenerateScheduleModal(false); setSelectedDepartmentForSchedule(''); }} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGeneratePaymentSchedules} disabled={generatingSchedules || !selectedDepartmentForSchedule} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: (generatingSchedules || !selectedDepartmentForSchedule) ? 'not-allowed' : 'pointer', background: (generatingSchedules || !selectedDepartmentForSchedule) ? '#94a3b8' : '#2563eb', color: 'white', opacity: (generatingSchedules || !selectedDepartmentForSchedule) ? 0.6 : 1 }}>
                <Calendar size={18} /> {generatingSchedules ? 'Generating...' : 'Generate Schedules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKUP MODAL */}
      {showBackupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowBackupModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Database Backup</h2>
              <button onClick={() => setShowBackupModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Creating a backup will save the current state of the database including all user data, courses, exams, payments, and system settings.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowBackupModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={createBackup} disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#22c55e', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Database size={18} /> {actionLoading ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIG MODAL */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowConfigModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>System Configuration</h2>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                system_open: formData.get('system_open') === 'on',
                maintenance_mode: formData.get('maintenance_mode') === 'on',
                payment_account: formData.get('payment_account'),
                payment_phone: formData.get('payment_phone'),
                maintenance_message: formData.get('maintenance_message'),
                session_timeout: parseInt(formData.get('session_timeout')) || 30,
                max_file_size: parseInt(formData.get('max_file_size')) || 5,
                bank_name: formData.get('bank_name'),
                account_name: formData.get('account_name'),
                payment_instructions: formData.get('payment_instructions'),
                default_payment_period: formData.get('default_payment_period'),
                default_penalty_per_day: parseFloat(formData.get('default_penalty_per_day')) || 10,
                default_grace_period: parseInt(formData.get('default_grace_period')) || 10,
                student_id_format: formData.get('student_id_format'),
              };
              updateConfig(data);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>System Status</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="system_open" defaultChecked={systemConfig.system_open} /> System Open
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Maintenance Mode</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="maintenance_mode" defaultChecked={systemConfig.maintenance_mode} /> Enable Maintenance
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Session Timeout (min)</label>
                  <input type="number" name="session_timeout" defaultValue={systemConfig.session_timeout} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Max File Size (MB)</label>
                  <input type="number" name="max_file_size" defaultValue={systemConfig.max_file_size} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Student ID Format</label>
                <input type="text" name="student_id_format" defaultValue={systemConfig.student_id_format || 'STU{year}{seq:06d}'} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Use {'{year}'} for year, {'{seq}'} for sequence number, {'{dept}'} for department code.</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Payment Account Number</label>
                <input type="text" name="payment_account" defaultValue={systemConfig.payment_account} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Payment Phone Number</label>
                <input type="text" name="payment_phone" defaultValue={systemConfig.payment_phone} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Bank Name</label>
                <input type="text" name="bank_name" defaultValue={systemConfig.bank_name || 'Commercial Bank of Ethiopia'} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Account Name</label>
                <input type="text" name="account_name" defaultValue={systemConfig.account_name || 'DEMS University'} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Default Payment Period</label>
                <select name="default_payment_period" defaultValue={systemConfig.default_payment_period || 'QUARTERLY'} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', background: 'white' }}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly (3 months)</option>
                  <option value="SEMESTER">Semester (6 months)</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Default Penalty/Day (ETB)</label>
                  <input type="number" step="0.01" name="default_penalty_per_day" defaultValue={systemConfig.default_penalty_per_day || 10} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Default Grace Period (days)</label>
                  <input type="number" name="default_grace_period" defaultValue={systemConfig.default_grace_period || 10} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Payment Instructions</label>
                <textarea name="payment_instructions" rows="3" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }} defaultValue={systemConfig.payment_instructions || 'Please make payment to the above account and upload the receipt for verification.'} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowConfigModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'none', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCTORING DETAIL MODAL */}
      {showProctoringDetailModal && selectedProctorSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowProctoringDetailModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Proctoring Session</h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{selectedProctorSession.student_name} - {selectedProctorSession.exam_title}</p>
              </div>
              <button onClick={() => setShowProctoringDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Status</p>
                <p style={{ fontSize: '16px', fontWeight: 600, margin: '4px 0 0 0' }}><span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: selectedProctorSession.review_status === 'FLAGGED' ? '#fee2e2' : selectedProctorSession.review_status === 'REVIEWED' ? '#dcfce7' : '#fef3c7', color: selectedProctorSession.review_status === 'FLAGGED' ? '#dc2626' : selectedProctorSession.review_status === 'REVIEWED' ? '#16a34a' : '#d97706' }}>{selectedProctorSession.review_status || 'PENDING'}</span></p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Captures</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '4px 0 0 0' }}>{selectedProctorSession.total_captures || 0}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Suspicious Events</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: selectedProctorSession.suspicious_events > 0 ? '#dc2626' : '#16a34a', margin: '4px 0 0 0' }}>{selectedProctorSession.suspicious_events || 0}</p>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Captured Images ({proctorImages.length})</h3>
            {proctorImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}><Camera size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} /><p>No images captured for this session</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {proctorImages.map((img) => (
                  <div key={img.id} style={{ position: 'relative', border: `2px solid ${img.is_suspicious ? '#dc2626' : '#e5e7eb'}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} onClick={() => window.open(img.image, '_blank')}>
                    <img src={img.image || 'https://via.placeholder.com/150'} alt="Proctor capture" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '4px', textAlign: 'center' }}>{img.capture_time ? new Date(img.capture_time).toLocaleTimeString() : ''}</div>
                    {img.is_suspicious && <div style={{ position: 'absolute', top: '4px', right: '4px' }}><Flag size={16} color="#dc2626" /></div>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setShowProctoringDetailModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'none', color: '#374151', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;