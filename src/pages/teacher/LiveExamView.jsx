import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Video, Hand, Volume2, VolumeX, Pause, Play, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getWebSocketUrl } from '../../api/api';
import { useSelector } from 'react-redux';

const LiveExamView = () => {
  const { examId } = useParams();
  const { user } = useSelector((state) => state.auth || {});
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [streams, setStreams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canAssign, setCanAssign] = useState(false);
  const [examiners, setExaminers] = useState([]);
  const [examinerId, setExaminerId] = useState('');
  const [selectedAttempts, setSelectedAttempts] = useState([]);
  const [speakingStudent, setSpeakingStudent] = useState(null);
  const [listeningStudent, setListeningStudent] = useState(null);
  const [listenStreams, setListenStreams] = useState({});
  const [raisedHands, setRaisedHands] = useState({});
  const [studentAlerts, setStudentAlerts] = useState({});
  const [pausedStudents, setPausedStudents] = useState({});
  const [incidentNotes, setIncidentNotes] = useState({});
  const [extraMinutes, setExtraMinutes] = useState({});
  const [assigning, setAssigning] = useState(false);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const voicePeersRef = useRef({});
  const voiceCandidatesRef = useRef({});
  const listenPeersRef = useRef({});
  const listenCandidatesRef = useRef({});
  const microphoneRef = useRef(null);
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const listeningStudentRef = useRef(listeningStudent);
  listeningStudentRef.current = listeningStudent;

  const loadStudents = useCallback(async () => {
    try {
      const { data } = await api.get(`/exams/${examId}/live-monitoring/`);
      setStudents(data.students || []);
      setError('');
    } catch (requestError) {
      console.error('Failed to load students in live exam:', requestError);
      setError(requestError.response?.data?.error || 'Could not load live exam participants.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const loadExaminerOptions = useCallback(async () => {
    try {
      const { data } = await api.get(`/exams/${examId}/examiner-assignments/`);
      setCanAssign(data.can_assign === true);
      setExaminers(data.examiners || []);
    } catch (requestError) {
      if (requestError.response?.status !== 403) {
        console.error('Failed to load examiner options:', requestError);
        setError(requestError.response?.data?.error || 'Could not load examiner options.');
      }
    }
  }, [examId]);

  useEffect(() => {
    let active = true;
    api.get(`/exams/${examId}/`)
      .then(({ data }) => { if (active) setExam(data); })
      .catch((requestError) => {
        console.error('Failed to load exam:', requestError);
        if (active) setError('Could not load this exam.');
      });

    loadStudents();
    loadExaminerOptions();
    const refreshTimer = window.setInterval(loadStudents, 10000);
    const token = localStorage.getItem('access_token');

    if (token) {
      const socket = new WebSocket(getWebSocketUrl(`/ws/exam-proctor/${examId}/`, { token }));
      socketRef.current = socket;
      const requestStudentStreams = () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'request_streams', sender_id: user?.id }));
        }
      };
      socket.onopen = requestStudentStreams;
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadStudents();
          requestStudentStreams();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', requestStudentStreams);
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'offer' && message.sender_id) {
            const studentId = message.sender_id;
            peersRef.current[studentId]?.close();
            pendingCandidatesRef.current[studentId] = [];
            const peer = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            });
            peersRef.current[studentId] = peer;
            peer.ontrack = (trackEvent) => {
              const stream = trackEvent.streams?.[0];
              if (stream) setStreams((current) => ({ ...current, [studentId]: stream }));
            };
            peer.onicecandidate = (candidateEvent) => {
              if (candidateEvent.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: 'ice_candidate',
                  candidate: candidateEvent.candidate,
                  target_user_id: studentId,
                  sender_id: user?.id,
                }));
              }
            };
            await peer.setRemoteDescription(new RTCSessionDescription(message.offer));
            const queued = pendingCandidatesRef.current[studentId] || [];
            pendingCandidatesRef.current[studentId] = [];
            for (const candidate of queued) await peer.addIceCandidate(new RTCIceCandidate(candidate));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.send(JSON.stringify({
              type: 'answer',
              answer,
              sender: user?.full_name,
              sender_role: user?.role,
              target_user_id: studentId,
              sender_id: user?.id,
            }));
          } else if (message.type === 'voice_offer' && message.sender_role === 'STUDENT' && message.sender_id) {
            const studentId = message.sender_id;
            listenPeersRef.current[studentId]?.close();
            listenCandidatesRef.current[studentId] = [];
            const peer = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            });
            listenPeersRef.current[studentId] = peer;
            peer.ontrack = (trackEvent) => {
              const stream = trackEvent.streams?.[0];
              if (stream) setListenStreams((current) => ({ ...current, [studentId]: stream }));
            };
            peer.onicecandidate = (candidateEvent) => {
              if (candidateEvent.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: 'voice_ice_candidate',
                  candidate: candidateEvent.candidate,
                  target_user_id: studentId,
                  sender_id: user?.id,
                }));
              }
            };
            await peer.setRemoteDescription(new RTCSessionDescription(message.offer));
            const queued = listenCandidatesRef.current[studentId] || [];
            listenCandidatesRef.current[studentId] = [];
            for (const candidate of queued) await peer.addIceCandidate(new RTCIceCandidate(candidate));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.send(JSON.stringify({
              type: 'voice_answer',
              answer,
              target_user_id: studentId,
              sender_id: user?.id,
            }));
            setListeningStudent(studentId);
          } else if (message.type === 'voice_answer' && message.sender_id) {
            const peer = listenPeersRef.current[message.sender_id] || voicePeersRef.current[message.sender_id];
            if (peer && !peer.remoteDescription) {
              await peer.setRemoteDescription(new RTCSessionDescription(message.answer));
              const candidates = listenPeersRef.current[message.sender_id]
                ? listenCandidatesRef.current
                : voiceCandidatesRef.current;
              const queued = candidates[message.sender_id] || [];
              candidates[message.sender_id] = [];
              for (const candidate of queued) await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } else if (message.type === 'voice_ice_candidate' && message.candidate && message.sender_id) {
            const peer = listenPeersRef.current[message.sender_id] || voicePeersRef.current[message.sender_id];
            const candidates = listenPeersRef.current[message.sender_id]
              ? listenCandidatesRef.current
              : voiceCandidatesRef.current;
            if (peer?.remoteDescription) await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
            else {
              const queue = candidates[message.sender_id] || [];
              queue.push(message.candidate);
              candidates[message.sender_id] = queue;
            }
          } else if (message.type === 'ice_candidate' && message.candidate && message.sender_id) {
            const peer = peersRef.current[message.sender_id];
            if (peer?.remoteDescription) await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
            else {
              const queue = pendingCandidatesRef.current[message.sender_id] || [];
              queue.push(message.candidate);
              pendingCandidatesRef.current[message.sender_id] = queue;
            }
          } else if (message.type === 'user_leave' && message.user_id) {
            peersRef.current[message.user_id]?.close();
            voicePeersRef.current[message.user_id]?.close();
            listenPeersRef.current[message.user_id]?.close();
            delete peersRef.current[message.user_id];
            delete pendingCandidatesRef.current[message.user_id];
            delete voicePeersRef.current[message.user_id];
            delete voiceCandidatesRef.current[message.user_id];
            delete listenPeersRef.current[message.user_id];
            delete listenCandidatesRef.current[message.user_id];
            setStreams((current) => {
              const next = { ...current };
              delete next[message.user_id];
              return next;
            });
            setListenStreams((current) => {
              const next = { ...current };
              delete next[message.user_id];
              return next;
            });
            if (String(listeningStudentRef.current) === String(message.user_id)) setListeningStudent(null);
            setRaisedHands((current) => {
              const next = { ...current };
              delete next[message.user_id];
              return next;
            });
          } else if (message.type === 'hand_state' && message.user_id) {
            setRaisedHands((current) => ({ ...current, [message.user_id]: message.raised === true }));
          } else if (message.type === 'proctor_alert' && message.student_id) {
            setStudentAlerts((current) => ({
              ...current,
              [message.student_id]: { type: message.event_type, message: message.message },
            }));
            toast.error(`${message.student_name}: ${message.message}`);
          } else if (message.type === 'audio_listen_unavailable') {
            setListeningStudent(null);
            setError(`${message.student_name} does not have an active microphone stream.`);
          } else if (message.type === 'teacher_note_saved') {
            toast.success('Incident note recorded.');
            const notedStudent = studentsRef.current.find((student) => String(student.user_id) === String(message.target_user_id));
            if (notedStudent) {
              setIncidentNotes((current) => ({ ...current, [notedStudent.attempt_id]: '' }));
            }
          }
        } catch (socketError) {
          console.error('Could not process live exam stream message:', socketError);
        }
      };
      socket.onerror = (socketError) => console.error('Live exam connection error:', socketError);
    } else {
      setError('Your session has expired. Please sign in again.');
    }

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', requestStudentStreams);
      socketRef.current?.close();
      socketRef.current = null;
      Object.values(peersRef.current).forEach((peer) => peer.close());
      Object.values(voicePeersRef.current).forEach((peer) => peer.close());
      Object.values(listenPeersRef.current).forEach((peer) => peer.close());
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current = {};
      pendingCandidatesRef.current = {};
      voicePeersRef.current = {};
      voiceCandidatesRef.current = {};
      listenPeersRef.current = {};
      listenCandidatesRef.current = {};
      setStreams({});
      setListenStreams({});
    };
  }, [examId, loadStudents, loadExaminerOptions, user?.id]);

  const refresh = () => {
    setLoading(true);
    loadStudents();
  };

  const assignExaminer = async () => {
    if (!examinerId || selectedAttempts.length === 0) return;
    setAssigning(true);
    try {
      const { data } = await api.post(`/exams/${examId}/examiner-assignments/`, {
        examiner_id: examinerId,
        attempt_ids: selectedAttempts,
      });
      setSelectedAttempts([]);
      setError('');
      await loadStudents();
      toast.success(`Assigned examiner to ${data.assigned_count} student(s).`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not assign examiner.');
    } finally {
      setAssigning(false);
    }
  };

  const toggleSelection = (attemptId) => {
    setSelectedAttempts((current) => current.includes(attemptId)
      ? current.filter((id) => id !== attemptId)
      : [...current, attemptId]);
  };

  const speakToStudent = async (student) => {
    const studentUserId = String(student.user_id);
    if (String(speakingStudent) === studentUserId) {
      voicePeersRef.current[studentUserId]?.close();
      delete voicePeersRef.current[studentUserId];
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
      setSpeakingStudent(null);
      return;
    }
    if (String(listeningStudent) === studentUserId) {
      socketRef.current?.send(JSON.stringify({
        type: 'audio_listen_stop',
        target_user_id: studentUserId,
        sender_id: user?.id,
      }));
      listenPeersRef.current[studentUserId]?.close();
      delete listenPeersRef.current[studentUserId];
      delete listenCandidatesRef.current[studentUserId];
      setListenStreams((current) => {
        const next = { ...current };
        delete next[studentUserId];
        return next;
      });
      setListeningStudent(null);
    }
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('The live exam connection is not ready.');
      return;
    }

    try {
      voicePeersRef.current[speakingStudent]?.close();
      delete voicePeersRef.current[speakingStudent];
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      microphoneRef.current = microphone;
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      voicePeersRef.current[student.user_id] = peer;
      voiceCandidatesRef.current[student.user_id] = [];
      microphone.getAudioTracks().forEach((track) => peer.addTrack(track, microphone));
      peer.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'voice_ice_candidate',
            candidate: event.candidate,
            target_user_id: student.user_id,
            sender_id: user?.id,
          }));
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current.send(JSON.stringify({
        type: 'voice_offer',
        offer,
        target_user_id: student.user_id,
        sender_id: user?.id,
      }));
      setSpeakingStudent(student.user_id);
      setError('');
    } catch (requestError) {
      console.error('Could not start private student audio:', requestError);
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
      setError('Could not access your microphone. Check microphone permissions.');
    }
  };

  const listenToStudent = (student) => {
    const studentUserId = String(student.user_id);
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('The live exam connection is not ready.');
      return;
    }

    if (String(speakingStudent) === studentUserId) {
      voicePeersRef.current[studentUserId]?.close();
      delete voicePeersRef.current[studentUserId];
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
      setSpeakingStudent(null);
    }

    if (String(listeningStudent) === studentUserId) {
      socketRef.current.send(JSON.stringify({
        type: 'audio_listen_stop',
        target_user_id: studentUserId,
        sender_id: user?.id,
      }));
      listenPeersRef.current[studentUserId]?.close();
      delete listenPeersRef.current[studentUserId];
      delete listenCandidatesRef.current[studentUserId];
      setListenStreams((current) => {
        const next = { ...current };
        delete next[studentUserId];
        return next;
      });
      setListeningStudent(null);
      return;
    }

    if (listeningStudent) {
      const previousStudentId = String(listeningStudent);
      socketRef.current.send(JSON.stringify({
        type: 'audio_listen_stop',
        target_user_id: previousStudentId,
        sender_id: user?.id,
      }));
      listenPeersRef.current[previousStudentId]?.close();
      delete listenPeersRef.current[previousStudentId];
      delete listenCandidatesRef.current[previousStudentId];
      setListenStreams((current) => {
        const next = { ...current };
        delete next[previousStudentId];
        return next;
      });
    }

    socketRef.current.send(JSON.stringify({
      type: 'audio_listen_request',
      target_user_id: studentUserId,
      sender_id: user?.id,
    }));
    setListeningStudent(studentUserId);
    setError('');
  };

  const sendStudentControl = (student, type, message) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('The live exam connection is not ready.');
      return false;
    }
    socketRef.current.send(JSON.stringify({
      type,
      message,
      target_user_id: student.user_id,
      sender_id: user?.id,
    }));
    return true;
  };

  const recordIncident = (student) => {
    const message = (incidentNotes[student.attempt_id] || '').trim();
    if (!message) {
      setError('Enter an incident note before recording it.');
      return;
    }
    if (sendStudentControl(student, 'teacher_note', message)) {
      setError('');
    }
  };

  const toggleStudentPause = (student) => {
    const isPaused = pausedStudents[student.attempt_id] === true;
    if (sendStudentControl(
      student,
      isPaused ? 'resume_exam' : 'pause_exam',
      isPaused ? 'Your teacher resumed the exam.' : 'Your teacher paused the exam for review.',
    )) {
      setPausedStudents((current) => ({ ...current, [student.attempt_id]: !isPaused }));
    }
  };

  const forceSubmitStudent = (student) => {
    if (!window.confirm(`End ${student.student_name}'s exam now?`)) return;
    sendStudentControl(student, 'force_submit', 'Your teacher ended this exam.');
  };

  const addTime = (student) => {
    const minutes = Number(extraMinutes[student.attempt_id]);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      setError('Extra time must be between 1 and 240 minutes.');
      return;
    }
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('The live exam connection is not ready.');
      return;
    }
    socketRef.current.send(JSON.stringify({
      type: 'add_time',
      minutes,
      target_user_id: student.user_id,
      sender_id: user?.id,
    }));
    setError('');
  };

  return (
    <main style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
      <Link to="/teacher/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}><ArrowLeft size={17} /> Back to exams</Link>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '22px 0' }}>
        <div><h1 style={{ margin: 0, color: '#0f172a' }}>Live exam view</h1><p style={{ margin: '6px 0 0', color: '#64748b' }}>{exam?.title || 'Loading exam...'} · {students.length} student(s) · {Object.keys(streams).length} live video(s)</p></div>
        <button type="button" onClick={refresh} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 9, background: 'white', color: '#334155', cursor: loading ? 'wait' : 'pointer' }}><RefreshCw size={16} /> Refresh</button>
      </header>
      {error && <p role="alert" style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>{error}</p>}
      {canAssign && <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <label htmlFor="examiner-select">Assign selected students to a department examiner:</label>
        <select id="examiner-select" value={examinerId} onChange={(event) => setExaminerId(event.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 7 }}>
          <option value="">Select examiner</option>
          {examiners.map((examiner) => <option key={examiner.id} value={examiner.id}>{examiner.full_name}</option>)}
        </select>
        <button type="button" onClick={assignExaminer} disabled={assigning || !examinerId || !selectedAttempts.length} style={{ padding: '9px 14px', border: 0, borderRadius: 7, background: '#4f46e5', color: 'white', cursor: 'pointer' }}>
          {assigning ? 'Assigning...' : `Assign ${selectedAttempts.length} student(s)`}
        </button>
      </section>}
      {loading ? <p style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading live participants...</p> : students.length === 0 ? (
        <div style={{ padding: 48, borderRadius: 14, background: 'white', textAlign: 'center', color: '#64748b' }}><Video size={36} style={{ marginBottom: 8 }} /><p>No students are currently taking this exam.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
          {students.map((student) => {
            const stream = streams[student.user_id] || streams[student.student_id];
            const studentAudioStream = listenStreams[student.user_id];
            const hasRaisedHand = raisedHands[student.user_id] === true;
            return <article key={student.attempt_id} style={{ minWidth: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#94a3b8', fontSize: 12 }}>
                {stream ? <video autoPlay playsInline muted ref={(element) => { if (element && element.srcObject !== stream) element.srcObject = stream; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>Waiting for live video...</span>}
                {stream && <span style={{ position: 'absolute', top: 7, left: 7, padding: '3px 6px', borderRadius: 5, background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 800 }}>LIVE</span>}
              </div>
              <div style={{ padding: 10 }}>
                <h2 title={student.student_name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 3px', color: '#0f172a', fontSize: 14 }}>{student.student_name}</h2>
                <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 8px', color: '#64748b', fontSize: 11 }}>{student.student_id}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', fontSize: 10 }}>
                  <span style={{ padding: '3px 6px', borderRadius: 99, background: student.face_verified ? '#dcfce7' : '#fee2e2', color: student.face_verified ? '#15803d' : '#b91c1c' }}>{student.face_verified ? 'Verified' : 'Not verified'}</span>
                  <span style={{ padding: '3px 6px', borderRadius: 99, background: '#e0e7ff', color: '#4338ca' }}>Violations: {student.violations_count || 0}</span>
                  {hasRaisedHand && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 99, background: '#fef3c7', color: '#92400e' }}><Hand size={11} /> Hand raised</span>}
                </div>
                {studentAlerts[student.user_id] && (
                  <p role="status" style={{ margin: '8px 0 0', padding: 7, borderRadius: 6, background: '#fef2f2', color: '#b91c1c', fontSize: 11 }}>
                    {studentAlerts[student.user_id].type.replace(/_/g, ' ')}: {studentAlerts[student.user_id].message}
                  </p>
                )}
                {studentAudioStream && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ margin: '0 0 4px', color: '#b91c1c', fontSize: 11, fontWeight: 600 }}>Live audio · not recorded</p>
                    <audio
                      autoPlay
                      controls
                      playsInline
                      ref={(element) => {
                        if (element && element.srcObject !== studentAudioStream) element.srcObject = studentAudioStream;
                      }}
                      style={{ width: '100%', height: 32 }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                  {canAssign && <label style={{ fontSize: 12 }}><input type="checkbox" checked={selectedAttempts.includes(Number(student.attempt_id))} onChange={() => toggleSelection(Number(student.attempt_id))} /> Select</label>}
                  <button type="button" onClick={() => speakToStudent(student)} style={{ padding: '6px 9px', border: 0, borderRadius: 6, background: speakingStudent === student.user_id ? '#b91c1c' : '#0f766e', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                    {speakingStudent === student.user_id ? 'Stop speaking' : 'Speak privately'}
                  </button>
                  <button type="button" onClick={() => listenToStudent(student)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 9px', border: 0, borderRadius: 6, background: String(listeningStudent) === String(student.user_id) ? '#b91c1c' : '#2563eb', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                    {String(listeningStudent) === String(student.user_id) ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    {String(listeningStudent) === String(student.user_id) ? 'Stop listening' : 'Listen live'}
                  </button>
                  <button type="button" onClick={() => sendStudentControl(student, 'warning', 'Please follow exam rules and continue quietly.')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 9px', border: 0, borderRadius: 6, background: '#d97706', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                    <ShieldAlert size={13} /> Warn
                  </button>
                  {canAssign && <>
                    <button type="button" onClick={() => toggleStudentPause(student)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 9px', border: 0, borderRadius: 6, background: pausedStudents[student.attempt_id] ? '#16a34a' : '#475569', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                      {pausedStudents[student.attempt_id] ? <Play size={13} /> : <Pause size={13} />}
                      {pausedStudents[student.attempt_id] ? 'Resume' : 'Pause'}
                    </button>
                    <button type="button" onClick={() => forceSubmitStudent(student)} style={{ padding: '6px 9px', border: 0, borderRadius: 6, background: '#b91c1c', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                      End exam
                    </button>
                  </>}
                  {canAssign && <>
                    <input aria-label={`Extra time for ${student.student_name}`} type="number" min="1" max="240" value={extraMinutes[student.attempt_id] || ''} onChange={(event) => setExtraMinutes((current) => ({ ...current, [student.attempt_id]: event.target.value }))} placeholder="Minutes" style={{ width: 75, padding: 6, border: '1px solid #cbd5e1', borderRadius: 6 }} />
                    <button type="button" onClick={() => addTime(student)} style={{ padding: '6px 9px', border: 0, borderRadius: 6, background: '#4f46e5', color: 'white', cursor: 'pointer', fontSize: 12 }}>Add time</button>
                  </>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input
                    aria-label={`Incident note for ${student.student_name}`}
                    value={incidentNotes[student.attempt_id] || ''}
                    onChange={(event) => setIncidentNotes((current) => ({ ...current, [student.attempt_id]: event.target.value }))}
                    placeholder="Incident note (review only)"
                    maxLength={500}
                    style={{ minWidth: 0, flex: 1, padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11 }}
                  />
                  <button type="button" onClick={() => recordIncident(student)} style={{ padding: '6px 8px', border: 0, borderRadius: 6, background: '#334155', color: 'white', cursor: 'pointer', fontSize: 11 }}>
                    Record
                  </button>
                </div>
                {student.assigned_examiner_name && (
                  <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 11 }}>
                    Assigned examiner: {student.assigned_examiner_name}
                  </p>
                )}
              </div>
            </article>;
          })}
        </div>
      )}
    </main>
  );
};

export default LiveExamView;
