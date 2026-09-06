// frontend/src/components/ProtectedRouteWithPayment.jsx
// ✅ GLOBAL PAYMENT GUARD - REDIRECTS LOCKED STUDENTS TO PAYMENTS

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/api';
import toast from 'react-hot-toast';

const ProtectedRouteWithPayment = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkPaymentAccess();
  }, []);

  const checkPaymentAccess = async () => {
    if (!isAuthenticated || user?.role !== 'STUDENT') {
      setIsChecking(false);
      return;
    }

    try {
      // ✅ CHECK PAYMENT STATUS
      const response = await api.get('/analytics/check-access/?service_type=ALL_SERVICES');
      
      if (response.data.has_access === false || response.data.is_locked === true) {
        setIsLocked(true);
        toast.error('🔒 Your account is locked. Please make payment.');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setIsLocked(true);
        toast.error('🔒 Your account is locked. Please make payment.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  // ✅ REDIRECT LOCKED STUDENTS TO PAYMENTS
  if (isLocked) {
    return <Navigate to="/payments?locked=true" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const hasRole = roles.some(role => role.toUpperCase() === userRole);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        flexDirection: 'column',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b', marginTop: '12px' }}>Checking access...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
};

export default ProtectedRouteWithPayment;