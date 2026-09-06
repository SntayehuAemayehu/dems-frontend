// frontend/src/pages/auth/Register.jsx - COMPLETE FIXED
// Department dropdown now sends department NAME instead of ID

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, School, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [departmentError, setDepartmentError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'STUDENT',
    department: '',
  });
  const navigate = useNavigate();

  // ✅ Fetch departments from database
  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    setDepartmentError(null);
    
    try {
      console.log('📚 Fetching departments...');
      const response = await api.get('/auth/departments/');
      console.log('📚 Full response:', response);
      console.log('📚 Response data:', response.data);
      
      let departmentsData = [];
      
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          departmentsData = response.data.data;
          console.log('✅ Found departments in response.data.data:', departmentsData.length);
        }
        else if (Array.isArray(response.data)) {
          departmentsData = response.data;
          console.log('✅ Response is direct array:', departmentsData.length);
        }
        else if (response.data.results && Array.isArray(response.data.results)) {
          departmentsData = response.data.results;
          console.log('✅ Found departments in response.data.results:', departmentsData.length);
        }
        else if (typeof response.data === 'object' && response.data.id !== undefined) {
          departmentsData = [response.data];
          console.log('✅ Single department object:', departmentsData.length);
        }
        else {
          console.warn('⚠️ Unexpected response format:', response.data);
          departmentsData = [];
        }
      }
      
      if (departmentsData.length > 0) {
        setDepartments(departmentsData);
        console.log(`✅ Loaded ${departmentsData.length} departments`);
      } else {
        setDepartments([]);
        setDepartmentError('No departments available in the system');
        console.log('❌ No departments found');
      }
    } catch (error) {
      console.error('❌ Failed to fetch departments:', error);
      
      let errorMessage = 'Failed to load departments. ';
      
      if (error.response) {
        console.log('Error status:', error.response.status);
        console.log('Error data:', error.response.data);
        
        if (error.response.status === 404) {
          errorMessage += 'Department endpoint not found.';
        } else if (error.response.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage += error.response.data;
          } else if (error.response.data.message) {
            errorMessage += error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage += error.response.data.error;
          } else {
            errorMessage += 'Please contact administrator.';
          }
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setDepartmentError(errorMessage);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // ✅ Fetch departments when component mounts
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ✅ Handle role changes
  useEffect(() => {
    if (formData.role === 'STUDENT') {
      if (departments.length === 0 && !loadingDepartments && !departmentError) {
        fetchDepartments();
      }
    } else {
      setFormData(prev => ({ ...prev, department: '' }));
    }
  }, [formData.role, departments.length, loadingDepartments, departmentError, fetchDepartments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'role' && value !== 'STUDENT') {
      setFormData(prev => ({ ...prev, department: '' }));
    }
  };
// Add this function BEFORE handleSubmit
const validatePassword = (password) => {
    const errors = [];
    
    // Check minimum length (8+)
    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
        return errors;
    }
    
    // Check for numbers
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    
    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    
    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    
    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    
    // Check if too common
    const commonPasswords = [
        'password', 'password123', 'admin123', 'letmein',
        'qwerty123', 'welcome123', 'abc12345', '12345678',
        'student123', 'teacher123', 'test1234', '123456789'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("Password is too common. Please choose a stronger password.");
    }
    
    return errors;
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      setIsLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      setIsLoading(false);
      return;
    }

     // ✅ PASSWORD VALIDATION - ADD THIS
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      passwordErrors.forEach(error => toast.error(error));
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.role === 'STUDENT' && !formData.department) {
      toast.error('Please select a department');
      setIsLoading(false);
      return;
    }

    if (formData.role === 'STUDENT' && !formData.department) {
      toast.error('Please select a department');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Send department NAME (not ID)
      let departmentValue = formData.department;
      
      // If department is a number (ID), find the name
      if (!isNaN(departmentValue)) {
        const selectedDept = departments.find(d => d.id === parseInt(departmentValue));
        if (selectedDept) {
          departmentValue = selectedDept.name;
        }
      }

      const registrationData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        department: departmentValue, // ✅ Send NAME, not ID
      };

      console.log('📝 Registration data:', registrationData);
      console.log('📝 Department value being sent:', departmentValue);
      
      const response = await api.post('/auth/register/', registrationData);
      console.log('✅ Registration successful:', response.data);

      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          // Check for department error
          if (errors.department) {
            toast.error(errors.department);
          } else {
            const firstError = Object.values(errors)[0];
            if (Array.isArray(firstError)) {
              toast.error(firstError[0]);
            } else if (typeof firstError === 'string') {
              toast.error(firstError);
            } else {
              toast.error('Registration failed. Please check your details.');
            }
          }
        } else if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <style>{`
          .register-form::-webkit-scrollbar {
            width: 6px;
          }
          .register-form::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 8px;
          }
          .register-form::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 8px;
          }
          .register-form::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
          @media (max-width: 640px) {
            .register-form {
              padding: 16px;
            }
          }
        `}</style>

        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>Create Account</h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0,
          }}>Join our distance education platform</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }} className="register-form">
          
          {/* Full Name */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }} size={20} />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Sntie alex"
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

          {/* Email */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Email Address *</label>
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

          {/* Phone */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Phone Number *</label>
            <div style={{ position: 'relative' }}>
              <Phone style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }} size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+251 918 116 960"
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

          {/* Role */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white',
                transition: 'all 0.3s ease',
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
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="DEPT_HEAD">Department Head</option>
              <option value="REGISTRAR">Registrar</option>
              <option value="FINANCE">Finance</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* ✅ Department - ONLY visible when role is STUDENT */}
          {formData.role === 'STUDENT' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#334155',
              }}>
                <School size={18} />
                Department *
                {loadingDepartments && (
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    marginLeft: '4px',
                  }}>Loading...</span>
                )}
              </label>

              {/* Loading state */}
              {loadingDepartments && (
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94a3b8',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span>Loading departments...</span>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}

              {/* Error state */}
              {!loadingDepartments && departmentError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '2px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                }}>
                  <AlertCircle size={20} />
                  <span>{departmentError}</span>
                  <button
                    onClick={fetchDepartments}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 12px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Department dropdown */}
              {!loadingDepartments && !departmentError && departments.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      background: 'white',
                      transition: 'all 0.3s ease',
                      appearance: 'none',
                      cursor: 'pointer',
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
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }} size={20} />
                </div>
              )}

              {/* No departments message */}
              {!loadingDepartments && !departmentError && departments.length === 0 && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#92400e',
                }}>
                  <AlertCircle size={20} />
                  <span>No departments available in the system. Please contact administrator.</span>
                </div>
              )}

              {/* Department count */}
              {!loadingDepartments && !departmentError && departments.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '4px',
                }}>
                  {departments.length} department{departments.length > 1 ? 's' : ''} available
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Password *</label>
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
                minLength={8}
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
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              marginTop: '4px',
            }}>Minimum 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }} size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '14px',
              background: isLoading ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
              marginTop: '8px',
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#64748b',
          fontSize: '14px',
        }}>
          Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;