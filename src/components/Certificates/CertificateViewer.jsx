
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ArrowLeft,
  Printer,
  GraduationCap,
  BookOpen,
  UserRound,
  Hash,
  Building2,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import toast from 'react-hot-toast';
import {
  buildCourseGrades,
  letterGrade,
  normalizeResultList,
} from '../../utils/courseGrades';

const CertificateViewer = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [studentInfo, setStudentInfo] = useState({
    name: 'Student Name',
    id: 'N/A',
    department: 'Distance Education',
    year: 'N/A',
    semester: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const [
        studentGradesResponse,
        examsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        api.get('/courses/my-grades/'),
        api.get('/exams/results/'),
        api.get('/courses/student/assignments/results/'),
      ]);

      const studentGrades = studentGradesResponse.data || {};

      setStudentInfo({
        name: studentGrades.student_name || 'Student Name',
        id: studentGrades.student_id || 'N/A',
        department: studentGrades.department || 'Distance Education',
        year: studentGrades.year || 'N/A',
        semester: studentGrades.semester || 'N/A',
      });

      const grades = buildCourseGrades(
        normalizeResultList(examsResponse.data),
        normalizeResultList(assignmentsResponse.data)
      );

      setCertificates(
        grades.map((course, index) => {
          const score = Number(
            course.score ??
            course.total_score ??
            course.total ??
            0
          );

          const amount = Number(
            course.amount ??
            course.credit_hours ??
            course.credits ??
            course.credit ??
            0
          );

          return {
            ...course,
            id: course.course_id ?? course.course_code ?? index,
            course_id: course.course_id ?? course.course_code ?? 'N/A',
            course_title:
              course.course_title ||
              course.course_name ||
              'Untitled Course',
            score,
            amount,
            grade: course.letter || course.grade || '—',
          };
        })
      );
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load academic transcript');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate total score across all courses.
  const totalScore = certificates.reduce(
    (sum, course) => sum + (Number(course.score) || 0),
    0
  );

  // Calculate total credit hours.
  const totalAmount = certificates.reduce(
    (sum, course) => sum + (Number(course.amount) || 0),
    0
  );

  // Calculate average score.
  const averageScore = certificates.length
    ? (totalScore / certificates.length).toFixed(2)
    : '0.00';

  // Calculate overall letter grade from the average score.
  const overallGrade = certificates.length
    ? letterGrade(Number(averageScore)).letter
    : '—';

  if (loading) {
    return (
      <div className="transcript-loading">
        <div className="loading-spinner" />
        <p>Loading your academic transcript...</p>

        <style>{`
          .transcript-loading {
            min-height: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            color: #64748b;
            font-family: Inter, Arial, sans-serif;
          }

          .loading-spinner {
            width: 46px;
            height: 46px;
            border: 4px solid #dbeafe;
            border-top-color: #1d4ed8;
            border-radius: 50%;
            animation: transcript-spin 0.8s linear infinite;
          }

          @keyframes transcript-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="transcript-page">
      <style>{`
        .transcript-page,
        .transcript-page * {
          box-sizing: border-box;
        }

        .transcript-page {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 22px 42px;
          color: #172554;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .transcript-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 24px;
        }

        .transcript-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .transcript-action {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .transcript-action:hover {
          transform: translateY(-2px);
        }

        .transcript-action:active {
          transform: translateY(0) scale(0.98);
        }

        .transcript-back {
          color: #334155;
          background: #ffffff;
          border-color: #e2e8f0;
        }

        .transcript-back:hover {
          background: #f8fafc;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
        }

        .transcript-refresh {
          color: #1d4ed8;
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .transcript-refresh:hover {
          background: #dbeafe;
        }

        .transcript-print {
          color: #ffffff;
          background: linear-gradient(135deg, #1e40af, #2563eb);
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
        }

        .transcript-print:hover {
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
        }

        .transcript-sheet {
          position: relative;
          overflow: hidden;
          padding: 38px 42px 42px;
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 24px;
          box-shadow: 0 22px 65px rgba(15, 23, 42, 0.09);
          isolation: isolate;
        }

        .transcript-sheet::before {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 7px;
          content: "";
          background: linear-gradient(90deg, #172554, #2563eb, #38bdf8);
          z-index: -1;
        }

        .transcript-sheet::after {
          position: absolute;
          width: 340px;
          height: 340px;
          right: -170px;
          top: -180px;
          content: "";
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.10), transparent 68%);
          pointer-events: none;
          z-index: -1;
        }

        .transcript-university {
          text-align: center;
          padding-bottom: 28px;
          border-bottom: 1px solid #e2e8f0;
        }

        .transcript-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .transcript-logo {
          display: block;
          width: auto;
          height: 88px;
          max-width: 180px;
          object-fit: contain;
          filter: drop-shadow(0 5px 8px rgba(15, 23, 42, 0.10));
        }

        .transcript-university-name {
          margin: 0;
          color: #172554;
          font-size: clamp(19px, 2.5vw, 27px);
          font-weight: 900;
          letter-spacing: 1.5px;
          line-height: 1.3;
        }

        .transcript-heading {
          margin: 9px 0 0;
          color: #2563eb;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .transcript-subheading {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .student-section {
          margin-top: 28px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          color: #172554;
          font-size: 16px;
          font-weight: 850;
        }

        .section-heading-icon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #1d4ed8;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 11px;
        }

        .student-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .student-info-card {
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px;
          background: linear-gradient(145deg, #ffffff, #f8fbff);
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
          animation: transcript-card-in 450ms ease both;
        }

        .student-info-card:hover {
          transform: translateY(-3px);
          border-color: #bfdbfe;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.08);
        }

        .student-info-icon {
          flex: 0 0 36px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1d4ed8;
          background: #eff6ff;
          border-radius: 11px;
        }

        .student-info-copy {
          min-width: 0;
        }

        .student-info-label {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
        }

        .student-info-value {
          display: block;
          overflow-wrap: anywhere;
          color: #0f172a;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.45;
        }

        .courses-section {
          margin-top: 32px;
        }

        .courses-heading-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .courses-heading-row .section-heading {
          margin: 0;
        }

        .course-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          color: #1d4ed8;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .courses-table-wrap {
          overflow: hidden;
          border: 1px solid #dbe3ef;
          border-radius: 16px;
          background: #ffffff;
        }

        .courses-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .courses-table thead {
          background: linear-gradient(110deg, #172554, #1e40af);
        }

        .courses-table th {
          padding: 15px 12px;
          color: #ffffff;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.7px;
          text-align: left;
          text-transform: uppercase;
        }

        .courses-table th:nth-child(1) {
          width: 17%;
        }

        .courses-table th:nth-child(2) {
          width: 35%;
        }

        .courses-table th:nth-child(3) {
          width: 17%;
          text-align: center;
        }

        .courses-table th:nth-child(4) {
          width: 15%;
          text-align: center;
        }

        .courses-table th:nth-child(5) {
          width: 16%;
          text-align: center;
        }

        .courses-table td {
          padding: 14px 12px;
          color: #334155;
          border-bottom: 1px solid #edf2f7;
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .courses-table tbody tr {
          transition: background 160ms ease;
          animation: transcript-row-in 350ms ease both;
        }

        .courses-table tbody tr:hover {
          background: #f5f9ff;
        }

        .courses-table tbody tr:last-child td {
          border-bottom: none;
        }

        .course-id-cell {
          color: #1e40af !important;
          font-weight: 800;
        }

        .course-name-cell {
          color: #0f172a !important;
          font-weight: 700;
        }

        .course-score-cell,
        .course-grade-cell,
        .course-amount-cell {
          text-align: center;
          font-weight: 800;
        }

        .course-score-cell {
          color: #1e40af !important;
        }

        .grade-pill {
          min-width: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .grade-pass {
          color: #166534;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
        }

        .grade-fail {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
        }

        .grade-neutral {
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .total-row {
          background: #eff6ff !important;
          font-weight: 900;
        }

        .total-row td {
          padding: 15px 12px;
          color: #172554 !important;
          border-top: 2px solid #bfdbfe;
          border-bottom: none !important;
          font-size: 12px;
          font-weight: 900;
        }

        .total-label {
          text-align: right;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .total-score-cell,
        .total-amount-cell {
          color: #1d4ed8 !important;
          text-align: center;
          font-size: 14px !important;
        }

        .empty-courses {
          padding: 38px 18px !important;
          text-align: center;
          color: #64748b !important;
        }

        .empty-courses-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }

        .empty-courses-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: #f1f5f9;
          border-radius: 14px;
        }

        .academic-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          margin-top: 20px;
        }

        .summary-card {
          padding: 16px 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }

        .summary-card-label {
          margin: 0;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .summary-card-value {
          margin: 7px 0 0;
          color: #172554;
          font-size: 22px;
          font-weight: 900;
        }

        .summary-card-value.highlight {
          color: #1d4ed8;
        }

        @keyframes transcript-card-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes transcript-row-in {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 760px) {
          .transcript-page {
            padding: 20px 14px 30px;
          }

          .transcript-sheet {
            padding: 30px 22px;
            border-radius: 19px;
          }

          .student-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .courses-table th,
          .courses-table td {
            padding: 12px 8px;
          }
        }

        @media (max-width: 520px) {
          .transcript-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .transcript-toolbar-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .transcript-action {
            padding: 10px 11px;
            font-size: 12px;
          }

          .transcript-sheet {
            padding: 25px 14px;
          }

          .transcript-logo {
            height: 72px;
            max-width: 150px;
          }

          .transcript-heading {
            letter-spacing: 2px;
          }

          .student-info-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .student-info-card {
            padding: 12px;
          }

          .courses-heading-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .courses-table th {
            font-size: 8px;
            letter-spacing: 0;
          }

          .courses-table td {
            font-size: 10px;
          }

          .academic-summary {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .student-info-card,
          .courses-table tbody tr {
            animation: none !important;
            transition: none !important;
          }

          .transcript-action {
            transition: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html,
          body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .transcript-page,
          .transcript-page * {
            visibility: visible !important;
          }

          .transcript-page {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .transcript-toolbar {
            display: none !important;
          }

          .transcript-sheet {
            width: 100% !important;
            padding: 8mm !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .transcript-logo {
            height: 65px !important;
          }

          .student-info-card,
          .summary-card {
            break-inside: avoid !important;
            box-shadow: none !important;
          }

          .courses-table-wrap {
            overflow: visible !important;
            break-inside: auto !important;
          }

          .courses-table thead {
            display: table-header-group;
          }

          .courses-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .courses-table th,
          .courses-table td {
            padding: 8px 7px !important;
            font-size: 9px !important;
          }

          .student-info-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .academic-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      <div className="transcript-toolbar">
        <button
          type="button"
          className="transcript-action transcript-back"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="transcript-toolbar-actions">
          <button
            type="button"
            className="transcript-action transcript-refresh"
            onClick={fetchCertificates}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="transcript-action transcript-print"
            onClick={handlePrint}
          >
            <Printer size={15} />
            Print Transcript
          </button>
        </div>
      </div>

      <main className="transcript-sheet">
        <header className="transcript-university">
          <div className="transcript-logo-wrap">
            <img
              src="/Mekdela_Amba_University_logo.jpg"
              alt="Mekdela Amba University Logo"
              className="transcript-logo"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <h1 className="transcript-university-name">
            MEKDELA AMBA UNIVERSITY
          </h1>

          <p className="transcript-heading">
            Academic Transcript
          </p>

          <p className="transcript-subheading">
            Student academic record and course grade summary
          </p>
        </header>

        <section className="student-section">
          <h2 className="section-heading">
            <span className="section-heading-icon">
              <UserRound size={18} />
            </span>
            Student Information
          </h2>

          <div className="student-info-grid">
            <div className="student-info-card">
              <span className="student-info-icon">
                <UserRound size={18} />
              </span>
              <div className="student-info-copy">
                <span className="student-info-label">Student Name</span>
                <span className="student-info-value">{studentInfo.name}</span>
              </div>
            </div>

            <div className="student-info-card">
              <span className="student-info-icon">
                <Hash size={18} />
              </span>
              <div className="student-info-copy">
                <span className="student-info-label">Student ID</span>
                <span className="student-info-value">{studentInfo.id}</span>
              </div>
            </div>

            <div className="student-info-card">
              <span className="student-info-icon">
                <Building2 size={18} />
              </span>
              <div className="student-info-copy">
                <span className="student-info-label">Department</span>
                <span className="student-info-value">{studentInfo.department}</span>
              </div>
            </div>

            <div className="student-info-card">
              <span className="student-info-icon">
                <GraduationCap size={18} />
              </span>
              <div className="student-info-copy">
                <span className="student-info-label">Academic Year</span>
                <span className="student-info-value">{studentInfo.year}</span>
              </div>
            </div>

            <div className="student-info-card">
              <span className="student-info-icon">
                <CalendarDays size={18} />
              </span>
              <div className="student-info-copy">
                <span className="student-info-label">Semester</span>
                <span className="student-info-value">{studentInfo.semester}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="courses-section">
          <div className="courses-heading-row">
            <h2 className="section-heading">
              <span className="section-heading-icon">
                <BookOpen size={18} />
              </span>
              Course Results
            </h2>

            <span className="course-count">
              <CheckCircle2 size={14} />
              {certificates.length} {certificates.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>

          <div className="courses-table-wrap">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course Name</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {certificates.length > 0 ? (
                  <>
                    {certificates.map((cert, index) => {
                      const grade = cert.grade || '—';

                      const gradeClass =
                        grade === 'F'
                          ? 'grade-fail'
                          : grade === '—'
                            ? 'grade-neutral'
                            : 'grade-pass';

                      return (
                        <tr key={cert.id ?? index}>
                          <td className="course-id-cell">
                            {cert.course_id || cert.course_code || 'N/A'}
                          </td>

                          <td className="course-name-cell">
                            {cert.course_title || 'Untitled Course'}
                          </td>

                          <td className="course-score-cell">
                            {cert.score}
                          </td>

                          <td className="course-grade-cell">
                            <span className={`grade-pill ${gradeClass}`}>
                              {grade}
                            </span>
                          </td>

                          <td className="course-amount-cell">
                            {cert.amount}
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="total-row">
                      <td colSpan="2" className="total-label">
                        TOTAL
                      </td>

                      <td className="total-score-cell">
                        {totalScore}
                      </td>

                      <td></td>

                      <td className="total-amount-cell">
                        {totalAmount}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-courses">
                      <div className="empty-courses-content">
                        <span className="empty-courses-icon">
                          <BookOpen size={21} />
                        </span>
                        <strong>No course grades available yet</strong>
                        <span>
                          Your course results will appear here when they are available.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="academic-summary">
          <div className="summary-card">
            <p className="summary-card-label">Total Score</p>
            <p className="summary-card-value">
              {totalScore}
            </p>
          </div>

          <div className="summary-card">
            <p className="summary-card-label">Total Amount</p>
            <p className="summary-card-value highlight">
              {totalAmount}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CertificateViewer;
