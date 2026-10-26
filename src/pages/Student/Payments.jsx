// frontend/src/pages/Student/Payments.jsx - COMPLETE FIXED WITH DYNAMIC BANK DETAILS

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Upload, CheckCircle, XCircle, Clock, Eye, Copy, RefreshCw,
  CreditCard, DollarSign, FileImage,
  IdCard, AlertTriangle, Info,
  ArrowRight, Shield, Building, Smartphone, 
  CreditCard as CardIcon, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPayments, uploadPayment, fetchBalance } from '../../store/slices/paymentSlice';
import api from '../../api/api';
import PaymentStatusBanner from '../../components/PaymentStatusBanner';

const Payments = () => {
  const dispatch = useDispatch();
  const { payments, balance, isLoading } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodDetails, setSelectedMethodDetails] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState('');
  
  const [feeAmount, setFeeAmount] = useState(null);
  const [studentDepartment, setStudentDepartment] = useState('');
  const [loadingFee, setLoadingFee] = useState(false);
  
  // ✅ DYNAMIC BANK LIST - Loaded from backend
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [formData, setFormData] = useState({
    transaction_id: '',
    amount: '',
    bank_name: '',
    bank_account_id: '',  // ✅ Track selected bank
    transaction_date: '',
    payment_type: 'SEMESTER',
    receipt_image: null,
    semester: '',
    academic_year: '',
    payment_method_id: '',
    phone_number: '',
    account_last_digits: '',
  });

  // ✅ Payment methods with dynamic details from backend
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);

useEffect(() => {
    // ✅ ORDER MATTERS: config FIRST, then banks, then rebuild methods
    const loadEverything = async () => {
        dispatch(fetchPayments());
        dispatch(fetchBalance());
        
        // 1️⃣ Fetch admin config (has phone + bank info)
        const config = await fetchPaymentConfig();
        
        // 2️⃣ Fetch bank accounts, then rebuild with BOTH config + banks
        try {
            setLoadingBanks(true);
            const response = await api.get('/analytics/banks/');
            let banks = [];
            if (response.data?.results) banks = response.data.results;
            else if (Array.isArray(response.data)) banks = response.data;
            
            console.log('🏦 Banks fetched:', banks.length);
            setBankAccounts(banks);
            
            // ✅ 3️⃣ Rebuild methods with FRESH config + banks together
            updatePaymentMethods(banks, config);
        } catch (error) {
            console.error('Failed to fetch banks:', error);
            // Still rebuild with config only
            updatePaymentMethods([], config);
        } finally {
            setLoadingBanks(false);
        }
        
        // 4️⃣ Other stuff
        fetchPaymentMethods();
        fetchFeeAmount();
    };
    
    loadEverything();
}, [dispatch]);
// ✅ SAFETY NET: whenever paymentConfig changes (e.g., after admin update + refresh),
// rebuild the payment methods so Telebirr picks up the fresh number
useEffect(() => {
    if (paymentConfig && bankAccounts) {
        updatePaymentMethods(bankAccounts, paymentConfig);
    }
}, [paymentConfig]);

const fetchBankAccounts = async () => {
    setLoadingBanks(true);
    try {
        // ✅ FETCH BANKS FROM BACKEND
        const response = await api.get('/analytics/banks/');
        console.log('🏦 Bank Accounts:', response.data);
        
        let banks = [];
        if (response.data && response.data.results) {
            banks = response.data.results;
        } else if (Array.isArray(response.data)) {
            banks = response.data;
        }
        
        setBankAccounts(banks);
        
        // ✅ UPDATE PAYMENT METHODS WITH DYNAMIC BANKS
        updatePaymentMethods(banks);
        
    } catch (error) {
        console.error('Failed to fetch bank accounts:', error);
        
        // ✅ FALLBACK: Try to get from payment methods
        try {
            const methodsRes = await api.get('/payments/methods/');
            const bankMethod = methodsRes.data.find(m => m.id === 'bank_transfer');
            if (bankMethod && bankMethod.banks) {
                setBankAccounts(bankMethod.banks);
                updatePaymentMethods(bankMethod.banks);
                return;
            }
        } catch (e) {
            console.error('Fallback failed:', e);
        }
        
        // ✅ ULTIMATE FALLBACK
        const defaultBanks = [
            {
                id: 1,
                bank_name: 'Commercial Bank of Ethiopia',
                account_name: 'DEMS University',
                account_number: '1000225566778',
                branch_name: 'Addis Ababa Main Branch',
                swift_code: 'CBETETADD',
                is_active: true,
                is_default: true
            }
        ];
        setBankAccounts(defaultBanks);
        updatePaymentMethods(defaultBanks);
    } finally {
        setLoadingBanks(false);
    }
};

const updatePaymentMethods = (banks, configOverride = null) => {
    const methods = [];
    
    // Use passed config or fall back to state
    const config = configOverride || paymentConfig || {};
    
    // ✅ 1. BANK TRANSFER
    if (banks && banks.length > 0) {
        const activeBanks = banks.filter(b => b.is_active !== false);
        methods.push({
            id: 'bank_transfer',
            name: 'Bank Transfer',
            icon: Building,
            color: '#2563eb',
            bgColor: '#eff6ff',
            type: 'bank_transfer',
            banks: activeBanks,
            default_bank: activeBanks.find(b => b.is_default) || activeBanks[0],
            instructions: [
                'Visit any bank branch',
                'Fill out the deposit slip with the following details:',
                '  • Account Name: {account_name}',
                '  • Account Number: {account_number}',
                '  • Bank: {bank_name}',
                '  • Branch: {branch_name}',
                '  • Amount: Your exact payment amount',
                'Keep the bank receipt as proof of payment',
                'Enter the transaction ID from your receipt below',
                'Upload a clear photo or scan of the receipt'
            ]
        });
    }
    
    const telebirrNumber = config.payment_phone || '0918114545';
    const telebirrAccount = config.account_name || 'DEMS University';
    
    console.log('📱 Telebirr using number:', telebirrNumber); // debug
    
    methods.push({
        id: 'telebirr',
        name: 'Telebirr',
        icon: Smartphone,
        color: '#d97706',
        bgColor: '#fffbeb',
        type: 'telebirr',
        details: {
            phone_number: telebirrNumber,
            account_name: telebirrAccount,
            service: 'Telebirr Merchant'
        },
        instructions: [
            'Open your Telebirr mobile app',
            'Select "Send Money" option',
            `Enter the Telebirr number: ${telebirrNumber}`,
            'Enter the exact payment amount',
            'Add your Transaction ID as reference',
            'Complete the transaction using your PIN',
            'Take a screenshot of the confirmation',
            'Upload the screenshot below'
        ]
    });
    
    // ✅ 3. Chapa (unchanged)
    methods.push({
        id: 'chapa',
        name: 'Chapa',
        icon: Globe,
        color: '#7c3aed',
        bgColor: '#f5f3ff',
        type: 'online',
        details: {
            website: 'https://chapa.co',
            test_mode: true,
            test_card: '4242 4242 4242 4242'
        },
        instructions: [
            'Click the payment link below to proceed to Chapa',
            'You will be redirected to Chapa\'s secure payment page',
            'Choose your preferred payment method (Card, Telebirr, etc.)',
            'Enter your payment details on the secure page',
            'Complete the payment confirmation',
            'You will be redirected back after successful payment',
            'TEST MODE: Use 4242 4242 4242 4242 for testing'
        ]
    });
    
    // ✅ 4. Stripe
    methods.push({
        id: 'stripe',
        name: 'Stripe',
        icon: CardIcon,
        color: '#059669',
        bgColor: '#ecfdf5',
        type: 'online',
        details: {
            test_mode: true,
            test_card: '4242 4242 4242 4242',
            test_expiry: '12/25',
            test_cvc: '123'
        },
        instructions: [
            'Click the payment link below to proceed to Stripe',
            'You will be redirected to Stripe\'s secure payment page',
            'Enter your card details on the secure Stripe page',
            'Complete the payment using 3D Secure if required',
            'You will receive a confirmation email',
            'TEST MODE: Use 4242 4242 4242 4242 for testing'
        ]
    });
    
    // ✅ 5. Simulate
    methods.push({
        id: 'simulate',
        name: 'Demo Payment (1-Click)',
        icon: Shield,
        color: '#8b5cf6',
        bgColor: '#f5f3ff',
        type: 'demo',
        details: { test_mode: true },
        instructions: [
            '🧪 DEMO PAYMENT - No real money involved',
            'Click "Complete Demo Payment" to instantly verify your payment.',
            'This is for demonstration purposes only.'
        ]
    });
    
    setPaymentMethodsList(methods);
};

  // ✅ Get bank name by account ID
  const getBankNameById = (accountId) => {
    const bank = bankAccounts.find(b => b.id === parseInt(accountId));
    return bank ? bank.bank_name : '';
  };

  // ✅ Get bank details by account ID
  const getBankDetailsById = (accountId) => {
    const bank = bankAccounts.find(b => b.id === parseInt(accountId));
    return bank || null;
  };

  const fetchFeeAmount = async () => {
    setLoadingFee(true);
    try {
      const profileRes = await api.get('/auth/profile/student/');
      const department = profileRes.data.department || '';
      setStudentDepartment(department);
      const feeRes = await api.get('/payments/fee-amount/');
      setFeeAmount(feeRes.data);
      if (feeRes.data.has_fee_structure && feeRes.data.amount > 0) {
        setFormData(prev => ({ ...prev, amount: feeRes.data.amount.toString() }));
      }
    } catch (error) {
      console.error('Failed to fetch fee amount:', error);
    } finally {
      setLoadingFee(false);
    }
  };

// ✅ ADD this function if not already present:

const fetchPaymentConfig = async () => {
    setLoadingConfig(true);
    try {
        const response = await api.get('/analytics/payment-config/');
        console.log('🔧 Fresh payment config from admin:', response.data);
        setPaymentConfig(response.data);
        
        // ✅ CRITICAL: Rebuild payment methods with the fresh config
        // This ensures Telebirr shows the LATEST admin-configured number
        if (response.data) {
            updatePaymentMethods(bankAccounts, response.data);
        }
        
        return response.data;
    } catch (error) {
        console.error('Failed to fetch payment config:', error);
        return null;
    } finally {
        setLoadingConfig(false);
    }
};

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payments/methods/');
      setPaymentMethods(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const paymentsArray = Array.isArray(payments) ? payments : [];

  const handleMethodSelect = (methodId) => {
    const method = paymentMethodsList.find(m => m.id === methodId);
    
    if (!method) return;
    
    setSelectedMethodDetails(method);
    
    // ✅ If bank transfer, set default bank
    if (methodId === 'bank_transfer' && method.banks && method.banks.length > 0) {
      const defaultBank = method.banks.find(b => b.is_default) || method.banks[0];
      setFormData({ 
        ...formData, 
        payment_method_id: methodId,
        bank_account_id: defaultBank.id.toString(),
        bank_name: defaultBank.bank_name,
      });
    } else {
      setFormData({ 
        ...formData, 
        payment_method_id: methodId,
        bank_name: method?.details?.bank_name || '',
        bank_account_id: '',
      });
    }
  };

  // ✅ Handle bank selection change
  const handleBankChange = (e) => {
    const bankId = e.target.value;
    const bank = getBankDetailsById(bankId);
    if (bank) {
      setFormData({ 
        ...formData, 
        bank_account_id: bankId,
        bank_name: bank.bank_name,
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, receipt_image: file });
      setFileList([{ name: file.name, originFileObj: file }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.transaction_id) {
      toast.error('Transaction ID is required');
      return;
    }
    if (!formData.amount) {
      toast.error('Amount is required');
      return;
    }
    if (!formData.payment_method_id) {
      toast.error('Please select a payment method');
      return;
    }
    if (!formData.transaction_date) {
      toast.error('Transaction date is required');
      return;
    }
    if (!formData.receipt_image) {
      toast.error('Receipt image is required');
      return;
    }
    
    setUploading(true);
    
    const data = new FormData();
    data.append('transaction_id', formData.transaction_id);
    data.append('amount', formData.amount);
    data.append('bank_name', formData.bank_name || selectedMethodDetails?.details?.bank_name || '');
    data.append('transaction_date', formData.transaction_date);
    data.append('payment_type', formData.payment_type);
    data.append('payment_method_id', formData.payment_method_id);
    if (formData.phone_number) {
      data.append('phone_number', formData.phone_number);
    }
    if (formData.account_last_digits) {
      data.append('account_last_digits', formData.account_last_digits);
    }
    if (formData.bank_account_id) {
      data.append('bank_account_id', formData.bank_account_id);
    }
    data.append('receipt_image', formData.receipt_image);
    
    try {
      await dispatch(uploadPayment(data)).unwrap();
      toast.success('Payment proof uploaded successfully!');
      setShowUploadModal(false);
      dispatch(fetchPayments());
      dispatch(fetchBalance());
      resetForm();
    } catch (error) {
      toast.error(error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_id: '',
      amount: feeAmount?.has_fee_structure ? feeAmount.amount.toString() : '',
      bank_name: '',
      bank_account_id: '',
      transaction_date: '',
      payment_type: 'SEMESTER',
      receipt_image: null,
      semester: '',
      academic_year: '',
      payment_method_id: '',
      phone_number: '',
      account_last_digits: '',
    });
    setSelectedMethodDetails(null);
    setFileList([]);
    setCurrentStep(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const viewReceipt = async (payment) => {
    try {
      const response = await api.get(`/payments/${payment.id}/receipt/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'image/jpeg' 
      });
      const url = window.URL.createObjectURL(blob);
      setReceiptImage(url);
      setReceiptModal(true);
    } catch (error) {
      toast.error('Failed to load receipt');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#dcfce7',
          color: '#16a34a',
        }}><CheckCircle size={14} /> Verified</span>;
      case 'REJECTED':
        return <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#fee2e2',
          color: '#dc2626',
        }}><XCircle size={14} /> Rejected</span>;
      case 'PENDING':
        return <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#fef3c7',
          color: '#d97706',
        }}><Clock size={14} /> Pending</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const calculateStats = () => {
    const totalAmount = paymentsArray.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pending = paymentsArray.filter(p => p.status === 'PENDING').length;
    const verified = paymentsArray.filter(p => p.status === 'VERIFIED').length;
    const rejected = paymentsArray.filter(p => p.status === 'REJECTED').length;
    return {
      total_payments: paymentsArray.length,
      total_amount: totalAmount.toFixed(2),
      pending,
      verified,
      rejected,
    };
  };

  const stats = calculateStats();

  // ✅ RENDER BANK SELECTION DROPDOWN
// ✅ REPLACE renderBankSelection function with:

const renderBankSelection = () => {
    if (!selectedMethodDetails || selectedMethodDetails.id !== 'bank_transfer') return null;
    
    const banks = selectedMethodDetails.banks || [];
    
    if (banks.length === 0) {
        return (
            <div style={{ 
                padding: '12px', 
                background: '#fee2e2', 
                borderRadius: '8px', 
                color: '#dc2626',
                marginBottom: '16px'
            }}>
                ⚠️ No bank accounts available. Please contact administrator.
            </div>
        );
    }
    
    return (
        <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#334155',
                marginBottom: '4px'
            }}>
                Select Bank Account <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
                className="form-select"
                value={formData.bank_account_id}
                onChange={handleBankChange}
                required
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    transition: 'all 0.3s ease'
                }}
            >
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                        {bank.bank_name} - {bank.account_name} ({bank.account_number})
                        {bank.is_default && ' ⭐ Default'}
                    </option>
                ))}
            </select>
            
            {formData.bank_account_id && (
                <div style={{ 
                    marginTop: '8px', 
                    padding: '12px 16px', 
                    background: '#f0fdf4', 
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                    fontSize: '13px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#64748b' }}>Bank</span>
                        <span style={{ fontWeight: 500 }}>{getBankDetailsById(formData.bank_account_id)?.bank_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#64748b' }}>Account Name</span>
                        <span style={{ fontWeight: 500 }}>{getBankDetailsById(formData.bank_account_id)?.account_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#64748b' }}>Account Number</span>
                        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                            {getBankDetailsById(formData.bank_account_id)?.account_number}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#64748b' }}>Branch</span>
                        <span style={{ fontWeight: 500 }}>{getBankDetailsById(formData.bank_account_id)?.branch_name || 'N/A'}</span>
                    </div>
                    {getBankDetailsById(formData.bank_account_id)?.swift_code && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>SWIFT Code</span>
                            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                {getBankDetailsById(formData.bank_account_id)?.swift_code}
                            </span>
                        </div>
                    )}
                </div>
            )}
            
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                Please select the bank account you want to transfer to.
            </p>
        </div>
    );
};

  if (isLoading || loadingConfig || loadingFee || loadingBanks) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '256px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .payment-config-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .payment-history-table {
            overflow-x: auto;
          }
          .modal-content {
            padding: 16px !important;
          }
          .step-container {
            flex-wrap: wrap !important;
            gap: 4px !important;
          }
          .step-item {
            flex: 1 1 40% !important;
            min-width: 60px !important;
          }
          .step-line {
            display: none !important;
          }
          .method-cards {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .step-circle.active { 
          background: #2563eb; 
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
        .step-circle.completed { 
          background: #22c55e; 
        }
        .step-circle.pending { 
          background: #d1d5db; 
        }
        .step-line {
          width: 40px;
          height: 3px;
          flex-shrink: 0;
          border-radius: 2px;
        }
        .step-line.active { background: #2563eb; }
        .step-line.completed { background: #22c55e; }
        .step-line.pending { background: #e5e7eb; }
        .step-label {
          font-size: 11px;
          color: #64748b;
          text-align: center;
          margin-top: 6px;
          font-weight: 500;
        }
        .step-label.active {
          color: #2563eb;
          font-weight: 600;
        }
        .step-label.completed {
          color: #22c55e;
        }
        .method-card {
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }
        .method-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .method-card.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }
        .method-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .instruction-step {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .instruction-step:last-child {
          border-bottom: none;
        }
        .instruction-number {
          min-width: 24px;
          height: 24px;
          background: #2563eb;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .modal-box {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          position: relative;
        }
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          font-size: 15px;
        }
        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .btn-secondary {
          flex: 1;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: #f8fafc;
        }
        .btn-success {
          width: 100%;
          padding: 14px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          font-size: 15px;
        }
        .btn-success:hover {
          background: #16a34a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        .btn-success:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .form-group {
          margin-bottom: 14px;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 4px;
        }
        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }
        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          outline: none;
        }
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          outline: none;
        }
        .drop-zone {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }
        .drop-zone:hover {
          border-color: #2563eb;
          background: #f8fafc;
        }
        .drop-zone.has-file {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .step-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #94a3b8;
        }
        .modal-close:hover {
          color: #0f172a;
        }
        .instructions-box {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
        }
        .details-box {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          border: 1px solid #bbf7d0;
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>My Payments</h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>Manage your payments and view transaction history</p>
        </div>
        <button
          onClick={() => {
            dispatch(fetchPayments());
            toast.success('Refreshed');
          }}
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

      {/* PAYMENT STATUS BANNER */}
      <div style={{ marginBottom: '16px' }}>
        <PaymentStatusBanner />
      </div>

      {/* Payment Configuration Card - DYNAMIC from backend */}
      {paymentConfig && (
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #2563eb)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }} className="payment-config-grid">
            <div>
              <div style={{ opacity: 0.8, fontSize: '12px' }}>Bank Name</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {paymentConfig.bank_name || 'Commercial Bank of Ethiopia'}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.8, fontSize: '12px' }}>Account Name</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {paymentConfig.account_name || 'DEMS University'}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.8, fontSize: '12px' }}>Account Number</div>
              <div style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {paymentConfig.payment_account || '1000225566778'}
                </span>
                <button
                  onClick={() => copyToClipboard(paymentConfig.payment_account || '1000225566778')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.8, fontSize: '12px' }}>TeleBirr Number</div>
              <div style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {paymentConfig.payment_phone || '0918114545'}
                <button
                  onClick={() => copyToClipboard(paymentConfig.payment_phone || '0918114545')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Fee Info */}
      {feeAmount && feeAmount.has_fee_structure && (
        <div style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          borderRadius: '12px',
          padding: '16px 24px',
          color: 'white',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Department</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{studentDepartment}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Fee Structure</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{feeAmount.payment_period_display || 'Semester'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Required Amount</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              ETB {feeAmount.amount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      )}

      {/* Payment Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }} className="stats-grid">
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          textAlign: 'center',
          borderLeft: '4px solid #1890ff',
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Payments</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>
            {stats.total_payments}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          textAlign: 'center',
          borderLeft: '4px solid #faad14',
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Pending</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#faad14', margin: '4px 0 0 0' }}>
            {stats.pending}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          textAlign: 'center',
          borderLeft: '4px solid #52c41a',
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Verified</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#52c41a', margin: '4px 0 0 0' }}>
            {stats.verified}
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          textAlign: 'center',
          borderLeft: '4px solid #ff4d4f',
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Rejected</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ff4d4f', margin: '4px 0 0 0' }}>
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        borderRadius: '12px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Payment Status</h2>
          <p style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0 0 0' }}>
            {balance?.balance_due > 0 ? `${balance.balance_due} ETB Due` : 'All Paid'}
          </p>
          <p style={{ marginTop: '4px', opacity: 0.9 }}>
            Status: {balance?.payment_status === 'VERIFIED' ? '✅ Verified' : '⏳ Pending Verification'}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={paymentConfig?.system_open === false}
          style={{
            background: 'white',
            color: '#15803d',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: paymentConfig?.system_open === false ? 'not-allowed' : 'pointer',
            opacity: paymentConfig?.system_open === false ? 0.5 : 1,
          }}
        >
          <Upload size={20} /> Upload Payment
        </button>
      </div>

      {/* Payment History */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px',
        }}>Payment History</h2>
        
        {paymentsArray.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#64748b',
          }}>
            <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No payment records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }} className="payment-history-table">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Transaction</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Amount</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Bank</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Date</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentsArray.map((payment) => (
                  <tr key={payment.id || Math.random()} style={{
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                    }}>{payment.transaction_id}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}>ETB {parseFloat(payment.amount).toFixed(2)}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#475569',
                    }}>{payment.bank_name}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>{getStatusBadge(payment.status)}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#64748b',
                    }}>
                      {payment.uploaded_at ? new Date(payment.uploaded_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      {payment.receipt_image && (
                        <button 
                          onClick={() => viewReceipt(payment)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <Eye size={14} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ UPLOAD MODAL - WITH DYNAMIC BANK SELECTION ============ */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            
            <button className="modal-close" onClick={() => { setShowUploadModal(false); resetForm(); }}>×</button>

            {/* Modal Header */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Upload size={22} style={{ color: '#2563eb' }} />
                Submit Payment
              </h2>
              <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
                Step {currentStep + 1} of 5: {currentStep === 0 ? 'Select Payment Method' : currentStep === 1 ? 'Payment Details' : currentStep === 2 ? 'Fill Form' : currentStep === 3 ? 'Upload Receipt' : 'Review & Submit'}
              </p>
            </div>

            {/* Steps */}
            <div className="step-container">
              {[
                { num: 1, label: 'Method' },
                { num: 2, label: 'Details' },
                { num: 3, label: 'Payment' },
                { num: 4, label: 'Receipt' },
                { num: 5, label: 'Review' }
              ].map((step, index) => (
                <div key={index} className="step-item">
                  <div
                    className={`step-circle ${index === currentStep ? 'active' : index < currentStep ? 'completed' : 'pending'}`}
                    onClick={() => { if (index <= currentStep) setCurrentStep(index); }}
                    style={{ cursor: index <= currentStep ? 'pointer' : 'default' }}
                  >
                    {index < currentStep ? <CheckCircle size={18} /> : step.num}
                  </div>
                  <div className={`step-label ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}>
                    {step.label}
                  </div>
                  {index < 4 && (
                    <div className={`step-line ${index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Select Payment Method */}
            {currentStep === 0 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <CreditCard size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                  Select Payment Method
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                  Choose your preferred payment method from the options below
                </p>
                
                <div className="method-cards">
                  {paymentMethodsList.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`method-card ${formData.payment_method_id === method.id ? 'selected' : ''}`}
                        onClick={() => handleMethodSelect(method.id)}
                      >
                        <Icon size={28} style={{ color: method.color, margin: '0 auto 6px' }} />
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{method.name}</div>
                        {method.type === 'bank_transfer' && method.banks && method.banks.length > 0 && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                            {method.banks.length} bank(s) available
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Payment Method Details and Instructions */}
                {selectedMethodDetails && (
                  <div>
                    <div className="details-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle size={16} style={{ color: '#16a34a' }} />
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>Selected: {selectedMethodDetails.name}</span>
                      </div>
                      
                      {/* Bank Transfer Details - DYNAMIC with multiple banks */}
                      {selectedMethodDetails.id === 'bank_transfer' && selectedMethodDetails.banks && (
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Available Banks:</span>
                            <span style={{ fontWeight: 500 }}>
                              {selectedMethodDetails.banks.length} bank(s) configured
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {selectedMethodDetails.banks.map((bank, idx) => (
                              <div key={idx} style={{ 
                                padding: '6px 10px', 
                                background: '#f8fafc', 
                                borderRadius: '4px',
                                marginBottom: '4px',
                                border: bank.is_default ? '1px solid #22c55e' : '1px solid #e2e8f0'
                              }}>
                                <strong>{bank.bank_name}</strong>
                                {bank.is_default && <span style={{ color: '#22c55e', fontSize: '11px', marginLeft: '8px' }}>★ Default</span>}
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  {bank.account_name} • {bank.account_number}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Telebirr Details - DYNAMIC */}
                      {selectedMethodDetails.id === 'telebirr' && (
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Telebirr Number:</span>
                            <span style={{ fontWeight: 500 }}>{selectedMethodDetails.details.phone_number}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Account Name:</span>
                            <span style={{ fontWeight: 500 }}>{selectedMethodDetails.details.account_name}</span>
                          </div>
                        </div>
                      )}

                      {/* Chapa Details */}
                      {selectedMethodDetails.id === 'chapa' && (
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Website:</span>
                            <span style={{ fontWeight: 500 }}>{selectedMethodDetails.details.website}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test Mode:</span>
                            <span style={{ fontWeight: 500, color: '#7c3aed' }}>🔬 Enabled</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test Card:</span>
                            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selectedMethodDetails.details.test_card}</span>
                          </div>
                        </div>
                      )}

                      {/* Stripe Details */}
                      {selectedMethodDetails.id === 'stripe' && (
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test Mode:</span>
                            <span style={{ fontWeight: 500, color: '#059669' }}>🔬 Enabled</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test Card:</span>
                            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selectedMethodDetails.details.test_card}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test Expiry:</span>
                            <span style={{ fontWeight: 500 }}>{selectedMethodDetails.details.test_expiry}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Test CVC:</span>
                            <span style={{ fontWeight: 500 }}>{selectedMethodDetails.details.test_cvc}</span>
                          </div>
                        </div>
                      )}

                      {/* Simulate/Demo Details */}
                      {selectedMethodDetails.id === 'simulate' && (
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Mode:</span>
                            <span style={{ fontWeight: 500, color: '#8b5cf6' }}>🧪 Demo</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#64748b' }}>Cost:</span>
                            <span style={{ fontWeight: 500, color: '#22c55e' }}>Free - No real money</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="instructions-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Info size={16} style={{ color: '#2563eb' }} />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Instructions</span>
                      </div>
                      {selectedMethodDetails.instructions.map((instruction, idx) => (
                        <div key={idx} className="instruction-step">
                          <div className="instruction-number">{idx + 1}</div>
                          <div style={{ fontSize: '13px', color: '#334155', flex: 1 }}>
                            {instruction.split(':').map((part, i) => (
                              <span key={i}>
                                {i === 0 ? part : <strong>{part}</strong>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn-primary"
                      style={{ marginTop: '8px' }}
                      onClick={() => setCurrentStep(1)}
                    >
                      Next Step <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment Method Details View */}
            {currentStep === 1 && selectedMethodDetails && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <CreditCard size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                  Payment Method Details
                </h3>
                
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Method</span>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedMethodDetails.name}</span>
                  </div>
                  
                  {/* Show appropriate details based on method */}
                  {selectedMethodDetails.id === 'bank_transfer' && selectedMethodDetails.banks && (
                    <>
                      <div style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Available Banks:</span>
                        {selectedMethodDetails.banks.map((bank, idx) => (
                          <div key={idx} style={{ 
                            padding: '4px 8px', 
                            marginTop: '4px',
                            background: bank.is_default ? '#f0fdf4' : 'white',
                            borderRadius: '4px',
                            border: bank.is_default ? '1px solid #22c55e' : '1px solid #e2e8f0'
                          }}>
                            <span style={{ fontWeight: 500 }}>{bank.bank_name}</span>
                            {bank.is_default && <span style={{ color: '#22c55e', fontSize: '11px', marginLeft: '8px' }}>★ Default</span>}
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {bank.account_name} • {bank.account_number}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedMethodDetails.id === 'telebirr' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Telebirr Number</span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedMethodDetails.details.phone_number}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Account Name</span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedMethodDetails.details.account_name}</span>
                      </div>
                    </>
                  )}

                  {selectedMethodDetails.id === 'chapa' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Website</span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedMethodDetails.details.website}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Test Mode</span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#7c3aed' }}>🔬 Enabled</span>
                      </div>
                    </>
                  )}

                  {selectedMethodDetails.id === 'stripe' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Test Mode</span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#059669' }}>🔬 Enabled</span>
                      </div>
                    </>
                  )}

                  {selectedMethodDetails.id === 'simulate' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Mode</span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#8b5cf6' }}>🧪 Demo Payment</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setCurrentStep(0)}>Back</button>
                  <button className="btn-primary" onClick={() => setCurrentStep(2)}>Next Step <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 3: Fill Payment Form */}
            {currentStep === 2 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <IdCard size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                  Payment Details
                </h3>

                {feeAmount && feeAmount.has_fee_structure && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#dbeafe',
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: '13px', color: '#0f172a' }}>
                      Required: <span style={{ color: '#16a34a', fontWeight: 600 }}>ETB {feeAmount.amount?.toFixed(2)}</span>
                    </span>
                  </div>
                )}

                {/* ✅ DYNAMIC BANK SELECTION - Only for Bank Transfer */}
                {selectedMethodDetails?.id === 'bank_transfer' && renderBankSelection()}

                <div className="form-group">
                  <label className="form-label">Transaction ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your transaction ID"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (ETB) *</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.01"
                    min="1"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  />
                </div>

                {/* Show relevant fields based on payment method */}
                {selectedMethodDetails?.id === 'telebirr' && (
                  <div className="form-group">
                    <label className="form-label">Your Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="0912345678"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>
                )}

                {selectedMethodDetails?.id === 'bank_transfer' && (
                  <div className="form-group">
                    <label className="form-label">Last 4 Digits of Account *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1234"
                      maxLength="4"
                      value={formData.account_last_digits}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) setFormData({ ...formData, account_last_digits: val });
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setCurrentStep(1)}>Back</button>
                  <button className="btn-primary" onClick={() => {
                    if (!formData.transaction_id) { toast.error('Please enter transaction ID'); return; }
                    if (!formData.amount) { toast.error('Please enter amount'); return; }
                    if (!formData.transaction_date) { toast.error('Please select transaction date'); return; }
                    if (selectedMethodDetails?.id === 'bank_transfer' && !formData.bank_account_id) { 
                      toast.error('Please select a bank account'); 
                      return; 
                    }
                    setCurrentStep(3);
                  }}>Next Step <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 4: Upload Receipt */}
            {currentStep === 3 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <FileImage size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                  Upload Receipt
                </h3>

                <div
                  className={`drop-zone ${fileList.length > 0 ? 'has-file' : ''}`}
                  onClick={() => document.getElementById('receiptInput').click()}
                  style={{ marginBottom: '16px' }}
                >
                  <input
                    id="receiptInput"
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {fileList.length > 0 ? (
                    <div>
                      <CheckCircle size={36} style={{ color: '#22c55e', margin: '0 auto 6px' }} />
                      <p style={{ fontWeight: 500, color: '#16a34a', margin: 0, fontSize: '14px' }}>{fileList[0].name}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={36} style={{ color: '#94a3b8', margin: '0 auto 6px' }} />
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Click to upload receipt</p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: '4px 0 0 0' }}>JPG, PNG, PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setCurrentStep(2)}>Back</button>
                  <button className="btn-primary" onClick={() => {
                    if (!fileList.length) { toast.error('Please upload a receipt'); return; }
                    setCurrentStep(4);
                  }}>Next Step <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 4 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  <Shield size={18} style={{ display: 'inline', marginRight: '8px', color: '#2563eb' }} />
                  Review & Submit
                </h3>

                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Method</span>
                    <span style={{ fontWeight: 500, fontSize: '13px' }}>{selectedMethodDetails?.name}</span>
                  </div>
                  {selectedMethodDetails?.id === 'bank_transfer' && formData.bank_account_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Bank</span>
                      <span style={{ fontWeight: 500, fontSize: '13px' }}>{getBankNameById(formData.bank_account_id)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Transaction ID</span>
                    <span style={{ fontWeight: 500, fontSize: '13px', fontFamily: 'monospace' }}>{formData.transaction_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Amount</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb' }}>ETB {formData.amount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Receipt</span>
                    <span style={{ fontWeight: 500, fontSize: '13px', color: '#22c55e' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Uploaded</span>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fde68a',
                  marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> Please verify all details before submitting
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setCurrentStep(3)}>Back</button>
                  <button className="btn-success" onClick={handleSubmit} disabled={uploading}>
                    {uploading ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(false)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReceiptModal(false)}>×</button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileImage size={20} style={{ color: '#3b82f6' }} /> Payment Receipt
            </h2>
            {receiptImage ? (
              <div style={{ textAlign: 'center' }}>
                <img src={receiptImage} alt="Payment Receipt" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => window.open(receiptImage, '_blank')} className="btn-primary" style={{ flex: 1 }}>Open</button>
                  <button onClick={() => { const link = document.createElement('a'); link.href = receiptImage; link.download = 'receipt.jpg'; document.body.appendChild(link); link.click(); link.remove(); }} className="btn-secondary" style={{ flex: 1 }}>Download</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}><FileImage size={48} style={{ color: '#d9d9d9', margin: '0 auto 16px' }} /><p>Receipt not available</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;