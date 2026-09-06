// frontend/src/components/common/RequireAdmin.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireAdmin = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin-login');
    } else if (user?.role !== 'ADMIN') {
      const redirectMap = {
        'STUDENT': '/dashboard',
        'TEACHER': '/teacher/dashboard',
        'FINANCE': '/finance/dashboard',
        'REGISTRAR': '/registrar/dashboard',
        'DEPT_HEAD': '/dept/dashboard',
      };
      navigate(redirectMap[user?.role] || '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return children;
};

export default RequireAdmin;