// frontend/src/components/common/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, X } from 'lucide-react';
import { fetchNotifications, markAsRead, fetchUnreadCount } from '../../store/slices/notificationSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications = [], unreadCount = 0 } = useSelector((state) => state.notifications || { notifications: [], unreadCount: 0 });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleMarkAsRead = (id) => {
    if (id) {
      dispatch(markAsRead(id));
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
  };

  const getIcon = (type) => {
    if (!type) return '🔔';
    if (type.includes('PAYMENT_VERIFIED')) return '✅';
    if (type.includes('PAYMENT_REJECTED')) return '❌';
    if (type.includes('PAYMENT_PENDING')) return '⏳';
    if (type.includes('PAYMENT_RESUBMIT')) return '📤';
    if (type.includes('EXAM')) return '📝';
    if (type.includes('COURSE_APPROVED')) return '✅';
    if (type.includes('COURSE_REJECTED')) return '❌';
    if (type.includes('LIVE_CLASS')) return '🎥';
    if (type.includes('GRADE')) return '📊';
    return '🔔';
  };

  const getColor = (type) => {
    if (!type) return '#64748b';
    if (type.includes('VERIFIED') || type.includes('APPROVED')) return '#22c55e';
    if (type.includes('REJECTED')) return '#dc2626';
    if (type.includes('PENDING') || type.includes('RESUBMIT')) return '#f59e0b';
    if (type.includes('LIVE_CLASS')) return '#8b5cf6';
    if (type.includes('GRADE')) return '#3b82f6';
    return '#64748b';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        style={{
          position: 'relative',
          padding: '8px',
          border: 'none',
          background: 'none',
          color: 'white',
          cursor: 'pointer',
          borderRadius: '50%',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            minWidth: '20px',
            height: '20px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(25%, -25%)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '380px',
            maxHeight: '480px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <h3 style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
              {!notifications || notifications.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8',
                }}>
                  <Bell size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id || Math.random()}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: notification && !notification.is_read ? '#eff6ff' : 'white',
                      borderLeft: notification && !notification.is_read ? '3px solid #3b82f6' : '3px solid transparent',
                    }}
                    onClick={() => notification && notification.id && handleMarkAsRead(notification.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = notification && !notification.is_read ? '#dbeafe' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notification && !notification.is_read ? '#eff6ff' : 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{getIcon(notification?.notification_type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontWeight: 500,
                          color: '#0f172a',
                          margin: '0 0 4px 0',
                          fontSize: '14px',
                        }}>
                          {notification?.title || 'Notification'}
                        </p>
                        <p style={{
                          color: '#64748b',
                          fontSize: '13px',
                          margin: '0 0 4px 0',
                          lineHeight: '1.4',
                        }}>
                          {notification?.message || ''}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <p style={{
                            color: '#94a3b8',
                            fontSize: '11px',
                            margin: 0,
                          }}>
                            {notification?.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                          </p>
                          {notification?.link && (
                            <a
                              href={notification.link}
                              style={{
                                color: '#a9c5f2ff',
                                fontSize: '11px',
                                textDecoration: 'none',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                      {notification && !notification.is_read && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          background: '#3b82f6',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: '6px',
                        }} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;