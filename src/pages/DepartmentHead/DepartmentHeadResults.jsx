import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const DepartmentHeadResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState(null);
  const [sendingStudent, setSendingStudent] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [sendingSelected, setSendingSelected] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/dept-head/results/');
      setResults(data.results || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load submitted results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const yearGroups = useMemo(() => {
    const groups = new Map();
    results.forEach((result) => {
      const year = Number(result.year) || 0;
      if (!groups.has(year)) groups.set(year, new Map());
      const students = groups.get(year);
      if (!students.has(result.student_id)) {
        students.set(result.student_id, {
          student_id: result.student_id,
          student_name: result.student_name,
          student_number: result.student_number,
          grades: [],
        });
      }
      students.get(result.student_id).grades.push(result);
    });
    return [...groups.entries()]
      .sort(([yearA], [yearB]) => yearA - yearB)
      .map(([year, students]) => [year, [...students.values()]]);
  }, [results]);

  const sendStudentResults = async (student) => {
    setSendingStudent(student.student_id);
    try {
      const { data } = await api.post('/auth/dept-head/send-results/', {
        student_id: student.student_id,
      });
      toast.success(data.message || 'Results sent to the Registrar.');
      await fetchResults();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send results to the Registrar.');
    } finally {
      setSendingStudent(null);
    }
  };

  const eligibleStudentIds = yearGroups.flatMap(([, students]) => (
    students
      .filter((student) => student.grades.some((grade) => !grade.sent_to_registrar && grade.status === 'COMPLETED'))
      .map((student) => student.student_id)
  ));
  const allEligibleSelected = eligibleStudentIds.length > 0
    && eligibleStudentIds.every((id) => selectedStudentIds.includes(id));

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((current) => (
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    ));
  };

  const sendSelectedStudents = async () => {
    if (!selectedStudentIds.length) return;
    setSendingSelected(true);
    try {
      const { data } = await api.post('/auth/dept-head/send-results/', {
        student_ids: selectedStudentIds,
      });
      const sentIds = new Set(data.sent_student_ids || []);
      setResults((current) => current.map((result) => (
        sentIds.has(result.student_id) ? { ...result, sent_to_registrar: true } : result
      )));
      setSelectedStudentIds((current) => current.filter((id) => !sentIds.has(id)));
      toast.success(data.message || 'Selected results sent to the Registrar.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send selected results.');
    } finally {
      setSendingSelected(false);
    }
  };

  return (
    <section style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Submitted Student Results</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Review read-only grades by academic year, then forward them to the Registrar.</p>
        </div>
        <button type="button" onClick={fetchResults} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: 0, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', cursor: loading ? 'wait' : 'pointer' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <button type="button" onClick={() => setSelectedStudentIds(allEligibleSelected ? [] : eligibleStudentIds)} disabled={!eligibleStudentIds.length || sendingSelected} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', color: '#334155', cursor: 'pointer' }}>
          {allEligibleSelected ? 'Deselect all eligible' : 'Select all eligible students'}
        </button>
        <button type="button" onClick={sendSelectedStudents} disabled={!selectedStudentIds.length || sendingSelected} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: 0, borderRadius: 7, background: '#2563eb', color: '#fff', cursor: 'pointer', opacity: !selectedStudentIds.length ? 0.55 : 1 }}>
          <Send size={15} /> {sendingSelected ? 'Sending…' : `Send selected (${selectedStudentIds.length}) to Registrar`}
        </button>
        {selectedStudentIds.length > 0 && <button type="button" onClick={() => setSelectedStudentIds([])} disabled={sendingSelected} style={{ padding: '8px 12px', border: 0, borderRadius: 7, background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>Clear selection</button>}
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading submitted results…</p>
      ) : yearGroups.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 10, background: '#fff', color: '#64748b' }}>No teacher-submitted results are available yet.</div>
      ) : yearGroups.map(([year, students]) => (
        <div key={year} style={{ marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
          <button type="button" onClick={() => setExpandedYear(expandedYear === year ? null : year)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 16, border: 0, background: '#f8fafc', textAlign: 'left', color: '#0f172a', cursor: 'pointer', fontWeight: 600 }}>
            {expandedYear === year ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Year {year || 'Unspecified'}
            <span style={{ marginLeft: 'auto', color: '#64748b', fontWeight: 400 }}>{students.length} students</span>
          </button>
          {expandedYear === year && (
            <div style={{ padding: 16 }}>
              {students.map((student) => {
                const canSend = student.grades.some((grade) => !grade.sent_to_registrar && grade.status === 'COMPLETED');
                return (
                  <div key={student.student_id} style={{ marginBottom: 18, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, background: '#f8fafc', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                        <input
                          type="checkbox"
                          aria-label={`Select results for ${student.student_name}`}
                          checked={selectedStudentIds.includes(student.student_id)}
                          onChange={() => toggleStudent(student.student_id)}
                          disabled={!canSend || sendingSelected}
                        />
                        <strong>{student.student_name} <span style={{ color: '#64748b', fontWeight: 400 }}>({student.student_number || 'No student ID'})</span></strong>
                      </label>
                      {canSend ? (
                        <button type="button" onClick={() => sendStudentResults(student)} disabled={sendingStudent === student.student_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: 0, borderRadius: 7, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
                          <Send size={15} /> {sendingStudent === student.student_id ? 'Sending…' : 'Send to Registrar'}
                        </button>
                      ) : <span style={{ color: '#16a34a', fontSize: 13 }}>Sent to Registrar</span>}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                        <thead><tr style={{ textAlign: 'left', color: '#64748b', fontSize: 12 }}>
                          {['Course', 'Marks', 'Percentage', 'Grade', 'Forwarding'].map((heading) => <th key={heading} style={{ padding: '10px 12px' }}>{heading}</th>)}
                        </tr></thead>
                        <tbody>{student.grades.map((grade) => (
                          <tr key={grade.enrollment_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px' }}><strong>{grade.course_code}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{grade.course_title}</div></td>
                            <td style={{ padding: '10px 12px' }}>{Number(grade.marks_obtained || 0).toFixed(1)} / {Number(grade.marks_possible || 0).toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{Number(grade.percentage || 0).toFixed(1)}%</td>
                            <td style={{ padding: '10px 12px' }}>{grade.grade || 'NON'}</td>
                            <td style={{ padding: '10px 12px', color: grade.sent_to_registrar ? '#16a34a' : '#d97706' }}>{grade.sent_to_registrar ? 'Sent' : 'Awaiting Registrar'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default DepartmentHeadResults;
