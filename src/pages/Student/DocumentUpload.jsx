// frontend/src/pages/Student/DocumentUpload.jsx
// COMPLETE - Student document upload page with all fixes

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle, AlertCircle, X, 
  Bell, Info, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNotification, setHasNotification] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [existingDocuments, setExistingDocuments] = useState({
    grade_8_certificate: false,
    grade_12_certificate: false,
    transcript: false,
    other_documents: false,
  });
  const [documentsVerified, setDocumentsVerified] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  const [files, setFiles] = useState({
    grade_8_certificate: null,
    grade_12_certificate: null,
    transcript: null,
    other_documents: null,
  });
  
  const [fileNames, setFileNames] = useState({
    grade_8_certificate: '',
    grade_12_certificate: '',
    transcript: '',
    other_documents: '',
  });
  
  const [fileErrors, setFileErrors] = useState({
    grade_8_certificate: '',
    grade_12_certificate: '',
    transcript: '',
    other_documents: '',
  });

  // Check if student has received notification
  useEffect(() => {
    const checkNotification = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/profile/student/');
        const data = response.data;
        console.log('📄 Student Profile:', data);
        
        setStudentName(data.user?.full_name || 'Student');
        setHasNotification(data.notification_sent || false);
        setDocumentsVerified(data.documents_verified || false);
        setIsEnrolled(data.is_enrolled || false);
        
        // Check existing documents
        setExistingDocuments({
          grade_8_certificate: !!data.grade_8_certificate,
          grade_12_certificate: !!data.grade_12_certificate,
          transcript: !!data.transcript,
          other_documents: !!data.other_documents,
        });
        
        // If documents already uploaded, show status
        if (data.documents_submitted) {
          toast.info('📄 Your documents have already been submitted and are pending verification.', {
            duration: 5000,
          });
        }
        
        // If documents are verified and account is active
        if (data.documents_verified && data.is_enrolled) {
          toast.success('✅ Your documents are verified and account is active!', {
            duration: 5000,
          });
        }
        
        // If documents verified but account not activated
        if (data.documents_verified && !data.is_enrolled) {
          toast.info('⏳ Your documents are verified. Account activation pending.', {
            duration: 5000,
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch student info:', error);
        toast.error('Failed to load student information');
      } finally {
        setLoading(false);
      }
    };
    checkNotification();
  }, []);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit';
    }
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or PDF.';
    }
    return null;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    const error = validateFile(file);
    if (error) {
      setFileErrors({ ...fileErrors, [field]: error });
      toast.error(error);
      e.target.value = '';
      return;
    }
    
    setFileErrors({ ...fileErrors, [field]: '' });
    setFiles({ ...files, [field]: file });
    setFileNames({ ...fileNames, [field]: file.name });
    toast.success(`${file.name} uploaded successfully`);
  };

  const removeFile = (field) => {
    setFiles({ ...files, [field]: null });
    setFileNames({ ...fileNames, [field]: '' });
    setFileErrors({ ...fileErrors, [field]: '' });
    const input = document.getElementById(`file-${field}`);
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any files are uploaded
    const hasFiles = Object.values(files).some(f => f !== null);
    if (!hasFiles) {
      toast.error('Please upload at least one document');
      return;
    }

    // Check for errors
    const hasErrors = Object.values(fileErrors).some(err => err !== '');
    if (hasErrors) {
      toast.error('Please fix the file errors before submitting');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });

    try {
      const response = await api.post('/auth/upload-documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      console.log('✅ Upload response:', response.data);
      toast.success('✅ Documents uploaded successfully! Waiting for verification.');
      
      // Navigate to dashboard after successful upload
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Please contact support.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Invalid request. Please check your files.';
        toast.error(errorMsg);
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        const errorMsg = error.response?.data?.error || 'Failed to upload documents. Please try again.';
        toast.error(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  const documentFields = [
    { 
      key: 'grade_8_certificate', 
      label: 'Grade 8 Certificate', 
      required: false,
      description: 'Upload your Grade 8 completion certificate',
    },
    { 
      key: 'grade_12_certificate', 
      label: 'Grade 12 Certificate', 
      required: true,
      description: 'Upload your Grade 12 completion certificate (Required)',
    },
    { 
      key: 'transcript', 
      label: 'Academic Transcript', 
      required: true,
      description: 'Upload your academic transcript (Required)',
    },
    { 
      key: 'other_documents', 
      label: 'Other Documents', 
      required: false,
      description: 'Upload any additional documents (Optional)',
    },
  ];

  // Check if all required documents are uploaded
  const requiredUploaded = documentFields
    .filter(f => f.required)
    .every(f => files[f.key] !== null || existingDocuments[f.key]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If documents already verified and account active
  if (documentsVerified && isEnrolled) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <div style={{
          background: '#dcfce7',
          padding: '48px',
          borderRadius: '16px',
          border: '2px solid #bbf7d0',
        }}>
          <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
            ✅ Account Fully Activated!
          </h2>
          <p style={{ color: '#166534', fontSize: '16px' }}>
            Your documents have been verified and your account is active.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If documents already verified but account not active
  if (documentsVerified && !isEnrolled) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <div style={{
          background: '#fef3c7',
          padding: '48px',
          borderRadius: '16px',
          border: '2px solid #fde68a',
        }}>
          <Clock size={64} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
            ⏳ Awaiting Account Activation
          </h2>
          <p style={{ color: '#92400e', fontSize: '16px' }}>
            Your documents are verified. The Registrar will activate your account soon.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .upload-dropzone {
          transition: all 0.3s ease;
          animation: fadeIn 0.3s ease;
        }
        .upload-dropzone:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }
        .file-uploaded {
          border-color: #22c55e !important;
          background: #f0fdf4 !important;
        }
        .file-error {
          border-color: #dc2626 !important;
          background: #fef2f2 !important;
        }
        .progress-bar {
          transition: width 0.3s ease;
        }
        .existing-file {
          background: #f0fdf4;
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 8px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #16a34a;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Upload size={28} color="#3b82f6" />
          Upload Documents
        </h1>
        <p style={{
          color: '#64748b',
          marginTop: '8px',
          fontSize: '16px',
        }}>
          {studentName ? `Hello ${studentName}, please upload the required documents for verification.` : 'Please upload the required documents for verification.'}
        </p>
      </div>

      {/* Notification Status Banner */}
      {hasNotification && !documentsVerified && (
        <div style={{
          background: '#dbeafe',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Bell size={24} color="#2563eb" />
          <div>
            <p style={{ fontWeight: 600, color: '#1e40af', margin: 0 }}>
              📄 Document Upload Required
            </p>
            <p style={{ color: '#1e3a8a', margin: '4px 0 0 0', fontSize: '14px' }}>
              The Registrar has requested you to upload your documents. Please upload the required documents below.
            </p>
          </div>
        </div>
      )}

      {/* Documents Already Submitted */}
      {!documentsVerified && Object.values(existingDocuments).some(v => v === true) && (
        <div style={{
          background: '#fef3c7',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #fde68a',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Info size={20} color="#d97706" />
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            <strong>📄 Some documents already uploaded.</strong> You can upload additional documents or replace existing ones.
          </p>
        </div>
      )}

      {/* Important Notice */}
      <div style={{
        background: '#fef3c7',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #fde68a',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <AlertCircle size={20} color="#92400e" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ fontWeight: 600, color: '#92400e', margin: 0 }}>Important Information</p>
          <p style={{ color: '#78350f', margin: '4px 0 0 0', fontSize: '14px' }}>
            Your documents will be reviewed by the registrar. You will be notified once verified.
            Make sure all documents are clear and readable.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
              Uploading documents...
            </span>
            <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 600 }}>
              {uploadProgress}%
            </span>
          </div>
          <div style={{
            background: '#e2e8f0',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden',
          }}>
            <div className="progress-bar" style={{
              background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
              height: '100%',
              width: `${uploadProgress}%`,
            }} />
          </div>
        </div>
      )}

      {/* Document Upload Form */}
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {documentFields.map((field) => (
            <div 
              key={field.key} 
              className={`upload-dropzone ${fileNames[field.key] || existingDocuments[field.key] ? 'file-uploaded' : ''}`}
              style={{
                border: `2px dashed ${fileErrors[field.key] ? '#dc2626' : fileNames[field.key] || existingDocuments[field.key] ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: fileErrors[field.key] ? '#fef2f2' : fileNames[field.key] || existingDocuments[field.key] ? '#f0fdf4' : 'white',
                gridColumn: field.key === 'other_documents' ? '1 / -1' : 'auto',
                position: 'relative',
              }}
            >
              <input
                type="file"
                id={`file-${field.key}`}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, field.key)}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
              />

              {fileErrors[field.key] && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  color: '#dc2626',
                  fontSize: '12px',
                }}>
                  <AlertCircle size={16} />
                </div>
              )}

              {(fileNames[field.key] || existingDocuments[field.key]) ? (
                <>
                  <CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>
                    {fileNames[field.key] || (existingDocuments[field.key] ? '✅ Already Uploaded' : '')}
                  </p>
                  {existingDocuments[field.key] && !fileNames[field.key] && (
                    <p style={{ fontSize: '12px', color: '#22c55e', margin: '4px 0 8px 0' }}>
                      Previously uploaded
                    </p>
                  )}
                  {fileNames[field.key] && (
                    <p style={{ fontSize: '12px', color: '#22c55e', margin: '4px 0 8px 0' }}>
                      ✓ Uploaded
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <label
                      htmlFor={`file-${field.key}`}
                      style={{
                        padding: '6px 16px',
                        background: '#dbeafe',
                        color: '#2563eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
                    >
                      {existingDocuments[field.key] && !fileNames[field.key] ? 'Replace' : 'Change'}
                    </label>
                    {fileNames[field.key] && (
                      <button
                        type="button"
                        onClick={() => removeFile(field.key)}
                        style={{
                          padding: '6px 16px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                      >
                        <X size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Remove
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>
                    {field.label}
                    {field.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 8px 0' }}>
                    {field.description}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 12px 0' }}>
                    PDF, JPG, PNG (Max 10MB)
                  </p>
                  <label
                    htmlFor={`file-${field.key}`}
                    style={{
                      display: 'inline-block',
                      padding: '10px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    <Upload size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Choose File
                  </label>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Error Summary */}
        {Object.values(fileErrors).some(err => err !== '') && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
          }}>
            <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: 500, margin: 0 }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Please fix the following errors:
            </p>
            <ul style={{ margin: '4px 0 0 20px', color: '#991b1b', fontSize: '13px' }}>
              {Object.entries(fileErrors).filter(([_, err]) => err !== '').map(([key, err]) => (
                <li key={key}>{documentFields.find(f => f.key === key)?.label}: {err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Documents Status */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Required documents: {documentFields.filter(f => f.required).length}
          </span>
          <span style={{ fontSize: '13px', color: requiredUploaded ? '#16a34a' : '#dc2626' }}>
            {requiredUploaded ? '✅ All required documents uploaded' : '⚠️ Some required documents missing'}
          </span>
        </div>

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0',
        }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 1,
              padding: '12px 24px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'none',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            Back to Dashboard
          </button>
          <button
            type="submit"
            disabled={uploading || !requiredUploaded}
            style={{
              flex: 2,
              padding: '12px 24px',
              background: (uploading || !requiredUploaded) ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: (uploading || !requiredUploaded) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: (uploading || !requiredUploaded) ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!uploading && requiredUploaded) e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              if (!uploading && requiredUploaded) e.currentTarget.style.background = '#3b82f6';
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit Documents
              </>
            )}
          </button>
        </div>

        {/* Document Count */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b',
        }}>
          <span>
            {Object.values(files).filter(f => f !== null).length + Object.values(existingDocuments).filter(v => v === true).length} of {documentFields.length} documents processed
            {!requiredUploaded && 
              ' • ' + (documentFields.filter(f => f.required).length - 
                (Object.values(files).filter((f, i) => f !== null && documentFields[i].required).length + 
                 Object.values(existingDocuments).filter((v, i) => v === true && documentFields[i].required).length)) + ' required documents remaining'
            }
          </span>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;