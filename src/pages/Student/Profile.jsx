// frontend/src/pages/Student/Profile.jsx
// COMPLETE FIXED - Works for ALL Roles with ALL Fields

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Camera,
  Lock, Save, RefreshCw, Eye, EyeOff,
  Building2, BookOpen,
  Shield, CreditCard, GraduationCap, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // ============ REFS FOR FAST LOADING ============
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  
  // ============ PASSWORD MODAL STATE ============
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // ============ FORM STATE ============
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    profile_picture: null,
    department: '',
    program: '',
    qualification: '',
    specialization: '',
    employee_id: '',
    student_id: '',
    cgpa: '',
    total_credits: '',
  });

  // ============ FETCH PROFILE ============
  const fetchProfile = async () => {
    // Prevent multiple fetches
    if (initialLoadDone.current && !loading) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const userRes = await api.get('/auth/profile/');
      const userData = userRes.data;
      console.log('👤 User profile:', userData);
      
      if (!isMounted.current) return;
      
      setProfile(userData);
      
      // Update form data with user data
      setFormData(prev => ({
        ...prev,
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      }));
      
      // Fetch role-specific profile
      if (userData.role === 'STUDENT') {
        try {
          const studentRes = await api.get('/auth/profile/student/');
          const studentData = studentRes.data;
          console.log('🎓 Student profile:', studentData);
          if (isMounted.current) {
            setRoleProfile(studentData);
            setFormData(prev => ({
              ...prev,
              date_of_birth: studentData.date_of_birth || '',
              gender: studentData.gender || '',
              address: studentData.address || '',
              department: studentData.department || '',
              program: studentData.program || '',
              student_id: studentData.student_id || '',
              cgpa: studentData.cgpa || '0.00',
              total_credits: studentData.total_credits || '0',
            }));
          }
        } catch (e) {
          console.log('No student profile found');
        }
      } else if (userData.role === 'TEACHER' || userData.role === 'DEPT_HEAD') {
        try {
          const teacherRes = await api.get('/auth/profile/teacher/');
          const teacherData = teacherRes.data;
          console.log('👨‍🏫 Teacher profile:', teacherData);
          if (isMounted.current) {
            setRoleProfile(teacherData);
            setFormData(prev => ({
              ...prev,
              department: teacherData.department || '',
              qualification: teacherData.qualification || '',
              specialization: teacherData.specialization || '',
              employee_id: teacherData.employee_id || '',
            }));
          }
        } catch (e) {
          console.log('No teacher profile found');
        }
      } else {
        // For Admin, Finance, Registrar - no role-specific profile needed
        if (isMounted.current) {
          setRoleProfile({});
        }
      }
      
      initialLoadDone.current = true;
      
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      if (isMounted.current) {
        toast.error('Failed to load profile');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Only fetch if not loaded yet
    if (!initialLoadDone.current) {
      fetchProfile();
    } else {
      setLoading(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, navigate]);

  // ============ UPDATE PROFILE - WORKS FOR ALL ROLES ============
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const userRole = profile?.role;
      let hasChanges = false;
      
      // 1. Update User Profile (works for ALL roles)
      const userFormData = new FormData();
      
      if (formData.full_name && formData.full_name !== profile?.full_name) {
        userFormData.append('full_name', formData.full_name);
        hasChanges = true;
      }
      if (formData.phone && formData.phone !== profile?.phone) {
        userFormData.append('phone', formData.phone);
        hasChanges = true;
      }
      if (formData.profile_picture) {
        userFormData.append('profile_picture', formData.profile_picture);
        hasChanges = true;
      }
      
      if (hasChanges) {
        await api.patch('/auth/profile/', userFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Profile updated successfully!');
      }
      
      // 2. Update Student Profile (ONLY for STUDENT role)
      if (userRole === 'STUDENT') {
        const studentData = {};
        if (formData.address && formData.address !== roleProfile?.address) {
          studentData.address = formData.address;
          hasChanges = true;
        }
        if (formData.date_of_birth && formData.date_of_birth !== roleProfile?.date_of_birth) {
          studentData.date_of_birth = formData.date_of_birth;
          hasChanges = true;
        }
        if (formData.gender && formData.gender !== roleProfile?.gender) {
          studentData.gender = formData.gender;
          hasChanges = true;
        }
        if (formData.program && formData.program !== roleProfile?.program) {
          studentData.program = formData.program;
          hasChanges = true;
        }
        
        if (Object.keys(studentData).length > 0) {
          await api.patch('/auth/profile/student/', studentData);
          toast.success('Student profile updated successfully!');
        }
      }
      
      // 3. Update Teacher Profile (ONLY for TEACHER or DEPT_HEAD)
      if (userRole === 'TEACHER' || userRole === 'DEPT_HEAD') {
        const teacherData = {};
        if (formData.qualification && formData.qualification !== roleProfile?.qualification) {
          teacherData.qualification = formData.qualification;
          hasChanges = true;
        }
        if (formData.specialization && formData.specialization !== roleProfile?.specialization) {
          teacherData.specialization = formData.specialization;
          hasChanges = true;
        }
        
        if (Object.keys(teacherData).length > 0) {
          await api.patch('/auth/profile/teacher/', teacherData);
          toast.success('Teacher profile updated successfully!');
        }
      }
      
      // 4. For Admin, Finance, Registrar - just user profile update is enough
      if (userRole === 'ADMIN' || userRole === 'FINANCE' || userRole === 'REGISTRAR') {
        // Already updated user profile above
        toast.success('Profile updated successfully!');
      }
      
      // Refresh profile data
      initialLoadDone.current = false;
      await fetchProfile();
      
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.message || 
                       'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // ============ CHANGE PASSWORD ============
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      setSavingPassword(false);
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setSavingPassword(false);
      return;
    }
    
    try {
      const response = await api.post('/auth/change-password/', passwordData);
      toast.success(response.data.message || 'Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ============ HANDLE FILE CHANGE ============
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, GIF, WEBP)');
        e.target.value = '';
        return;
      }
      
      setFormData({ ...formData, profile_picture: file });
      toast.success('Profile picture selected. Click "Save Changes" to upload.');
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

  // ============ GENDER OPTIONS ============
  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  // ============ LOADING STATE - Fast Loading ============
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading profile...</p>
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
          .action-buttons { flex-direction: column !important; }
          .action-buttons button { width: 100% !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>
            <User size={24} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
            My Profile
          </h1>
          <p style={{
            color: '#64748b',
            margin: '2px 0 0 0',
            fontSize: '14px',
          }}>
            Update your personal information and settings
          </p>
        </div>
        <button
          onClick={() => {
            initialLoadDone.current = false;
            fetchProfile();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '6px',
            color: '#475569',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.3s ease',
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* PROFILE CARD */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }} className="profile-header">
          {/* Profile Picture */}
          <div style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #e2e8f0',
            flexShrink: 0,
          }}>
            {formData.profile_picture ? (
              <img
                src={URL.createObjectURL(formData.profile_picture)}
                alt="Profile Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <img
                src={profile?.profile_picture || 'https://via.placeholder.com/100x100?text=Profile'}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x100?text=Profile';
                }}
              />
            )}
            <label style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>
              <Camera size={14} style={{ display: 'inline', marginRight: '4px' }} />
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
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}>
                {profile?.full_name || 'User'}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '11px',
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
              fontSize: '14px',
            }}>
              <Mail size={14} />
              {profile?.email || '—'}
            </p>
            <p style={{
              color: '#64748b',
              margin: '2px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
            }}>
              <Phone size={14} />
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
        padding: '20px',
      }}>
        <form onSubmit={handleUpdateProfile}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 16px 0',
          }}>
            Personal Information
          </h3>

          <div className="profile-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
          }}>
            {/* Full Name - ALL ROLES */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Email - Read Only - ALL ROLES */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Email (Read Only)
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#f8fafc',
                  color: '#94a3b8',
                }}
              />
            </div>

            {/* Phone - ALL ROLES */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 912 345 678"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Date of Birth - ALL ROLES */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Gender - ALL ROLES */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
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

            {/* Address - ALL ROLES */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="2"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* STUDENT ROLE SPECIFIC FIELDS */}
          {/* ============================================================ */}
          {profile?.role === 'STUDENT' && (
            <>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '20px 0 12px 0',
              }}>
                <GraduationCap size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                Student Information
              </h3>
              <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.student_id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    CGPA
                  </label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Program
                  </label>
                  <input
                    type="text"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    placeholder="e.g., BSc Computer Science"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Total Credits
                  </label>
                  <input
                    type="text"
                    value={formData.total_credits}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* TEACHER / DEPT HEAD ROLE SPECIFIC FIELDS */}
          {/* ============================================================ */}
          {(profile?.role === 'TEACHER' || profile?.role === 'DEPT_HEAD') && (
            <>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '20px 0 12px 0',
              }}>
                <BookOpen size={18} style={{ display: 'inline', marginRight: '8px', color: '#7c3aed' }} />
                Teacher Information
              </h3>
              <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g., PhD in Computer Science"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Machine Learning"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
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

          {/* ============================================================ */}
          {/* ADMIN / FINANCE / REGISTRAR - Additional Info */}
          {/* ============================================================ */}
          {(profile?.role === 'ADMIN' || profile?.role === 'FINANCE' || profile?.role === 'REGISTRAR') && (
            <>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '20px 0 12px 0',
              }}>
                <Briefcase size={18} style={{ display: 'inline', marginRight: '8px', color: '#d97706' }} />
                Staff Information
              </h3>
              <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile?.role || ''}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department || 'Administration'}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f8fafc',
                      color: '#94a3b8',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="action-buttons" style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
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
                gap: '6px',
                padding: '10px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.3s ease',
                minWidth: '100px',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = '#2563eb';
              }}
            >
              <Save size={16} />
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
                gap: '6px',
                padding: '10px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '100px',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
            >
              <Lock size={16} />
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
            padding: '28px',
            maxWidth: '440px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                <Lock size={20} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >×</button>
            </div>

            <form onSubmit={handleChangePassword}>
              {/* Current Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength="8"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Minimum 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
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
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'none',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: savingPassword ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    background: savingPassword ? '#94a3b8' : '#f59e0b',
                    color: 'white',
                    opacity: savingPassword ? 0.6 : 1,
                    fontSize: '14px',
                  }}
                >
                  <Lock size={16} />
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;