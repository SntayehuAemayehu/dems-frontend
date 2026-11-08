// frontend/src/pages/Finance/FinanceDashboard.jsx - COMPLETE WITH BATCH PROCESSING

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, Eye, 
  RefreshCw, FileText, Search, Filter, Download,
  AlertTriangle, FileImage, Plus, CheckSquare, Square,
  ChevronDown, ChevronUp, Send, Trash2, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // ============ STATE ============
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isUsingSampleData, setIsUsingSampleData] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // ============================================================
  // BATCH PROCESSING STATE
  // ============================================================
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [batchAction, setBatchAction] = useState('approve');
  const [batchReason, setBatchReason] = useState('');
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  
  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showBatchResultsModal, setShowBatchResultsModal] = useState(false);
  
  // Rollback Modal states
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackNotes, setRollbackNotes] = useState('');
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [selectedRollbackPayment, setSelectedRollbackPayment] = useState(null);
  
  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    rolledback: 0,
    totalAmount: 0,
    todayPayments: 0,
    weeklyPayments: 0
  });

  // ============ FETCH PAYMENTS ============
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setIsUsingSampleData(false);
      
      console.log('🔄 Fetching payments for Finance...');
      
      let paymentsData = [];
      
      try {
        const response = await api.get('/payments/proofs/');
        console.log('✅ /payments/proofs/ response:', response.data);
        
        let data = response.data;
        if (data && typeof data === 'object') {
          if (data.results && Array.isArray(data.results)) {
            paymentsData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            paymentsData = data.data;
          } else if (Array.isArray(data)) {
            paymentsData = data;
          } else {
            paymentsData = [];
          }
        }
      } catch (e) {
        console.error('❌ /payments/proofs/ failed:', e.message);
      }
      
      const processedPayments = paymentsData.length > 0 ? paymentsData.map(p => ({
        id: p.id || Math.random(),
        transaction_id: p.transaction_id || p.id || 'N/A',
        student_name: p.student_name || p.student?.user?.full_name || p.student?.full_name || 'Unknown Student',
        student_id: p.student_id || p.student?.student_id || '',
        amount: parseFloat(p.amount) || 0,
        bank_name: p.bank_name || '',
        status: p.status || 'PENDING',
        receipt_image: p.receipt_image || p.receipt_url || null,
        uploaded_at: p.uploaded_at || p.created_at || p.transaction_date || new Date().toISOString(),
        verified_by: p.verified_by?.full_name || p.verified_by_name || null,
        verified_at: p.verified_at || null,
        rejection_reason: p.rejection_reason || '',
        payment_type: p.payment_type || 'SEMESTER',
        is_rolled_back: p.is_rolled_back || false,
        rolled_back_by: p.rolled_back_by_name || p.rolled_back_by || null,
        rolled_back_at: p.rolled_back_at || null,
        rollback_reason: p.rollback_reason || '',
        original_status: p.original_status || '',
        can_rollback: p.can_rollback !== undefined ? p.can_rollback : (p.status === 'VERIFIED' || p.status === 'PENDING') && !p.is_rolled_back,
      })) : [];
      
      console.log('✅ Processed payments:', processedPayments.length);
      setPayments(processedPayments);
      setFilteredPayments(processedPayments);
      calculateStats(processedPayments);
      
      if (processedPayments.length === 0) {
        console.log('⚠️ No payment records found in database');
        toast.info('No payment records found. Click "Load Sample Data" to test.');
      }
      
      // Reset batch selection
      setSelectedPayments([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('❌ Failed to fetch payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'FINANCE' && userRole !== 'ADMIN') {
      toast.error(`Access denied. Your role is ${user?.role}. Finance only.`);
      navigate('/');
      return;
    }
    
    fetchPayments();
  }, [isAuthenticated, navigate, user, fetchPayments]);

  // ============ CALCULATE STATISTICS ============
  const calculateStats = (data) => {
    const paymentsArray = Array.isArray(data) ? data : [];
    
    const pending = paymentsArray.filter(p => p.status === 'PENDING' || p.status === 'NEED_RESUBMISSION').length;
    const verified = paymentsArray.filter(p => p.status === 'VERIFIED' && !p.is_rolled_back).length;
    const rejected = paymentsArray.filter(p => p.status === 'REJECTED').length;
    const rolledback = paymentsArray.filter(p => p.is_rolled_back).length;
    
    const totalAmount = paymentsArray.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    const today = new Date().toDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayPayments = paymentsArray.filter(p => 
      p.uploaded_at && new Date(p.uploaded_at).toDateString() === today
    ).length;
    
    const weeklyPayments = paymentsArray.filter(p => 
      p.uploaded_at && new Date(p.uploaded_at) >= weekAgo
    ).length;
    
    setStats({
      total: paymentsArray.length,
      pending,
      verified,
      rejected,
      rolledback,
      totalAmount,
      todayPayments,
      weeklyPayments
    });
  };
  // ============================================================
  // BATCH PROCESSING FUNCTIONS
  // ============================================================
  
  // Toggle selection for a single payment
  const togglePaymentSelection = (paymentId) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments([]);
      setSelectAll(false);
    } else {
      const eligibleIds = filteredPayments
        .filter(p => p.status === 'PENDING' || p.status === 'NEED_RESUBMISSION')
        .map(p => p.id);
      setSelectedPayments(eligibleIds);
      setSelectAll(true);
    }
  };

  // Get selected payment details
  const getSelectedPaymentsDetails = () => {
    return filteredPayments.filter(p => selectedPayments.includes(p.id));
  };

  // Handle batch action
  const handleBatchAction = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select at least one payment');
      return;
    }

    const selectedDetails = getSelectedPaymentsDetails();
    const pendingPayments = selectedDetails.filter(p => p.status === 'PENDING' || p.status === 'NEED_RESUBMISSION');
    
    if (pendingPayments.length === 0) {
      toast.error('Selected payments are not pending verification');
      return;
    }

    setShowBatchConfirm(true);
  };

  // Execute batch processing
  const executeBatchProcessing = async () => {
    setBatchProcessing(true);
    setShowBatchConfirm(false);
    
    try {
      const selectedDetails = getSelectedPaymentsDetails();
      const pendingPayments = selectedDetails.filter(p => p.status === 'PENDING' || p.status === 'NEED_RESUBMISSION');
      
      const results = {
        total: pendingPayments.length,
        approved: 0,
        rejected: 0,
        failed: 0,
        details: []
      };

      for (const payment of pendingPayments) {
        try {
          const payload = {
            action: batchAction,
            reason: batchAction === 'reject' ? batchReason : verificationNote
          };
          
          await api.post(`/payments/proofs/${payment.id}/verify/`, payload);
          
          if (batchAction === 'approve') {
            results.approved++;
          } else {
            results.rejected++;
          }
          
          results.details.push({
            id: payment.id,
            transaction_id: payment.transaction_id,
            student_name: payment.student_name,
            status: batchAction === 'approve' ? 'VERIFIED' : 'REJECTED',
            success: true
          });
          
        } catch (error) {
          results.failed++;
          results.details.push({
            id: payment.id,
            transaction_id: payment.transaction_id,
            student_name: payment.student_name,
            status: 'FAILED',
            success: false,
            error: error.response?.data?.error || 'Processing failed'
          });
        }
      }

      setBatchResults(results);
      setShowBatchResultsModal(true);
      
      toast.success(`Batch processing completed: ${results.approved + results.rejected} processed, ${results.failed} failed`);
      
      // Refresh data
      await fetchPayments();
      
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error('Batch processing failed');
    } finally {
      setBatchProcessing(false);
      setSelectedPayments([]);
      setSelectAll(false);
    }
  };

  // ============================================================
  // SINGLE PAYMENT VERIFY/REJECT
  // ============================================================
  
