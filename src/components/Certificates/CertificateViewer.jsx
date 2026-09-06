// src/components/Certificates/CertificateViewer.jsx
// COMPLETE CERTIFICATE VIEWER COMPONENT

import React, { useState, useEffect } from 'react';
import { Award, Download, FileText, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const CertificateViewer = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      // Get completed courses
      const response = await api.get('/courses/my-grades/');
      const completedCourses = response.data.courses?.filter(c => c.status === 'COMPLETED') || [];
      
      // Map to certificate format
      const certs = completedCourses.map((course, index) => ({
        id: course.course_id,
        course_code: course.course_code,
        course_title: course.course_title,
        grade: course.grade_letter,
        percentage: course.percentage,
        date: new Date().toISOString(),
        available: true,
      }));
      
      setCertificates(certs);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (cert) => {
    try {
      toast.loading('Generating certificate...');
      
      // Get enrollment ID (you'd need to fetch this from your API)
      const response = await api.post('/analytics/certificates/generate/', {
        course_id: cert.id,
      }, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_${cert.course_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded!');
    } catch (error) {
      console.error('Failed to download certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const verifyCertificate = async (certId) => {
    try {
      const response = await api.get('/analytics/certificates/verify/', {
        params: { certification_id: certId }
      });
      
      if (response.data.valid) {
        toast.success('✅ Certificate is valid!');
      } else {
        toast.error('❌ Certificate is invalid');
      }
    } catch (error) {
      toast.error('Failed to verify certificate');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        flexDirection: 'column',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading certificates...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <Award size={64} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: '#0f172a' }}>No Certificates Available</h3>
        <p style={{ color: '#64748b' }}>Complete courses to earn certificates.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .certificate-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .certificate-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .certificate-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .certificate-info { flex: 1; min-width: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
          <Award size={28} style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
          My Certificates
        </h2>
        <button
          onClick={fetchCertificates}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
        {certificates.map((cert, index) => (
          <div key={cert.id} className="certificate-card">
            <div className="certificate-icon">
              <Award size={32} />
            </div>
            <div className="certificate-info">
              <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>{cert.course_title}</h4>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>
                {cert.course_code} • Grade: {cert.grade} ({cert.percentage}%)
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>
                Issued: {new Date(cert.date).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => downloadCertificate(cert)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificateViewer;