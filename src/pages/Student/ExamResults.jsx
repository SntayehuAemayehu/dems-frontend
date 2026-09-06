// frontend/src/pages/Student/ExamResults.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Award, TrendingUp, CheckCircle, XCircle, RefreshCw, FileText, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchResults } from '../../store/slices/examSlice';
import api from '../../api/api';
import { Link } from 'react-router-dom';
const ExamResults = () => {
  const dispatch = useDispatch();
  const { results = [], isLoading = false } = useSelector((state) => state.exams || { results: [], isLoading: false });
  const { user } = useSelector((state) => state.auth || {});
  const [localResults, setLocalResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    setRefreshing(true);
    setError(null);
    try {
      console.log('📊 Fetching exam results for student...');
      
      // Try Redux first
      const result = await dispatch(fetchResults()).unwrap();
      console.log('📊 Redux results:', result);
      
      if (Array.isArray(result) && result.length > 0) {
        setLocalResults(result);
        toast.success(`Loaded ${result.length} exam results`);
      } else {
        // Try direct API call
        console.log('📊 No results from Redux, trying direct API...');
        try {
          const response = await api.get('/exams/results/');
          console.log('📊 Direct API results:', response.data);
          
          let data = response.data;
          if (data && data.results && Array.isArray(data.results)) {
            data = data.results;
          } else if (!Array.isArray(data)) {
            data = [];
          }
          
          if (data.length > 0) {
            setLocalResults(data);
            toast.success(`Loaded ${data.length} exam results`);
          } else {
            setLocalResults([]);
            toast.info('No exam results found');
          }
        } catch (apiError) {
          console.error('Direct API call failed:', apiError);
          setError('Failed to load results from server');
          setLocalResults([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setError(error?.message || 'Failed to load exam results');
      setLocalResults([]);
      toast.error('Failed to load exam results');
    } finally {
      setRefreshing(false);
    }
  };

  // Use localResults if available, otherwise use results from Redux
  const displayResults = localResults.length > 0 ? localResults : (Array.isArray(results) ? results : []);

  const calculateAverageScore = () => {
    if (!displayResults.length) return 0;
    const total = displayResults.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
    return (total / displayResults.length).toFixed(2);
  };

  const getPassCount = () => {
    return displayResults.filter(r => r.passed === true).length || 0;
  };

  const getStatusBadge = (passed) => {
    if (passed) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#dcfce7',
          color: '#16a34a',
        }}>
          <CheckCircle size={14} />
          Passed
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#fee2e2',
          color: '#dc2626',
        }}>
          <XCircle size={14} />
          Failed
        </span>
      );
    }
  };

  if (isLoading || refreshing) {
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
        <p style={{ color: '#64748b' }}>Loading your exam results...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        <div style={{
          background: '#fef2f2',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          border: '1px solid #fecaca',
        }}>
          <AlertCircle size={48} style={{ color: '#dc2626', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
            Error Loading Results
          </h3>
          <p style={{ color: '#64748b' }}>{error}</p>
          <button
            onClick={fetchAllResults}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            <RefreshCw size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .results-summary {
            grid-template-columns: 1fr !important;
          }
          .results-table-wrapper {
            overflow-x: auto;
          }
          .results-table th, .results-table td {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
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
          }}>Exam Results</h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            {displayResults.length > 0 
              ? `Showing ${displayResults.length} exam result${displayResults.length > 1 ? 's' : ''}`
              : 'Complete exams to see your results here'}
          </p>
        </div>
        <button
          onClick={fetchAllResults}
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
            transition: 'all 0.3s ease',
            opacity: refreshing ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!refreshing) e.currentTarget.style.background = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            if (!refreshing) e.currentTarget.style.background = '#f1f5f9';
          }}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards - Only show if there are results */}
      {displayResults.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }} className="results-summary">
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  margin: 0,
                }}>Average Score</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  margin: '4px 0 0 0',
                }}>{calculateAverageScore()}%</p>
              </div>
              <TrendingUp size={40} style={{ opacity: 0.5 }} />
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  margin: 0,
                }}>Exams Passed</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  margin: '4px 0 0 0',
                }}>{getPassCount()} / {displayResults.length}</p>
              </div>
              <Award size={40} style={{ opacity: 0.5 }} />
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  margin: 0,
                }}>Total Exams</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  margin: '4px 0 0 0',
                }}>{displayResults.length}</p>
              </div>
              <FileText size={40} style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {displayResults.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <Award size={64} style={{
            color: '#94a3b8',
            marginBottom: '16px',
          }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}>No results available</h3>
          <p style={{
            color: '#64748b',
            margin: 0,
          }}>Complete exams to see your results here.</p>
          <div style={{ marginTop: '16px' }}>
            <Link
              to="/exams"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              Go to Exams
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }} className="results-table-wrapper">
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }} className="results-table">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Exam Title</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Course</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Score</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Percentage</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayResults.map((result, index) => (
                  <tr 
                    key={result.id || index} 
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#0f172a',
                    }}>
                      {result.exam_title || result.exam?.title || 'Unknown Exam'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#475569',
                    }}>
                      {result.exam?.course_title || result.course_title || result.exam?.course?.title || '—'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}>
                      {result.score || 0} / {result.exam?.total_marks || result.total_marks || 0}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}>
                      {result.percentage || 0}%
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      {getStatusBadge(result.passed)}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#64748b',
                    }}>
                      {result.created_at ? new Date(result.created_at).toLocaleDateString() : 
                       result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : 
                       '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Results count footer */}
          <div style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#64748b',
          }}>
            <span>Showing {displayResults.length} result{displayResults.length > 1 ? 's' : ''}</span>
            <span>
              Passed: {getPassCount()} | Failed: {displayResults.length - getPassCount()}
            </span>
          </div>
        </div>
      )}
      
      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ExamResults;