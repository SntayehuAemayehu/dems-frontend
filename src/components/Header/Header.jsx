

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Menu, X, User, LogOut, BookOpen, GraduationCap, 
  Home, Shield, ClipboardList, CheckCircle, Lock, 
  Sun, Moon, LogIn, UserPlus, Video, CreditCard, 
  FileText, LayoutDashboard, Search, Sparkles,
  Bell, MessageSquare, Globe, Send
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import NotificationBell from '../common/NotificationBell';
import { useDarkMode } from '../../context/DarkModeContext';
import api from '../../api/api';
//import LanguageSelector from '../i18n/LanguageSelector';
//import CurrencySelector from '../Payment/CurrencySelector';
const Header = ({ isDarkMode: propDarkMode, toggleDarkMode: propToggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [paymentAccess, setPaymentAccess] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    { type: 'bot', text: 'Hello! 👋 Welcome to DEMS AI Assistant. How can I assist you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Use context for dark mode if props are not provided
  let contextDarkMode;
  let contextToggleDarkMode;
  try {
    const context = useDarkMode();
    contextDarkMode = context.isDarkMode;
    contextToggleDarkMode = context.toggleDarkMode;
  } catch (e) {
    // Fallback to props if context not available
    contextDarkMode = propDarkMode;
    contextToggleDarkMode = propToggleDarkMode;
  }

  const isDarkMode = propDarkMode !== undefined ? propDarkMode : contextDarkMode;
  const toggleDarkMode = propToggleDarkMode || contextToggleDarkMode || (() => {});

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'STUDENT') {
      checkPaymentAccess();
    }
  }, [isAuthenticated, user]);

  const checkPaymentAccess = async () => {
    try {
      setCheckingPayment(true);
      const response = await api.get('/analytics/check-access/?service_type=COURSE_ENROLLMENT');
      setPaymentAccess(response.data.has_access);
    } catch (error) {
      console.error('Failed to check payment access:', error);
      setPaymentAccess(true);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // AI Assistant Functions
  const handleAssistantSubmit = async () => {
    if (!assistantMessage.trim()) return;
    
    const userMessage = assistantMessage;
    setAssistantMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setAssistantMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const responses = [
        "I can help you with course enrollment. What would you like to know?",
        "Our courses cover Software Engineering, Data Science, and more!",
        "You can check your exam results in the dashboard.",
        "We offer live classes every Monday, Wednesday, and Friday.",
        "AI Proctoring ensures secure and fair examinations.",
        "You can make payments via Bank Transfer, Telebirr, or Chapa.",
        "Your profile can be updated from the profile page.",
        "We have 500+ courses available for you to choose from.",
        "Certificates are issued upon successful course completion.",
        "You can access our platform on any device - desktop, tablet, or mobile.",
      ];
      const botResponse = responses[Math.floor(Math.random() * responses.length)];
      setAssistantMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setAssistantMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAssistantSubmit();
    }
  };

  // Navigation Links - Home Page Only: Home, About
  const publicNavLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'About', path: '/about', icon: <Globe size={18} /> },
  ];

  // Get role-based navigation links for authenticated users (used in mobile menu)
  const getAuthNavLinks = () => {
    if (!isAuthenticated) return [];

    const role = user?.role?.toUpperCase();
    const links = [];

    if (role === 'STUDENT') {
      links.push(
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Courses', path: '/courses', icon: <BookOpen size={18} /> },
        { name: 'Exams', path: '/exams', icon: <FileText size={18} /> },
        { name: 'Results', path: '/assignment-results', icon: <ClipboardList size={18} /> },
        { name: 'Live Classes', path: '/live-classes', icon: <Video size={18} /> },
        { name: 'Payments', path: '/payments', icon: <CreditCard size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else if (role === 'TEACHER') {
      links.push(
        { name: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'My Courses', path: '/teacher/courses', icon: <BookOpen size={18} /> },
        { name: 'Exams', path: '/teacher/exams', icon: <FileText size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else if (role === 'ADMIN') {
      links.push(
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Proctoring', path: '/admin/proctoring-review', icon: <Shield size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else if (role === 'FINANCE') {
      links.push(
        { name: 'Dashboard', path: '/finance/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else if (role === 'REGISTRAR') {
      links.push(
        { name: 'Dashboard', path: '/registrar/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else if (role === 'DEPT_HEAD') {
      links.push(
        { name: 'Dashboard', path: '/dept/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    } else {
      links.push(
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> }
      );
    }

    return links;
  };

  // For mobile menu - combine public + auth links
  const mobileNavLinks = [...publicNavLinks, ...getAuthNavLinks()];

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '0 24px',
    height: '72px',
    background: scrolled
      ? isDarkMode
        ? 'rgba(15, 23, 42, 0.92)'
        : 'rgba(255, 255, 255, 0.92)'
      : isDarkMode
        ? 'rgba(15, 23, 42, 0.8)'
        : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    boxShadow: scrolled
      ? isDarkMode
        ? '0 4px 40px rgba(0,0,0,0.3)'
        : '0 4px 40px rgba(0,0,0,0.06)'
      : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const linkColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const linkHoverColor = isDarkMode ? '#ffffff' : '#0f172a';
  const linkHoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9';

  return (
    <>
      <header style={headerStyle}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .mobile-menu-btn { display: flex !important; }
            .nav-desktop { display: none !important; }
            .nav-mobile { display: flex !important; }
            .auth-buttons-desktop { display: none !important; }
            .auth-buttons-mobile { display: flex !important; }
            .search-desktop { display: none !important; }
          }
          @media (min-width: 769px) {
            .mobile-menu-btn { display: none !important; }
            .nav-desktop { display: flex !important; }
            .nav-mobile { display: none !important; }
            .auth-buttons-desktop { display: flex !important; }
            .auth-buttons-mobile { display: none !important; }
            .search-desktop { display: flex !important; }
          }
          .mobile-nav-overlay {
            position: fixed;
            top: 72px;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${isDarkMode ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)'};
            z-index: 999;
            padding: 24px;
            animation: slideDown 0.3s ease;
            overflow-y: auto;
            backdrop-filter: blur(20px);
          }
          .mobile-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 12px;
            color: ${isDarkMode ? '#f1f5f9' : '#0f172a'};
            text-decoration: none;
            transition: all 0.2s ease;
            font-size: 16px;
            font-weight: 500;
          }
          .mobile-nav-item:hover {
            background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'};
          }
          .mobile-nav-item svg {
            color: #3b82f6;
          }
          .mobile-divider {
            height: 1px;
            background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'};
            margin: 8px 0;
          }
          .nav-link {
            position: relative;
            padding: 8px 16px !important;
          }
          .nav-link::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            width: 0;
            height: 2px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            transition: all 0.3s ease;
            transform: translateX(-50%);
            border-radius: 2px;
          }
          .nav-link:hover::after {
            width: 60%;
          }
          .search-input {
            animation: slideDown 0.2s ease;
          }
          .assistant-modal {
            animation: fadeInUp 0.3s ease;
          }
        `}</style>

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}>
          {/* Logo */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: isDarkMode ? '#ffffff' : '#0f172a',
            fontWeight: 700,
            fontSize: '22px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white',
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            }}>
              <GraduationCap size={22} />
            </div>
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>DEMS</span>
            
          </Link>

          {/* Desktop Navigation - ONLY Home, About */}
          <nav className="nav-desktop" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            flex: 1,
            justifyContent: 'center',
          }}>
            {publicNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link"
                style={{
                  color: linkColor,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = linkHoverColor;
                  e.currentTarget.style.background = linkHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = linkColor;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.icon && <span style={{ display: 'inline-flex' }}>{link.icon}</span>}
                {link.name}
              </Link>
            ))}
          </nav>
{/* Right Section */}
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
}}>

  {/* ✅ ADD THESE: Language & Currency Selectors */}


            {/* Payment Status - Only for authenticated students */}
            {isAuthenticated && user?.role === 'STUDENT' && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 500,
                background: paymentAccess ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: paymentAccess ? '#22c55e' : '#ef4444',
                border: paymentAccess ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)',
              }}>
                {checkingPayment ? (
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#94a3b8',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                ) : paymentAccess ? (
                  <><CheckCircle size={10} /> Access</>
                ) : (
                  <><Lock size={10} /> Locked</>
                )}
              </span>
            )}



            {/* Notification Bell - Only for authenticated users */}
            {isAuthenticated && <NotificationBell />}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                cursor: 'pointer',
                color: isDarkMode ? '#fbbf24' : '#6366f1',
                transition: 'all 0.3s ease',
              }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Auth Buttons - Desktop */}

            <div className="auth-buttons-desktop" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: isDarkMode ? '#fca5a5' : '#dc2626',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  }}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              ) : (
                <>




                  <Link
                    to="/login"
                    style={{
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#0f172a';
                      e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogIn size={15} />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.25)';
                    }}
                  >
                    <UserPlus size={15} />
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-btn"
              style={{
                background: 'none',
                border: 'none',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav-overlay">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Mobile Search */}
              <form onSubmit={handleSearch} style={{
                display: 'flex',
                alignItems: 'center',
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                borderRadius: '12px',
                padding: '4px 12px',
                marginBottom: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              }}>
                <Search size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '12px 10px',
                    fontSize: '15px',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    flex: 1,
                  }}
                />
              </form>

              {/* Mobile Navigation Links */}
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="mobile-nav-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon || <span style={{ width: '18px' }} />}
                  {link.name}
                </Link>
              ))}

              <div className="mobile-divider" />

              {/* AI Assistant - Mobile */}
              <button
                onClick={() => {
                  setIsAssistantOpen(true);
                  setIsMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <MessageSquare size={18} />
                AI Assistant
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}>
                  Available
                </span>
              </button>

              <div className="mobile-divider" />

              {/* Dark Mode Toggle - Mobile */}
              <button
                onClick={() => {
                  toggleDarkMode();
                  setIsMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {isDarkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              <div className="mobile-divider" />

              {/* Auth Buttons - Mobile */}
              <div className="auth-buttons-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="mobile-nav-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    <button
                      className="mobile-nav-item"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 500,
                        padding: '14px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="mobile-nav-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn size={18} />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="mobile-nav-item"
                      onClick={() => setIsMenuOpen(false)}
                      style={{
                        background: isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                        color: '#3b82f6',
                      }}
                    >
                      <UserPlus size={18} />
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* AI ASSISTANT CHAT MODAL */}
      {/* ============================================================ */}
      {isAssistantOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeInUp 0.3s ease',
          padding: '16px',
        }} onClick={() => setIsAssistantOpen(false)}>
          <div 
            className="assistant-modal"
            style={{
              width: '100%',
              maxWidth: '420px',
              maxHeight: '600px',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={20} color="white" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>
                    DEMS Assistant
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    AI-powered help at your service
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAssistantOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              padding: '16px 20px',
              flex: 1,
              overflowY: 'auto',
              background: isDarkMode ? '#0f172a' : '#f8fafc',
              maxHeight: '380px',
              minHeight: '300px',
            }}>
              {assistantMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '12px',
                    animation: 'fadeInUp 0.3s ease',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: msg.type === 'user'
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
                    color: msg.type === 'user' ? 'white' : (isDarkMode ? '#f1f5f9' : '#0f172a'),
                    boxShadow: msg.type === 'bot' 
                      ? (isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)') 
                      : 'none',
                    border: msg.type === 'bot' 
                      ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` 
                      : 'none',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                    fontSize: '14px',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite',
                    }}>Typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              display: 'flex',
              gap: '8px',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              flexShrink: 0,
            }}>
              <input
                type="text"
                placeholder="Ask about DEMS..."
                value={assistantMessage}
                onChange={(e) => setAssistantMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleAssistantSubmit}
                disabled={!assistantMessage.trim() || isLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  color: 'white',
                  cursor: assistantMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  opacity: assistantMessage.trim() && !isLoading ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  if (assistantMessage.trim() && !isLoading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
