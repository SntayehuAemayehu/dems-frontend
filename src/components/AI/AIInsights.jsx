// src/components/AI/AIInsights.jsx
// COMPLETE AI INSIGHTS COMPONENT

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, BookOpen, Award, 
  AlertTriangle, Target, Clock, CheckCircle, 
  RefreshCw, Brain, Zap
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // ✅ CALL BACKEND API
      const response = await api.get('/analytics/ai/student-insights/');
      setInsights(response.data);
      console.log('📊 AI Insights:', response.data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-card" style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '16px', fontSize: '16px' }}>AI is analyzing your learning...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!insights) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <Sparkles size={48} color="#8b5cf6" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ color: '#0f172a' }}>AI Insights Coming Soon</h3>
        <p style={{ color: '#64748b' }}>Complete more courses to get personalized AI recommendations.</p>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      <style>{`
        .ai-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .ai-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .ai-card-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
        }
        .gradient-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .stat-item {
          text-align: center;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
        .strength-item, .weakness-item, .recommendation-item {
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .strength-item { background: #f0fdf4; border-left: 3px solid #22c55e; }
        .weakness-item { background: #fef2f2; border-left: 3px solid #ef4444; }
        .recommendation-item { background: #eff6ff; border-left: 3px solid #3b82f6; }
        .action-item {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
          background: white;
        }
        .priority-high { border-left: 3px solid #ef4444; }
        .priority-medium { border-left: 3px solid #f59e0b; }
        .priority-low { border-left: 3px solid #22c55e; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="gradient-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={32} />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>AI Learning Insights</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Personalized for {insights.student_name}</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="ai-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{insights.cgpa}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>CGPA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{insights.completed_courses}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{insights.active_courses}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{insights.total_courses}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Learning Patterns */}
      <div className="ai-card">
        <div className="ai-card-header">
          <Clock size={20} color="#3b82f6" />
          <h3>Learning Patterns</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Best Performance Time</p>
            <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>
              {insights.learning_patterns?.best_performance_time?.best_time || 'N/A'}
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Consistency</p>
            <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>
              {insights.learning_patterns?.consistency_score?.description || 'N/A'}
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Completion Speed</p>
            <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>
              {insights.learning_patterns?.average_completion_time?.description || 'N/A'}
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Preferred Difficulty</p>
            <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>
              {insights.learning_patterns?.preferred_difficulty?.preferred_difficulty || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {insights.strengths && insights.strengths.length > 0 && (
        <div className="ai-card">
          <div className="ai-card-header">
            <Award size={20} color="#22c55e" />
            <h3>Your Strengths</h3>
          </div>
          {insights.strengths.map((strength, index) => (
            <div key={index} className="strength-item">
              <CheckCircle size={16} color="#22c55e" />
              <div style={{ flex: 1 }}>
                <strong>{strength.code}</strong> - {strength.course}
              </div>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
                {strength.grade} ({strength.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Weaknesses */}
      {insights.weaknesses && insights.weaknesses.length > 0 && (
        <div className="ai-card">
          <div className="ai-card-header">
            <AlertTriangle size={20} color="#ef4444" />
            <h3>Areas for Improvement</h3>
          </div>
          {insights.weaknesses.map((weakness, index) => (
            <div key={index} className="weakness-item">
              <AlertTriangle size={16} color="#ef4444" />
              <div style={{ flex: 1 }}>
                <strong>{weakness.code}</strong> - {weakness.course}
              </div>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                {weakness.grade} ({weakness.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="ai-card">
          <div className="ai-card-header">
            <Target size={20} color="#8b5cf6" />
            <h3>AI Recommendations</h3>
          </div>
          {insights.recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-item">
              <Sparkles size={16} color="#8b5cf6" />
              <span>{recommendation}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next Best Actions */}
      {insights.next_best_actions && insights.next_best_actions.length > 0 && (
        <div className="ai-card">
          <div className="ai-card-header">
            <Zap size={20} color="#f59e0b" />
            <h3>Next Best Actions</h3>
          </div>
          {insights.next_best_actions.map((action, index) => (
            <div key={index} className={`action-item priority-${action.priority}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#0f172a' }}>{action.title}</strong>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: action.priority === 'high' ? '#fee2e2' : action.priority === 'medium' ? '#fef3c7' : '#dcfce7',
                  color: action.priority === 'high' ? '#ef4444' : action.priority === 'medium' ? '#f59e0b' : '#22c55e',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {action.priority}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{action.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsights;