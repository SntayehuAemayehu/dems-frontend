// frontend/src/pages/Student/TakeExam.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Camera,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Loader,
  RefreshCw,
  CheckCircle,
  Hand,
  Sun,
  Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AIProctor from '../../components/Proctoring/AIProctor';
import AudioMonitor from '../../utils/audioMonitor';
import { useDarkMode } from '../../context/DarkModeContext';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // ==================== STATES ====================
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Identity verification
  const [pageState, setPageState] = useState('loading'); // loading | verifying | verified | failed
  const [verifyError, setVerifyError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Proctoring counters
  const [violationCount, setViolationCount] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const [blurReason, setBlurReason] = useState('A phone or additional face was detected.');
  const [isPaused, setIsPaused] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [teacherListening, setTeacherListening] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [audioAlert, setAudioAlert] = useState(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const blurTimeoutRef = useRef(null);
  const submissionInProgressRef = useRef(false);
  const violationCountRef = useRef(0);
  const attemptIdRef = useRef(attemptId);
  const answersRef = useRef(answers);
  const handleSubmitRef = useRef(null);
  attemptIdRef.current = attemptId;
  answersRef.current = answers;

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ==================== 1. LOAD EXAM + CHECK FACE ENROLLMENT ====================
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Check if face is enrolled
        const statusRes = await api.get('/auth/face-status/');
        if (!statusRes.data?.face_enrolled) {
          toast.error('You must enroll your face before taking an exam.');
          navigate('/enroll-face');
          return;
        }

        // Fetch exam details
        const examRes = await api.get(`/exams/${examId}/`);
        if (!isMounted) return;

        setExam(examRes.data);

        // Change to verifying state FIRST so the <video> element is rendered
        setPageState('verifying');
      } catch (err) {
        console.error(err);
        toast.error('Could not load exam.');
        navigate('/exams');
      }
    };

    init();

    return () => {
      isMounted = false;
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [examId]);

  useEffect(() => {
    if (pageState !== 'verified') return undefined;

    const monitor = new AudioMonitor((alert) => {
      const studentAlert = {
        ...alert,
        message: 'Please remain silent and continue your exam.',
      };
      setAudioAlert(studentAlert);
      toast.warning(studentAlert.message);
    });
    let active = true;
    monitor.start().then(() => {
      if (active) setMicrophoneStream(monitor.stream);
    }).catch((error) => {
      console.error('Sound detection could not start:', error);
      toast.error('Sound detection could not start. Allow microphone access to enable it.');
    });

    return () => {
      active = false;
      monitor.stop();
      setMicrophoneStream(null);
    };
  }, [pageState]);

  // ==================== START CAMERA ONLY AFTER VIDEO ELEMENT EXISTS ====================
  useEffect(() => {
    if (pageState === 'verifying' || pageState === 'failed') {
      startCamera().then(() => {
        // Auto verify after camera is ready
        setTimeout(() => {
          handleAutoVerify();
        }, 2200);
      });
    }
  }, [pageState]);

  // ==================== CAMERA ====================
  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Wait until the video element exists in the DOM
      let tries = 0;
      while (!videoRef.current && tries < 25) {
        await new Promise((r) => setTimeout(r, 100));
        tries++;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } else {
        throw new Error('Video element not found');
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied or not available.');
      setPageState('failed');
      setVerifyError('Camera access is required to take the exam.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // ==================== IDENTITY VERIFICATION ====================
  const captureImage = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return null; // video not ready
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Draw normally (no mirror for verification)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const handleAutoVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      // Wait a bit longer so camera can stabilize
      await new Promise((r) => setTimeout(r, 1200));

      let imageData = null;
      let tries = 0;

      // Try up to 6 times to get a good frame
      while (!imageData && tries < 6) {
        imageData = captureImage();
        if (!imageData) {
          await new Promise((r) => setTimeout(r, 600));
        }
        tries++;
      }

      if (!imageData) {
        throw new Error('Camera is not ready. Please wait a moment and try again.');
      }

      // Verify identity FIRST (without creating attempt yet)
      const verifyRes = await api.post(`/exams/verify-face-identity/`, {
        image_data: imageData,
      });

      if (!verifyRes.data.verified) {
        setPageState('failed');
        setVerifyError(verifyRes.data.error || 'Face does not match your enrolled photo.');
        toast.error('Identity verification failed');
        return;
      }

      // Only create attempt after successful verification
      const startRes = await api.post(`/exams/${examId}/start/`, {
        seb_session_id: location.state?.sebSessionId,
      });
      const newAttemptId = startRes.data.attempt_id;

      setAttemptId(newAttemptId);
      setQuestions(startRes.data.questions || []);
      setTimeLeft((startRes.data.duration_minutes || 60) * 60);
      stopCamera();

      toast.success('Identity verified! Starting exam...');
      setPageState('verified');

    } catch (err) {
      console.error(err);
      setPageState('failed');

      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Please try again.';

      // Special case: already taken
      if (
        errorMsg.toLowerCase().includes('already taken') ||
        errorMsg.toLowerCase().includes('already started')
      ) {
        setVerifyError('You have already started or submitted this exam.');
      } else {
        setVerifyError(errorMsg);
      }

      toast.error(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  // ==================== PROCTORING CALLBACKS ====================
  const handleViolation = useCallback(
    (type, message) => {
      if (type === 'MULTIPLE_FACES' || type === 'PHONE_DETECTED') {
        const newCount = violationCountRef.current + 1;
        violationCountRef.current = newCount;
        setViolationCount(newCount);
        setBlurReason(type === 'PHONE_DETECTED'
          ? 'A phone was detected. Remove it from view.'
          : 'More than one face was detected. Continue alone.');
        setIsBlurred(true);
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = setTimeout(() => setIsBlurred(false), 3000);
        toast.error(`${message} (${newCount}/3)`);

        if (newCount >= 3) {
          toast.error('Three proctoring detections. Submitting the exam.');
          handleSubmitRef.current?.(`${type} detected 3 times`);
        }
      }

      if (type === 'FACE_LOST') {
        toast.warning('No face detected. Please stay in front of the camera.');
      }
    },
    []
  );

  // ==================== TIMER ====================
  useEffect(() => {
    if (pageState !== 'verified' || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit('Time is up');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [pageState, timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleLiveExamMessage = useCallback((message) => {
    if (message.type === 'exam_update' && Array.isArray(message.questions)) {
      setQuestions(message.questions);
      setCurrentIndex((index) => Math.min(index, Math.max(message.questions.length - 1, 0)));
    }
    if (message.type === 'add_time' && Number.isFinite(Number(message.minutes))) {
      setTimeLeft((seconds) => seconds + Number(message.minutes) * 60);
      toast.success(`${message.minutes} minute(s) added to your exam`);
    }
    if (message.type === 'warning') {
      toast.error(message.message || 'Your teacher sent an exam warning.');
    }
    if (message.type === 'pause_exam') {
      setIsPaused(true);
      toast.error(message.message || 'Your exam has been paused by the teacher.');
    }
    if (message.type === 'resume_exam') {
      setIsPaused(false);
      toast.success(message.message || 'Your exam has been resumed.');
    }
    if (message.type === 'force_submit') {
      handleSubmitRef.current?.(message.message || 'Your teacher ended the exam');
    }
    if (message.type === 'audio_listen_request') {
      setTeacherListening(true);
    }
    if (message.type === 'audio_listen_stop') {
      setTeacherListening(false);
    }
  }, []);

  // ==================== SUBMIT ====================
  const handleSubmit = async (reason = 'User submitted') => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId || submissionInProgressRef.current) return;

    submissionInProgressRef.current = true;
    setIsSubmitting(true);
    try {
      await api.post(`/exams/attempt/${currentAttemptId}/submit/`, { answers: answersRef.current });
      stopCamera();
      if (/SEB/i.test(navigator.userAgent)) {
        toast.success(`Exam submitted (${reason}). Safe Exam Browser is closing.`);
        window.location.href = 'seb://quit';
      } else {
        toast.success(`Exam submitted (${reason})`);
        navigate('/results');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit exam');
      submissionInProgressRef.current = false;
      setIsSubmitting(false);
    }
  };
  handleSubmitRef.current = handleSubmit;

  // ==================== RENDER ====================

  // ---------- LOADING ----------
  if (pageState === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader className="spin" size={48} color="#2563eb" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---------- VERIFYING / FAILED ----------
  if (pageState === 'verifying' || pageState === 'failed') {
    return (
      <div style={{ maxWidth: 820, margin: '40px auto', padding: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <ShieldCheck size={52} color="#2563eb" style={{ margin: '0 auto 12px' }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
              Identity Verification
            </h1>
            <p style={{ color: '#64748b', marginTop: 8 }}>
              {exam?.title}
            </p>
          </div>

          {verifyError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertCircle size={20} />
              {verifyError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            {/* Camera */}
            <div>
              <div
                style={{
                  position: 'relative',
                  background: '#000',
                  borderRadius: 12,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    background: '#000',
                  }}
                />
                {isVerifying && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <Loader className="spin" size={42} />
                    <p style={{ marginTop: 12 }}>Verifying your identity...</p>
                  </div>
                )}
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 8 }}>
                Look straight at the camera
              </p>
            </div>

            {/* Rules + Button */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Exam Rules</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569' }}>
                  <Clock size={18} color="#2563eb" /> Duration: {exam?.duration_minutes || '--'} minutes
                </li>
                <li style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569' }}>
                  <Camera size={18} color="#2563eb" /> Camera must stay on
                </li>
                <li style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569' }}>
                  <AlertCircle size={18} color="#dc2626" /> Only one person allowed
                </li>
                <li style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569' }}>
                  <ShieldCheck size={18} color="#dc2626" /> AI Proctoring is active
                </li>
              </ul>

              <button
                onClick={handleAutoVerify}
                disabled={isVerifying}
                style={{
                  width: '100%',
                  marginTop: 28,
                  padding: '14px',
                  background: isVerifying ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {isVerifying ? (
                  <>
                    <Loader className="spin" size={20} /> Verifying...
                  </>
                ) : pageState === 'failed' ? (
                  <>
                    <RefreshCw size={20} /> Try Again
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} /> Verify & Start Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---------- VERIFIED → ACTUAL EXAM ----------
  const q = questions[currentIndex];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: isDarkMode ? '#0f172a' : '#f1f5f9',
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
      transition: 'background 0.2s, color 0.2s',
    }}>
      {/* Optional SEB indicator */}
      {/SEB/i.test(navigator.userAgent) && (
        <div style={{
          position: 'fixed', top: 8, right: 8, zIndex: 100,
          background: '#16a34a', color: 'white',
          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
        }}>
          🔒 SEB Active
        </div>
      )}

      {/* LEFT: Questions */}
      <div
        style={{
          flex: 1,
          padding: 32,
          paddingBottom: 220,
          overflowY: 'auto',
          filter: isBlurred ? 'blur(12px)' : 'none',
          transition: 'filter 0.3s',
          pointerEvents: isBlurred || isPaused ? 'none' : 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
            background: isDarkMode ? '#1e293b' : '#0f172a',
            color: 'white',
            padding: '14px 20px',
            borderRadius: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, margin: 0 }}>{exam?.title}</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              onClick={() => setIsHandRaised((raised) => !raised)}
              aria-pressed={isHandRaised}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                border: 0,
                borderRadius: 8,
                background: isHandRaised ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <Hand size={17} /> {isHandRaised ? 'Lower hand' : 'Raise hand'}
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: 'white',
                background: 'rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: timeLeft < 300 ? '#f87171' : '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 14 }}>
              <CheckCircle size={18} /> Verified
            </div>
          </div>
        </div>

        {/* Question Card */}
        {q && (
          <div
            style={{
              background: isDarkMode ? '#1e293b' : 'white',
              padding: 28,
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 20, lineHeight: 1.5 }}>{q.text}</h2>

            {q.type === 'MCQ' &&
              q.options?.map((opt, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: answers[q.id] === opt ? '2px solid #2563eb' : `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                    background: answers[q.id] === opt ? (isDarkMode ? '#1e3a8a' : '#eff6ff') : (isDarkMode ? '#0f172a' : 'white'),
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  {opt}
                </label>
              ))}

            {q.type === 'TF' && (
              <div style={{ display: 'flex', gap: 16 }}>
                {['True', 'False'].map((opt) => (
                  <label
                    key={opt}
                    style={{
                      flex: 1,
                      padding: 16,
                      border: answers[q.id] === opt ? '2px solid #2563eb' : `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                      borderRadius: 10,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: answers[q.id] === opt ? (isDarkMode ? '#1e3a8a' : '#eff6ff') : (isDarkMode ? '#0f172a' : 'white'),
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      style={{ display: 'none' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'SHORT' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                rows={5}
                placeholder="Type your answer here..."
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 10,
                  border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                  fontSize: 15,
                  resize: 'vertical',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  background: isDarkMode ? '#0f172a' : 'white',
                }}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
              background: isDarkMode ? '#1e293b' : 'white',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => setShowSubmitConfirmation(true)}
              style={{
                padding: '12px 28px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
              style={{
                padding: '10px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Compact proctor view */}
      <div style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 40,
        width: 240,
      }}>
        {violationCount > 0 && (
          <div
            style={{
              marginBottom: 8,
              padding: 8,
              background: violationCount >= 2 ? '#7f1d1d' : '#451a03',
              borderRadius: 8,
              color: 'white',
              textAlign: 'center',
              fontSize: 12,
            }}
          >
            Proctoring detections: <strong>{violationCount}/3</strong>
            {violationCount >= 2 && <div>Next phone/extra-face detection submits the exam.</div>}
          </div>
        )}
        {teacherListening && (
          <div style={{
            marginBottom: 8,
            padding: 8,
            background: '#7f1d1d',
            borderRadius: 8,
            color: 'white',
            textAlign: 'center',
            fontSize: 12,
          }}>
            Teacher is listening live. Audio is not recorded.
          </div>
        )}
        <AIProctor
          attemptId={attemptId}
          examId={examId}
          studentId={user?.id}
          onViolation={handleViolation}
          onAutoSubmit={(data) => handleSubmit(data.reason || 'Auto submitted by proctor')}
          onControlMessage={handleLiveExamMessage}
          handRaised={isHandRaised}
          microphoneStream={microphoneStream}
          audioAlert={audioAlert}
          onTeacherListeningChange={setTeacherListening}
        />
        <p style={{ margin: '6px 2px 0', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 10 }}>
          Microphone audio is analyzed for speech and is not recorded.
        </p>
      </div>

      {showSubmitConfirmation && (
        <div
          role="presentation"
          onClick={() => !isSubmitting && setShowSubmitConfirmation(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(15,23,42,0.65)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirmation-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 24,
              borderRadius: 14,
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
          >
            <h2 id="submit-confirmation-title" style={{ margin: '0 0 10px', fontSize: 20 }}>
              Submit your exam?
            </h2>
            <p style={{ margin: '0 0 24px', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
              You are about to submit your exam. Are you sure you want to continue?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirmation(false)}
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                  borderRadius: 8,
                  color: isDarkMode ? '#f1f5f9' : '#334155',
                  background: 'transparent',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('User submitted')}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  background: '#16a34a',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Yes, submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blur overlay message */}
      {isBlurred && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            pointerEvents: 'none',
          }}
        >
          <AlertCircle size={64} color="#f87171" />
          <h2 style={{ fontSize: 28, marginTop: 16 }}>Proctoring Warning</h2>
          <p style={{ fontSize: 16, opacity: 0.85 }}>
            {blurReason} The exam will return in 3 seconds.
          </p>
        </div>
      )}
      {isPaused && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.92)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <AlertCircle size={64} color="#f87171" />
          <h2 style={{ fontSize: 28, marginTop: 16 }}>Exam paused by your teacher</h2>
          <p>Wait for your teacher to resume the exam.</p>
        </div>
      )}
    </div>
  );
};

export default TakeExam;