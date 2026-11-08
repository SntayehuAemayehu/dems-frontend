import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    Col,
    Row,
    Statistic,
    Typography,
    Space,
    Tag,
    Collapse
} from 'antd';
import {
    BookOutlined,
    VideoCameraOutlined,
    FileTextOutlined,
    ReadOutlined,
    UserOutlined,
    TeamOutlined,
    LaptopOutlined,
    SafetyOutlined,
    ArrowRightOutlined,
    GlobalOutlined,
    CalendarOutlined,
    SolutionOutlined,
    TrophyOutlined,
    BellOutlined,
    StarFilled
} from '@ant-design/icons';
import { useDarkMode } from '../../context/DarkModeContext';
import Footer from '../../components/Footer/Footer';
import api, { getMediaUrl } from '../../api/api';
import { FadeIn, RevealOnScroll, Stagger, StaggerItem, TiltCard} from '../../components/Motion/MotionPrimitives';
const { Title, Paragraph, Text: TypographyText } = Typography;

const HomePage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useDarkMode();
    const [statsAvailable, setStatsAvailable] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        totalTeachers: 0,
        totalExams: 0
    });
    const [latestNews, setLatestNews] = useState([]);

    const colors = {
        primary: '#4f46e5',
        primaryHover: '#4338ca',
        accent: '#06b6d4',
        background: isDarkMode ? '#030712' : '#f8fafc',
        surface: isDarkMode ? '#111827' : '#ffffff',
        card: isDarkMode ? '#1f2937' : '#ffffff',
        text: isDarkMode ? '#f9fafb' : '#0f172a',
        muted: isDarkMode ? '#9ca3af' : '#64748b',
        border: isDarkMode ? '#374151' : '#e2e8f0',
        heroGlow: isDarkMode 
            ? 'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.18) 0%, transparent 60%)'
            : 'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.08) 0%, transparent 60%)'
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/public/homepage-stats/');
                const data = response.data?.stats;
                if (data) {
                    setStats({
                        totalStudents: data.totalStudents || 0,
                        totalCourses: data.totalCourses || 0,
                        totalTeachers: data.totalTeachers || 0,
                        totalExams: data.totalExams || 0
                    });
                    setStatsAvailable(true);
                }
            } catch (error) {
                console.error('Could not load homepage statistics:', error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        let active = true;
        api.get('/news/')
            .then(({ data }) => {
                const articles = (Array.isArray(data) ? data : data?.results || [])
                    .filter(article => article.is_published || (article.scheduled_for && new Date(article.scheduled_for) <= new Date()));
                if (active) setLatestNews(articles.slice(0, 3));
            })
            .catch(error => {
                console.error('Could not load latest news:', error);
            });
        return () => { active = false; };
    }, []);

    const goTo = path => {
        navigate(path);
    };

    const openNewsPage = () => {
        navigate('/news');
    };

    const openNewsDetail = newsId => {
        navigate(`/news/${newsId}`);
    };

    const features = [
        {
            icon: <BookOutlined />,
            title: 'Interactive Courses',
            description: 'Engage with well-structured subjects and track your semester learning module updates.',
            color: '#4f46e5'
        },
        {
            icon: <ReadOutlined />,
            title: 'Smart E-Library',
            description: 'Instant access to curated course notes, eBooks, and verified reading lists.',
            color: '#06b6d4'
        },
        {
            icon: <VideoCameraOutlined />,
            title: 'Live Virtual Classes',
            description: 'Connect face-to-face with professors through seamless live video lecture integration.',
            color: '#8b5cf6'
        },
        {
            icon: <FileTextOutlined />,
            title: 'Secure Online Exams',
            description: 'Take timed quizzes and major examinations with robust anti-cheat framework safeguards.',
            color: '#f97316'
        },
        {
            icon: <SolutionOutlined />,
            title: 'Instant Grade Reports',
            description: 'Transparent academic evaluation viewable immediately after evaluation finalization.',
            color: '#10b981'
        },
        {
            icon: <CalendarOutlined />,
            title: 'Smart Academic Calendar',
            description: 'Never miss a deadline with automated alerts for homework, tasks, and exam dates.',
            color: '#ec4899'
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Register Profile',
            description: 'Sign up securely using your assigned university credentials.'
        },
        {
            number: '02',
            title: 'Enroll Modules',
            description: 'Select your registered department subjects and materials.'
        },
        {
            number: '03',
            title: 'Attend & Learn',
            description: 'Join live sessions, study modules, and submit assignments.'
        },
        {
            number: '04',
            title: 'Excel & Graduate',
            description: 'Pass assessments and track cumulative GPA achievements.'
        }
    ];

    const testimonials = [
        {
            name: 'Amanuel Tadesse',
            role: 'Distance Education Student',
            content: 'DEMS made balancing my job and computer science studies incredibly manageable. The interface is lightning fast!',
            rating: 5
        },
        {
            name: 'Dr. Hirut Bekele',
            role: 'Faculty Instructor',
            content: 'Uploading study notes and monitoring student quizzes has never been this organized. A brilliant digital initiative.',
            rating: 5
        }
    ];

    const faqItems = [
        {
            key: '1',
            label: 'What is DEMS?',
            children: 'DEMS is the official Distance Education Management System of Mekdela Amba University, bringing a world-class digital campus directly to your screen[cite: 1].'
        },
        {
            key: '2',
            label: 'How do I recover my login credentials?',
            children: 'Students can contact the university registrar or use the password recovery mechanism linked on the login screen.'
        },
        {
            key: '3',
            label: 'Can I use DEMS on my mobile phone?',
            children: 'Yes! The platform is fully responsive and optimized for mobile devices, tablets, and desktop computers.'
        },
        {
            key: '4',
            label: 'How are online exams conducted?',
            children: 'Exams take place during designated time windows under secure portal monitoring established by your department.'
        }
    ];

    const containerStyle = {
        maxWidth: 1240,
        margin: '0 auto',
        padding: '0 clamp(16px, 4vw, 24px)' 
    };

    const sectionStyle = {
        padding: 'clamp(40px, 8vw, 100px) clamp(16px, 4vw, 24px)',
        background: colors.background
    };

    const cardStyle = {
        height: '100%',
        borderRadius: 20,
        background: colors.card,
        border: `1px solid ${colors.border}`,
        boxShadow: isDarkMode 
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.4)' 
            : '0 10px 30px -10px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.background,
            color: colors.text,
            overflowX: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>
            <style>{`
                .dems-feature-card:hover, .dems-step-card:hover {
                    transform: translateY(-8px);
                    border-color: ${colors.primary} !important;
                    box-shadow: 0 20px 40px -15px rgba(79, 70, 229, 0.15) !important;
                }
                .dems-glow-btn {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    border: none;
                    transition: all 0.3s ease;
                }
                .dems-glow-btn:hover {
                    opacity: 0.92;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
                }
                               /* 👇 NEW 3D STATS CARD ANIMATION 👇 */
                .dems-stat-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .dems-stat-card:hover {
                    transform: translateY(-8px) scale(1.05);
                    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.2);
                    background: rgba(79, 70, 229, 0.03);
                    border-radius: 16px;
                }
                /* 👆 END OF STATS CARD ANIMATION 👆 */



                @keyframes demsShimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .dems-shimmer {
                    background: linear-gradient(90deg, ${colors.text} 0%, ${colors.primary} 25%, ${colors.accent} 50%, ${colors.primary} 75%, ${colors.text} 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: demsShimmer 4s linear infinite;
                }
                .dems-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    user-select: none;
                }
                .dems-btn-primary {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: #fff;
                    box-shadow: 0 8px 20px -6px rgba(79, 70, 229, 0.4);
                }
                .dems-btn-primary:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 14px 30px -8px rgba(79, 70, 229, 0.55);
                }
                .dems-btn-primary:active {
                    transform: translateY(-1px) scale(0.99);
                }
            `}</style>

            {/* TOP ANNOUNCEMENT TICKER */}
            <div style={{
                background: isDarkMode ? '#1e1b4b' : '#e0e7ff',
                color: isDarkMode ? '#818cf8' : '#3730a3',
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderBottom: `1px solid ${colors.border}`
            }}>
                <BellOutlined /> Mekdela Amba University Distance Education Portal 2026 Academic Session is Live!
            </div>
            {/* HERO SECTION */}
            <section style={{
                padding: '90px 24px 80px',
                background: colors.heroGlow,
                position: 'relative'
            }}>
                <div style={containerStyle}>
                    <Row gutter={[48, 48]} align="middle">
                        {/* LEFT COLUMN - Text */}
                        <Col xs={24} lg={13}>
                            <FadeIn>
                                <Title className="dems-shimmer" style={{
                                    fontSize: 'clamp(2rem, 5vw, 4.2rem)',                                     lineHeight: 1.1,
                                    fontWeight: 800,
                                    marginBottom: 24
                                }}>
                                    Welcome to the DEMS of <br />
                                    Mekdela Amba University.
                                </Title>
                            </FadeIn>
                            <FadeIn delay={0.1}>
                                <Paragraph style={{
                                    fontSize: 'clamp(1rem, 2vw, 1.125rem)',                                    lineHeight: 1.8,
                                    color: colors.muted,
                                    maxWidth: 580,
                                    marginBottom: 36
                                }}>
                                    Access your courses, study materials,
                                    online classes and examinations through
                                    one convenient learning platform
                                </Paragraph>
                            </FadeIn>
                        </Col>

                        {/* RIGHT COLUMN - 3D CARD */}
                        <Col xs={24} lg={11}>
                            <FadeIn delay={0.2}>
                                <TiltCard intensity={12}>
                                    <Card variant="borderless" style={{ ...cardStyle, padding: 'clamp(16px, 4vw, 28px)' , borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                                            <div style={{
                                                width: 68,
                                                height: 68,
                                                borderRadius: 20,
                                                background: isDarkMode ? '#312e81' : '#e0e7ff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 8px 20px rgba(79,70,229,0.15)'
                                            }}>
                                                <img
                                                    src="/Mekdela_Amba_University_logo.jpg"
                                                    alt="Logo"
                                                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                                                />
                                            </div>
                                            <div>
                                                <Title level={4} style={{ margin: 0, color: colors.text, fontSize: 18 }}>Student Portal Hub</Title>
                                                <TypographyText style={{ color: colors.muted, fontSize: 13 }}>Mekdela Amba University</TypographyText>
                                            </div>
                                        </div>
                                        <div style={{ height: 1, background: colors.border, marginBottom: 20 }} />
                                        {[
                                            { icon: <BookOutlined />, title: 'Enrolled Courses', desc: 'Active semester subjects', color: '#4f46e5' },
                                            { icon: <VideoCameraOutlined />, title: 'Live Classrooms', desc: 'Join online sessions instantly', color: '#8b5cf6' },
                                            { icon: <FileTextOutlined />, title: 'Online Assessments', desc: 'Quizzes & final tests ready', color: '#f97316' }
                                        ].map((el, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                                padding: '14px 18px',
                                                borderRadius: 14,
                                                background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                                                marginBottom: 12,
                                                border: `1px solid ${colors.border}`
                                            }}>
                                                <div style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 12,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    background: `${el.color}15`,
                                                    color: el.color,
                                                    fontSize: 20
                                                }}>
                                                    {el.icon}
                                                </div>
                                                <div>
                                                    <strong style={{ display: 'block', color: colors.text, fontSize: 14 }}>{el.title}</strong>
                                                    <span style={{ color: colors.muted, fontSize: 12 }}>{el.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </Card>
                                </TiltCard>
                            </FadeIn>
                        </Col>
                    </Row>
                </div>
            </section>


            {/* REAL STATISTICS */}
            {statsAvailable && (
                <section style={{ padding: '50px 24px', background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
                    <div style={containerStyle}>
                        <Row gutter={[24, 24]}>
                            {[
                                { title: 'Enrolled Scholars', value: stats.totalStudents, icon: <UserOutlined /> },
                                { title: 'Active Courses', value: stats.totalCourses, icon: <BookOutlined /> },
                                { title: 'Expert Professors', value: stats.totalTeachers, icon: <TeamOutlined /> },
                                { title: 'Exams Completed', value: stats.totalExams, icon: <TrophyOutlined /> }
                            ].map((item, index) => (
                                <Col xs={12} md={6} key={index}>
                                    <StaggerItem>
                                        <div className="dems-stat-card" style={{ textAlign: 'center', padding: '20px 12px', borderRadius: 16, cursor: 'pointer' }}>
                                            <Statistic
                                                title={<span style={{ color: colors.muted, fontWeight: 600, fontSize: 14 }}>{item.title}</span>}
                                                value={item.value}
                                                prefix={item.icon}
                                                styles={{ content: { color: colors.primary, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' } }}
                                            />
                                        </div>
                                    </StaggerItem>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}

            {/* FEATURES SECTION */}
            <section id="features" style={sectionStyle}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 70px' }}>
                            <Tag color="purple">POWERFUL CAPABILITIES</Tag>
                            <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Engineered for Academic Excellence</Title>
                            <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                Discover tools designed to make distance learning intuitive, efficient, and deeply engaging.
                            </Paragraph>
                        </div>
                    </RevealOnScroll>
                    <Stagger>
                        <Row gutter={[30, 30]}>
                            {features.map((feature, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <StaggerItem>
                                        <Card variant="borderless" className="dems-feature-card" style={cardStyle}>
                                            <div style={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: 16,
                                                display: 'grid',
                                                placeItems: 'center',
                                                background: `${feature.color}15`,
                                                color: feature.color,
                                                fontSize: 26,
                                                marginBottom: 24
                                            }}>
                                                {feature.icon}
                                            </div>
                                            <Title level={4} style={{ color: colors.text, marginBottom: 12, fontSize: 20 }}>{feature.title}</Title>
                                            <Paragraph style={{ color: colors.muted, margin: 0, lineHeight: 1.8, fontSize: 15 }}>
                                                {feature.description}
                                            </Paragraph>
                                        </Card>
                                    </StaggerItem>
                                </Col>
                            ))}
                        </Row>
                    </Stagger>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section style={{ ...sectionStyle, background: colors.surface }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 70px' }}>
                            <Tag color="purple">POWERFUL CAPABILITIES</Tag>
                            <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Engineered for Academic Excellence</Title>
                            <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                Discover tools designed to make distance learning intuitive, efficient, and deeply engaging.
                            </Paragraph>
                        </div>
                    </RevealOnScroll>
                    <Stagger>
                        <Row gutter={[30, 30]}>
                            {steps.map((step, index) => (
                                <Col xs={24} sm={12} lg={6} key={index}>
                                    <StaggerItem>
                                        <Card bordered={false} className="dems-step-card" style={cardStyle}>
                                            <Title level={2} style={{ color: colors.primary, fontSize: 42, marginTop: 0, marginBottom: 16, fontWeight: 800 }}>
                                                {step.number}
                                            </Title>
                                            <Title level={4} style={{ color: colors.text, marginBottom: 12, fontSize: 18 }}>{step.title}</Title>
                                            <Paragraph style={{ color: colors.muted, margin: 0, lineHeight: 1.8, fontSize: 15 }}>
                                                {step.description}
                                            </Paragraph>
                                        </Card>
                                    </StaggerItem>
                                </Col>
                            ))}
                        </Row>
                    </Stagger>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="faq" style={{ ...sectionStyle, background: colors.surface }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 70px' }}>
                            <Tag color="blue">SUPPORT CENTER</Tag>
                            <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Your Journey in 4 Simple Steps</Title>                            <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                Everything you need to know about navigating the portal.
                            </Paragraph>
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <div style={{ maxWidth: 850, margin: '0 auto' }}>
                            <Collapse
                                items={faqItems}
                                bordered={false}
                                expandIconPosition="end"
                                style={{ background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '0 20px' }}
                            />
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* LATEST NEWS */}
            <section style={{
                padding: '72px 24px',
                background: colors.surface,
                borderTop: `1px solid ${colors.border}`
            }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
                            <div>
                                <Tag color="blue">FROM THE DEMS COMMUNITY</Tag>
<Title level={2} style={{ color: colors.text, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', margin: '14px 0 8px' }}>Latest News</Title>                                <Paragraph style={{ color: colors.muted, fontSize: 16, margin: 0 }}>Announcements, updates, and stories shared by our team.</Paragraph>
                            </div>
                            <Button type="link" onClick={openNewsPage} style={{ color: colors.primary, fontWeight: 700, padding: 0 }}>
                                View all news <ArrowRightOutlined />
                            </Button>
                        </div>
                    </RevealOnScroll>
                    {latestNews.length ? (
                        <Stagger>
                            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '4px 2px 16px', scrollSnapType: 'x mandatory' }}>
                                {latestNews.map(article => (
                                    <StaggerItem key={article.id}>
                                        <Card
                                            cover={article.video
                                                ? <video
                                                    src={getMediaUrl(article.video)}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    aria-label={`Play video for ${article.title}`}
                                                    style={{ width: '100%', height: 190, objectFit: 'cover', background: '#0f172a' }}
                                                />
                                                : article.image
                                                    ? <img alt="" src={getMediaUrl(article.image)} style={{ height: 190, objectFit: 'cover' }} />
                                                    : <div style={{ height: 190, display: 'grid', placeItems: 'center', background: isDarkMode ? '#1e293b' : '#eef2ff', color: colors.primary, fontSize: 34 }}>DEMS</div>}
                                            style={{ flex: '0 0 300px', scrollSnapAlign: 'start', borderRadius: 16, overflow: 'hidden', background: colors.card, border: `1px solid ${colors.border}` }}
                                            bodyStyle={{ padding: 20 }}
                                        >
                                            <Tag color="blue">{article.category || 'News'}</Tag>
                                            <Title level={4} style={{ color: colors.text, marginTop: 10, marginBottom: 8 }}>{article.title}</Title>
                                            <Paragraph ellipsis={{ rows: 2 }} style={{ color: colors.muted, marginBottom: 14 }}>{article.summary}</Paragraph>
                                            <TypographyText style={{ color: colors.muted, fontSize: 13 }}>{new Date(article.created_at).toLocaleDateString()}</TypographyText>
                                            <div style={{ marginTop: 16 }}>
                                                <Button type="primary" onClick={() => openNewsDetail(article.id)}>
                                                    View Detail
                                                </Button>
                                            </div>
                                        </Card>
                                    </StaggerItem>
                                ))}
                            </div>
                        </Stagger>
                    ) : (
                        <Card bordered={false} style={{ ...cardStyle, color: colors.muted, textAlign: 'center' }}>
                            News and announcements will appear here.
                        </Card>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;