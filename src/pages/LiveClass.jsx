import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Modal } from 'antd';
import toast from 'react-hot-toast';
import {
    AlertCircle, Hand, HandMetal, MessageSquare, Mic, MicOff, Monitor,
    PhoneOff, Play, Send, Square, Users, Video, VideoOff, Wifi, WifiOff,
    X
} from 'lucide-react';
import { getWebSocketUrl } from '../api/api';
import { saveAttendanceSession, saveClassRecording } from '../utils/liveClassStorage';

const formatTime = (date) => new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
}).format(date);

const LiveClass = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});
    const isTeacher = user?.role === 'TEACHER';
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');

    const localVideoRef = useRef(null);
    const messagesEndRef = useRef(null);
    const wsRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const pendingCandidatesRef = useRef(new Map());
    const participantsRef = useRef([]);
    const mountedRef = useRef(false);
    const reconnectTimerRef = useRef(null);
    const heartbeatRef = useRef(null);
    const recorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingFrameRef = useRef(null);
    const recordingStartedAtRef = useRef(null);
    const videoElementsRef = useRef(new Map());
    const recordingAudioContextRef = useRef(null);
    const recordingAudioDestinationRef = useRef(null);
    const recordedAudioTrackIdsRef = useRef(new Set());
    const sessionRef = useRef(null);
    const connectionAttemptsRef = useRef(0);
    const currentUserId = String(user?.id ?? '');
    const className = `Course ${courseId}`;
    participantsRef.current = participants;

    const sendSocketMessage = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        }
        return false;
    }, []);

    const addRecordingAudioStream = useCallback((stream) => {
        const audioContext = recordingAudioContextRef.current;
        const destination = recordingAudioDestinationRef.current;
        if (!audioContext || !destination) return;
        stream.getAudioTracks().forEach((track) => {
            if (recordedAudioTrackIdsRef.current.has(track.id)) return;
            try {
                audioContext.createMediaStreamSource(new MediaStream([track])).connect(destination);
                recordedAudioTrackIdsRef.current.add(track.id);
            } catch (audioError) {
                console.error('Could not include a participant audio track in the recording:', audioError);
            }
        });
    }, []);

    const saveSession = useCallback((updates = {}) => {
        if (!isTeacher || !sessionRef.current) return;
        const nextSession = { ...sessionRef.current, ...updates };
        sessionRef.current = nextSession;
        try {
            saveAttendanceSession(nextSession);
        } catch (storageError) {
            console.error('Could not save attendance:', storageError);
            toast.error('Attendance could not be saved in this browser.');
        }
    }, [isTeacher]);

    const closePeer = useCallback((peerId) => {
        const peer = peersRef.current.get(String(peerId));
        if (peer) peer.close();
        peersRef.current.delete(String(peerId));
        pendingCandidatesRef.current.delete(String(peerId));
        setRemoteStreams((current) => {
            const next = { ...current };
            delete next[String(peerId)];
            return next;
        });
    }, []);

    const createPeer = useCallback((peerId, peerName) => {
        const id = String(peerId);
        if (!id || id === currentUserId) return null;
        const existing = peersRef.current.get(id);
        if (existing && existing.connectionState !== 'closed') return existing;

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 5
        });

        if (screenStreamRef.current) {
            localStreamRef.current?.getAudioTracks().forEach((track) => {
                peer.addTrack(track, localStreamRef.current);
            });
            screenStreamRef.current.getVideoTracks().forEach((track) => {
                peer.addTrack(track, screenStreamRef.current);
            });
        } else {
            localStreamRef.current?.getTracks().forEach((track) => {
                peer.addTrack(track, localStreamRef.current);
            });
        }
        peer.ontrack = (event) => {
            const stream = event.streams?.[0];
            if (stream) {
                setRemoteStreams((current) => ({ ...current, [id]: stream }));
                addRecordingAudioStream(stream);
            }
        };
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendSocketMessage({
                    type: 'ice_candidate',
                    candidate: event.candidate,
                    sender_id: currentUserId,
                    target_id: id
                });
            }
        };
        peer.onconnectionstatechange = () => {
            if (['failed', 'closed'].includes(peer.connectionState)) closePeer(id);
        };
        peer.peerName = peerName;
        peersRef.current.set(id, peer);
        return peer;
    }, [addRecordingAudioStream, closePeer, currentUserId, sendSocketMessage]);

    const makeOffer = useCallback(async (participant) => {
        const peer = createPeer(participant.user_id, participant.user);
        if (!peer || peer.signalingState !== 'stable') return;
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            sendSocketMessage({
                type: 'offer',
                offer,
                sender_id: currentUserId,
                target_id: String(participant.user_id)
            });
        } catch (offerError) {
            console.error('Could not start student video connection:', offerError);
            toast.error(`Could not connect to ${participant.user || 'a student'} video.`);
        }
    }, [createPeer, currentUserId, sendSocketMessage]);

    const handleSignal = useCallback(async (message) => {
        const signal = message.type === 'webrtc' ? message.data : message;
        if (!signal || (signal.target_id && String(signal.target_id) !== currentUserId)) return;
        const senderId = String(message.sender_id ?? signal.sender_id ?? '');
        if (!senderId || senderId === currentUserId) return;

        if (signal.type === 'offer') {
            const participant = participantsRef.current.find((item) => String(item.user_id) === senderId);
            const peer = createPeer(senderId, participant?.user || 'Participant');
            if (!peer) return;
            try {
                if (peer.signalingState !== 'stable') {
                    await peer.setLocalDescription({ type: 'rollback' });
                }
                await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
                const pendingCandidates = pendingCandidatesRef.current.get(senderId) || [];
                pendingCandidatesRef.current.delete(senderId);
                for (const candidate of pendingCandidates) {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                sendSocketMessage({
                    type: 'answer',
                    answer,
                    sender_id: currentUserId,
                    target_id: senderId
                });
            } catch (signalError) {
                console.error('Could not answer video connection:', signalError);
            }
        } else if (signal.type === 'answer') {
            const peer = peersRef.current.get(senderId);
            if (peer?.signalingState === 'have-local-offer') {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
                    const pendingCandidates = pendingCandidatesRef.current.get(senderId) || [];
                    pendingCandidatesRef.current.delete(senderId);
                    for (const candidate of pendingCandidates) {
                        await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (signalError) {
                    console.error('Could not finish video connection:', signalError);
                }
            }
        } else if (signal.type === 'ice_candidate' && signal.candidate) {
            const peer = peersRef.current.get(senderId);
            if (peer?.remoteDescription) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (signalError) {
                    console.error('Could not add video connection candidate:', signalError);
                }
            } else {
                const candidates = pendingCandidatesRef.current.get(senderId) || [];
                pendingCandidatesRef.current.set(senderId, [...candidates, signal.candidate]);
            }
        }
    }, [createPeer, currentUserId, sendSocketMessage]);

    const handleMessage = useCallback((data) => {
        if (['webrtc', 'offer', 'answer', 'ice_candidate'].includes(data.type)) {
            handleSignal(data);
            return;
        }
        if (data.type === 'chat') {
            setMessages((current) => [...current, {
                id: `${Date.now()}-${Math.random()}`,
                text: data.message,
                sender: data.user,
                senderId: String(data.user_id),
                role: data.role,
                time: new Date()
            }]);
        } else if (data.type === 'user_join') {
            if (String(data.user_id) === currentUserId) return;
            const participant = {
                user: data.user || 'Participant',
                role: data.role || 'STUDENT',
                user_id: String(data.user_id)
            };
            setParticipants((current) => current.some((item) => item.user_id === participant.user_id)
                ? current
                : [...current, participant]);
            if (isTeacher && participant.role === 'STUDENT') {
                const joinedAt = new Date();
                const attendees = sessionRef.current?.attendees || [];
                const currentAttendee = attendees.find((item) => item.userId === participant.user_id);
                const nextAttendee = {
                    userId: participant.user_id,
                    name: participant.user,
                    joinedAt: currentAttendee?.joinedAt || joinedAt.toISOString(),
                    leftAt: null
                };
                saveSession({
                    attendees: [
                        ...attendees.filter((item) => item.userId !== participant.user_id),
                        nextAttendee
                    ]
                });
                makeOffer(participant);
            } else if (!isTeacher && participant.role === 'TEACHER') {
                makeOffer(participant);
            }
        } else if (data.type === 'user_leave') {
            const leavingId = String(data.user_id);
            setParticipants((current) => current.filter((item) => item.user_id !== leavingId));
            setRaisedHands((current) => current.filter((item) => item.user_id !== leavingId));
            closePeer(leavingId);
            if (isTeacher) {
                const attendees = sessionRef.current?.attendees || [];
                const attendee = attendees.find((item) => item.userId === leavingId);
                if (attendee) {
                    saveSession({
                        attendees: attendees.map((item) => item.userId === leavingId
                            ? { ...item, leftAt: new Date().toISOString() }
                            : item)
                    });
                }
            }
        } else if (data.type === 'hand_raise') {
            setRaisedHands((current) => current.some((item) => String(item.user_id) === String(data.user_id))
                ? current
                : [...current, { user: data.user, user_id: String(data.user_id) }]);
        } else if (data.type === 'hand_lower') {
            setRaisedHands((current) => current.filter((item) => String(item.user_id) !== String(data.user_id)));
        } else if (data.type === 'student_removed' && String(data.target_id) === currentUserId) {
            toast.error('The teacher removed you from this class.');
            wsRef.current?.close(1000, 'Removed by teacher');
            navigate('/live-classes');
        } else if (data.type === 'error') {
            toast.error(data.message || 'The class action could not be completed.');
        }
    }, [closePeer, currentUserId, handleSignal, isTeacher, makeOffer, navigate, saveSession]);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError('');
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera and microphone access requires a secure browser connection.');
            }
            let stream = localStreamRef.current;
            if (!stream?.getTracks().some((track) => track.readyState === 'live')) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: true
                });
            }
            if (!mountedRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Please log in to join this class.');
                navigate('/login');
                return;
            }
            const wsUrl = getWebSocketUrl(`/ws/live-class/${courseId}/`, { token });
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;
            const timeout = setTimeout(() => {
                if (socket.readyState !== WebSocket.OPEN) {
                    socket.close();
                    setError('Could not connect to the class. Check your connection and try again.');
                    setIsConnecting(false);
                }
            }, 12000);
            socket.onopen = () => {
                clearTimeout(timeout);
                connectionAttemptsRef.current = 0;
                setIsConnected(true);
                setIsConnecting(false);
                setError('');
                toast.success('You joined the live class.');
                if (isTeacher && !sessionRef.current) {
                    const startedAt = new Date();
                    sessionRef.current = {
                        id: `${courseId}-${startedAt.getTime()}-${currentUserId}`,
                        courseId: String(courseId),
                        courseName: className,
                        date: startedAt.toLocaleDateString(),
                        startedAt: startedAt.toISOString(),
                        endedAt: null,
                        attendees: []
                    };
                    saveSession();
                }
                heartbeatRef.current = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
                }, 30000);
            };
            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type !== 'pong') handleMessage(message);
                } catch (messageError) {
                    console.error('Could not read live class message:', messageError);
                }
            };
            socket.onerror = () => {
                clearTimeout(timeout);
                setError('Live class connection failed. Check your connection and retry.');
                setIsConnecting(false);
            };
            socket.onclose = (event) => {
                clearTimeout(timeout);
                if (heartbeatRef.current) clearInterval(heartbeatRef.current);
                setIsConnected(false);
                setIsConnecting(false);
                if (mountedRef.current && event.code !== 1000 && event.code !== 1001) {
                    peersRef.current.forEach((peer) => peer.close());
                    peersRef.current.clear();
                    pendingCandidatesRef.current.clear();
                    setRemoteStreams({});
                    if (connectionAttemptsRef.current < 5) {
                        const attempt = connectionAttemptsRef.current++;
                        reconnectTimerRef.current = setTimeout(connect, Math.min(1500 * (2 ** attempt), 20000));
                        toast.error('Connection lost. Reconnecting…');
                    } else {
                        setError('Connection failed after several attempts. Please reconnect.');
                    }
                }
            };
        } catch (connectionError) {
            setIsConnecting(false);
            const message = connectionError.name === 'NotAllowedError' || connectionError.name === 'PermissionDeniedError'
                ? 'Allow camera and microphone access in your browser to join.'
                : connectionError.message || 'Could not start your camera and microphone.';
            setError(message);
        }
    }, [className, courseId, currentUserId, handleMessage, isTeacher, navigate, saveSession]);

    const stopRecording = useCallback(() => {
        if (recordingFrameRef.current) cancelAnimationFrame(recordingFrameRef.current);
        recordingFrameRef.current = null;
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
    }, []);

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        if (recorderRef.current?.state !== 'inactive') stopRecording();
        peersRef.current.forEach((peer) => peer.close());
        peersRef.current.clear();
        pendingCandidatesRef.current.clear();
        wsRef.current?.close(1000, 'Class left');
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    }, [stopRecording]);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            cleanup();
        };
    }, [cleanup, connect]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, showChat]);

    const toggleTrack = (kind) => {
        const track = kind === 'audio'
            ? localStreamRef.current?.getAudioTracks()[0]
            : localStreamRef.current?.getVideoTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        if (kind === 'audio') setIsMuted(!track.enabled);
        else setIsVideoOff(!track.enabled);
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            screenStreamRef.current?.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
            const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
            peersRef.current.forEach((peer) => {
                const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
                if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            setIsScreenSharing(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = stream;
            const screenTrack = stream.getVideoTracks()[0];
            peersRef.current.forEach((peer) => {
                const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            setIsScreenSharing(true);
            screenTrack.onended = () => {
                screenStreamRef.current = null;
                const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
                peersRef.current.forEach((peer) => {
                    const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
                    if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
                });
                if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                setIsScreenSharing(false);
            };
        } catch (shareError) {
            if (shareError.name !== 'NotAllowedError') {
                console.error('Could not share screen:', shareError);
                toast.error('Screen sharing could not be started.');
            }
        }
    };

    const startRecording = async () => {
        if (!isTeacher) return;
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext('2d');
        const drawFrame = () => {
            if (context) {
                context.fillStyle = '#0f172a';
                context.fillRect(0, 0, canvas.width, canvas.height);
                const videos = [...videoElementsRef.current.entries()]
                    .filter(([, video]) => video.readyState >= 2 && video.videoWidth > 0);
                const columns = Math.max(1, Math.ceil(Math.sqrt(videos.length)));
                const rows = Math.max(1, Math.ceil(videos.length / columns));
                const tileWidth = canvas.width / columns;
                const tileHeight = canvas.height / rows;
                videos.forEach(([id, video], index) => {
                    const x = (index % columns) * tileWidth;
                    const y = Math.floor(index / columns) * tileHeight;
                    const scale = Math.max(tileWidth / video.videoWidth, tileHeight / video.videoHeight);
                    const width = video.videoWidth * scale;
                    const height = video.videoHeight * scale;
                    context.save();
                    context.beginPath();
                    context.rect(x, y, tileWidth, tileHeight);
                    context.clip();
                    context.drawImage(video, x + (tileWidth - width) / 2, y + (tileHeight - height) / 2, width, height);
                    context.fillStyle = 'rgba(2, 6, 23, .72)';
                    context.fillRect(x + 10, y + tileHeight - 38, Math.min(tileWidth - 20, 220), 28);
                    context.fillStyle = '#fff';
                    context.font = '16px sans-serif';
                    const participant = participantsRef.current.find((item) => item.user_id === id);
                    context.fillText(id === currentUserId ? 'Teacher' : participant?.user || 'Student', x + 20, y + tileHeight - 19);
                    context.restore();
                });
            }
            recordingFrameRef.current = requestAnimationFrame(drawFrame);
        };
        drawFrame();
        let recordingAudioTracks = localStreamRef.current?.getAudioTracks() || [];
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            try {
                const audioContext = new AudioContextClass();
                const destination = audioContext.createMediaStreamDestination();
                recordingAudioContextRef.current = audioContext;
                recordingAudioDestinationRef.current = destination;
                recordedAudioTrackIdsRef.current = new Set();
                addRecordingAudioStream(localStreamRef.current);
                Object.values(remoteStreams).forEach(addRecordingAudioStream);
                await audioContext.resume();
                recordingAudioTracks = destination.stream.getAudioTracks();
            } catch (audioError) {
                console.error('Could not mix class audio for recording:', audioError);
                recordingAudioContextRef.current?.close();
                recordingAudioContextRef.current = null;
                recordingAudioDestinationRef.current = null;
            }
        }
        const recordingStream = new MediaStream([
            ...canvas.captureStream(24).getVideoTracks(),
            ...recordingAudioTracks
        ]);
        if (!window.MediaRecorder || !MediaRecorder.isTypeSupported('video/webm')) {
            cancelAnimationFrame(recordingFrameRef.current);
            toast.error('This browser does not support local class recording.');
            recordingAudioContextRef.current?.close();
            recordingAudioContextRef.current = null;
            recordingAudioDestinationRef.current = null;
            recordingStream.getVideoTracks().forEach((track) => track.stop());
            return;
        }
        recordingChunksRef.current = [];
        const recorder = new MediaRecorder(recordingStream, { mimeType: 'video/webm' });
        recorderRef.current = recorder;
        recordingStartedAtRef.current = new Date();
        recorder.ondataavailable = (event) => {
            if (event.data.size) recordingChunksRef.current.push(event.data);
        };
        recorder.onerror = (event) => {
            console.error('Class recording error:', event.error);
            toast.error('The class recording stopped because of an error.');
            setIsRecording(false);
        };
        recorder.onstop = async () => {
            const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
            recordingChunksRef.current = [];
            setIsRecording(false);
            if (!blob.size) return;
            try {
                await saveClassRecording({
                    id: `${courseId}-${Date.now()}`,
                    courseId: String(courseId),
                    courseName: className,
                    createdAt: recordingStartedAtRef.current.toISOString(),
                    blob
                });
                toast.success('Recording saved on this device. Find it on the Live Classes page.');
            } catch (saveError) {
                console.error('Could not store class recording:', saveError);
                toast.error('Could not save the recording locally. Check available browser storage.');
            }
            recordingStream.getVideoTracks().forEach((track) => track.stop());
            recordingAudioContextRef.current?.close();
            recordingAudioContextRef.current = null;
            recordingAudioDestinationRef.current = null;
            recordedAudioTrackIdsRef.current.clear();
        };
        recorder.start(1000);
        setIsRecording(true);
        toast.success('Recording the class gallery and audio on this device.');
    };

    const toggleHand = () => {
        const next = !isHandRaised;
        if (sendSocketMessage({ type: next ? 'hand_raise' : 'hand_lower' })) {
            setIsHandRaised(next);
        }
    };

    const sendMessage = (event) => {
        event.preventDefault();
        const text = chatInput.trim();
        if (!text || text.length > 1000 || !isConnected) return;
        if (sendSocketMessage({ type: 'chat', message: text })) setChatInput('');
    };

    const removeParticipant = (participant) => {
        Modal.confirm({
            title: 'Remove participant?',
            content: `Remove ${participant.user} from this live class?`,
            okText: 'Remove',
            okButtonProps: { danger: true },
            cancelText: 'Cancel',
            onOk: () => {
                if (!sendSocketMessage({ type: 'remove_student', target_id: participant.user_id })) {
                    toast.error('Could not remove the student while disconnected.');
                }
            },
        });
    };

    const leaveClass = () => {
        if (isRecording) stopRecording();
        saveSession({ endedAt: new Date().toISOString() });
        cleanup();
        navigate('/live-classes');
    };

    const retryConnection = () => {
        connectionAttemptsRef.current = 0;
        setError('');
        connect();
    };

    if (error && !isConnecting) {
        return (
            <main style={styles.errorPage}>
                <AlertCircle size={46} color="#f87171" />
                <h1>Unable to join class</h1>
                <p>{error}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={styles.primaryButton} onClick={retryConnection}>Try again</button>
                    <button style={styles.secondaryButton} onClick={() => navigate('/live-classes')}>Back to live classes</button>
                </div>
            </main>
        );
    }

    const videoTiles = [
        { id: currentUserId, name: 'You', stream: null, local: true },
        ...participants.filter((participant) => remoteStreams[participant.user_id]).map((participant) => ({
            id: participant.user_id,
            name: participant.user,
            stream: remoteStreams[participant.user_id],
            local: false,
            participant
        }))
    ];

    return (
        <main style={styles.page}>
            <style>{`
                .live-chat-heading { display:flex; align-items:center; gap:10px; }
                .live-chat-heading > div { display:flex; flex-direction:column; gap:3px; }
                .live-chat-heading strong { color:#f8fafc; font-size:14px; }
                .live-chat-heading small { color:#94a3b8; font-size:11px; }
                .live-chat-message strong { display:block; font-size:11px; color:#bfdbfe; margin-bottom:4px; }
                .live-chat-message p { margin:0; font-size:13px; line-height:1.45; overflow-wrap:anywhere; }
                .live-chat-message time { display:block; text-align:right; font-size:10px; opacity:.72; margin-top:5px; }
                .live-chat-empty svg { margin-bottom:7px; }
                .live-chat-empty p { margin:0 0 5px; color:#cbd5e1; }
                .live-chat-empty span { font-size:12px; }
                .live-chat-form input { flex:1; min-width:0; padding:10px 12px; color:#f8fafc; background:#1e293b; border:1px solid #334155; border-radius:8px; outline:none; }
                .live-chat-form input:focus { border-color:#60a5fa; }
                .live-chat-form button { width:40px; border:0; border-radius:8px; background:#2563eb; color:white; display:grid; place-items:center; cursor:pointer; }
                .live-chat-form button:disabled { background:#334155; color:#64748b; cursor:not-allowed; }
                @media(max-width:700px) {
                    .live-class-controls { flex-direction:column; align-items:stretch !important; }
                    .live-class-control-group { justify-content:center; }
                    .live-class-controls > button { justify-content:center; }
                    .live-class-chat { width:min(100%, 380px); }
                    .live-class-content-chat { margin-right:0 !important; }
                }
            `}</style>
            <header style={styles.header}>
                <div>
                    <div style={styles.liveLabel}><span style={styles.liveDot} /> LIVE CLASS</div>
                    <h1 style={styles.title}>{className}</h1>
                </div>
                <div style={styles.headerStatus}>
                    {isConnected ? <Wifi size={16} color="#4ade80" /> : <WifiOff size={16} color="#f87171" />}
                    {isConnecting ? 'Connecting…' : isConnected ? 'Connected' : 'Disconnected'}
                    <span style={styles.countBadge}><Users size={15} /> {participants.length + 1}</span>
                </div>
            </header>

            <section className={showChat ? 'live-class-content-chat' : ''} style={{ ...styles.content, marginRight: showChat ? 344 : 0 }}>
                {isConnecting && <div style={styles.connecting}>Connecting to your class…</div>}
                <div style={styles.videoGrid}>
                    {videoTiles.map((tile) => (
                        <article key={tile.id} style={styles.videoTile}>
                            {tile.local ? (
                                <video ref={(element) => {
                                    localVideoRef.current = element;
                                    if (element) videoElementsRef.current.set(tile.id, element);
                                    else videoElementsRef.current.delete(tile.id);
                                }} autoPlay muted playsInline style={{ ...styles.video, transform: isScreenSharing ? 'none' : 'scaleX(-1)' }} />
                            ) : (
                                <video
                                    autoPlay
                                    playsInline
                                    style={styles.video}
                                    ref={(element) => {
                                        if (element) {
                                            videoElementsRef.current.set(tile.id, element);
                                            if (element.srcObject !== tile.stream) element.srcObject = tile.stream;
                                        } else videoElementsRef.current.delete(tile.id);
                                    }}
                                />
                            )}
                            {tile.local && !isScreenSharing && isVideoOff && <div style={styles.cameraOff}><VideoOff size={28} /><span>Camera off</span></div>}
                            <div style={styles.tileFooter}>
                                <span>{tile.name}{tile.local ? ' (You)' : ''}</span>
                                {isTeacher && !tile.local && tile.participant?.role === 'STUDENT' && (
                                    <button title={`Remove ${tile.name}`} onClick={() => removeParticipant(tile.participant)} style={styles.removeButton}><X size={15} /></button>
                                )}
                            </div>
                        </article>
                    ))}
                    {isTeacher && participants.filter((participant) => participant.role === 'STUDENT' && !remoteStreams[participant.user_id]).map((participant) => (
                        <article key={`waiting-${participant.user_id}`} style={{ ...styles.videoTile, ...styles.waitingTile }}>
                            <div style={styles.avatar}>{participant.user?.charAt(0)?.toUpperCase() || '?'}</div>
                            <p>{participant.user} · Connecting video…</p>
                            <button onClick={() => removeParticipant(participant)} style={styles.removeButton} title={`Remove ${participant.user}`}><X size={15} /></button>
                        </article>
                    ))}
                </div>
                {isTeacher && raisedHands.length > 0 && (
                    <div style={styles.handNotice}><Hand size={17} /> {raisedHands.map((person) => person.user).join(', ')} {raisedHands.length === 1 ? 'has' : 'have'} a hand raised</div>
                )}
            </section>

            <footer className="live-class-controls" style={styles.controls}>
                <div className="live-class-control-group" style={styles.controlGroup}>
                    <button style={{ ...styles.controlButton, ...(isMuted ? styles.controlActive : {}) }} onClick={() => toggleTrack('audio')} title={isMuted ? 'Turn microphone on' : 'Mute microphone'}>
                        {isMuted ? <MicOff /> : <Mic />}<span>{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button style={{ ...styles.controlButton, ...(isVideoOff ? styles.controlActive : {}) }} onClick={() => toggleTrack('video')} title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}>
                        {isVideoOff ? <VideoOff /> : <Video />}<span>{isVideoOff ? 'Start video' : 'Stop video'}</span>
                    </button>
                    {isTeacher && <>
                        <button style={{ ...styles.controlButton, ...(isScreenSharing ? styles.controlActive : {}) }} onClick={toggleScreenShare}>
                            <Monitor /><span>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</span>
                        </button>
                        <button style={{ ...styles.controlButton, ...(isRecording ? styles.recordingButton : {}) }} onClick={isRecording ? stopRecording : startRecording}>
                            {isRecording ? <Square /> : <Play />}<span>{isRecording ? 'Stop recording' : 'Record class'}</span>
                        </button>
                    </>}
                    {!isTeacher && <button style={{ ...styles.controlButton, ...(isHandRaised ? styles.handActive : {}) }} onClick={toggleHand}>
                        {isHandRaised ? <HandMetal /> : <Hand />}<span>{isHandRaised ? 'Lower hand' : 'Raise hand'}</span>
                    </button>}
                    <button style={styles.endButton} onClick={leaveClass}><PhoneOff /><span>Leave class</span></button>
                </div>
                <button style={styles.chatToggle} onClick={() => setShowChat((value) => !value)}>
                    <MessageSquare /> Chat {messages.length > 0 && <span style={styles.unreadBadge}>{messages.length}</span>}
                </button>
            </footer>

            {showChat && <aside className="live-class-chat" style={styles.chatPanel}>
                <div style={styles.chatHeader}>
                    <div className="live-chat-heading"><MessageSquare size={18} /><div><strong>Class chat</strong><small>{participants.length + 1} participants</small></div></div>
                    <button onClick={() => setShowChat(false)} style={styles.closeChat}><X size={18} /></button>
                </div>
                <div style={styles.messageList}>
                    {messages.length === 0
                        ? <div className="live-chat-empty" style={styles.emptyChat}><MessageSquare size={30} /><p>Class chat is ready</p><span>Send a message to everyone in class.</span></div>
                        : messages.map((message) => {
                            const ownMessage = message.senderId === currentUserId;
                            return <div key={message.id} style={{ ...styles.messageRow, justifyContent: ownMessage ? 'flex-end' : 'flex-start' }}>
                                <div className="live-chat-message" style={{ ...styles.messageBubble, ...(ownMessage ? styles.ownMessage : {}) }}>
                                    {!ownMessage && <strong>{message.sender || 'Participant'}</strong>}
                                    <p>{message.text}</p>
                                    <time>{formatTime(message.time)}</time>
                                </div>
                            </div>;
                        })}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="live-chat-form" style={styles.chatForm}>
                    <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={1000} placeholder="Message everyone…" disabled={!isConnected} />
                    <button type="submit" disabled={!isConnected || !chatInput.trim()} aria-label="Send message"><Send size={17} /></button>
                </form>
            </aside>}
        </main>
    );
};

const styles = {
    page: { height: '100vh', minHeight: 540, display: 'flex', flexDirection: 'column', background: '#0b1120', color: '#f8fafc', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1e293b', gap: 16 },
    liveLabel: { display: 'flex', alignItems: 'center', gap: 7, color: '#fda4af', fontSize: 11, letterSpacing: 1.4, fontWeight: 700 },
    liveDot: { width: 8, height: 8, background: '#f43f5e', borderRadius: '50%', boxShadow: '0 0 12px #f43f5e' },
    title: { fontSize: 18, margin: '5px 0 0', fontWeight: 650 },
    headerStatus: { display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 },
    countBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', borderRadius: 18, padding: '7px 10px', marginLeft: 8 },
    content: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 20, transition: 'margin 180ms ease' },
    connecting: { textAlign: 'center', color: '#94a3b8', padding: '8px 0 15px', fontSize: 13 },
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14, alignContent: 'start' },
    videoTile: { position: 'relative', aspectRatio: '16 / 10', minHeight: 180, maxHeight: 'calc(100vh - 220px)', borderRadius: 12, overflow: 'hidden', background: '#172033', border: '1px solid #293449' },
    video: { width: '100%', height: '100%', objectFit: 'contain', background: '#080d18' },
    tileFooter: { position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', background: 'rgba(2, 6, 23, .72)', padding: '7px 10px', borderRadius: 7, fontSize: 13 },
    cameraOff: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', background: '#111827' },
    waitingTile: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9aa9bd', gap: 8, fontSize: 13 },
    avatar: { width: 58, height: 58, display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#253550', fontSize: 22, color: '#dbeafe' },
    removeButton: { background: '#7f1d1d', border: 0, color: 'white', borderRadius: 6, width: 27, height: 27, display: 'grid', placeItems: 'center', cursor: 'pointer' },
    handNotice: { position: 'fixed', bottom: 100, left: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#422006', color: '#fde68a', borderRadius: 9, fontSize: 13 },
    controls: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#111827', borderTop: '1px solid #253044', gap: 12 },
    controlGroup: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    controlButton: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: '#263247', color: 'white', border: 0, cursor: 'pointer', fontSize: 12 },
    controlActive: { background: '#7f1d1d' },
    recordingButton: { background: '#b91c1c' },
    handActive: { background: '#92400e' },
    endButton: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: '#dc2626', color: 'white', border: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    chatToggle: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: '#263247', color: 'white', border: 0, cursor: 'pointer', fontSize: 13, position: 'relative' },
    unreadBadge: { background: '#ef4444', borderRadius: 12, padding: '2px 6px', fontSize: 10 },
    chatPanel: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 344, display: 'flex', flexDirection: 'column', background: '#111827', borderLeft: '1px solid #263247', boxShadow: '-12px 0 30px rgba(0,0,0,.25)' },
    chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #263247' },
    closeChat: { background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer' },
    messageList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 14 },
    emptyChat: { margin: 'auto', textAlign: 'center', color: '#64748b', fontSize: 13 },
    messageRow: { display: 'flex' },
    messageBubble: { maxWidth: '84%', background: '#1e293b', padding: '9px 11px', borderRadius: 10, color: '#e2e8f0' },
    ownMessage: { background: '#1d4ed8', color: 'white' },
    chatForm: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #263247' },
    errorPage: { minHeight: '100vh', background: '#0b1120', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' },
    primaryButton: { padding: '10px 16px', background: '#2563eb', color: 'white', border: 0, borderRadius: 8, cursor: 'pointer' },
    secondaryButton: { padding: '10px 16px', background: 'transparent', color: 'white', border: '1px solid #475569', borderRadius: 8, cursor: 'pointer' }
};

export default LiveClass;
