// frontend/src/pages/auth/VerifyOTP.jsx
// COMPLETE FIXED - With auto-fill OTP for development

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, verification_token, otp: preFilledOtp, message } = location.state || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
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
      
      // Auto-submit after a short delay
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
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // ============ HANDLE KEYDOWN ============
  const handleKeyDown = (index, e) => {
    // Backspace to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    // Enter to submit
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
      
      // Focus the next empty input or last input
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
        // Navigate to reset password page
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
        // Reset OTP inputs
        setOtp(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        
        // If OTP is returned in response (development), show it
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #eff6ff, #dbeafe, #ede9fe)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/forgot-password')}
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
          onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckCircle size={32} color="#3b82f6" />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>Verify OTP</h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0,
          }}>
            Enter the 6-digit code sent to
          </p>
          <p style={{
            fontWeight: 600,
            color: '#0f172a',
            fontSize: '16px',
            marginTop: '4px',
          }}>
            {email}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}>
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            marginBottom: '16px',
          }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: '14px', color: '#dc2626' }}>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            marginBottom: '16px',
          }}>
            <CheckCircle size={18} color="#16a34a" />
            <span style={{ fontSize: '14px', color: '#166534' }}>{successMessage}</span>
          </div>
        )}

        {/* OTP Inputs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
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
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={loading}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
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
          onMouseEnter={(e) => {
            if (!loading && timer > 0) {
              e.currentTarget.style.background = '#16a34a';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && timer > 0) {
              e.currentTarget.style.background = '#22c55e';
            }
          }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        {/* Resend & Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
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
            <RefreshCw size={16} className={resendLoading ? 'spinning' : ''} />
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
        </div>

        {/* Loading Animation Styles */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default VerifyOTP;