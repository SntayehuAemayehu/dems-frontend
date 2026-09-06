// src/components/Gamification/Leaderboard.jsx
// COMPLETE FUNCTIONAL - With proper department filtering

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, RefreshCw, Crown, Users, Filter, Search } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPoints: 0,
    topScore: 0
  });

  useEffect(() => {
    fetchLeaderboard();
    fetchDepartments();
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    filterLeaderboard();
  }, [filter, leaderboard, searchTerm]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/auth/departments/');
      let depts = [];
      if (response.data && response.data.results) {
        depts = response.data.results;
      } else if (Array.isArray(response.data)) {
        depts = response.data;
      }
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      // Fallback departments
      setDepartments([
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Software Engineering' },
        { id: 3, name: 'Information Systems' },
        { id: 4, name: 'Data Science' },
        { id: 5, name: 'Cyber Security' },
      ]);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Fetch leaderboard data
      const response = await api.get('/analytics/gamification/leaderboard/');
      console.log('🏆 Leaderboard data:', response.data);
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.results) {
        data = response.data.results;
      }
      
      setLeaderboard(data);
      filterLeaderboard(data);
      calculateStats(data);
      
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
      
      // ✅ FALLBACK: Load sample data for testing
      loadSampleData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = [
      {
        rank: 1,
        student_id: 1,
        name: 'MAMARU',
        student_number: 'MAU2222',
        department: 'Computer Science',
        points: 2800,
        level: 'Expert',
        cgpa: 3.8
      },
      {
        rank: 2,
        student_id: 2,
        name: 'MEKDES CS',
        student_number: 'MAU20263434',
        department: 'Computer Science',
        points: 2700,
        level: 'Expert',
        cgpa: 3.7
      },
      {
        rank: 3,
        student_id: 3,
        name: 'MELESE COMDILTER',
        student_number: 'MAU20264567',
        department: 'Computer Science',
        points: 2400,
        level: 'Scholar',
        cgpa: 3.5
      },
      {
        rank: 4,
        student_id: 4,
        name: 'Abebe Kebede',
        student_number: 'STU20240001',
        department: 'Software Engineering',
        points: 2100,
        level: 'Scholar',
        cgpa: 3.4
      },
      {
        rank: 5,
        student_id: 5,
        name: 'Betelehem Tesfaye',
        student_number: 'STU20240002',
        department: 'Information Systems',
        points: 1800,
        level: 'Dedicated',
        cgpa: 3.2
      },
      {
        rank: 6,
        student_id: 6,
        name: 'Chala Desta',
        student_number: 'STU20240003',
        department: 'Software Engineering',
        points: 1500,
        level: 'Active',
        cgpa: 3.0
      },
    ];
    setLeaderboard(sampleData);
    filterLeaderboard(sampleData);
    calculateStats(sampleData);
    toast.info('📊 Sample data loaded for testing');
  };

  const filterLeaderboard = (data = leaderboard) => {
    let filtered = [...data];
    
    // Filter by department
    if (filter !== 'all') {
      filtered = filtered.filter(student => 
        student.department && 
        student.department.toLowerCase() === filter.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(term) ||
        student.student_number?.toLowerCase().includes(term) ||
        student.department?.toLowerCase().includes(term)
      );
    }
    
    // Sort by points (descending)
    filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Reassign ranks
    filtered.forEach((student, index) => {
      student.rank = index + 1;
    });
    
    setFilteredLeaderboard(filtered);
  };

  const calculateStats = (data) => {
    const totalStudents = data.length;
    const totalPoints = data.reduce((sum, s) => sum + (s.points || 0), 0);
    const topScore = data.length > 0 ? Math.max(...data.map(s => s.points || 0)) : 0;
    
    setStats({ totalStudents, totalPoints, topScore });
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={32} color="#fbbf24" />;
    if (rank === 2) return <Medal size={28} color="#94a3b8" />;
    if (rank === 3) return <Medal size={28} color="#d97706" />;
    return <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}>{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) {
      return { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white' };
    }
    if (rank === 2) {
      return { background: 'linear-gradient(135deg, #94a3b8, #64748b)', color: 'white' };
    }
    if (rank === 3) {
      return { background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white' };
    }
    return { background: '#f8fafc', color: '#64748b' };
  };

  const getLevelBadgeColor = (level) => {
    const colors = {
      'Master': { bg: '#fef3c7', color: '#d97706' },
      'Expert': { bg: '#dbeafe', color: '#1e40af' },
      'Scholar': { bg: '#ede9fe', color: '#7c3aed' },
      'Dedicated': { bg: '#dcfce7', color: '#16a34a' },
      'Active': { bg: '#fce7f3', color: '#db2777' },
      'Beginner': { bg: '#f3f4f6', color: '#6b7280' },
    };
    return colors[level] || colors['Beginner'];
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
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
          borderTopColor: '#f59e0b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading leaderboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .spinning { animation: spin 1s linear infinite; }
        .leaderboard-item {
          transition: all 0.3s ease;
          cursor: default;
        }
        .leaderboard-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .leaderboard-item.top-1 {
          border-left: 4px solid #fbbf24;
        }
        .leaderboard-item.top-2 {
          border-left: 4px solid #94a3b8;
        }
        .leaderboard-item.top-3 {
          border-left: 4px solid #d97706;
        }
        .rank-circle {
          transition: all 0.3s ease;
        }
        .leaderboard-item:hover .rank-circle {
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .student-details { display: none; }
          .level-badge { display: none; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .filter-bar { flex-direction: column !important; }
          .filter-bar > * { width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        color: 'white',
        padding: '28px 32px',
        borderRadius: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trophy size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                Student Leaderboard
              </h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                Top performers in DEMS
                {filter !== 'all' && (
                  <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 12px', borderRadius: '12px' }}>
                    {filter}
                  </span>
                )}
                {searchTerm && (
                  <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 12px', borderRadius: '12px' }}>
                    🔍 {searchTerm}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              opacity: refreshing ? 0.6 : 1,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
          <Users size={24} color="#3b82f6" style={{ margin: '0 auto 4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            {filteredLeaderboard.length}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {filter !== 'all' ? `Students in ${filter}` : 'Total Students'}
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
          <Star size={24} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            {filteredLeaderboard.reduce((sum, s) => sum + (s.points || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Total Points</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderLeft: '4px solid #22c55e',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
          <TrendingUp size={24} color="#22c55e" style={{ margin: '0 auto 4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            {filteredLeaderboard.length > 0 ? filteredLeaderboard[0]?.points || 0 : 0}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Top Score</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#64748b" />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Department:</span>
        </div>
        <select
          value={filter}
          onChange={handleFilterChange}
          style={{
            padding: '8px 14px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            minWidth: '180px',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <option value="all">🏛️ All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {(filter !== 'all' || searchTerm) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            ✕ Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>
          {filteredLeaderboard.length} student{filteredLeaderboard.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Leaderboard List */}
      {filteredLeaderboard.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <Trophy size={64} color="#94a3b8" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            No students found
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {filter !== 'all' 
              ? `No students in the ${filter} department yet.`
              : 'No students on the leaderboard yet.'}
          </p>
          {(filter !== 'all' || searchTerm) && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: '16px',
                padding: '8px 24px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {filteredLeaderboard.map((student) => {
            const rankStyle = getRankColor(student.rank);
            const levelStyle = getLevelBadgeColor(student.level);
            const isTop3 = student.rank <= 3;
            
            return (
              <div
                key={student.student_id || student.id || Math.random()}
                className={`leaderboard-item ${isTop3 ? `top-${student.rank}` : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  background: isTop3 ? '#fffbeb' : 'white',
                  borderLeft: isTop3 ? `4px solid ${student.rank === 1 ? '#fbbf24' : student.rank === 2 ? '#94a3b8' : '#d97706'}` : '1px solid #e2e8f0',
                }}
              >
                {/* Rank Circle */}
                <div
                  className="rank-circle"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '16px',
                    background: rankStyle.background,
                    color: rankStyle.color,
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  {getRankIcon(student.rank)}
                </div>

                {/* Student Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#0f172a',
                      fontSize: '16px',
                    }}>
                      {student.name || 'Unknown Student'}
                    </span>
                    <span className="level-badge" style={{
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: levelStyle.bg,
                      color: levelStyle.color,
                    }}>
                      {student.level || 'Beginner'}
                    </span>
                    {student.cgpa && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: '#f1f5f9',
                        color: '#475569',
                      }}>
                        CGPA: {student.cgpa.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="student-details" style={{
                    color: '#64748b',
                    fontSize: '13px',
                    marginTop: '2px',
                  }}>
                    {student.student_number} • {student.department || 'No Department'}
                  </div>
                </div>

                {/* Points */}
                <div style={{
                  marginLeft: 'auto',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                  }}>
                    {student.points ? student.points.toLocaleString() : 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Points</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span>
          Showing {filteredLeaderboard.length} of {leaderboard.length} students
          {filter !== 'all' && ` in ${filter}`}
        </span>
        <span>
          🏆 Top 3: {filteredLeaderboard.slice(0, 3).map(s => s.name).join(', ')}
        </span>
      </div>
    </div>
  );
};

export default Leaderboard;