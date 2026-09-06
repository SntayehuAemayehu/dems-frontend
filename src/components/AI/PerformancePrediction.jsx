// src/components/AI/PerformancePrediction.jsx
// COMPLETE PERFORMANCE PREDICTION COMPONENT

import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const PerformancePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // ✅ CALL BACKEND API
      const response = await api.get('/analytics/predict/student-success/');
      setPrediction(response.data);
      console.log('📈 Prediction:', response.data);
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
      toast.error('Failed to load prediction');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        color: 'white',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto',
        }} />
        <p style={{ marginTop: '16px' }}>Predicting your success...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!prediction) {
    return <div>No prediction available</div>;
  }

  const riskLevel = prediction.risk_level;
  const riskColors = {
    LOW: { bg: '#dcfce7', color: '#16a34a', icon: '✅' },
    MEDIUM: { bg: '#fef3c7', color: '#d97706', icon: '⚠️' },
    HIGH: { bg: '#fee2e2', color: '#dc2626', icon: '🚨' },
    CRITICAL: { bg: '#fee2e2', color: '#991b1b', icon: '🔴' },
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .prediction-header {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="prediction-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={40} />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Success Prediction</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>AI-powered analysis of your academic trajectory</p>
            </div>
          </div>
          <button
            onClick={fetchPrediction}
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

      {/* Risk Level */}
      <div style={{
        background: riskColors[riskLevel]?.bg || '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {riskColors[riskLevel]?.icon || '📊'}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: riskColors[riskLevel]?.color || '#0f172a' }}>
          {riskLevel} Risk Level
        </div>
        <div style={{ fontSize: '14px', color: riskColors[riskLevel]?.color || '#64748b', marginTop: '4px' }}>
          Success Probability: {prediction.success_probability}%
        </div>
      </div>

      {/* Predicted CGPA */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
          Predicted CGPA
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'conic-gradient(#3b82f6 0%, #3b82f6 70%, #e2e8f0 70%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>
                {prediction.predicted_cgpa}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>CGPA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {prediction.recommendations?.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>
            <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', color: '#22c55e' }} />
            Recommendations
          </h3>
          {prediction.recommendations.map((rec, index) => (
            <div key={index} style={{
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#0f172a',
            }}>
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformancePrediction;