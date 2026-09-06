// frontend/src/App.js
// COMPLETE - WITH REAL CHAT ENABLED FOR ALL ROLES

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage/HomePage';
import Header from './components/Header/Header';
import ChatWidget from './components/Chat/ChatWidget';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import ProtectedRouteWithPayment from './components/ProtectedRouteWithPayment';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOTP';
import ResetPassword from './pages/auth/ResetPassword';

// Student Pages
import Dashboard from './pages/Student/Dashboard';
import Courses from './pages/Student/Courses';
import CourseDetail from './pages/CourseDetail';
import Exams from './pages/Student/Exams';
import TakeExam from './pages/TakeExam';
import ExamResults from './pages/Student/ExamResults';
import Payments from './pages/Student/Payments';
import Profile from './pages/Student/Profile';
import LiveClasses from './pages/Student/LiveClasses';
import DocumentUpload from './pages/Student/DocumentUpload';
import AssignmentResults from './pages/Student/AssignmentResults';

// Live Class Component
import LiveClass from './pages/LiveClass';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherExams from './pages/teacher/TeacherExams';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Finance Pages
import FinanceDashboard from './pages/Finance/FinanceDashboard';

// Registrar Pages
import RegistrarDashboard from './pages/Registrar/RegistrarDashboard';

// Department Head Pages
import DeptDashboard from './pages/DepartmentHead/DeptDashboard';

import ProtectedRoute from './components/common/ProtectedRoute';
import AIInsights from './components/AI/AIInsights';
import Leaderboard from './components/Gamification/Leaderboard';
import AILearningPath from './components/AI/AILearningPath';
import GamificationProfile from './components/Gamification/GamificationProfile';
import CertificateViewer from './components/Certificates/CertificateViewer';
import PerformancePrediction from './components/AI/PerformancePrediction';
import RealTimeDashboard from './components/Analytics/RealTimeDashboard';
import LanguageSelector from './components/i18n/LanguageSelector';
import CurrencySelector from './components/Payment/CurrencySelector';
// Inner component that uses dark mode context
import SessionTimeout from './components/SessionTimeout';
const AppContent = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <div className={isDarkMode ? 'dark' : ''}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
            },
          }}
        />
         
        <Router>
         <SessionTimeout> 
          <Routes>
            {/* Public Routes with Header */}
            <Route
              path="/"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <HomePage />
                </>
              }
            />
            <Route
              path="/login"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <Login />
                </>
              }
            />
            <Route
              path="/register"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <Register />
                </>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <ForgotPassword />
                </>
              }
            />
            <Route
              path="/verify-otp"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <VerifyOTP />
                </>
              }
            />
            <Route
              path="/reset-password"
              element={
                <>
                  <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                  <ResetPassword />
                </>
              }
            />

            {/* Protected Routes - With MainLayout */}
            <Route element={<MainLayout />}>
              {/* Student Routes */}
              <Route path="/dashboard" element={<ProtectedRouteWithPayment roles={['STUDENT']}><Dashboard /></ProtectedRouteWithPayment>} />
              <Route path="/courses" element={<ProtectedRouteWithPayment roles={['STUDENT']}><Courses /></ProtectedRouteWithPayment>} />
              <Route path="/courses/:id" element={<ProtectedRouteWithPayment roles={['STUDENT']}><CourseDetail /></ProtectedRouteWithPayment>} />
              <Route path="/exams" element={<ProtectedRouteWithPayment roles={['STUDENT']}><Exams /></ProtectedRouteWithPayment>} />
              <Route path="/exams/:id/take" element={<ProtectedRouteWithPayment roles={['STUDENT']}><TakeExam /></ProtectedRouteWithPayment>} />
              <Route path="/results" element={<ProtectedRoute roles={['STUDENT']}><ExamResults /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute roles={['STUDENT']}><Payments /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/live-classes" element={<ProtectedRouteWithPayment roles={['STUDENT', 'TEACHER']}><LiveClasses /></ProtectedRouteWithPayment>} />
              <Route path="/upload-documents" element={<ProtectedRoute roles={['STUDENT']}><DocumentUpload /></ProtectedRoute>} />
              <Route path="/assignment-results" element={<ProtectedRoute roles={['STUDENT']}><AssignmentResults /></ProtectedRoute>} />
              <Route path="/live-class/:courseId" element={<ProtectedRouteWithPayment roles={['STUDENT', 'TEACHER']}><LiveClass /></ProtectedRouteWithPayment>} />

              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/courses" element={<ProtectedRoute roles={['TEACHER']}><TeacherCourses /></ProtectedRoute>} />
              <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER']}><TeacherExams /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/proctoring-review" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

              {/* Finance Routes */}
              <Route path="/finance/dashboard" element={<ProtectedRoute roles={['FINANCE', 'ADMIN']}><FinanceDashboard /></ProtectedRoute>} />

              {/* Registrar Routes */}
              <Route path="/registrar/dashboard" element={<ProtectedRoute roles={['REGISTRAR', 'ADMIN']}><RegistrarDashboard /></ProtectedRoute>} />

              {/* Department Head Routes */}
              <Route path="/dept/dashboard" element={<ProtectedRoute roles={['DEPT_HEAD']}><DeptDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
  <Route path="/ai-insights" element={<ProtectedRoute roles={['STUDENT']}><AIInsights /></ProtectedRoute>} />
  <Route path="/leaderboard" element={<ProtectedRoute roles={['STUDENT']}><Leaderboard /></ProtectedRoute>} />
  <Route path="/learning-path" element={<ProtectedRoute roles={['STUDENT']}><AILearningPath /></ProtectedRoute>} />
  <Route path="/gamification" element={<ProtectedRoute roles={['STUDENT']}><GamificationProfile /></ProtectedRoute>} />
  <Route path="/certificates" element={<ProtectedRouteWithPayment roles={['STUDENT']}><CertificateViewer /></ProtectedRouteWithPayment>} />
  <Route path="/predictions" element={<ProtectedRoute roles={['STUDENT']}><PerformancePrediction /></ProtectedRoute>} />
  <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN']}><RealTimeDashboard /></ProtectedRoute>} />

          </Routes>

          {/* ============ REAL CHAT WIDGET ============ */}
          {/* Available on ALL pages for ALL authenticated roles */}
          {/* This is OUTSIDE <Routes> but INSIDE <Router> so it's always mounted */}
          {/* It works even when system is locked because it's mounted independently */}
          <ChatWidget />
          </SessionTimeout>
        </Router>
        
      </div>
    </ConfigProvider>
  );
};

// Main App component with DarkModeProvider
function App() {
  return (
    <DarkModeProvider>
      <AppContent />
    </DarkModeProvider>
  );
}

export default App;