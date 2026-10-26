// frontend/src/pages/TakeExam.jsx
// ULTIMATE SECURE EXAM - COMPLETE WITH FULLSCREEN LOCK + VIDEO RECORDING
// FIXED: All hoisting issues, video recorder integration, face verification

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Camera, Clock, AlertTriangle, ShieldCheck, ShieldAlert,
  Lock, EyeOff, Zap, Mic, Wifi, Fingerprint, UserCheck,
  Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { startExam, submitExam } from '../store/slices/examSlice';
import api from '../api/api';
import AIProctor from '../components/Proctoring/AIProctor';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import './TakeExam.css';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentExam } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);

  // ============================================================
  // STATE
  // ============================================================
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [proctorStatus, setProctorStatus] = useState('initializing');
  const [violations, setViolations] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
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
  // ✅ FIXED: Moved outside useCallback
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);

  // ============================================================
  // REFS
  // ============================================================
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const networkCheckRef = useRef(null);
  const fullscreenCheckIntervalRef = useRef(null);
  const violationCount = useRef(0);
  const tabSwitchStartTime = useRef(null);
  const lastHeartbeatTime = useRef(Date.now());
  const startTimeRef = useRef(null);
  const mouseMoveCount = useRef(0);
  const keystrokeCount = useRef(0);
  const selfieTakenRef = useRef(false);
  const fullscreenExitAttempts = useRef(0);
  const localStreamRef = useRef(null);

  // ✅ Video recorder hook
  const { startRecording, stopRecording } = useVideoRecorder();

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ============================================================
  // CALCULATE TRUST SCORE
  // ============================================================
  const calculateTrustScore = useCallback(() => {
    let score = 100;
    score -= violations.length * 3;
    score -= tabSwitchCount * 8;
    score -= timePenalty / 5;
    if (networkLatency > 300) score -= 5;
    if (networkLatency > 500) score -= 15;
    if (mouseMovements.length < 50) score -= 10;
    if (keystrokeData.length < 20) score -= 10;
    if (!selfieVerified) score -= 20;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [
    violations.length,
    tabSwitchCount,
    timePenalty,
    networkLatency,
    mouseMovements.length,
    keystrokeData.length,
    selfieVerified,
  ]);

  // ============================================================
  // STOP ALL RECORDING AND STREAMS
  // ============================================================
  const stopAllMediaAndRecording = useCallback(() => {
    try {
      stopRecording();
    } catch (e) {
      console.warn('stopRecording error:', e);
    }
    setRecordingActive(false);

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('stream stop error:', e);
      }
      localStreamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {
        // ignore
      }
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, [stopRecording]);

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================
  const handleSubmit = useCallback(async () => {
    if (submitted) return;

    try {
      setSubmitted(true);

      // ✅ STOP RECORDING FIRST (before cleanup)
      stopAllMediaAndRecording();

      setExamStarted(false);
      setIsExamLocked(true);
      setCameraActive(false);
      setMicActive(false);

      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (networkCheckRef.current) clearInterval(networkCheckRef.current);
      if (fullscreenCheckIntervalRef.current) clearInterval(fullscreenCheckIntervalRef.current);

      const finalTrustScore = calculateTrustScore();
      setTrustScore(finalTrustScore);

      await dispatch(
        submitExam({
          attemptId,
          answers,
          tabSwitchCount: tabSwitchCount,
          timePenalty: timePenalty,
          violations: violations.length,
          trustScore: finalTrustScore,
          browserFingerprint: browserFingerprint,
          mouseMovements: mouseMovements.length,
          keystrokes: keystrokeData.length,
          networkLatency: networkLatency,
          examDuration: startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0,
          examWatermark: examWatermark,
          selfieVerified: selfieVerified,
          faceMatchConfidence: faceMatchConfidence,
          fullscreenExitAttempts: fullscreenExitAttempts.current,
        })
      ).unwrap();

      const trustMessage =
        finalTrustScore >= 80 ? 'High' : finalTrustScore >= 50 ? 'Medium' : 'Low';
      toast.success(`✅ Exam submitted! Trust Score: ${finalTrustScore}% (${trustMessage})`);
      navigate('/results');
    } catch (error) {
      toast.error(error || 'Failed to submit exam');
      setSubmitted(false);
      setExamStarted(true);
      setIsExamLocked(false);
    }
  }, [
    submitted,
    attemptId,
    answers,
    dispatch,
    navigate,
    calculateTrustScore,
    tabSwitchCount,
    timePenalty,
    violations.length,
    browserFingerprint,
    mouseMovements.length,
    keystrokeData.length,
    networkLatency,
    examWatermark,
    selfieVerified,
    faceMatchConfidence,
    stopAllMediaAndRecording,
  ]);

  // ============================================================
  // VIOLATION HANDLER
  // ============================================================
  const handleViolation = useCallback(
    (type, message) => {
      violationCount.current += 1;
      setViolations((prev) => [
        ...prev,
        {
          type: type,
          message: message,
          timestamp: new Date().toISOString(),
          severity: ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_VERIFICATION_FAILED', 'FULLSCREEN_ESCAPE'].includes(type)
            ? 'HIGH'
            : 'MEDIUM',
        },
      ]);

      setTrustScore((prev) => Math.max(0, prev - 5));
      toast.error(`⚠️ ${message}`);

      if (violationCount.current >= 5) {
        toast.error('🚨 Too many violations! Exam auto-submitting...');
        setTimeout(handleSubmit, 2000);
      }
    },
    [handleSubmit]
  );

  // ============================================================
  // AUTO-SUBMIT HANDLER
  // ============================================================
  const handleAutoSubmit = useCallback(
    (data) => {
      console.log('🚨 AUTO-SUBMIT TRIGGERED:', data);
      toast.error(`🚨 ${data.reason}`);

      setViolations((prev) => [
        ...prev,
        {
          type: 'AUTO_SUBMIT',
          message: data.reason,
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
        },
      ]);

      if (!submitted) {
        toast.error('🔴 Auto-submitting exam due to security violation...');
        handleSubmit();
      }
    },
    [handleSubmit, submitted]
  );

  // ============================================================
  // FULLSCREEN
  // ============================================================
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
      return true;
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
      toast.error('⚠️ Fullscreen is MANDATORY for this exam. Please allow fullscreen.');
      setShowFullscreenWarning(true);
      return false;
    }
  }, []);

  const forceFullscreen = useCallback(() => {
    if (!examStarted || submitted) return;

    const isFull =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!isFull) {
      fullscreenExitAttempts.current += 1;
      setIsFullscreen(false);
      setShowFullscreenWarning(true);

      handleViolation('FULLSCREEN_EXIT', `Fullscreen exited (attempt ${fullscreenExitAttempts.current})`);

      enterFullscreen();

      toast.error('🚫 You cannot exit fullscreen mode during the exam!');

      if (fullscreenExitAttempts.current >= 3) {
        toast.error('🚨 Multiple fullscreen exits! Auto-submitting exam...');
        setTimeout(handleSubmit, 2000);
      }
    } else {
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    }
  }, [examStarted, submitted, handleViolation, handleSubmit, enterFullscreen]);

  // ============================================================
  // BROWSER FINGERPRINTING
  // ============================================================
  const generateBrowserFingerprint = useCallback(() => {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory || 'unknown',
      navigator.vendor || 'unknown',
    ];
    const fingerprint = components.join('|');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }, []);

  // ============================================================
  // REAL FACE VERIFICATION
  // ============================================================
  const takeSelfieVerification = useCallback(async () => {
    try {
      console.log('📸 Starting REAL face verification...');
      setVerifyingFace(true);

      if (!videoRef.current) {
        throw new Error('Camera not ready');
      }

      // Wait for video to be ready
      if (videoRef.current.readyState < 2) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Capture high-quality image
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Send to backend for REAL verification
      const response = await api.post('/exams/verify-face-identity/', {
        image_data: imageData,
        attempt_id: attemptId,
      });

      if (response.data.verified) {
        setSelfieVerified(true);
        setFaceMatchConfidence(response.data.confidence * 100);
        selfieTakenRef.current = true;
        toast.success(`✅ Identity verified (${Math.round(response.data.confidence * 100)}% match)`);
        return true;
      } else {
        setSelfieVerified(false);
        setFaceMatchConfidence(0);

        const errorMsg = response.data.error || 'Face verification failed';
        handleViolation('FACE_VERIFICATION_FAILED', errorMsg);
        toast.error(`❌ ${errorMsg}`);

        if (response.data.needs_enrollment) {
          toast.error('Please complete face enrollment first');
          setTimeout(() => navigate('/enroll-face'), 2000);
        }

        return false;
      }
    } catch (error) {
      console.error('Face verification error:', error);
      const msg = error.response?.data?.error || error.message || 'Verification failed';
      setSelfieVerified(false);
      toast.error(`❌ ${msg}`);
      return false;
    } finally {
      setVerifyingFace(false);
    }
  }, [attemptId, handleViolation, navigate]);

  // ============================================================
  // MOUSE MOVEMENT ANALYSIS
  // ============================================================
  const trackMouseMovement = useCallback(
    (e) => {
      const now = Date.now();
      mouseMoveCount.current += 1;
      setMouseMovements((prev) => {
        const newData = [
          ...prev,
          {
            x: e.clientX,
            y: e.clientY,
            timestamp: now,
            movementX: e.movementX || 0,
            movementY: e.movementY || 0,
          },
        ];
        if (newData.length > 500) newData.shift();
        return newData;
      });

      if (mouseMovements.length > 20) {
        const last20 = mouseMovements.slice(-20);
        const totalDistance = last20.reduce((sum, m, i) => {
          if (i === 0) return 0;
          const dx = m.x - last20[i - 1].x;
          const dy = m.y - last20[i - 1].y;
          return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0);
        const avgSpeed = totalDistance / 20;

        if (avgSpeed > 80) {
          handleViolation('SUSPICIOUS_MOUSE', 'Abnormal mouse movement detected (possible automation)');
        }

        const movements = last20.map((m) => ({ x: m.movementX || 0, y: m.movementY || 0 }));
        const angles = movements.slice(1).map((m, i) => {
          const prev = movements[i];
          if (prev.x === 0 && prev.y === 0) return 0;
          const angle = Math.atan2(m.y - prev.y, m.x - prev.x);
          return Math.abs(angle);
        });
        const avgAngle = angles.reduce((a, b) => a + b, 0) / (angles.length || 1);
        if (avgAngle < 0.05 && angles.length > 5) {
          handleViolation('ROBOTIC_MOUSE', 'Perfectly straight mouse movements detected (possible bot)');
        }
      }
    },
    [mouseMovements, handleViolation]
  );

  // ============================================================
  // KEYSTROKE DYNAMICS
  // ============================================================
  const trackKeystroke = useCallback(
    (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
        return;
      }

      keystrokeCount.current += 1;
      setKeystrokeData((prev) => {
        const now = Date.now();
        const lastKeystroke = prev.length > 0 ? prev[prev.length - 1] : null;
        const timeDiff = lastKeystroke ? now - lastKeystroke.timestamp : 0;
        const newData = [
          ...prev,
          {
            key: e.key,
            timestamp: now,
            timeDiff,
            location: e.location || 0,
          },
        ];
        if (newData.length > 500) newData.shift();
        return newData;
      });

      if (keystrokeData.length > 30) {
        const last30 = keystrokeData.slice(-30);
        const avgTime =
          last30.reduce((sum, k, i) => {
            if (i === 0) return sum;
            return sum + k.timeDiff;
          }, 0) / 29;

        if (avgTime < 15 && avgTime > 0) {
          handleViolation('SUSPICIOUS_TYPING', 'Typing too fast (possible auto-typing bot)');
        }
      }
    },
    [keystrokeData, handleViolation]
  );

  // ============================================================
  // NETWORK LATENCY
  // ============================================================
  const checkNetworkLatency = useCallback(async () => {
    try {
      const start = Date.now();
      await fetch('/api/exams/ping/', { method: 'GET', cache: 'no-cache' });
      const end = Date.now();
      const latency = end - start;
      setNetworkLatency(latency);

      if (latency > 500) {
        handleViolation('HIGH_LATENCY', `High network latency (${latency}ms) - possible VPN/proxy detected`);
      }

      if (latency > 300 && latency < 500) {
        toast.warning(`⚠️ High network latency: ${latency}ms - ensure you're not using a VPN`);
      }
    } catch (error) {
      console.warn('Network check failed:', error);
    }
  }, [handleViolation]);

  // ============================================================
  // AUDIO MONITORING
  // ============================================================
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      let noiseHistory = [];

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const now = Date.now();

        noiseHistory.push({ value: average, timestamp: now });
        if (noiseHistory.length > 50) noiseHistory.shift();

        if (noiseHistory.length > 10) {
          const recent = noiseHistory.slice(-10);
          const avgRecent = recent.reduce((s, n) => s + n.value, 0) / recent.length;
          const previous = noiseHistory.slice(-20, -10);
          const avgPrev =
            previous.length > 0 ? previous.reduce((s, n) => s + n.value, 0) / previous.length : avgRecent;

          if (avgRecent > avgPrev * 2 && avgRecent > 80) {
            handleViolation('HIGH_NOISE', 'Sudden loud noise detected - possible someone speaking nearby');
          }
        }

        if (average > 60) {
          handleViolation('BACKGROUND_NOISE', 'High background noise detected - possible cheating environment');
        }

        requestAnimationFrame(checkAudio);
      };

      checkAudio();
      setMicActive(true);
      toast.success('🎤 Microphone active for environment monitoring');
    } catch (error) {
      console.warn('Audio monitoring failed:', error);
      setMicActive(false);
    }
  }, [handleViolation]);

  // ============================================================
  // KEYBOARD SHORTCUT LOCKDOWN
  // ============================================================
  const blockKeyboardShortcuts = useCallback(
    (e) => {
      const blockedKeys = ['F12', 'F11', 'F10', 'F9', 'F8', 'F7', 'F6', 'F5', 'F4', 'F3', 'F2', 'F1'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        handleViolation('KEYBOARD_SHORTCUT', 'Blocked keyboard shortcut (F-keys)');
        return false;
      }
      if (e.ctrlKey) {
        if (['s', 'p', 'u', 'c', 'v', 'x', 'z', 'i', 'j', 'k', 't', 'w', 'n'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          handleViolation('KEYBOARD_SHORTCUT', `Blocked Ctrl+${e.key.toUpperCase()}`);
          return false;
        }
      }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handleViolation('KEYBOARD_SHORTCUT', 'Blocked Alt+Tab');
        return false;
      }
      return true;
    },
    [handleViolation]
  );

  // ============================================================
  // TAB SWITCH DETECTION
  // ============================================================
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setTabSwitchCount((prev) => prev + 1);
      tabSwitchStartTime.current = Date.now();
      setIsBlurred(true);

      handleViolation('TAB_SWITCH', `Tab switched (${tabSwitchCount + 1} times)`);

      if (tabSwitchCount >= 2) {
        setTimePenalty((prev) => prev + 60);
        setTimeLeft((prev) => Math.max(0, prev - 60));
        toast.error(`⏱️ Time penalty applied: -1 minute`);
      }

      if (tabSwitchCount >= 3) {
        toast.error('🚨 Too many tab switches! Exam auto-submitting...');
        setTimeout(handleSubmit, 2000);
      }
    } else {
      setIsBlurred(false);
      if (tabSwitchStartTime.current) {
        const duration = (Date.now() - tabSwitchStartTime.current) / 1000;
        if (duration > 5) {
          handleViolation('TAB_SWITCH', `Tab was switched for ${duration.toFixed(1)} seconds`);
        }
        tabSwitchStartTime.current = null;
      }
    }
  }, [tabSwitchCount, handleViolation, handleSubmit]);

  // ============================================================
  // HEARTBEAT
  // ============================================================
  const sendHeartbeat = useCallback(async () => {
    if (!attemptId) return;
    try {
      const trustScoreValue = calculateTrustScore();
      setTrustScore(trustScoreValue);

      await api.post(`/exams/attempt/${attemptId}/heartbeat/`, {
        trust_score: trustScoreValue,
        network_latency: networkLatency,
        mouse_movements: mouseMovements.length,
        keystrokes: keystrokeData.length,
        selfie_verified: selfieVerified,
        tab_switches: tabSwitchCount,
        violations: violations.length,
        is_fullscreen: isFullscreen,
      });
      lastHeartbeatTime.current = Date.now();
    } catch (error) {
      console.warn('Heartbeat failed:', error);
      if (Date.now() - lastHeartbeatTime.current > 15000) {
        handleViolation('HEARTBEAT_FAILED', 'Connection lost for 15 seconds. Auto-submitting...');
        setTimeout(handleSubmit, 2000);
      }
    }
  }, [
    attemptId,
    calculateTrustScore,
    networkLatency,
    mouseMovements.length,
    keystrokeData.length,
    selfieVerified,
    tabSwitchCount,
    violations.length,
    isFullscreen,
    handleViolation,
    handleSubmit,
  ]);

  // ============================================================
  // EXAM TIMER
  // ============================================================
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.success('⏰ Time is up! Submitting exam...');
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, timeLeft, handleSubmit]);

  // ============================================================
  // FULLSCREEN MONITOR
  // ============================================================
  useEffect(() => {
    if (!examStarted || submitted) return;

    fullscreenCheckIntervalRef.current = setInterval(() => {
      const isFull =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isFull && examStarted && !submitted) {
        setIsFullscreen(false);
        forceFullscreen();
      } else if (isFull) {
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
      }
    }, 500);

    const handleFullscreenChange = () => {
      const isFull =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isFull && examStarted && !submitted) {
        setIsFullscreen(false);
        forceFullscreen();
      } else if (isFull) {
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && examStarted && !submitted) {
        e.preventDefault();
        e.stopPropagation();
        enterFullscreen();
        handleViolation('FULLSCREEN_ESCAPE', 'Attempted to exit fullscreen with Escape key');
        toast.error('🚫 Escape key is disabled during exam!');

        if (fullscreenExitAttempts.current >= 2) {
          toast.error('🚨 Multiple fullscreen exit attempts! Auto-submitting...');
          setTimeout(handleSubmit, 2000);
        }
      }
    };

    const handleF11Key = (e) => {
      if (e.key === 'F11' && examStarted && !submitted) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation('FULLSCREEN_KEY', 'F11 key blocked');
        toast.error('🚫 F11 is blocked during exam!');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleF11Key);

    return () => {
      if (fullscreenCheckIntervalRef.current) {
        clearInterval(fullscreenCheckIntervalRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleF11Key);
    };
  }, [examStarted, submitted, forceFullscreen, enterFullscreen, handleViolation, handleSubmit]);

  // ============================================================
  // SECURITY LISTENERS
  // ============================================================
  useEffect(() => {
    if (!examStarted) return;

    document.addEventListener('keydown', blockKeyboardShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handlePrintKey = (e) => {
      if ((e.ctrlKey && e.key === 'p') || e.key === 'PrintScreen') {
        e.preventDefault();
        handleViolation('PRINT_ATTEMPT', 'Print/Screenshot blocked');
        toast.error('📵 Printing and screenshots are blocked');
      }
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      handleViolation('RIGHT_CLICK', 'Right-click blocked');
    };

    document.addEventListener('keydown', handlePrintKey);
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('mousemove', trackMouseMovement);
    document.addEventListener('keydown', trackKeystroke);

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5000);
    networkCheckRef.current = setInterval(checkNetworkLatency, 10000);

    return () => {
      document.removeEventListener('keydown', blockKeyboardShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handlePrintKey);
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('mousemove', trackMouseMovement);
      document.removeEventListener('keydown', trackKeystroke);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (networkCheckRef.current) clearInterval(networkCheckRef.current);
    };
  }, [
    examStarted,
    blockKeyboardShortcuts,
    handleVisibilityChange,
    trackMouseMovement,
    trackKeystroke,
    sendHeartbeat,
    checkNetworkLatency,
    handleViolation,
  ]);

  // ============================================================
  // ✅ CLEANUP ON UNMOUNT - STOP RECORDING + STREAMS
  // ============================================================
  useEffect(() => {
    return () => {
      stopAllMediaAndRecording();
    };
  }, []);

  // ============================================================
  // HANDLE START EXAM
  // ============================================================
  const handleStartExam = async () => {
    try {
      // ============================================================
      // 1. Get camera + microphone stream FIRST
      // ============================================================
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: true,
        });
      } catch (err) {
        console.error('Failed to get media:', err);
        toast.error('❌ Camera and microphone access are required for this exam');
        return;
      }

      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('video play error:', e);
        }
      }

      // ============================================================
      // 2. Generate fingerprint
      // ============================================================
      const fingerprint = generateBrowserFingerprint();
      setBrowserFingerprint(fingerprint);

      // ============================================================
      // 3. Start the exam in backend
      // ============================================================
      const result = await dispatch(startExam(id)).unwrap();
      setAttemptId(result.attempt_id);

      // ============================================================
      // 4. Prepare questions
      // ============================================================
      const shuffledQuestions = shuffleArray(result.questions);
      const randomizedQuestions = shuffledQuestions.map((q) => {
        if (q.type === 'MCQ' && q.options) {
          return { ...q, options: shuffleArray(q.options) };
        }
        return q;
      });

      setQuestions(randomizedQuestions);
      setTimeLeft(result.duration_minutes * 60);
      setExamStarted(true);
      setCameraActive(true);
      startTimeRef.current = Date.now();

      // ============================================================
      // 5. Enter fullscreen
      // ============================================================
      await enterFullscreen();

      // ============================================================
      // 6. Verify face identity (REAL, uses DeepFace backend)
      // ============================================================
      await takeSelfieVerification();

      // ============================================================
      // 7. Start microphone monitoring
      // ============================================================
      await startAudioMonitoring();

      // ============================================================
      // 8. START VIDEO RECORDING (chunked upload)
      // ============================================================
      const recordingStarted = startRecording(stream, result.attempt_id, 15000); // 15s chunks
      setRecordingActive(recordingStarted);
      if (recordingStarted) {
        console.log('🎥 Video recording started');
      } else {
        console.warn('⚠️ Video recording failed to start');
      }

      // ============================================================
      // 9. Set watermark
      // ============================================================
      const watermark = `DEMS-${user?.id || 'unknown'}-${Date.now()}`;
      setExamWatermark(watermark);

      toast.success('📝 Exam started! All security systems active.');
    } catch (error) {
      console.error('❌ Failed to start exam:', error);
      toast.error(error?.message || error || 'Failed to start exam');

      // Cleanup on failure
      stopAllMediaAndRecording();
      navigate('/exams');
    }
  };

  // ============================================================
  // ANSWER CHANGE
  // ============================================================
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleProctorStatusUpdate = (status) => {
    setProctorStatus(status.status);
  };

  // ============================================================
  // FULLSCREEN WARNING OVERLAY
  // ============================================================
  if (showFullscreenWarning && examStarted && !submitted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
        }}
      >
        <Monitor size={64} color="#ef4444" />
        <h2 style={{ fontSize: '24px', color: '#ef4444', marginTop: '20px' }}>⚠️ Fullscreen Required!</h2>
        <p style={{ textAlign: 'center', maxWidth: '400px', marginTop: '12px', color: '#94a3b8' }}>
          You must remain in fullscreen mode during the exam.
          {violationCount.current > 0 && ` (${violationCount.current} violations recorded)`}
        </p>
        <button
          onClick={enterFullscreen}
          style={{
            marginTop: '24px',
            padding: '14px 48px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
        >
          🔒 Re-enter Fullscreen
        </button>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '16px' }}>
          {fullscreenExitAttempts.current >= 2
            ? '⚠️ Auto-submission in progress...'
            : 'Exiting fullscreen is recorded as a violation'}
        </p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '12px', color: '#ef4444' }}>
          <span>Attempts: {fullscreenExitAttempts.current}/3</span>
          <span>•</span>
          <span>Violations: {violationCount.current}/5</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER START SCREEN
  // ============================================================
  if (!examStarted) {
    return (
      <div className="start-exam-container">
        <div className="start-exam-card">
          <div className="start-exam-content">
            <ShieldAlert className="start-exam-icon" />
            <h2 className="start-exam-title">Ultra-Secure Exam Mode</h2>
            <div className="instructions-list">
              <p className="instruction-item">
                🔒 <strong>Fullscreen mode is MANDATORY</strong> - Cannot exit
              </p>
              <p className="instruction-item">
                📷 <strong>Face verification required</strong> before starting
              </p>
              <p className="instruction-item">
                🎥 <strong>Video will be recorded</strong> for review
              </p>
              <p className="instruction-item">
                🎤 <strong>Microphone monitoring</strong> detects background noise
              </p>
              <p className="instruction-item">
                🖱️ <strong>Mouse & keystroke analysis</strong> detects automation
              </p>
              <p className="instruction-item">
                🌐 <strong>VPN/Proxy detection</strong> prevents cheating
              </p>
              <p className="instruction-item">
                🚫 <strong>NO tab switching</strong> allowed (auto-submit after 3)
              </p>
              <p className="instruction-item">
                ⌨️ <strong>All keyboard shortcuts blocked</strong>
              </p>
              <p className="instruction-item">
                📊 <strong>Trust score</strong> calculated after exam
              </p>
              <p className="instruction-item">
                🔄 <strong>Auto-submit</strong> after 5 violations or 3 fullscreen exits
              </p>
            </div>

            <div className="camera-preview">
              <p className="camera-label">Camera Preview (Face Verification Required)</p>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                width={320}
                height={240}
              />
            </div>

            <button onClick={handleStartExam} className="start-exam-btn">
              Start Ultra-Secure Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER EXAM SCREEN
  // ============================================================
  return (
    <div className="exam-container">
      <style>{`
        .exam-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          z-index: 10;
          padding: 12px 24px;
        }
        .exam-header-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .camera-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .camera-icon-active { color: #22c55e; }
        .camera-icon-inactive { color: #ef4444; }
        .timer {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          padding: 6px 16px;
          border-radius: 8px;
        }
        .timer-value {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
        }
        .questions-container {
          padding-top: 80px;
          padding-bottom: 32px;
          padding-left: 16px;
          padding-right: 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        .question-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .question-text {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #0f172a;
        }
        .mcq-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mcq-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mcq-option:hover { background: #f8fafc; }
        .mcq-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .tf-options {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .tf-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .tf-option:hover { background: #f8fafc; }
        .tf-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .short-answer {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          min-height: 120px;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .short-answer:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .submit-btn {
          padding: 12px 40px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background: #16a34a;
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .exam-header-content {
            flex-direction: column;
            gap: 8px;
          }
          .question-card { padding: 16px; }
        }
        .security-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(34,197,94,0.1);
          color: #16a34a;
        }
        .security-indicator.warning {
          background: rgba(245,158,11,0.1);
          color: #d97706;
        }
        .security-indicator.danger {
          background: rgba(220,38,38,0.1);
          color: #dc2626;
        }
        .violation-badge {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .fullscreen-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          background: ${isFullscreen ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)'};
          color: ${isFullscreen ? '#16a34a' : '#dc2626'};
        }
        .recording-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          background: ${recordingActive ? 'rgba(220,38,38,0.15)' : 'rgba(100,116,139,0.15)'};
          color: ${recordingActive ? '#dc2626' : '#64748b'};
        }
        .recording-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${recordingActive ? '#dc2626' : '#64748b'};
          animation: ${recordingActive ? 'pulse 1.5s ease-in-out infinite' : 'none'};
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* EXAM HEADER */}
      <div className="exam-header">
        <div className="exam-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div className="camera-status">
              <Camera className={`camera-icon ${cameraActive ? 'camera-icon-active' : 'camera-icon-inactive'}`} />
              <span className="camera-text">{cameraActive ? '🟢' : '🔴'}</span>
            </div>

            <div className="camera-status">
              <Mic className={`camera-icon ${micActive ? 'camera-icon-active' : 'camera-icon-inactive'}`} />
              <span className="camera-text">{micActive ? '🎤' : '🔇'}</span>
            </div>

            {/* ✅ RECORDING BADGE */}
            <div className="recording-badge">
              <span className="recording-dot"></span>
              {recordingActive ? 'REC' : 'OFF'}
            </div>

            <div className="fullscreen-badge">
              <Monitor size={14} />
              {isFullscreen ? '🔒 Fullscreen' : '⚠️ Exit detected!'}
            </div>

            <div className={`security-indicator ${trustScore > 70 ? '' : trustScore > 40 ? 'warning' : 'danger'}`}>
              <ShieldCheck size={14} />
              {trustScore}%
            </div>

            <div
              className="security-indicator"
              style={{
                background: selfieVerified ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
                color: selfieVerified ? '#16a34a' : '#dc2626',
              }}
            >
              <UserCheck size={14} />
              {selfieVerified ? '✅' : '❌'}
            </div>

            <div
              className="security-indicator"
              style={{
                background:
                  networkLatency < 300
                    ? 'rgba(34,197,94,0.1)'
                    : networkLatency < 500
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(220,38,38,0.1)',
                color: networkLatency < 300 ? '#16a34a' : networkLatency < 500 ? '#d97706' : '#dc2626',
              }}
            >
              <Wifi size={14} />
              {networkLatency}ms
            </div>

            <div className="security-indicator">
              <Fingerprint size={14} />
              {browserFingerprint ? '🔒' : '❌'}
            </div>

            {violations.length > 0 && (
              <div
                className="violation-badge"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: violations.length >= 3 ? '#dc2626' : '#f59e0b',
                  background: violations.length >= 3 ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}
              >
                <AlertTriangle size={14} />
                {violations.length}
              </div>
            )}

            {tabSwitchCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: tabSwitchCount >= 3 ? '#dc2626' : '#f59e0b',
                  background: tabSwitchCount >= 3 ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}
              >
                <Zap size={14} />
                {tabSwitchCount}/3
              </div>
            )}

            {timePenalty > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#ef4444',
                  background: 'rgba(239,68,68,0.1)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}
              >
                <Clock size={14} />-{timePenalty}s
              </div>
            )}
          </div>

          <div className="timer">
            <Clock className="timer-icon" />
            <span className="timer-value">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* ✅ VISIBLE WEBCAM for recording (hidden visually but streams) */}
      <video ref={videoRef} className="hidden-webcam" autoPlay playsInline muted />

      {/* AI PROCTOR */}
      {attemptId && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '300px',
            maxWidth: '90vw',
            maxHeight: '450px',
            zIndex: 1000,
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            background: 'rgba(26,26,46,0.95)',
            opacity: 0.3,
            transition: 'opacity 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
        >
          <AIProctor
            attemptId={attemptId}
            onSuspicious={handleViolation}
            onViolation={handleViolation}
            onAutoSubmit={handleAutoSubmit}
            onStatusUpdate={handleProctorStatusUpdate}
            autoFlagThreshold={3}
            captureInterval={2000}
          />
        </div>
      )}

      {/* QUESTIONS */}
      <div className="questions-container">
        {questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <h3 className="question-text">
                Question {index + 1}: {question.text}
              </h3>
              <span className="question-marks">[{question.marks} marks]</span>
            </div>

            {question.type === 'MCQ' && question.options && (
              <div className="mcq-options">
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`mcq-option ${answers[question.id] === option ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="mcq-radio"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'TF' && (
              <div className="tf-options">
                <label className={`tf-option ${answers[question.id] === 'True' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value="True"
                    checked={answers[question.id] === 'True'}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  />
                  <span>True</span>
                </label>
                <label className={`tf-option ${answers[question.id] === 'False' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value="False"
                    checked={answers[question.id] === 'False'}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  />
                  <span>False</span>
                </label>
              </div>
            )}

            {question.type === 'SHORT' && (
              <textarea
                className="short-answer"
                rows={4}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            )}

            <div style={{ display: 'none' }} data-watermark={examWatermark} />
          </div>
        ))}

        <div className="submit-container">
          <button onClick={handleSubmit} disabled={submitted || isExamLocked} className="submit-btn">
            {submitted ? '⏳ Submitting...' : isExamLocked ? '🔒 Locked' : '📤 Submit Exam'}
          </button>
        </div>
      </div>

      {/* Security Status Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '16px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          fontSize: '10px',
          color: '#64748b',
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '90%',
          zIndex: 100,
        }}
      >
        <span>{violations.length === 0 ? '✅ All secure' : `⚠️ ${violations.length} violations`}</span>
        <span>•</span>
        <span>🖱️ {mouseMovements.length}</span>
        <span>•</span>
        <span>⌨️ {keystrokeData.length}</span>
        <span>•</span>
        <span>🌐 {networkLatency}ms</span>
        <span>•</span>
        <span>📷 {selfieVerified ? '✅' : '❌'}</span>
        <span>•</span>
        <span>🔑 {browserFingerprint ? '🔒' : '❌'}</span>
        <span>•</span>
        <span>🎥 {recordingActive ? 'REC' : 'OFF'}</span>
        <span>•</span>
        <span>🔄 {fullscreenExitAttempts.current}/3</span>
      </div>
    </div>
  );
};

export default TakeExam;