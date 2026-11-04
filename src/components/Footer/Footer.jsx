import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Divider, Typography, Tooltip, Input, Button, message } from 'antd';
import {
  FacebookOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowUpOutlined,
  BookOutlined,
  HomeOutlined,
  ReadOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  CheckCircleFilled,
  GlobalOutlined
} from '@ant-design/icons';
import { useDarkMode } from '../../context/DarkModeContext';

const { Text, Title, Paragraph } = Typography;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isDarkMode } = useDarkMode();
  const [email, setEmail] = useState('');

  const colors = {
    background: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? '#111827' : '#ffffff',
    heading: isDarkMode ? '#f9fafb' : '#0f172a',
    text: isDarkMode ? '#9ca3af' : '#475569',
    muted: isDarkMode ? '#6b7280' : '#64748b',
    border: isDarkMode ? '#1f2937' : '#e2e8f0',
    accent: '#4f46e5', // Ultra-premium Indigo
    accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  };

  const quickLinks = [
    { name: 'Home Portal', path: '/', icon: <HomeOutlined /> },
    { name: 'Available Courses', path: '/courses', icon: <BookOutlined /> },
    { name: 'About University', path: '/about', icon: <ReadOutlined /> },
    { name: 'Help & Support', path: '/support', icon: <QuestionCircleOutlined /> },
  ];

  const studentLinks = [
    { name: 'Student Dashboard', path: '/dashboard', icon: <UserOutlined /> },
    { name: 'Online Examinations', path: '/exams', icon: <FileTextOutlined /> },
    { name: 'Live Video Classes', path: '/live-classes', icon: <VideoCameraOutlined /> },
    { name: 'Learning Modules', path: '/courses', icon: <ReadOutlined /> },
  ];

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: <FacebookOutlined /> },
    { name: 'YouTube', url: 'https://youtube.com', icon: <YoutubeOutlined /> },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: <LinkedinOutlined /> },
    { name: 'Instagram', url: 'https://instagram.com', icon: <InstagramOutlined /> },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      message.error('Please enter a valid email address.');
      return;
    }
    message.success('Subscribed successfully to DEMS updates!');
    setEmail('');
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <footer
        style={{
          background: colors.background,
          color: colors.text,
          borderTop: `1px solid ${colors.border}`,
          marginTop: '80px',
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          className="dems-footer-container"
          style={{
            maxWidth: '1340px',
            margin: '0 auto',
            padding: '70px 24px 30px',
          }}
        >
          {/* NEWSLETTER / ANNOUNCEMENT BANNER */}
          <div
            style={{
              background: isDarkMode ? '#111827' : '#eff6ff',
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              padding: '30px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              marginBottom: '60px',
              boxShadow: isDarkMode ? 'none' : '0 10px 30px -10px rgba(79, 70, 229, 0.08)',
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, color: colors.heading, fontSize: '20px', fontWeight: 700 }}>
                Stay Connected with DEMS Updates
              </Title>
              <Paragraph style={{ margin: '6px 0 0', color: colors.text, fontSize: '14px' }}>
                Receive instant notifications regarding examination timetables, grade uploads, and announcements.
              </Paragraph>
            </div>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '420px' }}>
              <Input
                type="email"
                placeholder="Enter your university email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: colors.border,
                  color: colors.heading,
                }}
              />
              <Button
                type="primary"
                htmlType="submit"
                className="dems-glow-btn"
                style={{
                  height: '46px',
                  padding: '0 24px',
                  borderRadius: '12px',
                  background: colors.accentGradient,
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                }}
              >
                Subscribe <SendOutlined />
              </Button>
            </form>
          </div>

          {/* Footer Main Sections */}
          <div
            className="dems-footer-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1fr 1.2fr 1.4fr',
              gap: '40px',
              marginBottom: '50px',
            }}
          >
            {/* University & DEMS Info */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: isDarkMode ? '#1e1b4b' : '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(79,70,229,0.15)',
                    padding: '3px',
                  }}
                >
                  <img
                    src="/Mekdela_Amba_University_logo.jpg"
                    alt="Mekdela Amba University Logo"
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      background: '#ffffff',
                    }}
                  />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: colors.heading,
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}
                  >
                    DEMS
                  </Title>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    Distance Education Management
                  </Text>
                </div>
              </div>

              <Paragraph
                style={{
                  color: colors.text,
                  fontSize: '14px',
                  lineHeight: '1.8',
                  maxWidth: '340px',
                  marginBottom: '20px',
                }}
              >
                Mekdela Amba University's official distance learning portal providing world-class online education management and resources.
              </Paragraph>

              {/* Status Indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                System Operational & Secure
              </div>

              {/* Social Media Links */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                {socialLinks.map((social) => (
                  <Tooltip title={social.name} key={social.name}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: colors.card,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                        fontSize: '18px',
                        transition: 'all 0.25s ease',
                      }}
                      className="dems-social-icon"
                    >
                      {social.icon}
                    </a>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <Title level={5} style={{ color: colors.heading, fontSize: '15px', fontWeight: 700, marginBottom: '24px' }}>
                Quick Links
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: colors.text,
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'color 0.2s ease',
                    }}
                    className="dems-footer-link"
                  >
                    <span style={{ color: colors.accent, display: 'flex' }}>{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Student Services */}
            <div>
              <Title level={5} style={{ color: colors.heading, fontSize: '15px', fontWeight: 700, marginBottom: '24px' }}>
                Student Hub
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {studentLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: colors.text,
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'color 0.2s ease',
                    }}
                    className="dems-footer-link"
                  >
                    <span style={{ color: colors.accent, display: 'flex' }}>{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <Title level={5} style={{ color: colors.heading, fontSize: '15px', fontWeight: 700, marginBottom: '24px' }}>
                Contact Support
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: colors.text, fontSize: '14px' }}>
                  <MailOutlined style={{ color: colors.accent, fontSize: '18px', marginTop: '2px' }} />
                  <a href="mailto:sntualex@gmail.com" style={{ color: colors.text, textDecoration: 'none' }} className="dems-footer-link">
                    sntualex@gmail.com
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: colors.text, fontSize: '14px' }}>
                  <PhoneOutlined style={{ color: colors.accent, fontSize: '18px', marginTop: '2px' }} />
                  <a href="tel:+251918116960" style={{ color: colors.text, textDecoration: 'none' }} className="dems-footer-link">
                    +251 918 116 960
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: colors.text, fontSize: '14px' }}>
                  <EnvironmentOutlined style={{ color: colors.accent, fontSize: '18px', marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.6 }}>
                    Mekdela Amba University, <br />
                    Amhara Region, Ethiopia
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Divider style={{ borderColor: colors.border, margin: '0 0 30px' }} />

          {/* Bottom Footer */}
          <div
            className="dems-footer-bottom"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <Text style={{ color: colors.muted, fontSize: '13px' }}>
              © {currentYear} Mekdela Amba University - DEMS. All rights reserved.
            </Text>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Text style={{ color: colors.muted, fontSize: '13px' }}>
                Distance Education Portal
              </Text>
              <Link
                to="/terms-and-policy"
                style={{ color: colors.muted, fontSize: '13px', textDecoration: 'none' }}
                className="dems-footer-link"
              >
                Terms &amp; Policy
              </Link>
              
              <button
                type="button"
                onClick={handleBackToTop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: colors.heading,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                className="dems-top-btn"
              >
                Back to top
                <ArrowUpOutlined />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Scoped CSS Styles */}
      <style>{`
        .dems-footer-link:hover {
          color: ${colors.accent} !important;
          transform: translateX(4px);
        }
        .dems-footer-link {
          transition: all 0.2s ease;
        }
        .dems-social-icon:hover {
          border-color: ${colors.accent} !important;
          color: ${colors.accent} !important;
          transform: translateY(-3px);
        }
        .dems-top-btn:hover {
          border-color: ${colors.accent} !important;
          color: ${colors.accent} !important;
        }

        @media (max-width: 1024px) {
          .dems-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 35px !important;
          }
        }

        @media (max-width: 640px) {
          .dems-footer-container {
            padding: 40px 20px 24px !important;
          }

          .dems-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }

          .dems-footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;