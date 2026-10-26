// frontend/src/components/Proctoring/FaceEnrollment.jsx
// Face enrollment component - called after registration or before exam

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const FaceEnrollment = ({ onComplete, onSkip }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const detectionIntervalRef = useRef(null);
     
    // ✅ FIX: Check if already enrolled
    const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [enrolledAt, setEnrolledAt] = useState(null);

    // ============================================================
    // CHECK IF ALREADY ENROLLED
    // ============================================================
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get('/auth/face-status/');
                if (res.data && res.data.face_enrolled) {
                    setAlreadyEnrolled(true);
                    setEnrolledAt(res.data.enrolled_at);
                }
            } catch (e) {
                // Silent — endpoint may not exist yet
                console.debug('Face status check failed:', e.message);
            } finally {
                setCheckingStatus(false);
            }
        };
        checkStatus();
    }, []);

    // ============================================================
    // START CAMERA
    // ============================================================
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStreaming(true);
                setError(null);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Cannot access camera. Please allow camera permissions.');
            toast.error('Camera access denied');
        }
    }, []);

    // ============================================================
    // STOP CAMERA
    // ============================================================
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStreaming(false);
    }, []);

    // ============================================================
    // SIMPLE FACE DETECTION (for UI feedback only)
    // ============================================================
    const detectFacePresence = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = 160;
        canvas.height = 120;
        ctx.drawImage(video, 0, 0, 160, 120);

        const imageData = ctx.getImageData(0, 0, 160, 120);
        const data = imageData.data;

        // Compute average brightness and variance
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < data.length; i += 4) {
            const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += v;
            sumSq += v * v;
        }
        const n = data.length / 4;
        const mean = sum / n;
        const variance = (sumSq / n) - (mean * mean);

        // ✅ FIX: Loosened thresholds (more forgiving of lighting)
        // Real face detection happens on backend — this is just UI feedback
        const detected = mean > 25 && mean < 240 && variance > 50;
        setFaceDetected(detected);
    }, []);

    // ============================================================
    // EFFECTS
    // ============================================================
    useEffect(() => {
        // ✅ FIX: Only start camera if not already enrolled
        if (!alreadyEnrolled && !checkingStatus) {
            startCamera();
        }
        return () => {
            stopCamera();
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        };
    }, [alreadyEnrolled, checkingStatus, startCamera, stopCamera]);

    useEffect(() => {
        if (streaming) {
            detectionIntervalRef.current = setInterval(detectFacePresence, 500);
        }
        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        };
    }, [streaming, detectFacePresence]);

    // ============================================================
    // CAPTURE AND ENROLL
    // ============================================================
    const handleEnroll = async () => {
        if (!videoRef.current) return;

        if (!faceDetected) {
            toast.error('Please position your face clearly in the camera');
            return;
        }

        // 3-second countdown
        setCountdown(3);
        for (let i = 3; i > 0; i--) {
            setCountdown(i);
            await new Promise(r => setTimeout(r, 1000));
        }
        setCountdown(0);

        setEnrolling(true);
        try {
            // Capture image at higher resolution
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);

            const imageData = canvas.toDataURL('image/jpeg', 0.9);

            const response = await api.post('/auth/enroll-face/', {
                image_data: imageData
            });

            if (response.data.success) {
                toast.success('✅ Face enrolled successfully!');
                stopCamera();
                if (onComplete) onComplete(response.data);
            } else {
                throw new Error(response.data.error || 'Enrollment failed');
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            const msg = err.response?.data?.error || err.message || 'Enrollment failed';
            toast.error(msg);
            setError(msg);
        } finally {
            setEnrolling(false);
        }
    };

    // ============================================================
    // RENDER — ALREADY ENROLLED SCREEN
    // ============================================================
    if (checkingStatus) {
        return (
            <div style={{
                maxWidth: '560px',
                margin: '0 auto',
                padding: '48px 24px',
                textAlign: 'center'
            }}>
                <Loader size={48} className="spin" color="#2563eb" />
                <p style={{ color: '#64748b', marginTop: '16px' }}>Checking enrollment status...</p>
                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (alreadyEnrolled) {
        return (
            <div style={{
                maxWidth: '560px',
                margin: '0 auto',
                padding: '24px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#dcfce7', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <CheckCircle size={32} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#166534' }}>
                    Face Already Enrolled
                </h2>
                <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
                    Your face is registered for exam verification.
                </p>
                {enrolledAt && (
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                        Enrolled on: {new Date(enrolledAt).toLocaleString()}
                    </p>
                )}
                <button
                    onClick={onComplete || (() => {})}
                    style={{
                        marginTop: '24px',
                        padding: '12px 32px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    Continue
                </button>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '16px' }}>
                    If you need to re-enroll (e.g., changed appearance), contact your administrator.
                </p>
            </div>
        );
    }

    // ============================================================
    // RENDER — ENROLLMENT SCREEN
    // ============================================================
    return (
        <div style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '24px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#eff6ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                }}>
                    <Camera size={32} color="#2563eb" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                    Face Enrollment
                </h2>
                <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
                    We'll capture your face once. It will be used to verify your identity before each exam.
                </p>
            </div>

            {error && (
                <div style={{
                    padding: '10px 14px', background: '#fef2f2',
                    border: '1px solid #fecaca', borderRadius: '8px',
                    marginBottom: '16px', display: 'flex',
                    alignItems: 'center', gap: '8px'
                }}>
                    <AlertCircle size={18} color="#dc2626" />
                    <span style={{ color: '#dc2626', fontSize: '13px' }}>{error}</span>
                </div>
            )}

            {/* Video Preview */}
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        display: 'block',
                        transform: 'scaleX(-1)', // Mirror
                        minHeight: '300px',
                        objectFit: 'cover'
                    }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Face detected indicator */}
                {streaming && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: faceDetected ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {faceDetected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {faceDetected ? 'Face detected' : 'No face detected'}
                    </div>
                )}

                {/* Countdown overlay */}
                {countdown > 0 && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '96px',
                        fontWeight: 'bold'
                    }}>
                        {countdown}
                    </div>
                )}

                {enrolling && countdown === 0 && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        gap: '12px'
                    }}>
                        <Loader size={48} className="spin" />
                        <span>Analyzing face...</span>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#475569'
            }}>
                <strong>Tips for best results:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.8 }}>
                    <li>Face the camera directly</li>
                    <li>Ensure good lighting</li>
                    <li>Remove sunglasses, hats, masks</li>
                    <li>Only one person in frame</li>
                </ul>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        disabled={enrolling}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: 600,
                            color: '#475569',
                            cursor: enrolling ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Skip for now
                    </button>
                )}
                <button
                    onClick={handleEnroll}
                    disabled={!streaming || !faceDetected || enrolling}
                    style={{
                        flex: 2,
                        padding: '12px',
                        background: (!streaming || !faceDetected || enrolling) ? '#94a3b8' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: (!streaming || !faceDetected || enrolling) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {enrolling ? <Loader size={18} className="spin" /> : <Camera size={18} />}
                    {enrolling ? 'Enrolling...' : 'Capture & Enroll'}
                </button>
            </div>

            {!streaming && (
                <button
                    onClick={startCamera}
                    style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '10px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <RefreshCw size={16} /> Retry Camera
                </button>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default FaceEnrollment;