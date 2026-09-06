// frontend/src/pages/Student/AssignmentResults.jsx
// COMPLETE - Student view assignment results

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, XCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const AssignmentResults = () => {
  const { user } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignmentResults();
  }, []);

  const fetchAssignmentResults = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Fetch all assignments with grades
      const response = await api.get('/courses/student/assignments/results/');
      console.log('📊 Assignment Results:', response.data);
      
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch assignment results:', error);
      toast.error('Failed to load assignment results');
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (assignment.marks_obtained !== null && assignment.marks_obtained !== undefined) {
      const percentage = (assignment.marks_obtained / assignment.total_marks) * 100;
      if (percentage >= 70) {
        return <span className="status-badge approved">✅ Passed</span>;
      } else if (percentage >= 50) {
        return <span className="status-badge pending">📊 Satisfactory</span>;
      } else {
        return <span className="status-badge rejected">⚠️ Needs Improvement</span>;
      }
    } else if (assignment.submitted_at) {
      return <span className="status-badge pending">⏳ Pending Grade</span>;
    } else {
      return <span className="status-badge inactive">📋 Not Submitted</span>;
    }
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
        <p style={{ color: '#64748b' }}>Loading assignment results...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .status-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.approved { background: #dcfce7; color: #16a34a; }
        .status-badge.pending { background: #fef3c7; color: #d97706; }
        .status-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .status-badge.rejected { background: #fee2e2; color: #dc2626; }
        @media (max-width: 768px) {
          .results-table { overflow-x: auto; }
          .results-table th, .results-table td { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>

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
            <ClipboardList size={28} color="#3b82f6" />
            Assignment Results
          </h1>
          <p style={{
            color: '#64748b',
            margin: '4px 0 0 0',
          }}>
            View your assignment grades and feedback
          </p>
        </div>
        <button
          onClick={fetchAssignmentResults}
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
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {assignments.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <FileText size={64} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>
            No assignment results yet
          </h3>
          <p style={{ color: '#64748b' }}>
            Complete assignments to see your grades here.
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
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div className="results-table" style={{ overflowX: 'auto' }}>
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
                    letterSpacing: '0.5px',
                  }}>Assignment</th>
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
                  }}>Marks</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Submitted</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#0f172a',
                    }}>
                      {assignment.title || 'Unknown'}
                    </td>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#475569',
                    }}>
                      {assignment.course_title || '—'}
                    </td>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}>
                      {assignment.marks_obtained !== null && assignment.marks_obtained !== undefined ? (
                        <>
                          {assignment.marks_obtained} / {assignment.total_marks}
                          <span style={{
                            display: 'block',
                            fontSize: '11px',
                            color: (assignment.marks_obtained / assignment.total_marks) * 100 >= 70 ? '#22c55e' : '#f59e0b',
                          }}>
                            {Math.round((assignment.marks_obtained / assignment.total_marks) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Not graded</span>
                      )}
                    </td>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}>
                      {getStatusBadge(assignment)}
                    </td>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#64748b',
                    }}>
                      {assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      maxWidth: '200px',
                    }}>
                      {assignment.feedback ? (
                        <span style={{
                          fontSize: '13px',
                          color: '#2563eb',
                          display: 'block',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {assignment.feedback}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>No feedback</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Stats Footer */}
          <div style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span>Showing {assignments.length} assignments</span>
            <span>
              Graded: {assignments.filter(a => a.marks_obtained !== null && a.marks_obtained !== undefined).length} | 
              Pending: {assignments.filter(a => a.marks_obtained === null || a.marks_obtained === undefined).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentResults;