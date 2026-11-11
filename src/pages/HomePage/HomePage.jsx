import React, { useEffect, useState, useRef } from 'react';
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
    Collapse,
    Avatar,
    Progress,
    Timeline,
    Badge,
    Tooltip,
    Input
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
    StarFilled,
    RobotOutlined,
    ThunderboltOutlined,
    RocketOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    BookFilled,
    ExperimentOutlined,
    MenuOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useDarkMode } from '../../context/DarkModeContext';
import Footer from '../../components/Footer/Footer';
import api, { getMediaUrl } from '../../api/api';
import { FadeIn, RevealOnScroll, Stagger, StaggerItem, TiltCard } from '../../components/Motion/MotionPrimitives';
const { Title, Paragraph, Text: TypographyText } = Typography;

const HomePage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useDarkMode();
    const [statsAvailable, setStatsAvailable] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        totalTeachers: 0,
        totalExams: 0,
        totalEnrollments: 0,
        totalDepartments: 0,
        satisfactionRate: 98,
    });
    const [testimonials, setTestimonials] = useState([]);
    const [latestNews, setLatestNews] = useState([]);
    const [departmentStats, setDepartmentStats] = useState([]);
    const [recentEnrollments, setRecentEnrollments] = useState([]);
    const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
    const testimonialTimerRef = useRef(null);
    const [faqSearch, setFaqSearch] = useState('');
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
                const data = response.data;
                if (data?.stats) {
                    setStats({
                        totalStudents: data.stats.totalStudents || 0,
                        totalCourses: data.stats.totalCourses || 0,
                        totalTeachers: data.stats.totalTeachers || 0,
                        totalExams: data.stats.totalExams || 0,
                        totalEnrollments: data.stats.totalEnrollments || 0,
                        totalDepartments: data.stats.totalDepartments || 0,
                        satisfactionRate: data.stats.satisfactionRate || 98,
                    });
                    setStatsAvailable(true);
                }
                if (data?.testimonials) setTestimonials(data.testimonials);
                if (data?.departmentStats) setDepartmentStats(data.departmentStats);
                if (data?.recentEnrollments) setRecentEnrollments(data.recentEnrollments);
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

    // Auto-rotate testimonials
    useEffect(() => {
        if (testimonials.length > 1) {
            testimonialTimerRef.current = setInterval(() => {
                setActiveTestimonialIndex(prev => (prev + 1) % testimonials.length);
            }, 5000);
        }
        return () => {
            if (testimonialTimerRef.current) clearInterval(testimonialTimerRef.current);
        };
    }, [testimonials.length]);

    const goTo = path => navigate(path);
    const openNewsPage = () => navigate('/news');
    const openNewsDetail = newsId => navigate(`/news/${newsId}`);

    const features = [
        { icon: <BookOutlined />, title: 'Interactive Courses', description: 'Engage with well-structured subjects and track your semester learning module updates.', color: '#4f46e5' },
        { icon: <ReadOutlined />, title: 'Smart E-Library', description: 'Instant access to curated course notes, eBooks, and verified reading lists.', color: '#06b6d4' },
        { icon: <VideoCameraOutlined />, title: 'Live Virtual Classes', description: 'Connect face-to-face with professors through seamless live video lecture integration.', color: '#8b5cf6' },
        { icon: <FileTextOutlined />, title: 'Secure Online Exams', description: 'Take timed quizzes and major examinations with robust anti-cheat framework safeguards.', color: '#f97316' },
        { icon: <SolutionOutlined />, title: 'Instant Grade Reports', description: 'Transparent academic evaluation viewable immediately after evaluation finalization.', color: '#10b981' },
        { icon: <CalendarOutlined />, title: 'Smart Academic Calendar', description: 'Never miss a deadline with automated alerts for homework, tasks, and exam dates.', color: '#ec4899' }
    ];

    const steps = [
        { number: '01', title: 'Register Profile', description: 'Sign up securely using your assigned university credentials.' },
        { number: '02', title: 'Enroll Modules', description: 'Select your registered department subjects and materials.' },
        { number: '03', title: 'Attend & Learn', description: 'Join live sessions, study modules, and submit assignments.' },
        { number: '04', title: 'Excel & Graduate', description: 'Pass assessments and track cumulative GPA achievements.' }
    ];
    const faqItems = [
        { 
            key: '1', 
            label: <span><BookOutlined style={{ color: colors.primary, marginRight: 8 }} /> What is DEMS?</span>, 
            children: 'DEMS is the official Distance Education Management System of Mekdela Amba University, bringing a world-class digital campus directly to your screen. It allows you to access courses, take exams, and manage your academic journey online.' 
        },
        { 
            key: '2', 
            label: <span><UserOutlined style={{ color: colors.primary, marginRight: 8 }} /> How do I recover my login credentials?</span>, 
            children: 'Students can contact the university registrar or use the password recovery mechanism linked on the login screen. Click "Forgot Password" and follow the OTP verification steps.' 
        },
        { 
            key: '3', 
            label: <span><LaptopOutlined style={{ color: colors.primary, marginRight: 8 }} /> Can I use DEMS on my mobile phone?</span>, 
            children: 'Yes! The platform is fully responsive and optimized for mobile devices, tablets, and desktop computers. You can access it directly through your mobile browser.' 
        },
        { 
            key: '4', 
            label: <span><SafetyOutlined style={{ color: colors.primary, marginRight: 8 }} /> How are online exams conducted?</span>, 
            children: 'Exams take place during designated time windows under secure portal monitoring established by your department. Our AI proctoring system ensures fairness and academic integrity.' 
        },
        { 
            key: '5', 
            label: <span><ClockCircleOutlined style={{ color: colors.primary, marginRight: 8 }} /> What is the deadline for registration?</span>, 
            children: 'Registration deadlines are set by the Registrar Office and displayed on your dashboard. Late registrations may incur penalties or require special approval.' 
        },
        { 
            key: '6', 
            label: <span><TrophyOutlined style={{ color: colors.primary, marginRight: 8 }} /> How do I view my grades and transcripts?</span>, 
            children: 'Once your instructors finalize grades, you can view them instantly in the "Results" tab of your student dashboard. Official transcripts can be requested from the Registrar.' 
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
                .dems-stat-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .dems-stat-card:hover {
                    transform: translateY(-8px) scale(1.05);
                    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.2);
                    background: rgba(79, 70, 229, 0.03);
                    border-radius: 16px;
                }
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
                @keyframes floatCard {
                    0% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
                    50% { transform: translateY(-8px) rotateX(1.5deg) rotateY(-1.5deg); }
                    100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
                }
                .dems-3d-card {
                    transition: all 0.3s ease;
                    animation: floatCard 6s ease-in-out infinite;
                    transform-style: preserve-3d;
                }
                .dems-3d-card:hover {
                    animation-play-state: paused;
                    transform: translateY(-12px) scale(1.05) rotateX(4deg) rotateY(4deg);
                    box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.3) !important;
                    border-color: #2563eb !important;
                }
                .dems-3d-card:nth-child(2) { animation-delay: 1s; }
                .dems-3d-card:nth-child(3) { animation-delay: 2s; }
                .dems-testimonial-card {
                    transition: all 0.5s ease;
                }
                .dems-testimonial-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 25px 50px -15px rgba(79, 70, 229, 0.25) !important;
                }
                .dems-dept-card {
                    transition: all 0.4s ease;
                }
                .dems-dept-card:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 20px 40px -12px rgba(79, 70, 229, 0.2);
                }
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }
                .dems-live-dot {
                    animation: pulseDot 2s ease-in-out infinite;
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .dems-slide-in {
                    animation: slideInRight 0.5s ease-out;
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
                <span className="dems-live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
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
                        <Col xs={24} lg={13}>
                            <FadeIn>
                                <Title className="dems-shimmer" style={{
                                    fontSize: 'clamp(2rem, 5vw, 4.2rem)',
                                    lineHeight: 1.1,
                                    fontWeight: 800,
                                    marginBottom: 24
                                }}>
                                    Welcome to the DEMS of <br />
                                    Mekdela Amba University.
                                </Title>
                            </FadeIn>
                            <FadeIn delay={0.1}>
                                <Paragraph style={{
                                    fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                                    lineHeight: 1.8,
                                    color: colors.muted,
                                    maxWidth: 580,
                                    marginBottom: 36
                                }}>
                                    Access your courses, study materials, online classes and examinations through one convenient learning platform. Built with AI-powered tools, secure proctoring, and real-time analytics for the modern scholar.
                                </Paragraph>
                            </FadeIn>
                            <FadeIn delay={0.2}>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <Button type="primary" size="large" onClick={() => goTo('/register')} className="dems-btn dems-btn-primary">
                                        Get Started <ArrowRightOutlined />
                                    </Button>
                                    <Button size="large" onClick={() => goTo('/courses')}>
                                        Browse Courses
                                    </Button>
                                </div>
                            </FadeIn>
                            {/* Live Stats Row */}
                            <FadeIn delay={0.3}>
                                <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Students', value: stats.totalStudents, icon: <UserOutlined />, color: '#4f46e5' },
                                        { label: 'Courses', value: stats.totalCourses, icon: <BookOutlined />, color: '#06b6d4' },
                                        { label: 'Teachers', value: stats.totalTeachers, icon: <TeamOutlined />, color: '#8b5cf6' },
                                        { label: 'Departments', value: stats.totalDepartments, icon: <BookFilled />, color: '#f97316' },
                                    ].map((stat, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ color: stat.color, fontSize: 20 }}>{stat.icon}</span>
                                            <div>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: colors.text }}>{stat.value}</div>
                                                <div style={{ fontSize: 12, color: colors.muted }}>{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </Col>

                        <Col xs={24} lg={11}>
                            <FadeIn delay={0.2}>
                                <TiltCard intensity={12}>
                                    <Card variant="borderless" style={{ ...cardStyle, padding: 'clamp(16px, 4vw, 28px)', borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                                            <div style={{
                                                width: 68, height: 68, borderRadius: 20,
                                                background: isDarkMode ? '#312e81' : '#e0e7ff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 8px 20px rgba(79,70,229,0.15)'
                                            }}>
                                                <img src="/Mekdela_Amba_University_logo.jpg" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
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
                                                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                                                borderRadius: 14, background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                                                marginBottom: 12, border: `1px solid ${colors.border}`
                                            }}>
                                                <div style={{
                                                    width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center',
                                                    background: `${el.color}15`, color: el.color, fontSize: 20
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
                                { title: 'Enrolled Scholars', value: stats.totalStudents, icon: <UserOutlined />, color: '#4f46e5' },
                                { title: 'Active Courses', value: stats.totalCourses, icon: <BookOutlined />, color: '#06b6d4' },
                                { title: 'Expert Professors', value: stats.totalTeachers, icon: <TeamOutlined />, color: '#8b5cf6' },
                                { title: 'Exams Completed', value: stats.totalExams, icon: <TrophyOutlined />, color: '#f97316' }
                            ].map((item, index) => (
                                <Col xs={12} md={6} key={index}>
                                    <StaggerItem>
                                        <div className="dems-stat-card" style={{ textAlign: 'center', padding: '20px 12px', borderRadius: 16, cursor: 'pointer' }}>
                                            <Statistic
                                                title={<span style={{ color: colors.muted, fontWeight: 600, fontSize: 14 }}>{item.title}</span>}
                                                value={item.value}
                                                prefix={React.cloneElement(item.icon, { style: { color: item.color, marginRight: 8 } })}
                                                styles={{ content: { color: item.color, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' } }}
                                            />
                                        </div>
                                    </StaggerItem>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}

            {/* RECENT ACTIVITY FEED */}
            {recentEnrollments.length > 0 && (
                <section style={{ padding: '60px 24px', background: colors.background }}>
                    <div style={containerStyle}>
                        <RevealOnScroll>
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <Tag color="green">LIVE ACTIVITY</Tag>
                                <Title level={3} style={{ marginTop: 14, color: colors.text }}>Recent Enrollments</Title>
                            </div>
                        </RevealOnScroll>
                        <Row gutter={[16, 16]}>
                            {recentEnrollments.map((enrollment, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <StaggerItem>
                                        <Card className="dems-3d-card" style={{ ...cardStyle, padding: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Avatar style={{ background: colors.primary }}>{enrollment.student_name?.charAt(0) || 'S'}</Avatar>
                                                <div>
                                                    <strong style={{ color: colors.text, fontSize: 14 }}>{enrollment.student_name}</strong>
                                                    <div style={{ color: colors.muted, fontSize: 12 }}>
                                                        enrolled in <span style={{ color: colors.primary, fontWeight: 600 }}>{enrollment.course_code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 12, fontSize: 12, color: colors.muted }}>
                                                <ClockCircleOutlined /> {enrollment.date}
                                            </div>
                                        </Card>
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
                                                width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center',
                                                background: `${feature.color}15`, color: feature.color, fontSize: 26, marginBottom: 24
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

            {/* DEPARTMENT STATS */}
            {departmentStats.length > 0 && (
                <section style={{ ...sectionStyle, background: colors.surface }}>
                    <div style={containerStyle}>
                        <RevealOnScroll>
                            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
                                <Tag color="cyan">ACADEMIC DEPARTMENTS</Tag>
                                <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Our Academic Departments</Title>
                                <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                    Explore the departments and their real-time statistics.
                                </Paragraph>
                            </div>
                        </RevealOnScroll>
                        <Row gutter={[24, 24]}>
                            {departmentStats.map((dept, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <RevealOnScroll delay={0.1 * (index % 3)}>
                                        <Card className="dems-dept-card" style={cardStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                <Title level={4} style={{ margin: 0, color: colors.text, fontSize: 18 }}>{dept.name}</Title>
                                                <Tag color="purple">{dept.code}</Tag>
                                            </div>
                                            <Paragraph style={{ color: colors.muted, fontSize: 13, marginBottom: 16 }}>
                                                <strong>Head:</strong> {dept.head_name}
                                            </Paragraph>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>{dept.student_count}</div>
                                                    <div style={{ fontSize: 11, color: colors.muted }}>Students</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>{dept.teacher_count}</div>
                                                    <div style={{ fontSize: 11, color: colors.muted }}>Teachers</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#06b6d4' }}>{dept.course_count}</div>
                                                    <div style={{ fontSize: 11, color: colors.muted }}>Courses</div>
                                                </div>
                                            </div>
                                        </Card>
                                    </RevealOnScroll>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}

            {/* HOW IT WORKS */}
            <section style={{ ...sectionStyle, background: colors.background }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 70px' }}>
                            <Tag color="purple">SIMPLE ONBOARDING</Tag>
                            <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Your Journey in 4 Simple Steps</Title>
                            <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                From registration to graduation, here is how DEMS guides you.
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

            {/* TESTIMONIALS SECTION */}
            {testimonials.length > 0 && (
                <section style={{ padding: '80px 24px', background: colors.surface }}>
                    <div style={containerStyle}>
                        <RevealOnScroll>
                            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
                                <Tag color="gold">COMMUNITY VOICES</Tag>
                                <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>What Our Community Says</Title>
                                <Paragraph style={{ color: colors.muted, fontSize: 17 }}>
                                    Real feedback from students and instructors using DEMS.
                                </Paragraph>
                            </div>
                        </RevealOnScroll>
                        <Row gutter={[30, 30]} justify="center">
                            {testimonials.map((testimonial, index) => (
                                <Col xs={24} md={12} lg={8} key={index}>
                                    <RevealOnScroll delay={0.1 * (index % 3)}>
                                        <Card className="dems-testimonial-card" style={{ ...cardStyle, position: 'relative', height: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                {[...Array(testimonial.rating || 5)].map((_, i) => (
                                                    <StarFilled key={i} style={{ color: '#fbbf24', fontSize: 16 }} />
                                                ))}
                                            </div>
                                            <Paragraph style={{ fontSize: 15, fontStyle: 'italic', color: colors.text, lineHeight: 1.7, marginBottom: 20 }}>
                                                "{testimonial.content}"
                                            </Paragraph>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <Avatar size={48} style={{ background: testimonial.color || colors.primary, fontSize: 18, fontWeight: 600 }}>
                                                    {testimonial.avatar || testimonial.name?.charAt(0) || 'U'}
                                                </Avatar>
                                                <div>
                                                    <strong style={{ display: 'block', color: colors.text, fontSize: 15 }}>{testimonial.name}</strong>
                                                    <span style={{ color: colors.muted, fontSize: 12 }}>{testimonial.role}</span>
                                                    {testimonial.type === 'teacher' && testimonial.qualification && (
                                                        <div style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{testimonial.qualification}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ position: 'absolute', top: 16, right: 16 }}>
                                                <Tag color={testimonial.type === 'teacher' ? 'blue' : 'green'}>
                                                    {testimonial.type === 'teacher' ? 'Faculty' : 'Student'}
                                                </Tag>
                                            </div>
                                        </Card>
                                    </RevealOnScroll>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}

            {/* FAQ SECTION */}
            <section id="faq" style={{ ...sectionStyle, background: colors.background }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 40px' }}>
                            <Tag color="blue">SUPPORT CENTER</Tag>
                            <Title level={2} style={{ marginTop: 14, color: colors.text, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
                                Frequently Asked Questions
                            </Title>
                            <Paragraph style={{ color: colors.muted, fontSize: 17, marginBottom: 24 }}>
                                Everything you need to know about navigating the portal.
                            </Paragraph>
                            
                            {/* ✅ NEW: Search Bar */}
                            <Input
                                size="large"
                                placeholder="Search for a question..."
                                prefix={<SearchOutlined style={{ color: colors.muted }} />}
                                value={faqSearch}
                                onChange={(e) => setFaqSearch(e.target.value)}
                                style={{
                                    maxWidth: 500,
                                    borderRadius: 12,
                                    background: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }}
                            />
                        </div>
                    </RevealOnScroll>
                    
                    <RevealOnScroll delay={0.1}>
                        <div style={{ maxWidth: 850, margin: '0 auto' }}>
                            <Collapse
                                items={faqItems.filter(item => 
                                    !faqSearch || item.children.toLowerCase().includes(faqSearch.toLowerCase()) || 
                                    (typeof item.label.props.children[1] === 'string' && item.label.props.children[1].toLowerCase().includes(faqSearch.toLowerCase()))
                                )}
                                bordered={false}
                                expandIconPosition="end"
                                style={{ 
                                    background: colors.card, 
                                    borderRadius: 20, 
                                    border: `1px solid ${colors.border}`, 
                                    padding: '0 20px',
                                    boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.04)'
                                }}
                            />
                            
                            {/* ✅ NEW: Still have questions? */}
                            <div style={{
                                marginTop: 40,
                                textAlign: 'center',
                                padding: 30,
                                background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#eff6ff',
                                borderRadius: 20,
                                border: `1px solid ${isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#dbeafe'}`
                            }}>
                                <Title level={4} style={{ color: colors.text, margin: 0 }}>Still have questions?</Title>
                                <Paragraph style={{ color: colors.muted, margin: '8px 0 16px' }}>
                                    Can't find the answer you're looking for? Please chat with our friendly team.
                                </Paragraph>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    onClick={() => window.location.href = 'mailto:sntualex@gmail.com'}
                                    style={{ borderRadius: 10, background: colors.primary }}
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
            

            {/* AMAZING FUTURE SECTION */}
            <section style={{ padding: '60px 24px', background: colors.background }}>
                <div style={containerStyle}>
                    <RevealOnScroll>
                        <div style={{
                            position: 'relative',
                            padding: '60px 40px',
                            borderRadius: '24px',
                            background: isDarkMode
                                ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                                : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                            border: `1px solid ${colors.border}`,
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.15)',
                            textAlign: 'center'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{
                                    display: 'inline-block', padding: '8px 16px', borderRadius: '20px',
                                    background: isDarkMode ? 'rgba(79, 70, 229, 0.3)' : '#dbeafe',
                                    border: '1px solid rgba(79, 70, 229, 0.3)',
                                    color: isDarkMode ? '#a5b4fc' : '#2563eb',
                                    fontSize: '14px', fontWeight: 600, marginBottom: '24px', letterSpacing: '1px'
                                }}>
                                    NEXT-GEN LEARNING PLATFORM
                                </div>
                                <h1 style={{
                                    fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px',
                                    color: isDarkMode ? '#ffffff' : '#1e293b'
                                }}>
                                    Experience the Future of Digital Education
                                </h1>
                                <p style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', color: isDarkMode ? '#94a3b8' : '#475569', lineHeight: 1.6, marginBottom: '40px' }}>
                                    DEMS combines cutting-edge AI, seamless live classrooms, and secure digital exams to bring the university directly to you.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                    {[
                                        { icon: '🧠', title: 'AI-Powered', desc: 'Smart proctoring and insights' },
                                        { icon: '🌍', title: 'Anywhere Access', desc: 'Learn from any device' },
                                        { icon: '⚡', title: 'Instant Results', desc: 'Real-time grading and feedback' }
                                    ].map((item, i) => (
                                        <div key={i} className="dems-3d-card" style={{
                                            display: 'flex', alignItems: 'center', gap: '16px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'white',
                                            padding: '16px 24px', borderRadius: '16px',
                                            border: `1px solid ${colors.border}`,
                                            boxShadow: '0 4px 12px rgba(37,99,235,0.05)'
                                        }}>
                                            <span style={{ fontSize: '32px' }}>{item.icon}</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 700, fontSize: '16px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>{item.title}</div>
                                                <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                <Title level={2} style={{ color: colors.text, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', margin: '14px 0 8px' }}>Latest News</Title>
                                <Paragraph style={{ color: colors.muted, fontSize: 16, margin: 0 }}>Announcements, updates, and stories shared by our team.</Paragraph>
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