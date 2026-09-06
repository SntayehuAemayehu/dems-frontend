// frontend/src/pages/LiveClass.jsx
// COMPLETE FIXED - WebSocket connection with auto-reconnect

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const LiveClass = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});
    
    // ============================================================
    // STATE
    // ============================================================
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [error, setError] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const isTeacher = user?.role === 'TEACHER';
    
    // ============================================================
    // REFS
    // ============================================================
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const wsRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const isMounted = useRef(true);
    const reconnectTimerRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const maxReconnectAttempts = 5;

    // ============================================================
    // CLEANUP FUNCTION
    // ============================================================
    const cleanup = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (wsRef.current) {
            try {
                wsRef.current.close(1000, 'User left');
            } catch (e) {
                // Ignore
            }
            wsRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setIsConnected(false);
        setParticipants([]);
    }, []);

    // ============================================================
    // CREATE PEER CONNECTION
    // ============================================================
    const createPeerConnection = useCallback(() => {
        try {
            const config = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
                iceCandidatePoolSize: 5,
            };
            
            pcRef.current = new RTCPeerConnection(config);
            
            // Add local tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pcRef.current.addTrack(track, localStreamRef.current);
                });
            }
            
            // Handle remote tracks
            pcRef.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                        console.log('📺 Remote stream received');
                    }
                }
            };
            
            // Handle ICE candidates
            pcRef.current.onicecandidate = (event) => {
                if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'ice_candidate',
                        candidate: event.candidate,
                        sender_id: user?.id
                    }));
                }
            };
            
            // Connection state
            pcRef.current.onconnectionstatechange = () => {
                const state = pcRef.current?.connectionState;
                console.log('🔗 Peer connection:', state);
                if (state === 'connected') {
                    toast.success('Peer connected!');
                } else if (state === 'failed') {
                    toast.error('Peer connection failed');
                }
            };
            
            // Teacher sends offer
            if (isTeacher) {
                console.log('👨‍🏫 Teacher creating offer...');
                setTimeout(createOffer, 1500);
            }
            
        } catch (err) {
            console.error('Peer connection error:', err);
        }
    }, [user, isTeacher]);

    // ============================================================
    // CREATE OFFER (Teacher)
    // ============================================================
    const createOffer = useCallback(async () => {
        if (!pcRef.current || !wsRef.current) return;
        
        try {
            const offer = await pcRef.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pcRef.current.setLocalDescription(offer);
            
            wsRef.current.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                sender: user?.full_name,
                sender_role: user?.role,
                sender_id: user?.id
            }));
            
            console.log('📤 Offer sent to students');
        } catch (err) {
            console.error('Offer error:', err);
        }
    }, [user]);

    // ============================================================
    // HANDLE WEBSOCKET MESSAGES
    // ============================================================
    const handleMessage = useCallback(async (data) => {
        if (!pcRef.current) return;
        
        try {
            switch (data.type) {
                case 'offer':
                    if (data.sender_id !== user?.id) {
                        console.log('📥 Received offer from teacher');
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answer = await pcRef.current.createAnswer();
                        await pcRef.current.setLocalDescription(answer);
                        
                        wsRef.current?.send(JSON.stringify({
                            type: 'answer',
                            answer: answer,
                            sender: user?.full_name,
                            sender_role: user?.role,
                            sender_id: user?.id
                        }));
                        console.log('📤 Answer sent to teacher');
                    }
                    break;
                    
                case 'answer':
                    if (data.sender_id !== user?.id) {
                        console.log('📥 Received answer from student');
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                    break;
                    
                case 'ice_candidate':
                    if (data.sender_id !== user?.id && data.candidate) {
                        try {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (e) {
                            console.error('ICE candidate error:', e);
                        }
                    }
                    break;
                    
                case 'chat':
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        text: data.message,
                        sender: data.user,
                        sender_id: data.user_id,
                        time: new Date()
                    }]);
                    break;
                    
                case 'user_join':
                    setParticipants(prev => {
                        if (!prev.find(p => p.user_id === data.user_id)) {
                            return [...prev, { user: data.user, role: data.role, user_id: data.user_id }];
                        }
                        return prev;
                    });
                    toast.success(`${data.user} joined the class`);
                    break;
                    
                case 'user_leave':
                    setParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
                    toast.info(`${data.user} left the class`);
                    break;
                    
                default:
                    console.log('Unknown message:', data.type);
            }
        } catch (err) {
            console.error('Message handler error:', err);
        }
    }, [user]);

    // ============================================================
    // INITIALIZE CLASS WITH AUTO-RECONNECT
    // ============================================================
    const initializeClass = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);
            
            console.log('🎥 Starting Live Class...');
            
            // Get media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 480 }, 
                    height: { ideal: 360 } 
                },
                audio: true
            });
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            // Connect WebSocket
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login to join the class');
                navigate('/login');
                return;
            }
            
            // Use secure WebSocket if in production
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//localhost:8000/ws/live-class/${courseId}/?token=${token}`;
            console.log('🔗 Connecting to WebSocket:', wsUrl);
            
            // Close existing connection if any
            if (wsRef.current) {
                try {
                    wsRef.current.close();
                } catch (e) {
                    // Ignore
                }
                wsRef.current = null;
            }
            
            wsRef.current = new WebSocket(wsUrl);
            
            // Connection timeout
            const connectionTimeout = setTimeout(() => {
                if (wsRef.current?.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timeout');
                    setError('Connection timeout. Please try again.');
                    setIsConnecting(false);
                    if (wsRef.current) {
                        try {
                            wsRef.current.close();
                        } catch (e) {
                            // Ignore
                        }
                    }
                }
            }, 10000);
            
            wsRef.current.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ WebSocket connected successfully!');
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                setConnectionAttempts(0);
                toast.success('Connected to live class!');
                createPeerConnection();
                
                // Start heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                }
                heartbeatIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        try {
                            wsRef.current.send(JSON.stringify({ type: 'ping' }));
                        } catch (e) {
                            console.warn('Heartbeat send error:', e);
                        }
                    }
                }, 30000);
            };
            
            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'pong') return; // Ignore heartbeat
                    handleMessage(data);
                } catch (err) {
                    console.error('Message parse error:', err);
                }
            };
            
            wsRef.current.onerror = (err) => {
                console.error('❌ WebSocket error:', err);
                setError('Connection error. Please refresh.');
                setIsConnecting(false);
            };
            
            wsRef.current.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                
                // Auto-reconnect on unexpected close
                if (event.code !== 1000 && event.code !== 1001 && connectionAttempts < maxReconnectAttempts) {
                    const newAttempts = connectionAttempts + 1;
                    setConnectionAttempts(newAttempts);
                    toast.error(`Disconnected. Reconnecting (${newAttempts}/${maxReconnectAttempts})...`);
                    
                    if (reconnectTimerRef.current) {
                        clearTimeout(reconnectTimerRef.current);
                    }
                    
                    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
                    const delay = Math.min(2000 * Math.pow(2, connectionAttempts), 30000);
                    reconnectTimerRef.current = setTimeout(() => {
                        if (isMounted.current) {
                            console.log(`🔄 Reconnecting... attempt ${newAttempts + 1}`);
                            initializeClass();
                        }
                    }, delay);
                } else if (connectionAttempts >= maxReconnectAttempts) {
                    toast.error('Failed to reconnect. Please refresh the page.');
                    setError('Connection failed after multiple attempts. Please refresh.');
                }
            };
            
        } catch (err) {
            console.error('❌ Init error:', err);
            setIsConnecting(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera/microphone access denied. Please allow permissions.');
                toast.error('Camera and microphone access required for live class');
            } else {
                setError('Failed to initialize. Please refresh.');
                toast.error('Failed to start live class');
            }
        }
    }, [courseId, navigate, connectionAttempts, createPeerConnection, handleMessage]);

    // ============================================================
    // INITIALIZE ON MOUNT
    // ============================================================
    useEffect(() => {
        isMounted.current = true;
        initializeClass();
        
        return () => {
            isMounted.current = false;
            cleanup();
        };
    }, [courseId, initializeClass, cleanup]);

    // ============================================================
    // CONTROLS
    // ============================================================
    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = isMuted;
                setIsMuted(!isMuted);
                toast.success(isMuted ? 'Microphone enabled' : 'Microphone disabled');
            }
        }
    };
    
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
                toast.success(isVideoOff ? 'Camera enabled' : 'Camera disabled');
            }
        }
    };
    
    const sendMessage = () => {
        if (chatInput.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify({
                    type: 'chat',
                    message: chatInput.trim(),
                    sender: user?.full_name,
                    sender_id: user?.id
                }));
                
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: chatInput.trim(),
                    sender: 'You',
                    sender_id: user?.id,
                    time: new Date()
                }]);
                setChatInput('');
            } catch (e) {
                console.error('Send message error:', e);
                toast.error('Failed to send message');
            }
        }
    };
    
    const leaveClass = () => {
        cleanup();
        navigate(-1);
        toast.success('Left the class');
    };

    // ============================================================
    // FORCE RECONNECT
    // ============================================================
    const forceReconnect = () => {
        setConnectionAttempts(0);
        cleanup();
        initializeClass();
        toast('Reconnecting...');
    };

    // ============================================================
    // RENDER ERROR
    // ============================================================
    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0f172a',
                padding: '20px'
            }}>
                <div style={{ textAlign: 'center', color: 'white', maxWidth: '400px' }}>
                    <AlertCircle size={48} color="#dc2626" />
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '16px 0', color: '#ef4444' }}>
                        Connection Error
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{error}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={forceReconnect}
                            style={{
                                padding: '10px 28px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                        >
                            <RefreshCw size={18} />
                            Reconnect
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                padding: '10px 28px',
                                background: 'transparent',
                                color: 'white',
                                border: '1px solid #475569',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0f172a'
        }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .pulse { animation: pulse 1.5s ease-in-out infinite; }
                .spin { animation: spin 1s linear infinite; }
                @media (max-width: 768px) {
                    .video-grid { grid-template-columns: 1fr !important; }
                    .chat-panel { width: 100% !important; }
                    .controls-group { flex-wrap: wrap !important; justify-content: center !important; }
                }
            `}</style>
            
            {/* Video Grid */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                minHeight: '0'
            }} className="video-grid">
                {/* Local Video */}
                <div style={{
                    position: 'relative',
                    background: '#1e293b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    minHeight: '200px'
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        You {isMuted ? '🔇' : ''} {isVideoOff ? '📷 Off' : ''}
                        {isConnecting && ' (Connecting...)'}
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isConnected ? '#22c55e' : '#ef4444',
                            className: isConnected ? 'pulse' : ''
                        }} />
                    </div>
                    {isVideoOff && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '48px'
                        }}>
                            <VideoOff size={48} />
                        </div>
                    )}
                    {isConnecting && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid rgba(255,255,255,0.2)',
                                borderTopColor: '#3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }} />
                            <p style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>Connecting...</p>
                        </div>
                    )}
                </div>
                
                {/* Remote Video */}
                <div style={{
                    position: 'relative',
                    background: '#1e293b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    minHeight: '200px'
                }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {isTeacher ? 'Student' : 'Teacher'} 
                        {!isConnected ? ' (Waiting)' : ''}
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isConnected ? '#22c55e' : '#ef4444',
                            className: isConnected ? 'pulse' : ''
                        }} />
                    </div>
                    {!isConnected && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#64748b',
                            textAlign: 'center'
                        }}>
                            <Users size={40} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
                            <p>Waiting for {isTeacher ? 'students' : 'teacher'}...</p>
                            <p style={{ fontSize: '12px', marginTop: '4px', color: '#ef4444' }}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </p>
                            {connectionAttempts > 0 && (
                                <p style={{ fontSize: '12px', marginTop: '4px', color: '#f59e0b' }}>
                                    Reconnecting... ({connectionAttempts}/{maxReconnectAttempts})
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Controls */}
            <div style={{
                background: '#1e293b',
                padding: '12px 16px',
                borderTop: '1px solid #334155'
            }}>
                <div style={{
                    maxWidth: '80rem',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div className="controls-group" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={toggleMute}
                            disabled={!isConnected}
                            style={{
                                padding: '10px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: isConnected ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                background: isMuted ? '#dc2626' : '#4b5563',
                                color: 'white',
                                opacity: isConnected ? 1 : 0.5
                            }}
                            onMouseEnter={(e) => { if (isConnected) e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { if (isConnected) e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        
                        <button
                            onClick={toggleVideo}
                            disabled={!isConnected}
                            style={{
                                padding: '10px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: isConnected ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                background: isVideoOff ? '#dc2626' : '#4b5563',
                                color: 'white',
                                opacity: isConnected ? 1 : 0.5
                            }}
                            onMouseEnter={(e) => { if (isConnected) e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { if (isConnected) e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                        </button>
                        
                        <button
                            onClick={leaveClass}
                            style={{
                                padding: '10px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: '#dc2626',
                                color: 'white'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.background = '#b91c1c';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = '#dc2626';
                            }}
                        >
                            <PhoneOff size={18} />
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isConnected ? (
                                <Wifi size={14} color="#22c55e" />
                            ) : (
                                <WifiOff size={14} color="#ef4444" />
                            )}
                            <span style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                            {participants.length} participant{participants.length !== 1 ? 's' : ''}
                        </span>
                        {isConnecting && (
                            <span style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} />
                                Connecting...
                            </span>
                        )}
                        {connectionAttempts > 0 && (
                            <span style={{ fontSize: '12px', color: '#f59e0b' }}>
                                ⏳ Reconnecting ({connectionAttempts}/{maxReconnectAttempts})
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Chat Toggle */}
            <button
                onClick={() => setShowChat(!showChat)}
                style={{
                    position: 'fixed',
                    right: '16px',
                    bottom: '80px',
                    padding: '10px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: 100,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <MessageSquare size={20} />
                {messages.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#dc2626',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {messages.length}
                    </span>
                )}
            </button>
            
            {/* Chat Panel */}
            {showChat && (
                <div style={{
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '340px',
                    background: 'white',
                    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50
                }} className="chat-panel">
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={18} color="#2563eb" />
                            <h3 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Chat</h3>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#94a3b8'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        {messages.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px 0',
                                color: '#94a3b8',
                                fontSize: '14px'
                            }}>
                                <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                No messages yet
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: msg.sender === 'You' ? '#2563eb' : '#f1f5f9',
                                        color: msg.sender === 'You' ? 'white' : '#0f172a'
                                    }}>
                                        {msg.sender !== 'You' && (
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>
                                                {msg.sender}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>{msg.text}</div>
                                        <div style={{
                                            fontSize: '10px',
                                            opacity: 0.6,
                                            textAlign: 'right',
                                            marginTop: '2px'
                                        }}>
                                            {msg.time?.toLocaleTimeString?.() || ''}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            disabled={!isConnected}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                opacity: isConnected ? 1 : 0.5
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!isConnected || !chatInput.trim()}
                            style={{
                                padding: '8px 16px',
                                background: isConnected && chatInput.trim() ? '#2563eb' : '#94a3b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isConnected && chatInput.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: 500,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (isConnected && chatInput.trim()) {
                                    e.currentTarget.style.background = '#1d4ed8';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isConnected && chatInput.trim()) {
                                    e.currentTarget.style.background = '#2563eb';
                                }
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveClass;