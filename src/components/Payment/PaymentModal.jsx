// frontend/src/components/Payment/PaymentModal.jsx
// COMPLETE WITH ALL PAYMENT METHODS

import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, Banknote, Smartphone, QrCode, CheckCircle, 
  ArrowRight, AlertCircle, Copy, ExternalLink, Loader,
  Radio, Wallet, Globe, Zap, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const PaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch payment methods on mount
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payments/methods/');
      setPaymentMethods(response.data);
      if (response.data.length > 0) {
        setSelectedMethod(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const initializePayment = async () => {
    if (!selectedMethod) return;
    
    setLoading(true);
    try {
      const response = await api.post('/payments/initialize/', {
        method: selectedMethod.id,
        amount: amount
      });
      
      if (response.data.success) {
        setPaymentData(response.data);
        setStep(2);
        toast.success('Payment initialized!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentData) return;
    
    setLoading(true);
    try {
      const response = await api.post('/payments/verify/', {
        transaction_id: paymentData.reference,
        method: selectedMethod.id
      });
      
      if (response.data.success) {
        setPaymentStatus(response.data);
        setStep(3);
        if (response.data.status === 'PAID' || response.data.status === 'VERIFIED') {
          toast.success('✅ Payment successful!');
          if (onSuccess) onSuccess();
        }
      }
    } catch (error) {
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodIcon = (method) => {
    const icons = {
      'bank_transfer': '🏦',
      'telebirr': '📱',
      'chapa': '💳',
      'stripe': '💳',
      'simulate': '🧪'
    };
    return icons[method?.id] || '💰';
  };

  const getMethodColor = (method) => {
    const colors = {
      'bank_transfer': '#2563eb',
      'telebirr': '#16a34a',
      'chapa': '#8b5cf6',
      'stripe': '#635bff',
      'simulate': '#f59e0b'
    };
    return colors[method?.id] || '#64748b';
  };

  if (!isOpen) return null;

  // Step 3: Success/Status
  if (step === 3) {
    const isSuccess = paymentStatus?.status === 'PAID' || paymentStatus?.status === 'VERIFIED';
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }} onClick={onClose}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }} onClick={(e) => e.stopPropagation()}>
          
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isSuccess ? '#dcfce7' : '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            {isSuccess ? (
              <CheckCircle size={40} color="#16a34a" />
            ) : (
              <AlertCircle size={40} color="#dc2626" />
            )}
          </div>
          
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            {isSuccess ? '✅ Payment Successful!' : 'Payment Status'}
          </h3>
          
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            {isSuccess 
              ? 'Your payment has been processed successfully.' 
              : paymentStatus?.message || 'Your payment is being processed.'}
          </p>
          
          {paymentData && (
            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Reference</span>
                <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{paymentData.reference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Amount</span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>ETB {paymentData.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Method</span>
                <span style={{ fontWeight: 500 }}>{selectedMethod?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span style={{ 
                  fontWeight: 600,
                  color: isSuccess ? '#16a34a' : '#f59e0b'
                }}>
                  {isSuccess ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              onClose();
              if (isSuccess && onSuccess) onSuccess();
            }}
            style={{
              padding: '12px 32px',
              background: isSuccess ? '#22c55e' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '16px',
              width: '100%',
            }}
          >
            {isSuccess ? 'Done' : 'Check Status'}
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
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '550px',
        width: '100%',
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
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              💰 Make Payment
            </h2>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
              Amount: <strong style={{ color: '#2563eb' }}>ETB {amount}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}
          >×</button>
        </div>

        {/* Step 1: Select Payment Method */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${selectedMethod?.id === method.id ? getMethodColor(method) : '#e2e8f0'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: selectedMethod?.id === method.id ? `${getMethodColor(method)}10` : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{getMethodIcon(method)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{method.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {method.id === 'simulate' ? 'One-click demo payment' : 
                       method.id === 'chapa' ? 'Pay with Chapa (Test Mode)' :
                       method.id === 'stripe' ? 'Pay with Card (Test Mode)' :
                       method.id === 'telebirr' ? 'Pay via Telebirr' :
                       'Bank transfer payment'}
                    </div>
                  </div>
                  {selectedMethod?.id === method.id && (
                    <CheckCircle size={20} color={getMethodColor(method)} />
                  )}
                </div>
              ))}
            </div>

            {/* Method Details */}
            {selectedMethod && (
              <div style={{
                padding: '16px',
                background: `${getMethodColor(selectedMethod)}10`,
                borderRadius: '8px',
                border: `1px solid ${getMethodColor(selectedMethod)}30`,
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getMethodIcon(selectedMethod)}</span>
                  <span style={{ fontWeight: 600 }}>{selectedMethod.name}</span>
                  {selectedMethod.id === 'simulate' && (
                    <span style={{
                      fontSize: '10px',
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      Demo
                    </span>
                  )}
                  {(selectedMethod.id === 'chapa' || selectedMethod.id === 'stripe') && (
                    <span style={{
                      fontSize: '10px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      Test Mode
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  {selectedMethod.id === 'simulate' && '🧪 One-click payment for demonstration purposes only. No real money involved.'}
                  {selectedMethod.id === 'chapa' && '💳 Pay securely through Chapa. Supports Telebirr, CBEBirr, and bank transfers.'}
                  {selectedMethod.id === 'stripe' && '💳 Pay with credit/debit card. Test mode - use test card numbers.'}
                  {selectedMethod.id === 'telebirr' && '📱 Send payment via Telebirr and upload the receipt.'}
                  {selectedMethod.id === 'bank_transfer' && '🏦 Transfer to our bank account and upload the receipt.'}
                </p>
              </div>
            )}

            <button
              onClick={initializePayment}
              disabled={loading || !selectedMethod}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || !selectedMethod ? '#94a3b8' : getMethodColor(selectedMethod),
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loading || !selectedMethod ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading || !selectedMethod ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader size={20} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  Continue with {selectedMethod?.name}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && paymentData && (
          <div>
            {/* Reference */}
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Payment Reference</div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '20px', 
                fontWeight: 700, 
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                {paymentData.reference}
                <button
                  onClick={() => copyToClipboard(paymentData.reference)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '4px',
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Payment Details */}
            {paymentData.payment_details && (
              <div style={{
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  Payment Details
                </h4>
                {Object.entries(paymentData.payment_details).map(([key, value]) => {
                  if (typeof value === 'string' || typeof value === 'number') {
                    return (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}>
                        <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                          {value}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Instructions */}
            {paymentData.instructions && (
              <div style={{
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: '1.6' }}>
                  {paymentData.instructions}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {selectedMethod?.id === 'simulate' ? (
              <button
                onClick={verifyPayment}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#94a3b8' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Processing...' : '🧪 Complete Demo Payment'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    // For manual methods, show upload option
                    setStep(3);
                    setPaymentStatus({ status: 'PENDING' });
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  I Have Made Payment
                </button>
                <button
                  onClick={verifyPayment}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Check Status
                </button>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'none',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back to Methods
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;