import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Video, Shield, Award } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <BookOpen size={32} />,
      title: 'Online Courses',
      description: 'Access a wide range of courses with video lectures and interactive materials.'
    },
    {
      icon: <Video size={32} />,
      title: 'Live Classes',
      description: 'Join live video classes with your instructors in real-time.'
    },
    {
      icon: <Shield size={32} />,
      title: 'AI Proctoring',
      description: 'Secure online exams with AI-powered proctoring to prevent cheating.'
    },
    {
      icon: <Award size={32} />,
      title: 'Certificates',
      description: 'Earn recognized certificates upon successful course completion.'
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 80px',
        gap: '40px',
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        borderRadius: '20px',
        marginBottom: '40px',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '16px',
            lineHeight: '1.2',
          }}>
            <span style={{ color: '#2563eb' }}>Distance Education</span>
            <br />
            <span style={{ color: '#1e293b' }}>Management System</span>
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#475569',
            marginBottom: '32px',
            maxWidth: '500px',
          }}>
            Empowering students with quality online education, secure exams, and seamless learning management.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '40px',
          }}>
            <Link
              to="/register"
              style={{
                padding: '14px 36px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '18px',
                textDecoration: 'none',
                background: '#2563eb',
                color: 'white',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Get Started
            </Link>
            <Link
              to="/courses"
              style={{
                padding: '14px 36px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '18px',
                textDecoration: 'none',
                background: 'transparent',
                color: '#2563eb',
                border: '2px solid #2563eb',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'none';
              }}
            >
              Browse Courses
            </Link>
          </div>
          <div style={{
            display: 'flex',
            gap: '48px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                display: 'block',
              }}>10K+</span>
              <span style={{
                fontSize: '14px',
                color: '#64748b',
              }}>Students</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                display: 'block',
              }}>500+</span>
              <span style={{
                fontSize: '14px',
                color: '#64748b',
              }}>Courses</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                display: 'block',
              }}>98%</span>
              <span style={{
                fontSize: '14px',
                color: '#64748b',
              }}>Satisfaction</span>
            </div>
          </div>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <GraduationCap size={200} style={{ color: '#2563eb', opacity: 0.8 }} />
        </div>
      </section>

      <section style={{
        padding: '60px 0',
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '48px',
          color: '#0f172a',
        }}>Why Choose DEMS?</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              background: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)';
            }}>
              <div style={{
                color: '#2563eb',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'center',
              }}>{feature.icon}</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '8px',
              }}>{feature.title}</h3>
              <p style={{
                color: '#64748b',
                fontSize: '14px',
                lineHeight: '1.6',
              }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        borderRadius: '20px',
        padding: '60px 80px',
        textAlign: 'center',
        color: 'white',
      }}>
        <div>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '12px',
          }}>Ready to Start Learning?</h2>
          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            marginBottom: '32px',
          }}>Join thousands of students already using DEMS for their education.</p>
          <Link
            to="/register"
            style={{
              padding: '14px 36px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '18px',
              textDecoration: 'none',
              background: 'white',
              color: '#2563eb',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Create Account
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            padding: 40px;
            text-align: center;
          }
          .hero-section h1 {
            font-size: 32px;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .cta-section {
            padding: 40px 24px;
          }
          .cta-section h2 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;