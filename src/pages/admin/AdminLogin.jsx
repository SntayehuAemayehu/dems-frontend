// frontend/src/pages/admin/AdminLogin.jsx
// COMPLETE FIXED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const hasRedirected = useRef(false);

    // ✅ FIXED: Only redirect if a valid ADMIN token exists
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (token && role === 'ADMIN' && !hasRedirected.current) {
            hasRedirected.current = true;
            navigate('/admin/dashboard', { replace: true });
        }
        // ✅ Do NOT auto-redirect non-admins — let them log in
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/admin-login/', formData);
            const { access, refresh, user } = response.data;

            // ✅ Verify the returned user is actually an admin
            if (user.role !== 'ADMIN') {
                toast.error('❌ Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('user_role', user.role);

            toast.success('✅ Admin login successful!');
            hasRedirected.current = true;

            // Full page reload to clear stale Redux state
            window.location.href = '/admin/dashboard';

        } catch (error) {
            console.error('Admin login error:', error);

            if (error.response?.status === 403) {
                toast.error('❌ Access denied. Admin credentials required.');
            } else if (error.response?.status === 401) {
                toast.error('❌ Invalid email or password.');
            } else {
                toast.error(error.response?.data?.error || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    // If already logged in as admin, show a small "redirecting" screen
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (token && role === 'ADMIN') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
                <div style={{ color: 'white', textAlign: 'center' }}>
                    <Shield size={48} style={{ margin: '0 auto 16px', color: '#3b82f6' }} />
                    <p>Already logged in as Admin. Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <Link to="/" style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#64748b', textDecoration: 'none', fontSize: '13px', marginBottom: '24px',
                }}>
                    <ArrowLeft size={16} />
                    Back to Main Site
                </Link>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', color: 'white',
                    }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                        Admin Portal
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                        Restricted administrator access
                    </p>
                    <div style={{
                        marginTop: '8px', display: 'inline-block', padding: '4px 12px',
                        background: '#fef2f2', borderRadius: '12px',
                        fontSize: '11px', color: '#dc2626', fontWeight: 500,
                    }}>
                        ⚠️ Authorized Personnel Only
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                            Admin Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{
                                position: 'absolute', left: '12px', top: '50%',
                                transform: 'translateY(-50%)', color: '#94a3b8',
                            }} size={20} />
                            <input
                                type="email" name="email" value={formData.email}
                                onChange={handleChange} placeholder="admin@dems.com"
                                style={{
                                    width: '100%', padding: '12px 12px 12px 44px',
                                    border: '2px solid #e2e8f0', borderRadius: '8px',
                                    fontSize: '16px', background: 'white',
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{
                                position: 'absolute', left: '12px', top: '50%',
                                transform: 'translateY(-50%)', color: '#94a3b8',
                            }} size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password" value={formData.password}
                                onChange={handleChange} placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '12px 12px 12px 44px',
                                    border: '2px solid #e2e8f0', borderRadius: '8px',
                                    fontSize: '16px', background: 'white',
                                }}
                                required
                            />
                            <button
                                type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        padding: '14px',
                        background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '16px', fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>
                        <Shield size={18} />
                        {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
                    </button>
                </form>

                <div style={{
                    marginTop: '24px', paddingTop: '20px',
                    borderTop: '1px solid #e2e8f0', textAlign: 'center',
                }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                        ⚠️ This portal is restricted to authorized administrators only.
                        <br />
                        All login attempts are logged and monitored.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;