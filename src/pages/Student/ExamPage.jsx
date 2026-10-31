// frontend/src/pages/Student/ExamPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AIProctor from '../../components/Proctoring/AIProctor';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [attemptId, setAttemptId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Security States
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [isPermanentLock, setIsPermanentLock] = useState(false);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    // ============================================================
    // 1. START EXAM
    // ============================================================
    useEffect(() => {
        const start = async () => {
            try {
                const res = await api.post(`/exams/${examId}/start/`);
                setAttemptId(res.data.attempt_id);
                setQuestions(res.data.questions);
                setTimeLeft(res.data.duration_minutes * 60);

                // Force Fullscreen
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } catch (err) {
                toast.error("Could not start exam");
                navigate('/exams');
            }
        };
        start();
        
        return () => {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, [examId, navigate]);

    // ============================================================
    // 2. TIMER
    // ============================================================
    useEffect(() => {
        if (timeLeft <= 0 || !attemptId || isLocked) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); handleSubmit("Time up"); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timeLeft, attemptId, isLocked]);

    const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

    // ============================================================
    // 3. HANDLE BACKEND SECURITY
    // ============================================================
    const handleBackendSecurityUpdate = (responseData) => {
        if (responseData.is_locked) {
            setIsLocked(true);
            setLockReason(responseData.lock_reason);
            
            // If backend says this is permanent, submit the exam
            if (!responseData.requires_recheck) {
                setIsPermanentLock(true);
                handleSubmit("Exam Locked by Server");
            }
        } else {
            // Backend says OK -> Unlock screen
            setIsLocked(false);
            setLockReason('');
        }
    };

    // ============================================================
    // 4. SUBMIT
    // ============================================================
    const handleSubmit = async (reason) => {
        if (!attemptId) return;
        toast.error(`Submitting: ${reason}`);
        try {
            await api.post(`/exams/attempt/${attemptId}/submit/`, { answers });
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            navigate('/results');
        } catch (err) {
            console.error(err);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    const q = questions[currentIndex];

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>
            
            {/* ✅ BLACK SCREEN LOCK OVERLAY */}
            {isLocked && (
                <div style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
                    <ShieldAlert size={100} color="#dc2626" />
                    <h1 style={{ fontSize: '48px', margin: '20px 0' }}>EXAM LOCKED</h1>
                    <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '600px' }}>{lockReason}</p>
                    {!isPermanentLock && (
                        <p style={{ color: '#22c55e', marginTop: '20px', fontWeight: 'bold' }}>
                            Waiting for conditions to return to normal...
                        </p>
                    )}
                </div>
            )}

            {/* LEFT: QUESTIONS */}
            <div style={{ flex: 1, padding: '40px', opacity: isLocked ? 0.1 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '24px' }}>Question {currentIndex + 1} of {questions.length}</h1>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: timeLeft < 300 ? '#dc2626' : '#0f172a' }}>
                        <Clock size={20} style={{ display: 'inline', marginRight: '8px' }} />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {q && (
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>{q.text}</h2>
                        {q.type === 'MCQ' && q.options.map((opt, i) => (
                            <div key={i} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px' }}>
                                <input type="radio" checked={answers[q.id] === opt} onChange={() => setAnswers({...answers, [q.id]: opt})} /> {opt}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>Previous</button>
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={() => handleSubmit("User submitted")} style={{ background: '#16a34a', color: 'white', padding: '10px 20px' }}>Submit Exam</button>
                    ) : (
                        <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} style={{ background: '#2563eb', color: 'white', padding: '10px 20px' }}>Next</button>
                    )}
                </div>
            </div>

            {/* RIGHT: AI PROCTOR */}
            <div style={{ width: '450px', padding: '20px', background: '#0f172a' }}>
                <AIProctor 
                    attemptId={attemptId}
                    examId={examId}
                    studentId={user?.id}
                    onBackendSecurityUpdate={handleBackendSecurityUpdate} // ✅ Connect to backend
                />
            </div>
        </div>
    );
};

export default ExamPage;