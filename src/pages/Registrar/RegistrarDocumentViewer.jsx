// frontend/src/pages/Registrar/RegistrarDocumentViewer.jsx
// COMPLETE FIXED — passes file.field (string) to backend, streams bytes properly

import React, { useState, useEffect } from 'react';
import { X, Download, Eye, FileText, Check, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const RegistrarDocumentViewer = ({ studentId, onClose, onVerify }) => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [studentId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 Fetching documents for student:', studentId);
      const response = await api.get(`/auth/registrar/students/${studentId}/documents/`);
      console.log('✅ Documents response:', response.data);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setDocuments(response.data);
    } catch (err) {
      console.error('❌ Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');

      if (err.response?.status === 403) {
        toast.error('Permission denied. Please check your access rights.');
      } else if (err.response?.status === 404) {
        toast.error('Student not found.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Build the API URL for streaming a document (field = "grade_8_certificate" etc.)
  const buildDocUrl = (field, stream = false) => {
    const base = `/auth/registrar/documents/${field}/${studentId}/download/`;
    return stream ? `${base}?stream=1` : base;
  };

  // ✅ Parse filename from Content-Disposition header
  const parseFilename = (disposition, fallback) => {
    if (!disposition) return fallback || 'document';
    const m = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return m ? decodeURIComponent(m[1]) : (fallback || 'document');
  };

  // ============================================================
  // DOWNLOAD — fetch bytes from API, save with proper filename
  // ============================================================
  const downloadDocument = async (field, fallbackName) => {
    if (!field) {
      toast.error('Invalid document field');
      return;
    }
    try {
      setDownloading(true);
      const response = await api.get(buildDocUrl(field, false), {
        responseType: 'blob',
      });

      const cd = response.headers['content-disposition'] || '';
      const filename = parseFilename(cd, fallbackName);

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // OPEN — open blob URL in a new tab (inline)
  // ============================================================
  const openInNewTab = async (field, fallbackName) => {
    if (!field) {
      toast.error('Invalid document field');
      return;
    }
    try {
      const response = await api.get(buildDocUrl(field, true), {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error('Open error:', err);
      toast.error('Failed to open document');
    }
  };

  // ============================================================
  // PREVIEW — fetch bytes, show in modal
  // ============================================================
  const previewDocument = async (field, fallbackName, label) => {
    if (!field) {
      toast.error('Invalid document field');
      return;
    }
    try {
      const response = await api.get(buildDocUrl(field, true), {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      setSelectedFile({
        field,
        filename: fallbackName || 'document',
        label: label || fallbackName || 'document',
        url,
        mimeType: contentType,
      });
      setPreviewing(true);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to load preview');
    }
  };

  const handleVerify = (action) => {
    if (onVerify) {
      onVerify(studentId, action);
    }
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '40px',
          textAlign: 'center', maxWidth: '400px', width: '90%',
        }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Loading documents...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================
  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      }} onClick={onClose}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '32px',
          maxWidth: '500px', width: '90%', textAlign: 'center',
        }} onClick={(e) => e.stopPropagation()}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Error</h3>
          <p style={{ color: '#64748b' }}>{error}</p>
          <button onClick={onClose} style={{
            marginTop: '16px', padding: '10px 24px',
            background: '#3b82f6', color: 'white', border: 'none',
            borderRadius: '8px', cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // NO DOCUMENTS OBJECT
  // ============================================================
  if (!documents) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      }} onClick={onClose}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '32px',
          maxWidth: '500px', width: '90%', textAlign: 'center',
        }} onClick={(e) => e.stopPropagation()}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No Documents</h3>
          <p style={{ color: '#64748b' }}>No documents have been uploaded by this student yet.</p>
          <button onClick={onClose} style={{
            marginTop: '16px', padding: '10px 24px',
            background: '#3b82f6', color: 'white', border: 'none',
            borderRadius: '8px', cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '32px',
        maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '24px', fontWeight: 700, margin: 0,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <FileText size={24} color="#3b82f6" />
            Student Documents
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '28px',
            cursor: 'pointer', color: '#94a3b8',
          }}>×</button>
        </div>

        {/* Student Info */}
        <div style={{
          padding: '16px', background: '#f8fafc', borderRadius: '8px',
          marginBottom: '20px', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: '8px',
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Name:</span>
            <span style={{ fontWeight: 500, marginLeft: '8px' }}>{documents.student_name || 'Unknown'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Student ID:</span>
            <span style={{ fontWeight: 500, marginLeft: '8px' }}>{documents.student_id || '—'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Department:</span>
            <span style={{ fontWeight: 500, marginLeft: '8px' }}>{documents.department || '—'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Status:</span>
            <span style={{
              fontWeight: 500, marginLeft: '8px',
              color: documents.documents_verified ? '#16a34a' : '#f59e0b',
            }}>
              {documents.documents_verified ? '✅ Verified' : '⏳ Pending Review'}
            </span>
          </div>
        </div>

        {/* Documents List */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Uploaded Files ({documents.files ? documents.files.length : 0})
          </h3>

          {!documents.files || documents.files.length === 0 ? (
            <div style={{
              padding: '32px', textAlign: 'center',
              background: '#f8fafc', borderRadius: '8px', color: '#94a3b8',
            }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {documents.files.map((file, index) => (
                <div key={index} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '12px 16px',
                  background: '#f8fafc', borderRadius: '8px',
                  border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, margin: 0 }}>{file.label}</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {file.filename || 'Unknown file'}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {/* ✅ Pass file.field (string), not file (object) */}
                    <button
                      onClick={() => previewDocument(file.field, file.filename, file.label)}
                      style={{
                        padding: '6px 12px', border: 'none', borderRadius: '6px',
                        background: '#dbeafe', color: '#2563eb', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                      }}
                    >
                      <Eye size={16} /> View
                    </button>

                    {/* ✅ Pass file.field (string), not file (object) */}
                    <button
                      onClick={() => openInNewTab(file.field, file.filename)}
                      style={{
                        padding: '6px 12px', border: 'none', borderRadius: '6px',
                        background: '#e0e7ff', color: '#4f46e5', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                      }}
                    >
                      <ExternalLink size={16} /> Open
                    </button>

                    <button
                      onClick={() => downloadDocument(file.field, file.filename)}
                      disabled={downloading}
                      style={{
                        padding: '6px 12px', border: 'none', borderRadius: '6px',
                        background: '#dcfce7', color: '#16a34a',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                        opacity: downloading ? 0.6 : 1,
                      }}
                    >
                      <Download size={16} />
                      {downloading ? '...' : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0',
          paddingTop: '20px', flexWrap: 'wrap',
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', border: '1px solid #d1d5db',
            borderRadius: '8px', background: 'none', color: '#374151',
            fontWeight: 600, cursor: 'pointer', minWidth: '100px',
          }}>Close</button>

          {documents.documents_submitted && !documents.documents_verified &&
           documents.files && documents.files.length > 0 && (
            <>
              <button onClick={() => handleVerify('reject')} style={{
                flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                background: '#fee2e2', color: '#dc2626', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', minWidth: '100px',
              }}>
                <XCircle size={18} /> Reject
              </button>
              <button onClick={() => handleVerify('verify')} style={{
                flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                background: '#dcfce7', color: '#16a34a', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', minWidth: '100px',
              }}>
                <Check size={18} /> Verify Documents
              </button>
            </>
          )}

          {documents.documents_verified && (
            <div style={{
              flex: 1, padding: '12px', background: '#dcfce7',
              borderRadius: '8px', color: '#16a34a', fontWeight: 600,
              textAlign: 'center', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px',
            }}>
              <Check size={18} /> Verified ✓
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* PREVIEW MODAL */}
      {/* ============================================================ */}
      {previewing && selectedFile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100,
        }} onClick={() => setPreviewing(false)}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            maxWidth: '95%', maxHeight: '95vh', width: '100%',
            display: 'flex', flexDirection: 'column',
          }} onClick={(e) => e.stopPropagation()}>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
            }}>
              <h3 style={{ margin: 0 }}>{selectedFile.label}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* ✅ Pass the string field, not the object */}
                <button
                  onClick={() => openInNewTab(selectedFile.field, selectedFile.filename)}
                  style={{
                    padding: '6px 16px', background: '#4f46e5', color: 'white',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <ExternalLink size={16} /> Open in New Tab
                </button>
                <button
                  onClick={() => downloadDocument(selectedFile.field, selectedFile.filename)}
                  disabled={downloading}
                  style={{
                    padding: '6px 16px', background: '#2563eb', color: 'white',
                    border: 'none', borderRadius: '6px',
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: downloading ? 0.6 : 1,
                  }}
                >
                  <Download size={16} />
                  {downloading ? '...' : 'Download'}
                </button>
                <button onClick={() => setPreviewing(false)} style={{
                  background: 'none', border: 'none', fontSize: '24px',
                  cursor: 'pointer', color: '#64748b', padding: '0 8px',
                }}>×</button>
              </div>
            </div>

            <div style={{
              flex: 1, overflow: 'auto', display: 'flex',
              justifyContent: 'center', alignItems: 'center',
              background: '#f1f5f9', borderRadius: '8px', minHeight: '400px',
            }}>
              {selectedFile.mimeType?.startsWith('image/') ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.filename}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                />
              ) : selectedFile.mimeType === 'application/pdf' ? (
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.filename}
                  style={{ width: '100%', height: '75vh', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FileText size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                  <p>Preview not available for this file type</p>
                  <button
                    onClick={() => downloadDocument(selectedFile.field, selectedFile.filename)}
                    style={{
                      marginTop: '12px', padding: '10px 20px', background: '#2563eb',
                      color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    }}
                  >
                    Download instead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDocumentViewer;