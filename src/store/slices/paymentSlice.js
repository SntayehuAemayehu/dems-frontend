import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

// ============ Existing thunks (unchanged) ============
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/proofs/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const uploadPayment = createAsyncThunk(
  'payments/uploadPayment',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/proofs/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (typeof errorData === 'string') return rejectWithValue(errorData);
      if (errorData && typeof errorData === 'object') {
        if (errorData.error) return rejectWithValue(errorData.error);
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError)) return rejectWithValue(firstError[0]);
        return rejectWithValue(JSON.stringify(errorData));
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to upload payment');
    }
  }
);

export const fetchBalance = createAsyncThunk(
  'payments/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/balance/');
      return response.data || { balance_due: 0, payment_status: 'PENDING' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

// ============ New: Initialize Chapa payment ============
export const initializeChapaPayment = createAsyncThunk(
  'payments/initializeChapa',
  async ({ amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/initialize/', {
        method: 'chapa',
        amount: String(amount),
      });
      if (response.data.success && response.data.checkout_url) {
        return response.data;
      }
      return rejectWithValue(response.data.message || 'Chapa initialization failed');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || 'Chapa initialization failed'
      );
    }
  }
);

// ============ New: Initialize Stripe payment ============
export const initializeStripePayment = createAsyncThunk(
  'payments/initializeStripe',
  async ({ amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/initialize/', {
        method: 'stripe',
        amount: String(amount),
      });
      if (response.data.success && response.data.checkout_url) {
        return response.data;
      }
      return rejectWithValue(response.data.message || 'Stripe initialization failed');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || 'Stripe initialization failed'
      );
    }
  }
);

// ============ New: Verify payment (shared by Chapa + Stripe) ============
// Backend needs to distinguish provider. We pass method + reference.
export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async ({ method, reference }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/verify/', {
        method,
        tx_ref: reference,        // Chapa uses tx_ref
        session_id: reference,    // Stripe uses session_id
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || 'Verification failed'
      );
    }
  }
);

const initialState = {
  payments: [],
  balance: { balance_due: 0, payment_status: 'PENDING' },
  isLoading: false,
  error: null,
  checkoutLoading: false,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setCheckoutLoading: (state, action) => { state.checkoutLoading = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload; state.payments = [];
      })
      .addCase(uploadPayment.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(uploadPayment.fulfilled, (state) => { state.isLoading = false; })
      .addCase(uploadPayment.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchBalance.pending, (state) => { state.isLoading = true; })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload || { balance_due: 0, payment_status: 'PENDING' };
      })
      .addCase(fetchBalance.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      // Chapa
      .addCase(initializeChapaPayment.pending, (state) => { state.checkoutLoading = true; state.error = null; })
      .addCase(initializeChapaPayment.fulfilled, (state) => { state.checkoutLoading = false; })
      .addCase(initializeChapaPayment.rejected, (state, action) => {
        state.checkoutLoading = false; state.error = action.payload;
      })
      // Stripe
      .addCase(initializeStripePayment.pending, (state) => { state.checkoutLoading = true; state.error = null; })
      .addCase(initializeStripePayment.fulfilled, (state) => { state.checkoutLoading = false; })
      .addCase(initializeStripePayment.rejected, (state, action) => {
        state.checkoutLoading = false; state.error = action.payload;
      })
      // Verify
      .addCase(verifyPayment.pending, (state) => { state.checkoutLoading = true; })
      .addCase(verifyPayment.fulfilled, (state) => { state.checkoutLoading = false; })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.checkoutLoading = false; state.error = action.payload;
      });
  },
});

export const { clearError, setCheckoutLoading } = paymentSlice.actions;
export default paymentSlice.reducer;