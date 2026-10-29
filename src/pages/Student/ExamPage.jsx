// frontend/src/pages/Student/ExamPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AIProctor from '../../components/Proctoring/AIProctor';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [attemptId, setAttemptId] = useState(null);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(0); 
    const timerRef = useRef(null);

    // Security States
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ============================================================
    // 1. INITIALIZE EXAM
    // ============================================================
    useEffect(() => {
        const startExam = async () => {
            try {
                setLoading(true);
                const response = await api.post(`/exams/${examId}/start/`);
                
                setAttemptId(response.data.attempt_id);
                setExam({ title: response.data.exam_title || 'Final Exam' }); 
                setQuestions(response.data.questions);
                
                const durationSeconds = response.data.duration_minutes * 60;
                setTimeLeft(durationSeconds);
                
            } catch (err) {
                console.error("Failed to start exam:", err);
                setError(err.response?.data?.error || "Could not start exam. You may have already taken it.");
            } finally {
                setLoading(false);
            }
        };
        startExam();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [examId]);

    // ============================================================
    // 2. FULLSCREEN ENFORCEMENT & KEYBOARD DISABLE
    // ============================================================
    useEffect(() => {
        if (!attemptId || isLocked) return;

        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (err) {
                console.warn("Fullscreen denied:", err);
                toast.error("Please allow fullscreen for the exam.");
            }
        };

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);
            if (!isFull && !isLocked) {
                // If they exit fullscreen, lock the exam
                setIsLocked(true);
                setLockReason("You exited fullscreen mode. The exam has been locked.");
                handleAutoSubmit("Exited fullscreen");
            }
        };

        // Disable Keys (F12, Ctrl+C, Ctrl+V, Ctrl+P, PrintScreen)
        const handleKeyDown = (e) => {
            if (
                e.key === 'F12' || 
                (e.ctrlKey && ['c', 'v', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) ||
                (e.metaKey && ['c', 'v', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) ||
                e.key === 'PrintScreen'
            ) {
                e.preventDefault();
                toast.error("This action is disabled during the exam.");
            }
        };

        enterFullscreen();
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, [attemptId, isLocked]);

    // ============================================================
    // 3. TIMER LOGIC
    // ============================================================
    useEffect(() => {
        if (timeLeft <= 0 || !attemptId || isLocked) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit("Time is up!");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft, attemptId, isLocked]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ============================================================
    // 4. SECURITY VIOLATIONS & SUBMIT
    // ============================================================
    const handleViolation = useCallback((type, message) => {
        console.warn(`Violation: ${type} - ${message}`);
        
        if (type === 'EXAM_LOCKED' || type === 'FACE_LOCK' || type === 'MULTIPLE_FACES') {
            setIsLocked(true);
            setLockReason(message);
            handleAutoSubmit(`Exam Locked: ${message}`);
        }
    }, []);

    const handleAutoSubmit = useCallback(async (reason) => {
        if (isSubmitting || !attemptId) return;
        setIsSubmitting(true);
        
        toast.error(`🚨 Auto-submitting exam: ${reason}`, { duration: 5000 });

        try {
            await api.post(`/exams/attempt/${attemptId}/submit/`, { answers });
            setTimeout(() => navigate('/results'), 2000);
        } catch (err) {
            console.error("Auto submit failed:", err);
        }
    }, [attemptId, answers, navigate, isSubmitting]);

    const handleManualSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit your exam? You cannot change your answers after this.")) return;
        
        setIsSubmitting(true);
        try {
            await api.post(`/exams/attempt/${attemptId}/submit/`, { answers });
            toast.success("Exam submitted successfully!");
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            navigate('/results');
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to submit exam.");
            setIsSubmitting(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // ============================================================
    // RENDER
    // ============================================================
    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Exam...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#dc2626' }}>{error}</div>;

    const currentQuestion = questions[currentIndex];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', gap: '24px' }}>
            
            {/* LEFT SIDE: QUESTIONS */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{exam?.title || 'Final Exam'}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeLeft < 300 ? '#fef2f2' : '#f8fafc', color: timeLeft < 300 ? '#dc2626' : '#0f172a', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', border: `1px solid ${timeLeft < 300 ? '#fecaca' : '#e2e8f0'}` }}>
                        <Clock size={20} /> {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Question Navigation Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '12px' }}>
                    {questions.map((q, idx) => (
                        <button key={q.id} onClick={() => setCurrentIndex(idx)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: idx === currentIndex ? '2px solid #2563eb' : '1px solid #e2e8f0', background: answers[q.id] ? '#dcfce7' : (idx === currentIndex ? '#eff6ff' : 'white'), color: answers[q.id] ? '#16a34a' : (idx === currentIndex ? '#2563eb' : '#64748b'), fontWeight: 'bold', cursor: 'pointer' }}>
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Question Card */}
                {currentQuestion && (
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', lineHeight: '1.6' }}>
                            {currentIndex + 1}. {currentQuestion.text}
                        </h3>
                        
                        {currentQuestion.type === 'MCQ' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {currentQuestion.options.map((opt, i) => (
                                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: answers[currentQuestion.id] === opt ? '#eff6ff' : 'transparent', borderColor: answers[currentQuestion.id] === opt ? '#2563eb' : '#e2e8f0' }}>
                                        <input type="radio" name={`q_${currentQuestion.id}`} value={opt} checked={answers[currentQuestion.id] === opt} onChange={() => handleAnswerChange(currentQuestion.id, opt)} />
                                        <span style={{ fontSize: '16px' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'TF' && (
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {['True', 'False'].map(opt => (
                                    <label key={opt} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: answers[currentQuestion.id] === opt ? '#eff6ff' : 'transparent', borderColor: answers[currentQuestion.id] === opt ? '#2563eb' : '#e2e8f0' }}>
                                        <input type="radio" name={`q_${currentQuestion.id}`} value={opt} checked={answers[currentQuestion.id] === opt} onChange={() => handleAnswerChange(currentQuestion.id, opt)} />
                                        <span style={{ fontSize: '16px' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'SHORT' && (
                            <textarea value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)} placeholder="Type your answer here..." style={{ width: '100%', minHeight: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '16px' }} />
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} style={{ padding: '12px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.5 : 1 }}>
                        Previous
                    </button>
                    
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={handleManualSubmit} disabled={isSubmitting} style={{ padding: '12px 32px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={20} /> {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                        </button>
                    ) : (
                        <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Next
                        </button>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: AI PROCTOR */}
            <div style={{ width: '400px', flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: '24px' }}>
                    <AIProctor 
                        attemptId={attemptId}
                        examId={examId}
                        studentId={user?.id}
                        onViolation={handleViolation}
                        onAutoSubmit={({ reason }) => handleAutoSubmit(reason)}
                    />
                </div>
            </div>

            {/* FULL SCREEN LOCK OVERLAY */}
            {isLocked && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px', textAlign: 'center' }}>
                    <ShieldAlert size={80} color="#dc2626" />
                    <h1 style={{ fontSize: '32px', marginTop: '20px' }}>EXAM LOCKED</h1>
                    <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '500px' }}>{lockReason}</p>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '20px' }}>Your exam has been automatically submitted and flagged for review.</p>
                </div>
            )}
        </div>
    );
};

export default ExamPage;