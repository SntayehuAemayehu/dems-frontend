// frontend/src/pages/Student/TakeExam.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AIProctor from '../../components/Proctoring/AIProctor';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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
  const [multipleFaceCount, setMultipleFaceCount] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const blurTimeoutRef = useRef(null);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const imageIntervalRef = useRef(null);

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
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [examId]);

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
      const startRes = await api.post(`/exams/${examId}/start/`);
      const newAttemptId = startRes.data.attempt_id;

      setAttemptId(newAttemptId);
      setQuestions(startRes.data.questions || []);
      setTimeLeft((startRes.data.duration_minutes || 60) * 60);

      toast.success('Identity verified! Starting exam...');
      setPageState('verified');

      // Start sending images every 60 seconds
      imageIntervalRef.current = setInterval(() => {
        sendProctorImage(false);
      }, 60000);
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

  // ==================== SEND IMAGE ====================
  const sendProctorImage = async (isWarning = false) => {
    if (!attemptId || !videoRef.current) return;

    try {
      const imageData = captureImage();
      if (!imageData) return;

      await api.post(`/proctoring/sessions/capture/`, {
        exam_id: attemptId,
        image_data: imageData,
        metadata: {
          face_detected: true,
          is_warning: isWarning,
          multiple_faces: isWarning,
        },
      });
    } catch (err) {
      console.debug('Image send failed', err.message);
    }
  };

  // ==================== PROCTORING CALLBACKS ====================
  const handleViolation = useCallback(
    (type, message) => {
      if (type === 'MULTIPLE_FACES') {
        setMultipleFaceCount((prev) => {
          const newCount = prev + 1;

          // Immediate image on warning
          sendProctorImage(true);

          // Blur for 5 seconds
          setIsBlurred(true);
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = setTimeout(() => {
            setIsBlurred(false);
          }, 5000);

          toast.error(`⚠️ Multiple faces detected (${newCount}/5)`);

          // Auto-submit after 5 times
          if (newCount >= 5) {
            toast.error('Too many multiple-face violations. Submitting exam...');
            handleSubmit('Multiple faces detected 5 times');
          }

          return newCount;
        });
      }

      if (type === 'FACE_LOST') {
        toast.warning('No face detected. Please stay in front of the camera.');
        sendProctorImage(true);
      }
    },
    [attemptId]
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
  }, []);

  // ==================== SUBMIT ====================
  const handleSubmit = async (reason = 'User submitted') => {
    if (!attemptId) return;

    try {
      await api.post(`/exams/attempt/${attemptId}/submit/`, { answers });
      toast.success(`Exam submitted (${reason})`);
      stopCamera();
      navigate('/results');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit exam');
    }
  };

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
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>
      {/* LEFT: Questions */}
      <div
        style={{
          flex: 1,
          padding: 32,
          overflowY: 'auto',
          filter: isBlurred ? 'blur(12px)' : 'none',
          transition: 'filter 0.3s',
          pointerEvents: isBlurred ? 'none' : 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
            background: '#0f172a',
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
              background: 'white',
              padding: 28,
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
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
                    border: answers[q.id] === opt ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                    background: answers[q.id] === opt ? '#eff6ff' : 'white',
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
                      border: answers[q.id] === opt ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: answers[q.id] === opt ? '#eff6ff' : 'white',
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
                  border: '1px solid #e2e8f0',
                  fontSize: 15,
                  resize: 'vertical',
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
              border: '1px solid #cbd5e1',
              background: 'white',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => handleSubmit('User submitted')}
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

      {/* RIGHT: AI Proctor */}
      <div style={{ width: 420, background: '#0f172a', padding: 16, overflowY: 'auto' }}>
        <AIProctor
          attemptId={attemptId}
          examId={examId}
          studentId={user?.id}
          onViolation={handleViolation}
          onAutoSubmit={(data) => handleSubmit(data.reason || 'Auto submitted by proctor')}
          onControlMessage={handleLiveExamMessage}
        />

        {/* Multiple face counter */}
        {multipleFaceCount > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: multipleFaceCount >= 4 ? '#7f1d1d' : '#451a03',
              borderRadius: 10,
              color: 'white',
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            Multiple faces: <strong>{multipleFaceCount}/5</strong>
            {multipleFaceCount >= 4 && (
              <div style={{ fontSize: 12, marginTop: 4 }}>Next one will auto-submit</div>
            )}
          </div>
        )}
      </div>

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
          <h2 style={{ fontSize: 28, marginTop: 16 }}>Multiple Faces Detected</h2>
          <p style={{ fontSize: 16, opacity: 0.85 }}>
            Exam is temporarily blurred. Remove the second person.
          </p>
        </div>
      )}
    </div>
  );
};

export default TakeExam;