// In FinanceDashboard.jsx - handleVerifyPayment function

const handleVerifyPayment = async (paymentId, action, reason = '') => {
    setActionLoading(true);
    try {
      const payload = {
        action: action === 'approve' ? 'approve' : 'reject',
        reason: reason || (action === 'approve' ? verificationNote : rejectionReason)
      };
      
      const response = await api.post(`/payments/proofs/${paymentId}/verify/`, payload);
      
      if (action === 'approve') {
        // ✅ CHECK WHICH FLOW WAS TRIGGERED
        if (response.data.flow === 'RESTORATION') {
          toast.success(`✅ Payment verified - ALL SERVICES RESTORED for ${response.data.student_id}!`);
        } else if (response.data.flow === 'FIRST_TIME_REGISTRATION') {
          toast.success(`✅ Payment verified - Student ready for document upload!`);
        } else {
          toast.success('✅ Payment verified successfully!');
        }
      } else {
        toast.success(`Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`);
      }
      
      await fetchPayments();
      setShowVerifyModal(false);
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
      setVerificationNote('');
      setSelectedPayment(null);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setActionLoading(false);
    }
  };
  // ============ ROLLBACK PAYMENT ============
  const handleRollbackPayment = async () => {
    if (!rollbackReason.trim()) {
      toast.error('Please provide a reason for rollback');
      return;
    }
    
    setRollbackLoading(true);
    try {
      const response = await api.post(`/payments/${selectedRollbackPayment.id}/rollback/`, {
        reason: rollbackReason,
        notes: rollbackNotes,
        rollback_type: 'DEPARTMENT_CHANGE'
      });
      
      toast.success('Payment rolled back successfully!');
      setShowRollbackModal(false);
      setSelectedRollbackPayment(null);
      setRollbackReason('');
      setRollbackNotes('');
      await fetchPayments();
      
    } catch (error) {
      console.error('Failed to rollback payment:', error);
      toast.error(error.response?.data?.error || 'Failed to rollback payment');
    } finally {
      setRollbackLoading(false);
    }
  };

  // ============ VIEW RECEIPT ============
  const viewReceipt = async (payment) => {
    try {
      if (!payment.receipt_image) {
        toast.error('No receipt image available');
        return;
      }
      
      if (payment.receipt_image.startsWith('http')) {
        setReceiptImage(payment.receipt_image);
        setShowReceiptModal(true);
        return;
      }
      
      try {
        const response = await api.get(`/payments/${payment.id}/receipt/`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || 'image/jpeg' 
        });
        const url = window.URL.createObjectURL(blob);
        setReceiptImage(url);
        setShowReceiptModal(true);
      } catch (e) {
        console.warn('⚠️ Receipt fetch failed:', e);
        if (payment.receipt_image) {
          setReceiptImage(payment.receipt_image);
          setShowReceiptModal(true);
        }
      }
      
    } catch (error) {
      console.error('Failed to load receipt:', error);
      toast.error('Failed to load receipt');
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

  const filterData = (term, status, start = startDate, end = endDate) => {
    let filtered = payments;
    
    // Search Text Filter
    if (term) {
      filtered = filtered.filter(p => 
        (p.transaction_id?.toLowerCase() || '').includes(term) ||
        (p.student_name?.toLowerCase() || '').includes(term) ||
        (p.bank_name?.toLowerCase() || '').includes(term)
      );
    }
    
    // Status Filter
    if (status !== 'all') {
      filtered = filtered.filter(p => p.status === status || (status === 'ROLLED_BACK' && p.is_rolled_back));
    }

    // 👇 NEW DATE FILTER 👇
    if (start) {
      filtered = filtered.filter(p => new Date(p.uploaded_at) >= new Date(start));
    }
    if (end) {
      // Add one day to end date to include the full day
      const endDatePlusOne = new Date(end);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      filtered = filtered.filter(p => new Date(p.uploaded_at) < endDatePlusOne);
    }
    
    setFilteredPayments(filtered);
  };

  // ============ STATUS BADGE ============
  const getStatusBadge = (status, isRolledBack = false) => {
    if (isRolledBack) {
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
          <RefreshCw size={14} />
          Rolled Back
        </span>
      );
    }
    
    switch(status) {
      case 'VERIFIED':
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
            <CheckCircle size={14} />
            Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            background: '#fee2e2',
            color: '#dc2626',
          }}>
            <XCircle size={14} />
            Rejected
          </span>
        );
      case 'PENDING':
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
            <Clock size={14} />
            Pending
          </span>
        );
      case 'NEED_RESUBMISSION':
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
            <AlertTriangle size={14} />
            Resubmit
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };
    // ============ GENERATE 7-DAY REVENUE DATA ============
  const getRevenueData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: d.toDateString(),
        amount: 0
      });
    }

    // Add real data
    payments.filter(p => p.status === 'VERIFIED' && !p.is_rolled_back).forEach(p => {
      const paymentDate = new Date(p.uploaded_at).toDateString();
      const dayData = last7Days.find(d => d.fullDate === paymentDate);
      if (dayData) {
        dayData.amount += parseFloat(p.amount) || 0;
      }
    });

    const maxAmount = Math.max(...last7Days.map(d => d.amount), 1000); // Minimum scale to avoid divide by zero
    return { days: last7Days, maxAmount };
  };

  const revenueData = getRevenueData();
  // ============ EXPORT TO CSV FUNCTION ============
  const handleExport = () => {
    if (filteredPayments.length === 0) {
      toast.error('No payment data to export');
      return;
    }

    // Define headers
    const headers = ['Transaction ID', 'Student Name', 'Student ID', 'Amount (ETB)', 'Bank', 'Status', 'Date'];
    
    // Map the data
    const rows = filteredPayments.map(p => [
      `"${p.transaction_id || 'N/A'}"`,
      `"${p.student_name || 'Unknown'}"`,
      `"${p.student_id || 'N/A'}"`,
      p.amount.toFixed(2),
      `"${p.bank_name || 'N/A'}"`,
      p.status,
      new Date(p.uploaded_at).toLocaleDateString()
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DEMS_Payments_${filterStatus}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Payments exported successfully!');
  };
    // ============ IMPORT BANK CSV ============
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      
      // Assuming the bank CSV has: Transaction ID in column 1, Amount in column 2
      const transactionIds = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns[0] && columns[0].trim() !== '') {
          transactionIds.push(columns[0].trim().replace(/"/g, ''));
        }
      }

      // Find pending payments that match the imported IDs
      const matchingPayments = payments.filter(p => 
        p.status === 'PENDING' && transactionIds.includes(p.transaction_id)
      );

      if (matchingPayments.length === 0) {
        toast.error('No matching pending payments found in the uploaded file.');
        setImporting(false);
        return;
      }

      // Auto-verify them
      let successCount = 0;
      for (const payment of matchingPayments) {
        try {
          await api.post(`/payments/proofs/${payment.id}/verify/`, {
            action: 'approve',
            reason: 'Auto-verified via Bank CSV Import'
          });
          successCount++;
        } catch (err) {
          console.error('Failed to auto-verify', payment.id);
        }
      }

      toast.success(`Successfully imported and verified ${successCount} payments!`);
      setShowImportModal(false);
      setImporting(false);
      fetchPayments(); // Refresh data
    };

    reader.readAsText(file);
  };
  // ============ PRINT RECEIPT FUNCTION ============
  const handlePrintReceipt = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${payment.transaction_id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
            .title { font-size: 28px; font-weight: bold; margin-bottom: 30px; }
            .details { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .details td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .details td:first-child { font-weight: bold; color: #64748b; width: 40%; }
            .total { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: right; font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .stamp { margin-top: 30px; display: inline-block; border: 3px solid #22c55e; color: #22c55e; padding: 10px 20px; border-radius: 8px; font-weight: bold; transform: rotate(-5deg); }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🎓 DEMS University</div>
            <div>Distance Education Management System</div>
          </div>
          <div class="title">Official Payment Receipt</div>
          
          <table class="details">
            <tr><td>Transaction ID</td><td>${payment.transaction_id}</td></tr>
            <tr><td>Student Name</td><td>${payment.student_name}</td></tr>
            <tr><td>Student ID</td><td>${payment.student_id || 'N/A'}</td></tr>
            <tr><td>Payment Date</td><td>${new Date(payment.uploaded_at).toLocaleString()}</td></tr>
            <tr><td>Bank Name</td><td>${payment.bank_name || 'N/A'}</td></tr>
            <tr><td>Status</td><td><strong>${payment.status}</strong></td></tr>
          </table>
          
          <div class="total">
            Total Amount Paid: ETB ${payment.amount.toFixed(2)}
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <div class="stamp">VERIFIED</div>
          </div>

          <div class="footer">
            This is a computer-generated receipt. No signature is required.<br>
            Generated on ${new Date().toLocaleString()} by DEMS Finance System.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  // ============ LOADING STATE ============
  if (loading && payments.length === 0) {
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
        <p style={{ color: '#64748b' }}>Loading payments...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <style>{`
          @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes growUp {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
                 .premium-blue-card {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.4);
          transition: all 0.3s ease;
        }
        .premium-blue-card:hover {
          box-shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.6);
          transform: translateY(-2px);
        }
        /* This adds the subtle glowing circles inside the blue card */
        .premium-blue-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .premium-blue-card::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: 10%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        } 
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .search-filter-bar { flex-direction: column !important; }
          .payments-table-container { overflow-x: auto; }
          .action-buttons { flex-wrap: wrap !important; }
          .batch-controls { flex-direction: column !important; }
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
          }}>Finance Dashboard</h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            Manage and verify student payments
            {isUsingSampleData && (
              <span style={{
                display: 'block',
                color: '#f59e0b',
                fontSize: '14px',
                marginTop: '4px',
              }}>
                ⚠️ Using sample data (no real payment records in database)
              </span>
            )}
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={fetchPayments}
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
            onClick={handleExport} // 👈 CHANGE THIS LINE
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#8b5cf6', // Purple
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Upload size={18} />
            Import Bank CSV
          </button>

        </div>
      </div>
      {/* ============================================================ */}
      {/* 👇 NEW 3D ANIMATED STATS CARDS 👇 */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }} className="stats-grid">
        
        {/* Total Payments Card */}
        <div 
          style={{ 
            background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderLeft: '4px solid #1890ff', cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(24, 144, 255, 0.25), 0 10px 10px -5px rgba(24, 144, 255, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e6f7ff', color: '#1890ff' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{stats.total}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Total Payments</span>
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => { setFilterStatus('PENDING'); filterData(searchTerm, 'PENDING'); }}
          style={{ 
            background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderLeft: '4px solid #faad14', cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(250, 173, 20, 0.25), 0 10px 10px -5px rgba(250, 173, 20, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbe6', color: '#faad14' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{stats.pending}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pending</span>
          </div>
        </div>

        {/* Verified Card */}
        <div 
          onClick={() => { setFilterStatus('VERIFIED'); filterData(searchTerm, 'VERIFIED'); }}
          style={{ 
            background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderLeft: '4px solid #52c41a', cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(82, 196, 26, 0.25), 0 10px 10px -5px rgba(82, 196, 26, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6ffed', color: '#52c41a' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{stats.verified}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Verified</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => { setFilterStatus('REJECTED'); filterData(searchTerm, 'REJECTED'); }}
          style={{ 
            background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderLeft: '4px solid #ff4d4f', cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(255, 77, 79, 0.25), 0 10px 10px -5px rgba(255, 77, 79, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f0', color: '#ff4d4f' }}>
            <XCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{stats.rejected}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Rejected</span>
          </div>
        </div>

        {/* Rolled Back Card */}
        <div 
          onClick={() => { setFilterStatus('ROLLED_BACK'); filterData(searchTerm, 'ROLLED_BACK'); }}
          style={{ 
            background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderLeft: '4px solid #f59e0b', cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(245, 158, 11, 0.25), 0 10px 10px -5px rgba(245, 158, 11, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#f59e0b' }}>
            <RefreshCw size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{stats.rolledback}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Rolled Back</span>
          </div>
        </div>
      </div>

      {/* TOTAL AMOUNT CARD - PREMIUM STYLE */}
      <div 
        className="premium-blue-card"
        style={{ 
          borderRadius: '16px', 
          padding: '28px 32px', // Slightly more padding for breathing room
          color: 'white', 
          marginBottom: '24px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          zIndex: 1
        }}
      >
        {/* Content wrapper to stay above the glowing circles */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount Collected</div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>ETB {stats.totalAmount.toFixed(2)}</div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Payments</div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{stats.todayPayments}</div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{stats.weeklyPayments}</div>
        </div>
      </div>

      {/* 👇 7-DAY REVENUE CHART 👇 */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#2563eb" /> 7-Day Revenue Trend
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: '12px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' }}>
          {revenueData.days.map((day, index) => {
            const heightPercent = (day.amount / revenueData.maxAmount) * 100;
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: day.amount > 0 ? '#2563eb' : '#94a3b8' }}>
                  {day.amount > 0 ? `ETB ${day.amount}` : ''}
                </span>
                <div 
                  style={{ 
                    width: '100%', 
                    maxWidth: '50px', 
                    height: `${Math.max(heightPercent, 2)}%`, // min height 2% so bar is visible
                    background: day.amount > 0 ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)' : '#e2e8f0',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animation: 'growUp 1s ease-out forwards'
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* ============================================================
          BATCH PROCESSING CONTROLS
          ============================================================ */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '16px',
        marginBottom: '16px',
        border: batchMode ? '2px solid #3b82f6' : '1px solid #e2e8f0',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }} className="batch-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                if (!batchMode) {
                  setSelectedPayments([]);
                  setSelectAll(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: batchMode ? '#3b82f6' : '#f1f5f9',
                color: batchMode ? 'white' : '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
            >
              {batchMode ? <CheckSquare size={18} /> : <Square size={18} />}
              {batchMode ? 'Exit Batch Mode' : 'Batch Mode'}
            </button>

            {batchMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#475569',
                  }}
                >
                  {selectAll ? <Square size={16} /> : <CheckSquare size={16} />}
                  {selectAll ? 'Deselect All' : 'Select All Pending'}
                </button>

                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedPayments.length} selected
                </span>

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
                  <option value="approve">✅ Approve</option>
                  <option value="reject">❌ Reject</option>
                </select>

                {batchAction === 'reject' && (
                  <input
                    type="text"
                    placeholder="Rejection reason..."
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      minWidth: '200px',
                    }}
                  />
                )}

                <button
                  onClick={handleBatchAction}
                  disabled={selectedPayments.length === 0 || batchProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    background: (selectedPayments.length === 0 || batchProcessing) ? '#94a3b8' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (selectedPayments.length === 0 || batchProcessing) ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    opacity: (selectedPayments.length === 0 || batchProcessing) ? 0.6 : 1,
                  }}
                >
                  {batchProcessing ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Process {selectedPayments.length} Payments
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {batchMode && selectedPayments.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#3b82f6',
            }}>
              <CheckSquare size={16} />
              <span>{selectedPayments.length} payment{selectedPayments.length > 1 ? 's' : ''} selected</span>
              <button
                onClick={() => {
                  setSelectedPayments([]);
                  setSelectAll(false);
                }}
                style={{
                  padding: '2px 8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {batchMode && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#f0fdf4',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#166534',
          }}>
            <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Select payments using the checkboxes below, then choose an action and click "Process"
          </div>
        )}
      </div>

      {/* SEARCH AND FILTER */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', 
        padding: '16px', 
        marginBottom: '16px', 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap', 
        alignItems: 'center' 
      }} className="search-filter-bar">
        
        {/* 1. Search Input */}
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search by Transaction ID, Student, or Bank..." value={searchTerm} onChange={handleSearch} style={{ width: '100%', padding: '10px 12px 10px 40px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s ease' }} onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }} />
        </div>

        {/* 2. Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => handleFilter(e.target.value)} style={{ padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white', transition: 'all 0.3s ease' }}>
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="NEED_RESUBMISSION">Need Resubmission</option>
            <option value="ROLLED_BACK">Rolled Back</option>
          </select>
        </div>

        {/* 👇 3. PASTE THE DATE FILTER HERE 👇 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); filterData(searchTerm, filterStatus, e.target.value, endDate); }} 
            style={{ padding: '10px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#475569' }} 
            title="Start Date"
          />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => { setEndDate(e.target.value); filterData(searchTerm, filterStatus, startDate, e.target.value); }} 
            style={{ padding: '10px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#475569' }} 
            title="End Date"
          />
        </div>

      </div>

      {/* PAYMENTS TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px', overflowX: 'auto' }} className="payments-table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {/* Batch Mode Checkbox Column */}
                {batchMode && (
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    width: '40px',
                  }}>
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: selectAll ? '#3b82f6' : '#94a3b8',
                      }}
                    >
                      {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                )}
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Transaction</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Student</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}>Amount</th>
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
                }}>Date</th>
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
              {filteredPayments.length === 0 && !isUsingSampleData ? (
                <tr>
                  <td colSpan={batchMode ? 7 : 6} style={{
                    textAlign: 'center',
                    padding: '48px',
                    color: '#94a3b8',
                  }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                      No payment records found in database
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                      Students need to upload payment proofs first.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={fetchPayments}
                        style={{
                          padding: '8px 20px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px' }} />
                        Refresh
                      </button>

                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 && isUsingSampleData ? (
                <tr>
                  <td colSpan={batchMode ? 7 : 6} style={{
                    textAlign: 'center',
                    padding: '48px',
                    color: '#94a3b8',
                  }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                      No payments match your search
                    </p>
                    <p style={{ fontSize: '14px' }}>
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isSelected = selectedPayments.includes(payment.id);
                  const isPending = payment.status === 'PENDING' || payment.status === 'NEED_RESUBMISSION';
                  
                  return (
                    <tr key={payment.id || Math.random()} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all 0.3s ease',
                      background: isSelected ? '#eff6ff' : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'white';
                    }}>
                      
                      {/* Batch Mode Checkbox */}
                      {batchMode && (
                        <td style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          fontSize: '14px',
                        }}>
                          <button
                            onClick={() => togglePaymentSelection(payment.id)}
                            disabled={!isPending}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isPending ? 'pointer' : 'not-allowed',
                              color: isSelected ? '#3b82f6' : (isPending ? '#94a3b8' : '#d1d5db'),
                              opacity: isPending ? 1 : 0.5,
                            }}
                          >
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                      )}
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: '#0f172a',
                      }}>
                        {payment.transaction_id || '—'}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        <div>
                          <button 
                            onClick={() => setSelectedStudent(payment)}
                            style={{ 
                              fontWeight: 600, color: '#2563eb', display: 'block', background: 'none', 
                              border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                              textDecoration: 'underline', textUnderlineOffset: '3px'
                            }}
                          >
                            {payment.student_name || 'Unknown'}
                          </button>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            ID: {payment.student_id || '—'}
                          </span>
                        </div>
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}>
                        ETB {parseFloat(payment.amount || 0).toFixed(2)}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        {getStatusBadge(payment.status, payment.is_rolled_back)}
                        {payment.is_rolled_back && payment.rollback_reason && (
                          <div style={{
                            fontSize: '10px',
                            color: '#92400e',
                            marginTop: '4px',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {payment.rollback_reason}
                          </div>
                        )}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#64748b',
                      }}>
                        {payment.uploaded_at ? new Date(payment.uploaded_at).toLocaleDateString() : '—'}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} className="action-buttons">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: '#eff6ff',
                              color: '#3b82f6',
                            }}
                          // 👇 ADD THESE TWO LINES HERE 👇
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}



                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            onClick={() => viewReceipt(payment)}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: '#fef3c7',
                              color: '#d97706',
                            }}
                            // 👇 ADD THESE TWO LINES HERE 👇
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            title="View Receipt"
                          >
                            <FileImage size={16} />
                          </button>
                                                   {/* 👇 NEW PRINT BUTTON 👇 */}
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: '#e2e8f0', // Light grey background
                              color: '#475569',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            title="Print Official Receipt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          </button> 
                          
                          {payment.can_rollback && (
                            <button
                              onClick={() => {
                                setSelectedRollbackPayment(payment);
                                setShowRollbackModal(true);
                              }}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: '#fef3c7',
                                color: '#d97706',
                              }}
                              // 👇 ADD THESE TWO LINES HERE 👇
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              title="Rollback Payment"
                            >
                              <RefreshCw size={16} />
                            </button>
                          )}
                          
                          {(payment.status === 'PENDING' || payment.status === 'NEED_RESUBMISSION') && !payment.is_rolled_back && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowVerifyModal(true);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  background: '#dcfce7',
                                  color: '#22c55e',
                                }}
                                title="Verify Payment"
                              >
                                <CheckCircle size={16} />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRejectModal(true);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  background: '#fee2e2',
                                  color: '#ef4444',
                                }}
                                title="Reject Payment"
                              >
                                <XCircle size={16} />
                              </button>
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
          
          {payments.length > 0 && (
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
              <span>Showing {filteredPayments.length} of {payments.length} payments</span>
              <span>
                Pending: {stats.pending} | Verified: {stats.verified} | Rejected: {stats.rejected} | Rolled Back: {stats.rolledback}
                {batchMode && selectedPayments.length > 0 && (
                  <span style={{ marginLeft: '12px', color: '#3b82f6' }}>
                    | ✅ {selectedPayments.length} selected
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          BATCH CONFIRM MODAL
          ============================================================ */}
      {showBatchConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowBatchConfirm(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '95%',
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
                <Send size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Confirm Batch {batchAction === 'approve' ? 'Verification' : 'Rejection'}
              </h2>
              <button
                onClick={() => setShowBatchConfirm(false)}
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
                <strong>{selectedPayments.length}</strong> payments will be <strong>{batchAction === 'approve' ? 'APPROVED' : 'REJECTED'}</strong>
              </p>
              {batchAction === 'reject' && batchReason && (
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Reason: {batchReason}
                </p>
              )}
            </div>

            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Student</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Transaction</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getSelectedPaymentsDetails().filter(p => p.status === 'PENDING' || p.status === 'NEED_RESUBMISSION').map((p, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontSize: '13px' }}>{p.student_name}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }}>{p.transaction_id}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px' }}>ETB {p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowBatchConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'none',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeBatchProcessing}
                disabled={batchProcessing}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: batchProcessing ? 'not-allowed' : 'pointer',
                  background: batchAction === 'approve' ? '#22c55e' : '#dc2626',
                  color: 'white',
                  opacity: batchProcessing ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {batchAction === 'approve' ? 'Approve All' : 'Reject All'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BATCH RESULTS MODAL
          ============================================================ */}
      {showBatchResultsModal && batchResults && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowBatchResultsModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '700px',
            width: '95%',
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
                <CheckCircle size={24} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Batch Processing Results
              </h2>
              <button
                onClick={() => setShowBatchResultsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{batchResults.total}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#dcfce7',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{batchResults.approved}</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>✅ Approved</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fee2e2',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{batchResults.rejected}</div>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>❌ Rejected</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706' }}>{batchResults.failed}</div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>⚠️ Failed</div>
              </div>
            </div>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Student</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Transaction</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.details.map((result, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: result.success ? (result.status === 'VERIFIED' ? '#f0fdf4' : '#fef2f2') : '#fef3c7',
                    }}>
                      <td style={{ padding: '8px 12px', fontSize: '13px' }}>{result.student_name}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }}>{result.transaction_id}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px' }}>
                        {result.success ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: result.status === 'VERIFIED' ? '#16a34a' : '#dc2626',
                          }}>
                            {result.status === 'VERIFIED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {result.status}
                          </span>
                        ) : (
                          <span style={{ color: '#dc2626', fontSize: '12px' }}>
                            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Failed: {result.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowBatchResultsModal(false)}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                background: '#3b82f6',
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

      {/* ============ ROLLBACK MODAL ============ */}
      {showRollbackModal && selectedRollbackPayment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowRollbackModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <RefreshCw size={24} style={{ display: 'inline', marginRight: '8px', color: '#d97706' }} />
                Rollback Payment
              </h2>
              <button
                onClick={() => setShowRollbackModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Student</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>{selectedRollbackPayment.student_name}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Transaction ID</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedRollbackPayment.transaction_id}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Amount</span>
                <p style={{ fontWeight: 600, color: '#2563eb', margin: '4px 0 0 0' }}>
                  ETB {parseFloat(selectedRollbackPayment.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Current Status</span>
                <p style={{ fontWeight: 500, margin: '4px 0 0 0' }}>
                  {getStatusBadge(selectedRollbackPayment.status, selectedRollbackPayment.is_rolled_back)}
                </p>
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fde68a',
              marginBottom: '20px',
            }}>
              <p style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>
                ⚠️ <strong>Warning:</strong> This will rollback the payment and reset the student's payment status to PENDING.
                This action cannot be undone.
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
                Rollback Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g., Student changed department from Software Engineering to Computer Science"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                This reason will be visible to the student and recorded in the rollback history.
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
                Additional Notes (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Any additional notes about this rollback..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                value={rollbackNotes}
                onChange={(e) => setRollbackNotes(e.target.value)}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px',
            }}>
              <button
                onClick={() => setShowRollbackModal(false)}
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
                onClick={handleRollbackPayment}
                disabled={rollbackLoading || !rollbackReason.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (rollbackLoading || !rollbackReason.trim()) ? '#94a3b8' : '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: (rollbackLoading || !rollbackReason.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: (rollbackLoading || !rollbackReason.trim()) ? 0.6 : 1,
                }}
              >
                <RefreshCw size={18} className={rollbackLoading ? 'spinning' : ''} />
                {rollbackLoading ? 'Processing...' : 'Rollback Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ VERIFY MODAL ============ */}
      {showVerifyModal && selectedPayment && (
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
                <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
                Verify Payment
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
              marginBottom: '24px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Transaction ID:</span>
                <span style={{ fontWeight: 500, color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedPayment.transaction_id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Student:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>
                  {selectedPayment.student_name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>
                  ETB {parseFloat(selectedPayment.amount || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Receipt:</span>
                <button
                  onClick={() => viewReceipt(selectedPayment)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    background: '#eff6ff',
                    color: '#3b82f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  View Receipt
                </button>
                                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            style={{
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: '#f1f5f9',
                              color: '#475569',
                            }}
                            title="Print Receipt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Verification Note (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Add any verification notes..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setShowVerifyModal(false)}
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
                onClick={() => handleVerifyPayment(selectedPayment.id, 'approve')}
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
                <CheckCircle size={18} />
                {actionLoading ? 'Processing...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ REJECT MODAL ============ */}
      {showRejectModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowRejectModal(false)}>
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
                <XCircle size={20} style={{ display: 'inline', marginRight: '8px', color: '#dc2626' }} />
                Reject Payment
              </h2>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Student:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>
                  {selectedPayment.student_name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  ETB {parseFloat(selectedPayment.amount || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Receipt:</span>
                <button
                  onClick={() => viewReceipt(selectedPayment)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    background: '#eff6ff',
                    color: '#3b82f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  View Receipt
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Rejection Reason *
              </label>
              <textarea
                required
                rows="3"
                placeholder="Enter detailed reason for rejection..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                This reason will be shown to the student.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setShowRejectModal(false)}
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
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  handleVerifyPayment(selectedPayment.id, 'reject', rejectionReason);
                }}
                disabled={actionLoading || !rejectionReason.trim()}
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
                  cursor: (actionLoading || !rejectionReason.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#dc2626',
                  color: 'white',
                  opacity: (actionLoading || !rejectionReason.trim()) ? 0.6 : 1,
                }}
              >
                <XCircle size={18} />
                {actionLoading ? 'Processing...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {showDetailModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowDetailModal(false)}>
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
                <FileText size={20} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Payment Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Transaction ID</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedPayment.transaction_id}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Amount</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#2563eb', margin: '4px 0 0 0' }}>
                  ETB {parseFloat(selectedPayment.amount || 0).toFixed(2)}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Student</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '4px 0 0 0' }}>
                  {selectedPayment.student_name || 'Unknown'}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  ID: {selectedPayment.student_id || '—'}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Status</p>
                <div style={{ marginTop: '4px' }}>
                  {getStatusBadge(selectedPayment.status, selectedPayment.is_rolled_back)}
                </div>
                {selectedPayment.is_rolled_back && selectedPayment.rollback_reason && (
                  <p style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                    Reason: {selectedPayment.rollback_reason}
                  </p>
                )}
              </div>
            </div>

            {selectedPayment.rejection_reason && (
              <div style={{
                background: '#fef2f2',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', margin: 0 }}>
                  <XCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Rejection Reason
                </p>
                <p style={{ fontSize: '14px', color: '#991b1b', margin: '4px 0 0 0' }}>
                  {selectedPayment.rejection_reason}
                </p>
              </div>
            )}

            {(selectedPayment.status === 'PENDING' || selectedPayment.status === 'NEED_RESUBMISSION') && !selectedPayment.is_rolled_back && (
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
              }}>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectModal(true);
                  }}
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
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#fee2e2',
                    color: '#dc2626',
                  }}
                >
                  <XCircle size={18} />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowVerifyModal(true);
                  }}
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
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#22c55e',
                    color: 'white',
                  }}
                >
                  <CheckCircle size={18} />
                  Verify
                </button>
              </div>
            )}
          </div>
        </div>
      )}

        {/* ============ RECEIPT MODAL ============ */}
      {showReceiptModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowReceiptModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
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
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                <FileImage size={20} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
                Payment Receipt
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>
            
            {receiptImage ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={receiptImage}
                  alt="Payment Receipt"
                  style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
                />
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => window.open(receiptImage, '_blank')}
                    style={{
                      padding: '8px 20px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Open in New Tab
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = receiptImage;
                      link.download = 'receipt.jpg';
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                    style={{
                      padding: '8px 20px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FileImage size={48} style={{ color: '#d9d9d9', margin: '0 auto 16px' }} />
                <p>Receipt not available</p>
              </div>
            )}
          </div>
        </div>
      )}

            {/* ============ IMPORT CSV MODAL ============ */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowImportModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', background: '#f3e8ff', color: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Upload size={32} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Import Bank Statement</h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              Upload the CSV file downloaded from your bank. The system will automatically verify matching pending student payments.
            </p>
            
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV}
              disabled={importing}
              style={{ 
                display: 'block', width: '100%', padding: '12px', 
                border: '2px dashed #cbd5e1', borderRadius: '8px', 
                marginBottom: '24px', cursor: 'pointer', background: '#f8fafc' 
              }} 
            />

            {importing && (
              <p style={{ color: '#8b5cf6', fontWeight: 600 }}>
                <RefreshCw size={16} className="spinning" style={{ display: 'inline', marginRight: '8px' }}/>
                Processing CSV file, please wait...
              </p>
            )}

            <button onClick={() => setShowImportModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 👇 STUDENT FINANCIAL PROFILE PANEL 👇 */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedStudent(null)}>
          <div 
            style={{ 
              background: 'white', width: '100%', maxWidth: '400px', height: '100%', 
              boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '32px', 
              animation: 'slideInRight 0.3s ease-out forwards', display: 'flex', flexDirection: 'column'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Student Financials</h2>
              <button onClick={() => setSelectedStudent(null)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, margin: '0 auto 16px' }}>
                {selectedStudent.student_name?.charAt(0) || 'S'}
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0' }}>{selectedStudent.student_name}</h3>
              <p style={{ color: '#64748b', margin: 0 }}>ID: {selectedStudent.student_id || 'N/A'}</p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, margin: '0 0 8px 0' }}>LAST TRANSACTION</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>Amount:</span>
                <strong style={{ color: '#16a34a' }}>ETB {parseFloat(selectedStudent.amount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>Status:</span>
                {getStatusBadge(selectedStudent.status, selectedStudent.is_rolled_back)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Date:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{new Date(selectedStudent.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>

            <button 
              onClick={() => { handlePrintReceipt(selectedStudent); setSelectedStudent(null); }}
              style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}
            >
              <FileText size={18} /> Print Official Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceDashboard;