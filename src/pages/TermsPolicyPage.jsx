import React, { useEffect } from 'react';
import { Typography } from 'antd';
import { useDarkMode } from '../context/DarkModeContext';
import Footer from '../components/Footer/Footer';

const { Title, Paragraph } = Typography;

const TermsPolicyPage = () => {
  const { isDarkMode } = useDarkMode();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const colors = {
    background: isDarkMode ? '#030712' : '#f8fafc',
    surface: isDarkMode ? '#111827' : '#ffffff',
    text: isDarkMode ? '#f9fafb' : '#0f172a',
    muted: isDarkMode ? '#9ca3af' : '#475569',
    border: isDarkMode ? '#374151' : '#e2e8f0',
  };

  const sections = [
    {
      title: 'Using DEMS',
      content: 'DEMS provides Mekdela Amba University students and staff with access to academic services, learning materials, announcements, and related university information. Use the platform lawfully and follow university rules and instructions.',
    },
    {
      title: 'Accounts and security',
      content: 'Keep your sign-in credentials private and notify the university if you suspect that your account has been accessed without permission. You are responsible for activity performed through your account.',
    },
    {
      title: 'Academic content and conduct',
      content: 'Use course materials, assessments, and communication tools for their intended academic purposes. Do not misuse, copy, alter, or distribute content in ways that violate university rules or applicable law, and uphold academic integrity when completing assessments.',
    },
    {
      title: 'Service availability',
      content: 'The university may update, maintain, or temporarily limit parts of DEMS to operate and improve the service. We will make reasonable efforts to keep the platform available, but uninterrupted access cannot be guaranteed.',
    },
    {
      title: 'Information and privacy',
      content: 'DEMS uses account and academic information to provide its services, support university operations, and maintain platform security. Access to personal information should be limited to authorized purposes and handled in accordance with applicable university policies and laws.',
    },
    {
      title: 'Updates and contact',
      content: 'These terms and policy may be updated as DEMS or university requirements change. For questions about these terms or your information, contact Mekdela Amba University through the support details provided on this site.',
    },
  ];

  return (
    <main style={{ minHeight: '70vh', padding: '104px 24px 24px', background: colors.background }}>
      <article style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 56px)',
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        background: colors.surface,
      }}>
        <Title level={1} style={{ color: colors.text }}>Terms &amp; Policy</Title>
        <Paragraph style={{ color: colors.muted, fontSize: 16, lineHeight: 1.8 }}>
          Please read these terms and privacy information for using the Mekdela Amba University Distance Education Management System (DEMS).
        </Paragraph>
        {sections.map((section) => (
          <section key={section.title} style={{ marginTop: 28 }}>
            <Title level={3} style={{ color: colors.text }}>{section.title}</Title>
            <Paragraph style={{ color: colors.muted, fontSize: 15, lineHeight: 1.8 }}>
              {section.content}
            </Paragraph>
          </section>
        ))}
      </article>
      <Footer />
    </main>
  );
};

export default TermsPolicyPage;
