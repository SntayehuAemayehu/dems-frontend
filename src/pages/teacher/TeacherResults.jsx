import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api, { getAllPages } from '../../api/api';
import GradeBadge from '../../components/Grade/GradeBadge';

const categories = [
  ['quiz', 'Quiz'],
  ['mid', 'Mid'],
  ['assignment', 'Assignment'],
  ['final', 'Final'],
];

const formatMarks = (marks) => {
  if (!marks || !Number(marks.possible)) return '—';
  return `${Number(marks.obtained).toFixed(1)} / ${Number(marks.possible).toFixed(1)}`;
};

const TeacherResults = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const courses = await getAllPages('/courses/');
        const teacherCourses = courses.filter(
          (course) => Number(course.instructor) === Number(user?.id),
        );
        const gradeResponses = await Promise.all(teacherCourses.map(async (course) => {
          const { data } = await api.get(`/courses/teacher/course/${course.id}/grades/`);
          return (data.students || []).map((student) => ({
            ...student,
            course_id: course.id,
            course_code: data.course_code || course.course_code,
            course_title: data.course_title || course.title,
          }));
        }));
        if (active) setResults(gradeResponses.flat());
      } catch (error) {
        console.error('Failed to load teacher results:', error);
        if (active) {
          setResults([]);
          toast.error(error.response?.data?.error || 'Could not load student results.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchResults();
    return () => { active = false; };
  }, [user?.id]);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return results;
    return results.filter((row) => (
      `${row.student_name || ''} ${row.student_number || ''} ${row.course_code || ''} ${row.course_title || ''}`
        .toLowerCase()
        .includes(term)
    ));
  }, [results, search]);

  const exportResults = (format) => {
    const rows = filteredResults.map((student) => {
      const row = {
        Course: `${student.course_code} - ${student.course_title}`,
        Student: student.student_name || '',
        'Student ID': student.student_number || '',
      };
      categories.forEach(([key, label]) => {
        row[label] = formatMarks(student.assessment_grades?.[key]);
      });
      row.Total = `${Number(student.total_marks_obtained || 0).toFixed(1)} / ${Number(student.total_marks_possible || 0).toFixed(1)}`;
      row.Percentage = `${Number(student.percentage || 0).toFixed(1)}%`;
      row.Grade = student.grade_letter || 'NON';
      row.Status = student.status || 'ACTIVE';
      return row;
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
          Course: '', Student: '', 'Student ID': '', Quiz: '', Mid: '',
          Assignment: '', Final: '', Total: '', Percentage: '', Grade: '', Status: '',
        })],
        body: rows.map((row) => Object.values(row)),
        styles: { fontSize: 8 },
      });
      document.save(`${filename}.pdf`);
    }
  };

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28 }}>Student Results</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>Original recorded marks by student and course.</p>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155' }}>
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
      </header>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 430, marginBottom: 16, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}>
        <Search size={17} color="#64748b" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or course" style={{ width: '100%', border: 0, outline: 'none' }} />
      </label>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Course', 'Student', 'Student ID', 'Quiz', 'Mid', 'Assignment', 'Final', 'Total', 'Grade'].map((heading) => (
                <th key={heading} scope="col" style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontSize: 12, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading results…</td></tr>
            ) : filteredResults.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>{search ? 'No matching results.' : 'No student results are available yet.'}</td></tr>
            ) : filteredResults.map((student, index) => (
              <tr key={`${student.course_id}-${student.student_id}`} style={{ borderTop: '1px solid #e2e8f0', background: index % 2 ? '#fcfcfd' : '#fff' }}>
                <td style={{ padding: '12px 14px' }}><strong>{student.course_code}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{student.course_title}</div></td>
                <td style={{ padding: '12px 14px' }}>{student.student_name}</td>
                <td style={{ padding: '12px 14px' }}>{student.student_number || '—'}</td>
                {categories.map(([key]) => <td key={key} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{formatMarks(student.assessment_grades?.[key])}</td>)}
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{Number(student.total_marks_obtained || 0).toFixed(1)} / {Number(student.total_marks_possible || 0).toFixed(1)}</td>
                <td style={{ padding: '12px 14px' }}><GradeBadge grade={student.grade_letter || 'NON'} percentage={student.percentage} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default TeacherResults;
