// frontend/src/components/Proctoring/AIProctor.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { AlertCircle, RefreshCw, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getWebSocketUrl } from '../../api/api';
import { useSelector } from 'react-redux';

const AIProctor = ({
  attemptId,
  examId,
  studentId,
  onViolation,
  onAutoSubmit,
  onStatusUpdate,
}) => {
  const { user } = useSelector((state) => state.auth || {});

  // ==================== REFS ====================
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const mediapipeLoopRef = useRef(null);
  const imageIntervalRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const isMounted = useRef(true);
  const hasDetectedSingleFace = useRef(false);
  const faceLostFramesRef = useRef(0);
  const lastMultipleFaceTime = useRef(0);

  // WebRTC refs
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const createPeerConnectionRef = useRef(null);
  const createOfferRef = useRef(null);
  const liveStreamStartTimeoutRef = useRef(null);

  // ==================== STATE ====================
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [usingMediaPipe, setUsingMediaPipe] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // ==================== SEND IMAGE ====================
  const sendImage = useCallback(
    async (isWarning = false, reason = '') => {
      if (!attemptId || !videoRef.current) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        await api.post('/proctoring/sessions/capture/', {
          exam_id: attemptId,
          image_data: imageData,
          metadata: {
            face_detected: faceDetected,
            multiple_faces: multipleFaces,
            face_count: faceCount,
            is_warning: isWarning,
            warning_reason: reason,
          },
        });
      } catch (err) {
        console.debug('Proctor image send failed:', err.message);
      }
    },
    [attemptId, faceDetected, multipleFaces, faceCount]
  );

  // ==================== WEBRTC - CONNECT TO TEACHER ====================
  const startLiveStream = useCallback(async () => {
    if (!examId || !streamRef.current) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const wsUrl = getWebSocketUrl(`/ws/exam-proctor/${examId}/`, { token });

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('📡 Exam proctor WebSocket connected');
        setLiveConnected(true);
        createPeerConnectionRef.current?.();
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'user_join' && data.role === 'TEACHER') {
            console.log('Teacher joined, re-sending offer...');
            createPeerConnectionRef.current?.();
          };

          if (data.type === 'answer' && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            const pendingCandidates = pendingIceCandidatesRef.current;
            pendingIceCandidatesRef.current = [];
            await Promise.all(pendingCandidates.map((candidate) =>
              pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            ));
          }

          if (data.type === 'ice_candidate' && data.candidate && pcRef.current) {
            if (pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              pendingIceCandidatesRef.current.push(data.candidate);
            }
          }
        } catch (err) {
          console.error('WS message error:', err);
        }
      }

      wsRef.current.onclose = () => {
        setLiveConnected(false);
        console.log('Exam proctor WebSocket closed');
      };

      wsRef.current.onerror = (err) => {
        console.error('Exam proctor WS error:', err);
        setLiveConnected(false);
      };
    } catch (err) {
      console.error('Failed to start live stream:', err);
    }
  }, [examId]);

  const createPeerConnection = useCallback(() => {
    try {
      if (pcRef.current) {
        pcRef.current.close();
      }
      pendingIceCandidatesRef.current = [];

      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      pcRef.current = new RTCPeerConnection(config);

      // Add local camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, streamRef.current);
        });
      }

      // Send ICE candidates
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'ice_candidate',
              candidate: event.candidate,
              sender_id: user?.id,
            })
          );
        }
      };

      // Create and send offer (Student is the one offering)
      createOfferRef.current?.();
    } catch (err) {
      console.error('PeerConnection error:', err);
    }
  }, [user]);
  createPeerConnectionRef.current = createPeerConnection;

  const createOffer = useCallback(async () => {
    if (!pcRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;

    try {
      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pcRef.current.setLocalDescription(offer);

      wsRef.current.send(
        JSON.stringify({
          type: 'offer',
          offer: offer,
          sender: user?.full_name,
          sender_role: user?.role,
          sender_id: user?.id,
        })
      );
    } catch (err) {
      console.error('Create offer error:', err);
    }
  }, [user]);
  createOfferRef.current = createOffer;

  // ==================== MEDIAPIPE ====================
  const initializeMediaPipe = useCallback(async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 5,
      });

      landmarkerRef.current = landmarker;
      setUsingMediaPipe(true);
      return true;
    } catch (err) {
      console.warn('MediaPipe failed:', err);
      setUsingMediaPipe(false);
      return false;
    }
  }, []);

  // ==================== PROCESS RESULT ====================
  const processResult = useCallback(
    (result) => {
      const faces = result.faceLandmarks || [];
      const count = faces.length;

      setFaceCount(count);

      if (count > 1) {
        setMultipleFaces(true);
        setFaceDetected(true);
        faceLostFramesRef.current = 0;

        const now = Date.now();
        if (now - lastMultipleFaceTime.current > 2500) {
          lastMultipleFaceTime.current = now;
          onViolation?.('MULTIPLE_FACES', `Multiple faces detected (${count})`);
          sendImage(true, 'MULTIPLE_FACES');
        }
        return;
      }

      if (count === 0) {
        setFaceDetected(false);
        setMultipleFaces(false);
        faceLostFramesRef.current += 1;

        if (hasDetectedSingleFace.current && faceLostFramesRef.current > 45) {
          faceLostFramesRef.current = 0;
          onViolation?.('FACE_LOST', 'No face detected');
          sendImage(true, 'FACE_LOST');
        }
        return;
      }

      setFaceDetected(true);
      setMultipleFaces(false);
      faceLostFramesRef.current = 0;
      hasDetectedSingleFace.current = true;
    },
    [onViolation, sendImage]
  );

  // ==================== MEDIAPIPE LOOP ====================
  const startLoop = useCallback(() => {
    let lastTs = performance.now();
    let frameCount = 0;

    const loop = () => {
      if (!isMounted.current || !landmarkerRef.current || !videoRef.current) {
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
          processResult(result);

          frameCount++;
          if (ts - lastTs >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTs = ts;
          }
        } catch (e) {}
      }

      mediapipeLoopRef.current = requestAnimationFrame(loop);
    };

    mediapipeLoopRef.current = requestAnimationFrame(loop);
  }, [processResult]);

  // ==================== START CAMERA ====================
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setCameraActive(false);
      throw new Error('Camera access denied');
    }
  }, []);

  // ==================== INIT ====================
  useEffect(() => {
    const setup = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        await startCamera();
        liveStreamStartTimeoutRef.current = setTimeout(() => {
          startLiveStream();
        }, 1500);
        const ok = await initializeMediaPipe();

        if (ok) {
          startLoop();

          // Normal image every 60 seconds
          imageIntervalRef.current = setInterval(() => {
            sendImage(false);
          }, 60000);

          setIsInitializing(false);
          onStatusUpdate?.({ status: 'running' });
          toast.success('AI Proctor active');
        } else {
          setError('Failed to load face detection model');
          setIsInitializing(false);
        }
      } catch (err) {
        setError(err.message || 'Camera / AI init failed');
        setIsInitializing(false);
      }
    };

    setup();

    return () => {
      isMounted.current = false;
      if (mediapipeLoopRef.current) cancelAnimationFrame(mediapipeLoopRef.current);
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
      if (liveStreamStartTimeoutRef.current) clearTimeout(liveStreamStartTimeoutRef.current);
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  // ==================== RETRY ====================
  const retryCamera = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      await startCamera();
      setIsInitializing(false);
      setCameraActive(true);
      toast.success('Camera reconnected');
    } catch (err) {
      setError('Failed to restart camera');
      setIsInitializing(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: 'white',
      }}
    >
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: 10,
            background: '#0f172a',
            minHeight: 220,
            transform: 'scaleX(-1)',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Status badges */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: cameraActive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {cameraActive ? '📷 Camera ON' : '📷 Camera OFF'}
          </span>

          <span
            style={{
              background: faceDetected ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {faceDetected ? '✅ Face' : '⚠️ No Face'}
          </span>

          {multipleFaces && (
            <span
              style={{
                background: 'rgba(220,38,38,0.95)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              🚫 Multiple Faces
            </span>
          )}

          <span
            style={{
              background: liveConnected ? 'rgba(59,130,246,0.9)' : 'rgba(100,116,139,0.9)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {liveConnected ? '📡 Live to Teacher' : '📡 Connecting...'}
          </span>
        </div>

        {/* FPS */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.6)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          {fps} FPS
        </div>

        {/* Loading */}
        {isInitializing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(255,255,255,0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: 12, fontSize: 14 }}>Loading AI Proctor...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <AlertCircle size={40} color="#ef4444" />
            <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>{error}</p>
            <button
              onClick={retryCamera}
              style={{
                marginTop: 16,
                padding: '8px 20px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}
      </div>

      {/* Bottom status */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#94a3b8',
        }}
      >
        <span>{usingMediaPipe ? 'MediaPipe Active' : 'Fallback Mode'}</span>
        <span>Proctoring ON</span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIProctor;