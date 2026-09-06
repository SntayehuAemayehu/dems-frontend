// frontend/src/components/Footer/Footer.jsx
// PROFESSIONAL FOOTER WITH ALYAH STYLE INSPIRATION

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MessageCircle, Sparkles, X } from 'lucide-react';
import { Divider, Typography, Button, Tooltip, Space, Modal, Input, message } from 'antd';
import { 
  FacebookOutlined, 
  TwitterOutlined, 
  YoutubeOutlined, 
  LinkedinOutlined, 
  InstagramOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SendOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useDarkMode } from '../../context/DarkModeContext';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isDarkMode } = useDarkMode();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! 👋 Welcome to DEMS AI Assistant. How can I assist you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Exams', href: '/exams' },
    { name: 'Live Classes', href: '/live-classes' },
    { name: 'About Us', href: '/about' },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Payments', href: '/payments' },
    { name: 'Results', href: '/results' },
    { name: 'Profile', href: '/profile' },
    { name: 'Support', href: '/support' },
  ];

  const socialLinks = [
    { icon: <FacebookOutlined />, label: 'Facebook', color: '#1877f2' },
    { icon: <TwitterOutlined />, label: 'Twitter', color: '#1da1f2' },
    { icon: <YoutubeOutlined />, label: 'YouTube', color: '#ff0000' },
    { icon: <LinkedinOutlined />, label: 'LinkedIn', color: '#0a66c2' },
    { icon: <InstagramOutlined />, label: 'Instagram', color: '#e4405f' },
  ];

  const handleAssistantSubmit = async () => {
    if (!assistantMessage.trim()) return;
    
    const userMessage = assistantMessage;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setAssistantMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const responses = [
        "I can help you with course enrollment. What would you like to know?",
        "Our courses cover Software Engineering, Data Science, and more!",
        "You can check your exam results in the dashboard.",
        "We offer live classes every Monday, Wednesday, and Friday.",
        "AI Proctoring ensures secure and fair examinations.",
      ];
      const botResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    } catch (error) {
      message.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const footerBg = isDarkMode 
    ? 'linear-gradient(180deg, #0f172a 0%, #0b1120 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)';

  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)';

  return (
    <>
      <footer style={{
        background: footerBg,
        color: textColor,
        marginTop: 'auto',
        width: '100%',
        borderTop: `1px solid ${borderColor}`,
        transition: 'all 0.3s ease',
        position: 'relative',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 24px 24px',
        }}>
          {/* Main Footer Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
            gap: '48px',
            marginBottom: '40px',
          }} className="footer-grid">
            
            {/* Brand Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                }}>
                  <GraduationCap size={28} color="white" />
                </div>
                <div>
                  <Title level={3} style={{
                    margin: 0,
                    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    DEMS
                  </Title>
                  <Text style={{ color: textMuted, fontSize: '12px' }}>
                    Distance Education Management System
                  </Text>
                </div>
              </div>
              <Paragraph style={{
                color: textMuted,
                lineHeight: 1.8,
                fontSize: '14px',
                maxWidth: '350px',
              }}>
                Empowering students with quality online education, secure AI-proctored exams, 
                interactive live classes, and seamless learning management since 2020.
              </Paragraph>
              <Space size="small" style={{ marginTop: '20px' }}>
                {socialLinks.map((social, index) => (
                  <Tooltip title={social.label} key={index}>
                    <Button
                      type="text"
                      icon={social.icon}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: `1px solid transparent`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = social.color + '20';
                        e.currentTarget.style.color = social.color;
                        e.currentTarget.style.borderColor = social.color + '40';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                        e.currentTarget.style.color = textMuted;
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    />
                  </Tooltip>
                ))}
              </Space>
            </div>

            {/* Quick Links */}
            <div>
              <Title level={4} style={{
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                Quick Links
              </Title>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {quickLinks.map((link) => (
                  <li key={link.name} style={{ marginBottom: '12px' }}>
                    <Link
                      to={link.href}
                      style={{
                        color: textMuted,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        display: 'inline-block',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#0f172a';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = textMuted;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Student Resources */}
            <div>
              <Title level={4} style={{
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                Student Resources
              </Title>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {studentLinks.map((link) => (
                  <li key={link.name} style={{ marginBottom: '12px' }}>
                    <Link
                      to={link.href}
                      style={{
                        color: textMuted,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        display: 'inline-block',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#0f172a';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = textMuted;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <Title level={4} style={{
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                marginBottom: '20px',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                Contact Us
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: textMuted,
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}>
                  <MailOutlined style={{ color: '#60a5fa', fontSize: '18px' }} />
                  <span>sntualex@gmail.com</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: textMuted,
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}>
                  <PhoneOutlined style={{ color: '#60a5fa', fontSize: '18px' }} />
                  <span>+251 918 116 960</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: textMuted,
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}>
                  <EnvironmentOutlined style={{ color: '#60a5fa', fontSize: '18px' }} />
                  <span>Mekdela Amba University, Ethiopia</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: textMuted,
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}>
                  <GlobalOutlined style={{ color: '#60a5fa', fontSize: '18px' }} />
                  <span>www.dems.edu.et</span>
                </div>
              </div>
            </div>
          </div>

          <Divider style={{
            borderColor: borderColor,
            margin: '0 0 24px 0',
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <Text style={{
              color: textMuted,
              fontSize: '13px',
            }}>
              © {currentYear} Distance Education Management System. All rights reserved.
            </Text>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <Text style={{
                color: textMuted,
                fontSize: '12px',
              }}>
                Mekdela Amba University
              </Text>
              <span style={{ color: textMuted, fontSize: '12px' }}>•</span>
              <Text style={{
                color: textMuted,
                fontSize: '12px',
              }}>
                Made with <span style={{ color: '#ef4444' }}>❤️</span>
              </Text>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant Floating Button */}
      <div style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999,
      }}>
        <Tooltip title="AI Assistant" placement="left">
          <button
            onClick={() => setIsAssistantOpen(true)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(59,130,246,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(59,130,246,0.4)';
            }}
          >
            <MessageCircle size={28} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid white',
              animation: 'pulse 2s infinite',
            }} />
          </button>
        </Tooltip>
      </div>

      {/* AI Assistant Modal */}
      <Modal
        open={isAssistantOpen}
        onCancel={() => setIsAssistantOpen(false)}
        footer={null}
        width={400}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
        }}
        bodyStyle={{
          padding: 0,
          background: isDarkMode ? '#1e293b' : '#ffffff',
        }}
        closeIcon={<CloseOutlined style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />}
      >
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <Text style={{ color: 'white', fontWeight: 600, fontSize: '16px', display: 'block' }}>
              DEMS Assistant
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              AI-powered help at your service
            </Text>
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: isDarkMode ? '#0f172a' : '#f8fafc',
        }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: msg.type === 'user'
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                color: msg.type === 'user' ? 'white' : (isDarkMode ? '#f1f5f9' : '#0f172a'),
                boxShadow: msg.type === 'bot' ? (isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)') : 'none',
                border: msg.type === 'bot' ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` : 'none',
                fontSize: '14px',
                lineHeight: 1.6,
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '12px',
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              }}>
                <span style={{
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }}>Typing...</span>
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 24px',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
          display: 'flex',
          gap: '8px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
        }}>
          <Input
            placeholder="Ask about DEMS..."
            value={assistantMessage}
            onChange={(e) => setAssistantMessage(e.target.value)}
            onPressEnter={handleAssistantSubmit}
            style={{
              flex: 1,
              borderRadius: '8px',
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAssistantSubmit}
            style={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
            }}
          />
        </div>
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        .ant-modal-content {
          border-radius: 16px !important;
          overflow: hidden !important;
          background: ${isDarkMode ? '#1e293b' : '#ffffff'} !important;
        }
        .ant-modal-header {
          background: ${isDarkMode ? '#1e293b' : '#ffffff'} !important;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'} !important;
        }
        .ant-modal-title {
          color: ${isDarkMode ? '#f1f5f9' : '#0f172a'} !important;
        }
        .ant-modal-close {
          color: ${isDarkMode ? '#94a3b8' : '#64748b'} !important;
        }
      `}</style>
    </>
  );
};

export default Footer;