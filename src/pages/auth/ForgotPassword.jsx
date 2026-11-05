// frontend/src/pages/auth/ForgotPassword.jsx
// COMPLETE - Send OTP to email
// Background changed to pure white
// + 3D SCENE + 3D TILT ADDED — EVERY EXISTING LINE KEPT IN ORIGINAL ORDER

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AnimatedBackground from '../../components/Motion/AnimatedBackground';
import Auth3DScene from '../../components/Motion/Auth3DScene';
import { TiltCard, PageTransition } from '../../components/Motion/MotionPrimitives';
import '../../styles/design-system.css';
import '../../styles/animations.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      toast.error('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/send-reset-otp/', { email });
      console.log('✅ OTP sent:', response.data);

      if (response.data.success) {
        toast.success('OTP sent to your email!');
        navigate('/verify-otp', {
          state: {
            email: email,
            verification_token: response.data.verification_token,
            message: 'OTP sent to your email'
          }
        });
      } else {
        toast.error(response.data.error || 'Failed to send OTP');
        setError(response.data.error);
      }
    } catch (error) {
      console.error('❌ Forgot password error:', error);

      if (error.response?.status === 404) {
        const errorMsg = 'The email address you entered is not registered in our system. Please check and try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = error.response?.data?.error || 'Failed to send OTP. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => navigate('/login')}
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
                  <motion.div animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
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
                  Enter your email to receive a password reset OTP
                </motion.p>
              </div>

              <motion.form
                onSubmit={handleSubmit}
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } } }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
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
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: '#fef2f2',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        marginTop: '4px',
                      }}
                    >
                      <AlertCircle size={16} color="#dc2626" />
                      <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
                    </motion.div>
                  )}
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '4px',
                  }}>
                    We'll send a 6-digit OTP to your email. Valid for 10 minutes.
                  </p>
                </motion.div>

                <motion.button
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -2, boxShadow: '0 12px 28px -6px rgba(79,70,229,.55)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px',
                    background: loading ? '#94a3b8' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.7 : 1,
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </motion.button>
              </motion.form>
            </motion.div>
          </TiltCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;