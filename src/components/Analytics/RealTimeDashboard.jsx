// src/components/Analytics/RealTimeDashboard.jsx
// COMPLETE REAL-TIME ANALYTICS DASHBOARD

import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, FileText, DollarSign, TrendingUp,
  RefreshCw, Activity, AlertTriangle, CheckCircle,
  BarChart3, PieChart, LineChart
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const RealTimeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // ✅ CALL BACKEND API
      const response = await api.get('/analytics/realtime/dashboard/');
      setData(response.data);
      console.log('📊 Analytics:', response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto',
        }} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const { overview, user_analytics, course_analytics, exam_analytics, payment_analytics } = data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .stat-header h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .metric-item {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #0f172a;
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .metric-icon {
          margin-bottom: 8px;
        }
        .chart-container {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }
        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .score-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .bar-label {
          width: 80px;
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }
        .bar-track {
          flex: 1;
          height: 20px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .metric-grid { grid-template-columns: repeat(2, 1fr); }
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
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
            <BarChart3 size={28} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
            Real-Time Analytics Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Live system overview and insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview */}
      <div className="stat-card">
        <div className="stat-header">
          <Activity size={20} color="#3b82f6" />
          <h3>System Overview</h3>
        </div>
        <div className="metric-grid">
          <div className="metric-item">
            <Users size={24} color="#3b82f6" className="metric-icon" />
            <div className="metric-value">{overview.total_students}</div>
            <div className="metric-label">Students</div>
          </div>
          <div className="metric-item">
            <Users size={24} color="#8b5cf6" className="metric-icon" />
            <div className="metric-value">{overview.total_teachers}</div>
            <div className="metric-label">Teachers</div>
          </div>
          <div className="metric-item">
            <BookOpen size={24} color="#22c55e" className="metric-icon" />
            <div className="metric-value">{overview.total_courses}</div>
            <div className="metric-label">Courses</div>
          </div>
          <div className="metric-item">
            <FileText size={24} color="#f59e0b" className="metric-icon" />
            <div className="metric-value">{overview.submitted_exams}</div>
            <div className="metric-label">Exams Submitted</div>
          </div>
          <div className="metric-item">
            <DollarSign size={24} color="#10b981" className="metric-icon" />
            <div className="metric-value">{overview.pending_payments}</div>
            <div className="metric-label">Pending Payments</div>
          </div>
          <div className="metric-item">
            <CheckCircle size={24} color="#22c55e" className="metric-icon" />
            <div className="metric-value">{overview.verified_payments}</div>
            <div className="metric-label">Verified Payments</div>
          </div>
        </div>
      </div>

      {/* Exam Analytics */}
      <div className="stat-card">
        <div className="stat-header">
          <FileText size={20} color="#f59e0b" />
          <h3>Exam Performance</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Score Distribution */}
          <div>
            <h4 style={{ fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>Score Distribution</h4>
            {Object.entries(exam_analytics.score_distribution || {}).map(([range, count]) => {
              const max = Math.max(...Object.values(exam_analytics.score_distribution || {1: 1}));
              const percentage = (count / max) * 100;
              const color = parseInt(range) < 40 ? '#ef4444' : parseInt(range) < 70 ? '#f59e0b' : '#22c55e';
              return (
                <div key={range} className="score-bar">
                  <span className="bar-label">{range}%</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%`, background: color }}>
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Stats */}
          <div>
            <h4 style={{ fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>Key Metrics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Average Score</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                    {exam_analytics.average_score}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exam_analytics.average_score}%`, background: '#3b82f6' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Pass Rate</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>
                    {exam_analytics.pass_rate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exam_analytics.pass_rate}%`, background: '#22c55e' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Attendance Rate</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {exam_analytics.attendance_rate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exam_analytics.attendance_rate}%`, background: '#f59e0b' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Flagged Exams</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                    {exam_analytics.flagged_count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Analytics */}
      <div className="stat-card">
        <div className="stat-header">
          <BookOpen size={20} color="#22c55e" />
          <h3>Course Analytics</h3>
        </div>
        <div className="metric-grid">
          <div className="metric-item">
            <div className="metric-value">{course_analytics.total_active_courses}</div>
            <div className="metric-label">Active Courses</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{course_analytics.avg_enrollment_per_course}</div>
            <div className="metric-label">Avg Enrollment</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{overview.active_enrollments}</div>
            <div className="metric-label">Active Enrollments</div>
          </div>
        </div>
      </div>

      {/* Payment Analytics */}
      <div className="stat-card">
        <div className="stat-header">
          <DollarSign size={20} color="#10b981" />
          <h3>Payment Analytics</h3>
        </div>
        <div className="metric-grid">
          <div className="metric-item">
            <div className="metric-value">ETB {payment_analytics.total_revenue.toLocaleString()}</div>
            <div className="metric-label">Total Revenue</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">ETB {payment_analytics.revenue_this_month.toLocaleString()}</div>
            <div className="metric-label">Revenue This Month</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">ETB {payment_analytics.revenue_this_week.toLocaleString()}</div>
            <div className="metric-label">Revenue This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;