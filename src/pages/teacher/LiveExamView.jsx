import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Video } from 'lucide-react';
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
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const pendingCandidatesRef = useRef({});

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

  useEffect(() => {
    let active = true;
    api.get(`/exams/${examId}/`)
      .then(({ data }) => { if (active) setExam(data); })
      .catch((requestError) => {
        console.error('Failed to load exam:', requestError);
        if (active) setError('Could not load this exam.');
      });
    loadStudents();
    const refreshTimer = window.setInterval(loadStudents, 10000);

    const token = localStorage.getItem('access_token');
    if (token) {
      const socket = new WebSocket(getWebSocketUrl(`/ws/exam-proctor/${examId}/`, { token }));
      socketRef.current = socket;
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
              sender_id: user?.id,
            }));
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
            delete peersRef.current[message.user_id];
            delete pendingCandidatesRef.current[message.user_id];
            setStreams((current) => {
              const next = { ...current };
              delete next[message.user_id];
              return next;
            });
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
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      pendingCandidatesRef.current = {};
      setStreams({});
    };
  }, [examId, loadStudents, user?.id]);

  const refresh = () => {
    setLoading(true);
    loadStudents();
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Link to="/teacher/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}><ArrowLeft size={17} /> Back to exams</Link>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '22px 0' }}>
        <div><h1 style={{ margin: 0, color: '#0f172a' }}>Live exam view</h1><p style={{ margin: '6px 0 0', color: '#64748b' }}>{exam?.title || 'Loading exam...'} · {students.length} student(s) currently taking the exam</p></div>
        <button type="button" onClick={refresh} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 9, background: 'white', color: '#334155', cursor: loading ? 'wait' : 'pointer' }}><RefreshCw size={16} /> Refresh</button>
      </header>
      {error && <p role="alert" style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>{error}</p>}
      {loading ? <p style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading live participants...</p> : students.length === 0 ? (
        <div style={{ padding: 48, borderRadius: 14, background: 'white', textAlign: 'center', color: '#64748b' }}><Video size={36} style={{ marginBottom: 8 }} /><p>No students are currently taking this exam.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {students.map((student) => {
            const stream = streams[student.user_id] || streams[student.student_id];
            return <article key={student.attempt_id} style={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 13, background: 'white' }}>
              <div style={{ position: 'relative', height: 220, display: 'grid', placeItems: 'center', background: '#0f172a', color: '#94a3b8' }}>
                {stream ? <video autoPlay playsInline muted ref={(element) => { if (element && element.srcObject !== stream) element.srcObject = stream; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>Waiting for live video...</span>}
                {stream && <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 8px', borderRadius: 5, background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 800 }}>LIVE</span>}
              </div>
              <div style={{ padding: 16 }}>
                <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 17 }}>{student.student_name}</h2>
                <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>{student.student_id}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                  <span style={{ padding: '4px 9px', borderRadius: 99, background: student.face_verified ? '#dcfce7' : '#fee2e2', color: student.face_verified ? '#15803d' : '#b91c1c' }}>{student.face_verified ? 'Identity verified' : 'Not verified'}</span>
                  <span style={{ padding: '4px 9px', borderRadius: 99, background: '#e0e7ff', color: '#4338ca' }}>Violations: {student.violations_count || 0}</span>
                </div>
              </div>
            </article>;
          })}
        </div>
      )}
    </main>
  );
};

export default LiveExamView;
