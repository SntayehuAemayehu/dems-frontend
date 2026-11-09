import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  X,
  User,
  LogOut,
  BookOpen,
  Home,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Video,
  FileText,
  LayoutDashboard,
  ChevronDown,
  Info,
  ClipboardList,
  CreditCard,
  Shield,
  Sparkles,
  Bell,
  Newspaper
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import NotificationBell from '../common/NotificationBell';
import { useDarkMode } from '../../context/DarkModeContext';
import { getMediaUrl } from '../../api/api';

const Header = ({ isDarkMode: propDarkMode, toggleDarkMode: propToggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const darkModeContext = useDarkMode();
  
  const isDarkMode =
    propDarkMode !== undefined
      ? propDarkMode
      : darkModeContext.isDarkMode;
      
  const toggleDarkMode =
    propToggleDarkMode ||
    darkModeContext.toggleDarkMode ||
    (() => {});
    
  const role = user?.role?.toUpperCase();

  // Dashboard paths for different user roles
  const dashboardPaths = {
    STUDENT: '/dashboard',
    TEACHER: '/teacher/dashboard',
    ADMIN: '/admin/dashboard',
    FINANCE: '/finance/dashboard',
    REGISTRAR: '/registrar/dashboard',
    DEPT_HEAD: '/dept/dashboard',
  };
  const dashboardPath = dashboardPaths[role] || '/dashboard';

  // Public navigation links with refined items
  const publicLinks = [
    {
      name: 'Home',
      path: '/',
      icon: <Home size={17} />,
    },
    // {
    //   name: 'Courses',
    //   path: '/courses',
    //   icon: <BookOpen size={17} />,
    // },
    {
      name: 'About',
      path: '/terms-and-policy',
      icon: <Info size={17} />,
    },
  ];

  // Role-specific navigation links
  const getRoleLinks = () => {
    if (!isAuthenticated) return [];
    switch (role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={17} /> },
          { name: 'My Courses', path: '/courses', icon: <BookOpen size={17} /> },
          { name: 'Exams', path: '/exams', icon: <FileText size={17} /> },
          { name: 'Results', path: '/assignment-results', icon: <ClipboardList size={17} /> },
          { name: 'Live Classes', path: '/live-classes', icon: <Video size={17} /> },
          { name: 'Payments', path: '/payments', icon: <CreditCard size={17} /> },
        ];
      case 'TEACHER':
        return [
          { name: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard size={17} /> },
          { name: 'My Courses', path: '/teacher/courses', icon: <BookOpen size={17} /> },
          { name: 'Exams', path: '/teacher/exams', icon: <FileText size={17} /> },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
          { name: 'Proctoring', path: '/admin/proctoring-review', icon: <Shield size={17} /> },
        ];
      case 'FINANCE':
        return [{ name: 'Dashboard', path: '/finance/dashboard', icon: <LayoutDashboard size={17} /> }];
      case 'REGISTRAR':
        return [{ name: 'Dashboard', path: '/registrar/dashboard', icon: <LayoutDashboard size={17} /> }];
      case 'DEPT_HEAD':
        return [{ name: 'Dashboard', path: '/dept/dashboard', icon: <LayoutDashboard size={17} /> }];
      default:
        return [{ name: 'Dashboard', path: dashboardPath, icon: <LayoutDashboard size={17} /> }];
    }
  };
  const roleLinks = getRoleLinks();

  // Ultra-Premium Theme Color Palette
  const colors = {
    background: isDarkMode
      ? 'rgba(3, 7, 18, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(15, 23, 42, 0.06)',
    hover: isDarkMode
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(79, 70, 229, 0.04)',
    mobileBackground: isDarkMode ? '#0b0f19' : '#ffffff',
    accent: '#4f46e5', // Rich Indigo Accent
    accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const getInitials = () => {
    const name = user?.full_name || user?.username || 'User';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  const profileImage = user?.profile_picture ? getMediaUrl(user.profile_picture) : null;

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '76px',
    padding: '0 32px',
    background: colors.background,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${colors.border}`,
    boxShadow: scrolled
      ? isDarkMode
        ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
        : '0 10px 30px -10px rgba(79, 70, 229, 0.08)'
      : 'none',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? colors.accent : colors.muted,
    background: isActive
      ? isDarkMode
        ? 'rgba(79, 70, 229, 0.15)'
        : 'rgba(79, 70, 229, 0.08)'
      : 'transparent',
    transition: 'all 0.25s ease',
  });

  const mobileLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    color: isActive ? colors.accent : colors.text,
    background: isActive
      ? isDarkMode
        ? 'rgba(79, 70, 229, 0.18)'
        : 'rgba(79, 70, 229, 0.08)'
      : 'transparent',
  });

  return (
    <>
      <header style={headerStyle}>
        <style>{`
          .dems-header-link:hover {
            color: ${colors.accent} !important;
            background: ${colors.hover} !important;
          }
          .dems-header-button:hover {
            background: ${colors.hover} !important;
            transform: scale(1.05);
          }
          .dems-glow-btn:hover {
            opacity: 0.92;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
          }
          .dems-profile-dropdown {
            animation: demsDropdown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes demsDropdown {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @media (max-width: 860px) {
            .dems-desktop-nav { display: none !important; }
            .dems-desktop-actions { display: none !important; }
            .dems-mobile-button { display: flex !important; }
            .dems-hide-mobile { display: none !important; }
          }
          @media (min-width: 861px) {
            .dems-desktop-nav { display: flex !important; }
            .dems-desktop-actions { display: flex !important; }
            .dems-mobile-button { display: none !important; }
            .dems-mobile-menu { display: none !important; }
          }
        `}</style>

        <div
          className="dems-header-container"
          style={{
            maxWidth: '1440px',
            height: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* Brand Logo & Title */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e1b4b' : '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
                padding: '3px',
              }}
            >
              <img
                src="/Mekdela_Amba_University_logo.jpg"
                alt="Mekdela Amba University"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  background: '#ffffff',
                }}
              />
            </div>
            <div>
              <div
                className="dems-logo-name dems-hide-mobile"  // 👈 Added hide class
                style={{
                  color: colors.text,
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  lineHeight: 1.2,
                }}
              >
                MEKDELA AMBA UNIVERSITY
              </div>
              <div
                className="dems-hide-mobile" // 👈 Added hide class
                style={{
                  color: colors.muted,
                  fontSize: '11px',
                  fontWeight: 600,
                  marginTop: '2px',
                  letterSpacing: '0.3px',
                }}
              >
                Distance Education Portal
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="dems-desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flex: 1,
            }}
          >
            {publicLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                style={navLinkStyle}
                className="dems-header-link"
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
            {/* {isAuthenticated && (
              <NavLink
                to={dashboardPath}
                style={navLinkStyle}
                className="dems-header-link"
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>
            )} */}
          </nav>
          {/* Unified Actions Container */}
          <div
            className="dems-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Desktop Only: Notification Bell & News Icon */}
            {isAuthenticated && (
              <div className="dems-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <NotificationBell />
                {role !== 'ADMIN' && (
                  <Link
                    to="/news"
                    aria-label="News"
                    title="News"
                    className="dems-header-button"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      background: colors.hover,
                      color: colors.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Newspaper size={16} />
                  </Link>
                )}
              </div>
            )}

            {/* Dark Mode Toggle (Always visible on all devices) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
              className="dems-header-button"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                background: colors.hover,
                color: isDarkMode ? '#fbbf24' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Desktop Only: Auth (Login/Register) or User Profile */}
            <div className="dems-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isAuthenticated ? (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-expanded={isProfileOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 14px 6px 6px',
                      border: `1px solid ${colors.border}`,
                      background: colors.hover,
                      borderRadius: '35px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                        position: 'relative',
                      }}
                    >
                      {getInitials()}
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt="Profile"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        color: colors.text,
                        fontSize: '13px',
                        fontWeight: 600,
                        maxWidth: '110px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown
                      size={15}
                      color={colors.muted}
                      style={{
                        transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div
                      className="dems-profile-dropdown"
                      style={{
                        position: 'absolute',
                        top: '54px',
                        right: 0,
                        width: '240px',
                        background: colors.mobileBackground,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        padding: '10px',
                        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
                        zIndex: 1001,
                      }}
                    >
                      <div
                        style={{
                          padding: '14px',
                          borderBottom: `1px solid ${colors.border}`,
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>
                          {user?.full_name || 'User'}
                        </div>
                        <div style={{ color: colors.muted, fontSize: '11px', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {role?.replace('_', ' ') || 'Scholar'}
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="dems-header-link"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: colors.text, textDecoration: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                      >
                        <User size={17} /> My Profile
                      </Link>
                      <Link
                        to={dashboardPath}
                        onClick={() => setIsProfileOpen(false)}
                        className="dems-header-link"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: colors.text, textDecoration: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                      >
                        <LayoutDashboard size={17} /> Dashboard Hub
                      </Link>
                      <div style={{ height: '1px', background: colors.border, margin: '6px 0' }} />
                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', border: 'none', borderRadius: '10px', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left' }}
                      >
                        <LogOut size={17} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="dems-header-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', color: colors.text, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
                  >
                    <LogIn size={17} /> Login
                  </Link>
                  <Link
                    to="/register"
                    className="dems-glow-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '12px', background: colors.accentGradient, color: '#ffffff', textDecoration: 'none', fontSize: '14px', fontWeight: 600, boxShadow: '0 4px 14px rgba(79,70,229,0.3)', transition: 'all 0.25s ease' }}
                  >
                    <UserPlus size={17} /> Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Only: Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="dems-mobile-button"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              style={{
                display: 'none', // CSS will override this to flex on mobile
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                background: colors.hover,
                color: colors.text,
                cursor: 'pointer',
              }}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
 
        {isMenuOpen && (
          <div
            className="dems-mobile-menu"
            style={{
              position: 'fixed',
              top: '76px',
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              background: colors.mobileBackground,
              padding: '24px',
              borderTop: `1px solid ${colors.border}`,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              zIndex: 999,
            }}
          >
            {/* Mobile User Profile Header Banner */}
            {isAuthenticated && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  background: colors.hover,
                  borderRadius: '16px',
                  marginBottom: '20px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '15px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {getInitials()}
                  {profileImage && (
                    <img
                      src={profileImage}
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      color: colors.text,
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  >
                    {user?.full_name || 'User'}
                  </div>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: '12px',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {role?.replace('_', ' ') || 'Scholar'}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                color: colors.muted,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                margin: '12px 8px 8px',
              }}
            >
              NAVIGATION
            </div>
            {publicLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                onClick={closeMobileMenu}
                style={mobileLinkStyle}
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}

            {isAuthenticated && (
              <>
                <div
                  style={{
                    height: '1px',
                    background: colors.border,
                    margin: '18px 0',
                  }}
                />
                <div
                  style={{
                    color: colors.muted,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    margin: '12px 8px 8px',
                  }}
                >
                  PORTAL WORKSPACE
                </div>
                {roleLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    onClick={closeMobileMenu}
                    style={mobileLinkStyle}
                  >
                    {link.icon}
                    {link.name}
                  </NavLink>
                ))}
                <NavLink
                  to="/profile"
                  onClick={closeMobileMenu}
                  style={mobileLinkStyle}
                >
                  <User size={18} />
                  My Profile
                </NavLink>
              </>
            )}

            <div
              style={{
                height: '1px',
                background: colors.border,
                margin: '20px 0',
              }}
            />

            {!isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  <LogIn size={18} />
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: colors.accentGradient,
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
                  }}
                >
                  <UserPlus size={18} />
                  Create Free Account
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '15px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                <LogOut size={19} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;