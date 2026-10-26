// frontend/src/components/Proctoring/AIProctor.jsx
// COMPLETE FIXED - With fallbacks, MediaPipe face detection, backend integration
// ✅ FIXED: addSuspiciousEvent moved above all callers to fix hoisting error

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarks from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
//import { Camera, AlertCircle, RefreshCw, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import proctoringService from '../../services/proctoringService';
import api from '../../api/api';

const AIProctor = ({
    onSuspicious,
    onViolation,
    examId,
    attemptId,
    studentId,
    autoFlagThreshold = 3,
    captureInterval = 2000,
    onStatusUpdate,
    onAutoSubmit
}) => {
    // ============================================================
    // REFS
    // ============================================================
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const eyeTrackingIntervalRef = useRef(null);
    const objectDetectionIntervalRef = useRef(null);
    const frameCaptureRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const networkCheckRef = useRef(null);
    const faceVerifyIntervalRef = useRef(null);
    const gazeIntervalRef = useRef(null);
    const objectSendIntervalRef = useRef(null);
    const mediapipeLoopRef = useRef(null);

    const isMounted = useRef(true);
    const streamRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;
    const faceLostFramesRef = useRef(0);
    const lastVideoTimeRef = useRef(-1);

    // MediaPipe FaceLandmarker ref
    const landmarkerRef = useRef(null);

    // Signal buffer for server-side trust engine
    const signalsBufferRef = useRef({
        faceLostCount: 0,
        multipleFaceCount: 0,
        gazeAwayCount: 0,
        eyesClosedCount: 0,
        headTiltCount: 0,
    });

    // ============================================================
    // STATE
    // ============================================================
    const [faceDetector, setFaceDetector] = useState(null);
    const [landmarkDetector, setLandmarkDetector] = useState(null);
    const [objectDetector, setObjectDetector] = useState(null);

    const [isRunning, setIsRunning] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState(null);

    const [faceDetected, setFaceDetected] = useState(false);
    const [faceLostCount, setFaceLostCount] = useState(0);
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [faceCount, setFaceCount] = useState(0);

    const [eyeStatus, setEyeStatus] = useState({
        status: 'OPEN',
        gazeDirection: 'CENTER',
        confidence: 0,
        leftEyeOpen: 1,
        rightEyeOpen: 1,
        gazeX: 0,
        gazeY: 0,
        leftEAR: 1,
        rightEAR: 1,
    });

    const [headPosition, setHeadPosition] = useState({
        position: 'CENTER',
        tiltX: 0,
        tiltY: 0,
        rotation: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
    });

    const [objectDetected, setObjectDetected] = useState([]);
    const [suspiciousEvents, setSuspiciousEvents] = useState([]);
    const [suspiciousCount, setSuspiciousCount] = useState(0);
    const [isFlagged, setIsFlagged] = useState(false);

    const [fps, setFps] = useState(0);
    const [lastFrameTime, setLastFrameTime] = useState(Date.now());
    const [captureCount, setCaptureCount] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);

    const [usingFallback, setUsingFallback] = useState(false);
    const [fallbackReason, setFallbackReason] = useState('');
    const [usingMediaPipe, setUsingMediaPipe] = useState(false);

    const [isExamLocked, setIsExamLocked] = useState(false);
    const [examLocked, setExamLocked] = useState(false);

    // Backend integration state
    const [trustScore, setTrustScore] = useState(100);
    const [networkLatency, setNetworkLatency] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [violations, setViolations] = useState([]);
    const [faceMatchConfidence, setFaceMatchConfidence] = useState(0);
    const [selfieVerified, setSelfieVerified] = useState(false);
    const [mouseMovements, setMouseMovements] = useState([]);
    const [keystrokeData, setKeystrokeData] = useState([]);

    // Extra state
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelLoadError, setModelLoadError] = useState(null);
    const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

    // ============================================================
    // ✅ HOISTED: SEND REAL-TIME DATA (moved above addSuspiciousEvent)
    // ============================================================
    const sendRealTimeData = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked) return;

        try {
            const calculatedTrustScore = Math.max(0, 100 - (suspiciousCount * 5) - (violations.length * 3));
            setTrustScore(calculatedTrustScore);

            const signals = signalsBufferRef.current;

            const data = {
                trust_score: calculatedTrustScore,
                network_latency: networkLatency,
                mouse_movements: mouseMovements.length,
                keystrokes: keystrokeData.length,
                tab_switches: tabSwitchCount,
                violations: violations.length,
                is_fullscreen: document.fullscreenElement !== null,
                face_detected: faceDetected,
                multiple_faces: multipleFaces,
                face_count: faceCount || (multipleFaces ? 2 : (faceDetected ? 1 : 0)),
                gaze_direction: eyeStatus.gazeDirection || 'CENTER',
                gaze_confidence: eyeStatus.confidence || 0,
                gaze_x: eyeStatus.gazeX || 0,
                gaze_y: eyeStatus.gazeY || 0,
                head_tilt_x: headPosition.tiltX || 0,
                head_tilt_y: headPosition.tiltY || 0,
                eyes_closed: eyeStatus.status === 'CLOSED',
                objects_detected: objectDetected || [],
                face_match_confidence: faceMatchConfidence,
                selfie_verified: selfieVerified,
                signals: {
                    face_lost_count: signals.faceLostCount,
                    multiple_face_count: signals.multipleFaceCount,
                    gaze_away_count: signals.gazeAwayCount,
                    eyes_closed_count: signals.eyesClosedCount,
                    head_tilt_count: signals.headTiltCount,
                },
            };

            const response = await api.post(`/exams/attempt/${attemptId}/heartbeat/`, data);

            if (response.data && response.data.is_locked) {
                setIsExamLocked(true);
                setExamLocked(true);
                toast.error(`🔒 Exam Locked: ${response.data.lock_reason || 'Suspicious activity detected'}`);
                onViolation?.('EXAM_LOCKED', response.data.lock_reason || 'Exam locked due to suspicious activity');
                return;
            }

            if (response.data && response.data.risk_score !== undefined) {
                setTrustScore(response.data.risk_score);
            }

            if (response.data && response.data.is_flagged) {
                setIsFlagged(true);
                toast.error(`🚨 ${response.data.flag_reason || 'Exam flagged for review'}`);
                onViolation?.('BACKEND_FLAGGED', response.data.flag_reason || 'Flagged by AI');

                if (!autoSubmitTriggered && onAutoSubmit) {
                    setAutoSubmitTriggered(true);
                    onAutoSubmit({
                        reason: response.data.flag_reason || 'Backend flagged exam',
                        type: 'BACKEND_FLAG',
                    });
                }
            }

            signalsBufferRef.current = {
                faceLostCount: 0,
                multipleFaceCount: 0,
                gazeAwayCount: 0,
                eyesClosedCount: 0,
                headTiltCount: 0,
            };
        } catch (error) {
            console.debug('Heartbeat error:', error.message);
        }
    }, [
        attemptId,
        isRunning,
        suspiciousCount,
        violations.length,
        networkLatency,
        mouseMovements.length,
        keystrokeData.length,
        tabSwitchCount,
        faceDetected,
        multipleFaces,
        faceCount,
        eyeStatus,
        headPosition,
        objectDetected,
        faceMatchConfidence,
        selfieVerified,
        onViolation,
        onAutoSubmit,
        autoSubmitTriggered,
        examLocked,
    ]);

    // ============================================================
    // ✅ HOISTED: SUSPICIOUS EVENT MANAGEMENT (moved above all callers)
    // ============================================================
    const addSuspiciousEvent = useCallback(
        (event) => {
            setSuspiciousEvents((prev) => {
                const newEvents = [event, ...prev].slice(0, 50);
                return newEvents;
            });

            setSuspiciousCount((prev) => {
                const newCount = prev + 1;

                if (newCount >= autoFlagThreshold) {
                    setIsFlagged(true);
                    setAutoSubmitTriggered(true);
                    onViolation?.('AUTO_FLAGGED', `Too many suspicious events (${newCount})`);
                    sendRealTimeData();

                    if (onAutoSubmit) {
                        onAutoSubmit({
                            reason: `Too many suspicious events (${newCount})`,
                            type: 'SUSPICIOUS_THRESHOLD',
                            count: newCount,
                        });
                    }
                }
                return newCount;
            });
        },
        [autoFlagThreshold, onViolation, onAutoSubmit, sendRealTimeData]
    );

    // ============================================================
    // SIMPLE FALLBACK FACE DETECTION (No AI)
    // ============================================================
    const fallbackDetectFace = useCallback(() => {
        if (!videoRef.current || !isMounted.current) return false;

        try {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 160, 120);

            const imageData = ctx.getImageData(0, 0, 160, 120);
            const data = imageData.data;

            let variance = 0;
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += data[i] + data[i + 1] + data[i + 2];
                if (i > 4) {
                    variance += Math.abs(data[i] - data[i - 4]) +
                        Math.abs(data[i + 1] - data[i - 3]) +
                        Math.abs(data[i + 2] - data[i - 2]);
                }
            }
            brightness = brightness / (data.length / 4);
            variance = variance / (data.length / 4);

            const hasVariation = variance > 15;
            const hasBrightness = brightness > 30 && brightness < 220;

            return hasVariation && hasBrightness;
        } catch (e) {
            console.warn('Fallback detection error:', e);
            return true;
        }
    }, []);

    // ============================================================
    // SEND FACE VERIFICATION TO BACKEND
    // ============================================================
    // ============================================================
    // SEND FACE VERIFICATION
    // ============================================================
    const sendFaceVerification = useCallback(async () => {
        if (!attemptId || !videoRef.current || !isRunning || examLocked) return;

        try {
            // ---- 1. Capture frame ----
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // ---- 2. Send to backend ----
            const response = await api.post(
                `/exams/attempt/${attemptId}/face-verify/`,
                {
                    image_data: imageData,
                    face_data: {
                        confidence: faceMatchConfidence || 0.8,
                        face_detected: faceDetected,
                        landmarks: {},
                    },
                }
            );

            // ---- 3. Handle successful (2xx) response ----
            if (response.data && response.data.verified !== undefined) {
                setSelfieVerified(response.data.verified);
                setFaceMatchConfidence(response.data.confidence || 0);

                // ✅ Identity mismatch (2xx but verified=false)
                if (response.data.verified === false) {
                    toast.error(
                        `🚨 Identity mismatch: ${
                            response.data.error || 'Face does not match'
                        }`
                    );
                    onViolation?.(
                        'FACE_IDENTITY_MISMATCH',
                        'Face does not match enrolled student'
                    );

                    if (response.data.is_locked) {
                        setIsExamLocked(true);
                        setExamLocked(true);
                        if (onAutoSubmit) {
                            onAutoSubmit({
                                reason:
                                    response.data.error ||
                                    'Exam locked: face identity mismatch',
                                type: 'FACE_LOCK',
                            });
                        }
                    }
                }

                // ✅ Server explicitly flagged the attempt
                if (response.data.is_flagged) {
                    toast.error(
                        `🚨 ${
                            response.data.error ||
                            response.data.flag_reason ||
                            'Face verification failed'
                        }`
                    );
                    onViolation?.(
                        'FACE_VERIFICATION_FAILED',
                        response.data.error ||
                            response.data.flag_reason ||
                            'Face verification failed'
                    );
                }

                // ✅ Locked state reported by backend
                if (response.data.is_locked) {
                    setIsExamLocked(true);
                    setExamLocked(true);
                }
            }
        } catch (error) {
            // ---- 4. Handle 4xx/5xx error responses ----
            // The backend returns HTTP 400 for identity mismatch,
            // so we must inspect error.response.data here.
            const data = error?.response?.data;

            if (data) {
                // Identity mismatch / face verification failure
                if (data.verified === false) {
                    setSelfieVerified(false);
                    setFaceMatchConfidence(data.confidence || 0);

                    const errMsg =
                        data.error ||
                        data.flag_reason ||
                        'Face does not match enrolled student';

                    toast.error(`🚨 ${errMsg}`);
                    onViolation?.('FACE_IDENTITY_MISMATCH', errMsg);

                    // Immediate lock
                    if (data.is_locked) {
                        setIsExamLocked(true);
                        setExamLocked(true);
                        if (onAutoSubmit) {
                            onAutoSubmit({
                                reason: errMsg,
                                type: 'FACE_LOCK',
                            });
                        }
                    }
                    // Flag threshold reached (e.g., 3+ failures)
                    else if (data.is_flagged) {
                        toast.error(
                            `🚨 Exam flagged (${
                                data.failure_count || '?'
                            } identity failures)`
                        );
                    }
                    // Failure but not yet flagged — log it silently
                    else if (typeof data.failure_count === 'number') {
                        console.warn(
                            `⚠️ Face identity failure #${data.failure_count}`
                        );
                    }
                }
                // Some other backend-side rejection (e.g., missing image)
                else if (data.error) {
                    console.warn('Face verification rejected:', data.error);
                }
            } else {
                // Network error / no response
                console.debug('Face verification error:', error);
            }
        }
    }, [
        attemptId,
        isRunning,
        faceDetected,
        faceMatchConfidence,
        onViolation,
        onAutoSubmit,
        examLocked,
    ]);

    // ============================================================
    // SEND GAZE DATA TO BACKEND
    // ============================================================
    const sendGazeData = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked) return;

        try {
            await api.post(`/exams/attempt/${attemptId}/gaze-analysis/`, {
                gaze_data: {
                    direction: eyeStatus.gazeDirection || 'CENTER',
                    confidence: eyeStatus.confidence || 0,
                    gaze_x: eyeStatus.gazeX || 0,
                    gaze_y: eyeStatus.gazeY || 0,
                    head_tilt_x: headPosition.tiltX || 0,
                    head_tilt_y: headPosition.tiltY || 0,
                    eyes_closed: eyeStatus.status === 'CLOSED',
                }
            });
        } catch (error) {
            console.debug('Gaze analysis error:', error);
        }
    }, [attemptId, isRunning, eyeStatus, headPosition, examLocked]);

    // ============================================================
    // SEND OBJECT DETECTION TO BACKEND
    // ============================================================
    const sendObjectDetection = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked || objectDetected.length === 0) return;

        try {
            const response = await api.post(`/exams/attempt/${attemptId}/object-detection/`, {
                objects: objectDetected
            });

            if (response.data && response.data.is_flagged) {
                toast.error(`🚨 ${response.data.flag_reason || 'Suspicious objects detected'}`);
                onViolation?.('OBJECT_DETECTED', response.data.flag_reason || 'Suspicious objects detected');
            }
        } catch (error) {
            console.debug('Object detection error:', error);
        }
    }, [attemptId, isRunning, objectDetected, onViolation, examLocked]);

    // ============================================================
    // CHECK NETWORK LATENCY
    // ============================================================
    const checkNetworkLatency = useCallback(async () => {
        try {
            const start = Date.now();
            await fetch('/api/exams/ping/', { method: 'GET', cache: 'no-cache' });
            const end = Date.now();
            setNetworkLatency(end - start);
        } catch (error) {
            setNetworkLatency(999);
        }
    }, []);

    // ============================================================
    // MEDIAPIPE INITIALIZATION
    // ============================================================
    const initializeMediaPipe = useCallback(async () => {
        try {
            console.log('📥 Loading MediaPipe FaceLandmarker...');

            const filesetResolver = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );

            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU',
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
                numFaces: 5,
            });

            landmarkerRef.current = landmarker;
            console.log('✅ MediaPipe FaceLandmarker loaded');
            setUsingMediaPipe(true);
            return true;
        } catch (err) {
            console.warn('⚠️ MediaPipe failed to load:', err);
            setUsingMediaPipe(false);
            return false;
        }
    }, []);

    // ============================================================
    // EAR COMPUTATION
    // ============================================================
    const computeEAR = useCallback((landmarks, indices) => {
        const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
        if (!p1 || !p4) return 1;

        const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        const v1 = dist(p2, p6);
        const v2 = dist(p3, p5);
        const h = dist(p1, p4);

        if (h === 0) return 1;
        return (v1 + v2) / (2 * h);
    }, []);

    // ============================================================
    // GAZE COMPUTATION
    // ============================================================
    const computeGaze = useCallback((landmarks) => {
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        const leftEyeOuter = landmarks[33];
        const leftEyeInner = landmarks[133];
        const rightEyeOuter = landmarks[362];
        const rightEyeInner = landmarks[263];
        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];
        const rightEyeTop = landmarks[386];
        const rightEyeBottom = landmarks[374];

        if (!leftIris || !rightIris) {
            return { x: 0, y: 0, direction: 'CENTER', confidence: 0 };
        }

        const leftH =
            (leftIris.x - leftEyeOuter.x) /
            (leftEyeInner.x - leftEyeOuter.x + 1e-10);
        const rightH =
            (rightIris.x - rightEyeOuter.x) /
            (rightEyeInner.x - rightEyeOuter.x + 1e-10);
        const avgH = (leftH + rightH) / 2;

        const leftV =
            (leftIris.y - leftEyeTop.y) /
            (leftEyeBottom.y - leftEyeTop.y + 1e-10);
        const rightV =
            (rightIris.y - rightEyeTop.y) /
            (rightEyeBottom.y - rightEyeTop.y + 1e-10);
        const avgV = (leftV + rightV) / 2;

        const gazeX = (avgH - 0.5) * 2;
        const gazeY = (avgV - 0.5) * 2;

        let direction = 'CENTER';
        const tx = 0.25;
        const ty = 0.30;

        if (gazeX < -tx) direction = 'LEFT';
        else if (gazeX > tx) direction = 'RIGHT';

        if (gazeY < -ty) direction = direction === 'CENTER' ? 'UP' : direction + '_UP';
        else if (gazeY > ty) direction = direction === 'CENTER' ? 'DOWN' : direction + '_DOWN';

        return {
            x: gazeX,
            y: gazeY,
            direction,
            confidence: Math.min(1, Math.max(Math.abs(gazeX), Math.abs(gazeY)) / 0.5),
        };
    }, []);

    // ============================================================
    // HEAD POSE COMPUTATION
    // ============================================================
    const computeHeadPose = useCallback((m) => {
        if (!m || m.length < 16) return { yaw: 0, pitch: 0, roll: 0 };

        const r00 = m[0], r10 = m[4], r20 = m[8];
        const r21 = m[9], r22 = m[10];
        const r11 = m[5], r12 = m[6];

        const sy = Math.sqrt(r00 * r00 + r10 * r10);

        let pitch, yaw, roll;

        if (sy > 1e-6) {
            pitch = Math.atan2(r21, r22) * (180 / Math.PI);
            yaw = Math.atan2(-r20, sy) * (180 / Math.PI);
            roll = Math.atan2(r10, r00) * (180 / Math.PI);
        } else {
            pitch = Math.atan2(-r12, r11) * (180 / Math.PI);
            yaw = Math.atan2(-r20, sy) * (180 / Math.PI);
            roll = 0;
        }

        return { pitch, yaw, roll };
    }, []);

    // ============================================================
    // STATUS OVERLAY
    // ============================================================
    const drawStatusOverlay = useCallback((ctx, canvas) => {
        const w = canvas.width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(w - 220, 10, 210, 140);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';

        const statuses = [
            `Face: ${faceDetected ? '✅' : '❌'}`,
            `Multiple Faces: ${multipleFaces ? '⚠️' : '✅'}`,
            `Eyes: ${eyeStatus.status === 'OPEN' ? '👀 Open' : '😴 Closed'}`,
            `Gaze: ${eyeStatus.gazeDirection}`,
            `Head: ${headPosition.position}`,
            `Objects: ${objectDetected.length > 0 ? '⚠️' : '✅'}`,
            `Suspicious: ${suspiciousCount}`,
            `Flagged: ${isFlagged ? '🚨' : '✅'}`,
            `Trust: ${trustScore}%`,
            usingMediaPipe
                ? '⚡ MediaPipe'
                : usingFallback
                ? '🔧 Fallback'
                : '⚡ TensorFlow',
        ];

        statuses.forEach((status, i) => {
            const y = 30 + i * 14;
            ctx.fillStyle =
                status.includes('⚠️') || status.includes('❌')
                    ? '#ef4444'
                    : status.includes('🚨')
                    ? '#dc2626'
                    : '#22c55e';
            ctx.fillText(status, w - 210, y);
        });
    }, [faceDetected, multipleFaces, eyeStatus.status, eyeStatus.gazeDirection, headPosition.position, objectDetected.length, suspiciousCount, isFlagged, trustScore, usingMediaPipe, usingFallback]);

    // ============================================================
    // DRAW MEDIAPIPE OVERLAY
    // ============================================================
    const drawMediaPipeOverlay = useCallback((landmarks, gazeInfo, eyesClosed, count) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks || landmarks.length === 0) {
            drawStatusOverlay(ctx, canvas);
            return;
        }

        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        landmarks.forEach((l) => {
            if (l.x < minX) minX = l.x;
            if (l.y < minY) minY = l.y;
            if (l.x > maxX) maxX = l.x;
            if (l.y > maxY) maxY = l.y;
        });

        const color =
            count > 1 ? '#dc2626' : gazeInfo.direction !== 'CENTER' ? '#f59e0b' : '#22c55e';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            minX * canvas.width,
            minY * canvas.height,
            (maxX - minX) * canvas.width,
            (maxY - minY) * canvas.height
        );

        if (gazeInfo.x !== 0 || gazeInfo.y !== 0) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const gx = cx + gazeInfo.x * 100;
            const gy = cy + gazeInfo.y * 80;

            ctx.strokeStyle = 'rgba(255,255,0,0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(gx, gy);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        drawStatusOverlay(ctx, canvas);
    }, [drawStatusOverlay]);

    // ============================================================
    // PROCESS MEDIAPIPE RESULT
    // ============================================================
    const processMediaPipeResult = useCallback((result) => {
        const faceLandmarks = result.faceLandmarks || [];
        const matrices = result.facialTransformationMatrixes || [];

        const count = faceLandmarks.length;
        setFaceCount(count);

        // ---- FACE LOST ----
        if (count === 0) {
            setFaceDetected(false);
            faceLostFramesRef.current++;

            if (faceLostFramesRef.current > 30) {
                signalsBufferRef.current.faceLostCount++;
                faceLostFramesRef.current = 0;

                if (signalsBufferRef.current.faceLostCount % 3 === 0) {
                    const event = {
                        type: 'FACE_LOST',
                        message: '⚠️ Student left camera view',
                        timestamp: new Date().toISOString(),
                        severity: 'MEDIUM',
                    };
                    setViolations((prev) => [...prev, event]);
                    addSuspiciousEvent(event);
                    onViolation?.('FACE_LOST', event.message);
                }
            }
            return;
        }

        setFaceDetected(true);
        faceLostFramesRef.current = 0;

        // ---- MULTIPLE FACES ----
        if (count > 1) {
            setMultipleFaces(true);
            setFaceLostCount(0);
            signalsBufferRef.current.multipleFaceCount++;

            if (signalsBufferRef.current.multipleFaceCount % 30 === 0) {
                const event = {
                    type: 'MULTIPLE_FACES',
                    message: `🚫 Multiple faces detected (${count})`,
                    timestamp: new Date().toISOString(),
                    severity: 'HIGH',
                    count,
                };
                setViolations((prev) => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('MULTIPLE_FACES', event.message);
            }

            drawMediaPipeOverlay(faceLandmarks[0], { direction: 'CENTER', x: 0, y: 0 }, false, count);
            return;
        }

        setMultipleFaces(false);

        // ---- SINGLE FACE ----
        const landmarks = faceLandmarks[0];

        const leftEAR = computeEAR(landmarks, [33, 160, 158, 133, 153, 144]);
        const rightEAR = computeEAR(landmarks, [362, 385, 387, 263, 373, 380]);
        const avgEAR = (leftEAR + rightEAR) / 2;
        const eyesClosed = avgEAR < 0.20;

        const gazeInfo = computeGaze(landmarks);

        let pose = { yaw: 0, pitch: 0, roll: 0 };
        if (matrices.length > 0 && matrices[0].data) {
            pose = computeHeadPose(matrices[0].data);
        }

        setEyeStatus({
            status: eyesClosed ? 'CLOSED' : 'OPEN',
            gazeDirection: gazeInfo.direction,
            confidence: gazeInfo.confidence,
            leftEyeOpen: leftEAR,
            rightEyeOpen: rightEAR,
            gazeX: gazeInfo.x,
            gazeY: gazeInfo.y,
            leftEAR,
            rightEAR,
        });

        setHeadPosition({
            position:
                Math.abs(pose.yaw) > 25 || Math.abs(pose.pitch) > 20
                    ? 'TILTED'
                    : 'CENTER',
            tiltX: pose.yaw,
            tiltY: pose.pitch,
            rotation: pose.roll,
            yaw: pose.yaw,
            pitch: pose.pitch,
            roll: pose.roll,
        });

        if (eyesClosed) signalsBufferRef.current.eyesClosedCount++;
        if (gazeInfo.direction !== 'CENTER') {
            signalsBufferRef.current.gazeAwayCount++;

            if (signalsBufferRef.current.gazeAwayCount % 60 === 0) {
                const event = {
                    type: 'GAZE_AWAY',
                    message: `👀 Looking ${gazeInfo.direction.toLowerCase()}`,
                    timestamp: new Date().toISOString(),
                    severity: 'MEDIUM',
                    direction: gazeInfo.direction,
                };
                setViolations((prev) => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('GAZE_AWAY', event.message);
            }
        }

        if (Math.abs(pose.yaw) > 25 || Math.abs(pose.pitch) > 20) {
            signalsBufferRef.current.headTiltCount++;
        }

        drawMediaPipeOverlay(landmarks, gazeInfo, eyesClosed, count);
    }, [onViolation, addSuspiciousEvent, computeEAR, computeGaze, computeHeadPose, drawMediaPipeOverlay]);

    // ============================================================
    // MEDIAPIPE DETECTION LOOP
    // ============================================================
    const startMediaPipeLoop = useCallback(() => {
        let lastFrameTs = performance.now();
        let frameCount = 0;

        const loop = () => {
            if (!isMounted.current) return;

            if (!landmarkerRef.current || !videoRef.current) {
                mediapipeLoopRef.current = requestAnimationFrame(loop);
                return;
            }

            const video = videoRef.current;
            if (video.readyState < 2) {
                mediapipeLoopRef.current = requestAnimationFrame(loop);
                return;
            }

            if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;

                try {
                    const ts = performance.now();
                    const result = landmarkerRef.current.detectForVideo(video, ts);
                    processMediaPipeResult(result);

                    frameCount++;
                    if (ts - lastFrameTs >= 1000) {
                        setFps(frameCount);
                        frameCount = 0;
                        lastFrameTs = ts;
                    }
                } catch (e) {
                    // silent
                }
            }

            mediapipeLoopRef.current = requestAnimationFrame(loop);
        };

        mediapipeLoopRef.current = requestAnimationFrame(loop);
    }, [processMediaPipeResult]);

    // ============================================================
    // START CAMERA
    // ============================================================
    const startCamera = useCallback(async () => {
        try {
            console.log('📷 Starting camera...');

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 },
                    },
                    audio: false,
                });
            } catch (firstError) {
                console.warn('First camera attempt failed, trying fallback:', firstError);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: false,
                    });
                } catch (secondError) {
                    console.warn('Second camera attempt failed, trying minimal:', secondError);
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
                }
            }

            streamRef.current = stream;

            if (videoRef.current && isMounted.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
                console.log('✅ Camera started successfully');
            }
        } catch (error) {
            console.error('❌ Camera Error:', error);
            setCameraActive(false);
            throw new Error('Camera access denied. Please allow camera permissions and refresh.');
        }
    }, []);

    // ============================================================
    // TENSORFLOW FACE DETECTION (fallback path)
    // ============================================================
    const detectFaces = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;

        try {
            let faces = [];
            let detectionSuccessful = false;

            if (videoRef.current.readyState < 2) return;

            if (faceDetector) {
                try {
                    const detectionPromise = faceDetector.estimateFaces(videoRef.current);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Detection timeout')), 3000)
                    );

                    faces = await Promise.race([detectionPromise, timeoutPromise]);
                    detectionSuccessful = true;
                    setModelsLoaded(true);
                } catch (tfError) {
                    console.warn('⚠️ TensorFlow detection failed:', tfError.message);
                    setModelLoadError(tfError.message);
                }
            }

            if (!detectionSuccessful || !faceDetector) {
                const facePresent = fallbackDetectFace();
                if (facePresent) {
                    faces = [{ box: { xMin: 50, yMin: 50, width: 200, height: 200 }, keypoints: [] }];
                } else {
                    faces = [];
                }
                if (!usingFallback) {
                    setUsingFallback(true);
                    setFallbackReason('Using fallback face detection');
                    onStatusUpdate?.({ status: 'fallback', message: 'Using fallback face detection' });
                }
            }

            const now = Date.now();
            setFps(Math.round(1000 / (now - lastFrameTime)));
            setLastFrameTime(now);

            const count = faces ? faces.length : 0;
            setFaceCount(count);

            if (count > 1) {
                setMultipleFaces(true);
                setFaceDetected(true);
                setFaceLostCount(0);

                const event = {
                    type: 'MULTIPLE_FACES',
                    message: `⚠️ Multiple faces detected (${count} faces)`,
                    timestamp: new Date().toISOString(),
                    severity: 'HIGH',
                    count,
                };
                setViolations((prev) => [...prev, event]);
                setTabSwitchCount((prev) => prev + 1);
                addSuspiciousEvent(event);
                onSuspicious?.(event);
                onViolation?.('MULTIPLE_FACES', event.message);
                sendRealTimeData();
            } else if (count === 0) {
                setFaceDetected(false);
                setMultipleFaces(false);
                setFaceLostCount((prev) => prev + 1);

                if (faceLostCount > 10) {
                    const event = {
                        type: 'FACE_LOST',
                        message: '⚠️ Student left camera view!',
                        timestamp: new Date().toISOString(),
                        severity: 'MEDIUM',
                        duration: faceLostCount * 0.5,
                    };
                    setViolations((prev) => [...prev, event]);
                    addSuspiciousEvent(event);
                    onSuspicious?.(event);
                    onViolation?.('FACE_LOST', event.message);
                    sendRealTimeData();
                }
            } else {
                setFaceDetected(true);
                setMultipleFaces(false);
                setFaceLostCount(0);
            }

            drawFaces(faces || []);
        } catch (error) {
            console.error('Face Detection Error:', error);
        }
    }, [
        isRunning,
        faceDetector,
        fallbackDetectFace,
        usingFallback,
        lastFrameTime,
        faceLostCount,
        onSuspicious,
        onViolation,
        onStatusUpdate,
        sendRealTimeData,
        addSuspiciousEvent,
    ]);

    // ============================================================
    // GAZE DIRECTION (fallback helpers)
    // ============================================================
    const calculateGazeDirection = useCallback((leftEye, rightEye, face) => {
        if (!leftEye.iris || !rightEye.iris || !leftEye.left || !rightEye.right) {
            return { direction: 'UNKNOWN', gazeX: 0, gazeY: 0, confidence: 0 };
        }

        const leftEyeWidth = Math.sqrt(
            Math.pow(leftEye.right.x - leftEye.left.x, 2) +
            Math.pow(leftEye.right.y - leftEye.left.y, 2)
        );
        const rightEyeWidth = Math.sqrt(
            Math.pow(rightEye.right.x - rightEye.left.x, 2) +
            Math.pow(rightEye.right.y - rightEye.left.y, 2)
        );

        const leftIrisPos = {
            x: (leftEye.iris.x - leftEye.left.x) / leftEyeWidth,
            y: (leftEye.iris.y - leftEye.top.y) / (leftEye.bottom.y - leftEye.top.y || 1),
        };
        const rightIrisPos = {
            x: (rightEye.iris.x - rightEye.left.x) / rightEyeWidth,
            y: (rightEye.iris.y - rightEye.top.y) / (rightEye.bottom.y - rightEye.top.y || 1),
        };

        const avgX = (leftIrisPos.x + rightIrisPos.x) / 2;
        const avgY = (leftIrisPos.y + rightIrisPos.y) / 2;

        let direction = 'CENTER';
        let confidence = 0.7;

        if (avgX < 0.35) {
            direction = 'LEFT';
            confidence = Math.min(1, (0.35 - avgX) * 3);
        } else if (avgX > 0.65) {
            direction = 'RIGHT';
            confidence = Math.min(1, (avgX - 0.65) * 3);
        }

        if (direction === 'CENTER') {
            if (avgY < 0.3) {
                direction = 'UP';
                confidence = Math.min(1, (0.3 - avgY) * 3);
            } else if (avgY > 0.7) {
                direction = 'DOWN';
                confidence = Math.min(1, (avgY - 0.7) * 3);
            }
        }

        if (avgX < 0.35 && avgY < 0.3) direction = 'UP_LEFT';
        else if (avgX > 0.65 && avgY < 0.3) direction = 'UP_RIGHT';
        else if (avgX < 0.35 && avgY > 0.7) direction = 'DOWN_LEFT';
        else if (avgX > 0.65 && avgY > 0.7) direction = 'DOWN_RIGHT';

        const gazeX = (avgX - 0.5) * 2;
        const gazeY = (avgY - 0.5) * 2;

        return { direction, gazeX, gazeY, confidence };
    }, []);

    // ============================================================
    // HEAD POSITION (fallback)
    // ============================================================
    const calculateHeadPosition = useCallback((face) => {
        if (!face.keypoints || face.keypoints.length < 10) {
            return { tiltX: 0, tiltY: 0, rotation: 0 };
        }

        const nose = face.keypoints[1];
        const leftEye = face.keypoints[33];
        const rightEye = face.keypoints[263];
        const leftMouth = face.keypoints[61];
        const rightMouth = face.keypoints[291];

        if (!nose || !leftEye || !rightEye) {
            return { tiltX: 0, tiltY: 0, rotation: 0 };
        }

        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
        };

        const tiltX = Math.atan2(nose.x - eyeCenter.x, nose.y - eyeCenter.y) * 180 / Math.PI;

        const eyeDistance = Math.sqrt(
            Math.pow(rightEye.x - leftEye.x, 2) +
            Math.pow(rightEye.y - leftEye.y, 2)
        );
        const noseToEyeCenter = Math.sqrt(
            Math.pow(nose.x - eyeCenter.x, 2) +
            Math.pow(nose.y - eyeCenter.y, 2)
        );
        const tiltY = (noseToEyeCenter / eyeDistance - 1) * 50;

        const mouthCenter = {
            x: (leftMouth.x + rightMouth.x) / 2,
            y: (leftMouth.y + rightMouth.y) / 2,
        };
        const rotation = Math.atan2(
            rightMouth.y - leftMouth.y,
            rightMouth.x - leftMouth.x
        ) * 180 / Math.PI;

        return { tiltX, tiltY, rotation };
    }, []);

    // ============================================================
    // EYE OPENNESS HELPER (fallback)
    // ============================================================
    const calculateEyeOpenness = useCallback((eye) => {
        if (!eye.top || !eye.bottom || !eye.left || !eye.right) return 0;

        const vertical = Math.sqrt(
            Math.pow(eye.top.x - eye.bottom.x, 2) +
            Math.pow(eye.top.y - eye.bottom.y, 2)
        );
        const horizontal = Math.sqrt(
            Math.pow(eye.left.x - eye.right.x, 2) +
            Math.pow(eye.left.y - eye.right.y, 2)
        );

        return vertical / (horizontal + 0.01);
    }, []);

    // ============================================================
    // TENSORFLOW EYE TRACKING (fallback path)
    // ============================================================
    const detectEyeGaze = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;

        if (!landmarkDetector) {
            setEyeStatus({
                status: 'OPEN',
                gazeDirection: 'CENTER',
                confidence: 0.5,
                leftEyeOpen: 0.8,
                rightEyeOpen: 0.8,
                gazeX: 0,
                gazeY: 0,
            });
            return;
        }

        try {
            const faces = await landmarkDetector.estimateFaces(videoRef.current);

            if (faces && faces.length > 0) {
                const face = faces[0];
                const landmarks = face.keypoints || face.landmarks;

                if (landmarks && landmarks.length > 0) {
                    const leftEye = {
                        top: landmarks[159],
                        bottom: landmarks[145],
                        left: landmarks[33],
                        right: landmarks[133],
                        iris: landmarks[468],
                    };
                    const rightEye = {
                        top: landmarks[386],
                        bottom: landmarks[374],
                        left: landmarks[263],
                        right: landmarks[362],
                        iris: landmarks[473],
                    };

                    const leftOpen = calculateEyeOpenness(leftEye);
                    const rightOpen = calculateEyeOpenness(rightEye);
                    const avgOpen = (leftOpen + rightOpen) / 2;

                    const gazeData = calculateGazeDirection(leftEye, rightEye, face);

                    if (avgOpen < 0.15) {
                        if (eyeStatus.status !== 'CLOSED') {
                            setEyeStatus({
                                ...eyeStatus,
                                status: 'CLOSED',
                                leftEyeOpen: leftOpen,
                                rightEyeOpen: rightOpen,
                                gazeDirection: gazeData.direction,
                                gazeX: gazeData.gazeX,
                                gazeY: gazeData.gazeY,
                                confidence: gazeData.confidence,
                            });

                            const event = {
                                type: 'EYES_CLOSED',
                                message: '⚠️ Eyes closed for extended period!',
                                timestamp: new Date().toISOString(),
                                severity: 'MEDIUM',
                                duration: 1,
                                leftOpen,
                                rightOpen,
                            };
                            setViolations((prev) => [...prev, event]);
                            addSuspiciousEvent(event);
                            onSuspicious?.(event);
                            sendGazeData();
                            sendRealTimeData();
                        }
                    } else if (avgOpen > 0.25) {
                        const newEyeStatus = {
                            status: 'OPEN',
                            leftEyeOpen: leftOpen,
                            rightEyeOpen: rightOpen,
                            gazeDirection: gazeData.direction,
                            gazeX: gazeData.gazeX,
                            gazeY: gazeData.gazeY,
                            confidence: gazeData.confidence,
                        };

                        if (eyeStatus.gazeDirection !== gazeData.direction) {
                            setEyeStatus(newEyeStatus);

                            if (gazeData.direction !== 'CENTER' && gazeData.confidence > 0.6) {
                                const event = {
                                    type: 'GAZE_AWAY',
                                    message: `👀 Student looking ${gazeData.direction.toLowerCase()}`,
                                    timestamp: new Date().toISOString(),
                                    severity: 'MEDIUM',
                                    direction: gazeData.direction,
                                    confidence: gazeData.confidence,
                                    gazeX: gazeData.gazeX,
                                    gazeY: gazeData.gazeY,
                                };
                                setViolations((prev) => [...prev, event]);
                                addSuspiciousEvent(event);
                                onSuspicious?.(event);
                                sendGazeData();
                                sendRealTimeData();
                            }
                        } else {
                            setEyeStatus(newEyeStatus);
                        }
                    }

                    const headData = calculateHeadPosition(face);
                    if (
                        headData.tiltX > 25 || headData.tiltX < -25 ||
                        headData.tiltY > 20 || headData.tiltY < -20
                    ) {
                        if (headPosition.position === 'CENTER') {
                            setHeadPosition({
                                position: 'TILTED',
                                tiltX: headData.tiltX,
                                tiltY: headData.tiltY,
                                rotation: headData.rotation,
                            });
                            const event = {
                                type: 'HEAD_TILTED',
                                message: `⚠️ Head tilted (${Math.round(headData.tiltX)}°, ${Math.round(headData.tiltY)}°)`,
                                timestamp: new Date().toISOString(),
                                severity: 'LOW',
                                tiltX: headData.tiltX,
                                tiltY: headData.tiltY,
                            };
                            setViolations((prev) => [...prev, event]);
                            addSuspiciousEvent(event);
                            onSuspicious?.(event);
                            sendGazeData();
                            sendRealTimeData();
                        }
                    } else {
                        setHeadPosition({
                            position: 'CENTER',
                            tiltX: headData.tiltX,
                            tiltY: headData.tiltY,
                            rotation: headData.rotation,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Eye Tracking Error:', error);
        }
    }, [
        isRunning,
        landmarkDetector,
        eyeStatus,
        headPosition,
        onSuspicious,
        sendGazeData,
        sendRealTimeData,
        addSuspiciousEvent,
        calculateEyeOpenness,
        calculateGazeDirection,
        calculateHeadPosition,
    ]);

    // ============================================================
    // OBJECT DETECTION
    // ============================================================
    const detectObjects = useCallback(async () => {
        if (!isRunning || !videoRef.current || !objectDetector || !isMounted.current) return;

        try {
            const predictions = await objectDetector.detect(videoRef.current);

            const suspiciousObjects = [
                'cell phone', 'mobile phone', 'phone',
                'book', 'laptop', 'computer', 'keyboard',
                'remote', 'tv', 'monitor',
                'bottle', 'cup', 'glass',
            ];

            const detected = predictions.filter(
                (p) =>
                    suspiciousObjects.some((obj) => p.class.toLowerCase().includes(obj)) &&
                    p.score > 0.6
            );

            if (detected.length > 0) {
                const objectNames = detected.map((d) => d.class);
                const uniqueObjects = [...new Set(objectNames)];

                setObjectDetected(uniqueObjects);

                const highConfidenceObjects = detected.filter((d) => d.score > 0.8);
                if (highConfidenceObjects.length > 0) {
                    const event = {
                        type: 'OBJECT_DETECTED',
                        message: `📱 Suspicious object detected: ${uniqueObjects.join(', ')}`,
                        timestamp: new Date().toISOString(),
                        severity: 'HIGH',
                        objects: uniqueObjects,
                        confidence: Math.max(...detected.map((d) => d.score)),
                    };
                    setViolations((prev) => [...prev, event]);
                    addSuspiciousEvent(event);
                    onSuspicious?.(event);
                    onViolation?.('OBJECT_DETECTED', event.message);
                    sendObjectDetection();
                    sendRealTimeData();
                }
            } else {
                setObjectDetected([]);
            }
        } catch (error) {
            console.error('Object Detection Error:', error);
        }
    }, [
        isRunning,
        objectDetector,
        onSuspicious,
        onViolation,
        sendObjectDetection,
        sendRealTimeData,
        addSuspiciousEvent,
    ]);

    // ============================================================
    // CAPTURE FRAME
    // ============================================================
    const sendToBackend = useCallback(async (imageData) => {
        try {
            const response = await proctoringService.captureImage(attemptId, imageData, {
                faceDetected,
                multipleFaces,
                eyeStatus,
                headPosition,
                objectsDetected: objectDetected,
                suspiciousCount,
            });

            if (response && response.is_flagged) {
                setIsFlagged(true);
                const event = {
                    type: 'AUTO_FLAGGED',
                    message: `🚨 Auto-flagged: ${response.reason || 'Suspicious activity'}`,
                    timestamp: new Date().toISOString(),
                    severity: 'HIGH',
                    reason: response.reason,
                    suspicious_events: response.suspicious_events,
                };
                setViolations((prev) => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('AUTO_FLAGGED', response.reason || 'Suspicious activity detected');
            }
        } catch (error) {
            console.debug('Proctoring backend error:', error.message);
        }
    }, [attemptId, faceDetected, multipleFaces, eyeStatus, headPosition, objectDetected, suspiciousCount, onViolation, addSuspiciousEvent]);

    const captureFrame = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);

            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            setCaptureCount((prev) => prev + 1);

            await sendToBackend(imageData);
        } catch (error) {
            console.error('Frame capture error:', error);
        }
    }, [isRunning, sendToBackend]);

    // ============================================================
    // DRAW FACES (TensorFlow fallback path)
    // ============================================================
    const drawFaces = useCallback(
        (faces) => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const video = videoRef.current;

            if (!video) return;

            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (eyeStatus.gazeX !== 0 || eyeStatus.gazeY !== 0) {
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const gazeX = cx + eyeStatus.gazeX * 100;
                const gazeY = cy + eyeStatus.gazeY * 80;

                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(gazeX, gazeY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(gazeX, gazeY, 8, 0, 2 * Math.PI);
                ctx.fill();
            }

            faces.forEach((face, index) => {
                const box = face.box || face.boundingBox;
                if (box) {
                    const x = box.xMin || box.x;
                    const y = box.yMin || box.y;
                    const w = box.width || box.xMax - box.xMin;
                    const h = box.height || box.yMax - box.yMin;

                    let color = '#22c55e';
                    if (index > 0) color = '#dc2626';
                    else if (!faceDetected) color = '#dc2626';
                    else if (eyeStatus.status === 'CLOSED') color = '#f59e0b';

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);

                    ctx.fillStyle = color;
                    ctx.font = '12px Arial';
                    const label = index > 0 ? `Face ${index + 1}` : 'Student';
                    ctx.fillText(label, x, y - 10);

                    if (face.keypoints) {
                        face.keypoints.forEach((point) => {
                            ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                            ctx.beginPath();
                            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                            ctx.fill();
                        });
                    }
                }
            });

            drawStatusOverlay(ctx, canvas);
        },
        [eyeStatus, faceDetected, drawStatusOverlay]
    );

    // ============================================================
    // MAIN INITIALIZATION — MediaPipe PRIMARY, TensorFlow FALLBACK
    // ============================================================
    useEffect(() => {
        const setupAI = async () => {
            try {
                setIsInitializing(true);
                setError(null);
                setUsingFallback(false);
                setFallbackReason('');
                console.log('🔄 Initializing AI Proctor...');

                await startCamera();

                const mediapipeOk = await initializeMediaPipe();

                if (mediapipeOk) {
                    console.log('✅ Using MediaPipe for face detection');

                    setIsInitializing(false);
                    setIsRunning(true);
                    setCameraActive(true);

                    startMediaPipeLoop();

                    try {
                        console.log('📥 Loading Object Detector...');
                        const objDet = await cocoSsd.load();
                        setObjectDetector(objDet);
                        console.log('✅ Object Detector loaded');

                        if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
                        objectDetectionIntervalRef.current = setInterval(detectObjects, 3000);
                    } catch (objError) {
                        console.warn('⚠️ Object detector not available:', objError);
                        setObjectDetector(null);
                    }

                    if (frameCaptureRef.current) clearInterval(frameCaptureRef.current);
                    frameCaptureRef.current = setInterval(captureFrame, captureInterval);

                    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = setInterval(sendRealTimeData, 5000);

                    if (networkCheckRef.current) clearInterval(networkCheckRef.current);
                    networkCheckRef.current = setInterval(checkNetworkLatency, 10000);

                    setTimeout(sendFaceVerification, 3000);

                    if (gazeIntervalRef.current) clearInterval(gazeIntervalRef.current);
                    gazeIntervalRef.current = setInterval(sendGazeData, 2000);

                    if (objectSendIntervalRef.current) clearInterval(objectSendIntervalRef.current);
                    objectSendIntervalRef.current = setInterval(sendObjectDetection, 5000);

                    onStatusUpdate?.({ status: 'running', message: 'AI Proctor (MediaPipe) active' });
                    toast.success('✅ AI Proctor active (MediaPipe)');
                    return;
                }

                console.warn('⚠️ MediaPipe failed, falling back to TensorFlow');

                let faceDet = null;
                let fallback = false;

                try {
                    console.log('📥 Loading TensorFlow Face Detector...');
                    faceDet = await faceDetection.createDetector(
                        faceDetection.SupportedModels.MediaPipeFaceDetector,
                        { runtime: 'tfjs', maxFaces: 5 }
                    );
                    console.log('✅ TensorFlow Face Detector loaded');
                } catch (tfError) {
                    console.warn('⚠️ TensorFlow face detection failed, using fallback:', tfError);
                    fallback = true;
                    setFallbackReason('All AI detection failed, using fallback');
                    setUsingFallback(true);
                    faceDet = null;
                }
                setFaceDetector(faceDet);

                if (!fallback) {
                    try {
                        console.log('📥 Loading Face Landmarks...');
                        const landmarkDet = await faceLandmarks.createDetector(
                            faceLandmarks.SupportedModels.MediaPipeFaceMesh,
                            { runtime: 'tfjs', maxFaces: 1 }
                        );
                        setLandmarkDetector(landmarkDet);
                        console.log('✅ Face Landmarks loaded');
                    } catch (landmarkError) {
                        console.warn('⚠️ Face landmarks not available:', landmarkError);
                        setLandmarkDetector(null);
                    }

                    try {
                        console.log('📥 Loading Object Detector...');
                        const objDet = await cocoSsd.load();
                        setObjectDetector(objDet);
                        console.log('✅ Object Detector loaded');
                    } catch (objError) {
                        console.warn('⚠️ Object detector not available:', objError);
                        setObjectDetector(null);
                    }
                }

                setIsInitializing(false);
                setIsRunning(true);
                setCameraActive(true);

                if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = setInterval(detectFaces, 500);

                if (eyeTrackingIntervalRef.current) clearInterval(eyeTrackingIntervalRef.current);
                if (!fallback) {
                    eyeTrackingIntervalRef.current = setInterval(detectEyeGaze, 300);
                }

                if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
                if (!fallback && objectDetector) {
                    objectDetectionIntervalRef.current = setInterval(detectObjects, 2000);
                }

                if (frameCaptureRef.current) clearInterval(frameCaptureRef.current);
                frameCaptureRef.current = setInterval(captureFrame, captureInterval);

                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = setInterval(sendRealTimeData, 5000);

                if (networkCheckRef.current) clearInterval(networkCheckRef.current);
                networkCheckRef.current = setInterval(checkNetworkLatency, 10000);

                setTimeout(sendFaceVerification, 3000);

                if (gazeIntervalRef.current) clearInterval(gazeIntervalRef.current);
                gazeIntervalRef.current = setInterval(sendGazeData, 2000);

                if (objectSendIntervalRef.current) clearInterval(objectSendIntervalRef.current);
                objectSendIntervalRef.current = setInterval(sendObjectDetection, 5000);

                onStatusUpdate?.({
                    status: fallback ? 'fallback' : 'running',
                    message: fallback ? 'Using fallback detection mode' : 'AI Proctor is active',
                });

                if (fallback) {
                    toast('⚠️ Using fallback face detection mode. Some features may be limited.');
                } else {
                    toast.success('✅ Camera connected, AI Proctor running');
                }
                console.log('✅ AI Proctor running' + (fallback ? ' (fallback mode)' : ''));
            } catch (error) {
                console.error('❌ AI Setup Error:', error);
                setIsInitializing(false);
                setError('AI Proctor initialization failed. Please refresh and try again.');
                onStatusUpdate?.({ status: 'error', message: 'AI initialization failed' });
                toast.error('❌ AI Proctor initialization failed. Please refresh.');
            }
        };
        setupAI();

        return () => {
            isMounted.current = false;
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (eyeTrackingIntervalRef.current) clearInterval(eyeTrackingIntervalRef.current);
            if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
            if (frameCaptureRef.current) clearInterval(frameCaptureRef.current);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            if (networkCheckRef.current) clearInterval(networkCheckRef.current);
            if (faceVerifyIntervalRef.current) clearInterval(faceVerifyIntervalRef.current);
            if (gazeIntervalRef.current) clearInterval(gazeIntervalRef.current);
            if (objectSendIntervalRef.current) clearInterval(objectSendIntervalRef.current);
            if (mediapipeLoopRef.current) cancelAnimationFrame(mediapipeLoopRef.current);

            if (landmarkerRef.current) {
                try { landmarkerRef.current.close(); } catch (e) {}
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
        // eslint-disable-next-line
    }, []);

    // ============================================================
    // RETRY CAMERA
    // ============================================================
    const retryCamera = async () => {
        try {
            setError(null);
            setIsInitializing(true);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            reconnectAttempts.current = 0;

            await startCamera();
            setIsInitializing(false);
            setIsRunning(true);
            setCameraActive(true);
            toast.success('✅ Camera reconnected!');
        } catch (error) {
            console.error('Retry camera error:', error);
            setIsInitializing(false);
            setError('Failed to restart camera. Please refresh the page.');
            toast.error('❌ Failed to restart camera');
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div
            style={{
                padding: '16px',
                background: '#1a1a2e',
                borderRadius: '12px',
                textAlign: 'center',
                position: 'relative',
                maxWidth: '480px',
                margin: '0 auto',
            }}
        >
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .spinning { animation: spin 1s linear infinite; }
                .pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
                .btn-retry { transition: all 0.3s ease; }
                .btn-retry:hover { transform: scale(1.05); background: #2563eb !important; }
                .camera-badge { animation: pulse 2s ease-in-out infinite; }
                .fallback-badge {
                    background: #f59e0b;
                    color: #92400e;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                .mediapipe-badge {
                    background: #10b981;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
            `}</style>

            <div style={{ position: 'relative' }}>
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        borderRadius: '8px',
                        background: '#1a1a2e',
                        minHeight: '200px',
                    }}
                    autoPlay
                    playsInline
                    muted
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        borderRadius: '8px',
                    }}
                />

                {cameraActive && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(34, 197, 94, 0.9)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            zIndex: 5,
                        }}
                        className="camera-badge"
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'white',
                                animation: 'pulse 1.5s infinite',
                            }}
                        />
                        📷 Camera ON
                    </div>
                )}

                {usingMediaPipe && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: 'rgba(16, 185, 129, 0.9)',
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            zIndex: 5,
                        }}
                    >
                        ⚡ MediaPipe
                    </div>
                )}

                {usingFallback && !usingMediaPipe && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: 'rgba(245, 158, 11, 0.9)',
                            color: '#92400e',
                            padding: '2px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            zIndex: 5,
                        }}
                    >
                        🔧 Fallback Mode
                    </div>
                )}

                {isFlagged && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: '#dc2626',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            animation: 'pulse 1.5s infinite',
                            zIndex: 5,
                        }}
                    >
                        🚨 FLAGGED
                    </div>
                )}

                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background:
                            trustScore >= 70
                                ? 'rgba(34, 197, 94, 0.9)'
                                : trustScore >= 40
                                ? 'rgba(245, 158, 11, 0.9)'
                                : 'rgba(220, 38, 38, 0.9)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        zIndex: 5,
                    }}
                >
                    Trust: {trustScore}%
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#22c55e',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                    }}
                >
                    {fps} FPS
                </div>

                {isInitializing && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                border: '4px solid rgba(255,255,255,0.2)',
                                borderTopColor: '#3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <p style={{ color: 'white', marginTop: '12px', fontSize: '14px' }}>
                            Loading AI Proctor...
                        </p>
                        <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '12px' }}>
                            Loading MediaPipe face detection
                        </p>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            padding: '20px',
                            zIndex: 10,
                        }}
                    >
                        <AlertCircle size={48} color="#dc2626" />
                        <p
                            style={{
                                color: 'white',
                                marginTop: '12px',
                                fontSize: '14px',
                                textAlign: 'center',
                                maxWidth: '300px',
                            }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={retryCamera}
                            className="btn-retry"
                            style={{
                                marginTop: '16px',
                                padding: '10px 24px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <RefreshCw size={18} />
                            Retry Camera
                        </button>
                    </div>
                )}
            </div>

            <div
                style={{
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: '13px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: cameraActive ? '#22c55e' : '#dc2626',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: cameraActive ? '#22c55e' : '#dc2626',
                            className: cameraActive ? 'pulse-dot' : '',
                        }}
                    />
                    {cameraActive ? '📷 Camera ON' : '📷 Camera OFF'}
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: faceDetected ? '#22c55e' : '#dc2626',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: faceDetected ? '#22c55e' : '#dc2626',
                            className: faceDetected ? '' : 'pulse-dot',
                        }}
                    />
                    {faceDetected ? '✅ Face detected' : '⚠️ No face'}
                </div>

                {multipleFaces && (
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        🚫 Multiple faces!
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: eyeStatus.status === 'OPEN' ? '#22c55e' : '#f59e0b',
                    }}
                >
                    {eyeStatus.status === 'OPEN' ? '👀 Looking' : '😴 Looking away'}
                    {eyeStatus.gazeDirection !== 'CENTER' && (
                        <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                            ({eyeStatus.gazeDirection})
                        </span>
                    )}
                </div>

                {objectDetected.length > 0 && (
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        📱 {objectDetected.join(', ')}
                    </div>
                )}

                {suspiciousCount > 0 && (
                    <div
                        style={{
                            color: suspiciousCount >= autoFlagThreshold ? '#dc2626' : '#f59e0b',
                            fontWeight: suspiciousCount >= autoFlagThreshold ? 'bold' : 'normal',
                        }}
                    >
                        🚨 {suspiciousCount} alerts
                    </div>
                )}

                <div style={{ color: '#64748b', fontSize: '11px' }}>📸 {captureCount}</div>

                <div style={{ color: '#64748b', fontSize: '11px' }}>🌐 {networkLatency}ms</div>

                {usingFallback && !usingMediaPipe && (
                    <div
                        style={{
                            color: '#f59e0b',
                            fontSize: '11px',
                            border: '1px solid #f59e0b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                        }}
                    >
                        🔧 Fallback Mode
                    </div>
                )}

                {usingMediaPipe && (
                    <div
                        style={{
                            color: '#10b981',
                            fontSize: '11px',
                            border: '1px solid #10b981',
                            padding: '2px 8px',
                            borderRadius: '4px',
                        }}
                    >
                        ⚡ MediaPipe
                    </div>
                )}

                {autoSubmitTriggered && (
                    <div
                        style={{
                            color: '#dc2626',
                            fontWeight: 'bold',
                            animation: 'pulse 0.5s infinite',
                            fontSize: '14px',
                            background: 'rgba(220,38,38,0.2)',
                            padding: '4px 12px',
                            borderRadius: '4px',
                        }}
                    >
                        🔴 AUTO-SUBMIT TRIGGERED!
                    </div>
                )}
            </div>

            {suspiciousEvents.length > 0 && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#2d2d44',
                        borderRadius: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 'bold',
                            color: '#dc2626',
                            marginBottom: '4px',
                            fontSize: '12px',
                        }}
                    >
                        ⚠️ Proctoring Alerts:
                    </div>
                    {suspiciousEvents.slice(0, 5).map((event, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '4px 8px',
                                borderBottom:
                                    index < suspiciousEvents.length - 1
                                        ? '1px solid #3d3d54'
                                        : 'none',
                                color: '#e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span>
                                {new Date(event.timestamp).toLocaleTimeString()} - {event.message}
                            </span>
                            <span
                                style={{
                                    fontSize: '9px',
                                    padding: '1px 6px',
                                    borderRadius: '2px',
                                    background:
                                        event.severity === 'HIGH'
                                            ? '#dc2626'
                                            : event.severity === 'MEDIUM'
                                            ? '#f59e0b'
                                            : '#3b82f6',
                                    color: 'white',
                                }}
                            >
                                {event.severity || 'LOW'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIProctor;