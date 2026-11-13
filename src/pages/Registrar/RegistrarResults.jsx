import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, ChevronDown, ChevronRight, RefreshCw, Send } from 'lucide-react';
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
  const eligibleEnrollmentIds = currentYear
    ? [...currentYear[1].values()]
      .flatMap((student) => student.grades)
      .filter((grade) => !grade.certificate_issued)
      .map((grade) => grade.enrollment_id)
    : [];
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
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Registrar Results & Certificates</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Review read-only grades by department and year, then issue student certificates.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => navigate('/registrar/dashboard')} style={{ ...buttonStyle, background: '#f1f5f9', color: '#334155' }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button type="button" onClick={fetchResults} disabled={loading} style={{ ...buttonStyle, background: '#eff6ff', color: '#1d4ed8' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {loading ? <p style={{ color: '#64748b' }}>Loading results…</p> : departmentGroups.length === 0 ? (
        <section style={{ padding: 24, borderRadius: 10, background: '#fff', color: '#64748b' }}>No department results have been forwarded yet.</section>
      ) : (
        <section style={{ padding: 20, borderRadius: 12, background: '#fff', boxShadow: '0 1px 3px rgba(15, 23, 42, .1)' }}>
          <h2 style={{ margin: '0 0 12px', color: '#0f172a' }}>Departments</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {departmentGroups.map(([name, years]) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSelectedDepartment(name);
                  setSelectedYear(null);
                  setSelectedEnrollmentIds([]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 13, border: `1px solid ${selectedDepartment === name ? '#2563eb' : '#e2e8f0'}`, borderRadius: 8, background: selectedDepartment === name ? '#eff6ff' : '#fff', textAlign: 'left', cursor: 'pointer' }}
              >
                <ChevronRight size={17} /> <strong>{name}</strong>
                <span style={{ marginLeft: 'auto', color: '#64748b' }}>{[...years.values()].reduce((total, students) => total + students.size, 0)}</span>
              </button>
            ))}
          </div>

          {selectedDepartment && currentDepartment && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px', color: '#334155' }}>{selectedDepartment} — Select Year</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {yearGroups.map(([year, students]) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(selectedYear === year ? null : year);
                      setSelectedEnrollmentIds([]);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', border: `1px solid ${selectedYear === year ? '#2563eb' : '#cbd5e1'}`, borderRadius: 8, background: selectedYear === year ? '#eff6ff' : '#fff', color: '#334155', cursor: 'pointer' }}
                  >
                    {selectedYear === year ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Year {year || 'Unspecified'} <span style={{ color: '#64748b' }}>({students.size})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentYear && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <h3 style={{ margin: '0 auto 0 0', color: '#334155' }}>{selectedDepartment} — Year {selectedYear || 'Unspecified'} Student Grades</h3>
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
                  style={{ ...buttonStyle, background: '#2563eb', color: '#fff', opacity: !selectedEnrollmentIds.length ? 0.55 : 1 }}
                >
                  <Send size={15} /> {issuingSelected ? 'Generating…' : `Generate selected (${selectedEnrollmentIds.length})`}
                </button>
              </div>
              {[...currentYear[1].values()].map((student) => (
                <div key={student.student_id} style={{ marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: 12, background: '#f8fafc', fontWeight: 600, color: '#0f172a' }}>
                    {student.student_name} <span style={{ color: '#64748b', fontWeight: 400 }}>({student.student_number || 'No student ID'})</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 830, borderCollapse: 'collapse' }}>
                      <thead><tr style={{ textAlign: 'left', color: '#64748b', fontSize: 12 }}>
                        {['Select', 'Course', 'Marks', 'Percentage', 'Grade', 'Certificate'].map((heading) => <th key={heading} style={{ padding: '10px 12px' }}>{heading}</th>)}
                      </tr></thead>
                      <tbody>{student.grades.map((grade) => (
                        <tr key={grade.enrollment_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="checkbox"
                              aria-label={`Select certificate for ${student.student_name} - ${grade.course_title}`}
                              checked={selectedEnrollmentIds.includes(grade.enrollment_id)}
                              onChange={() => toggleEnrollment(grade.enrollment_id)}
                              disabled={grade.certificate_issued || issuingSelected}
                            />
                          </td>
                          <td style={{ padding: '10px 12px' }}><strong>{grade.course_code}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{grade.course_title}</div></td>
                          <td style={{ padding: '10px 12px' }}>{Number(grade.total_marks_obtained || 0).toFixed(1)} / {Number(grade.total_marks_possible || 0).toFixed(1)}</td>
                          <td style={{ padding: '10px 12px' }}>{Number(grade.percentage || 0).toFixed(1)}%</td>
                          <td style={{ padding: '10px 12px' }}>{grade.grade || 'NON'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {grade.certificate_issued ? <span style={{ color: '#16a34a' }}>Generated and visible to student</span> : (
                              <button type="button" onClick={() => generateCertificate(grade)} disabled={issuingEnrollment === grade.enrollment_id || issuingSelected} style={{ ...buttonStyle, padding: '7px 10px', background: '#2563eb', color: '#fff' }}>
                                <Award size={14} /> {issuingEnrollment === grade.enrollment_id ? 'Generating…' : 'Generate Certificate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default RegistrarResults;
