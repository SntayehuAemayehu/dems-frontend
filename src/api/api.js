// frontend/src/api/api.js
// COMPLETE WITH GLOBAL ACCESS LOCK INTERCEPTOR

import axios from 'axios';
import toast from 'react-hot-toast';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getWebSocketUrl = (path, params = {}) => {
    // 1. Use the API_BASE_URL (your backend URL)
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    
    // 2. Force WSS (Secure WebSocket) for HTTPS
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // 3. Set the path correctly
    apiUrl.pathname = path.startsWith('/') ? path : `/${path}`;
    apiUrl.search = '';

    // 4. Append tokens/params
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            apiUrl.searchParams.set(key, value);
        }
    });

    return apiUrl.href;
};

export const getAllPages = async (url) => {
    const apiBaseUrl = new URL(API_BASE_URL, window.location.origin);
    const apiOrigin = apiBaseUrl.origin;
    const apiBasePath = apiBaseUrl.pathname.replace(/\/+$/, '');
    const apiBaseDirectory = `${apiOrigin}${apiBasePath}/`;
    const results = [];
    const visitedUrls = new Set();
    let nextUrl = url;

    while (nextUrl) {
        const isAbsoluteUrl = /^[a-z][a-z\d+.-]*:/i.test(nextUrl) || nextUrl.startsWith('//');
        let requestUrl;

        if (isAbsoluteUrl) {
            requestUrl = new URL(nextUrl, apiBaseUrl);
        } else {
            const endpoint = nextUrl.replace(/^\/+/, '');
            const apiPathWithoutLeadingSlash = apiBasePath.replace(/^\/+/, '');
            const relativeEndpoint = apiPathWithoutLeadingSlash &&
                endpoint.startsWith(`${apiPathWithoutLeadingSlash}/`)
                ? endpoint.slice(apiPathWithoutLeadingSlash.length + 1)
                : endpoint;
            requestUrl = new URL(relativeEndpoint, apiBaseDirectory);
        }

        if (requestUrl.origin !== apiOrigin) {
            throw new Error('The API returned a pagination URL on another host.');
        }
        if (visitedUrls.has(requestUrl.href)) {
            throw new Error('The API returned a pagination loop.');
        }
        visitedUrls.add(requestUrl.href);

        const response = await api.get(requestUrl.href);
        const data = response.data;

        if (Array.isArray(data)) {
            results.push(...data);
            break;
        }
        if (!Array.isArray(data?.results)) {
            throw new Error('The API returned an invalid list response.');
        }

        results.push(...data.results);
        nextUrl = data.next;
    }

    return results;
};

export const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return '';

    try {
        // Force the base to be the backend API URL
        const apiUrl = new URL(API_BASE_URL);
        const backendOrigin = apiUrl.origin; // e.g., https://dems-backend.onrender.com
        
        // If the path already has http, return it
        if (mediaPath.startsWith('http')) return mediaPath;
        
        // Ensure we construct the absolute URL correctly
        return new URL(mediaPath, `${backendOrigin}/`).href;
    } catch {
        return mediaPath;
    }
};

// ============================================================
// SAFE EXAM BROWSER — download .seb file
export const downloadSEBConfig = (examId) => {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    const downloadUrl = `${apiUrl.origin}/api/exams/${examId}/seb-config/`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    // ✅ REMOVED the 'download' attribute. The backend's 'Content-Disposition: attachment' header will force the download.
    link.target = '_blank'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return `exam_${examId}.seb`;
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