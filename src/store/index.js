import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import examReducer from './slices/examSlice';
import notificationReducer from './slices/notificationSlice';
import paymentReducer from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    exams: examReducer,
    notifications: notificationReducer,
    payments: paymentReducer,
  },
});

export default store;