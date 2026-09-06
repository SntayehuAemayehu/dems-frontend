// frontend/src/components/PaymentStatusBanner.jsx
// COMPLETE PAYMENT STATUS BANNER

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Lock, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const PaymentStatusBanner = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPaymentStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchPaymentStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/payment-status/');
      setPaymentStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentStatus();
    setRefreshing(false);
    toast.success('Payment status refreshed');
  };

  if (loading) {
    return (
      <div style={{
        padding: '12px 16px',
        background: '#f1f5f9',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ color: '#64748b' }}>Checking payment status...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  // If access is granted and no issues
  if (paymentStatus.can_access_services && paymentStatus.access_status === 'GRANTED') {
    return (
      <div style={{
        padding: '12px 16px',
        background: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #bbf7d0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={20} color="#16a34a" />
          <div>
            <p style={{ fontWeight: 500, color: '#16a34a', margin: 0 }}>
              ✅ Full Access Granted
            </p>
            <p style={{ fontSize: '13px', color: '#166534', margin: '2px 0 0 0' }}>
              All services are available. 
              {paymentStatus.current_period && (
                <span> Next payment: Period {paymentStatus.current_period.period_number + 1 || 'N/A'}</span>
              )}
              {!paymentStatus.current_period && paymentStatus.paid_periods > 0 && (
                <span> All payments completed.</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            color: '#16a34a',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>
    );
  }

  // If account is locked
  if (paymentStatus.access_status === 'LOCKED') {
    return (
      <div style={{
        padding: '16px 20px',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <Lock size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: '#dc2626', margin: 0 }}>
            🔒 Account Locked
          </p>
          <p style={{ color: '#991b1b', margin: '4px 0 0 0', fontSize: '14px' }}>
            {paymentStatus.message || 'Your account has been locked due to overdue payment.'}
          </p>
          {paymentStatus.current_period && (
            <p style={{ color: '#991b1b', margin: '4px 0 0 0', fontSize: '13px' }}>
              Amount Due: ETB {paymentStatus.current_period.total_amount}
              {paymentStatus.current_period.days_overdue > 0 && 
                ` (Overdue by ${paymentStatus.current_period.days_overdue} days)`
              }
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.href = '/payments'}
              style={{
                padding: '6px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Make Payment
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '6px 16px',
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: refreshing ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              Check Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If payment is overdue
  if (paymentStatus.current_period?.is_overdue) {
    return (
      <div style={{
        padding: '16px 20px',
        background: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fde68a',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: '#92400e', margin: 0 }}>
            ⚠️ Payment Overdue
          </p>
          <p style={{ color: '#92400e', margin: '4px 0 0 0', fontSize: '14px' }}>
            Your payment is overdue by {paymentStatus.current_period.days_overdue} days.
          </p>
          <p style={{ color: '#92400e', margin: '4px 0 0 0', fontSize: '13px' }}>
            Amount Due: ETB {paymentStatus.current_period.total_amount} 
            {paymentStatus.current_period.penalty_amount > 0 && 
              ` (includes penalty: ETB ${paymentStatus.current_period.penalty_amount})`
            }
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.href = '/payments'}
              style={{
                padding: '6px 16px',
                background: '#d97706',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Pay Now
            </button>
            <button
              onClick={() => window.location.href = '/payments/history'}
              style={{
                padding: '6px 16px',
                background: 'rgba(255,255,255,0.8)',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              View History
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '6px 16px',
                background: 'rgba(255,255,255,0.8)',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: refreshing ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If access denied but not overdue (e.g., no schedule)
  if (!paymentStatus.can_access_services) {
    return (
      <div style={{
        padding: '16px 20px',
        background: '#f1f5f9',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <CreditCard size={24} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>
            💳 Payment Required
          </p>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            {paymentStatus.message || 'Please make your payment to access all services.'}
          </p>
          {paymentStatus.current_period && (
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '13px' }}>
              Amount: ETB {paymentStatus.current_period.amount}
              {paymentStatus.current_period.due_date && 
                ` Due: ${new Date(paymentStatus.current_period.due_date).toLocaleDateString()}`
              }
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.href = '/payments'}
              style={{
                padding: '6px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Make Payment
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '6px 16px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: refreshing ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStatusBanner;