import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarks from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { AlertCircle, RefreshCw } from 'lucide-react';
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
    const gazeIntervalRef = useRef(null);
    const objectSendIntervalRef = useRef(null);
    const mediapipeLoopRef = useRef(null);

    const isMounted = useRef(true);
    const streamRef = useRef(null);
    const faceLostFramesRef = useRef(0);
    const lastVideoTimeRef = useRef(-1);
    const landmarkerRef = useRef(null);
    
    // Track if this is the first face detection to avoid false locks on startup
    const hasDetectedSingleFace = useRef(false);

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

    // ✅ NEW: BLACK SCREEN LOCK STATE
    const [screenLocked, setScreenLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');

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
    const [usingMediaPipe, setUsingMediaPipe] = useState(false);

    const [isExamLocked, setIsExamLocked] = useState(false);
    const [examLocked, setExamLocked] = useState(false);

    const [trustScore, setTrustScore] = useState(100);
    const [networkLatency, setNetworkLatency] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [violations, setViolations] = useState([]);
    const [faceMatchConfidence, setFaceMatchConfidence] = useState(0);
    const [selfieVerified, setSelfieVerified] = useState(false);
    const [mouseMovements, setMouseMovements] = useState([]);
    const [keystrokeData, setKeystrokeData] = useState([]);

    const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

    // ============================================================
    // ✅ REAL-TIME DATA SYNC (Backend Heartbeat)
    // ============================================================
    const sendRealTimeData = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked) return;

        try {
            const calculatedTrustScore = Math.max(0, 100 - (suspiciousCount * 5) - (violations.length * 3));
            setTrustScore(calculatedTrustScore);

            const signals = signalsBufferRef.current;

            const data = {
                // ✅ REMOVED trust_score from client payload (server calculates its own)
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
                setScreenLocked(true);
                setLockReason(response.data.lock_reason || 'Suspicious activity detected');
                toast.error(`🔒 Exam Locked: ${response.data.lock_reason || 'Suspicious activity detected'}`);
                onViolation?.('EXAM_LOCKED', response.data.lock_reason || 'Exam locked due to suspicious activity');
                return;
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
        attemptId, isRunning, suspiciousCount, violations.length, networkLatency,
        mouseMovements.length, keystrokeData.length, tabSwitchCount, faceDetected,
        multipleFaces, faceCount, eyeStatus, headPosition, objectDetected,
        faceMatchConfidence, selfieVerified, onViolation, onAutoSubmit,
        autoSubmitTriggered, examLocked
    ]);

    // ============================================================
    // ✅ SUSPICIOUS EVENT MANAGEMENT
    // ============================================================
    const addSuspiciousEvent = useCallback((event) => {
        setSuspiciousEvents((prev) => [event, ...prev].slice(0, 50));
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
    }, [autoFlagThreshold, onViolation, onAutoSubmit, sendRealTimeData]);

    // ============================================================
    // ✅ FACE IDENTITY VERIFICATION
    // ============================================================
    const sendFaceVerification = useCallback(async () => {
        if (!attemptId || !videoRef.current || !isRunning || examLocked) return;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            const response = await api.post(`/exams/attempt/${attemptId}/face-verify/`, {
                image_data: imageData,
                face_data: {
                    confidence: faceMatchConfidence || 0.8,
                    face_detected: faceDetected,
                    landmarks: {},
                },
            });

            if (response.data && response.data.verified !== undefined) {
                setSelfieVerified(response.data.verified);
                setFaceMatchConfidence(response.data.confidence || 0);

                if (response.data.verified === false) {
                    toast.error(`🚨 Identity mismatch: ${response.data.error || 'Face does not match'}`);
                    onViolation?.('FACE_IDENTITY_MISMATCH', 'Face does not match enrolled student');

                    if (response.data.is_locked) {
                        setIsExamLocked(true);
                        setExamLocked(true);
                        setScreenLocked(true);
                        setLockReason(response.data.error || 'Identity mismatch lock');
                        if (onAutoSubmit) {
                            onAutoSubmit({ reason: response.data.error || 'Exam locked: face identity mismatch', type: 'FACE_LOCK' });
                        }
                    }
                }

                if (response.data.is_flagged) {
                    toast.error(`🚨 ${response.data.error || response.data.flag_reason || 'Face verification failed'}`);
                    onViolation?.('FACE_VERIFICATION_FAILED', response.data.error || 'Face verification failed');
                }
            }
        } catch (error) {
            const data = error?.response?.data;
            if (data) {
                if (data.verified === false) {
                    setSelfieVerified(false);
                    setFaceMatchConfidence(data.confidence || 0);
                    const errMsg = data.error || data.flag_reason || 'Face does not match enrolled student';
                    toast.error(`🚨 ${errMsg}`);
                    onViolation?.('FACE_IDENTITY_MISMATCH', errMsg);

                    if (data.is_locked) {
                        setIsExamLocked(true);
                        setExamLocked(true);
                        setScreenLocked(true);
                        setLockReason(errMsg);
                        if (onAutoSubmit) {
                            onAutoSubmit({ reason: errMsg, type: 'FACE_LOCK' });
                        }
                    }
                } else if (data.error) {
                    console.warn('Face verification rejected:', data.error);
                }
            }
        }
    }, [attemptId, isRunning, faceDetected, faceMatchConfidence, onViolation, onAutoSubmit, examLocked]);

    // ============================================================
    // ✅ GAZE & OBJECT DETECTION SYNC
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
        } catch (error) { console.debug('Gaze analysis error:', error); }
    }, [attemptId, isRunning, eyeStatus, headPosition, examLocked]);

    const sendObjectDetection = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked || objectDetected.length === 0) return;
        try {
            const response = await api.post(`/exams/attempt/${attemptId}/object-detection/`, { objects: objectDetected });
            if (response.data && response.data.is_flagged) {
                toast.error(`🚨 ${response.data.flag_reason || 'Suspicious objects detected'}`);
                onViolation?.('OBJECT_DETECTED', response.data.flag_reason || 'Suspicious objects detected');
            }
        } catch (error) { console.debug('Object detection error:', error); }
    }, [attemptId, isRunning, objectDetected, onViolation, examLocked]);

    const checkNetworkLatency = useCallback(async () => {
        try {
            const start = Date.now();
            await fetch('/api/exams/ping/', { method: 'GET', cache: 'no-cache' });
            const end = Date.now();
            setNetworkLatency(end - start);
        } catch (error) { setNetworkLatency(999); }
    }, []);

    // ============================================================
    // ✅ MEDIAPIPE INITIALIZATION & LOGIC
    // ============================================================
    const initializeMediaPipe = useCallback(async () => {
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );
            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU',
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: 'VIDEO',
                numFaces: 5,
            });
            landmarkerRef.current = landmarker;
            setUsingMediaPipe(true);
            return true;
        } catch (err) {
            console.warn('⚠️ MediaPipe failed to load:', err);
            setUsingMediaPipe(false);
            return false;
        }
    }, []);

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

        if (!leftIris || !rightIris) return { x: 0, y: 0, direction: 'CENTER', confidence: 0 };

        const leftH = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x + 1e-10);
        const rightH = (rightIris.x - rightEyeOuter.x) / (rightEyeInner.x - rightEyeOuter.x + 1e-10);
        const avgH = (leftH + rightH) / 2;

        const leftV = (leftIris.y - leftEyeTop.y) / (leftEyeBottom.y - leftEyeTop.y + 1e-10);
        const rightV = (rightIris.y - rightEyeTop.y) / (rightEyeBottom.y - rightEyeTop.y + 1e-10);
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

        return { x: gazeX, y: gazeY, direction, confidence: Math.min(1, Math.max(Math.abs(gazeX), Math.abs(gazeY)) / 0.5) };
    }, []);

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
            usingMediaPipe ? '⚡ MediaPipe' : usingFallback ? '🔧 Fallback' : '⚡ TensorFlow',
        ];

        statuses.forEach((status, i) => {
            const y = 30 + i * 14;
            ctx.fillStyle = status.includes('⚠️') || status.includes('❌') ? '#ef4444' : status.includes('🚨') ? '#dc2626' : '#22c55e';
            ctx.fillText(status, w - 210, y);
        });
    }, [faceDetected, multipleFaces, eyeStatus.status, eyeStatus.gazeDirection, headPosition.position, objectDetected.length, suspiciousCount, isFlagged, trustScore, usingMediaPipe, usingFallback]);

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

        const color = count > 1 ? '#dc2626' : gazeInfo.direction !== 'CENTER' ? '#f59e0b' : '#22c55e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(minX * canvas.width, minY * canvas.height, (maxX - minX) * canvas.width, (maxY - minY) * canvas.height);

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
    // ✅ PROCESS MEDIAPIPE RESULT (The Core Locking Logic)
    // ============================================================
    const processMediaPipeResult = useCallback((result) => {
        const faceLandmarks = result.faceLandmarks || [];
        const matrices = result.facialTransformationMatrixes || [];
        const count = faceLandmarks.length;
        
        setFaceCount(count);

        // ---- MULTIPLE FACES -> LOCK SCREEN ----
        if (count > 1) {
            setMultipleFaces(true);
            setScreenLocked(true); // ✅ BLACK SCREEN
            setLockReason(`Multiple faces detected (${count}). Only one person allowed.`);
            setFaceDetected(true);
            setFaceLostCount(0);
            signalsBufferRef.current.multipleFaceCount++;

            if (signalsBufferRef.current.multipleFaceCount % 30 === 0) {
                const event = {
                    type: 'MULTIPLE_FACES',
                    message: `🚫 Multiple faces detected (${count})`,
                    timestamp: new Date().toISOString(),
                    severity: 'CRITICAL',
                    count,
                };
                setViolations((prev) => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('MULTIPLE_FACES', event.message);
            }

            drawMediaPipeOverlay(faceLandmarks[0], { direction: 'CENTER', x: 0, y: 0 }, false, count);
            return;
        }

        // ---- ONE FACE -> UNLOCK SCREEN ----
        if (count === 1) {
            setMultipleFaces(false);
            // Only unlock if it was previously locked due to multiple faces
            if (screenLocked && lockReason.includes('Multiple faces')) {
                setScreenLocked(false);
                setLockReason('');
                toast.success('✅ Screen unlocked. Only one face detected.');
            }
            hasDetectedSingleFace.current = true;
        }

        // ---- FACE LOST ----
        if (count === 0) {
            setFaceDetected(false);
            faceLostFramesRef.current++;

            // ✅ NEW: If face is lost after being detected, lock the screen
            if (hasDetectedSingleFace.current) {
                setScreenLocked(true);
                setLockReason('Face lost. Please return to camera view.');
            }

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

        // ---- SINGLE FACE ANALYSIS ----
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
            position: Math.abs(pose.yaw) > 25 || Math.abs(pose.pitch) > 20 ? 'TILTED' : 'CENTER',
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
    }, [onViolation, addSuspiciousEvent, computeEAR, computeGaze, computeHeadPose, drawMediaPipeOverlay, screenLocked, lockReason]);

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
                } catch (e) { /* silent */ }
            }
            mediapipeLoopRef.current = requestAnimationFrame(loop);
        };
        mediapipeLoopRef.current = requestAnimationFrame(loop);
    }, [processMediaPipeResult]);

    // ============================================================
    // ✅ START CAMERA & INITIALIZATION
    // ============================================================
    const startCamera = useCallback(async () => {
        try {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
                    audio: false,
                });
            } catch (firstError) {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            streamRef.current = stream;
            if (videoRef.current && isMounted.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
            }
        } catch (error) {
            setCameraActive(false);
            throw new Error('Camera access denied. Please allow camera permissions and refresh.');
        }
    }, []);

    // ============================================================
    // ✅ TENSORFLOW FALLBACK LOGIC
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
                if (i > 4) variance += Math.abs(data[i] - data[i - 4]) + Math.abs(data[i + 1] - data[i - 3]) + Math.abs(data[i + 2] - data[i - 2]);
            }
            brightness = brightness / (data.length / 4);
            variance = variance / (data.length / 4);
            return (variance > 15) && (brightness > 30 && brightness < 220);
        } catch (e) { return true; }
    }, []);

    const detectFaces = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;
        try {
            let faces = [];
            let detectionSuccessful = false;
            if (videoRef.current.readyState < 2) return;

            if (faceDetector) {
                try {
                    const detectionPromise = faceDetector.estimateFaces(videoRef.current);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Detection timeout')), 3000));
                    faces = await Promise.race([detectionPromise, timeoutPromise]);
                    detectionSuccessful = true;
                } catch (tfError) { console.warn('TensorFlow detection failed:', tfError.message); }
            }

            if (!detectionSuccessful || !faceDetector) {
                const facePresent = fallbackDetectFace();
                faces = facePresent ? [{ box: { xMin: 50, yMin: 50, width: 200, height: 200 }, keypoints: [] }] : [];
                if (!usingFallback) { setUsingFallback(true); onStatusUpdate?.({ status: 'fallback' }); }
            }

            const count = faces ? faces.length : 0;
            setFaceCount(count);

            if (count > 1) {
                setMultipleFaces(true);
                setScreenLocked(true); // ✅ BLACK SCREEN
                setLockReason(`Multiple faces detected (${count}). Only one person allowed.`);
                setFaceDetected(true);
                setFaceLostCount(0);
                const event = { type: 'MULTIPLE_FACES', message: `⚠️ Multiple faces detected (${count})`, timestamp: new Date().toISOString(), severity: 'HIGH', count };
                setViolations((prev) => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('MULTIPLE_FACES', event.message);
                sendRealTimeData();
            } else if (count === 0) {
                setFaceDetected(false);
                setMultipleFaces(false);
                setFaceLostCount((prev) => prev + 1);
                if (hasDetectedSingleFace.current) {
                    setScreenLocked(true);
                    setLockReason('Face lost. Please return to camera view.');
                }
                if (faceLostCount > 10) {
                    const event = { type: 'FACE_LOST', message: '⚠️ Student left camera view!', timestamp: new Date().toISOString(), severity: 'MEDIUM' };
                    setViolations((prev) => [...prev, event]);
                    addSuspiciousEvent(event);
                    onViolation?.('FACE_LOST', event.message);
                    sendRealTimeData();
                }
            } else {
                setFaceDetected(true);
                setMultipleFaces(false);
                setFaceLostCount(0);
                if (screenLocked && lockReason.includes('Multiple faces')) {
                    setScreenLocked(false); // UNLOCK
                    setLockReason('');
                }
                if (screenLocked && lockReason.includes('Face lost')) {
                    setScreenLocked(false); // UNLOCK
                    setLockReason('');
                }
                hasDetectedSingleFace.current = true;
            }
            drawFaces(faces || []);
        } catch (error) { console.error('Face Detection Error:', error); }
    }, [isRunning, faceDetector, fallbackDetectFace, usingFallback, faceLostCount, onSuspicious, onViolation, onStatusUpdate, sendRealTimeData, addSuspiciousEvent, screenLocked, lockReason]);

    // (Fallback calculations for eye tracking, head position, object detection remain identical to your code)
    // ... [The rest of your fallback calculation functions: calculateGazeDirection, calculateHeadPosition, calculateEyeOpenness, detectEyeGaze, detectObjects, sendToBackend, captureFrame, drawFaces] ...
    // NOTE: To save space, I am assuming you keep your existing fallback functions. They are untouched.

    // ============================================================
    // MAIN INITIALIZATION
    // ============================================================
    useEffect(() => {
        const setupAI = async () => {
            try {
                setIsInitializing(true);
                setError(null);
                setUsingFallback(false);
                await startCamera();
                const mediapipeOk = await initializeMediaPipe();

                if (mediapipeOk) {
                    setIsInitializing(false);
                    setIsRunning(true);
                    setCameraActive(true);
                    startMediaPipeLoop();
                    
                    try {
                        const objDet = await cocoSsd.load();
                        setObjectDetector(objDet);
                        objectDetectionIntervalRef.current = setInterval(detectObjects, 3000);
                    } catch (e) { }

                    frameCaptureRef.current = setInterval(captureFrame, captureInterval);
                    heartbeatIntervalRef.current = setInterval(sendRealTimeData, 5000);
                    networkCheckRef.current = setInterval(checkNetworkLatency, 10000);
                    setTimeout(sendFaceVerification, 3000);
                    gazeIntervalRef.current = setInterval(sendGazeData, 2000);
                    objectSendIntervalRef.current = setInterval(sendObjectDetection, 5000);

                    onStatusUpdate?.({ status: 'running', message: 'AI Proctor (MediaPipe) active' });
                    toast.success('✅ AI Proctor active');
                    return;
                }

                // Fallback to TensorFlow...
                let faceDet = null;
                try {
                    faceDet = await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, { runtime: 'tfjs', maxFaces: 5 });
                } catch (e) {
                    setUsingFallback(true);
                }
                setFaceDetector(faceDet);

                if (!usingFallback) {
                    try {
                        const landmarkDet = await faceLandmarks.createDetector(faceLandmarks.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs', maxFaces: 1 });
                        setLandmarkDetector(landmarkDet);
                    } catch (e) { }
                    try {
                        const objDet = await cocoSsd.load();
                        setObjectDetector(objDet);
                    } catch (e) { }
                }

                setIsInitializing(false);
                setIsRunning(true);
                setCameraActive(true);
                detectionIntervalRef.current = setInterval(detectFaces, 500);
                
                if (!usingFallback) {
                    eyeTrackingIntervalRef.current = setInterval(detectEyeGaze, 300);
                    objectDetectionIntervalRef.current = setInterval(detectObjects, 2000);
                }

                frameCaptureRef.current = setInterval(captureFrame, captureInterval);
                heartbeatIntervalRef.current = setInterval(sendRealTimeData, 5000);
                networkCheckRef.current = setInterval(checkNetworkLatency, 10000);
                setTimeout(sendFaceVerification, 3000);
                gazeIntervalRef.current = setInterval(sendGazeData, 2000);
                objectSendIntervalRef.current = setInterval(sendObjectDetection, 5000);

                onStatusUpdate?.({ status: usingFallback ? 'fallback' : 'running' });
                toast.success('✅ Camera connected, AI Proctor running');
            } catch (error) {
                setIsInitializing(false);
                setError('AI Proctor initialization failed. Please refresh.');
                onStatusUpdate?.({ status: 'error' });
            }
        };
        setupAI();

        return () => {
            isMounted.current = false;
            clearInterval(detectionIntervalRef.current);
            clearInterval(eyeTrackingIntervalRef.current);
            clearInterval(objectDetectionIntervalRef.current);
            clearInterval(frameCaptureRef.current);
            clearInterval(heartbeatIntervalRef.current);
            clearInterval(networkCheckRef.current);
            clearInterval(gazeIntervalRef.current);
            clearInterval(objectSendIntervalRef.current);
            if (mediapipeLoopRef.current) cancelAnimationFrame(mediapipeLoopRef.current);
            if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch (e) {} }
            if (streamRef.current) { streamRef.current.getTracks().forEach((track) => track.stop()); }
        };
    }, []); // eslint-disable-line

    const retryCamera = async () => {
        try {
            setError(null);
            setIsInitializing(true);
            if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
            await startCamera();
            setIsInitializing(false);
            setIsRunning(true);
            setCameraActive(true);
            toast.success('✅ Camera reconnected!');
        } catch (error) {
            setIsInitializing(false);
            setError('Failed to restart camera. Please refresh the page.');
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div style={{ padding: '16px', background: '#1a1a2e', borderRadius: '12px', textAlign: 'center', position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .spinning { animation: spin 1s linear infinite; }
                .pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
            `}</style>

            {/* ✅ BLACK SCREEN OVERLAY */}
            {screenLocked && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: '#000000',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <AlertCircle size={80} color="#dc2626" />
                    <h1 style={{ fontSize: '32px', marginTop: '20px', fontWeight: 'bold' }}>⚠️ EXAM LOCKED</h1>
                    <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '500px', marginTop: '10px' }}>
                        {lockReason || 'Suspicious activity detected. Please ensure only one person is visible.'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '20px' }}>
                        The screen will automatically unlock when conditions return to normal.
                    </p>
                </div>
            )}

            <div style={{ position: 'relative' }}>
                <video ref={videoRef} style={{ width: '100%', maxWidth: '480px', borderRadius: '8px', background: '#1a1a2e', minHeight: '200px' }} autoPlay playsInline muted />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '8px' }} />

                {cameraActive && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34, 197, 94, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 5 }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />
                        📷 Camera ON
                    </div>
                )}

                {isFlagged && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', animation: 'pulse 1.5s infinite', zIndex: 5 }}>
                        🚨 FLAGGED
                    </div>
                )}

                <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', background: trustScore >= 70 ? 'rgba(34, 197, 94, 0.9)' : trustScore >= 40 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(220, 38, 38, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', zIndex: 5 }}>
                    Trust: {trustScore}%
                </div>

                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: '#22c55e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                    {fps} FPS
                </div>

                {isInitializing && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', zIndex: 10 }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'white', marginTop: '12px', fontSize: '14px' }}>Loading AI Proctor...</p>
                    </div>
                )}

                {error && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: '20px', zIndex: 10 }}>
                        <AlertCircle size={48} color="#dc2626" />
                        <p style={{ color: 'white', marginTop: '12px', fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>{error}</p>
                        <button onClick={retryCamera} style={{ marginTop: '16px', padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} /> Retry Camera
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cameraActive ? '#22c55e' : '#dc2626' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: cameraActive ? '#22c55e' : '#dc2626', className: cameraActive ? 'pulse-dot' : '' }} />
                    {cameraActive ? '📷 Camera ON' : '📷 Camera OFF'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: faceDetected ? '#22c55e' : '#dc2626' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: faceDetected ? '#22c55e' : '#dc2626', className: faceDetected ? '' : 'pulse-dot' }} />
                    {faceDetected ? '✅ Face detected' : '⚠️ No face'}
                </div>
                {multipleFaces && (
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>🚫 Multiple faces!</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: eyeStatus.status === 'OPEN' ? '#22c55e' : '#f59e0b' }}>
                    {eyeStatus.status === 'OPEN' ? '👀 Looking' : '😴 Looking away'}
                    {eyeStatus.gazeDirection !== 'CENTER' && (
                        <span style={{ fontSize: '11px', color: '#f59e0b' }}>({eyeStatus.gazeDirection})</span>
                    )}
                </div>
                {objectDetected.length > 0 && (
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>📱 {objectDetected.join(', ')}</div>
                )}
                {suspiciousCount > 0 && (
                    <div style={{ color: suspiciousCount >= autoFlagThreshold ? '#dc2626' : '#f59e0b', fontWeight: suspiciousCount >= autoFlagThreshold ? 'bold' : 'normal' }}>
                        🚨 {suspiciousCount} alerts
                    </div>
                )}
            </div>

            {suspiciousEvents.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#2d2d44', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace' }}>
                    <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '4px', fontSize: '12px' }}>⚠️ Proctoring Alerts:</div>
                    {suspiciousEvents.slice(0, 5).map((event, index) => (
                        <div key={index} style={{ padding: '4px 8px', borderBottom: index < suspiciousEvents.length - 1 ? '1px solid #3d3d54' : 'none', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{new Date(event.timestamp).toLocaleTimeString()} - {event.message}</span>
                            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '2px', background: event.severity === 'HIGH' ? '#dc2626' : event.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6', color: 'white' }}>
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