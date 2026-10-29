// frontend/src/pages/teacher/Grading.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const Grading = () => {
  const { type, id } = useParams(); // type can be 'exam' or 'assignment'
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [id, type]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // ✅ FIXED ENDPOINTS TO MATCH BACKEND
      const endpoint = type === 'exam' 
        ? `/exams/submissions/${id}/` 
        : `/courses/assignments/${id}/submissions/`;
      const res = await api.get(endpoint);
      
      let data = res.data;
      if (data && data.results) data = data.results;
      if (data && data.submissions) data = data.submissions;
      
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    try {
      // ✅ FIXED PAYLOAD TO MATCH BACKEND (marks_obtained instead of score)
      const endpoint = type === 'exam'
        ? `/exams/answers/${submissionId}/grade/` // Fallback if exams need specific grade
        : `/courses/submissions/${submissionId}/grade/`;
        
      await api.post(endpoint, {
        marks_obtained: parseFloat(score),
        feedback: feedback
      });
      
      toast.success("Grade saved successfully!");
      setEditingId(null);
      fetchSubmissions(); // Refresh list
    } catch (err) {
      console.error("Failed to save grade", err);
      toast.error(err.response?.data?.error || "Failed to save grade.");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading submissions...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px' }}
      >
        <ArrowLeft size={18} /> Back to Course
      </button>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        Grade {type === 'exam' ? 'Exam' : 'Assignment'} Submissions
      </h1>

      {submissions.length === 0 ? (
        <p style={{ color: '#64748b' }}>No submissions yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {submissions.map((sub) => (
            <div key={sub.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{sub.student_name || sub.student?.full_name || 'Student'}</h3>
                  {sub.submitted_at && (
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                      Submitted: {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  {(sub.marks_obtained !== null && sub.marks_obtained !== undefined) ? (
                    <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
                      Score: {sub.marks_obtained} / {sub.total_marks || 100}
                    </span>
                  ) : (
                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
                      Needs Grading
                    </span>
                  )}
                </div>
              </div>

              {/* If there is text/code to grade */}
              {(sub.answer_text || sub.submission_text) && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {sub.answer_text || sub.submission_text}
                </div>
              )}

              {/* Grading Form */}
              {editingId === sub.id ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: 'column', background: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <input 
                      type="number" 
                      placeholder="Score" 
                      value={score} 
                      onChange={(e) => setScore(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '120px' }}
                    />
                    <input 
                      type="text" 
                      placeholder="Feedback (optional)" 
                      value={feedback} 
                      onChange={(e) => setFeedback(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleGrade(sub.id)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Save size={16} /> Save Grade
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { 
                    setEditingId(sub.id); 
                    setScore(sub.marks_obtained || sub.score || ''); 
                    setFeedback(sub.feedback || ''); 
                  }}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={16} /> {(sub.marks_obtained !== null && sub.marks_obtained !== undefined) || sub.score !== null ? 'Edit Grade' : 'Grade Now'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Grading;