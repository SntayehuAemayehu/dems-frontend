// frontend/src/pages/Registrar/RegistrarDocumentViewer.jsx
// COMPLETE FIXED - PROPER DOCUMENT VIEWING AND DOWNLOADING

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
      
      if (response.data.files && response.data.files.length === 0) {
        toast.info('No documents uploaded by this student yet');
      }
      
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Please check your access rights.');
      } else if (error.response?.status === 404) {
        toast.error('Student not found.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Download document using proper URL
  const downloadDocument = async (field, filename) => {
    setDownloading(true);
    try {
      console.log(`📥 Downloading document: ${field} for student ${studentId}`);
      
      // Try direct download first
      const response = await api.get(
        `/auth/registrar/documents/${field}/${studentId}/download/`,
        {
          responseType: 'blob',
        }
      );
      
      // Create a download link from the blob
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${field}_${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`✅ Downloaded ${filename || field}`);
      
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      
      // ✅ Alternative: Try direct URL method
      try {
        const directResponse = await api.get(
          `/auth/registrar/documents/${field}/${studentId}/direct/`
        );
        
        if (directResponse.data && directResponse.data.url) {
          // Open in new tab for download
          window.open(directResponse.data.url, '_blank');
          toast.success(`Opening ${filename || field}`);
        } else {
          throw new Error('No URL received');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback download failed:', fallbackError);
        toast.error('Failed to download document. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // ✅ FIXED: Preview document using proper URL
  const previewDocument = (file) => {
    if (file && file.url) {
      console.log('📄 Previewing document:', file);
      setSelectedFile(file);
      setPreviewing(true);
    } else {
      toast.error('Preview URL not available');
    }
  };

  // ✅ Open document in new tab
  const openInNewTab = (file) => {
    if (file && file.url) {
      window.open(file.url, '_blank');
    } else {
      toast.error('URL not available');
    }
  };

  const handleVerify = (action) => {
    if (onVerify) {
      onVerify(studentId, action);
    }
    onClose();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Loading documents...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }} onClick={onClose}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
        }} onClick={(e) => e.stopPropagation()}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Error</h3>
          <p style={{ color: '#64748b' }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!documents) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }} onClick={onClose}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
        }} onClick={(e) => e.stopPropagation()}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No Documents</h3>
          <p style={{ color: '#64748b' }}>No documents have been uploaded by this student yet.</p>
          <button
            onClick={onClose}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} color="#3b82f6" />
            Student Documents
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
          >×</button>
        </div>

        {/* Student Info */}
        <div style={{
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
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
              fontWeight: 500,
              marginLeft: '8px',
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
              padding: '32px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '8px',
              color: '#94a3b8',
            }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '12px',
            }}>
              {documents.files.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, margin: 0 }}>
                      {file.label}
                      {!file.exists && (
                        <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>
                          (File missing)
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                      {file.filename || 'Unknown file'}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </p>
                    {file.url && (
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0', wordBreak: 'break-all' }}>
                        {file.url}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {file.url && file.exists !== false && (
                      <>
                        <button
                          onClick={() => previewDocument(file)}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => openInNewTab(file)}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#c7d2fe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#e0e7ff'}
                        >
                          <ExternalLink size={16} />
                          Open
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => downloadDocument(file.field, file.filename)}
                      disabled={downloading}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        color: '#16a34a',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        transition: 'all 0.3s ease',
                        opacity: downloading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => !downloading && (e.currentTarget.style.background = '#bbf7d0')}
                      onMouseLeave={(e) => !downloading && (e.currentTarget.style.background = '#dcfce7')}
                    >
                      <Download size={16} />
                      {downloading ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'none',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '100px',
            }}
          >
            Close
          </button>
          
          {documents.documents_submitted && !documents.documents_verified && documents.files && documents.files.length > 0 && (
            <>
              <button
                onClick={() => handleVerify('reject')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minWidth: '100px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
              >
                <XCircle size={18} />
                Reject
              </button>
              <button
                onClick={() => handleVerify('verify')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#16a34a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minWidth: '100px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#bbf7d0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dcfce7'}
              >
                <Check size={18} />
                Verify Documents
              </button>
            </>
          )}
          
          {documents.documents_verified && (
            <div style={{
              flex: 1,
              padding: '12px',
              background: '#dcfce7',
              borderRadius: '8px',
              color: '#16a34a',
              fontWeight: 600,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <Check size={18} />
              Verified ✓
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewing && selectedFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2100,
        }} onClick={() => setPreviewing(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '95%',
            maxHeight: '95vh',
            position: 'relative',
            width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <h3 style={{ margin: 0 }}>{selectedFile.label}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => openInNewTab(selectedFile)}
                  style={{
                    padding: '6px 16px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ExternalLink size={16} />
                  Open in New Tab
                </button>
                <button
                  onClick={() => downloadDocument(selectedFile.field, selectedFile.filename)}
                  disabled={downloading}
                  style={{
                    padding: '6px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: downloading ? 0.6 : 1,
                  }}
                >
                  <Download size={16} />
                  {downloading ? '...' : 'Download'}
                </button>
                <button
                  onClick={() => setPreviewing(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0 8px',
                  }}
                >×</button>
              </div>
            </div>
            <div style={{
              maxHeight: '75vh',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: '8px',
              minHeight: '200px',
            }}>
              {selectedFile.url ? (
                // ✅ For images, use img tag; for PDFs, use iframe
                selectedFile.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.filename || selectedFile.label}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '600px',
                      objectFit: 'contain',
                    }}
                    onError={() => {
                      toast.error('Failed to load image. Try downloading instead.');
                    }}
                  />
                ) : (
                  <iframe
                    src={selectedFile.url}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    title={selectedFile.filename || selectedFile.label}
                    onError={() => {
                      toast.error('Failed to preview document. Try downloading instead.');
                    }}
                  />
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p>No preview available</p>
                  <button
                    onClick={() => downloadDocument(selectedFile.field, selectedFile.filename)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 20px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
            <div style={{
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: '#64748b',
            }}>
              <span>{selectedFile.filename || selectedFile.label}</span>
              <span>{selectedFile.size ? formatFileSize(selectedFile.size) : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDocumentViewer;