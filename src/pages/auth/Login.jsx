// frontend/src/pages/auth/Login.jsx
// COMPLETE FIXED - With OTP-based password reset flow
// Background changed to pure white
// + 3D SCENE + 3D TILT ADDED — EVERY EXISTING LINE KEPT IN ORIGINAL ORDER

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { login } from '../../store/slices/authSlice';
import api from '../../api/api';
import AnimatedBackground from '../../components/Motion/AnimatedBackground';
import Auth3DScene from '../../components/Motion/Auth3DScene';
import { TiltCard, PageTransition } from '../../components/Motion/MotionPrimitives';
import '../../styles/design-system.css';
import '../../styles/animations.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [shake, setShake] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData)).unwrap();

      // ✅ CHECK IF STUDENT IS LOCKED
      if (result?.status === 'LOCKED' || result?.is_locked === true) {
        if (result.access) localStorage.setItem('access_token', result.access);
        if (result.refresh) localStorage.setItem('refresh_token', result.refresh);
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user));
        if (result.user?.role) localStorage.setItem('user_role', result.user.role);

        toast.error(`🔒 ${result.message || 'Your account is locked. Please make payment.'}`);
        navigate('/payments?locked=true');
        return;
      }

      toast.success('Login successful!');

      const role = result.user?.role;
      const redirectMap = {
        'STUDENT': '/dashboard',
        'TEACHER': '/teacher/dashboard',
        'FINANCE': '/finance/dashboard',
        'REGISTRAR': '/registrar/dashboard',
        'DEPT_HEAD': '/dept/dashboard',
        'ADMIN': '/admin/dashboard',
      };

      const requestedPath = new URLSearchParams(location.search).get('next');
      const returnToNews = requestedPath === '/news'
        || (requestedPath?.startsWith('/news/') && !requestedPath.startsWith('//'));
      navigate(returnToNews ? requestedPath : redirectMap[role] || '/dashboard', { replace: true });

    } catch (error) {
      const errorMessage = error?.message || error;

      if (errorMessage?.includes('Administrators must use') || error?.is_admin) {
          toast.error('Admins must use the Admin Login page. Redirecting...');
          navigate('/admin-login');
          return;
      }

      toast.error(errorMessage || 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
        toast.error('Please enter your email address');
        return;
    }

    setResetLoading(true);
    try {
        const response = await api.post('/auth/send-reset-otp/', {
            email: resetEmail
        });

        console.log('Password reset response:', response.data);

        if (response.data.success) {
            setResetSent(true);

            if (response.data.development && response.data.otp) {
                toast.success(`📧 Your OTP: ${response.data.otp}`);
                toast.info(`🔑 Use this OTP to reset your password: ${response.data.otp}`, {
                    duration: 10000,
                });
            } else {
                toast.success('OTP sent to your email!');
            }

            navigate('/verify-otp', {
                state: {
                    email: resetEmail,
                    verification_token: response.data.verification_token,
                    otp: response.data.otp || null,
                    message: response.data.email_sent ? 'OTP sent to your email' : 'OTP generated successfully'
                }
            });
        } else {
            toast.error(response.data.error || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('Forgot password error:', error);

        if (error.response?.status === 404) {
            toast.error('❌ The email address you entered is not registered in our system. Please check and try again.');
        } else if (error.response?.status === 400) {
            const errorMsg = error.response?.data?.error ||
                             error.response?.data?.message ||
                             'Invalid request. Please check your email address.';
            toast.error(errorMsg);
        } else {
            const errorMsg = error.response?.data?.error ||
                            error.response?.data?.message ||
                            'Failed to send OTP. Please try again.';
            toast.error(errorMsg);
        }
    } finally {
        setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetSent(false);
    setResetEmail('');
  };

  // ============= FORGOT PASSWORD SCREEN =============
  if (showForgotPassword) {
    return (
      <PageTransition>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <AnimatedBackground dark={false} density={40} showLines={false} />
          <Auth3DScene variant="forgot" intensity={1} />
          <motion.div
            style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, pointerEvents: 'none' }}
            animate={{ x: [0, 80, 0], y: [0, 60, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            style={{ position: 'fixed', bottom: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' }}
            animate={{ x: [0, -70, 0], y: [0, -50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>
            <TiltCard intensity={12}>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '40px',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 40px 80px -20px rgba(79,70,229,0.35), 0 20px 40px -20px rgba(15,23,42,0.15)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  overflow: 'hidden',
                  transform: 'translateZ(0)',
                }}
              >
                <motion.div
                  style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 3, borderRadius: 3, background: 'linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, #06b6d4, transparent)', backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />

                <motion.button
                  onClick={handleBackToLogin}
                  whileHover={{ x: -4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 0 24px 0',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </motion.button>

                <div style={{
                  textAlign: 'center',
                  marginBottom: '32px',
                }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.7, type: 'spring', bounce: 0.5 }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      position: 'relative',
                    }}
                  >
                    <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                      <Mail size={32} color="#3b82f6" />
                    </motion.div>
                    <motion.div
                      style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.3)' }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 8px 0',
                    }}
                  >Reset Password</motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{
                      color: '#64748b',
                      fontSize: '16px',
                      margin: 0,
                    }}
                  >
                    {resetSent
                      ? 'Check your email for the OTP'
                      : 'Enter your email to receive a password reset OTP'}
                  </motion.p>
                </div>

                <AnimatePresence mode="wait">
                  {resetSent ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        textAlign: 'center',
                        padding: '20px 0',
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: '#dcfce7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}
                      >
                        <CheckCircle size={40} color="#16a34a" />
                      </motion.div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: '0 0 8px 0',
                      }}>OTP Sent!</h3>
                      <p style={{
                        color: '#64748b',
                        fontSize: '14px',
                        marginBottom: '8px',
                      }}>
                        We've sent a 6-digit OTP to:
                      </p>
                      <p style={{
                        fontWeight: 600,
                        color: '#0f172a',
                        fontSize: '16px',
                        wordBreak: 'break-all',
                      }}>
                        {resetEmail}
                      </p>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '13px',
                        marginTop: '16px',
                      }}>
                        Please check your spam folder if you don't see it.
                      </p>
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 12px 28px -6px rgba(79,70,229,.55)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/verify-otp', {
                          state: {
                            email: resetEmail,
                            message: 'OTP sent to your email'
                          }
                        })}
                        style={{
                          marginTop: '24px',
                          padding: '12px 32px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          width: '100%',
                        }}
                      >
                        Verify OTP
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -1 }}
                        onClick={handleBackToLogin}
                        style={{
                          marginTop: '12px',
                          padding: '12px 32px',
                          background: 'none',
                          color: '#64748b',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          width: '100%',
                        }}
                      >
                        Return to Login
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onSubmit={handleForgotPassword}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#334155',
                        }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                          <Mail style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                          }} size={20} />
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="you@gmail.com"
                            style={{
                              width: '100%',
                              padding: '12px 12px 12px 44px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '16px',
                              transition: 'all 0.3s ease',
                              background: 'white',
                              boxSizing: 'border-box',
                              outline: 'none',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.12)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            required
                          />
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '4px',
                        }}>
                          Enter your email to receive a 6-digit OTP. Valid for 10 minutes.
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#dc2626',
                          marginTop: '2px',
                        }}>
                          ⚠️ If the email is not registered, you will receive an error message.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 12px 28px -6px rgba(79,70,229,.55)' }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={resetLoading}
                        style={{
                          padding: '14px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: resetLoading ? 0.7 : 1,
                          marginTop: '8px',
                        }}
                      >
                        {resetLoading ? 'Sending...' : 'Send OTP'}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ============= LOGIN SCREEN =============
  return (
    <PageTransition>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <AnimatedBackground dark={false} density={40} showLines={false} />
        <Auth3DScene variant="default" intensity={1} />
        <motion.div
          style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, pointerEvents: 'none' }}
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'fixed', bottom: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' }}
          animate={{ x: [0, -70, 0], y: [0, -50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>
          <TiltCard intensity={12}>
            <motion.div
              className={shake ? 'shake' : ''}
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 40px 80px -20px rgba(79,70,229,0.35), 0 20px 40px -20px rgba(15,23,42,0.15)',
                border: '1px solid rgba(255,255,255,0.5)',
                overflow: 'hidden',
                transform: 'translateZ(0)',
              }}
            >
              <motion.div
                style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 3, borderRadius: 3, background: 'linear-gradient(90deg, transparent, #8b5cf6, #3b82f6, #06b6d4, transparent)', backgroundSize: '200% 100%' }}
                animate={{ backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />

              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
              }}>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 8px 0',
                  }}
                >Welcome Back</motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: 0,
                  }}
                >Sign in to continue your learning journey</motion.p>
              </div>

              <motion.form
                onSubmit={handleSubmit}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <motion.div variants={itemVariants} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#334155',
                  }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }} size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@gmail.com"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: 'white',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <label style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#334155',
                    }}>Password</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: 'white',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  whileHover={{ y: -2, boxShadow: '0 12px 28px -6px rgba(79,70,229,.55)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '14px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </motion.button>

                <motion.div variants={itemVariants} style={{
                  textAlign: 'center',
                  marginTop: '8px',
                }}>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      transition: 'all 0.3s ease',
                      textDecoration: 'underline',
                      textDecorationColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#3b82f6';
                      e.currentTarget.style.textDecorationColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#64748b';
                      e.currentTarget.style.textDecorationColor = 'transparent';
                    }}
                  >
                    Forgot Password?
                  </button>
                </motion.div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '24px',
                }}
              >
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  margin: 0,
                }}>
                  Don't have an account? <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
                </p>
              </motion.div>
            </motion.div>
          </TiltCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;