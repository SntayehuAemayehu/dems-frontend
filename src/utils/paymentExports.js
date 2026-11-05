import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PAYMENT_COLUMNS = [
  { header: 'Transaction ID', key: 'transaction_id' },
  { header: 'Student Name', key: 'student_name' },
  { header: 'Student ID', key: 'student_id' },
  { header: 'Amount', key: 'amount' },
  { header: 'Bank', key: 'bank_name' },
  { header: 'Payment Type', key: 'payment_type' },
  { header: 'Status', key: 'status' },
  { header: 'Date Uploaded', key: 'uploaded_at' },
  { header: 'Verified By', key: 'verified_by' },
  { header: 'Rejection Reason', key: 'rejection_reason' },
  { header: 'Rolled Back', key: 'is_rolled_back' },
  { header: 'Rollback Reason', key: 'rollback_reason' },
];

export const getPaymentExportRows = (payments) => payments.map((payment) => ({
  'Transaction ID': payment.transaction_id ?? '',
  'Student Name': payment.student_name ?? '',
  'Student ID': payment.student_id ?? '',
  Amount: Number.isFinite(Number(payment.amount)) ? Number(payment.amount) : '',
  Bank: payment.bank_name ?? '',
  'Payment Type': payment.payment_type ?? '',
  Status: payment.status ?? '',
  'Date Uploaded': payment.uploaded_at ?? '',
  'Verified By': payment.verified_by ?? '',
  'Rejection Reason': payment.rejection_reason ?? '',
  'Rolled Back': payment.is_rolled_back ? 'Yes' : 'No',
  'Rollback Reason': payment.rollback_reason ?? '',
}));

const createCsvBlob = (rows) => {
  const headers = PAYMENT_COLUMNS.map(({ header }) => header);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ].join('\r\n');

  return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
};

const createExcelBlob = (rows) => {
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: PAYMENT_COLUMNS.map(({ header }) => header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const createPdfBlob = (rows) => {
  const document = new jsPDF({ orientation: 'landscape' });
  const headers = PAYMENT_COLUMNS.map(({ header }) => header);
  const body = rows.map((row) => headers.map((header) => String(row[header] ?? '')));

  document.setFontSize(14);
  document.text('Payment Records', 14, 16);
  autoTable(document, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: [0, 1],
  });

  return document.output('blob');
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const createPaymentExportBlob = (payments, format) => {
  if (!['csv', 'xlsx', 'pdf'].includes(format)) {
    throw new Error(`Unsupported payment export format: ${format}`);
  }

  const rows = getPaymentExportRows(payments);
  return {
    csv: createCsvBlob,
    xlsx: createExcelBlob,
    pdf: createPdfBlob,
  }[format](rows);
};

export const downloadPaymentExport = (payments, format) => {
  const blob = createPaymentExportBlob(payments, format);
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `payments-${date}.${format}`);
};
