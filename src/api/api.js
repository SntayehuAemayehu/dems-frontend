// frontend/src/api/api.js
// COMPLETE WITH GLOBAL ACCESS LOCK INTERCEPTOR

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return '';

    try {
        const apiOrigin = new URL(API_BASE_URL).origin;
        return new URL(mediaPath, `${apiOrigin}/`).href;
    } catch {
        return mediaPath;
    }
};

// ============================================================
// REQUEST INTERCEPTOR - Add token to requests
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================================
// RESPONSE INTERCEPTOR - GLOBAL ACCESS LOCK
// ============================================================
api.interceptors.response.use(
    (response) => {
        // If response is a blob (file download), return it directly
        if (response.config.responseType === 'blob') {
            return response;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // 1. Handle 401 - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (!refreshToken) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('user_role');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });
                
                const { access } = response.data;
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_role');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // 2. Handle 403 - ACCESS LOCKED (REDIRECT TO PAYMENTS)
        if (error.response?.status === 403) {
            const data = error.response?.data;
            
            if (data?.status === 'LOCKED' || data?.is_locked === true || data?.has_access === false || data?.payment_required === true) {
                // Show toast message
                toast.error(`🔒 ${data?.message || 'Your account is locked. Please make payment.'}`);
                
                // ✅ REDIRECT TO PAYMENTS PAGE
                if (window.location.pathname !== '/payments') {
                    window.location.href = '/payments?locked=true';
                }
                
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;