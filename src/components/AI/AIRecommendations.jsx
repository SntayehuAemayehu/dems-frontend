// frontend/src/components/AI/AIRecommendations.jsx
// COMPLETE AI RECOMMENDATIONS COMPONENT

import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../services/aiService';

const AIRecommendations = () => {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const result = await aiService.getRecommendations();
            setRecommendations(result);
        } catch (error) {
            setError('Failed to load recommendations');
            toast.error('Failed to load AI recommendations');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                padding: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }} />
                <p style={{ color: '#64748b', marginTop: '12px' }}>
                    AI is analyzing your learning patterns...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#dc2626'
            }}>
                <p>{error}</p>
                <button
                    onClick={fetchRecommendations}
                    style={{
                        marginTop: '12px',
                        padding: '8px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    const hybridRecs = recommendations?.recommendations?.hybrid || [];

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <Sparkles size={24} color="#8b5cf6" />
                <div>
                    <h3 style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        AI Course Recommendations
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                        Personalized based on your learning patterns
                    </p>
                </div>
            </div>

            {hybridRecs.length === 0 ? (
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: '#94a3b8'
                }}>
                    <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No recommendations available yet</p>
                    <p style={{ fontSize: '14px' }}>Complete more courses to get better recommendations</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '16px'
                }}>
                    {hybridRecs.map((rec, index) => (
                        <div key={index} style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}>
                                <span style={{
                                    fontSize: '12px',
                                    background: '#f5f3ff',
                                    color: '#7c3aed',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                }}>
                                    #{index + 1}
                                </span>
                                <span style={{
                                    fontSize: '12px',
                                    color: '#8b5cf6'
                                }}>
                                    {Math.round(rec.score * 100)}% match
                                </span>
                            </div>
                            
                            <h4 style={{
                                fontWeight: 600,
                                color: '#0f172a',
                                margin: '8px 0 4px 0'
                            }}>
                                {rec.course_title || `Course ${rec.course_id}`}
                            </h4>
                            
                            <p style={{
                                fontSize: '13px',
                                color: '#64748b',
                                margin: '0 0 8px 0'
                            }}>
                                {rec.course_code}
                            </p>
                            
                            {rec.reason && (
                                <p style={{
                                    fontSize: '12px',
                                    color: '#8b5cf6',
                                    margin: '8px 0 0 0',
                                    background: '#f5f3ff',
                                    padding: '6px 10px',
                                    borderRadius: '6px'
                                }}>
                                    {rec.reason}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;