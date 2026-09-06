// frontend/src/pages/Welcome/WelcomePage.jsx
// COMPLETE WELCOME PAGE

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, Button, Space, Row, Col,
  Badge, Steps, Rate, Spin, Carousel, Tag,
  Statistic, Timeline, Collapse, Tabs, Progress,
  Tooltip, Avatar, Divider, List, Alert,
  Modal, Input, Form, message
} from 'antd';
import {
  RocketOutlined, TeamOutlined,
  CheckCircleOutlined, UserOutlined,
  BookOutlined, VideoCameraOutlined, SafetyOutlined,
  TrophyOutlined, GlobalOutlined,
  ArrowRightOutlined, PlayCircleOutlined,
  BarChartOutlined,
  StarOutlined, CloudOutlined, MobileOutlined,
  LoadingOutlined, FormOutlined,
  SolutionOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, ClockCircleOutlined,
  CalendarOutlined, ThunderboltOutlined,
  HeartOutlined, CrownOutlined, FireOutlined,
  ExperimentOutlined, CodeOutlined,
  RiseOutlined, DollarOutlined,
  CommentOutlined, ShareAltOutlined,
  CopyOutlined, EyeOutlined, LikeOutlined,
  AppstoreOutlined, BulbOutlined,
  SettingOutlined, WifiOutlined,
  SecurityScanOutlined, AuditOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const WelcomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      }}>
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#3b82f6' }} spin />} 
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-20%',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        animation: 'float 15s ease-in-out infinite reverse',
      }} />
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .welcome-card {
          animation: fadeInUp 0.8s ease-out;
          position: relative;
          z-index: 2;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .welcome-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 40px;
          color: white;
          box-shadow: 0 8px 32px rgba(59,130,246,0.4);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 12px;
        }
        .stats-number {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .welcome-btn {
          transition: all 0.3s ease;
        }
        .welcome-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59,130,246,0.4);
        }
        @media (max-width: 768px) {
          .welcome-card { padding: 24px !important; }
          .welcome-title { font-size: 28px !important; }
        }
      `}</style>

      <Card
        className="welcome-card"
        style={{
          maxWidth: '900px',
          width: '100%',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '48px' }}
      >
        {/* Logo */}
        <div className="welcome-logo">
          <SolutionOutlined />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={1} className="welcome-title" style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 800,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
          }}>
            Welcome to <span className="shimmer-text">DEMS</span>
          </Title>
          <Paragraph style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '18px',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            Distance Education Management System
          </Paragraph>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
            flexWrap: 'wrap',
          }}>
            <Tag color="blue" style={{ borderRadius: '12px' }}>🚀 AI Powered</Tag>
            <Tag color="green" style={{ borderRadius: '12px' }}>🔒 Secure</Tag>
            <Tag color="purple" style={{ borderRadius: '12px' }}>📡 Real-time</Tag>
            <Tag color="gold" style={{ borderRadius: '12px' }}>⭐ 4.9/5</Tag>
          </div>
        </div>

        {/* Description */}
        <Paragraph style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '16px',
          lineHeight: 1.8,
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto 32px',
        }}>
          Empowering students with quality online education, secure AI-proctored exams,
          interactive live classes, and seamless learning management.
        </Paragraph>

        {/* Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <div className="stats-number">10K+</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Students</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <div className="stats-number">500+</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Courses</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <div className="stats-number">98%</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Satisfaction</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <div className="stats-number">50+</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Partners</div>
            </div>
          </Col>
        </Row>

        {/* Features */}
        <div style={{ marginBottom: '32px' }}>
          <Row gutter={[16, 16]}>
            {[
              { icon: <BookOutlined />, label: 'Online Courses', color: '#3b82f6' },
              { icon: <VideoCameraOutlined />, label: 'Live Classes', color: '#22c55e' },
              { icon: <SafetyOutlined />, label: 'AI Proctoring', color: '#8b5cf6' },
              { icon: <TrophyOutlined />, label: 'Certificates', color: '#f59e0b' },
            ].map((feature, index) => (
              <Col xs={12} sm={6} key={index}>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div className="feature-icon" style={{
                    background: `${feature.color}20`,
                    color: feature.color,
                  }}>
                    {feature.icon}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                    {feature.label}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/register')}
            className="welcome-btn"
            style={{
              height: '48px',
              padding: '0 40px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}
          >
            Get Started Free
          </Button>
          <Button
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate('/')}
            className="welcome-btn"
            style={{
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              fontWeight: 500,
              border: '2px solid rgba(255,255,255,0.2)',
              color: 'white',
              background: 'transparent',
              borderRadius: '12px',
            }}
          >
            Explore Home
          </Button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            © 2026 DEMS - Distance Education Management System
          </Text>
          <br />
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
            Mekdela Amba University • Made with ❤️
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default WelcomePage;