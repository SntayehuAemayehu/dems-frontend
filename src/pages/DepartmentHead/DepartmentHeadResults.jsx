
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CheckCircle, ChevronDown, ChevronRight, RefreshCw, Send, Users, X } from 'lucide-react';
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

  const totalStudents = yearGroups.reduce((total, [, students]) => total + students.length, 0);
  const totalCourses = new Set(results.map((result) => result.course_id)).size;
  const pendingForward = results.filter(
    (result) => !result.sent_to_registrar && result.status === 'COMPLETED',
  ).length;

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
    <section className="dept-results-section" style={{ maxWidth: 1500, margin: '0 auto', padding: 24 }}>
      <style>{`
        .dept-result-row:hover { background: #f8fafc; }
        .dept-year-toggle:hover { background: #eef4ff !important; }
        .dept-results-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, .65);
        }
        .dept-results-modal {
          width: 100%;
          max-width: 1400px;
          max-height: 90vh;
          overflow: auto;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
        }
        @media (max-width: 700px) {
          .dept-results-section { padding: 14px !important; }
          .dept-results-modal-overlay { padding: 8px; }
          .dept-results-modal { max-height: 95vh; }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Students with results', value: totalStudents, icon: <Users size={19} />, color: '#4f46e5' },
          { label: 'Courses represented', value: totalCourses, icon: <BookOpen size={19} />, color: '#0891b2' },
          { label: 'Ready to forward', value: pendingForward, icon: <Send size={19} />, color: '#ea580c' },
        ].map((metric) => (
          <div key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', boxShadow: '0 6px 20px rgba(15,23,42,.04)' }}>
            <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: `${metric.color}14`, color: metric.color }}>
              {metric.icon}
            </span>
            <span>
              <strong style={{ display: 'block', fontSize: 21, color: '#0f172a' }}>{metric.value}</strong>
              <small style={{ color: '#64748b' }}>{metric.label}</small>
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 32, borderRadius: 16, background: '#fff', color: '#64748b', textAlign: 'center' }}>Loading submitted results…</div>
      ) : yearGroups.length === 0 ? (
        <div style={{ padding: 34, border: '1px dashed #cbd5e1', borderRadius: 18, background: '#fff', color: '#64748b', textAlign: 'center' }}>
          <BookOpen size={30} style={{ color: '#94a3b8', marginBottom: 8 }} />
          <div style={{ color: '#334155', fontWeight: 700 }}>No results submitted yet</div>
          <div style={{ marginTop: 4 }}>Teacher-submitted grades will appear here, grouped by academic year.</div>
        </div>
      ) : yearGroups.map(([year, students]) => {
        const courseColumns = [...new Map(
          students.flatMap((student) => student.grades.map((grade) => [
            grade.course_id,
            { course_id: grade.course_id, course_code: grade.course_code, course_title: grade.course_title },
          ]))
        ).values()];

        return (
          <div key={year} style={{ marginBottom: 13, border: '1px solid #e2e8f0', borderRadius: 17, background: '#fff', overflow: 'hidden', boxShadow: '0 7px 22px rgba(15,23,42,.04)' }}>
            <button type="button" className="dept-year-toggle" onClick={() => setExpandedYear(year)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 17, border: 0, background: '#f8fafc', textAlign: 'left', color: '#0f172a', cursor: 'pointer', fontWeight: 700, transition: 'background .18s ease' }}>
              <ChevronRight size={18} />
              <span>Year {year || 'Unspecified'}</span>
              <span style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 999, color: '#4338ca', background: '#e0e7ff', fontSize: 12, fontWeight: 700 }}>
                {students.length} students · {courseColumns.length} courses
              </span>
            </button>
          </div>
        );
      })}

      {expandedYear !== null && yearGroups
        .filter(([year]) => year === expandedYear)
        .map(([year, students]) => {
          const courseColumns = [...new Map(
            students.flatMap((student) => student.grades.map((grade) => [
              grade.course_id,
              { course_id: grade.course_id, course_code: grade.course_code, course_title: grade.course_title },
            ]))
          ).values()];

          return (
            <div key={year} className="dept-results-modal-overlay" onClick={() => setExpandedYear(null)}>
              <div className="dept-results-modal" onClick={(event) => event.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div>
                    <strong style={{ fontSize: 20, color: '#0f172a' }}>Year {year || 'Unspecified'} Results</strong>
                    <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>{students.length} students</div>
                  </div>
                  <button type="button" onClick={() => setExpandedYear(null)} style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, border: 0, borderRadius: 9, background: '#e2e8f0', color: '#334155', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', margin: 15, padding: 13, border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', boxShadow: '0 4px 14px rgba(15,23,42,.04)' }}>
                  <button type="button" onClick={() => setSelectedStudentIds(allEligibleSelected ? [] : eligibleStudentIds)} disabled={!eligibleStudentIds.length || sendingSelected} style={{ padding: '9px 13px', border: '1px solid #cbd5e1', borderRadius: 9, background: '#fff', color: '#334155', cursor: 'pointer' }}>
                    {allEligibleSelected ? 'Deselect all eligible' : 'Select all eligible students'}
                  </button>
                  <button type="button" onClick={sendSelectedStudents} disabled={!selectedStudentIds.length || sendingSelected} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', border: 0, borderRadius: 9, background: 'linear-gradient(110deg, #4f46e5, #2563eb)', color: '#fff', cursor: 'pointer', opacity: !selectedStudentIds.length ? 0.55 : 1 }}>
                    <Send size={15} /> {sendingSelected ? 'Sending…' : `Send selected (${selectedStudentIds.length}) to Registrar`}
                  </button>
                  {selectedStudentIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedStudentIds([])} disabled={sendingSelected} style={{ padding: '9px 12px', border: 0, borderRadius: 9, background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>
                      Clear selection
                    </button>
                  )}
                  <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13 }}>{selectedStudentIds.length} selected</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 590 + courseColumns.length * 190 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                      <tr style={{ textAlign: 'left', color: '#64748b', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 14px', minWidth: 210 }}>Student</th>
                        {courseColumns.map((course) => (
                          <th key={course.course_id} style={{ padding: '12px 14px', minWidth: 190 }}>
                            <strong style={{ color: '#334155' }}>{course.course_code}</strong>
                            <div style={{ marginTop: 3, fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>{course.course_title}</div>
                            <div style={{ marginTop: 5, color: '#4338ca', fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>Total and Grade</div>
                          </th>
                        ))}
                        <th style={{ padding: '12px 14px', minWidth: 170 }}>Forwarding</th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.map((student) => {
                        const canSend = student.grades.some((grade) => !grade.sent_to_registrar && grade.status === 'COMPLETED');
                        const gradesByCourse = new Map(student.grades.map((grade) => [grade.course_id, grade]));

                        return (
                          <tr key={student.student_id} className="dept-result-row" style={{ borderTop: '1px solid #eef2f7', transition: 'background .15s ease' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                                <input
                                  type="checkbox"
                                  aria-label={`Select results for ${student.student_name}`}
                                  checked={selectedStudentIds.includes(student.student_id)}
                                  onChange={() => toggleStudent(student.student_id)}
                                  disabled={!canSend || sendingSelected}
                                />
                                <strong>
                                  {student.student_name}
                                  <span style={{ display: 'block', color: '#64748b', fontWeight: 400 }}>
                                    ({student.student_number || 'No student ID'})
                                  </span>
                                </strong>
                              </label>
                            </td>

                            {courseColumns.map((course) => {
                              const grade = gradesByCourse.get(course.course_id);
                              return (
                                <td key={course.course_id} style={{ padding: '12px 14px' }}>
                                  {grade ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px', fontSize: 13 }}>
                                      <div>
                                        <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Total</span>
                                        <strong style={{ color: '#0f172a', whiteSpace: 'nowrap' }}>
                                          {Number(grade.marks_obtained || 0).toFixed(1)} / {Number(grade.marks_possible || 0).toFixed(1)}
                                        </strong>
                                      </div>
                                      <div>
                                        <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Grade</span>
                                        <strong style={{ color: '#4338ca', whiteSpace: 'nowrap' }}>
                                          {Number(grade.percentage || 0).toFixed(1)}% · {grade.grade || 'NON'}
                                        </strong>
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>—</span>
                                  )}
                                </td>
                              );
                            })}

                            <td style={{ padding: '12px 14px' }}>
                              {canSend ? (
                                <button type="button" onClick={() => sendStudentResults(student)} disabled={sendingStudent === student.student_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: 0, borderRadius: 9, background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
                                  <Send size={15} /> {sendingStudent === student.student_id ? 'Sending…' : 'Send to Registrar'}
                                </button>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderRadius: 999, color: '#047857', background: '#d1fae5', fontSize: 12, fontWeight: 600 }}>
                                  <CheckCircle size={14} /> Sent
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
    </section>
  );
};

export default DepartmentHeadResults;
