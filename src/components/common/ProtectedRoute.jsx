import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const hasRole = roles.some(role => role.toUpperCase() === userRole);
    if (!hasRole) {
      const dashboardMap = {
        'STUDENT': '/dashboard',
        'TEACHER': '/teacher/dashboard',
        'FINANCE': '/finance/dashboard',
        'REGISTRAR': '/registrar/dashboard',
        'DEPT_HEAD': '/dept/dashboard',
        'ADMIN': '/admin/dashboard',
      };
      const redirectPath = dashboardMap[userRole] || '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;