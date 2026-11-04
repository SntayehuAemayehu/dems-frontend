// frontend/src/pages/Student/LiveClasses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Users, Clock, Play, BookOpen, CalendarDays, Download, FileVideo, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import { deleteClassRecording, getAttendance, getClassRecording, getRecordingMetadata } from '../../utils/liveClassStorage';

const LiveClasses = () => {
  const { user } = useSelector((state) => state.auth || {});
  const isTeacher = user?.role === 'TEACHER';
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceCourse, setAttendanceCourse] = useState(null);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [expandedAttendanceId, setExpandedAttendanceId] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [activeRecording, setActiveRecording] = useState('');
  const [recordingToDelete, setRecordingToDelete] = useState(null);
  const [isDeletingRecording, setIsDeletingRecording] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      // Only show the loading spinner on the very first load, not on background polls
      if (courses.length === 0) setLoading(true);
      
      const response = await api.get('/courses/');
      let coursesData = [];
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        coursesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        coursesData = response.data;
      }
      
      let filteredCourses = [];
      if (user?.role === 'STUDENT') {
        filteredCourses = coursesData.filter(c => c.is_enrolled === true);
        try {
          const enrollResponse = await api.get('/courses/enrollments/');
          let enrollments = [];
          if (enrollResponse.data && enrollResponse.data.results) {
            enrollments = enrollResponse.data.results;
          } else if (Array.isArray(enrollResponse.data)) {
            enrollments = enrollResponse.data;
          }
          const enrolledCourseIds = enrollments.filter(e => e.status === 'ACTIVE').map(e => e.course);
          const enrolledFromApi = coursesData.filter(c => enrolledCourseIds.includes(c.id));
          filteredCourses = [...filteredCourses, ...enrolledFromApi];
          filteredCourses = filteredCourses.filter((c, index, self) => self.findIndex(c2 => c2.id === c.id) === index);
        } catch (e) {
          console.log('Could not fetch enrollments, using is_enrolled field');
        }
      } else if (user?.role === 'TEACHER') {
        filteredCourses = coursesData.filter(c => c.instructor === user.id);
      } else {
        filteredCourses = coursesData;
      }
      
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Don't spam toasts on background polling errors
      if (courses.length === 0) toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id, courses.length]);

  useEffect(() => {
    fetchCourses();
    
    // ✅ NEW: Poll every 5 seconds to check if teacher went live
    const interval = setInterval(() => {
      fetchCourses();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCourses]);

  useEffect(() => {
    try {
      setRecordings(getRecordingMetadata());
    } catch (error) {
      console.error('Could not read locally saved class recordings:', error);
      toast.error('Saved recording information could not be read.');
    }
  }, []);

  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  const handleJoinLiveClass = (courseId) => {
    navigate(`/live-class/${courseId}`);
  };

  const showAttendance = (course) => {
    try {
      const sessions = getAttendance()
        .filter((session) => String(session.courseId) === String(course.id))
        .sort((first, second) => new Date(second.startedAt) - new Date(first.startedAt));
      setAttendanceSessions(sessions);
      setExpandedAttendanceId('');
      setAttendanceCourse(course);
    } catch (error) {
      console.error('Could not read local attendance:', error);
      toast.error('Attendance could not be read from this browser.');
    }
  };

  const playRecording = async (recording) => {
    try {
      const saved = await getClassRecording(recording.id);
      if (!saved?.blob) {
        toast.error('This recording is no longer available on this device.');
        return;
      }
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      const url = URL.createObjectURL(saved.blob);
      setRecordingUrl(url);
      setActiveRecording(recording.id);
    } catch (error) {
      console.error('Could not load local class recording:', error);
      toast.error('The recording could not be opened.');
    }
  };

  const confirmDeleteRecording = async () => {
    if (!recordingToDelete || isDeletingRecording) return;
    setIsDeletingRecording(true);
    try {
      await deleteClassRecording(recordingToDelete.id);
      setRecordings((current) => current.filter((recording) => recording.id !== recordingToDelete.id));
      if (activeRecording === recordingToDelete.id) {
        setRecordingUrl((currentUrl) => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          return '';
        });
        setActiveRecording('');
      }
      setRecordingToDelete(null);
      toast.success('Recording deleted from this device.');
    } catch (error) {
      console.error('Could not delete local class recording:', error);
      toast.error('The recording could not be deleted.');
    } finally {
      setIsDeletingRecording(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) { .live-class-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Live Classes</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{user?.role === 'TEACHER' ? 'Start live classes for your courses' : `You have ${courses.length} course${courses.length !== 1 ? 's' : ''} available`}</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Link to="/teacher/courses" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
            <BookOpen size={18} /> My Courses
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <Video size={64} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>No live classes available</h3>
          <p style={{ color: '#64748b' }}>{user?.role === 'TEACHER' ? 'Create a course to start live teaching' : 'You are not enrolled in any courses. Browse courses to enroll.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }} className="live-class-grid">
          {courses.map((course) => {
            const isLive = course.is_live === true; 

            return (
              <div key={course.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'}>
                <div style={{ background: isLive ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #64748b, #475569)', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={48} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  {isLive && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', color: '#dc2626', fontSize: '12px', padding: '4px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                      LIVE NOW
                    </span>
                  )}
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>{course.course_code}</span>
                    {course.is_enrolled && <span style={{ fontSize: '12px', background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', marginLeft: '8px' }}>✓ Enrolled</span>}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{course.title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description || 'No description available'}</p>
                  
                  <div style={{ marginBottom: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={14} color="#6b7280" /><span style={{ fontSize: '13px', color: '#6b7280' }}>Instructor: {course.instructor_name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="#6b7280" /><span style={{ fontSize: '13px', color: '#6b7280' }}>{course.credit_hours} Credit Hours • Semester {course.semester}</span>
                    </div>
                  </div>
                  
                  {/* ✅ THE FIX: Teachers always see "Start", Students wait if not live */}
                  {isTeacher ? (
                    <button onClick={() => handleJoinLiveClass(course.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'} onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                      <Play size={16} /> Start Live Class
                    </button>
                  ) : isLive ? (
                    <button onClick={() => handleJoinLiveClass(course.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'} onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                      <Play size={16} /> Join Live Class
                    </button>
                  ) : (
                    <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed' }}>
                      <Clock size={16} /> Waiting for Teacher...
                    </button>
                  )}
                  {isTeacher && (
                    <button onClick={() => showAttendance(course)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '10px', padding: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                      <CalendarDays size={16} /> See attendance
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isTeacher && recordings.length > 0 && (
        <section style={{ marginTop: '28px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>
          <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileVideo size={20} /> Recordings saved on this device</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {recordings.map((recording) => (
              <div key={recording.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>{recording.courseName || `Course ${recording.courseId}`}</strong>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{new Date(recording.createdAt).toLocaleString()} · {(recording.size / (1024 * 1024)).toFixed(1)} MB</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => playRecording(recording)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: 0, borderRadius: '7px', background: '#2563eb', color: 'white', cursor: 'pointer' }}><Play size={15} /> Play</button>
                  {activeRecording === recording.id && recordingUrl && <a href={recordingUrl} download={`${recording.courseName || 'live-class'}-${recording.id}.webm`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '7px', background: '#e2e8f0', color: '#0f172a', textDecoration: 'none' }}><Download size={15} /> Download</a>}
                  <button onClick={() => setRecordingToDelete(recording)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '7px', background: '#fff1f2', color: '#be123c', cursor: 'pointer' }} aria-label={`Delete ${recording.courseName || 'class'} recording`}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {recordingUrl && <video src={recordingUrl} controls style={{ width: '100%', maxHeight: '420px', marginTop: '16px', background: '#0f172a', borderRadius: '8px' }} />}
        </section>
      )}

      {attendanceCourse && (
        <div role="presentation" onClick={() => setAttendanceCourse(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, .65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="attendance-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(720px, 100%)', maxHeight: '85vh', overflowY: 'auto', background: 'white', borderRadius: '14px', padding: '22px', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 id="attendance-title" style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Class attendance</h2>
                <p style={{ margin: '5px 0 0', color: '#64748b' }}>{attendanceCourse.title}</p>
              </div>
              <button onClick={() => setAttendanceCourse(null)} aria-label="Close attendance" style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer' }}><X size={21} /></button>
            </header>
            {attendanceSessions.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '28px 8px' }}>No attendance has been recorded on this device yet. Attendance is saved locally when you host a class.</p>
            ) : attendanceSessions.map((session) => (
              <article key={session.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                <button onClick={() => setExpandedAttendanceId((current) => current === session.id ? '' : session.id)} style={{ width: '100%', textAlign: 'left', border: 0, padding: '12px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', cursor: 'pointer' }}>
                  <strong style={{ color: '#0f172a' }}>{session.date} · {session.attendees?.length || 0} student{session.attendees?.length === 1 ? '' : 's'}</strong>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Started {new Date(session.startedAt).toLocaleTimeString()} · {expandedAttendanceId === session.id ? 'Hide' : 'View attendance'}</span>
                </button>
                {expandedAttendanceId === session.id && (session.attendees?.length ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#334155' }}>
                      <thead><tr style={{ textAlign: 'left', background: '#fff' }}>
                        <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>Student</th>
                        <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>Joined</th>
                        <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>Left</th>
                      </tr></thead>
                      <tbody>{session.attendees.map((attendee) => (
                        <tr key={attendee.userId}>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{attendee.name}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>{new Date(attendee.joinedAt).toLocaleTimeString()}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>{attendee.leftAt ? new Date(attendee.leftAt).toLocaleTimeString() : session.endedAt ? `${new Date(session.endedAt).toLocaleTimeString()} (class ended)` : 'Still in class'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <p style={{ margin: 0, padding: '14px', color: '#64748b', fontSize: '13px' }}>No students attended this class.</p>)}
              </article>
            ))}
          </section>
        </div>
      )}

      {recordingToDelete && (
        <div
          role="presentation"
          onClick={() => !isDeletingRecording && setRecordingToDelete(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isDeletingRecording) setRecordingToDelete(null);
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15, 23, 42, .65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-recording-title"
            aria-describedby="delete-recording-description"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(440px, 100%)', background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}
          >
            <div style={{ width: '44px', height: '44px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: '#fff1f2', color: '#be123c', marginBottom: '16px' }}>
              <Trash2 size={22} />
            </div>
            <h2 id="delete-recording-title" style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '19px' }}>Delete this recording?</h2>
            <p id="delete-recording-description" style={{ margin: '0 0 22px', color: '#64748b', lineHeight: 1.5 }}>
              “{recordingToDelete.courseName || `Course ${recordingToDelete.courseId}`}” saved on {new Date(recordingToDelete.createdAt).toLocaleString()} will be permanently deleted from this device.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRecordingToDelete(null)} disabled={isDeletingRecording} style={{ padding: '9px 14px', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDeleteRecording} disabled={isDeletingRecording} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', background: '#dc2626', color: 'white', border: 0, borderRadius: '8px', cursor: isDeletingRecording ? 'wait' : 'pointer', opacity: isDeletingRecording ? 0.7 : 1 }}>
                <Trash2 size={15} /> {isDeletingRecording ? 'Deleting…' : 'Delete recording'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;