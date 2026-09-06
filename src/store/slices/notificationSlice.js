import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/');
      let notifications = response.data;
      if (Array.isArray(notifications)) {
        return notifications;
      }
      if (notifications && notifications.results && Array.isArray(notifications.results)) {
        return notifications.results;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/unread-count/');
      return response.data.unread_count || 0;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const notifications = Array.isArray(action.payload) ? action.payload : [];
        state.notifications = notifications;
        state.unreadCount = notifications.filter(n => n && !n.is_read).length || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch notifications';
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        if (notificationId) {
          const notification = state.notifications.find(n => n && n.id === notificationId);
          if (notification) {
            notification.is_read = true;
            state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
          }
        }
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = typeof action.payload === 'number' ? action.payload : 0;
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.unreadCount = 0;
      });
  },
});

export const { clearNotifications, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;