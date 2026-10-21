import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, BookOpen, FileText, CreditCard, User,
  LogOut, Menu, X, ChevronDown, GraduationCap, Video,
  BarChart3
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { getMediaUrl } from '../api/api';
import NotificationBell from '../components/common/NotificationBell';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigation = {
    STUDENT: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Courses', href: '/courses', icon: BookOpen },
      { name: 'Exams', href: '/exams', icon: FileText },
      { name: 'Live Classes', href: '/live-classes', icon: Video },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Results', href: '/results', icon: BarChart3 },
      { name: 'Profile', href: '/profile', icon: User },
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

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
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
            background: 'rgba(0,0,0,0.5)',
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
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        transform: `translateX(${sidebarOpen ? '0' : '-100%'})`,
        transition: 'transform 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <GraduationCap style={{ height: '2rem', width: '2rem', color: '#2563eb' }} />
            <span style={{
              fontWeight: 'bold',
              fontSize: '1.25rem',
              color: '#1f2937',
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
              color: '#6b7280',
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
                  color: isActive ? '#2563eb' : '#6b7280',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive ? '#eff6ff' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon style={{
                  marginRight: '0.75rem',
                  height: '1.25rem',
                  width: '1.25rem',
                  color: isActive ? '#2563eb' : '#6b7280',
                }} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '1rem',
        }}>
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
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
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
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
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
                color: '#6b7280',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <Menu style={{ height: '1.5rem', width: '1.5rem' }} />
            </button>
            
            <div style={{ flex: 1 }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
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
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  {user?.profile_picture ? (
                    <img
                      src={getMediaUrl(user.profile_picture)}
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
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: 500,
                    }}>
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span style={{
                    display: 'none',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }} className="user-name">{user?.full_name}</span>
                  <ChevronDown style={{ height: '1rem', width: '1rem', color: '#6b7280' }} />
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
                      background: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      zIndex: 20,
                      overflow: 'hidden',
                    }}>
                      <Link
                        to="/profile"
                        style={{
                          display: 'block',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <hr style={{ borderTop: '1px solid #e5e7eb', margin: '0.25rem 0' }} />
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
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
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
        }}>
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer style={{
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '24px',
          textAlign: 'center',
        }}>
          <p>&copy; 2024 Distance Education Management System. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Mekdela Amba University</p>
        </footer>
      </div>
      <style>{`
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