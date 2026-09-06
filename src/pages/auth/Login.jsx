// frontend/src/pages/auth/Login.jsx
// COMPLETE FIXED - With OTP-based password reset flow

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../store/slices/authSlice';
import api from '../../api/api';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const dispatch = useDispatch();
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
        // Save tokens and user data
        if (result.access) localStorage.setItem('access_token', result.access);
        if (result.refresh) localStorage.setItem('refresh_token', result.refresh);
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user));
        if (result.user?.role) localStorage.setItem('user_role', result.user.role);
        
        // Show lock message
        toast.error(`🔒 ${result.message || 'Your account is locked. Please make payment.'}`);
        
        // Redirect to payments page
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
      
      navigate(redirectMap[role] || '/dashboard');
    } catch (error) {
      toast.error(error || 'Login failed');
    }
  };

  // ============= FORGOT PASSWORD HANDLERS =============
  // ============= FORGOT PASSWORD HANDLERS =============
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
            
            // Show OTP in toast (development only)
            if (response.data.development && response.data.otp) {
                toast.success(`📧 Your OTP: ${response.data.otp}`);
                toast.info(`🔑 Use this OTP to reset your password: ${response.data.otp}`, {
                    duration: 10000,
                });
            } else {
                toast.success('OTP sent to your email!');
            }
            
            // Navigate to OTP verification page
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
          {/* Back Button - Top Left */}
          <button
            onClick={handleBackToLogin}
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
            Back to Login
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
              <Mail size={32} color="#3b82f6" />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 8px 0',
            }}>Reset Password</h1>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0,
            }}>
              {resetSent 
                ? 'Check your email for the OTP' 
                : 'Enter your email to receive a password reset OTP'}
            </p>
          </div>

          {resetSent ? (
            // ============= RESET SENT SCREEN =============
            <div style={{
              textAlign: 'center',
              padding: '20px 0',
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
              <button
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Verify OTP
              </button>
              <button
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                Return to Login
              </button>
            </div>
          ) : (
            // ============= FORGOT PASSWORD FORM =============
            <form onSubmit={handleForgotPassword} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
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
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
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

              <button
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
                onMouseEnter={(e) => {
                  if (!resetLoading) {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!resetLoading) {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {resetLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============= LOGIN SCREEN =============
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
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>Welcome Back</h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0,
          }}>Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div style={{
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
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
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
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
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* ============= FORGOT PASSWORD LINK - BELOW THE SUBMIT BUTTON ============= */}
          <div style={{
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
          </div>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '24px',
        }}>
          <p style={{
            color: '#64748b',
            fontSize: '14px',
            margin: 0,
          }}>
            Don't have an account? <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;