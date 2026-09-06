// frontend/src/layouts/MainLayout.jsx
// UPDATED WITH DARK MODE SUPPORT

import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, BookOpen, FileText, CreditCard, User,
  LogOut, Menu, X, ChevronDown, GraduationCap, Video,
  BarChart3, Sun, Moon, MessageCircle, Sparkles,Map, Trophy, Award, TrendingUp
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/common/NotificationBell';
import { useDarkMode } from '../context/DarkModeContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Navigation - Only Dashboard and Profile links (no sub-pages)
  const navigation = {
    STUDENT: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Courses', href: '/courses', icon: BookOpen },
      { name: 'Exams', href: '/exams', icon: FileText },
      { name: 'Live Classes', href: '/live-classes', icon: Video },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Results', href: '/results', icon: BarChart3 },
      { name: 'Profile', href: '/profile', icon: User },
      // ✅ ADD THESE NEW NAVIGATION ITEMS
      { name: 'AI Insights', href: '/ai-insights', icon: Sparkles },
      { name: 'Learning Path', href: '/learning-path', icon: Map },
      { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
      { name: 'Gamification', href: '/gamification', icon: Award },
      { name: 'Certificates', href: '/certificates', icon: FileText },
      { name: 'Predictions', href: '/predictions', icon: TrendingUp },





    ],
    TEACHER: [
      { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
      { name: 'My Courses', href: '/teacher/courses', icon: BookOpen },
      { name: 'Exams', href: '/teacher/exams', icon: FileText },
      { name: 'Live Classes', href: '/live-classes', icon: Video },
      { name: 'Profile', href: '/profile', icon: User },
    ],
    ADMIN: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Proctoring', href: '/admin/proctoring-review', icon: FileText },
      { name: 'Profile', href: '/profile', icon: User },
    ],
    FINANCE: [
      { name: 'Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
      { name: 'Profile', href: '/profile', icon: User },
    ],
    REGISTRAR: [
      { name: 'Dashboard', href: '/registrar/dashboard', icon: LayoutDashboard },
      { name: 'Profile', href: '/profile', icon: User },
    ],
    DEPT_HEAD: [
      { name: 'Dashboard', href: '/dept/dashboard', icon: LayoutDashboard },
      { name: 'Profile', href: '/profile', icon: User },
    ],
  };

  const navItems = navigation[user?.role] || navigation.STUDENT;

  // Dark mode styles
  const bgColor = isDarkMode ? '#0f172a' : '#f3f4f6';
  const sidebarBg = isDarkMode ? '#1e293b' : '#ffffff';
  const sidebarBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const textColor = isDarkMode ? '#f1f5f9' : '#1f2937';
  const textMuted = isDarkMode ? '#94a3b8' : '#6b7280';
  const headerBg = isDarkMode ? '#1e293b' : '#ffffff';
  const headerBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#ffffff';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6';
  const activeBg = isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff';
  const activeColor = '#3b82f6';
  const shadow = isDarkMode 
    ? '0 4px 24px rgba(0,0,0,0.3)' 
    : '0 4px 6px -1px rgba(0,0,0,0.1)';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: bgColor, 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'all 0.3s ease',
    }}>
      {/* Mobile sidebar overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20,
          transition: 'opacity 0.3s',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          display: 'block',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          }} 
          onClick={() => setSidebarOpen(false)} 
        />
      </div>
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        insetY: 0,
        left: 0,
        zIndex: 30,
        width: '16rem',
        background: sidebarBg,
        boxShadow: shadow,
        transform: `translateX(${sidebarOpen ? '0' : '-100%'})`,
        transition: 'transform 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${sidebarBorder}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderBottom: `1px solid ${sidebarBorder}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <GraduationCap style={{ height: '1.5rem', width: '1.5rem' }} />
            </div>
            <span style={{
              fontWeight: 'bold',
              fontSize: '1.25rem',
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>DEMS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: textMuted,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverBg;
              e.currentTarget.style.color = textColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = textMuted;
            }}
          >
            <X style={{ height: '1.5rem', width: '1.5rem' }} />
          </button>
        </div>
        
        <nav style={{
          marginTop: '1.25rem',
          padding: '0 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          flex: 1,
          overflowY: 'auto',
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? activeColor : textMuted,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive ? activeBg : 'transparent',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = hoverBg;
                    e.currentTarget.style.color = textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = textMuted;
                  }
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon style={{
                  marginRight: '0.75rem',
                  height: '1.25rem',
                  width: '1.25rem',
                  color: isActive ? activeColor : textMuted,
                }} />
                {item.name}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    right: '8px',
                    width: '4px',
                    height: '24px',
                    borderRadius: '2px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div style={{
          borderTop: `1px solid ${sidebarBorder}`,
          padding: '1rem',
        }}>
          {/* AI Assistant - Mobile */}
          <button
            onClick={() => {
              navigate('/support');
              setSidebarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeColor,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '8px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = activeBg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Sparkles style={{
              marginRight: '0.75rem',
              height: '1.25rem',
              width: '1.25rem',
            }} />
            AI Assistant
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px',
              background: '#22c55e',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              Live
            </span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#dc2626',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <LogOut style={{
              marginRight: '0.75rem',
              height: '1.25rem',
              width: '1.25rem',
            }} />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 0,
        transition: 'all 0.3s ease',
      }}>
        {/* Header */}
        <header style={{
          background: headerBg,
          boxShadow: shadow,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${headerBorder}`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: textMuted,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = hoverBg;
                e.currentTarget.style.color = textColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = textMuted;
              }}
            >
              <Menu style={{ height: '1.5rem', width: '1.5rem' }} />
            </button>
            
            <div style={{ flex: 1 }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              {/* AI Assistant Badge - Desktop */}
              <button
                onClick={() => navigate('/support')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                  border: `1px solid ${isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#3b82f6',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(59,130,246,0.25)' : '#dbeafe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff';
                }}
              >
                <Sparkles size={14} />
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }} />
                AI Help
              </button>

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

              <NotificationBell />
              
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Profile"
                      style={{
                        height: '2rem',
                        width: '2rem',
                        borderRadius: '9999px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      height: '2rem',
                      width: '2rem',
                      borderRadius: '9999px',
                      background: isDarkMode ? 'rgba(59,130,246,0.2)' : '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6',
                      fontWeight: 500,
                    }}>
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span style={{
                    display: 'none',
                    fontSize: '0.875rem',
                    color: textColor,
                  }} className="user-name">{user?.full_name}</span>
                  <ChevronDown style={{ height: '1rem', width: '1rem', color: textMuted }} />
                </button>
                
                {userMenuOpen && (
                  <>
                    <div 
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10,
                      }} 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '0.5rem',
                      width: '12rem',
                      background: isDarkMode ? '#1e293b' : '#ffffff',
                      borderRadius: '0.5rem',
                      boxShadow: shadow,
                      border: `1px solid ${sidebarBorder}`,
                      zIndex: 20,
                      overflow: 'hidden',
                    }}>
                      <Link
                        to="/profile"
                        style={{
                          display: 'block',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: textColor,
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <hr style={{ 
                        borderTop: `1px solid ${sidebarBorder}`, 
                        margin: '0.25rem 0' 
                      }} />
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: '#dc2626',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main style={{
          padding: '1.5rem',
          flex: 1,
          background: bgColor,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            minHeight: 'calc(100vh - 200px)',
            transition: 'all 0.3s ease',
            boxShadow: isDarkMode 
              ? '0 4px 24px rgba(0,0,0,0.2)' 
              : '0 4px 24px rgba(0,0,0,0.04)',
          }}>
            <Outlet />
          </div>
        </main>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (min-width: 1024px) {
          .main-content {
            padding-left: 16rem;
          }
          .user-name {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;