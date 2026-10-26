// frontend/src/pages/Student/TakeExam.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Camera, Clock, AlertTriangle, ShieldCheck, ShieldAlert,
  Zap, Mic, Wifi, Fingerprint, UserCheck, Monitor, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { startExam, submitExam } from '../../store/slices/examSlice';
import api from '../../api/api';
import AIProctor from '../../components/Proctoring/AIProctor';
import { createProctor } from 'proctor-vision'; // PROCTOR VISION IMPORT
import './TakeExam.css';

const MAX_FACE_ATTEMPTS = 3;

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  // STATE
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timePenalty, setTimePenalty] = useState(0);
  const [isExamLocked, setIsExamLocked] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [mouseMovements, setMouseMovements] = useState([]);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [examWatermark, setExamWatermark] = useState('');
  const [faceMatchConfidence, setFaceMatchConfidence] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [faceAttempts, setFaceAttempts] = useState(0);
  const [faceLocked, setFaceLocked] = useState(false);

  // MULTI-FACE & AUDIO STATE
  const [examScreenHidden, setExamScreenHidden] = useState(false);
  const [violationMsg, setViolationMsg] = useState('');
  const [noiseLevel, setNoiseLevel] = useState(0);

  // REFS
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const proctorRef = useRef(null); // Proctor Vision ref
  const heartbeatIntervalRef = useRef(null);
  const networkCheckRef = useRef(null);
  const fullscreenCheckIntervalRef = useRef(null);
  const violationCount = useRef(0);
  const tabSwitchStartTime = useRef(null);
  const lastHeartbeatTime = useRef(Date.now());
  const startTimeRef = useRef(null);
  const mouseMoveCount = useRef(0);
  const keystrokeCount = useRef(0);
  const fullscreenExitAttempts = useRef(0);

  // HELPERS & CALCULATIONS
  const shuffleArray = (array) => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  
  const handleViolation = useCallback((type, message) => {
    violationCount.current += 1;
    setViolations((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
    setTrustScore((prev) => Math.max(0, prev - 5));
    toast.error(`⚠️ ${message}`);
    if (violationCount.current >= 5) {
      toast.error('🚨 Too many violations! Auto-submitting...');
      setTimeout(() => dispatch(submitExam({ attemptId, answers })), 2000);
    }
  }, [dispatch, attemptId, answers]);

  const calculateTrustScore = useCallback(() => {
    let score = 100;
    score -= violations.length * 3;
    score -= tabSwitchCount * 8;
    score -= timePenalty / 5;
    if (networkLatency > 300) score -= 5;
    if (mouseMovements.length < 50) score -= 10;
    if (keystrokeData.length < 20) score -= 10;
    if (!selfieVerified) score -= 20;
    if (examScreenHidden) score -= 15;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [violations.length, tabSwitchCount, timePenalty, networkLatency, mouseMovements.length, keystrokeData.length, selfieVerified, examScreenHidden]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    try {
      setSubmitted(true);
      setExamStarted(false);
      setIsExamLocked(true);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (networkCheckRef.current) clearInterval(networkCheckRef.current);
      
      const finalTrust = calculateTrustScore();
      await dispatch(submitExam({
        attemptId, answers, tabSwitchCount, timePenalty, violations: violations.length,
        trustScore: finalTrust, browserFingerprint, mouseMovements: mouseMovements.length,
        keystrokes: keystrokeData.length, networkLatency, examWatermark, selfieVerified, faceMatchConfidence
      })).unwrap();
      
      toast.success(`✅ Exam submitted! Trust: ${finalTrust}%`);
      navigate('/results');
    } catch (error) {
      toast.error(error || 'Failed to submit');
      setSubmitted(false);
      setExamStarted(true);
    }
  }, [submitted, attemptId, answers, dispatch, navigate, calculateTrustScore, tabSwitchCount, timePenalty, violations.length, browserFingerprint, mouseMovements.length, keystrokeData.length, networkLatency, examWatermark, selfieVerified, faceMatchConfidence]);

  // FULLSCREEN & SECURITY LISTENERS
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch {
      setShowFullscreenWarning(true);
    }
  };

  const forceFullscreen = useCallback(() => {
    if (!examStarted || submitted) return;
    if (!document.fullscreenElement) {
      fullscreenExitAttempts.current += 1;
      setIsFullscreen(false);
      setShowFullscreenWarning(true);
      handleViolation('FULLSCREEN_EXIT', `Fullscreen exited`);
      enterFullscreen();
    }
  }, [examStarted, submitted, handleViolation]);

  // 1. IDENTITY CHECK & START EXAM
  const handleStartExam = async () => {
    if (faceLocked || starting) return;
    setStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      
      await new Promise(r => setTimeout(r, 1500)); // Wait for camera
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      toast.loading('Verifying identity...', { id: 'verify' });
      const resp = await api.post('/exams/verify-face-identity/', { image_data: imageData });
      toast.dismiss('verify');

      if (resp.data?.verified !== true) {
        alert(`❌ Face mismatch: ${resp.data?.error || 'You are not the registered student.'}`);
        setFaceAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_FACE_ATTEMPTS) {
            setFaceLocked(true);
            navigate('/exams');
          }
          return newAttempts;
        });
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      setSelfieVerified(true);
      setFaceMatchConfidence(resp.data.confidence);
      
      const result = await dispatch(startExam(id)).unwrap();
      setAttemptId(result.attempt_id);
      setQuestions(shuffleArray(result.questions));
      setTimeLeft(result.duration_minutes * 60);
      setExamStarted(true);
      setCameraActive(true);
      startTimeRef.current = Date.now();

      await enterFullscreen();

    } catch (err) {
      console.error(err);
      toast.error('Failed to start exam');
    } finally {
      setStarting(false);
    }
  };

  // 2. PROCTOR-VISION & AUDIO (Runs when exam starts)
  useEffect(() => {
    if (!examStarted || !videoRef.current) return;

    // --- A. Audio Detection ---
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setNoiseLevel(average);
        if (average > 60 && !examScreenHidden) {
          setExamScreenHidden(true);
          setViolationMsg('🚫 High background noise detected.');
          setTimeout(() => setExamScreenHidden(false), 3000);
        }
        requestAnimationFrame(checkAudio);
      };
      checkAudio();
      setMicActive(true);
    } catch (e) { console.log("Audio error", e); }

    // --- B. Proctor-Vision Multi-Face Detection ---
    const initProctor = async () => {
      proctorRef.current = createProctor({
        features: { multiplePerson: { enabled: true, sensitivity: 0.6 } }
      });

      proctorRef.current.on("violation", (event) => {
        if (event.type === 'multiplePerson') {
          setExamScreenHidden(true);
          setViolationMsg(event.message || "Multiple people detected");
        }
      });

      proctorRef.current.on("violationEnd", (event) => {
        if (event.type === 'multiplePerson') {
          setExamScreenHidden(false);
          setViolationMsg('');
        }
      });

      await proctorRef.current.start(videoRef.current);
    };
    initProctor();

    return () => {
      if (proctorRef.current) proctorRef.current.stop();
      try { audioContextRef.current?.close(); } catch {}
    };
  }, [examStarted, examScreenHidden]);

  // 3. OTHER SECURITY HEARTBEATS (Tabs, Mouse, Keystrokes)
  useEffect(() => {
    if (!examStarted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        handleViolation('TAB_SWITCH', 'Tab switched');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, handleViolation]);

  // UI RENDER
  if (!examStarted) {
    return (
      <div className="start-exam-container">
        <div className="start-exam-card">
          <div className="start-exam-content">
            <ShieldAlert className="start-exam-icon" />
            <h2 className="start-exam-title">Ultra-Secure Exam Mode</h2>
            {faceLocked && <div style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8 }}>🔒 Locked. Redirecting...</div>}
            <div className="instructions-list">
              <p className="instruction-item">📷 <strong>Face verified before exam</strong></p>
              <p className="instruction-item">🚫 <strong>Wrong face = blocked</strong></p>
              <p className="instruction-item">👥 <strong>2+ faces = screen hidden</strong></p>
              <p className="instruction-item">🎤 <strong>Microphone monitoring</strong></p>
            </div>
            <div className="camera-preview">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" width={320} height={240} />
            </div>
            <button onClick={handleStartExam} disabled={starting || faceLocked} className="start-exam-btn">
              {faceLocked ? '🔒 Locked Out' : starting ? '⏳ Verifying...' : 'Start Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-container" style={{ position: 'relative' }}>
      {/* BLACK OVERLAY */}
      {examScreenHidden && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000000', zIndex: 99999999, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center'
        }}>
          <EyeOff size={80} color="#ef4444" />
          <h1 style={{ color: '#ef4444', fontSize: 32 }}>VIOLATION DETECTED</h1>
          <h2>{violationMsg}</h2>
          <p>The exam is hidden until resolved.</p>
        </div>
      )}

      {/* EXAM HEADER & QUESTIONS */}
      <div className="exam-header">
        <div className="exam-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="camera-status"><Camera size={16} /> {cameraActive ? '🟢' : '🔴'}</div>
            <div className="camera-status"><Mic size={16} /> {micActive ? '🎤' : '🔇'}</div>
            <div className="security-indicator"><ShieldCheck size={14} /> {calculateTrustScore()}%</div>
            <div className="security-indicator"><UserCheck size={14} /> {selfieVerified ? '✅' : '❌'}</div>
          </div>
          <div className="timer"><Clock size={16} /> {formatTime(timeLeft)}</div>
        </div>
      </div>

      <video ref={videoRef} className="hidden-webcam" autoPlay playsInline muted />

      <div className="questions-container">
        {questions.map((q, i) => (
          <div key={q.id} className="question-card">
            <h3 className="question-text">Question {i + 1}: {q.text}</h3>
            {q.type === 'MCQ' && q.options && q.options.map((opt, oi) => (
              <label key={oi} className="mcq-option">
                <input type="radio" name={`q_${q.id}`} value={opt} onChange={(e) => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ))}
        <div className="submit-container">
          <button onClick={handleSubmit} disabled={submitted || examScreenHidden} className="submit-btn">
            {submitted ? 'Submitting...' : examScreenHidden ? '🚫 Multiple faces' : '📤 Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;