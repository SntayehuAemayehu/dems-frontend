// frontend/src/components/common/NotificationBell.jsx
// ULTRA AMAZING but user-friendly notification bell
// ✅ Features: live time, filters, mark all read, animations, keyboard

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, X, CheckCheck, Filter, Loader2 } from 'lucide-react';
import {
  fetchNotifications,
  markAsRead,
  fetchUnreadCount,
} from '../../store/slices/notificationSlice';

// ✅ Category detection
const getCategory = (type) => {
  if (!type) return 'other';
  const t = type.toUpperCase();
  if (t.includes('PAYMENT') || t.includes('FEE') || t.includes('INVOICE')) return 'payments';
  if (t.includes('EXAM') || t.includes('GRADE') || t.includes('RESULT')) return 'exams';
  if (t.includes('COURSE') || t.includes('LIVE')) return 'courses';
  if (t.includes('ALERT') || t.includes('FLAG') || t.includes('SECURITY')) return 'alerts';
  return 'other';
};

const getCategoryColor = (cat) => ({
  payments: { bg: '#dcfce7', fg: '#16a34a', border: '#bbf7d0' },
  exams: { bg: '#dbeafe', fg: '#2563eb', border: '#bfdbfe' },
  courses: { bg: '#fef3c7', fg: '#d97706', border: '#fde68a' },
  alerts: { bg: '#fee2e2', fg: '#dc2626', border: '#fecaca' },
  other: { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
}[cat] || { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' });

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
  if (type.includes('SECURITY') || type.includes('FLAG')) return '🚨';
  return '🔔';
};

// ✅ Live relative time
const relativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s) => s.auth || {});
  const { notifications = [], unreadCount = 0, isLoading = false } = useSelector(
    (s) => s.notifications || { notifications: [], unreadCount: 0 }
  );

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread | exams | payments
  const [markingAll, setMarkingAll] = useState(false);
  const hasFetched = useRef(false);
  const bellRef = useRef(null);

  // Initial fetch (only once per login)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      hasFetched.current = false;
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  }, [dispatch, isAuthenticated, user]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
      if (isOpen) dispatch(fetchNotifications());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, user, isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleMarkAsRead = useCallback(
    async (id) => {
      if (!id) return;
      await dispatch(markAsRead(id));
    },
    [dispatch]
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      for (const n of notifications) {
        if (!n.is_read) await dispatch(markAsRead(n.id));
      }
      await dispatch(fetchUnreadCount());
    } finally {
      setMarkingAll(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
  };

  // Filtered list
  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return getCategory(n.notification_type) === filter;
  });

  if (!isAuthenticated || !user) return null;

  return (
    <div style={{ position: 'relative' }} ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        aria-label="Notifications"
        style={{
          position: 'relative',
          padding: '8px',
          border: 'none',
          background: 'none',
          color: '#3b82f6',
          cursor: 'pointer',
          borderRadius: '50%',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <Bell size={24} color="#3b82f6" />
        {unreadCount > 0 && (
          <span
            style={{
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
              boxShadow: '0 0 0 2px white',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 10px)',
              width: 'min(420px, 95vw)',
              maxHeight: '540px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid #f1f5f9',
            }}
          >
            <style>{`
              @keyframes dropIn {
                from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(-8px); }
                to { opacity: 1; transform: translateX(0); }
              }
              .notif-item:hover { background: #f8fafc !important; }
              .notif-tab:hover { background: #f1f5f9 !important; }
              .mark-all-btn:hover { background: #eff6ff !important; }
            `}</style>

            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white',
              }}
            >
              <div>
                <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '16px' }}>
                  Notifications
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button
                    className="mark-all-btn"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                    }}
                    title="Mark all as read"
                  >
                    {markingAll ? <Loader2 size={13} /> : <CheckCheck size={13} />}
                    {markingAll ? 'Marking...' : 'Mark all'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div
              style={{
                padding: '8px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                gap: '4px',
                overflowX: 'auto',
                background: '#fafbfc',
              }}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'exams', label: 'Exams' },
                { key: 'payments', label: 'Payments' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className="notif-tab"
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: filter === tab.key ? 'white' : 'transparent',
                    color: filter === tab.key ? '#2563eb' : '#64748b',
                    fontWeight: filter === tab.key ? 600 : 500,
                    fontSize: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    boxShadow: filter === tab.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 size={24} color="#94a3b8" />
                </div>
              ) : !filtered || filtered.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '56px 20px',
                    color: '#94a3b8',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #ede9fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Bell size={28} color="#8b5cf6" style={{ opacity: 0.6 }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
                    {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    You'll see updates here when they arrive
                  </p>
                </div>
              ) : (
                filtered.map((notification, idx) => {
                  const category = getCategory(notification.notification_type);
                  const colors = getCategoryColor(category);
                  const isUnread = !notification.is_read;
                  return (
                    <div
                      key={notification.id || idx}
                      className="notif-item"
                      style={{
                        padding: '14px 20px',
                        borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isUnread ? '#eff6ff' : 'white',
                        borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent',
                        animation: `slideIn 0.25s ease-out ${idx * 0.03}s both`,
                      }}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Icon */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0,
                          }}
                        >
                          {getIcon(notification.notification_type)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontWeight: isUnread ? 700 : 600,
                              color: '#0f172a',
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              lineHeight: 1.3,
                            }}
                          >
                            {notification.title || 'Notification'}
                          </p>
                          <p
                            style={{
                              color: '#64748b',
                              fontSize: '13px',
                              margin: '0 0 6px 0',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.message || ''}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                color: colors.fg,
                                fontWeight: 600,
                                background: colors.bg,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'capitalize',
                              }}
                            >
                              {category}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                              {relativeTime(notification.created_at)}
                            </span>
                            {notification.link && (
                              <a
                                href={notification.link}
                                style={{
                                  color: '#3b82f6',
                                  fontSize: '11px',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                View →
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Unread dot */}
                        {isUnread && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              background: '#3b82f6',
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginTop: '8px',
                              boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div
                style={{
                  padding: '10px 20px',
                  borderTop: '1px solid #f1f5f9',
                  textAlign: 'center',
                  background: '#fafbfc',
                }}
              >
                <a
                  href="/notifications"
                  style={{
                    color: '#3b82f6',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;