import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, AcademicYear } from '../types';
import { generateAccessCode } from './accessCodeGenerator';

export interface CSVImportResult {
  learners: Partial<Learner>[];
  errors: string[];
}

export function parseCSVFile(
  file: File,
  eventId: string,
  existingCodes: Set<string>
): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const learners: Partial<Learner>[] = [];
        const errors: string[] = [];

        const normalizeHeader = (h: string) => (h ? h.trim().toLowerCase() : '');

        results.data.forEach((row: any, index: number) => {
          const rawHeaders = Object.keys(row);
          const headerMap = new Map(rawHeaders.map(h => [normalizeHeader(h), h]));

          const nameKey = headerMap.get('name') || headerMap.get('full name') || headerMap.get('learner name') || headerMap.get('participant name') || headerMap.get('full name');
          const name = nameKey ? String(row[nameKey]).trim() : '';

          const emailKey = headerMap.get('email') || headerMap.get('email id') || headerMap.get('email address') || headerMap.get('contact email') || headerMap.get('email addresses');
          const email = emailKey ? String(row[emailKey]).trim() : '';

          const phoneKey = headerMap.get('phone') || headerMap.get('phone number') || headerMap.get('mobile') || headerMap.get('contact') || headerMap.get('mobile number') || headerMap.get('phone no');
          const phone = phoneKey ? String(row[phoneKey]).trim() : '';

          const deptKey = headerMap.get('department') || headerMap.get('dept') || headerMap.get('branch') || headerMap.get('course') || headerMap.get('major') || headerMap.get('program') || headerMap.get('specialization') || 'General';
          const department = deptKey ? String(row[deptKey]).trim() : 'General';

          let rawYear = row['Academic Year'] || row['Year'] || row['Year of Study'] || '1st Year';
          let academic_year: AcademicYear = '1st Year';

          if (String(rawYear).includes('4') || String(rawYear).toLowerCase().includes('fourth')) {
            academic_year = '4th Year';
          } else if (String(rawYear).includes('3') || String(rawYear).toLowerCase().includes('third')) {
            academic_year = '3rd Year';
          } else if (String(rawYear).includes('2') || String(rawYear).toLowerCase().includes('second')) {
            academic_year = '2nd Year';
          }

          if (!name) {
            errors.push(`Row ${index + 1}: Missing learner name`);
            return;
          }

          const code = generateAccessCode(existingCodes);
          existingCodes.add(code);

          learners.push({
            id: `l_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            event_id: eventId,
            access_code: code,
            full_name: String(name).trim(),
            email: String(email).trim(),
            phone: String(phone).trim(),
            department: String(department).trim(),
            academic_year,
            day1_checked_in: false,
            day2_checked_in: false,
            created_at: new Date().toISOString()
          });
        });

        resolve({ learners, errors });
      },
      error: (err) => {
        resolve({ learners: [], errors: [err.message] });
      }
    });
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