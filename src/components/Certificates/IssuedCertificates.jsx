
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  ArrowLeft,
  RefreshCw,
  Printer,
  GraduationCap,
  BookOpen,
  User,
  Building2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import toast from 'react-hot-toast';

const IssuedCertificates = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FETCH CERTIFICATES
  // ============================================================

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get('/certificates/');

      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load certificates:', error);

      toast.error(
        error.response?.data?.error ||
        'Failed to load certificate.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // ============================================================
  // STUDENT INFORMATION
  // ============================================================

  const student = certificates[0] || {};

  const studentName =
    student.student_name ||
    student.student?.full_name ||
    student.student?.name ||
    'Student Name';

  const studentId =
    student.student_id ||
    student.student?.student_id ||
    student.student?.username ||
    'Not available';

  const department =
    student.department ||
    student.student?.department ||
    'Not available';

  const academicYear =
    student.year ||
    student.academic_year ||
    student.year_of_study ||
    student.student?.year ||
    'Not available';

  const semester =
    student.semester ||
    student.semester_name ||
    student.academic_semester ||
    student.student?.semester ||
    'Not available';

  // ============================================================
  // COURSE INFORMATION
  // Each certificate record represents one course.
  // ============================================================

  const courses = useMemo(() => {
    return certificates.map((certificate, index) => {
      const course = certificate.course || {};

      const rawCourseId =
        certificate.course_code ??
        certificate.course_id ??
        course.course_code ??
        course.id ??
        'N/A';

      const scoreValue =
        certificate.score ??
        certificate.total_score ??
        certificate.total ??
        certificate.percentage ??
        certificate.marks ??
        certificate.final_score ??
        certificate.numeric_grade ??
        null;

      const amountValue =
        certificate.amount ??
        certificate.credit_hours ??
        certificate.credits ??
        certificate.credit ??
        course.credit_hours ??
        course.credits ??
        course.credit ??
        0;

      const score =
        scoreValue === null || scoreValue === ''
          ? null
          : Number(scoreValue);

      const amount = Number(amountValue) || 0;

      return {
        id: certificate.id ?? index,

        courseId: String(rawCourseId),

        courseName:
          certificate.course_title ||
          certificate.course_name ||
          course.course_title ||
          course.title ||
          course.name ||
          'Course Name',

        score:
          Number.isFinite(score) ? score : null,

        grade:
          certificate.grade ||
          certificate.letter_grade ||
          certificate.course_grade ||
          'N/A',

        amount,
      };
    });
  }, [certificates]);

  // ============================================================
  // TOTAL SCORE AND TOTAL AMOUNT
  // ============================================================

  const totalScore = courses.reduce(
    (sum, course) => sum + (Number(course.score) || 0),
    0
  );

  const totalAmount = courses.reduce(
    (sum, course) => sum + (Number(course.amount) || 0),
    0
  );

  // ============================================================
  // CERTIFICATE ISSUE DATE
  // ============================================================

  const issueDate = student.issued_at
    ? new Date(student.issued_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  // ============================================================
  // PRINT CERTIFICATE / SAVE AS PDF
  // ============================================================

  const handlePrint = () => {
    if (certificates.length === 0) {
      toast.error('No certificate is available to print.');
      return;
    }

    window.print();
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="certificate-loading">
        <RefreshCw
          size={32}
          className="certificate-loading-icon"
        />

        <p>Loading your certificate...</p>

        <style>{`
          .certificate-loading {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #64748b;
            gap: 15px;
          }

          .certificate-loading-icon {
            animation: certificateSpin 1s linear infinite;
          }

          @keyframes certificateSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // NO CERTIFICATE
  // ============================================================

  if (certificates.length === 0) {
    return (
      <main className="certificate-empty">
        <Award size={55} color="#94a3b8" />

        <h2>Certificate Not Available</h2>

        <p>
          Your certificate will appear here when it is available.
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="empty-back-button"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>

        <style>{`
          .certificate-empty {
            max-width: 800px;
            margin: 60px auto;
            padding: 25px;
            text-align: center;
            color: #64748b;
          }

          .certificate-empty h2 {
            color: #0f172a;
          }

          .empty-back-button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 11px 20px;
            border: 0;
            border-radius: 8px;
            background: #102a43;
            color: #fff;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  // ============================================================
  // MAIN CERTIFICATE PAGE
  // ============================================================

  return (
    <main className="certificate-page">

      {/* PAGE ACTIONS */}

      <div className="certificate-toolbar">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="toolbar-button back-button"
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="toolbar-right">
          <button
            type="button"
            onClick={fetchCertificates}
            className="toolbar-button refresh-button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="toolbar-button print-button"
          >
            <Printer size={17} />
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* SINGLE-PAGE CERTIFICATE */}

      <article className="official-certificate">
        <div className="certificate-inner-border">

          {/* UNIVERSITY HEADER */}

          <header className="certificate-header">
            <img
              src="/Mekdela_Amba_University_logo.jpg"
              alt="Mekdela Amba University"
              className="university-logo"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />

            <h1 className="university-name">
              MEKDELA AMBA UNIVERSITY
            </h1>

            <p className="university-subtitle">
              DISTANCE EDUCATION MANAGEMENT SYSTEM
            </p>

            <div className="header-divider">
              <span />
              <Award size={19} />
              <span />
            </div>

            <h2 className="certificate-title">
              CERTIFICATE OF COMPLETION
            </h2>

            <p className="certificate-description">
              ACADEMIC ACHIEVEMENT CERTIFICATE
            </p>
          </header>

          {/* PRESENTATION TEXT */}

          <section className="certificate-presentation">
            <p className="presented-text">
              This certificate is proudly presented to
            </p>

            <h2 className="student-name">
              {studentName}
            </h2>

            <div className="student-name-line" />

            <p className="completion-text">
              In recognition of the successful completion of the
              following academic courses at Mekdela Amba University.
            </p>
          </section>

          {/* STUDENT DETAILS */}

          <section className="student-details">
            <div className="detail-item">
              <User size={16} />

              <div>
                <span className="detail-label">STUDENT ID</span>
                <strong>{studentId}</strong>
              </div>
            </div>

            <div className="detail-item">
              <Building2 size={16} />

              <div>
                <span className="detail-label">DEPARTMENT</span>
                <strong>{department}</strong>
              </div>
            </div>

            <div className="detail-item">
              <GraduationCap size={16} />

              <div>
                <span className="detail-label">ACADEMIC YEAR</span>
                <strong>
                  {String(academicYear).toLowerCase().includes('year')
                    ? academicYear
                    : `Year ${academicYear}`}
                </strong>
              </div>
            </div>

            <div className="detail-item">
              <Calendar size={16} />

              <div>
                <span className="detail-label">SEMESTER</span>
                <strong>{semester}</strong>
              </div>
            </div>
          </section>

          {/* COURSE RESULTS TABLE */}

          <section className="certificate-courses">
            <div className="courses-heading">
              <BookOpen size={17} />
              <h3>ACADEMIC COURSE RESULTS</h3>
            </div>

            <table className="certificate-table">
              <thead>
                <tr>
                  <th className="course-id-column">ID</th>
                  <th className="course-name-column">COURSE NAME</th>
                  <th className="score-column">SCORE</th>
                  <th className="grade-column">GRADE</th>
                  <th className="amount-column">AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                {courses.map((course, index) => (
                  <tr key={course.id ?? index}>
                    <td className="course-id-column">
                      {course.courseId}
                    </td>

                    <td className="course-name-column">
                      {course.courseName}
                    </td>

                    <td className="score-column">
                      {course.score === null
                        ? 'N/A'
                        : course.score}
                    </td>

                    <td className="grade-column">
                      <span className="course-grade">
                        {course.grade}
                      </span>
                    </td>

                    <td className="amount-column">
                      {course.amount}
                    </td>
                  </tr>
                ))}

                {/* TOTAL ROW */}

                <tr className="total-row">
                  <td colSpan="2" className="total-label">
                    TOTAL
                  </td>

                  <td className="score-column total-value">
                    {totalScore}
                  </td>

                  <td className="grade-column">
                    —
                  </td>

                  <td className="amount-column total-value">
                    {totalAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* TOTAL SUMMARY */}

          <section className="certificate-summary">
            <div className="summary-item">
              <span>TOTAL SCORE</span>
              <strong>{totalScore}</strong>
            </div>

            <div className="summary-item">
              <span>TOTAL AMOUNT</span>
              <strong>{totalAmount}</strong>
            </div>
          </section>

          {/* CERTIFICATE FOOTER */}

          <footer className="certificate-footer">
            <div className="footer-signature">
              <div className="signature-line" />
              <p>Registrar Office</p>
              <span>MEKDELA AMBA UNIVERSITY</span>
            </div>

            <div className="certificate-seal">
              <ShieldCheck size={32} />
              <span>OFFICIAL</span>
              <small>ACADEMIC RECORD</small>
            </div>

            <div className="footer-date">
              <div className="signature-line" />
              <p>{issueDate}</p>
              <span>DATE OF ISSUE</span>
            </div>
          </footer>

          <div className="certificate-bottom-text">
            MEKDELA AMBA UNIVERSITY · DISTANCE EDUCATION
          </div>

        </div>
      </article>

      {/* ALL CERTIFICATE STYLES */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .certificate-page {
          width: 100%;
          max-width: 1250px;
          margin: 0 auto;
          padding: 25px;
          background: #f1f5f9;
          min-height: 100vh;
        }

        .certificate-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .toolbar-right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toolbar-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 9px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s ease;
        }

        .back-button {
          background: #ffffff;
          color: #334155;
        }

        .refresh-button {
          background: #ffffff;
          color: #1d4ed8;
        }

        .print-button {
          background: #102a43;
          color: #ffffff;
          border-color: #102a43;
        }

        .toolbar-button:hover {
          transform: translateY(-1px);
          opacity: .9;
        }

        .official-certificate {
          width: 100%;
          max-width: 1100px;
          min-height: 760px;
          margin: 0 auto;
          padding: 13px;
          background: #fffdf6;
          border: 3px solid #a88736;
          box-shadow: 0 15px 45px rgba(15, 23, 42, .13);
          color: #102a43;
          position: relative;
        }

        .certificate-inner-border {
          min-height: 730px;
          height: 100%;
          border: 1px solid rgba(168, 135, 54, .65);
          padding: 25px 42px 17px;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .certificate-inner-border::before,
        .certificate-inner-border::after {
          content: "";
          position: absolute;
          width: 75px;
          height: 75px;
          border-color: #b49137;
          border-style: solid;
          pointer-events: none;
        }

        .certificate-inner-border::before {
          top: 9px;
          left: 9px;
          border-width: 2px 0 0 2px;
        }

        .certificate-inner-border::after {
          right: 9px;
          bottom: 9px;
          border-width: 0 2px 2px 0;
        }

        .certificate-header {
          text-align: center;
        }

        .university-logo {
          width: 85px;
          height: 85px;
          object-fit: contain;
          display: block;
          margin: 0 auto 8px;
        }

        .university-name {
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #102a43;
          margin: 0;
        }

        .university-subtitle {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.2px;
          color: #64748b;
          margin: 6px 0 0;
        }

        .header-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 12px auto;
          color: #b49137;
        }

        .header-divider span {
          width: 100px;
          height: 1px;
          background: #b49137;
        }

        .certificate-title {
          font-family: Georgia, serif;
          font-size: 29px;
          font-weight: 500;
          letter-spacing: 4px;
          color: #997629;
          margin: 8px 0 4px;
        }

        .certificate-description {
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          margin: 0;
        }

        .certificate-presentation {
          text-align: center;
          margin-top: 17px;
        }

        .presented-text {
          color: #64748b;
          font-family: Georgia, serif;
          font-size: 15px;
          font-style: italic;
          margin: 0;
        }

        .student-name {
          font-family: Georgia, serif;
          font-size: 30px;
          font-weight: 700;
          color: #102a43;
          margin: 9px 0 5px;
        }

        .student-name-line {
          width: 350px;
          max-width: 80%;
          height: 1px;
          margin: 0 auto;
          background: linear-gradient(
            90deg,
            transparent,
            #b49137,
            transparent
          );
        }

        .completion-text {
          max-width: 650px;
          margin: 9px auto 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
        }

        .student-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 20px 0 17px;
          padding: 13px 15px;
          border-top: 1px solid #e7d9b3;
          border-bottom: 1px solid #e7d9b3;
          background: rgba(250, 247, 237, .75);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: #997629;
        }

        .detail-item div {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .detail-label {
          color: #64748b;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .8px;
          margin-bottom: 4px;
        }

        .detail-item strong {
          color: #102a43;
          font-size: 10px;
          overflow-wrap: anywhere;
        }

        .certificate-courses {
          margin-top: 4px;
        }

        .courses-heading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #997629;
          margin-bottom: 9px;
        }

        .courses-heading h3 {
          margin: 0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .certificate-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .certificate-table th {
          padding: 9px 10px;
          background: #102a43;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .8px;
          text-align: left;
          border: 1px solid #102a43;
        }

        .certificate-table td {
          padding: 7px 10px;
          border: 1px solid #e7dcc0;
          color: #334155;
          font-size: 10px;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .certificate-table tbody tr:nth-child(even) {
          background: #faf8f0;
        }

        .certificate-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }

        .course-id-column {
          width: 17%;
          font-weight: 700;
        }

        .course-name-column {
          width: 35%;
          font-weight: 600;
          color: #102a43 !important;
        }

        .score-column {
          width: 16%;
          text-align: center !important;
          font-weight: 800;
        }

        .grade-column {
          width: 16%;
          text-align: center !important;
        }

        .amount-column {
          width: 16%;
          text-align: center !important;
          font-weight: 800;
        }

        .course-grade {
          display: inline-block;
          min-width: 34px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #f4ecd5;
          color: #87671e;
          font-weight: 800;
          text-align: center;
        }

        .total-row {
          background: #f4ecd5 !important;
          font-weight: 900;
        }

        .total-row td {
          border-top: 2px solid #b49137;
          color: #102a43;
          font-weight: 900;
        }

        .total-label {
          text-align: right;
          letter-spacing: 1px;
        }

        .total-value {
          color: #997629 !important;
          font-size: 12px !important;
          text-align: center !important;
        }

        .certificate-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 9px 13px;
          border: 1px solid #e7d9b3;
          background: #faf8f0;
        }

        .summary-item span {
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .summary-item strong {
          color: #997629;
          font-size: 15px;
          font-weight: 900;
        }

        .certificate-footer {
          display: grid;
          grid-template-columns: 1fr 110px 1fr;
          align-items: end;
          gap: 20px;
          margin-top: auto;
          padding: 18px 25px 5px;
        }

        .footer-signature,
        .footer-date {
          text-align: center;
        }

        .signature-line {
          width: 150px;
          max-width: 100%;
          height: 1px;
          background: #a88736;
          margin: 0 auto 7px;
        }

        .footer-signature p,
        .footer-date p {
          font-family: Georgia, serif;
          font-size: 11px;
          font-weight: 700;
          color: #102a43;
          margin: 0 0 3px;
        }

        .footer-signature span,
        .footer-date span {
          color: #64748b;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .8px;
        }

        .certificate-seal {
          width: 76px;
          height: 76px;
          margin: 0 auto;
          border: 2px solid #b49137;
          outline: 1px solid #b49137;
          outline-offset: 4px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #997629;
          background: #fffdf6;
        }

        .certificate-seal span {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .certificate-seal small {
          font-size: 5px;
          letter-spacing: .5px;
          margin-top: 2px;
        }

        .certificate-bottom-text {
          text-align: center;
          font-size: 7px;
          letter-spacing: 1.5px;
          color: #a88736;
          font-weight: 800;
          margin-top: 15px;
        }

        @media (max-width: 750px) {
          .certificate-page {
            padding: 12px;
          }

          .official-certificate {
            padding: 7px;
          }

          .certificate-inner-border {
            padding: 20px 14px;
          }

          .university-name {
            font-size: 19px;
          }

          .certificate-title {
            font-size: 21px;
            letter-spacing: 2px;
          }

          .student-details {
            grid-template-columns: repeat(2, 1fr);
          }

          .certificate-footer {
            gap: 8px;
            padding-left: 0;
            padding-right: 0;
          }

          .student-name {
            font-size: 23px;
          }

          .toolbar-button {
            padding: 9px 11px;
            font-size: 11px;
          }
        }

        @page {
          size: A4 landscape;
          margin: 0;
        }

        @media print {
          html,
          body,
          #root {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .certificate-page,
          .certificate-page * {
            visibility: visible !important;
          }

          .certificate-toolbar {
            display: none !important;
          }

          .certificate-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          .official-certificate {
            width: 100% !important;
            height: 200mm !important;
            min-height: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 2mm !important;
            border: 2px solid #a88736 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }

          .certificate-inner-border {
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            padding: 4mm 10mm 3mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .university-logo {
            width: 19mm !important;
            height: 19mm !important;
            margin-bottom: 1mm !important;
          }

          .university-name {
            font-size: 19pt !important;
          }

          .university-subtitle {
            font-size: 7pt !important;
            margin-top: 1mm !important;
          }

          .header-divider {
            margin: 2mm auto !important;
          }

          .certificate-title {
            font-size: 21pt !important;
            margin: 1mm 0 !important;
          }

          .certificate-description {
            font-size: 7pt !important;
          }

          .certificate-presentation {
            margin-top: 3mm !important;
          }

          .presented-text {
            font-size: 10pt !important;
          }

          .student-name {
            font-size: 23pt !important;
            margin: 1mm 0 !important;
          }

          .completion-text {
            font-size: 8pt !important;
            margin-top: 2mm !important;
          }

          .student-details {
            margin: 3mm 0 !important;
            padding: 2mm 3mm !important;
            gap: 3mm !important;
          }

          .detail-label {
            font-size: 6pt !important;
          }

          .detail-item strong {
            font-size: 7pt !important;
          }

          .detail-item svg {
            width: 12px !important;
            height: 12px !important;
          }

          .courses-heading {
            margin-bottom: 2mm !important;
          }

          .courses-heading h3 {
            font-size: 8pt !important;
          }

          .certificate-table th {
            padding: 1.5mm 2mm !important;
            font-size: 7pt !important;
          }

          .certificate-table td {
            padding: 1.1mm 2mm !important;
            font-size: 7pt !important;
            line-height: 1.1 !important;
          }

          .course-grade {
            padding: 1mm 2mm !important;
            font-size: 7pt !important;
          }

          .total-row td {
            padding: 1.5mm 2mm !important;
          }

          .certificate-summary {
            margin-top: 2mm !important;
            gap: 3mm !important;
          }

          .summary-item {
            padding: 1.5mm 3mm !important;
          }

          .summary-item span {
            font-size: 6pt !important;
          }

          .summary-item strong {
            font-size: 9pt !important;
          }

          .certificate-footer {
            margin-top: auto !important;
            padding: 3mm 10mm 1mm !important;
          }

          .certificate-seal {
            width: 17mm !important;
            height: 17mm !important;
          }

          .certificate-bottom-text {
            margin-top: 2mm !important;
            font-size: 6pt !important;
          }

          .footer-signature p,
          .footer-date p {
            font-size: 8pt !important;
          }

          .footer-signature span,
          .footer-date span {
            font-size: 6pt !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
};

export default IssuedCertificates;
