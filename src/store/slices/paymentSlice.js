import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

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
      if (typeof errorData === 'string') {
        return rejectWithValue(errorData);
      }
      if (errorData && typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError)) {
          return rejectWithValue(firstError[0]);
        }
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

const initialState = {
  payments: [],
  balance: { balance_due: 0, payment_status: 'PENDING' },
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.payments = [];
      })
      .addCase(uploadPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadPayment.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(uploadPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload || { balance_due: 0, payment_status: 'PENDING' };
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;