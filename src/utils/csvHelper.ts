import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, AcademicYear } from '../types';
import { generateAccessCode } from './accessCodeGenerator';

export interface CSVImportResult {
  learners: Partial<Learner>[];
  errors: string[];
}

export function parseAcademicYear(val: any): AcademicYear {
  if (!val) return '1st Year';
  const str = String(val).trim().toLowerCase();
  
  if (
    str.includes('4th') ||
    str.includes('fourth') ||
    str.includes('final') ||
    str.includes('iv') ||
    str === '4' ||
    str === 'iv year' ||
    str === 'fourth year' ||
    str.startsWith('4') ||
    str.includes('senior')
  ) {
    return '4th Year';
  }
  if (
    str.includes('3rd') ||
    str.includes('third') ||
    str.includes('iii') ||
    str === '3' ||
    str === 'iii year' ||
    str === 'third year' ||
    str.startsWith('3') ||
    str.includes('junior')
  ) {
    return '3rd Year';
  }
  if (
    str.includes('2nd') ||
    str.includes('second') ||
    str.includes('ii') ||
    str === '2' ||
    str === 'ii year' ||
    str === 'second year' ||
    str.startsWith('2') ||
    str.includes('sophomore')
  ) {
    return '2nd Year';
  }
  if (
    str.includes('1st') ||
    str.includes('first') ||
    str.includes('i') ||
    str === '1' ||
    str === 'i year' ||
    str === 'first year' ||
    str.startsWith('1') ||
    str.includes('freshman')
  ) {
    return '1st Year';
  }
  return '1st Year';
}

function processRows(rows: any[], eventId: string, existingCodes: Set<string>): CSVImportResult {
  const learners: Partial<Learner>[] = [];
  const errors: string[] = [];

  const normalizeHeader = (h: string) =>
    h ? h.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  rows.forEach((row: any, index: number) => {
    const rawHeaders = Object.keys(row);
    const headerMap = new Map(rawHeaders.map(h => [normalizeHeader(h), h]));

    // Find Best Matching Column
    const findField = (aliases: string[]): string => {
      for (const alias of aliases) {
        const norm = normalizeHeader(alias);
        const actualKey = headerMap.get(norm);
        if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) {
          const val = String(row[actualKey]).trim();
          if (val) return val;
        }
      }
      return '';
    };

    const name = findField([
      'fullname', 'name', 'studentname', 'learnername', 'participantname',
      'delegatename', 'candidatename', 'firstname', 'nameofstudent'
    ]);

    const email = findField([
      'email', 'emailid', 'emailaddress', 'contactemail', 'mail', 'studentemail'
    ]);

    const phone = findField([
      'phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact',
      'contactnumber', 'phoneno', 'mobileno', 'whatsapp', 'cell'
    ]);

    const department = findField([
      'department', 'dept', 'branch', 'course', 'major',
      'program', 'programme', 'specialization', 'stream', 'degree'
    ]) || 'General';

    const yearVal = findField([
      'academicyear', 'year', 'yearofstudy', 'studyingyear',
      'currentyear', 'class', 'batch', 'yr', 'std', 'semester', 'sem'
    ]);

    const academic_year = parseAcademicYear(yearVal);

    if (!name) {
      errors.push(`Row ${index + 1}: Missing delegate name`);
      return;
    }

    const code = generateAccessCode(existingCodes);
    existingCodes.add(code);

    learners.push({
      id: `l_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      access_code: code,
      full_name: name,
      email: email,
      phone: phone,
      department: department,
      academic_year,
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString()
    });
  });

  return { learners, errors };
}

export function parseCSVFile(
  file: File,
  eventId: string,
  existingCodes: Set<string>
): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const result = processRows(jsonData, eventId, existingCodes);
          resolve(result);
        } catch (err: any) {
          resolve({ learners: [], errors: [`Excel parse error: ${err.message}`] });
        }
      };
      reader.onerror = () => resolve({ learners: [], errors: ['Failed to read Excel file'] });
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const result = processRows(results.data, eventId, existingCodes);
          resolve(result);
        },
        error: (err) => {
          resolve({ learners: [], errors: [err.message] });
        }
      });
    }
  });
}

export function exportFullParticipantDataToExcel(learners: Learner[], eventName: string = 'TN_Assembly') {
  const exportData = learners.map((l, index) => ({
    'S.No': index + 1,
    'Access Code': l.access_code,
    'Learner Name': l.full_name,
    'Email ID': l.email || 'N/A',
    'Phone Number': l.phone || 'N/A',
    'Department': l.department || 'N/A',
    'Academic Year': l.academic_year || '1st Year',
    'Bench': l.bench || 'Unallocated',
    'Political Party': l.party_name || 'Unallocated',
    'Legislative Role': l.role || 'Unallocated',
    'Const. No.': l.constituency_number || 'N/A',
    'TN Constituency Name': l.constituency_name || 'Unallocated',
    'Committee': l.committee_name || 'Unallocated',
    'Day 1 Check-in': l.day1_checked_in ? 'Checked In' : 'Not Checked In',
    'Day 2 Check-in': l.day2_checked_in ? 'Checked In' : 'Not Checked In'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

  // Auto column width formatting
  const max_widths = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Access Code
    { wch: 24 }, // Learner Name
    { wch: 26 }, // Email
    { wch: 15 }, // Phone
    { wch: 20 }, // Dept
    { wch: 14 }, // Year
    { wch: 14 }, // Bench
    { wch: 28 }, // Party
    { wch: 30 }, // Role
    { wch: 10 }, // Const No
    { wch: 30 }, // Constituency Name
    { wch: 28 }, // Committee
    { wch: 16 }, // Day 1
    { wch: 16 }  // Day 2
  ];
  worksheet['!cols'] = max_widths;

  const fileName = `${eventName.replace(/\s+/g, '_')}_Full_Participant_Roster.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportFullParticipantDataToCSV(learners: Learner[], eventName: string = 'TN_Assembly') {
  const exportData = learners.map((l, index) => ({
    'S.No': index + 1,
    'Access Code': l.access_code,
    'Learner Name': l.full_name,
    'Email ID': l.email || '',
    'Phone Number': l.phone || '',
    'Department': l.department || '',
    'Academic Year': l.academic_year || '1st Year',
    'Bench': l.bench || '',
    'Political Party': l.party_name || '',
    'Legislative Role': l.role || '',
    'Const. No.': l.constituency_number || '',
    'TN Constituency Name': l.constituency_name || '',
    'Committee': l.committee_name || '',
    'Day 1 Check-in': l.day1_checked_in ? 'Checked In' : 'Not Checked In',
    'Day 2 Check-in': l.day2_checked_in ? 'Checked In' : 'Not Checked In'
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${eventName.replace(/\s+/g, '_')}_Full_Roster.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}