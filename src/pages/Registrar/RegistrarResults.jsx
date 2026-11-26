
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Building2, ChevronDown, ChevronRight, RefreshCw, Send, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/api';

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '9px 13px',
  border: 0,
  borderRadius: 8,
  cursor: 'pointer',
};

const RegistrarResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState([]);
  const [issuingEnrollment, setIssuingEnrollment] = useState(null);
  const [issuingSelected, setIssuingSelected] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/registrar/sent-results/');
      setResults(data.results || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load results sent by departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const departmentGroups = useMemo(() => {
    const groups = new Map();
    results.forEach((result) => {
      const name = result.department || 'Unassigned Department';
      if (!groups.has(name)) groups.set(name, new Map());
      const years = groups.get(name);
      const year = Number(result.year) || 0;
      if (!years.has(year)) years.set(year, new Map());
      const students = years.get(year);
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
    return [...groups.entries()].sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
  }, [results]);

  const currentDepartment = departmentGroups.find(([name]) => name === selectedDepartment);
  const yearGroups = currentDepartment
    ? [...currentDepartment[1].entries()].sort(([yearA], [yearB]) => yearA - yearB)
    : [];
  const currentYear = yearGroups.find(([year]) => year === selectedYear);
  const courseColumns = currentYear
    ? [...new Map(
      [...currentYear[1].values()].flatMap((student) => student.grades.map((grade) => [
        grade.course_id,
        { course_id: grade.course_id, course_code: grade.course_code, course_title: grade.course_title },
      ]))
    ).values()]
    : [];
  const eligibleEnrollmentIds = currentYear
    ? [...currentYear[1].values()]
      .flatMap((student) => student.grades)
      .filter((grade) => !grade.certificate_issued)
      .map((grade) => grade.enrollment_id)
    : [];
  const totalStudents = new Set(results.map((result) => result.student_id)).size;
  const totalCourses = new Set(results.map((result) => result.course_id)).size;
  const certificatesPending = results.filter((result) => !result.certificate_issued).length;
  const allEligibleSelected = eligibleEnrollmentIds.length > 0
    && eligibleEnrollmentIds.every((id) => selectedEnrollmentIds.includes(id));

  const toggleEnrollment = (enrollmentId) => {
    setSelectedEnrollmentIds((current) => (
      current.includes(enrollmentId)
        ? current.filter((id) => id !== enrollmentId)
        : [...current, enrollmentId]
    ));
  };

  const generateCertificate = async (result) => {
    setIssuingEnrollment(result.enrollment_id);
    try {
      await api.post(`/certificates/enrollments/${result.enrollment_id}/generate/`);
      toast.success(`Certificate generated for ${result.student_name}.`);
      setResults((current) => current.map((item) => (
        item.enrollment_id === result.enrollment_id
          ? { ...item, certificate_issued: true }
          : item
      )));
      setSelectedEnrollmentIds((current) => current.filter((id) => id !== result.enrollment_id));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not generate the certificate.');
    } finally {
      setIssuingEnrollment(null);
    }
  };

  const generateSelectedCertificates = async () => {
    if (!selectedEnrollmentIds.length) return;
    setIssuingSelected(true);
    const selectedIds = [...selectedEnrollmentIds];
    const outcomes = await Promise.allSettled(selectedIds.map((enrollmentId) => (
      api.post(`/certificates/enrollments/${enrollmentId}/generate/`)
    )));
    const successfulIds = selectedIds.filter((_, index) => outcomes[index].status === 'fulfilled');
    const failedCount = outcomes.length - successfulIds.length;
    const successfulIdSet = new Set(successfulIds);
    setResults((current) => current.map((result) => (
      successfulIdSet.has(result.enrollment_id)
        ? { ...result, certificate_issued: true }
        : result
    )));
    setSelectedEnrollmentIds((current) => current.filter((id) => !successfulIdSet.has(id)));
    setIssuingSelected(false);
    if (failedCount) {
      toast.error(`${successfulIds.length} certificate(s) generated; ${failedCount} failed. Select failed entries and retry.`);
    } else {
      toast.success(`${successfulIds.length} certificate(s) generated and published to students.`);
    }
  };

  return (
    <main className="registrar-results-main" style={{ maxWidth: 1500, margin: '0 auto', padding: 24 }}>
      <style>{`
        .registrar-result-row:hover { background: #f8fafc; }
        .registrar-department-card:hover { transform: translateY(-3px); box-shadow: 0 15px 28px rgba(15,23,42,.1); }

        .registrar-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, .65);
          backdrop-filter: blur(5px);
        }

        .registrar-modal {
          width: 100%;
          max-width: 1400px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 25px 70px rgba(0,0,0,.25);
          animation: registrarModalIn .2s ease-out;
        }

        .registrar-modal-body {
          overflow: auto;
          padding: 20px;
        }

        .registrar-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 24px;
          color: #fff;
          background: linear-gradient(120deg, #0f172a 0%, #0f766e 65%, #059669 100%);
        }

        .registrar-modal-close {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 10px;
          background: rgba(255,255,255,.13);
          color: #fff;
          cursor: pointer;
        }

        @keyframes registrarModalIn {
          from { opacity: 0; transform: translateY(12px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 700px) {
          .registrar-results-main { padding: 14px !important; }
          .registrar-modal-overlay { padding: 8px; }
          .registrar-modal { max-height: 96vh; }
          .registrar-modal-body { padding: 12px; }
          .registrar-modal-header { padding: 15px; }
        }
      `}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 22, flexWrap: 'wrap', padding: 28, borderRadius: 22, color: '#fff', background: 'linear-gradient(120deg, #0f172a 0%, #0f766e 52%, #059669 100%)', boxShadow: '0 20px 45px rgba(5,150,105,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'rgba(255,255,255,.16)' }}><Award size={28} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 27 }}>Academic Results</h1>
            <p style={{ margin: '6px 0 0', color: '#d1fae5' }}>Department courses, student totals, and certificate publishing.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => navigate('/registrar/dashboard')} style={{ ...buttonStyle, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.13)', color: '#fff' }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button type="button" onClick={fetchResults} disabled={loading} style={{ ...buttonStyle, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.13)', color: '#fff' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Departments', value: departmentGroups.length, icon: <Building2 size={19} />, color: '#0f766e' },
          { label: 'Students with results', value: totalStudents, icon: <Users size={19} />, color: '#2563eb' },
          { label: 'Courses represented', value: totalCourses, icon: <BookOpen size={19} />, color: '#7c3aed' },
          { label: 'Certificates to issue', value: certificatesPending, icon: <Award size={19} />, color: '#ea580c' },
        ].map((metric) => (
          <div key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', boxShadow: '0 6px 20px rgba(15,23,42,.04)' }}>
            <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: `${metric.color}14`, color: metric.color }}>{metric.icon}</span>
            <span><strong style={{ display: 'block', fontSize: 21, color: '#0f172a' }}>{metric.value}</strong><small style={{ color: '#64748b' }}>{metric.label}</small></span>
          </div>
        ))}
      </section>

      {loading ? <p style={{ color: '#64748b' }}>Loading results…</p> : departmentGroups.length === 0 ? (
        <section style={{ padding: 36, border: '1px dashed #cbd5e1', borderRadius: 18, background: '#fff', color: '#64748b', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: '#94a3b8', marginBottom: 8 }} />
          <div style={{ color: '#334155', fontWeight: 700 }}>No results forwarded yet</div>
          <div style={{ marginTop: 4 }}>Department Head submissions will appear here for Registrar review.</div>
        </section>
      ) : (
        <section style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff', boxShadow: '0 8px 26px rgba(15,23,42,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 13 }}>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>Department results</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Choose a department, then a year to review all students and course totals.</p>
            </div>
            {selectedDepartment && <span style={{ padding: '6px 10px', borderRadius: 999, color: '#047857', background: '#d1fae5', fontSize: 12, fontWeight: 700 }}>{selectedDepartment}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {departmentGroups.map(([name, years]) => (
              <button
                key={name}
                type="button"
                className="registrar-department-card"
                onClick={() => {
                  setSelectedDepartment(name);
                  setSelectedYear(null);
                  setSelectedEnrollmentIds([]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 14, border: `1px solid ${selectedDepartment === name ? '#059669' : '#e2e8f0'}`, borderRadius: 12, background: selectedDepartment === name ? '#ecfdf5' : '#fff', textAlign: 'left', color: '#0f172a', cursor: 'pointer', transition: 'all .18s ease' }}
              >
                <span style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 10, color: '#047857', background: '#d1fae5' }}><Building2 size={17} /></span>
                <strong style={{ fontSize: 13 }}>{name}</strong>
                <span style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 999, color: '#475569', background: '#f1f5f9', fontSize: 12 }}>{[...years.values()].reduce((total, students) => total + students.size, 0)}</span>
              </button>
            ))}
          </div>

          {selectedDepartment && currentDepartment && (
            <div style={{ marginTop: 20, padding: 17, border: '1px solid #dbeafe', borderRadius: 14, background: 'linear-gradient(120deg, #f8fafc, #eff6ff)' }}>
              <h3 style={{ margin: '0 0 11px', color: '#334155', fontSize: 15 }}>{selectedDepartment} · Select academic year</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {yearGroups.map(([year, students]) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year);
                      setSelectedEnrollmentIds([]);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', border: `1px solid ${selectedYear === year ? '#059669' : '#cbd5e1'}`, borderRadius: 10, background: selectedYear === year ? '#d1fae5' : '#fff', color: selectedYear === year ? '#047857' : '#334155', cursor: 'pointer', boxShadow: selectedYear === year ? '0 5px 12px rgba(5,150,105,.12)' : 'none' }}
                  >
                    <ChevronRight size={16} />
                    Year {year || 'Unspecified'} <span style={{ color: '#64748b' }}>({students.size})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {currentYear && (
        <div
          className="registrar-modal-overlay"
          onClick={() => {
            setSelectedYear(null);
            setSelectedEnrollmentIds([]);
          }}
        >
          <section
            className="registrar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registrar-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="registrar-modal-header">
              <div>
                <h2 id="registrar-modal-title" style={{ margin: 0, fontSize: 21 }}>
                  Student Grades
                </h2>
                <p style={{ margin: '5px 0 0', color: '#d1fae5', fontSize: 13 }}>
                  {selectedDepartment} · Year {selectedYear || 'Unspecified'} · {courseColumns.length} courses
                </p>
              </div>
              <button
                type="button"
                className="registrar-modal-close"
                aria-label="Close results"
                onClick={() => {
                  setSelectedYear(null);
                  setSelectedEnrollmentIds([]);
                }}
              >
                <X size={20} />
              </button>
            </header>

            <div className="registrar-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ margin: '0 auto 0 0' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Student grades</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                    {selectedDepartment} · Year {selectedYear || 'Unspecified'} · {courseColumns.length} courses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEnrollmentIds(allEligibleSelected ? [] : eligibleEnrollmentIds)}
                  disabled={!eligibleEnrollmentIds.length || issuingSelected}
                  style={{ ...buttonStyle, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}
                >
                  {allEligibleSelected ? 'Deselect all eligible' : 'Select all eligible'}
                </button>
                <button
                  type="button"
                  onClick={generateSelectedCertificates}
                  disabled={!selectedEnrollmentIds.length || issuingSelected}
                  style={{ ...buttonStyle, background: 'linear-gradient(110deg, #059669, #0f766e)', color: '#fff', opacity: !selectedEnrollmentIds.length ? 0.55 : 1 }}
                >
                  <Send size={15} /> {issuingSelected ? 'Generating…' : `Generate selected (${selectedEnrollmentIds.length})`}
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 14 }}>
                <table style={{ width: '100%', minWidth: 390 + courseColumns.length * 230, borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                    <tr style={{ textAlign: 'left', color: '#64748b', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px', minWidth: 190 }}>Student</th>
                      <th style={{ padding: '12px 14px', minWidth: 130 }}>Total marks</th>
                      {courseColumns.map((course) => (
                        <th key={course.course_id} style={{ padding: '12px 14px', minWidth: 210 }}>
                          <strong style={{ color: '#334155' }}>{course.course_code}</strong>
                          <div style={{ marginTop: 3, fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>{course.course_title}</div>
                          <div style={{ marginTop: 5, color: '#047857', fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>Course total</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentYear[1].values()].map((student) => {
                      const gradesByCourse = new Map(student.grades.map((grade) => [grade.course_id, grade]));
                      const totalMarksObtained = student.grades.reduce((sum, grade) => sum + Number(grade.total_marks_obtained || 0), 0);
                      const totalMarksPossible = student.grades.reduce((sum, grade) => sum + Number(grade.total_marks_possible || 0), 0);
                      return (
                        <tr key={student.student_id} className="registrar-result-row" style={{ borderTop: '1px solid #eef2f7', color: '#0f172a', transition: 'background .15s ease' }}>
                          <td style={{ padding: '12px 14px', color: '#0f172a' }}>
                            <strong>{student.student_name}</strong>
                            <div style={{ color: '#64748b', fontWeight: 400 }}>({student.student_number || 'No student ID'})</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {totalMarksPossible > 0 ? `${totalMarksObtained.toFixed(1)} / ${totalMarksPossible.toFixed(1)}` : '—'}
                          </td>
                          {courseColumns.map((course) => {
                            const grade = gradesByCourse.get(course.course_id);
                            return (
                              <td key={course.course_id} style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                                {grade ? (
                                  <>
                                    <strong>{Number(grade.total_marks_obtained || 0).toFixed(1)} / {Number(grade.total_marks_possible || 0).toFixed(1)}</strong>
                                    <div style={{ display: 'inline-flex', marginTop: 5, padding: '3px 7px', borderRadius: 999, color: '#047857', background: '#d1fae5', fontSize: 11, fontWeight: 600 }}>{Number(grade.percentage || 0).toFixed(1)}% · {grade.grade || 'NON'}</div>
                                    <div style={{ marginTop: 8 }}>
                                      {!grade.certificate_issued && (
                                        <input
                                          type="checkbox"
                                          aria-label={`Select certificate for ${student.student_name} - ${grade.course_title}`}
                                          checked={selectedEnrollmentIds.includes(grade.enrollment_id)}
                                          onChange={() => toggleEnrollment(grade.enrollment_id)}
                                          disabled={issuingSelected}
                                        />
                                      )}
                                      {grade.certificate_issued ? <span style={{ color: '#16a34a', fontSize: 12 }}>Certificate generated</span> : (
                                        <button type="button" onClick={() => generateCertificate(grade)} disabled={issuingEnrollment === grade.enrollment_id || issuingSelected} style={{ ...buttonStyle, marginLeft: 6, padding: '7px 10px', background: '#2563eb', color: '#fff' }}>
                                          <Award size={14} /> {issuingEnrollment === grade.enrollment_id ? 'Generating…' : 'Generate'}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                ) : <span style={{ color: '#94a3b8' }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default RegistrarResults;
