// frontend/src/store/slices/authSlice.js - COMPLETE

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { access, refresh, user, dashboard } = response.data;
      
      // ✅ Safely store data
      try {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
      return { user, access, refresh, dashboard };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
});

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to get profile';
      
      if (error.response) {
        if (error.response.status === 401) {
          try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_role');
          } catch (e) {
            console.error('Failed to clear localStorage:', e);
          }
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.data) {
          errorMessage = error.response.data.message || error.response.data.error || 'Server error';
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Failed to get profile';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ SAFE: Get user from localStorage with error handling
const getSafeUserFromStorage = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (parseError) {
      console.error('❌ Invalid JSON in localStorage "user":', parseError);
      try {
        localStorage.removeItem('user');
        console.log('✅ Removed corrupted user data');
      } catch (e) {
        console.error('Failed to remove corrupted data:', e);
      }
      return null;
    }
  } catch (e) {
    console.error('❌ Error accessing localStorage:', e);
    return null;
  }
};

// ✅ SAFE: Get token from localStorage
const getSafeTokenFromStorage = () => {
  try {
    const token = localStorage.getItem('access_token');
    return token || null;
  } catch (e) {
    console.error('❌ Error accessing localStorage token:', e);
    return null;
  }
};

// ✅ SAFE: Get role from localStorage
const getSafeRoleFromStorage = () => {
  try {
    const role = localStorage.getItem('user_role');
    return role || null;
  } catch (e) {
    console.error('❌ Error accessing localStorage role:', e);
    return null;
  }
};

const initialState = {
  user: getSafeUserFromStorage(),
  isAuthenticated: !!getSafeTokenFromStorage(),
  userRole: getSafeRoleFromStorage(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.userRole = null;
      state.isLoading = false;
      state.error = null;
    },
    forceLogout: (state) => {
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      state.user = null;
      state.isAuthenticated = false;
      state.userRole = null;
      state.isLoading = false;
      state.error = 'Session reset. Please login again.';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userRole = action.payload.user.role;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.userRole = null;
        state.error = null;
      })
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        try {
          localStorage.setItem('user', JSON.stringify(action.payload));
          if (action.payload.role) {
            localStorage.setItem('user_role', action.payload.role);
          }
        } catch (e) {
          console.error('Failed to save user to localStorage:', e);
        }
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get profile';
        
        if (action.payload?.includes('401') || action.payload?.includes('Session expired')) {
          state.isAuthenticated = false;
          state.user = null;
          state.userRole = null;
          try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_role');
          } catch (e) {
            console.error('Failed to clear localStorage:', e);
          }
        }
      });
  },
});

export const { clearError, resetAuth, forceLogout } = authSlice.actions;
export default authSlice.reducer;