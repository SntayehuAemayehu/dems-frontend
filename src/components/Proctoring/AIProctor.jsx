// frontend/src/components/Proctoring/AIProctor.jsx
// COMPLETE FIXED - With fallbacks and fixed toast methods + Backend Integration
// ✅ ALL EXISTING CODE PRESERVED - ONLY FIXES ADDED

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarks from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import { Camera, AlertCircle, RefreshCw, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
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
    onAutoSubmit  // ✅ FIX 1: ADDED - New prop for auto-submit callback
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
    const isMounted = useRef(true);
    const streamRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

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
    const [eyeStatus, setEyeStatus] = useState({
        status: 'OPEN',
        gazeDirection: 'CENTER',
        confidence: 0,
        leftEyeOpen: 1,
        rightEyeOpen: 1,
        gazeX: 0,
        gazeY: 0
    });
    const [headPosition, setHeadPosition] = useState({
        position: 'CENTER',
        tiltX: 0,
        tiltY: 0,
        rotation: 0
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
    const [isExamLocked, setIsExamLocked] = useState(false);
    const [examLocked, setExamLocked] = useState(false);
    
    // ✅ NEW STATE FOR BACKEND INTEGRATION
    const [trustScore, setTrustScore] = useState(100);
    const [networkLatency, setNetworkLatency] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [violations, setViolations] = useState([]);
    const [faceMatchConfidence, setFaceMatchConfidence] = useState(0);
    const [selfieVerified, setSelfieVerified] = useState(false);
    const [mouseMovements, setMouseMovements] = useState([]);
    const [keystrokeData, setKeystrokeData] = useState([]);
    
    // ✅ FIX 2: ADDED - Missing state variables
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelLoadError, setModelLoadError] = useState(null);
    const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

    // ============================================================
    // SIMPLE FALLBACK FACE DETECTION (No TensorFlow)
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
            
            // Check if there's variation in the image (not static)
            let variance = 0;
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += data[i] + data[i+1] + data[i+2];
                if (i > 4) {
                    variance += Math.abs(data[i] - data[i-4]) + 
                               Math.abs(data[i+1] - data[i-3]) + 
                               Math.abs(data[i+2] - data[i-2]);
                }
            }
            brightness = brightness / (data.length / 4);
            variance = variance / (data.length / 4);
            
            // Face is likely present if there's enough variation and brightness
            const hasVariation = variance > 15;
            const hasBrightness = brightness > 30 && brightness < 220;
            
            return hasVariation && hasBrightness;
        } catch (e) {
            console.warn('Fallback detection error:', e);
            return true; // Assume face detected on error
        }
    }, []);

    // ============================================================
    // ✅ NEW: SEND REAL-TIME DATA TO BACKEND (HEARTBEAT)
    // ============================================================
    const sendRealTimeData = useCallback(async () => {
        if (!attemptId || !isRunning || examLocked) return;
        
        try {
            // Calculate trust score based on suspicious events
            const calculatedTrustScore = Math.max(0, 100 - (suspiciousCount * 5) - (violations.length * 3));
            setTrustScore(calculatedTrustScore);
            
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
                // ✅ FIX 3: ADDED - face_count field
                face_count: multipleFaces ? 2 : (faceDetected ? 1 : 0),
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
            };
            
            const response = await api.post(`/exams/attempt/${attemptId}/heartbeat/`, data);
            
            // Check if exam is locked
            if (response.data && response.data.is_locked) {
                setIsExamLocked(true);
                setExamLocked(true);
                toast.error(`🔒 Exam Locked: ${response.data.lock_reason || 'Suspicious activity detected'}`);
                onViolation?.('EXAM_LOCKED', response.data.lock_reason || 'Exam locked due to suspicious activity');
                return;
            }
            
            // Update trust score from backend
            if (response.data && response.data.risk_score !== undefined) {
                setTrustScore(response.data.risk_score);
            }
            
            // Check if flagged
            if (response.data && response.data.is_flagged) {
                setIsFlagged(true);
                toast.error(`🚨 ${response.data.flag_reason || 'Exam flagged for review'}`);
                onViolation?.('BACKEND_FLAGGED', response.data.flag_reason || 'Flagged by AI');
            }
            
        } catch (error) {
            console.debug('Heartbeat error:', error.message);
            // Don't fail completely - continue local monitoring
        }
    }, [attemptId, isRunning, suspiciousCount, violations.length, networkLatency, 
        mouseMovements.length, keystrokeData.length, tabSwitchCount, faceDetected,
        multipleFaces, eyeStatus, headPosition, objectDetected, faceMatchConfidence,
        selfieVerified, onViolation, examLocked]);

    // ============================================================
    // ✅ NEW: SEND FACE VERIFICATION TO BACKEND
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
                    landmarks: {}
                }
            });
            
            if (response.data && response.data.verified !== undefined) {
                setSelfieVerified(response.data.verified);
                setFaceMatchConfidence(response.data.confidence || 0);
                
                if (response.data.is_flagged) {
                    toast.error(`🚨 ${response.data.flag_reason || 'Face verification failed'}`);
                    onViolation?.('FACE_VERIFICATION_FAILED', response.data.flag_reason || 'Face verification failed');
                }
            }
            
        } catch (error) {
            console.debug('Face verification error:', error);
        }
    }, [attemptId, isRunning, faceDetected, faceMatchConfidence, onViolation, examLocked]);

    // ============================================================
    // ✅ NEW: SEND GAZE DATA TO BACKEND
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
    // ✅ NEW: SEND OBJECT DETECTION TO BACKEND
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
    // ✅ NEW: CHECK NETWORK LATENCY
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
    // INITIALIZE DETECTORS WITH FALLBACKS
    // ============================================================
    useEffect(() => {
        const setupAI = async () => {
            try {
                setIsInitializing(true);
                setError(null);
                setUsingFallback(false);
                setFallbackReason('');
                console.log('🔄 Initializing AI Proctor with TensorFlow...');
                
                // Start camera first
                await startCamera();
                
                // 1. Face Detector - with fallback
                let faceDet = null;
                let fallback = false;
                try {
                    console.log('📥 Loading Face Detector...');
                    faceDet = await faceDetection.createDetector(
                        faceDetection.SupportedModels.MediaPipeFaceDetector,
                        { 
                            runtime: 'tfjs', 
                            maxFaces: 5,
                        }
                    );
                    console.log('✅ Face Detector loaded');
                } catch (tfError) {
                    console.warn('⚠️ TensorFlow face detection failed, using fallback:', tfError);
                    fallback = true;
                    setFallbackReason('TensorFlow face detection not available, using fallback detection');
                    setUsingFallback(true);
                    faceDet = null;
                }
                setFaceDetector(faceDet);

                // 2. Face Landmarks - skip if fallback
                if (!fallback) {
                    try {
                        console.log('📥 Loading Face Landmarks...');
                        const landmarkDet = await faceLandmarks.createDetector(
                            faceLandmarks.SupportedModels.MediaPipeFaceMesh,
                            { 
                                runtime: 'tfjs', 
                                maxFaces: 1,
                            }
                        );
                        setLandmarkDetector(landmarkDet);
                        console.log('✅ Face Landmarks loaded');
                    } catch (landmarkError) {
                        console.warn('⚠️ Face landmarks not available:', landmarkError);
                        setLandmarkDetector(null);
                    }
                }

                // 3. Object Detector - try to load, but don't fail if not available
                if (!fallback) {
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
                
                // Start all detection loops
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
                
                // ✅ START HEARTBEAT FOR BACKEND INTEGRATION
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = setInterval(() => {
                    sendRealTimeData();
                }, 5000); // Send heartbeat every 5 seconds
                
                // ✅ START NETWORK LATENCY CHECK
                setInterval(checkNetworkLatency, 10000);
                
                // ✅ SEND FACE VERIFICATION ONCE
                setTimeout(() => {
                    sendFaceVerification();
                }, 3000);
                
                // ✅ START GAZE DATA EVERY 2 SECONDS
                setInterval(() => {
                    sendGazeData();
                }, 2000);
                
                // ✅ START OBJECT DETECTION EVERY 5 SECONDS
                setInterval(() => {
                    sendObjectDetection();
                }, 5000);
                
                onStatusUpdate?.({ 
                    status: fallback ? 'fallback' : 'running', 
                    message: fallback ? 'Using fallback detection mode' : 'AI Proctor is active' 
                });
                
                if (fallback) {
                    toast('⚠️ Using fallback face detection mode. Some features may be limited.');
                } else {
                    toast.success('✅ Camera connected, AI Proctor running');
                }
                console.log('✅ Camera started, AI Proctor running' + (fallback ? ' (fallback mode)' : ''));
                
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
            // Cleanup all intervals
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (eyeTrackingIntervalRef.current) clearInterval(eyeTrackingIntervalRef.current);
            if (objectDetectionIntervalRef.current) clearInterval(objectDetectionIntervalRef.current);
            if (frameCaptureRef.current) clearInterval(frameCaptureRef.current);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            // Stop camera
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // ============================================================
    // START CAMERA WITH FALLBACK
    // ============================================================
    const startCamera = async () => {
        try {
            console.log('📷 Starting camera...');
            
            // Try with ideal settings first
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'user', 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                });
            } catch (firstError) {
                console.warn('First camera attempt failed, trying fallback:', firstError);
                // Fallback: simpler constraints
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: false
                    });
                } catch (secondError) {
                    console.warn('Second camera attempt failed, trying minimal:', secondError);
                    // Last resort: any camera
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
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
    };

    // ============================================================
    // 1. FACE DETECTION (with fallback) - ✅ FIXED
    // ============================================================
    const detectFaces = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;

        try {
            let faces = [];
            let detectionSuccessful = false;
            
            // ✅ FIX 4: ADDED - Check if video is ready
            if (videoRef.current.readyState < 2) {
                return;
            }
            
            // Try TensorFlow face detection
            if (faceDetector) {
                try {
                    // ✅ FIX 5: ADDED - Timeout to prevent hanging
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
                    // Fallback to simple detection
                }
            }
            
            // Use fallback if TensorFlow failed or not available
            if (!detectionSuccessful || !faceDetector) {
                const facePresent = fallbackDetectFace();
                if (facePresent) {
                    // Simulate a face detection result
                    faces = [{
                        box: { xMin: 50, yMin: 50, width: 200, height: 200 },
                        keypoints: []
                    }];
                } else {
                    faces = [];
                }
                // Update fallback indicator
                if (!usingFallback) {
                    setUsingFallback(true);
                    setFallbackReason('Using fallback face detection');
                    onStatusUpdate?.({ status: 'fallback', message: 'Using fallback face detection' });
                }
            }
            
            // Update FPS
            const now = Date.now();
            setFps(Math.round(1000 / (now - lastFrameTime)));
            setLastFrameTime(now);
            
            // ✅ FIX 6: ADDED - Count faces
            const faceCount = faces ? faces.length : 0;
            
            // ✅ FIX 7: IMPROVED - Multiple faces detection with auto-submit
            if (faceCount > 1) {
                setMultipleFaces(true);
                setFaceDetected(true);
                setFaceLostCount(0);
                
                const event = {
                    type: 'MULTIPLE_FACES',
                    message: `⚠️ Multiple faces detected (${faceCount} faces)`,
                    timestamp: new Date().toISOString(),
                    severity: 'HIGH',
                    count: faceCount
                };
                
                // ✅ Update violations
                setViolations(prev => [...prev, event]);
                setTabSwitchCount(prev => prev + 1);
                
                // ✅ FIX 8: ADDED - Auto-submit on multiple faces threshold
                setSuspiciousCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= autoFlagThreshold) {
                        setIsFlagged(true);
                        setAutoSubmitTriggered(true);
                        onViolation?.('AUTO_FLAGGED', `Multiple faces detected ${newCount} times`);
                        
                        // ✅ TRIGGER AUTO-SUBMIT
                        if (onAutoSubmit) {
                            onAutoSubmit({
                                reason: `Multiple faces detected ${newCount} times`,
                                type: 'MULTIPLE_FACES_THRESHOLD',
                                count: newCount
                            });
                        }
                    }
                    return newCount;
                });
                
                onSuspicious?.(event);
                onViolation?.('MULTIPLE_FACES', event.message);
                
                // ✅ Send to backend immediately
                sendRealTimeData();
                
            } 
            // No face - Student left
            else if (faceCount === 0) {
                setFaceDetected(false);
                setMultipleFaces(false);
                setFaceLostCount(prev => prev + 1);
                
                if (faceLostCount > 10) { // 5 seconds
                    const event = {
                        type: 'FACE_LOST',
                        message: '⚠️ Student left camera view!',
                        timestamp: new Date().toISOString(),
                        severity: 'MEDIUM',
                        duration: faceLostCount * 0.5
                    };
                    
                    setViolations(prev => [...prev, event]);
                    setSuspiciousCount(prev => prev + 1);
                    onSuspicious?.(event);
                    onViolation?.('FACE_LOST', event.message);
                    
                    // ✅ FIX 9: ADDED - Auto-submit if face lost too long
                    if (faceLostCount > 20) {
                        setIsFlagged(true);
                        setAutoSubmitTriggered(true);
                        onViolation?.('AUTO_FLAGGED', 'Face lost for too long');
                        if (onAutoSubmit) {
                            onAutoSubmit({
                                reason: 'Face lost for too long',
                                type: 'FACE_LOST_THRESHOLD',
                                duration: faceLostCount * 0.5
                            });
                        }
                    }
                    
                    // ✅ Send to backend immediately
                    sendRealTimeData();
                }
            } 
            // Single face - All good
            else {
                setFaceDetected(true);
                setMultipleFaces(false);
                setFaceLostCount(0);
            }
            
            // Draw on canvas for visualization
            drawFaces(faces || []);
            
        } catch (error) {
            console.error('Face Detection Error:', error);
            // Don't fail completely - use fallback next time
        }
    }, [isRunning, faceDetector, fallbackDetectFace, usingFallback, lastFrameTime, faceLostCount, onSuspicious, onViolation, onStatusUpdate, sendRealTimeData, autoFlagThreshold, onAutoSubmit]);

    // ============================================================
    // 2. EYE TRACKING + GAZE DIRECTION (simplified fallback)
    // ============================================================
    const detectEyeGaze = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;
        if (!landmarkDetector) {
            // Simulate eye tracking with fallback
            setEyeStatus({
                status: 'OPEN',
                gazeDirection: 'CENTER',
                confidence: 0.5,
                leftEyeOpen: 0.8,
                rightEyeOpen: 0.8,
                gazeX: 0,
                gazeY: 0
            });
            return;
        }

        try {
            const faces = await landmarkDetector.estimateFaces(videoRef.current);
            
            if (faces && faces.length > 0) {
                const face = faces[0];
                const landmarks = face.keypoints || face.landmarks;
                
                if (landmarks && landmarks.length > 0) {
                    // MediaPipe Face Mesh indices
                    const leftEye = {
                        top: landmarks[159],
                        bottom: landmarks[145],
                        left: landmarks[33],
                        right: landmarks[133],
                        iris: landmarks[468]
                    };
                    const rightEye = {
                        top: landmarks[386],
                        bottom: landmarks[374],
                        left: landmarks[263],
                        right: landmarks[362],
                        iris: landmarks[473]
                    };
                    
                    // Calculate eye openness
                    const leftOpen = calculateEyeOpenness(leftEye);
                    const rightOpen = calculateEyeOpenness(rightEye);
                    const avgOpen = (leftOpen + rightOpen) / 2;
                    
                    // GAZE DIRECTION
                    const gazeData = calculateGazeDirection(leftEye, rightEye, face);
                    
                    // Check if eyes are closed
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
                                confidence: gazeData.confidence
                            });
                            
                            const event = {
                                type: 'EYES_CLOSED',
                                message: '⚠️ Eyes closed for extended period!',
                                timestamp: new Date().toISOString(),
                                severity: 'MEDIUM',
                                duration: 1,
                                leftOpen: leftOpen,
                                rightOpen: rightOpen
                            };
                            
                            setViolations(prev => [...prev, event]);
                            addSuspiciousEvent(event);
                            onSuspicious?.(event);
                            
                            // ✅ Send to backend
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
                            confidence: gazeData.confidence
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
                                    gazeY: gazeData.gazeY
                                };
                                
                                setViolations(prev => [...prev, event]);
                                addSuspiciousEvent(event);
                                onSuspicious?.(event);
                                
                                // ✅ Send to backend
                                sendGazeData();
                                sendRealTimeData();
                            }
                        } else {
                            setEyeStatus(newEyeStatus);
                        }
                    }
                    
                    // Check head position
                    const headData = calculateHeadPosition(face);
                    if (headData.tiltX > 25 || headData.tiltX < -25 || 
                        headData.tiltY > 20 || headData.tiltY < -20) {
                        
                        if (headPosition.position === 'CENTER') {
                            setHeadPosition({
                                position: 'TILTED',
                                tiltX: headData.tiltX,
                                tiltY: headData.tiltY,
                                rotation: headData.rotation
                            });
                            
                            const event = {
                                type: 'HEAD_TILTED',
                                message: `⚠️ Head tilted (${Math.round(headData.tiltX)}°, ${Math.round(headData.tiltY)}°)`,
                                timestamp: new Date().toISOString(),
                                severity: 'LOW',
                                tiltX: headData.tiltX,
                                tiltY: headData.tiltY
                            };
                            
                            setViolations(prev => [...prev, event]);
                            addSuspiciousEvent(event);
                            onSuspicious?.(event);
                            
                            // ✅ Send to backend
                            sendGazeData();
                            sendRealTimeData();
                        }
                    } else {
                        setHeadPosition({
                            position: 'CENTER',
                            tiltX: headData.tiltX,
                            tiltY: headData.tiltY,
                            rotation: headData.rotation
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error('Eye Tracking Error:', error);
            // Don't fail completely
        }
    }, [isRunning, landmarkDetector, eyeStatus, headPosition, onSuspicious, sendGazeData, sendRealTimeData]);

    // ============================================================
    // GAZE DIRECTION CALCULATION
    // ============================================================
    const calculateGazeDirection = (leftEye, rightEye, face) => {
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
            y: (leftEye.iris.y - leftEye.top.y) / 
                (leftEye.bottom.y - leftEye.top.y || 1)
        };
        const rightIrisPos = {
            x: (rightEye.iris.x - rightEye.left.x) / rightEyeWidth,
            y: (rightEye.iris.y - rightEye.top.y) / 
                (rightEye.bottom.y - rightEye.top.y || 1)
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
        
        if (avgX < 0.35 && avgY < 0.3) {
            direction = 'UP_LEFT';
        } else if (avgX > 0.65 && avgY < 0.3) {
            direction = 'UP_RIGHT';
        } else if (avgX < 0.35 && avgY > 0.7) {
            direction = 'DOWN_LEFT';
        } else if (avgX > 0.65 && avgY > 0.7) {
            direction = 'DOWN_RIGHT';
        }
        
        const gazeX = (avgX - 0.5) * 2;
        const gazeY = (avgY - 0.5) * 2;
        
        return {
            direction: direction,
            gazeX: gazeX,
            gazeY: gazeY,
            confidence: confidence
        };
    };

    // ============================================================
    // HEAD POSITION CALCULATION
    // ============================================================
    const calculateHeadPosition = (face) => {
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
            y: (leftEye.y + rightEye.y) / 2
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
            y: (leftMouth.y + rightMouth.y) / 2
        };
        const rotation = Math.atan2(
            (rightMouth.y - leftMouth.y),
            (rightMouth.x - leftMouth.x)
        ) * 180 / Math.PI;
        
        return {
            tiltX: tiltX,
            tiltY: tiltY,
            rotation: rotation
        };
    };

    // ============================================================
    // HELPERS
    // ============================================================
    const calculateEyeOpenness = (eye) => {
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
    };

    // ============================================================
    // 3. OBJECT DETECTION
    // ============================================================
    const detectObjects = useCallback(async () => {
        if (!isRunning || !videoRef.current || !objectDetector || !isMounted.current) return;

        try {
            const predictions = await objectDetector.detect(videoRef.current);
            
            const suspiciousObjects = [
                'cell phone', 'mobile phone', 'phone',
                'book', 'laptop', 'computer', 'keyboard',
                'remote', 'tv', 'monitor',
                'bottle', 'cup', 'glass'
            ];
            
            const detected = predictions.filter(p => 
                suspiciousObjects.some(obj => 
                    p.class.toLowerCase().includes(obj)
                ) && p.score > 0.6
            );
            
            if (detected.length > 0) {
                const objectNames = detected.map(d => d.class);
                const uniqueObjects = [...new Set(objectNames)];
                
                setObjectDetected(uniqueObjects);
                
                const highConfidenceObjects = detected.filter(d => d.score > 0.8);
                if (highConfidenceObjects.length > 0) {
                    const event = {
                        type: 'OBJECT_DETECTED',
                        message: `📱 Suspicious object detected: ${uniqueObjects.join(', ')}`,
                        timestamp: new Date().toISOString(),
                        severity: 'HIGH',
                        objects: uniqueObjects,
                        confidence: Math.max(...detected.map(d => d.score))
                    };
                    
                    setViolations(prev => [...prev, event]);
                    addSuspiciousEvent(event);
                    onSuspicious?.(event);
                    onViolation?.('OBJECT_DETECTED', event.message);
                    
                    // ✅ Send to backend
                    sendObjectDetection();
                    sendRealTimeData();
                }
            } else {
                setObjectDetected([]);
            }
            
        } catch (error) {
            console.error('Object Detection Error:', error);
        }
    }, [isRunning, objectDetector, onSuspicious, onViolation, sendObjectDetection, sendRealTimeData]);

    // ============================================================
    // 4. CAPTURE FRAME
    // ============================================================
    const captureFrame = useCallback(async () => {
        if (!isRunning || !videoRef.current || !isMounted.current) return;
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            setCaptureCount(prev => prev + 1);
            
            await sendToBackend(imageData);
            
        } catch (error) {
            console.error('Frame capture error:', error);
        }
    }, [isRunning]);

    const sendToBackend = async (imageData) => {
        try {
            const response = await proctoringService.captureImage(attemptId, imageData, {
                faceDetected: faceDetected,
                multipleFaces: multipleFaces,
                eyeStatus: eyeStatus,
                headPosition: headPosition,
                objectsDetected: objectDetected,
                suspiciousCount: suspiciousCount
            });
            
            if (response && response.is_flagged) {
                setIsFlagged(true);
                const event = {
                    type: 'AUTO_FLAGGED',
                    message: `🚨 Auto-flagged: ${response.reason || 'Suspicious activity'}`,
                    timestamp: new Date().toISOString(),
                    severity: 'HIGH',
                    reason: response.reason,
                    suspicious_events: response.suspicious_events
                };
                setViolations(prev => [...prev, event]);
                addSuspiciousEvent(event);
                onViolation?.('AUTO_FLAGGED', response.reason || 'Suspicious activity detected');
            }
            
        } catch (error) {
            console.debug('Proctoring backend error:', error.message);
        }
    };

    // ============================================================
    // 5. SUSPICIOUS EVENT MANAGEMENT - ✅ FIXED
    // ============================================================
    const addSuspiciousEvent = (event) => {
        setSuspiciousEvents(prev => {
            const newEvents = [event, ...prev].slice(0, 50);
            return newEvents;
        });
        
        setSuspiciousCount(prev => {
            const newCount = prev + 1;
            
            // ✅ FIX 10: ADDED - Auto-submit on threshold
            if (newCount >= autoFlagThreshold) {
                setIsFlagged(true);
                setAutoSubmitTriggered(true);
                onViolation?.('AUTO_FLAGGED', `Too many suspicious events (${newCount})`);
                sendRealTimeData();
                
                // ✅ TRIGGER AUTO-SUBMIT
                if (onAutoSubmit) {
                    onAutoSubmit({
                        reason: `Too many suspicious events (${newCount})`,
                        type: 'SUSPICIOUS_THRESHOLD',
                        count: newCount
                    });
                }
            }
            return newCount;
        });
    };

    // ============================================================
    // 6. DRAW FACES ON CANVAS
    // ============================================================
    const drawFaces = useCallback((faces) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;
        
        if (!video) return;
        
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw gaze direction
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
            
            ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.font = '14px Arial';
            ctx.fillText(`Gaze: ${eyeStatus.gazeDirection}`, 10, 30);
        }
        
        // Draw face boxes
        faces.forEach((face, index) => {
            const box = face.box || face.boundingBox;
            if (box) {
                const x = box.xMin || box.x;
                const y = box.yMin || box.y;
                const w = box.width || (box.xMax - box.xMin);
                const h = box.height || (box.yMax - box.yMin);
                
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
                    face.keypoints.forEach(point => {
                        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                }
            }
        });
        
        drawStatusOverlay(ctx, canvas);
    }, [eyeStatus, faceDetected]);

    // ============================================================
    // 7. STATUS OVERLAY
    // ============================================================
    const drawStatusOverlay = (ctx, canvas) => {
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(w - 220, 10, 210, 120);
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
            usingFallback ? `🔧 Fallback Mode` : `⚡ AI Mode`
        ];
        
        statuses.forEach((status, i) => {
            const y = 30 + i * 14;
            ctx.fillStyle = status.includes('⚠️') || status.includes('❌') ? '#ef4444' : 
                           status.includes('🚨') ? '#dc2626' : '#22c55e';
            ctx.fillText(status, w - 210, y);
        });
    };

    // ============================================================
    // 8. RETRY CAMERA
    // ============================================================
    const retryCamera = async () => {
        try {
            setError(null);
            setIsInitializing(true);
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
            // Reset reconnect attempts
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
        <div style={{ 
            padding: '16px', 
            background: '#1a1a2e', 
            borderRadius: '12px',
            textAlign: 'center',
            position: 'relative',
            maxWidth: '480px',
            margin: '0 auto',
        }}>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
                .pulse-dot {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                .btn-retry {
                    transition: all 0.3s ease;
                }
                .btn-retry:hover {
                    transform: scale(1.05);
                    background: #2563eb !important;
                }
                .camera-badge {
                    animation: pulse 2s ease-in-out infinite;
                }
                .fallback-badge {
                    background: #f59e0b;
                    color: #92400e;
                    padding: 2px 10px;
                    borderRadius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
            `}</style>
            
            {/* Video Feed */}
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
                        borderRadius: '8px'
                    }}
                />
                
                {/* Camera ON Badge */}
                {cameraActive && (
                    <div style={{
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
                        className: 'camera-badge'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'white',
                            animation: 'pulse 1.5s infinite'
                        }} />
                        📷 Camera ON
                    </div>
                )}
                
                {/* Fallback Badge */}
                {usingFallback && (
                    <div style={{
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
                    }}>
                        🔧 Fallback Mode
                    </div>
                )}
                
                {/* Status Badge */}
                {isFlagged && (
                    <div style={{
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
                    }}>
                        🚨 FLAGGED
                    </div>
                )}
                
                {/* Trust Score Badge */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: trustScore >= 70 ? 'rgba(34, 197, 94, 0.9)' : 
                               trustScore >= 40 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 5,
                }}>
                    Trust: {trustScore}%
                </div>
                
                {/* FPS Counter */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#22c55e',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                }}>
                    {fps} FPS
                </div>

                {/* Initializing Overlay */}
                {isInitializing && (
                    <div style={{
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
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid rgba(255,255,255,0.2)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{ color: 'white', marginTop: '12px', fontSize: '14px' }}>
                            Loading AI Proctor...
                        </p>
                        <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '12px' }}>
                            {usingFallback ? 'Using fallback detection' : 'Face detection & eye tracking'}
                        </p>
                    </div>
                )}
                
                {/* Error Overlay */}
                {error && (
                    <div style={{
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
                    }}>
                        <AlertCircle size={48} color="#dc2626" />
                        <p style={{ 
                            color: 'white', 
                            marginTop: '12px', 
                            fontSize: '14px',
                            textAlign: 'center',
                            maxWidth: '300px',
                        }}>
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

            {/* Status Indicators */}
            <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                fontSize: '13px'
            }}>
                {/* Camera Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: cameraActive ? '#22c55e' : '#dc2626'
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: cameraActive ? '#22c55e' : '#dc2626',
                        className: cameraActive ? 'pulse-dot' : ''
                    }} />
                    {cameraActive ? '📷 Camera ON' : '📷 Camera OFF'}
                </div>

                {/* Face Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: faceDetected ? '#22c55e' : '#dc2626'
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: faceDetected ? '#22c55e' : '#dc2626',
                        className: faceDetected ? '' : 'pulse-dot'
                    }} />
                    {faceDetected ? '✅ Face detected' : '⚠️ No face'}
                </div>

                {multipleFaces && (
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        🚫 Multiple faces!
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: eyeStatus.status === 'OPEN' ? '#22c55e' : '#f59e0b'
                }}>
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
                    <div style={{ 
                        color: suspiciousCount >= autoFlagThreshold ? '#dc2626' : '#f59e0b',
                        fontWeight: suspiciousCount >= autoFlagThreshold ? 'bold' : 'normal'
                    }}>
                        🚨 {suspiciousCount} alerts
                    </div>
                )}

                <div style={{ color: '#64748b', fontSize: '11px' }}>
                    📸 {captureCount}
                </div>

                <div style={{ color: '#64748b', fontSize: '11px' }}>
                    🌐 {networkLatency}ms
                </div>

                {usingFallback && (
                    <div style={{ 
                        color: '#f59e0b', 
                        fontSize: '11px',
                        border: '1px solid #f59e0b',
                        padding: '2px 8px',
                        borderRadius: '4px'
                    }}>
                        🔧 Fallback Mode
                    </div>
                )}

                {/* ✅ FIX 11: ADDED - Auto-Submit Triggered Display */}
                {autoSubmitTriggered && (
                    <div style={{ 
                        color: '#dc2626', 
                        fontWeight: 'bold',
                        animation: 'pulse 0.5s infinite',
                        fontSize: '14px',
                        background: 'rgba(220,38,38,0.2)',
                        padding: '4px 12px',
                        borderRadius: '4px'
                    }}>
                        🔴 AUTO-SUBMIT TRIGGERED!
                    </div>
                )}
            </div>

            {/* Suspicious Events Log */}
            {suspiciousEvents.length > 0 && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#2d2d44',
                    borderRadius: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                }}>
                    <div style={{ 
                        fontWeight: 'bold', 
                        color: '#dc2626', 
                        marginBottom: '4px',
                        fontSize: '12px'
                    }}>
                        ⚠️ Proctoring Alerts:
                    </div>
                    {suspiciousEvents.slice(0, 5).map((event, index) => (
                        <div key={index} style={{
                            padding: '4px 8px',
                            borderBottom: index < suspiciousEvents.length - 1 ? '1px solid #3d3d54' : 'none',
                            color: '#e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                {new Date(event.timestamp).toLocaleTimeString()} - {event.message}
                            </span>
                            <span style={{
                                fontSize: '9px',
                                padding: '1px 6px',
                                borderRadius: '2px',
                                background: event.severity === 'HIGH' ? '#dc2626' : 
                                          event.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6',
                                color: 'white'
                            }}>
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