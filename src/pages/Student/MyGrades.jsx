// src/pages/Student/MyGrades.jsx
// COMPLETE STUDENT GRADES PAGE

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
    Award, TrendingUp, BookOpen, Calendar, 
    RefreshCw, ChevronRight, FileText, 
    CheckCircle, XCircle, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GradeBadge from '../../components/Grade/GradeBadge';

const MyGrades = () => {
    const { user } = useSelector((state) => state.auth || {});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [grades, setGrades] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            setRefreshing(true);
            
            const response = await api.get('/courses/my-grades/');
            console.log('📊 My Grades:', response.data);
            setGrades(response.data);
            
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            toast.error('Failed to load grades');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'COMPLETED') return <CheckCircle size={16} color="#22c55e" />;
        if (status === 'ACTIVE') return <Clock size={16} color="#3b82f6" />;
        return <Clock size={16} color="#6b7280" />;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
                <p style={{ color: '#64748b' }}>Loading your grades...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!grades || !grades.courses || grades.courses.length === 0) {
        return (
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                }}>
                    <Award size={64} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>
                        No grades available yet
                    </h3>
                    <p style={{ color: '#64748b' }}>
                        Complete your courses to see your grades here.
                    </p>
                    <Link
                        to="/courses"
                        style={{
                            display: 'inline-block',
                            marginTop: '16px',
                            padding: '10px 24px',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                        }}
                    >
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    const completedCourses = grades.courses.filter(c => c.status === 'COMPLETED');
    const activeCourses = grades.courses.filter(c => c.status === 'ACTIVE');

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .grades-grid { grid-template-columns: 1fr !important; }
                    .grades-table { overflow-x: auto; }
                }
            `}</style>

            {/* Header */}
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <Award size={28} color="#8b5cf6" />
                        My Grades
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                        {grades.student_name} • {grades.department} • CGPA: {grades.cgpa || 'N/A'}
                    </p>
                </div>
                <button
                    onClick={fetchGrades}
                    disabled={refreshing}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#475569',
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        opacity: refreshing ? 0.6 : 1,
                    }}
                >
                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
            }} className="grades-grid">
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #8b5cf6',
                }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>CGPA</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>
                        {grades.cgpa || '0.00'}
                    </p>
                </div>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #3b82f6',
                }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Courses</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>
                        {grades.courses.length}
                    </p>
                </div>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #22c55e',
                }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Completed</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e', margin: '4px 0 0 0' }}>
                        {completedCourses.length}
                    </p>
                </div>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #f59e0b',
                }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>In Progress</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', margin: '4px 0 0 0' }}>
                        {activeCourses.length}
                    </p>
                </div>
            </div>

            {/* Courses Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                overflow: 'hidden',
            }}>
                <div className="grades-table" style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                    }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Course</th>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Credit Hours</th>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Marks</th>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Percentage</th>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Grade</th>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.courses.map((course) => (
                                <tr key={course.course_id} style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <Link to={`/courses/${course.course_id}`} style={{
                                            textDecoration: 'none',
                                            color: '#0f172a',
                                        }}>
                                            <div style={{ fontWeight: 500 }}>{course.course_title}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{course.course_code}</div>
                                        </Link>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                                        {course.credit_hours}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#0f172a' }}>
                                        {course.total_marks_obtained.toFixed(1)} / {course.total_marks_possible.toFixed(1)}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                                        {course.percentage.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <GradeBadge 
                                            grade={course.grade_letter} 
                                            percentage={course.percentage}
                                            size="md"
                                        />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            background: course.status === 'COMPLETED' ? '#dcfce7' : 
                                                      course.status === 'ACTIVE' ? '#dbeafe' : '#f3f4f6',
                                            color: course.status === 'COMPLETED' ? '#16a34a' : 
                                                   course.status === 'ACTIVE' ? '#2563eb' : '#6b7280',
                                        }}>
                                            {getStatusIcon(course.status)}
                                            {course.status || 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyGrades;