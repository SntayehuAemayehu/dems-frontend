
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Camera,
  Lock, Save, RefreshCw, Eye, EyeOff,
  Building2, BookOpen, Shield, CreditCard,
  GraduationCap, Briefcase, Sparkles,
  CheckCircle2, ArrowUpRight, X, ShieldCheck,
  UserRound, KeyRound, ImagePlus, Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);

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

  const fetchProfile = async () => {
    if (initialLoadDone.current && !loading) return;

    try {
      setLoading(true);

      const userRes = await api.get('/auth/profile/');
      const userData = userRes.data;

      if (!isMounted.current) return;

      setProfile(userData);

      setFormData(prev => ({
        ...prev,
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      }));

      if (userData.role === 'STUDENT') {
        try {
          const studentRes = await api.get('/auth/profile/student/');
          const studentData = studentRes.data;

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
      } else if (
        userData.role === 'TEACHER' ||
        userData.role === 'DEPT_HEAD'
      ) {
        try {
          const teacherRes = await api.get('/auth/profile/teacher/');
          const teacherData = teacherRes.data;

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
        if (isMounted.current) setRoleProfile({});
      }

      initialLoadDone.current = true;

    } catch (error) {
      console.error('Failed to fetch profile:', error);

      if (isMounted.current) {
        toast.error('Failed to load profile');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!initialLoadDone.current) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userRole = profile?.role;
      let hasChanges = false;

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

      if (
        userRole === 'ADMIN' ||
        userRole === 'FINANCE' ||
        userRole === 'REGISTRAR'
      ) {
        toast.success('Profile updated successfully!');
      }

      initialLoadDone.current = false;
      await fetchProfile();

    } catch (error) {
      console.error('Failed to update profile:', error);

      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update profile';

      toast.error(errorMsg);

    } finally {
      setSaving(false);
    }
  };

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        e.target.value = '';
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, GIF, WEBP)');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, profile_picture: file });
      toast.success('Profile picture selected. Click Save Changes to upload.');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'STUDENT': return <GraduationCap size={20} />;
      case 'TEACHER': return <BookOpen size={20} />;
      case 'ADMIN': return <Shield size={20} />;
      case 'FINANCE': return <CreditCard size={20} />;
      case 'REGISTRAR': return <Briefcase size={20} />;
      case 'DEPT_HEAD': return <Building2 size={20} />;
      default: return <User size={20} />;
    }
  };

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

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  const styles = {
    page: {
      minHeight: '100vh',
      padding: '30px 24px 60px',
      background: '#f4f7fc',
      color: '#172554',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    container: {
      maxWidth: '1050px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '25px',
    },
    heading: {
      fontSize: '28px',
      fontWeight: 800,
      letterSpacing: '-1px',
      color: '#111c3a',
      margin: '0 0 6px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#8390aa',
      margin: 0,
    },
    card: {
      background: '#fff',
      border: '1px solid #e9eef7',
      borderRadius: '18px',
      boxShadow: '0 5px 25px rgba(31,54,100,0.045)',
      overflow: 'hidden',
      marginBottom: '20px',
    },
    cardBody: {
      padding: '26px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 750,
      color: '#172554',
      margin: '0 0 5px',
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
    },
    sectionDescription: {
      color: '#94a3b8',
      fontSize: '12px',
      margin: '0 0 23px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '19px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 700,
      color: '#475569',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '45px',
      padding: '11px 13px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      background: '#fff',
      color: '#1e293b',
      fontSize: '13px',
      outline: 'none',
      transition: 'all .2s ease',
      fontFamily: 'inherit',
    },
    readonly: {
      background: '#f5f7fb',
      color: '#8491a7',
      cursor: 'not-allowed',
    },
    buttonPrimary: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      minHeight: '44px',
      padding: '0 20px',
      background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      boxShadow: '0 5px 14px rgba(37,99,235,.2)',
      transition: 'all .2s ease',
    },
    buttonSecondary: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      minHeight: '44px',
      padding: '0 18px',
      background: '#fff',
      color: '#475569',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
    },
    divider: {
      height: '1px',
      background: '#edf1f7',
      margin: '24px 0',
    },
  };

  const Field = ({
    label,
    icon: Icon,
    children,
    full = false,
    hint,
  }) => (
    <div style={{ minWidth: 0, gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={styles.label}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon
            size={16}
            style={{
              position: 'absolute',
              left: '13px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        )}
        {children}
      </div>
      {hint && (
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }}>
          {hint}
        </p>
      )}
    </div>
  );

  const inputStyle = (readOnly = false, hasIcon = false) => ({
    ...styles.input,
    ...(readOnly ? styles.readonly : {}),
    ...(hasIcon ? { paddingLeft: '40px' } : {}),
  });

  const sectionHeading = (icon, title, description) => (
    <div>
      <h3 style={styles.sectionTitle}>
        {icon}
        {title}
      </h3>
      <p style={styles.sectionDescription}>{description}</p>
    </div>
  );

  const passwordInput = (label, value, field, visible, setVisible) => (
    <div style={{ marginBottom: '18px' }}>
      <label style={styles.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Lock
          size={16}
          style={{
            position: 'absolute',
            left: '13px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }}
        />
        <input
          type={visible ? 'text' : 'password'}
          required
          value={value}
          minLength={field === 'new_password' ? 8 : undefined}
          onChange={(e) =>
            setPasswordData({ ...passwordData, [field]: e.target.value })
          }
          style={{ ...styles.input, paddingLeft: '40px', paddingRight: '42px' }}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        background: '#f4f7fc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #dbeafe',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'profileSpin .8s linear infinite',
        }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#172554', margin: '0 0 5px', fontSize: '15px' }}>
            Preparing your profile
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            Please wait a moment...
          </p>
        </div>
        <style>{`@keyframes profileSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const roleColor = getRoleColor(profile?.role);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes profileSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes profileFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .profile-page-content {
          animation: profileFade .45s ease;
        }

        .premium-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.10) !important;
          outline: none;
        }

        .premium-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        .premium-btn:active {
          transform: translateY(0);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 19px;
        }

        .profile-modal-backdrop {
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }

        .profile-avatar-upload:hover {
          background: rgba(37,99,235,.95) !important;
        }

        @media(max-width: 650px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-page-content {
            padding: 18px 12px 40px !important;
          }
          .profile-hero {
            padding: 23px !important;
          }
          .profile-actions {
            flex-direction: column !important;
          }
          .profile-actions button {
            width: 100% !important;
          }
          .profile-modal {
            padding: 22px !important;
          }
        }
      `}</style>

      <div className="profile-page-content" style={styles.container}>

        {/* PAGE HEADER */}
        <div style={styles.header}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.4px',
              marginBottom: '8px',
            }}>
              <Sparkles size={14} />
              ACCOUNT MANAGEMENT
            </div>

            <h1 style={styles.heading}>My Profile</h1>

            <p style={styles.subtitle}>
              Manage your personal information, account details and security.
            </p>
          </div>

          <button
            className="premium-btn"
            onClick={() => {
              initialLoadDone.current = false;
              fetchProfile();
            }}
            style={styles.buttonSecondary}
          >
            <RefreshCw size={15} />
            Refresh Profile
          </button>
        </div>

        {/* PROFILE HERO */}
        <div
          className="profile-hero"
          style={{
            ...styles.card,
            background: 'linear-gradient(125deg,#101d43 0%,#173b79 65%,#2563eb 100%)',
            border: 'none',
            color: '#fff',
            padding: '30px',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            right: '-45px',
            top: '-100px',
            width: '260px',
            height: '260px',
            border: '1px solid rgba(255,255,255,.09)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            right: '40px',
            bottom: '-130px',
            width: '230px',
            height: '230px',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: '112px',
              height: '112px',
              borderRadius: '24px',
              padding: '4px',
              background: 'rgba(255,255,255,.25)',
              position: 'relative',
              flexShrink: 0,
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '20px',
                overflow: 'hidden',
                background: '#dbeafe',
              }}>
                <img
                  src={
                    formData.profile_picture
                      ? URL.createObjectURL(formData.profile_picture)
                      : profile?.profile_picture || 'https://via.placeholder.com/112x112?text=Profile'
                  }
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/112x112?text=Profile';
                  }}
                />
              </div>

              <label
                className="profile-avatar-upload"
                title="Upload profile picture"
                style={{
                  position: 'absolute',
                  right: '-9px',
                  bottom: '-9px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#fff',
                  border: '3px solid #fff',
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    opacity: 0,
                    overflow: 'hidden',
                  }}
                />
              </label>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#bfdbfe',
                letterSpacing: '1.5px',
                marginBottom: '8px',
              }}>
                WELCOME BACK
              </div>

              <h2 style={{
                fontSize: '25px',
                fontWeight: 800,
                letterSpacing: '-.7px',
                margin: '0 0 9px',
                color: '#fff',
              }}>
                {profile?.full_name || 'User'}
              </h2>

              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '13px',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,.14)',
                  border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: '30px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {getRoleIcon(profile?.role)}
                  {profile?.role?.replace('_', ' ') || 'UNKNOWN'}
                </span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  color: '#bbf7d0',
                  fontWeight: 600,
                }}>
                  <CheckCircle2 size={14} />
                  Account Active
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: '17px',
                flexWrap: 'wrap',
                color: '#dbeafe',
                fontSize: '12px',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Mail size={14} />
                  {profile?.email || '—'}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Phone size={14} />
                  {profile?.phone || '—'}
                </span>
              </div>
            </div>

            <div style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 13px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,.10)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#dbeafe',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              <ShieldCheck size={16} />
              Secure Account
            </div>
          </div>

          {formData.profile_picture && (
            <p style={{
              color: '#bfdbfe',
              fontSize: '11px',
              margin: '18px 0 0',
            }}>
              <ImagePlus size={13} style={{ display: 'inline', marginRight: '5px' }} />
              New picture selected. Save your changes to upload it.
            </p>
          )}
        </div>

        {/* PERSONAL INFORMATION */}
        <div style={styles.card}>
          <div style={styles.cardBody}>
            {sectionHeading(
              <div style={{
                width: '37px',
                height: '37px',
                display: 'grid',
                placeItems: 'center',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: '11px',
              }}>
                <UserRound size={19} />
              </div>,
              'Personal Information',
              'Your basic personal and contact information.'
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="profile-grid">
                <Field label="FULL NAME" icon={User}>
                  <input
                    className="premium-input"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    style={inputStyle(false, true)}
                  />
                </Field>

                <Field label="EMAIL ADDRESS" icon={Mail}>
                  <input
                    className="premium-input"
                    type="email"
                    value={formData.email}
                    disabled
                    style={inputStyle(true, true)}
                  />
                </Field>

                <Field label="PHONE NUMBER" icon={Phone}>
                  <input
                    className="premium-input"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 912 345 678"
                    style={inputStyle(false, true)}
                  />
                </Field>

                <Field label="DATE OF BIRTH" icon={Calendar}>
                  <input
                    className="premium-input"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="GENDER" icon={User}>
                  <select
                    className="premium-input"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={inputStyle()}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(g => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ADDRESS" icon={MapPin} full>
                  <textarea
                    className="premium-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    placeholder="Enter your address..."
                    style={{
                      ...styles.input,
                      padding: '13px',
                      resize: 'vertical',
                      minHeight: '85px',
                    }}
                  />
                </Field>
              </div>

              {/* STUDENT INFORMATION */}
              {profile?.role === 'STUDENT' && (
                <>
                  <div style={styles.divider} />

                  {sectionHeading(
                    <div style={{
                      width: '37px',
                      height: '37px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#eff6ff',
                      color: '#2563eb',
                      borderRadius: '11px',
                    }}>
                      <GraduationCap size={20} />
                    </div>,
                    'Academic Information',
                    'Your student identity and academic records.'
                  )}

                  <div className="profile-grid">
                    <Field label="STUDENT ID" icon={Fingerprint}>
                      <input
                        className="premium-input"
                        value={formData.student_id}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="CGPA" icon={Sparkles}>
                      <input
                        className="premium-input"
                        value={formData.cgpa}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="DEPARTMENT" icon={Building2}>
                      <input
                        className="premium-input"
                        value={formData.department}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="PROGRAM" icon={BookOpen}>
                      <input
                        className="premium-input"
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        placeholder="e.g. BSc Computer Science"
                        style={inputStyle(false, true)}
                      />
                    </Field>

                    <Field label="TOTAL CREDITS" icon={CheckCircle2}>
                      <input
                        className="premium-input"
                        value={formData.total_credits}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* TEACHER INFORMATION */}
              {(profile?.role === 'TEACHER' || profile?.role === 'DEPT_HEAD') && (
                <>
                  <div style={styles.divider} />

                  {sectionHeading(
                    <div style={{
                      width: '37px',
                      height: '37px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#f5f3ff',
                      color: '#7c3aed',
                      borderRadius: '11px',
                    }}>
                      <BookOpen size={20} />
                    </div>,
                    'Professional Information',
                    'Your employment and professional details.'
                  )}

                  <div className="profile-grid">
                    <Field label="EMPLOYEE ID" icon={Fingerprint}>
                      <input
                        className="premium-input"
                        value={formData.employee_id}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="DEPARTMENT" icon={Building2}>
                      <input
                        className="premium-input"
                        value={formData.department}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="QUALIFICATION" icon={GraduationCap}>
                      <input
                        className="premium-input"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. PhD in Computer Science"
                        style={inputStyle(false, true)}
                      />
                    </Field>

                    <Field label="SPECIALIZATION" icon={BookOpen}>
                      <input
                        className="premium-input"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g. Machine Learning"
                        style={inputStyle(false, true)}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* ADMIN / FINANCE / REGISTRAR */}
              {(
                profile?.role === 'ADMIN' ||
                profile?.role === 'FINANCE' ||
                profile?.role === 'REGISTRAR'
              ) && (
                <>
                  <div style={styles.divider} />

                  {sectionHeading(
                    <div style={{
                      width: '37px',
                      height: '37px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#fff7ed',
                      color: '#d97706',
                      borderRadius: '11px',
                    }}>
                      <Briefcase size={19} />
                    </div>,
                    'Staff Information',
                    'Your system role and administrative details.'
                  )}

                  <div className="profile-grid">
                    <Field label="SYSTEM ROLE" icon={Shield}>
                      <input
                        className="premium-input"
                        value={profile?.role || ''}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>

                    <Field label="DEPARTMENT" icon={Building2}>
                      <input
                        className="premium-input"
                        value={formData.department || 'Administration'}
                        readOnly
                        style={inputStyle(true, true)}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* ACTIONS */}
              <div style={styles.divider} />

              <div
                className="profile-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className="premium-btn"
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  style={{
                    ...styles.buttonSecondary,
                    color: '#b45309',
                    borderColor: '#fde68a',
                    background: '#fffbeb',
                  }}
                >
                  <KeyRound size={16} />
                  Change Password
                </button>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.buttonPrimary,
                    opacity: saving ? .65 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minWidth: '160px',
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="profile-saving-icon" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                      <ArrowUpRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '13px',
          padding: '18px 20px',
          border: '1px solid #e5eaf3',
          borderRadius: '14px',
          background: '#fff',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: '12px',
              color: '#172554',
              fontWeight: 750,
              margin: '0 0 4px',
            }}>
              Your account security matters
            </h4>
            <p style={{
              fontSize: '11px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Keep your account information up to date and use a strong password.
            </p>
          </div>

          <Lock size={17} color="#94a3b8" />
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setShowPasswordModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,20,45,.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#fff',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 25px 80px rgba(0,0,0,.25)',
              animation: 'profileFade .25s ease',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '23px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '45px',
                  height: '45px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '13px',
                  background: '#fff7ed',
                  color: '#d97706',
                }}>
                  <Lock size={21} />
                </div>

                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#172554',
                    margin: '0 0 4px',
                  }}>
                    Change Password
                  </h2>
                  <p style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    margin: 0,
                  }}>
                    Update your account credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{
              padding: '12px 14px',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '10px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '22px',
            }}>
              <ShieldCheck size={18} color="#2563eb" />
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#1e40af',
                lineHeight: 1.5,
              }}>
                Use a strong password with at least 8 characters to protect your account.
              </p>
            </div>

            <form onSubmit={handleChangePassword}>
              {passwordInput(
                'Current Password',
                passwordData.old_password,
                'old_password',
                showOldPassword,
                setShowOldPassword
              )}

              {passwordInput(
                'New Password',
                passwordData.new_password,
                'new_password',
                showNewPassword,
                setShowNewPassword
              )}

              {passwordInput(
                'Confirm New Password',
                passwordData.confirm_password,
                'confirm_password',
                showConfirmPassword,
                setShowConfirmPassword
              )}

              <div style={{
                display: 'flex',
                gap: '11px',
                marginTop: '25px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    ...styles.buttonSecondary,
                    flex: 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="premium-btn"
                  style={{
                    ...styles.buttonPrimary,
                    flex: 1,
                    background: 'linear-gradient(135deg,#d97706,#b45309)',
                    boxShadow: '0 5px 14px rgba(217,119,6,.2)',
                    opacity: savingPassword ? .65 : 1,
                    cursor: savingPassword ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Lock size={15} />
                  {savingPassword ? 'Updating...' : 'Update Password'}
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
