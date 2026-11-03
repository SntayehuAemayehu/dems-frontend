// frontend/src/pages/Student/ExamResults.jsx
// SUM ONLY — no division, no weights
// Course total = Quiz marks + Mid marks + Final marks + Assignment marks (raw sum)
// Letter grade per course + bottom TOTAL row (sum across all courses)

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Award, TrendingUp, CheckCircle, XCircle, RefreshCw, FileText,
  Clock, AlertCircle, ClipboardList, BookOpen, MessageSquare, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchResults } from '../../store/slices/examSlice';
import api from '../../api/api';

// ============================================================
// HELPERS
// ============================================================

const normalize = (d) =>
  Array.isArray(d) ? d
    : Array.isArray(d?.results) ? d.results
    : Array.isArray(d?.data) ? d.data
    : [];

// ============================================================
// LETTER GRADE (raw sum scale)
// ============================================================

const letterGrade = (total) => {
  const p = Number(total) || 0;
  if (p >= 90) return { letter: 'A+', color: '#16a34a' };
  if (p >= 85) return { letter: 'A',  color: '#16a34a' };
  if (p >= 80) return { letter: 'A-', color: '#16a34a' };
  if (p >= 75) return { letter: 'B+', color: '#2563eb' };
  if (p >= 70) return { letter: 'B',  color: '#2563eb' };
  if (p >= 65) return { letter: 'B-', color: '#2563eb' };
  if (p >= 60) return { letter: 'C+', color: '#d97706' };
  if (p >= 55) return { letter: 'C',  color: '#d97706' };
  if (p >= 50) return { letter: 'C-', color: '#d97706' };
  if (p >= 45) return { letter: 'D',  color: '#dc2626' };
  return { letter: 'F', color: '#dc2626' };
};

// ============================================================
// BUILD COURSE GRADES — SUM ONLY
// Takes ONLY the marks returned by the API. No division, no weights.
// ============================================================

const buildCourseGrades = (exams, assigns) => {
  const courses = {};

  const ensure = (courseId, code, title) => {
    const key = courseId != null ? `id:${courseId}` : `code:${code}`;
    if (!courses[key]) {
      courses[key] = {
        course_id: courseId,
        course_code: code,
        course_title: title || '—',
        quiz: 0,
        mid: 0,
        assignment: 0,
        final: 0,
        total: 0,
      };
    }
    return courses[key];
  };

  // EXAMS — take r.score ONLY (raw marks from API)
  exams.forEach((r) => {
    const code  = r.course_code || r.exam?.course_code || r.exam?.course_title || r.course_title || 'Unknown';
    const title = r.exam?.course_title || r.course_title || '—';
    const courseId = r.course_id ?? r.exam?.course_id;
    const c = ensure(courseId, code, title);

    const obtained = Number(r.score ?? 0);
    const type = (r.exam_type || r.exam?.exam_type || '').toUpperCase();

    if (type === 'QUIZ') c.quiz += obtained;
    else if (type === 'MID' || type === 'MIDTERM') c.mid += obtained;
    else if (type === 'FINAL') c.final += obtained;

    c.total += obtained;
  });

  // ASSIGNMENTS — take a.marks_obtained ONLY
  assigns.forEach((a) => {
    const code  = a.course_code || a.course_title || 'Unknown';
    const title = a.course_title || '—';
    const c = ensure(a.course_id, code, title);

    const obtained = Number(a.marks_obtained ?? 0);
    c.assignment += obtained;
    c.total += obtained;
  });

  // Attach letter grade (based on SUM)
  return Object.values(courses).map((c) => {
    const g = letterGrade(c.total);
    return { ...c, letter: g.letter, color: g.color };
  });
};

// ============================================================
// UI PIECES
// ============================================================

const StatusBadge = ({ type, text }) => (
  <span className={`rs rs-${type}`}>
    {type === 'passed' && <CheckCircle size={14} />}
    {type === 'failed' && <XCircle size={14} />}
    {type === 'pending' && <Clock size={14} />}
    {type === 'satisfactory' && <TrendingUp size={14} />}
    {type === 'inactive' && <FileText size={14} />}
    {text}
  </span>
);

const Table = ({ headers, children, footer }) => (
  <div className="rc">
    <div className="rw">
      <table className="rt">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
    {footer && <div className="rf">{footer}</div>}
  </div>
);

const Summary = ({ cards }) => (
  <div className="rsum">
    {cards.map((c, i) => (
      <div key={i} className={`sc sc-${c.color}`}>
        <div>
          <p className="scl">{c.label}</p>
          <p className="scv">{c.value}</p>
        </div>
        {c.icon}
      </div>
    ))}
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const ExamResults = () => {
  const dispatch = useDispatch();
  const { results = [] } = useSelector((s) => s.exams || {});
  const { user } = useSelector((s) => s.auth || {});

  const [tab, setTab] = useState('grades');
  const [exams, setExams] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [loading, setLoading] = useState({ grades: true, exams: true, assignments: true });
  const [refreshing, setRefreshing] = useState({ grades: false, exams: false, assignments: false });
  const [error, setError] = useState({ grades: null, exams: null, assignments: null });

  // ---------- Fetchers ----------
  const loadExams = async () => {
    setRefreshing((r) => ({ ...r, exams: true }));
    setError((e) => ({ ...e, exams: null }));
    try {
      const res = await dispatch(fetchResults()).unwrap();
      let data = normalize(res);
      if (!data.length) {
        const r = await api.get('/exams/results/');
        data = normalize(r.data);
      }
      setExams(data);
      if (data.length) toast.success(`Loaded ${data.length} exam results`);
    } catch (err) {
      try {
        const r = await api.get('/exams/results/');
        const data = normalize(r.data);
        setExams(data);
      } catch (e) {
        setError((x) => ({ ...x, exams: e?.response?.data?.detail || e?.message || 'Failed to load exam results' }));
        setExams([]);
      }
    } finally {
      setLoading((l) => ({ ...l, exams: false, grades: false }));
      setRefreshing((r) => ({ ...r, exams: false }));
    }
  };

  const loadAssignments = async () => {
    setRefreshing((r) => ({ ...r, assignments: true }));
    setError((e) => ({ ...e, assignments: null }));
    try {
      const r = await api.get('/courses/student/assignments/results/');
      const data = normalize(r.data);
      setAssigns(data);
      if (data.length) toast.success(`Loaded ${data.length} assignment results`);
    } catch (e) {
      setError((x) => ({ ...x, assignments: e?.response?.data?.detail || e?.message || 'Failed to load assignment results' }));
      setAssigns([]);
      toast.error('Failed to load assignment results');
    } finally {
      setLoading((l) => ({ ...l, assignments: false, grades: false }));
      setRefreshing((r) => ({ ...r, assignments: false }));
    }
  };

  useEffect(() => { loadExams(); loadAssignments(); }, []);

  const refresh = () => {
    if (tab === 'exams') loadExams();
    else if (tab === 'assignments') loadAssignments();
    else { loadExams(); loadAssignments(); }
  };

  // ---------- Derived ----------
  const courseGrades = buildCourseGrades(exams, assigns);

  // Bottom TOTAL = sum across all courses (marks only)
  const grandTotal = courseGrades.reduce((s, c) => s + c.total, 0);
  const grandGrade = letterGrade(grandTotal);

  const examAvg = exams.length
    ? (exams.reduce((s, r) => s + (parseFloat(r.percentage) || 0), 0) / exams.length).toFixed(2)
    : '0.00';
  const examPassed = exams.filter((r) => r.passed === true).length;
  const examFailed = exams.filter((r) => r.passed === false).length;

  const gradedA = assigns.filter((a) => a.marks_obtained != null).length;
  const pendingA = assigns.filter((a) => a.marks_obtained == null).length;
  const submittedA = assigns.filter((a) => a.submitted_at).length;
  const assignAvg = (() => {
    const g = assigns.filter((a) => a.marks_obtained != null && Number(a.total_marks) > 0);
    if (!g.length) return '0.00';
    return (g.reduce((s, a) => s + (Number(a.marks_obtained) / Number(a.total_marks)) * 100, 0) / g.length).toFixed(2);
  })();

  // ---------- Badges ----------
  const examBadge = (passed) =>
    passed === true
      ? <StatusBadge type="passed" text="Passed" />
      : <StatusBadge type="failed" text="Failed" />;

  const assignBadge = (a) => {
    if (a.marks_obtained != null) {
      const p = Number(a.total_marks) > 0 ? (Number(a.marks_obtained) / Number(a.total_marks)) * 100 : 0;
      if (p >= 70) return <StatusBadge type="passed" text="Passed" />;
      if (p >= 50) return <StatusBadge type="satisfactory" text="Satisfactory" />;
      return <StatusBadge type="failed" text="Needs Improvement" />;
    }
    if (a.submitted_at) return <StatusBadge type="pending" text="Pending Grade" />;
    return <StatusBadge type="inactive" text="Not Submitted" />;
  };

  // ---------- Loading ----------
  const isLoading = loading[tab];
  const isRefreshing = refreshing[tab];
  const err = error[tab];

  if (isLoading) {
    return (
      <div className="rload">
        <div className="rspin" />
        <p>Loading your results...</p>
        <style>{`@keyframes rspin{to{transform:rotate(360deg)}}.rload{display:flex;justify-content:center;align-items:center;min-height:400px;flex-direction:column;gap:16px}.rspin{width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:rspin 1s linear infinite}`}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="page">
      <style>{`
        .page{max-width:1280px;margin:0 auto;padding:24px;color:#0f172a}
        .hd{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px}
        .ttl{font-size:28px;font-weight:700;margin:0;display:flex;align-items:center;gap:12px}
        .sub{color:#64748b;margin:6px 0 0;font-size:14px}
        .rbtn{display:flex;align-items:center;gap:8px;padding:10px 18px;background:#f1f5f9;border:none;border-radius:8px;color:#475569;cursor:pointer;font-size:14px;font-weight:500;transition:.3s}
        .rbtn:hover{background:#e2e8f0}.rbtn:disabled{opacity:.6;cursor:not-allowed}.spin{animation:rspin 1s linear infinite}
        .tabs{display:flex;gap:12px;margin-bottom:24px;background:#fff;padding:8px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e2e8f0}
        .tab{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;border:none;border-radius:8px;background:transparent;color:#64748b;font-size:15px;font-weight:600;cursor:pointer;transition:.25s}
        .tab:hover{background:#f1f5f9;color:#2563eb}.tab.active{background:#2563eb;color:#fff;box-shadow:0 3px 8px rgba(37,99,235,.2)}
        .cnt{padding:3px 9px;border-radius:20px;background:rgba(255,255,255,.2);font-size:12px}.tab:not(.active) .cnt{background:#e2e8f0;color:#475569}
        .rsum{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
        .sc{border-radius:12px;padding:24px;color:#fff;display:flex;justify-content:space-between;align-items:center;min-height:110px}
        .sc-blue{background:linear-gradient(135deg,#3b82f6,#2563eb)}.sc-green{background:linear-gradient(135deg,#22c55e,#16a34a)}
        .sc-purple{background:linear-gradient(135deg,#8b5cf6,#7c3aed)}.sc-orange{background:linear-gradient(135deg,#f59e0b,#d97706)}
        .scl{font-size:14px;opacity:.9;margin:0}.scv{font-size:30px;font-weight:700;margin:6px 0 0}.sci{opacity:.5}
        .rc{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden;border:1px solid #e2e8f0}
        .rw{width:100%;overflow-x:auto}.rt{width:100%;border-collapse:collapse;min-width:1000px}
        .rt thead{background:#f8fafc}.rt th{padding:14px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap}
        .rt td{padding:14px 16px;font-size:14px;border-bottom:1px solid #f1f5f9;color:#475569;vertical-align:middle}
        .rt tbody tr{transition:background .2s}.rt tbody tr:hover{background:#f8fafc}.rt tbody tr:last-child td{border-bottom:none}
        .rt tr.total-row{background:#eff6ff;border-top:2px solid #2563eb}
        .rt tr.total-row td{font-weight:800;color:#0f172a;font-size:14px;border-bottom:none}
        .rs{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap}
        .rs-passed{background:#dcfce7;color:#16a34a}.rs-failed{background:#fee2e2;color:#dc2626}
        .rs-pending{background:#fef3c7;color:#d97706}.rs-satisfactory{background:#dbeafe;color:#2563eb}.rs-inactive{background:#f1f5f9;color:#64748b}
        .rf{padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;color:#64748b}
        .empty{background:#fff;border-radius:12px;padding:60px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1);border:1px solid #e2e8f0}
        .empty h3{font-size:19px;font-weight:600;color:#0f172a;margin:0 0 8px}.empty p{color:#64748b;font-size:14px;margin:0}
        .elink{display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:11px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;transition:.3s}
        .elink:hover{background:#1d4ed8}
        .err{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:30px;text-align:center}
        .err h3{color:#dc2626;margin:12px 0 8px}.err p{color:#64748b;font-size:14px}
        .err button{margin-top:12px;padding:10px 22px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
        .fb{display:block;max-width:220px;color:#2563eb;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
        .sp{display:block;margin-top:4px;font-size:12px;font-weight:500}
        .grade-chip{display:inline-block;padding:5px 12px;border-radius:20px;font-weight:800;font-size:13px;letter-spacing:.3px}
        .gpa-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}
        .gpa-box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .gpa-label{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px}
        .gpa-value{font-size:28px;font-weight:800;margin:0}
        @media(max-width:768px){.page{padding:16px}.ttl{font-size:23px}.rsum,.gpa-row{grid-template-columns:1fr}.tabs{gap:6px;padding:5px}.tab{padding:12px 8px;font-size:12px;gap:6px}.tab svg{width:16px;height:16px}.sc{padding:20px}.scv{font-size:26px}.rt th,.rt td{padding:10px 12px;font-size:12px}.rf{font-size:12px}}
        @media(max-width:400px){.tab{flex-direction:column;font-size:11px}.tab .cnt{display:none}}
      `}</style>

      {/* HEADER */}
      <div className="hd">
        <div>
          <h1 className="ttl"><GraduationCap size={30} color="#2563eb" /> My Results</h1>
          <p className="sub">Course total = Quiz + Mid + Final + Assignment marks (raw sum, no division).</p>
        </div>
        <button className="rbtn" onClick={refresh} disabled={isRefreshing}>
          <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button className={`tab ${tab === 'grades' ? 'active' : ''}`} onClick={() => setTab('grades')}>
          <GraduationCap size={20} /><span>Final Grades</span><span className="cnt">{courseGrades.length}</span>
        </button>
        <button className={`tab ${tab === 'exams' ? 'active' : ''}`} onClick={() => setTab('exams')}>
          <Award size={20} /><span>Exams</span><span className="cnt">{exams.length}</span>
        </button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>
          <ClipboardList size={20} /><span>Assignments</span><span className="cnt">{assigns.length}</span>
        </button>
      </div>

      {/* ERROR */}
      {err && (
        <div className="err">
          <AlertCircle size={48} color="#dc2626" />
          <h3>Error Loading Results</h3>
          <p>{err}</p>
          <button onClick={refresh}><RefreshCw size={16} /> Try Again</button>
        </div>
      )}

      {/* ================= FINAL GRADES TAB ================= */}
      {tab === 'grades' && !err && (
        <>
          {courseGrades.length > 0 && (
            <>
              <div className="gpa-row">
                <div className="gpa-box">
                  <p className="gpa-label">Total Marks (All Courses)</p>
                  <p className="gpa-value" style={{ color: grandGrade.color }}>{grandTotal}</p>
                </div>
                <div className="gpa-box">
                  <p className="gpa-label">Overall Letter Grade</p>
                  <p className="gpa-value" style={{ color: grandGrade.color }}>{grandGrade.letter}</p>
                </div>
                <div className="gpa-box">
                  <p className="gpa-label">Courses</p>
                  <p className="gpa-value">{courseGrades.length}</p>
                </div>
              </div>

              <Table
                headers={['Course', 'Quiz', 'Mid', 'Assignment', 'Final', 'Total (Sum)', 'Letter Grade']}
                footer={
                  <>
                    <span>Course total = Quiz + Mid + Assignment + Final marks (sum only)</span>
                    <span>Grand Total: {grandTotal} • Grade: {grandGrade.letter}</span>
                  </>
                }
              >
                {courseGrades.map((c) => (
                  <tr key={c.course_id ?? c.course_code}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {c.course_title}
                      <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{c.course_code}</span>
                    </td>
                    <td>{c.quiz}</td>
                    <td>{c.mid}</td>
                    <td>{c.assignment}</td>
                    <td>{c.final}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.total}</td>
                    <td>
                      <span className="grade-chip" style={{ background: `${c.color}20`, color: c.color }}>
                        {c.letter}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* ============ BOTTOM TOTAL ROW ============ */}
                <tr className="total-row">
                  <td>TOTAL (All Courses)</td>
                  <td>{courseGrades.reduce((s, c) => s + c.quiz, 0)}</td>
                  <td>{courseGrades.reduce((s, c) => s + c.mid, 0)}</td>
                  <td>{courseGrades.reduce((s, c) => s + c.assignment, 0)}</td>
                  <td>{courseGrades.reduce((s, c) => s + c.final, 0)}</td>
                  <td>{grandTotal}</td>
                  <td>
                    <span className="grade-chip" style={{ background: `${grandGrade.color}25`, color: grandGrade.color }}>
                      {grandGrade.letter}
                    </span>
                  </td>
                </tr>
              </Table>
            </>
          )}

          {courseGrades.length === 0 && (
            <div className="empty">
              <GraduationCap size={64} color="#94a3b8" style={{ margin: '0 auto 18px' }} />
              <h3>No Final Grades Yet</h3>
              <p>Complete quizzes, mid, assignments and final exams to see your course grades.</p>
              <Link to="/exams" className="elink"><BookOpen size={18} /> Go to Exams</Link>
            </div>
          )}
        </>
      )}

      {/* ================= EXAMS TAB ================= */}
      {tab === 'exams' && !err && (
        <>
          {exams.length > 0 && (
            <Summary cards={[
              { color: 'blue', label: 'Average Score', value: `${examAvg}%`, icon: <TrendingUp size={40} className="sci" /> },
              { color: 'green', label: 'Exams Passed', value: `${examPassed} / ${exams.length}`, icon: <CheckCircle size={40} className="sci" /> },
              { color: 'purple', label: 'Total Exams', value: exams.length, icon: <FileText size={40} className="sci" /> },
            ]} />
          )}

          {exams.length === 0 ? (
            <div className="empty">
              <Award size={64} color="#94a3b8" style={{ margin: '0 auto 18px' }} />
              <h3>No Exam Results Available</h3>
              <p>Complete your exams to see your examination results here.</p>
              <Link to="/exams" className="elink"><BookOpen size={18} /> Go to Exams</Link>
            </div>
          ) : (
            <Table
              headers={['Exam Title', 'Course', 'Type', 'Score', 'Percentage', 'Status', 'Date']}
              footer={
                <>
                  <span>Showing {exams.length} exam results</span>
                  <span>Passed: {examPassed} | Failed: {examFailed}</span>
                </>
              }
            >
              {exams.map((r, i) => {
                const total = r.exam?.total_marks ?? r.total_marks ?? 0;
                const score = r.score ?? 0;
                const percentage = r.percentage ?? 0;
                const examType = r.exam?.exam_type || r.exam_type || '—';
                return (
                  <tr key={r.id || i}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {r.exam_title || r.exam?.title || 'Unknown Exam'}
                    </td>
                    <td>{r.exam?.course_title || r.course_title || r.exam?.course?.title || '—'}</td>
                    <td>{examType}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{score} / {total}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{percentage}%</td>
                    <td>{examBadge(r.passed)}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}

      {/* ================= ASSIGNMENTS TAB ================= */}
      {tab === 'assignments' && !err && (
        <>
          {assigns.length > 0 && (
            <Summary cards={[
              { color: 'blue', label: 'Average Assignment Score', value: `${assignAvg}%`, icon: <TrendingUp size={40} className="sci" /> },
              { color: 'green', label: 'Graded Assignments', value: gradedA, icon: <CheckCircle size={40} className="sci" /> },
              { color: 'orange', label: 'Pending Grades', value: pendingA, icon: <Clock size={40} className="sci" /> },
            ]} />
          )}

          {assigns.length === 0 ? (
            <div className="empty">
              <ClipboardList size={64} color="#94a3b8" style={{ margin: '0 auto 18px' }} />
              <h3>No Assignment Results Available</h3>
              <p>Submit your assignments to see your grades and teacher feedback here.</p>
              <Link to="/courses" className="elink"><BookOpen size={18} /> Browse Courses</Link>
            </div>
          ) : (
            <Table
              headers={['Assignment', 'Course', 'Marks', 'Status', 'Submitted', 'Feedback']}
              footer={
                <>
                  <span>Showing {assigns.length} assignments</span>
                  <span>Submitted: {submittedA} | Graded: {gradedA} | Pending: {pendingA}</span>
                </>
              }
            >
              {assigns.map((a, i) => {
                const total = Number(a.total_marks);
                const obtained = Number(a.marks_obtained);
                const hasGrade = a.marks_obtained != null;
                const p = hasGrade && total > 0 ? (obtained / total) * 100 : null;
                return (
                  <tr key={a.id || i}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.title || 'Unknown Assignment'}</td>
                    <td>{a.course_title || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {hasGrade ? (
                        <>
                          {a.marks_obtained} / {a.total_marks}
                          <span className="sp" style={{ color: p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626' }}>
                            {p.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Not graded</span>
                      )}
                    </td>
                    <td>{assignBadge(a)}</td>
                    <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>
                      {a.feedback ? (
                        <span className="fb"><MessageSquare size={13} style={{ display: 'inline', marginRight: 5 }} />{a.feedback}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>No feedback</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
    </div>
  );
};

export default ExamResults;