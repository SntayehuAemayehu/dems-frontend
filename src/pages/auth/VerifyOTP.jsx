// frontend/src/pages/auth/VerifyOTP.jsx
// COMPLETE FIXED - With auto-fill OTP for development
// Background changed to pure white
// + 3D SCENE + 3D TILT ADDED — EVERY EXISTING LINE KEPT IN ORIGINAL ORDER

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AnimatedBackground from '../../components/Motion/AnimatedBackground';
import Auth3DScene from '../../components/Motion/Auth3DScene';
import { TiltCard, PageTransition } from '../../components/Motion/MotionPrimitives';
import '../../styles/design-system.css';
import '../../styles/animations.css';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, verification_token, otp: preFilledOtp, message } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(600);
  const inputRefs = useRef([]);

  // ============ VALIDATE INPUTS ============
  useEffect(() => {
    if (!email || !verification_token) {
      toast.error('Invalid request. Please start over.');
      navigate('/forgot-password');
    }
  }, [email, verification_token, navigate]);

  // ============ PRE-FILL OTP IN DEVELOPMENT MODE ============
  useEffect(() => {
    if (preFilledOtp) {
      const otpDigits = preFilledOtp.toString().split('');
      const newOtp = ['', '', '', '', '', ''];
      otpDigits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      toast.success(`🔑 OTP pre-filled: ${preFilledOtp}`);

      const timer = setTimeout(() => {
        toast.info('Auto-verifying OTP...');
        handleVerify();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [preFilledOtp]);

  // ============ TIMER COUNTDOWN ============
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // ============ FOCUS FIRST INPUT ON MOUNT ============
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // ============ HANDLE OTP CHANGE ============
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // ============ HANDLE KEYDOWN ============
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  // ============ HANDLE PASTE ============
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits) {
      const newOtp = ['', '', '', '', '', ''];
      digits.split('').forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      const nextIndex = Math.min(digits.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  // ============ VERIFY OTP ============
  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/auth/verify-otp/', {
        email,
        otp: otpString,
        verification_token: verification_token
      });

      console.log('✅ OTP verified:', response.data);

      if (response.data.success) {
        toast.success('OTP verified successfully!');
        navigate('/reset-password', {
          state: {
            email: email,
            reset_token: response.data.reset_token,
            message: 'OTP verified. Set your new password.'
          }
        });
      } else {
        toast.error(response.data.error || 'Invalid OTP');
        setError(response.data.error);
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to verify OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============ RESEND OTP ============
  const handleResend = async () => {
    if (!email) return;

    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/auth/send-reset-otp/', { email });
      console.log('✅ OTP resent:', response.data);

      if (response.data.success) {
        setTimer(600);
        toast.success('New OTP sent to your email!');
        setSuccessMessage('New OTP sent! Please check your email.');
        setOtp(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }

        if (response.data.otp) {
          toast.info(`🔑 New OTP: ${response.data.otp}`);
        }
      } else {
        toast.error(response.data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ============ FORMAT TIME ============
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ============ RENDER ============
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
        <Auth3DScene variant="otp" intensity={1} />
        <motion.div
          style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, pointerEvents: 'none' }}
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'fixed', bottom: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' }}
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
                style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 3, borderRadius: 3, background: 'linear-gradient(90deg, transparent, #f59e0b, #ec4899, #6366f1, transparent)', backgroundSize: '200% 100%' }}
                animate={{ backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />

              <motion.button
                onClick={() => navigate('/forgot-password')}
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
                Back
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
                    <CheckCircle size={32} color="#3b82f6" />
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
                >Verify OTP</motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: 0,
                  }}
                >
                  Enter the 6-digit code sent to
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                  style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    fontSize: '16px',
                    marginTop: '4px',
                  }}
                >
                  {email}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    color: timer < 60 ? '#dc2626' : '#64748b',
                  }}>
                    {timer > 0 ? formatTime(timer) : 'Expired'}
                  </span>
                  {timer < 120 && timer > 0 && (
                    <span style={{
                      fontSize: '12px',
                      color: '#dc2626',
                    }}>
                      ⚠️ Expiring soon!
                    </span>
                  )}
                </motion.div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      marginBottom: '16px',
                    }}
                  >
                    <AlertCircle size={18} color="#dc2626" />
                    <span style={{ fontSize: '14px', color: '#dc2626' }}>{error}</span>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#dcfce7',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      marginBottom: '16px',
                    }}
                  >
                    <CheckCircle size={18} color="#16a34a" />
                    <span style={{ fontSize: '14px', color: '#166534' }}>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.7 } } }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    variants={{ hidden: { opacity: 0, y: 20, scale: 0.8 }, show: { opacity: 1, y: 0, scale: 1 } }}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 600,
                      border: `2px solid ${error ? '#dc2626' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: digit ? '#f0fdf4' : 'white',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = error ? '#dc2626' : '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    disabled={loading}
                  />
                ))}
              </motion.div>

              <motion.button
                whileHover={{ y: -2, boxShadow: '0 12px 28px -6px rgba(16,185,129,.55)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleVerify}
                disabled={loading || timer === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: (loading || timer === 0) ? '#94a3b8' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: (loading || timer === 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: (loading || timer === 0) ? 0.7 : 1,
                  marginBottom: '12px',
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={handleResend}
                  disabled={resendLoading || timer > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: (resendLoading || timer > 0) ? '#94a3b8' : '#3b82f6',
                    cursor: (resendLoading || timer > 0) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <RefreshCw size={16} className={resendLoading ? 'dems-spin' : ''} />
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
                <span style={{ color: '#e2e8f0' }}>|</span>
                <button
                  onClick={() => navigate('/forgot-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  Try different email
                </button>
              </motion.div>

              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                .spinning {
                  animation: spin 1s linear infinite;
                }
              `}</style>
            </motion.div>
          </TiltCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyOTP;