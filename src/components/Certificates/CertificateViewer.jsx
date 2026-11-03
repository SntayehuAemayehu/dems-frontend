
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { buildCourseGrades, letterGrade, normalizeResultList } from '../../utils/courseGrades';

const CertificateViewer = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [studentInfo, setStudentInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []); // eslint-disable-line

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const [studentGradesResponse, examsResponse, assignmentsResponse] = await Promise.all([
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
      setCertificates(grades.map((course) => ({
        ...course,
        id: course.course_id ?? course.course_code,
        grade: course.letter,
      })));

    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalMarks = certificates.reduce((sum, course) => sum + course.total, 0);
  const overallGrade = certificates.length ? letterGrade(totalMarks).letter : '—';

  if (loading) {
    return (
      <div className="certificate-loading">
        <div className="loading-spinner"></div>
        <p>Loading your academic transcript...</p>

        <style>{`
          .certificate-loading {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #64748b;
            gap: 15px;
          }

          .loading-spinner {
            width: 42px;
            height: 42px;
            border: 4px solid #e2e8f0;
            border-top-color: #1e3a8a;
            border-radius: 50%;
            animation: certificate-spin 1s linear infinite;
          }

          @keyframes certificate-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="certificate-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .certificate-page {
          max-width: 1050px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #1e293b;
        }

        .certificate-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .certificate-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 16px;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s;
        }

        .back-button {
          background: #f1f5f9;
          color: #334155;
        }

        .refresh-button {
          background: #eff6ff;
          color: #1e40af;
        }

        .print-button {
          background: #1e3a8a;
          color: white;
        }

        .certificate-toolbar button:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .premium-cert-wrapper {
          position: relative;
          background: #ffffff;
          border: 2px solid #1e3a8a;
          outline: 5px solid #e2e8f0;
          outline-offset: -9px;
          border-radius: 4px;
          padding: 24px 35px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          font-family: Georgia, serif;
        }

        .watermark {
          position: absolute;
          width: 250px;
          height: 250px;
          object-fit: contain;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.035;
          pointer-events: none;
          z-index: 0;
        }

        .cert-content {
          position: relative;
          z-index: 1;
        }

        .cert-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }

        .cert-logo img {
          height: 58px;
          max-width: 120px;
          object-fit: contain;
        }

        .cert-header-text {
          color: #0f172a;
          font-size: 20px;
          font-weight: bold;
          margin: 3px 0;
          letter-spacing: 1.5px;
          text-align: center;
          text-transform: uppercase;
        }

        .cert-title {
          color: #1e3a8a;
          font-size: 25px;
          font-style: italic;
          font-weight: bold;
          margin: 8px 0 13px;
          text-align: center;
        }

        .cert-title::after {
          content: '';
          display: block;
          width: 110px;
          height: 2px;
          background: #cbd5e1;
          margin: 7px auto 0;
        }

        .cert-body {
          color: #475569;
          font-size: 12px;
          margin: 4px 0;
          text-align: center;
          font-style: italic;
        }

        .cert-name {
          color: #0f172a;
          font-size: 21px;
          font-weight: bold;
          margin: 6px 0 12px;
          text-align: center;
          letter-spacing: 0.5px;
          overflow-wrap: anywhere;
        }

        .cert-details-strip {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px 30px;
          font-size: 10px;
          color: #475569;
          margin-bottom: 13px;
          padding: 9px 5px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-container {
          margin: 0 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: visible;
        }

        .cert-details-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .cert-details-table th {
          background: #1e3a8a;
          color: white;
          padding: 7px 8px;
          font-size: 10px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          text-align: left;
        }

        .cert-details-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          color: #1e293b;
          overflow-wrap: anywhere;
        }

        .cert-details-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .cert-details-table tbody tr:last-child td {
          border-bottom: none;
        }

        .cert-details-table th:nth-child(1),
        .cert-details-table td:nth-child(1) {
          width: 20%;
        }

        .cert-details-table th:nth-child(2),
        .cert-details-table td:nth-child(2) {
          width: 48%;
        }

        .cert-details-table th:nth-child(3),
        .cert-details-table td:nth-child(3) {
          width: 14%;
          text-align: center;
        }

        .cert-details-table th:nth-child(4),
        .cert-details-table td:nth-child(4) {
          width: 18%;
          text-align: center;
        }

        .grade-pass {
          color: #15803d !important;
          font-weight: bold;
        }

        .grade-fail {
          color: #dc2626 !important;
          font-weight: bold;
        }

        .cert-summary-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: #f1f5f9;
          border-left: 4px solid #1e3a8a;
          margin-bottom: 20px;
          border-radius: 3px;
        }

        .summary-label {
          margin: 0;
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .summary-value {
          margin: 3px 0 0;
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
        }

        .summary-cgpa {
          color: #1e3a8a;
          font-size: 19px;
        }

        .cert-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          padding: 0 10px;
          margin-top: 12px;
        }

        .signature-block {
          text-align: center;
          min-width: 125px;
        }

        .signature-line {
          border-top: 1px solid #64748b;
          width: 125px;
          margin-bottom: 5px;
        }

        .signature-title {
          font-size: 9px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .seal {
          width: 65px;
          height: 65px;
          border: 1.5px dashed #94a3b8;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 8px;
          text-transform: uppercase;
          text-align: center;
          transform: rotate(-10deg);
        }

        .issued-date {
          margin: 15px 0 0;
          font-size: 9px;
          color: #94a3b8;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .empty-courses {
          padding: 15px;
          text-align: center;
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 600px) {
          .certificate-page {
            padding: 10px;
          }

          .premium-cert-wrapper {
            padding: 20px 12px;
          }

          .cert-header-text {
            font-size: 16px;
          }

          .cert-title {
            font-size: 21px;
          }

          .cert-details-strip {
            gap: 8px;
            flex-direction: column;
            align-items: center;
          }

          .cert-footer {
            padding: 0;
            gap: 5px;
          }

          .signature-block {
            min-width: 90px;
          }

          .signature-line {
            width: 90px;
          }

          .cert-details-table th,
          .cert-details-table td {
            padding: 5px 3px;
            font-size: 9px;
          }
        }

        @media print {

          @page {
            size: A4 portrait;
            margin: 7mm;
          }

          html,
          body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .certificate-page,
          .certificate-page * {
            visibility: visible !important;
          }

          .certificate-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .certificate-toolbar {
            display: none !important;
          }

          .premium-cert-wrapper {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 12mm 10mm !important;
            border: 1.5px solid #1e3a8a !important;
            outline: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            transform: none !important;
          }

          .watermark {
            width: 180px !important;
            height: 180px !important;
          }

          .cert-logo img {
            height: 45px !important;
          }

          .cert-header-text {
            font-size: 17px !important;
            margin: 2px 0 !important;
          }

          .cert-title {
            font-size: 21px !important;
            margin: 5px 0 9px !important;
          }

          .cert-body {
            font-size: 10px !important;
          }

          .cert-name {
            font-size: 17px !important;
            margin: 4px 0 8px !important;
          }

          .cert-details-strip {
            gap: 20px !important;
            font-size: 9px !important;
            margin-bottom: 8px !important;
            padding: 6px !important;
          }

          .table-container {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            margin-bottom: 9px !important;
            break-inside: auto !important;
          }

          .cert-details-table {
            width: 100% !important;
            font-size: 9px !important;
          }

          .cert-details-table th {
            padding: 5px !important;
            font-size: 9px !important;
          }

          .cert-details-table td {
            padding: 4px 5px !important;
            font-size: 9px !important;
          }

          .cert-details-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .cert-summary-box {
            padding: 7px 12px !important;
            margin-bottom: 12px !important;
            break-inside: avoid !important;
          }

          .summary-label {
            font-size: 8px !important;
          }

          .summary-value {
            font-size: 13px !important;
          }

          .summary-cgpa {
            font-size: 16px !important;
          }

          .cert-footer {
            margin-top: 8px !important;
            break-inside: avoid !important;
          }

          .signature-line {
            width: 110px !important;
          }

          .signature-title {
            font-size: 8px !important;
          }

          .seal {
            width: 55px !important;
            height: 55px !important;
            font-size: 7px !important;
          }

          .issued-date {
            margin-top: 9px !important;
            font-size: 8px !important;
          }
        }

      `}</style>

      {/* Toolbar */}
      <div className="certificate-toolbar">

        <button
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>

          <button
            className="refresh-button"
            onClick={fetchCertificates}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            className="print-button"
            onClick={handlePrint}
          >
            <Printer size={15} />
            Print Transcript
          </button>

        </div>

      </div>

      {/* Certificate */}
      <div className="premium-cert-wrapper">

        <img
          src="/Mekdela_Amba_University_logo.jpg"
          alt=""
          className="watermark"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        <div className="cert-content">

          {/* University Logo */}
          <div className="cert-logo">
            <img
              src="/Mekdela_Amba_University_logo.jpg"
              alt="Mekdela Amba University Logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* University Header */}
          <h3 className="cert-header-text">
            MEKDELA AMBA UNIVERSITY
          </h3>

          <h1 className="cert-title">
            Official Transcript
          </h1>

          {/* Student Information */}
          <div style={{ textAlign: 'center' }}>

            <p className="cert-body">
              This is to certify that
            </p>

            <p className="cert-name">
              {studentInfo.name}
            </p>

          </div>

          <div className="cert-details-strip">

            <span>
              <b>Student ID:</b> {studentInfo.id}
            </span>

            <span>
              <b>Department:</b> {studentInfo.department}
            </span>

            <span>
              <b>Year:</b> {studentInfo.year}
            </span>

            <span>
              <b>Semester:</b> {studentInfo.semester}
            </span>

          </div>

          {/* Courses Table */}
          <div className="table-container">

            <table className="cert-details-table">

              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>

              <tbody>

                {certificates.length > 0 ? (
                  certificates.map((cert) => (

                    <tr key={cert.id}>

                      <td style={{ fontWeight: '600' }}>
                        {cert.course_code}
                      </td>

                      <td>
                        {cert.course_title}
                      </td>

                      <td style={{ fontWeight: 'bold' }}>
                        {cert.total}
                      </td>

                      <td className={
                        cert.grade === 'F'
                          ? 'grade-fail'
                          : 'grade-pass'
                      }>
                        {cert.grade}
                      </td>

                    </tr>

                  ))
                ) : (

                  <tr>
                    <td colSpan="4" className="empty-courses">
                      No course grades are available yet.
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* Academic Summary */}
          <div className="cert-summary-box">

            <div>

              <p className="summary-label">
                Total Marks (All Courses)
              </p>

              <p className="summary-value">
                {totalMarks}
              </p>

            </div>

            <div style={{ textAlign: 'right' }}>

              <p className="summary-label">
                Overall Letter Grade
              </p>

              <p className="summary-value summary-cgpa">
                {overallGrade}
              </p>

            </div>

          </div>

          {/* Signatures and Seal */}
          <div className="cert-footer">

            <div className="signature-block">

              <div className="signature-line"></div>

              <div className="signature-title">
                Dean of Students
              </div>

            </div>

            <div className="seal">

              <CheckCircle
                size={20}
                style={{ marginBottom: '3px' }}
              />

              Official
              <br />
              Seal

            </div>

            <div className="signature-block">

              <div className="signature-line"></div>

              <div className="signature-title">
                Registrar
              </div>

            </div>

          </div>

          {/* Issue Date */}
          <p className="issued-date">
            Issued on: {new Date().toLocaleDateString()}
          </p>

        </div>

      </div>

    </div>
  );
};

export default CertificateViewer;
