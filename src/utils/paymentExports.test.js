import * as XLSX from 'xlsx';
import { createPaymentExportBlob, getPaymentExportRows } from './paymentExports';

const payment = {
  transaction_id: 'TXN-1',
  student_name: 'Student "One"',
  student_id: 'S-1',
  amount: 1250,
  bank_name: 'Example Bank',
  payment_type: 'SEMESTER',
  status: 'VERIFIED',
  uploaded_at: '2026-10-12T10:00:00Z',
  verified_by: 'Finance User',
  rejection_reason: '',
  is_rolled_back: false,
  rollback_reason: '',
};

const readBlob = (blob, method) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader[method](blob);
});

describe('payment exports', () => {
  it('keeps payment fields and numeric amounts in the exported rows', () => {
    expect(getPaymentExportRows([payment])).toEqual([{
      'Transaction ID': 'TXN-1',
      'Student Name': 'Student "One"',
      'Student ID': 'S-1',
      Amount: 1250,
      Bank: 'Example Bank',
      'Payment Type': 'SEMESTER',
      Status: 'VERIFIED',
      'Date Uploaded': '2026-10-12T10:00:00Z',
      'Verified By': 'Finance User',
      'Rejection Reason': '',
      'Rolled Back': 'No',
      'Rollback Reason': '',
    }]);
  });

  it('creates properly escaped CSV data', async () => {
    const blob = createPaymentExportBlob([payment], 'csv');
    const text = await readBlob(blob, 'readAsText');

    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(text).toContain('"Student Name"');
    expect(text).toContain('"Student ""One"""');
    expect(text).toContain('"1250"');
  });

  it('creates an XLSX workbook with the payment values', async () => {
    const blob = createPaymentExportBlob([payment], 'xlsx');
    const data = await readBlob(blob, 'readAsArrayBuffer');
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets.Payments;

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(sheet.A1.v).toBe('Transaction ID');
    expect(sheet.B2.v).toBe('Student "One"');
    expect(sheet.D2.v).toBe(1250);
  });

  it('creates a valid PDF document and rejects unknown formats', async () => {
    const blob = createPaymentExportBlob([payment], 'pdf');
    const pdf = await readBlob(blob, 'readAsText');

    expect(blob.type).toBe('application/pdf');
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(() => createPaymentExportBlob([payment], 'json')).toThrow('Unsupported payment export format');
  });
});
