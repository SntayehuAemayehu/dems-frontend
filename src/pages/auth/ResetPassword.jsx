// frontend/src/pages/auth/ResetPassword.jsx
// COMPLETE - Reset password with token

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, reset_token, message } = location.state || {};
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    length: false,
    uppercase: false,
    number: false,
  });

  useEffect(() => {
    if (!email || !reset_token) {
      toast.error('Invalid request. Please start over.');
      navigate('/forgot-password');
    }
  }, [email, reset_token, navigate]);

  const checkPasswordStrength = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;
    
    setValidationErrors({
      length: length >= 6,
      uppercase: hasUpper,
      number: hasNumber,
    });
    
    let strength = 0;
    if (length >= 6) strength++;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password-token/', {
        email: email,
        reset_token: reset_token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      console.log('✅ Password reset response:', response.data);

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successful!');
        
        // Auto-redirect to login after success
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Password reset successful! Please login with your new password.',
              email: email
            }
          });
        }, 3000);
      } else {
        toast.error(response.data.error || 'Failed to reset password');
        setError(response.data.error);
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Invalid reset token. Please request a new OTP.';
        setError(errorMsg);
        toast.error(errorMsg);
        // Navigate back to forgot password if token is invalid
        if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
          setTimeout(() => {
            navigate('/forgot-password');
          }, 3000);
        }
      } else {
        const errorMsg = error.response?.data?.error || 'Failed to reset password. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ SUCCESS STATE ============
  if (success) {
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
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}>Password Reset!</h2>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            marginBottom: '8px',
          }}>
            Your password has been changed successfully.
          </p>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            marginBottom: '24px',
          }}>
            Redirecting to login page...
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 32px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  // ============ RESET PASSWORD FORM ============
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
            <Lock size={32} color="#3b82f6" />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>Set New Password</h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0,
          }}>
            {email ? `Create a new password for ${email}` : 'Create a new password'}
          </p>
        </div>

        {message && (
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
            <span style={{ fontSize: '14px', color: '#166534' }}>{message}</span>
          </div>
        )}

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

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* New Password */}
          <div>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              display: 'block',
              marginBottom: '6px',
            }}>
              New Password
              {passwordStrength && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: passwordStrength === 'Strong' ? '#16a34a' :
                         passwordStrength === 'Medium' ? '#f59e0b' : '#dc2626',
                }}>
                  ({passwordStrength})
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: `2px solid ${error ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? '#dc2626' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '6px',
            }}>
              <p style={{
                fontSize: '12px',
                color: '#64748b',
                margin: '0 0 4px 0',
              }}>Password must contain:</p>
              <ul style={{
                margin: 0,
                paddingLeft: '16px',
                fontSize: '12px',
                listStyle: 'none',
              }}>
                <li style={{
                  color: validationErrors.length ? '#16a34a' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {validationErrors.length ? '✅' : '⬜'} At least 6 characters
                </li>
                <li style={{
                  color: validationErrors.uppercase ? '#16a34a' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {validationErrors.uppercase ? '✅' : '⬜'} One uppercase letter
                </li>
                <li style={{
                  color: validationErrors.number ? '#16a34a' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {validationErrors.number ? '✅' : '⬜'} One number
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              display: 'block',
              marginBottom: '6px',
            }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: `2px solid ${error && confirmPassword ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error && confirmPassword ? '#dc2626' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p style={{
                fontSize: '12px',
                color: '#dc2626',
                marginTop: '4px',
              }}>
                ⚠️ Passwords do not match
              </p>
            )}
          </div>

          <button
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
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;