
// src/components/Gamification/GamificationProfile.jsx
// COMPLETE GAMIFICATION PROFILE COMPONENT

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, Zap, RefreshCw, Target } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const GamificationProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // ✅ CALL BACKEND API
      const response = await api.get('/analytics/gamification/profile/');
      setProfile(response.data);
      console.log('🏆 Gamification Profile:', response.data);
    } catch (error) {
      console.error('Failed to fetch gamification profile:', error);
      toast.error('Failed to load gamification profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        flexDirection: 'column',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#f59e0b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) {
    return <div>No profile available</div>;
  }

  const progressToNextLevel = profile.progress_to_next_level || 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        .profile-header {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }
        .profile-header h2 { margin: 0; font-size: 24px; }
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        .badge-item {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .badge-item.earned {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fffbeb, white);
        }
        .badge-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .badge-icon { font-size: 40px; margin-bottom: 8px; }
        .achievement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .progress-circle {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }
        .progress-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="profile-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={40} />
            <div>
              <h2>{profile.name}</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
                Rank #{profile.rank.rank} of {profile.rank.total_students}
              </p>
            </div>
          </div>
          <button
            onClick={fetchProfile}
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

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <Star size={32} color="#f59e0b" />
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '8px' }}>
            {profile.total_points.toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Total Points</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <Medal size={32} color="#3b82f6" />
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '8px' }}>
            #{profile.rank.rank}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Rank</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <Target size={32} color="#8b5cf6" />
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '8px' }}>
            Level {profile.level.level}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{profile.level.name}</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <Zap size={32} color="#22c55e" />
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '8px' }}>
            {profile.login_streak.current_streak} 🔥
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Login Streak</div>
        </div>
      </div>

      {/* Level Progress */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Progress to Level {profile.level.level + 1}</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '8px',
        }}>
          <span>{profile.total_points} points</span>
          <span>{profile.next_level_points} points needed</span>
        </div>
        <div style={{
          height: '12px',
          background: '#e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressToNextLevel}%`,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            borderRadius: '6px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: '#8b5cf6' }}>
          {progressToNextLevel}% Complete
        </div>
      </div>

      {/* Badges */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>
          <Award size={20} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
          Badges Earned
        </h3>
        <div className="badge-grid">
          {profile.badges.map((badge, index) => (
            <div key={index} className={`badge-item ${badge.earned ? 'earned' : ''}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
                {badge.title}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {badge.points_required} points
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {profile.achievements?.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>
            <Zap size={20} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
            Recent Achievements
          </h3>
          {profile.achievements.map((achievement, index) => (
            <div key={index} className="achievement-item">
              <span style={{ fontSize: '24px' }}>
                {achievement.type === 'exam' ? '📝' : achievement.type === 'course' ? '🎓' : '🏅'}
              </span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#0f172a' }}>{achievement.title}</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {achievement.date} • +{achievement.points} points
                </p>
              </div>
              <Star size={20} color="#f59e0b" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamificationProfile;