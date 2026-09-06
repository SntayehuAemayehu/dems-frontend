// frontend/src/components/QRCodeDisplay.jsx

import React, { useState } from 'react';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

const QRCodeDisplay = ({ methodId, amount, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/qr/generate/', {
        method: methodId,
        amount: amount
      });
      setQrData(response.data);
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      maxWidth: '400px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={20} color="#2563eb" />
          Payment QR Code
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
        >×</button>
      </div>

      {!qrData && !loading && (
        <button
          onClick={generateQR}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Generate QR Code
        </button>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{ color: '#64748b', marginTop: '12px' }}>Generating QR Code...</p>
        </div>
      )}

      {qrData && (
        <div>
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <img
              src={qrData.qr_code}
              alt="Payment QR Code"
              style={{ maxWidth: '200px', height: 'auto' }}
            />
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Amount</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>ETB {qrData.payment_data.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Reference</span>
              <span style={{ fontWeight: 500, fontSize: '13px', fontFamily: 'monospace' }}>
                {qrData.payment_data.reference}
                <button
                  onClick={() => handleCopy(qrData.payment_data.reference)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
                >
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#64748b" />}
                </button>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Method</span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{qrData.payment_data.method}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrData.qr_code;
                link.download = 'payment_qr.png';
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Download size={16} /> Download
            </button>
            <button
              onClick={() => window.print()}
              style={{
                flex: 1,
                padding: '10px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Print
            </button>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <p style={{ fontSize: '12px', color: '#166534', margin: 0, whiteSpace: 'pre-line' }}>
              {qrData.instructions}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;