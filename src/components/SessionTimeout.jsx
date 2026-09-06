// frontend/src/components/SessionTimeout.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/slices/authSlice';

const SessionTimeout = ({ children }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Set timeout for 30 minutes (or your configured time)
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        
        const resetTimer = () => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                // Session expired
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_role');
                
                toast.error('⏰ Session expired. Please login again.');
                dispatch(logout());
                navigate('/login?session_expired=true');
            }, SESSION_TIMEOUT);
        };
        
        // Reset timer on user activity
        const handleActivity = () => {
            resetTimer();
        };
        
        // Start timer
        resetTimer();
        
        // Listen for user activity
        document.addEventListener('mousemove', handleActivity);
        document.addEventListener('keydown', handleActivity);
        document.addEventListener('click', handleActivity);
        document.addEventListener('scroll', handleActivity);
        
        return () => {
            clearTimeout(timeoutRef.current);
            document.removeEventListener('mousemove', handleActivity);
            document.removeEventListener('keydown', handleActivity);
            document.removeEventListener('click', handleActivity);
            document.removeEventListener('scroll', handleActivity);
        };
    }, [navigate, dispatch]);

    return children;
};

export default SessionTimeout;