// frontend/src/pages/Student/StartExam.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Camera, AlertCircle, ShieldCheck, Clock, ArrowLeft } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';
import AIProctor from '../../components/Proctoring/AIProctor';

const StartExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
    
    // Security States
    const [isFaceVerified, setIsFaceVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [error, setError] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    // ============================================================
    // 1. CHECK PROFILE PHOTO & EXAM DETAILS
    // ============================================================
    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                // Check profile photo
                if (!user?.student_profile?.user?.profile_picture) {
                    setHasProfilePhoto(false);
                    setLoading(false);
                    return;
                }
                setHasProfilePhoto(true);

                // Fetch exam details
                const response = await api.get(`/exams/${examId}/`);
                setExam(response.data);
                
            } catch (err) {
                console.error("Failed to load exam", err);
                toast.error("Could not load exam details.");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchExamDetails();
    }, [examId, user, navigate]);

    // ============================================================
    // 2. START EXAM (CREATE ATTEMPT & VERIFY FACE)
    // ============================================================
// Inside StartExam.jsx

const handleStartExam = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
        // Step A: Request to start the exam (creates the attempt ID)
        const startRes = await api.post(`/exams/${examId}/start/`);
        const newAttemptId = startRes.data.attempt_id;
        setAttemptId(newAttemptId);

        // Step B: Capture face for initial verification
        const video = document.getElementById('verify-video');
        if (!video) throw new Error("Camera not ready");

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        // Step C: Send to backend for Identity Check
        const verifyRes = await api.post(`/exams/verify-face-identity/`, {
            image_data: imageData,
            attempt_id: newAttemptId
        });

        if (verifyRes.data.verified) {
            toast.success("Identity Verified. Starting Exam...");
            // ✅ REDIRECT TO THE ACTUAL EXAM PAGE
            navigate(`/exams/${examId}/take`); 
        } else {
            // Identity failed (e.g., Abebe using Alemu's account)
            setError(verifyRes.data.error || "Face does not match your profile picture.");
            toast.error("Identity mismatch detected!");
            
            // Flag the attempt immediately
            await api.post(`/exams/${newAttemptId}/flag/`, {
                reason: "Identity mismatch on exam start"
            });
            // Lock them out
            setIsLocked(true); 
        }

    } catch (err) {
        console.error("Start Exam Error:", err);
        setError(err.response?.data?.error || "Failed to verify identity. Please try again.");
    } finally {
        setIsVerifying(false);
    }
};
    // ============================================================
    // 3. RENDER BLOCKERS
    // ============================================================
    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

    if (!hasProfilePhoto) {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', padding: '30px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                <AlertCircle size={64} color="#dc2626" style={{ margin: '0 auto 20px' }} />
                <h2 style={{ color: '#991b1b', fontSize: '24px', fontWeight: 'bold' }}>Profile Photo Required</h2>
                <p style={{ color: '#b91c1c', marginTop: '10px' }}>
                    For security reasons, you must upload a clear, front-facing profile photo before taking any exam.
                </p>
                <button 
                    onClick={() => navigate('/profile')}
                    style={{ marginTop: '20px', padding: '12px 24px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Go to Profile Settings
                </button>
            </div>
        );
    }

    // ============================================================
    // 4. RENDER PRE-EXAM IDENTITY VERIFICATION SCREEN
    // ============================================================
    if (!isFaceVerified) {
        return (
            <div style={{ maxWidth: '800px', margin: '30px auto', padding: '24px' }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginBottom: '20px' }}>
                    <ArrowLeft size={20} /> Back to Exams
                </button>

                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <ShieldCheck size={48} color="#2563eb" style={{ margin: '0 auto 12px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Identity Verification</h1>
                        <p style={{ color: '#64748b' }}>You are about to start: <b>{exam?.title}</b></p>
                    </div>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Left Side: Camera Feed */}
                        <div>
                            <div style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', paddingTop: '75%' }}>
                                <video 
                                    id="verify-video" 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                                />
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
                                Look directly at the camera.
                            </p>
                        </div>

                        {/* Right Side: Rules */}
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Exam Rules:</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li style={{ display: 'flex', gap: '8px', color: '#475569', fontSize: '14px' }}><Clock size={18} color="#2563eb" /> Duration: {exam?.duration_minutes} minutes</li>
                                <li style={{ display: 'flex', gap: '8px', color: '#475569', fontSize: '14px' }}><Camera size={18} color="#2563eb" /> Your camera must remain ON</li>
                                <li style={{ display: 'flex', gap: '8px', color: '#475569', fontSize: '14px' }}><AlertCircle size={18} color="#dc2626" /> Do not switch tabs or leave the screen</li>
                                <li style={{ display: 'flex', gap: '8px', color: '#475569', fontSize: '14px' }}><ShieldCheck size={18} color="#dc2626" /> AI Proctoring is active</li>
                            </ul>

                            <button 
                                onClick={handleStartExam}
                                disabled={isVerifying}
                                style={{ width: '100%', marginTop: '24px', padding: '14px', background: isVerifying ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isVerifying ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                {isVerifying ? 'Verifying Identity...' : 'Verify & Start Exam'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // 5. RENDER ACTUAL EXAM (When Verified)
    // ============================================================
    // NOTE: Replace this with your actual Exam Question Component
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h2>{exam?.title}</h2>
                <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} /> Identity Verified
                </div>
            </div>
            
            {/* ✅ Mount the AI Proctor here */}
            <AIProctor 
                attemptId={attemptId}
                examId={examId}
                studentId={user?.id}
                onViolation={(type, msg) => console.log(type, msg)}
            />

            {/* ✅ Render Your Exam Questions Here */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h3>Exam Questions will appear here...</h3>
                <p>Integrate your existing Exam UI component here.</p>
            </div>
        </div>
    );
};

export default StartExam;