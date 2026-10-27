// frontend/src/pages/Profile/ProfilePage.jsx
// COMPLETE - Profile page for ALL roles (Student, Teacher, Finance, etc.)

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Camera,
  Lock, Save, RefreshCw, Eye, EyeOff,
  CheckCircle, XCircle, Building2, BookOpen,
  Shield, CreditCard, GraduationCap, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import { getProfile } from '../../store/slices/authSlice';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    profile_picture: null,
    // Role-specific fields
    department: '',
    program: '',
    qualification: '',
    specialization: '',
    employee_id: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // ============ FETCH PROFILE ============
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const userRes = await api.get('/auth/profile/');
      const userData = userRes.data;
      console.log('👤 User profile:', userData);
      
      // Set form data from user
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        date_of_birth: userData.date_of_birth || '',
        gender: userData.gender || '',
        address: userData.address || '',
        profile_picture: null,
        department: '',
        program: '',
        qualification: '',
        specialization: '',
        employee_id: '',
      });
      
      setProfile(userData);
      
      // Fetch role-specific profile
      if (userData.role === 'STUDENT') {
        const studentRes = await api.get('/auth/profile/student/');
        const studentData = studentRes.data;
        console.log('🎓 Student profile:', studentData);
        setRoleProfile(studentData);
        setFormData(prev => ({
          ...prev,
          department: studentData.department || '',
          program: studentData.program || '',
        }));
      } else if (userData.role === 'TEACHER') {
        const teacherRes = await api.get('/auth/profile/teacher/');
        const teacherData = teacherRes.data;
        console.log('👨‍🏫 Teacher profile:', teacherData);
        setRoleProfile(teacherData);
        setFormData(prev => ({
          ...prev,
          department: teacherData.department || '',
          qualification: teacherData.qualification || '',
          specialization: teacherData.specialization || '',
          employee_id: teacherData.employee_id || '',
        }));
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  // ============ UPDATE PROFILE ============
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add all fields
      Object.keys(formData).forEach(key => {
        if (key === 'profile_picture') {
          if (formData.profile_picture) {
            formDataToSend.append('profile_picture', formData.profile_picture);
          }
        } else {
          formDataToSend.append(key, formData[key] || '');
        }
      });
      
      const response = await api.patch('/auth/profile/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Profile updated:', response.data);
      toast.success('Profile updated successfully!');
      dispatch(getProfile());
      fetchProfile();
      
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ============ CHANGE PASSWORD ============
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await api.post('/auth/change-password/', passwordData);
      console.log('✅ Password changed:', response.data);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('❌ Failed to change password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLE FILE CHANGE ============
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, profile_picture: file });
    }
  };

  // ============ GET ROLE ICON ============
  const getRoleIcon = (role) => {
    switch (role) {
      case 'STUDENT': return <GraduationCap size={24} />;
      case 'TEACHER': return <BookOpen size={24} />;
      case 'ADMIN': return <Shield size={24} />;
      case 'FINANCE': return <CreditCard size={24} />;
      case 'REGISTRAR': return <Briefcase size={24} />;
      case 'DEPT_HEAD': return <Building2 size={24} />;
      default: return <User size={24} />;
    }
  };

  // ============ GET ROLE COLOR ============
  const getRoleColor = (role) => {
    switch (role) {
      case 'STUDENT': return '#2563eb';
      case 'TEACHER': return '#7c3aed';
      case 'ADMIN': return '#dc2626';
      case 'FINANCE': return '#16a34a';
      case 'REGISTRAR': return '#d97706';
      case 'DEPT_HEAD': return '#d81b60';
      default: return '#64748b';
    }
  };

  // ============ GET GENDER OPTIONS ============
  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-header { flex-direction: column !important; text-align: center; }
        }
      `}</style>

      {/* HEADER */}
      <div className="profile-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>
            <User size={28} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
            My Profile
          </h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            Update your personal information and settings
          </p>
        </div>
        <button
          onClick={fetchProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* PROFILE CARD */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          {/* Profile Picture */}
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <img
              src={profile?.profile_picture || 'https://via.placeholder.com/120x120?text=Profile'}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <label style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>
              <Camera size={16} style={{ display: 'inline', marginRight: '4px' }} />
              Upload
              <input
                type="file"
                accept="image/*"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* User Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}>
                {profile?.full_name || 'User'}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                background: getRoleColor(profile?.role) + '20',
                color: getRoleColor(profile?.role),
              }}>
                {getRoleIcon(profile?.role)}
                {profile?.role || 'UNKNOWN'}
              </span>
            </div>
            <p style={{
              color: '#64748b',
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Mail size={16} />
              {profile?.email || '—'}
            </p>
            <p style={{
              color: '#64748b',
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Phone size={16} />
              {profile?.phone || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* PROFILE FORM */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
        <form onSubmit={handleUpdateProfile}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 16px 0',
          }}>
            Personal Information
          </h3>

          <div className="profile-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Email (Read Only)
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#f8fafc',
                  color: '#94a3b8',
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 912 345 678"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="">Select Gender</option>
                {genderOptions.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* ROLE-SPECIFIC FIELDS */}
          {profile?.role === 'STUDENT' && (
            <>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '24px 0 16px 0',
              }}>
                <GraduationCap size={20} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                Student Information
              </h3>
              <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Department selected during registration
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Program
                  </label>
                  <input
                    type="text"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    placeholder="e.g., BSc Computer Science"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {profile?.role === 'TEACHER' && (
            <>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '24px 0 16px 0',
              }}>
                <BookOpen size={20} style={{ display: 'inline', marginRight: '8px', color: '#7c3aed' }} />
                Teacher Information
              </h3>
              <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g., PhD in Computer Science"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Machine Learning"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.3s ease',
                minWidth: '120px',
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = '#2563eb';
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '120px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
            >
              <Lock size={18} />
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* ============ CHANGE PASSWORD MODAL ============ */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <Lock size={24} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength="8"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
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
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Minimum 8 characters
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'none',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#f59e0b',
                    color: 'white',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Lock size={18} />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;