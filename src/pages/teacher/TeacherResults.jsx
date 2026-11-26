import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Download, Search, Send, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api, { getAllPages } from '../../api/api';
import GradeBadge from '../../components/Grade/GradeBadge';

const TeacherResults = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [search, setSearch] = useState('');
  const [submittingResult, setSubmittingResult] = useState(null);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const allCourses = await getAllPages('/courses/');
        const teacherCourses = allCourses.filter(
          (course) => Number(course.instructor) === Number(user?.id),
        );
        if (active) setCourses(teacherCourses);
      } catch (error) {
        console.error('Failed to load teacher courses:', error);
        if (active) {
          setCourses([]);
          toast.error(error.response?.data?.error || 'Could not load your courses.');
        }
      } finally {
        if (active) setLoadingCourses(false);
      }
    };

    fetchCourses();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedCourseId) {
      setResults([]);
      return undefined;
    }

    let active = true;
    const fetchCourseGrades = async () => {
      try {
        setLoadingGrades(true);
        const { data } = await api.get(`/courses/teacher/course/${selectedCourseId}/grades/`);
        const course = courses.find((item) => String(item.id) === String(selectedCourseId));
        if (active) {
          setResults((data.students || []).map((student) => ({
            ...student,
            course_id: selectedCourseId,
            course_code: data.course_code || course?.course_code,
            course_title: data.course_title || course?.title,
          })));
        }
      } catch (error) {
        console.error('Failed to load course grades:', error);
        if (active) {
          setResults([]);
          toast.error(error.response?.data?.error || 'Could not load grades for this course.');
        }
      } finally {
        if (active) setLoadingGrades(false);
      }
    };

    fetchCourseGrades();
    return () => { active = false; };
  }, [selectedCourseId, courses]);

  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));
  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) => (
      `${course.course_code || ''} ${course.title || ''} ${course.department || ''}`
        .toLowerCase()
        .includes(term)
    ));
  }, [courses, search]);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return results;
    return results.filter((row) => (
      `${row.student_name || ''} ${row.student_number || ''}`
        .toLowerCase()
        .includes(term)
    ));
  }, [results, search]);
  const loading = loadingCourses || loadingGrades;
  const completedResults = results.filter((row) => Number(row.total_marks_possible) > 0).length;
  const averagePercentage = completedResults
    ? results.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / completedResults
    : 0;

  const selectableEnrollmentIds = filteredResults
    .filter((row) => !row.result_submitted_to_department && Number(row.total_marks_possible) > 0)
    .map((row) => row.enrollment_id);
  const allVisibleSelected = selectableEnrollmentIds.length > 0
    && selectableEnrollmentIds.every((id) => selectedEnrollmentIds.includes(id));

  const toggleEnrollment = (enrollmentId) => {
    setSelectedEnrollmentIds((current) => (
      current.includes(enrollmentId)
        ? current.filter((id) => id !== enrollmentId)
        : [...current, enrollmentId]
    ));
  };

  const toggleSelectAll = () => {
    setSelectedEnrollmentIds((current) => (
      allVisibleSelected
        ? current.filter((id) => !selectableEnrollmentIds.includes(id))
        : [...new Set([...current, ...selectableEnrollmentIds])]
    ));
  };

  const sendSelectedResults = async () => {
    if (!selectedEnrollmentIds.length) return;
    setSubmittingResult('bulk');
    try {
      const { data } = await api.post('/courses/teacher/results/send/', {
        enrollment_ids: selectedEnrollmentIds,
      });
      const completedIds = new Set([...(data.submitted_ids || []), ...(data.already_submitted_ids || [])]);
      setResults((current) => current.map((row) => (
        completedIds.has(row.enrollment_id)
          ? { ...row, result_submitted_to_department: true }
          : row
      )));
      setSelectedEnrollmentIds((current) => current.filter((id) => !completedIds.has(id)));
      toast.success(`${data.submitted_ids?.length || 0} result(s) sent to the Department Head.${data.skipped_ids?.length ? ` ${data.skipped_ids.length} incomplete result(s) were skipped.` : ''}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send selected results.');
    } finally {
      setSubmittingResult(null);
    }
  };

  const exportResults = (format) => {
    const rows = filteredResults.map((student) => {
      return {
        Student: student.student_name || '',
        'Student ID': student.student_number || '',
        'Total Mark': `${Number(student.total_marks_obtained || 0).toFixed(1)} / ${Number(student.total_marks_possible || 0).toFixed(1)}`,
        Percentage: `${Number(student.percentage || 0).toFixed(1)}%`,
        Grade: student.grade_letter || 'NON',
        Status: student.status || 'ACTIVE',
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results');
    const filename = 'ODEMS-student-results';

    if (format === 'excel') {
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === 'csv') {
      XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
    } else {
      const document = new jsPDF({ orientation: 'landscape' });
      autoTable(document, {
        head: [Object.keys(rows[0] || {
          Student: '', 'Student ID': '', 'Total Mark': '',
          Percentage: '', Grade: '', Status: '',
        })],
        body: rows.map((row) => Object.values(row)),
        styles: { fontSize: 8 },
      });
      document.save(`${filename}.pdf`);
    }
  };

  const sendResultToDepartment = async (result) => {
    const key = `${result.course_id}-${result.student_id}`;
    setSubmittingResult(key);
    try {
      await api.post(`/courses/teacher/course/${result.course_id}/send-result/`, {
        student_id: result.student_id,
      });
      setResults((current) => current.map((row) => (
        row.course_id === result.course_id && row.student_id === result.student_id
          ? { ...row, result_submitted_to_department: true }
          : row
      )));
      toast.success('Result sent to the Department Head.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send this result.');
    } finally {
      setSubmittingResult(null);
    }
  };

  return (
    <main className="teacher-results-main" style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <style>{`
        .teacher-result-course:hover { transform: translateY(-4px); box-shadow: 0 18px 36px rgba(15, 23, 42, .12); }
        .teacher-result-row:hover { background: #f8fafc; }
        @media (max-width: 700px) { .teacher-results-main { padding: 14px !important; } }
      `}</style>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 22,
        padding: 28,
        borderRadius: 22,
        color: '#fff',
        background: 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 58%, #06b6d4 100%)',
        boxShadow: '0 20px 45px rgba(29, 78, 216, .2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'rgba(255,255,255,.16)' }}>
            <Award size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Student Results</h1>
            <p style={{ margin: '6px 0 0', color: '#dbeafe' }}>
              {selectedCourse ? `${selectedCourse.course_code} · ${selectedCourse.title}` : 'Choose a course to review student totals.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {selectedCourse && (
            <button
              type="button"
              onClick={() => {
                setSelectedCourseId(null);
                setSelectedEnrollmentIds([]);
                setSearch('');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 10, color: '#fff', background: 'rgba(255,255,255,.12)', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Courses
            </button>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 10, background: '#fff', color: '#334155' }}>
          <Download size={17} />
          <span>Download</span>
          <select
            aria-label="Download results"
            defaultValue=""
            disabled={loading || filteredResults.length === 0}
            onChange={(event) => {
              if (event.target.value) exportResults(event.target.value);
              event.target.value = '';
            }}
            style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', outline: 'none', cursor: loading || filteredResults.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <option value="" disabled>Choose format</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          </label>
        </div>
      </header>

      {!selectedCourse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Courses assigned', value: courses.length, icon: <BookOpen size={19} />, color: '#2563eb' },
            { label: 'Results workflow', value: 'Course first', icon: <Users size={19} />, color: '#7c3aed' },
            { label: 'Marks displayed', value: 'Total only', icon: <Award size={19} />, color: '#059669' },
          ].map((metric) => (
            <div key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', boxShadow: '0 6px 20px rgba(15,23,42,.04)' }}>
              <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: `${metric.color}14`, color: metric.color }}>{metric.icon}</span>
              <span><strong style={{ display: 'block', fontSize: 21, color: '#0f172a' }}>{metric.value}</strong><small style={{ color: '#64748b' }}>{metric.label}</small></span>
            </div>
          ))}
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 480, marginBottom: 18, padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', boxShadow: '0 4px 14px rgba(15,23,42,.04)' }}>
        <Search size={17} color="#64748b" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={selectedCourse ? 'Search students in this course' : 'Find a course by name or code'} style={{ width: '100%', border: 0, outline: 'none' }} />
      </label>

      {!selectedCourse ? (
        loadingCourses ? (
          <div style={{ padding: 35, textAlign: 'center', borderRadius: 18, background: '#fff', color: '#64748b' }}>Loading your courses…</div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ padding: 35, textAlign: 'center', borderRadius: 18, background: '#fff', color: '#64748b' }}>
            {search ? 'No courses match your search.' : 'No courses are assigned to your account yet.'}
          </div>
        ) : (
          <section aria-label="Your courses" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 15 }}>
            {filteredCourses.map((course) => (
              <button
                type="button"
                key={course.id}
                className="teacher-result-course"
                onClick={() => {
                  setSelectedEnrollmentIds([]);
                  setSearch('');
                  setSelectedCourseId(course.id);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 15, padding: 20, border: '1px solid #e2e8f0', borderRadius: 18, textAlign: 'left', color: '#0f172a', background: '#fff', boxShadow: '0 7px 24px rgba(15,23,42,.05)', cursor: 'pointer', transition: 'all .2s ease' }}
              >
                <span style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, color: '#2563eb', background: '#eff6ff' }}><BookOpen size={22} /></span>
                <span>
                  <strong style={{ display: 'block', fontSize: 17 }}>{course.course_code || 'Course'}</strong>
                  <span style={{ display: 'block', marginTop: 4, color: '#64748b' }}>{course.title || 'Untitled course'}</span>
                </span>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
                  <span>{course.semester ? `Semester ${course.semester}` : 'View student results'}</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>Open results →</span>
                </span>
              </button>
            ))}
          </section>
        )
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Students', value: results.length, icon: <Users size={18} />, color: '#2563eb' },
              { label: 'Graded', value: completedResults, icon: <Award size={18} />, color: '#059669' },
              { label: 'Class average', value: `${averagePercentage.toFixed(1)}%`, icon: <BookOpen size={18} />, color: '#7c3aed' },
              { label: 'Awaiting submission', value: results.filter((row) => !row.result_submitted_to_department && Number(row.total_marks_possible) > 0).length, icon: <Send size={18} />, color: '#ea580c' },
            ].map((metric) => (
              <div key={metric.label} style={{ padding: '15px 17px', border: '1px solid #e2e8f0', borderRadius: 15, background: '#fff', boxShadow: '0 5px 18px rgba(15,23,42,.04)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: metric.color, fontSize: 13 }}>{metric.icon}{metric.label}</span>
                <strong style={{ display: 'block', marginTop: 8, color: '#0f172a', fontSize: 22 }}>{metric.value}</strong>
              </div>
            ))}
          </section>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 13 }}>
            <button type="button" onClick={toggleSelectAll} disabled={!selectableEnrollmentIds.length || Boolean(submittingResult)} style={{ padding: '9px 13px', border: '1px solid #cbd5e1', borderRadius: 9, background: '#fff', color: '#334155', cursor: 'pointer' }}>
              {allVisibleSelected ? 'Deselect all eligible' : 'Select all eligible'}
            </button>
            <button type="button" onClick={sendSelectedResults} disabled={!selectedEnrollmentIds.length || Boolean(submittingResult)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', border: 0, borderRadius: 9, background: 'linear-gradient(110deg, #2563eb, #4f46e5)', color: '#fff', cursor: 'pointer', opacity: !selectedEnrollmentIds.length ? 0.55 : 1 }}>
              <Send size={15} /> {submittingResult === 'bulk' ? 'Sending…' : `Send selected (${selectedEnrollmentIds.length}) to Department Head`}
            </button>
            {selectedEnrollmentIds.length > 0 && <button type="button" onClick={() => setSelectedEnrollmentIds([])} disabled={Boolean(submittingResult)} style={{ padding: '9px 13px', border: 0, borderRadius: 9, background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>Clear selection</button>}
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th scope="col" style={{ padding: '13px 15px', textAlign: 'left' }}>
                    <input type="checkbox" aria-label="Select all eligible student results" checked={allVisibleSelected} onChange={toggleSelectAll} disabled={!selectableEnrollmentIds.length || Boolean(submittingResult)} />
                  </th>
                  {['Student', 'Student ID', 'Total Mark', 'Percentage', 'Grade', 'Department'].map((heading) => (
                    <th key={heading} scope="col" style={{ padding: '13px 15px', textAlign: 'left', color: '#64748b', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingGrades ? (
                  <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading grades for {selectedCourse.course_code}…</td></tr>
                ) : filteredResults.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>{search ? 'No matching students.' : 'No student results are available for this course yet.'}</td></tr>
                ) : filteredResults.map((student, index) => (
                  <tr key={`${student.course_id}-${student.student_id}`} className="teacher-result-row" style={{ borderTop: '1px solid #eef2f7', background: index % 2 ? '#fcfdff' : '#fff' }}>
                    <td style={{ padding: '13px 15px' }}>
                      <input
                        type="checkbox"
                        aria-label={`Select result for ${student.student_name}`}
                        checked={selectedEnrollmentIds.includes(student.enrollment_id)}
                        onChange={() => toggleEnrollment(student.enrollment_id)}
                        disabled={student.result_submitted_to_department || !Number(student.total_marks_possible) || Boolean(submittingResult)}
                      />
                    </td>
                    <td style={{ padding: '13px 15px' }}><strong style={{ color: '#0f172a' }}>{student.student_name}</strong></td>
                    <td style={{ padding: '13px 15px', color: '#64748b' }}>{student.student_number || '—'}</td>
                    <td style={{ padding: '13px 15px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {Number(student.total_marks_possible) > 0
                        ? `${Number(student.total_marks_obtained || 0).toFixed(1)} / ${Number(student.total_marks_possible).toFixed(1)}`
                        : 'Not graded'}
                    </td>
                    <td style={{ padding: '13px 15px' }}>{Number(student.total_marks_possible) > 0 ? `${Number(student.percentage || 0).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '13px 15px' }}><GradeBadge grade={student.grade_letter || 'NON'} percentage={student.percentage} size="sm" /></td>
                    <td style={{ padding: '13px 15px', whiteSpace: 'nowrap' }}>
                      {student.result_submitted_to_department ? (
                        <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, color: '#047857', background: '#d1fae5', fontSize: 12, fontWeight: 600 }}>Submitted</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendResultToDepartment(student)}
                          disabled={Boolean(submittingResult) || !Number(student.total_marks_possible)}
                          title={!Number(student.total_marks_possible) ? 'Record graded marks before submitting' : ''}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', opacity: !Number(student.total_marks_possible) ? 0.55 : 1 }}
                        >
                          <Send size={14} /> {submittingResult === `${student.course_id}-${student.student_id}` ? 'Sending…' : 'Send'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
};

export default TeacherResults;
