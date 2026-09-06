// frontend/src/components/BatchProcessor/BatchProcessor.jsx
// COMPLETE STYLED BATCH PROCESSING COMPONENT

import React, { useState } from 'react';
import { 
  Users, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, FileText, CreditCard, Send, Eye,
  Trash2, Filter, Download, Plus, Settings,
  Building2, Shield, UserPlus, Upload,
  Calendar, Search, ChevronDown, ChevronUp,
  Save, X, FileImage, Printer, Copy,
  Sparkles, Zap, Award, Gift, Rocket,
  UserCheck, DollarSign, FileCheck, BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const BatchProcessor = ({ 
  endpoint, 
  title, 
  description, 
  icon: IconComponent,
  batchTypes,
  fields,
  onSuccess,
  color = '#3b82f6',
  bgColor = '#eff6ff'
}) => {
  const [batchType, setBatchType] = useState('');
  const [batchValue, setBatchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [idFormat, setIdFormat] = useState('STU{year}{seq:06d}');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePreview = async () => {
    if (!batchType) {
      toast.error('Please select a batch type');
      return;
    }

    if (batchType === 'ids' && !batchValue) {
      toast.error('Please enter IDs');
      return;
    }

    if (batchType === 'department' && !batchValue) {
      toast.error('Please enter department name');
      return;
    }

    if (batchType === 'semester' && !batchValue) {
      toast.error('Please select a semester');
      return;
    }

    if (batchType === 'role' && !batchValue) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        batch_type: batchType,
        batch_value: batchValue,
        action: action,
        id_format: idFormat,
        confirm: false
      };

      // Add notification fields if sending notifications
      if (endpoint.includes('send-notifications')) {
        if (!notificationTitle || !notificationMessage) {
          toast.error('Please enter notification title and message');
          setLoading(false);
          return;
        }
        payload.title = notificationTitle;
        payload.message = notificationMessage;
      }

      const response = await api.post(endpoint, payload);

      if (response.data.confirm_required) {
        setPreview(response.data);
        setShowPreview(true);
        toast.success(`Found ${response.data.total} items to process`);
      } else {
        toast.success(response.data.message);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Batch preview error:', error);
      toast.error(error.response?.data?.error || 'Failed to preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        batch_type: batchType,
        batch_value: batchValue,
        action: action,
        id_format: idFormat,
        reason: reason,
        confirm: true
      };

      if (endpoint.includes('send-notifications')) {
        payload.title = notificationTitle;
        payload.message = notificationMessage;
      }

      const response = await api.post(endpoint, payload);

      setSuccessCount(response.data.processed || response.data.activated || response.data.verified || response.data.generated || response.data.sent || 0);
      setFailedCount(response.data.failed || 0);
      setShowSuccessModal(true);
      
      toast.success(response.data.message);
      setShowPreview(false);
      setPreview(null);
      setBatchValue('');
      setNotificationTitle('');
      setNotificationMessage('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error(error.response?.data?.error || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  const getBatchTypeLabel = (type) => {
    const labels = {
      'ids': 'By Student IDs',
      'department': 'By Department',
      'semester': 'By Semester',
      'all': 'All Students',
      'student_ids': 'By Student IDs',
      'role': 'By Role',
      'payment_ids': 'By Payment IDs'
    };
    return labels[type] || type;
  };

  const getBatchTypeIcon = (type) => {
    const icons = {
      'ids': '📋',
      'department': '🏛️',
      'semester': '📚',
      'all': '👥',
      'student_ids': '👤',
      'role': '🎭',
      'payment_ids': '💳'
    };
    return icons[type] || '📌';
  };

  const getColorStyles = () => {
    const colors = {
      'blue': { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb', light: '#dbeafe' },
      'green': { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a', light: '#dcfce7' },
      'purple': { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed', light: '#ede9fe' },
      'orange': { bg: '#fff7ed', border: '#f97316', text: '#ea580c', light: '#fed7aa' },
      'red': { bg: '#fef2f2', border: '#ef4444', text: '#dc2626', light: '#fecaca' },
      'indigo': { bg: '#eef2ff', border: '#6366f1', text: '#4f46e5', light: '#c7d2fe' },
      'pink': { bg: '#fdf2f8', border: '#ec4899', text: '#db2777', light: '#fbcfe8' },
      'teal': { bg: '#f0fdfa', border: '#14b8a6', text: '#0d9488', light: '#99f6e4' },
    };
    return colors[color] || colors['blue'];
  };

  const styles = getColorStyles();

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .spinning { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .slide-in { animation: slideIn 0.3s ease-out; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .batch-card {
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
        }
        .batch-card:hover {
          border-color: ${styles.border};
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .batch-card.selected {
          border-color: ${styles.border};
          background: ${styles.bg};
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
        }
        .batch-card .icon-wrapper {
          background: ${styles.bg};
          color: ${styles.text};
        }
        .batch-card.selected .icon-wrapper {
          background: ${styles.text};
          color: white;
        }
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, ${styles.text}, ${styles.border});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
        }
        .modal-content {
          animation: slideIn 0.3s ease-out;
        }
        @media (max-width: 768px) {
          .batch-grid { grid-template-columns: 1fr !important; }
          .preview-grid { grid-template-columns: 1fr !important; }
          .input-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Main Card */}
      <div className="batch-card" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        marginBottom: '24px',
        borderLeft: `4px solid ${styles.border}`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: styles.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: styles.text,
            }}>
              {IconComponent ? <IconComponent size={24} /> : <Zap size={24} />}
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {title}
                <span style={{
                  fontSize: '10px',
                  background: styles.bg,
                  color: styles.text,
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontWeight: 600,
                }}>
                  BATCH
                </span>
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '4px 0 0 0',
              }}>
                {description}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: styles.bg,
            borderRadius: '20px',
            fontSize: '12px',
            color: styles.text,
          }}>
            <Zap size={14} />
            Process Multiple Items
          </div>
        </div>

        {/* Batch Type Selection */}
        <div className="batch-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {batchTypes.map((type) => (
            <div
              key={type.value}
              className={`batch-card ${batchType === type.value ? 'selected' : ''}`}
              onClick={() => {
                setBatchType(type.value);
                setBatchValue('');
                setShowPreview(false);
                setPreview(null);
              }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                border: `2px solid ${batchType === type.value ? styles.border : '#e2e8f0'}`,
                background: batchType === type.value ? styles.bg : 'white',
              }}
            >
              <div style={{
                fontSize: '28px',
                marginBottom: '6px',
                display: 'block',
              }}>
                {type.icon || getBatchTypeIcon(type.value)}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: batchType === type.value ? 700 : 600,
                color: batchType === type.value ? styles.text : '#0f172a',
              }}>
                {type.label}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '2px',
              }}>
                {type.description}
              </div>
              {batchType === type.value && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: '10px',
                    background: styles.text,
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                  }}>
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Fields */}
        <div className="input-grid" style={{
          display: 'grid',
          gridTemplateColumns: batchType ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {batchType === 'ids' && (
            <div style={{ gridColumn: batchType ? '1 / -1' : 'auto' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>📋</span> Student IDs (comma separated)
              </label>
              <input
                type="text"
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="e.g., 1,2,3,4,5"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: batchValue ? styles.bg : 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = styles.border;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${styles.bg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = batchValue ? styles.border : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {batchType === 'department' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>🏛️</span> Department Name
              </label>
              <input
                type="text"
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="e.g., Computer Science"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: batchValue ? styles.bg : 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = styles.border;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${styles.bg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = batchValue ? styles.border : '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {batchType === 'semester' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>📚</span> Semester
              </label>
              <select
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: batchValue ? styles.bg : 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          )}

          {batchType === 'role' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>🎭</span> Role
              </label>
              <select
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: batchValue ? styles.bg : 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="">Select Role</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
                <option value="FINANCE">Finance</option>
                <option value="REGISTRAR">Registrar</option>
                <option value="DEPT_HEAD">Department Head</option>
              </select>
            </div>
          )}

          {batchType === 'student_ids' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>👤</span> Student IDs (comma separated)
              </label>
              <input
                type="text"
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="e.g., 1,2,3,4,5"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: batchValue ? styles.bg : 'white',
                }}
              />
            </div>
          )}

          {batchType === 'payment_ids' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>💳</span> Payment IDs (comma separated)
              </label>
              <input
                type="text"
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="e.g., 1,2,3,4,5"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${batchValue ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: batchValue ? styles.bg : 'white',
                }}
              />
            </div>
          )}

          {/* Action Field (for payments) */}
          {endpoint.includes('verify-payments') && batchType && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>⚡</span> Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${styles.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="approve">✅ Approve</option>
                <option value="reject">❌ Reject</option>
              </select>
            </div>
          )}

          {/* ID Format (for ID generation) */}
          {endpoint.includes('generate-ids') && batchType && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>🆔</span> ID Format
              </label>
              <input
                type="text"
                value={idFormat}
                onChange={(e) => setIdFormat(e.target.value)}
                placeholder="STU{year}{seq:06d}"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${styles.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Use {'{year}'} for year, {'{seq}'} for sequence, {'{dept}'} for department code
              </div>
            </div>
          )}

          {/* Notification Fields */}
          {endpoint.includes('send-notifications') && batchType && (
            <>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  <span style={{ color: styles.text }}>📝</span> Notification Title
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="e.g., Important Announcement"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${notificationTitle ? styles.border : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    background: notificationTitle ? styles.bg : 'white',
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '4px',
                }}>
                  <span style={{ color: styles.text }}>💬</span> Notification Message
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter the message to send to all recipients..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${notificationMessage ? styles.border : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    background: notificationMessage ? styles.bg : 'white',
                  }}
                />
              </div>
            </>
          )}

          {/* Rejection Reason (for payments reject) */}
          {action === 'reject' && endpoint.includes('verify-payments') && batchType && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}>
                <span style={{ color: styles.text }}>📝</span> Rejection Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${reason ? styles.border : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                  background: reason ? styles.bg : 'white',
                }}
              />
            </div>
          )}
        </div>

        {/* Process Button */}
        <button
          onClick={handlePreview}
          disabled={loading || !batchType || (endpoint.includes('send-notifications') && (!notificationTitle || !notificationMessage))}
          style={{
            width: '100%',
            padding: '14px',
            background: (loading || !batchType || (endpoint.includes('send-notifications') && (!notificationTitle || !notificationMessage))) ? '#e2e8f0' : styles.border,
            color: (loading || !batchType || (endpoint.includes('send-notifications') && (!notificationTitle || !notificationMessage))) ? '#94a3b8' : 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: (loading || !batchType || (endpoint.includes('send-notifications') && (!notificationTitle || !notificationMessage))) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: (loading || !batchType || (endpoint.includes('send-notifications') && (!notificationTitle || !notificationMessage))) ? 0.6 : 1,
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            if (!loading && batchType) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${styles.border}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && batchType) {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="spinning" />
              Processing...
            </>
          ) : (
            <>
              <Rocket size={20} />
              Preview Batch
              {batchType && (
                <span style={{
                  fontSize: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}>
                  {getBatchTypeLabel(batchType)}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* PREVIEW MODAL */}
      {/* ============================================================ */}
      {showPreview && preview && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowPreview(false)}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Preview Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: styles.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: styles.text,
                }}>
                  <Eye size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Batch Preview
                  </h2>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Review items before processing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="preview-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                padding: '16px',
                background: styles.bg,
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Total Items</div>
                <div className="stat-number">{preview.total}</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Preview Sample</div>
                <div className="stat-number" style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a' }}>
                  {preview.sample || 0}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#92400e' }}>Status</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  <Clock size={18} />
                  Ready
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#dcfce7',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#166534' }}>Batch Type</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#16a34a',
                }}>
                  {getBatchTypeLabel(batchType)}
                </div>
              </div>
            </div>

            {/* Preview List */}
            {preview.preview && preview.preview.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: 0,
                  }}>
                    <FileText size={16} style={{ display: 'inline', marginRight: '6px', color: styles.text }} />
                    Preview ({preview.preview.length} items)
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                  }}>
                    Showing first {Math.min(preview.preview.length, 10)} items
                  </span>
                </div>
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  background: '#fafafa',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        {Object.keys(preview.preview[0]).map((key) => (
                          <th key={key} style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #e2e8f0',
                          }}>
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 10).map((item, index) => (
                        <tr key={index} style={{
                          borderBottom: index < preview.preview.slice(0, 10).length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          {Object.values(item).map((value, i) => (
                            <td key={i} style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              color: '#0f172a',
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {typeof value === 'boolean' ? (
                                value ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#dc2626" />
                              ) : value || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.total > 10 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    borderTop: '1px solid #e2e8f0',
                    marginTop: '4px',
                  }}>
                    + {preview.total - 10} more items
                  </div>
                )}
              </div>
            )}

            {/* Warning */}
            <div style={{
              padding: '14px 18px',
              background: '#fef3c7',
              borderRadius: '10px',
              border: '1px solid #fde68a',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontWeight: 600 }}>
                  This action will process <strong>{preview.total}</strong> items.
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#78350f' }}>
                  This operation is irreversible and will affect all items in the batch.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  background: 'none',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: loading ? '#94a3b8' : styles.border,
                  color: 'white',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${styles.border}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm & Process All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUCCESS MODAL */}
      {/* ============================================================ */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={40} color="#16a34a" />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 8px 0',
            }}>
              Batch Processing Complete! 🎉
            </h2>

            <p style={{
              color: '#64748b',
              fontSize: '15px',
              marginBottom: '20px',
            }}>
              Successfully processed all items in the batch.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                padding: '16px',
                background: '#dcfce7',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '11px', color: '#166534' }}>Success</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#16a34a',
                }}>
                  {successCount}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fee2e2',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '11px', color: '#991b1b' }}>Failed</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#dc2626',
                }}>
                  {failedCount}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: styles.border,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '16px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${styles.border}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BatchProcessor;