import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, AcademicYear, BenchType } from '../types';
import { generateAccessCode } from './accessCodeGenerator';
import { TN_CONSTITUENCIES } from '../data/tnConstituencies';

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

function normalizeBench(val: string): BenchType | undefined {
  if (!val) return undefined;
  const s = val.trim().toLowerCase();
  if (s.includes('ruling') || s === 'treasury') return 'Ruling';
  if (s.includes('opp') || s.includes('opposition')) return 'Opposition';
  if (s.includes('indep') || s.includes('independent') || s === 'neutral') return 'Independent';
  return undefined;
}

function processRows(rows: any[], eventId: string, existingCodes: Set<string>): CSVImportResult {
  const learners: Partial<Learner>[] = [];
  const errors: string[] = [];

  const normalizeHeader = (h: string) =>
    h ? h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

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
      'delegatename', 'candidatename', 'firstname', 'nameofstudent',
      'studentsname', 'nameofthestudent', 'student', 'participant', 'delegate',
      'candidate', 'fullnameofstudent', 'nameofparticipant', 'nameofdelegate'
    ]);

    const email = findField([
      'email', 'emailid', 'emailaddress', 'contactemail', 'mail', 'studentemail',
      'studentsemail', 'mailid', 'useremail'
    ]);

    const phone = findField([
      'phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact',
      'contactnumber', 'phoneno', 'mobileno', 'whatsapp', 'cell',
      'whatsappnumber', 'whatsappno', 'cellnumber', 'contactno'
    ]);

    const department = findField([
      'department', 'dept', 'branch', 'course', 'major',
      'program', 'programme', 'specialization', 'stream', 'degree',
      'branchdept', 'coursename'
    ]) || 'General';

    const yearVal = findField([
      'academicyear', 'year', 'yearofstudy', 'studyingyear',
      'currentyear', 'class', 'batch', 'yr', 'std', 'semester', 'sem',
      'classyear', 'yearsem'
    ]);

    const academic_year = parseAcademicYear(yearVal);

    if (!name) {
      errors.push(`Row ${index + 1}: Missing delegate name`);
      return;
    }

    // Access code: use provided or generate
    const rawCode = findField(['accesscode', 'code', 'delegatecode', 'studentcode', 'passcode']);
    let code = rawCode ? rawCode.toUpperCase().trim() : '';
    if (!code || existingCodes.has(code)) {
      code = generateAccessCode(existingCodes);
    }
    existingCodes.add(code);

    // Constituency parsing
    const rawConstNum = findField([
      'constituencynumber', 'constituencyno', 'constno', 'constituency',
      'seatnumber', 'seatno', 'constnum', 'acno', 'acnumber', 'const', 'constituencyn'
    ]);
    const numDigits = rawConstNum.match(/\d+/);
    let parsedConstNo: number | undefined = numDigits ? parseInt(numDigits[0], 10) : undefined;

    let rawConstName = findField([
      'constituencyname', 'constituency', 'tnconstituencyname', 'constname',
      'seatname', 'constituencyseat', 'constituencyseatname'
    ]);

    let district = findField(['district', 'tndistrict', 'districtname']);

    // Cross-reference with TN_CONSTITUENCIES
    if (parsedConstNo !== undefined && (!rawConstName || rawConstName === String(parsedConstNo))) {
      const match = TN_CONSTITUENCIES.find(c => c.number === parsedConstNo);
      if (match) {
        rawConstName = match.name;
        if (!district) district = match.district;
      }
    } else if (rawConstName && parsedConstNo === undefined) {
      // Check if format like "1 - Gummidipoondi"
      const prefixMatch = rawConstName.match(/^(\d+)\s*[-:]\s*(.+)$/);
      if (prefixMatch) {
        parsedConstNo = parseInt(prefixMatch[1], 10);
        rawConstName = prefixMatch[2].trim();
      }
      const cleanName = rawConstName.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
      const match = TN_CONSTITUENCIES.find(
        c => c.name.toLowerCase() === cleanName || c.name.toLowerCase().includes(cleanName)
      );
      if (match) {
        parsedConstNo = parsedConstNo || match.number;
        rawConstName = rawConstName || match.name;
        if (!district) district = match.district;
      }
    } else if (parsedConstNo !== undefined && rawConstName) {
      const match = TN_CONSTITUENCIES.find(c => c.number === parsedConstNo);
      if (match && !district) {
        district = match.district;
      }
    }

    // Party & Bench parsing
    const party_name = findField([
      'partyassignment', 'party', 'politicalparty', 'partyname',
      'assignedparty', 'partyassigned', 'partyallocated'
    ]);

    const rawBench = findField(['bench', 'benchassignment', 'side', 'rulingopposition', 'benchtype']);
    let bench = normalizeBench(rawBench);

    // If bench not explicitly given, infer from party_name
    if (!bench && party_name) {
      const pLower = party_name.toLowerCase();
      if (pLower.includes('ruling') || pLower === 'party 1' || pLower.startsWith('party 1')) {
        bench = 'Ruling';
      } else if (pLower.includes('opposition') || pLower.includes('opp') || pLower === 'party 2' || pLower.startsWith('party 2')) {
        bench = 'Opposition';
      } else if (pLower.includes('independent')) {
        bench = 'Independent';
      }
    }

    // Legislative Role
    const rawRole = findField([
      'role', 'legislativerole', 'cabinetrole', 'designation',
      'position', 'parliamentaryrole', 'cabinet'
    ]);
    const role = rawRole || 'Member of Legislative Assembly (MLA)';

    // Committee
    const committee_name = findField([
      'committee', 'committeename', 'assignedcommittee', 'committeegroup'
    ]);

    learners.push({
      id: `l_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      access_code: code,
      full_name: name,
      email: email,
      phone: phone,
      department: department,
      academic_year,
      constituency_number: parsedConstNo,
      constituency_name: rawConstName || undefined,
      district: district || undefined,
      party_name: party_name || undefined,
      bench: bench || undefined,
      role: role,
      committee_name: committee_name || undefined,
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

export function exportAllocationTemplateCSV() {
  const sampleAllocation = [
    {
      'Student Name': 'V. vishnu',
      'Constituency Number': 1,
      'Party Assignment': 'Party 1',
      'Constituency Name': 'Gummidipoondi',
      'Bench': 'Ruling',
      'Role': 'Member of Legislative Assembly (MLA)',
      'Academic Year': '3rd Year',
      'Department': 'Computer Science'
    },
    {
      'Student Name': 'R. Janani',
      'Constituency Number': 4,
      'Party Assignment': 'Party 2',
      'Constituency Name': 'Thiruvallur',
      'Bench': 'Opposition',
      'Role': 'Member of Legislative Assembly (MLA)',
      'Academic Year': '2nd Year',
      'Department': 'Electronics & Comm'
    },
    {
      'Student Name': 'K. Karthik',
      'Constituency Number': 11,
      'Party Assignment': 'Party 1',
      'Constituency Name': 'Dr. Radhakrishnan Nagar',
      'Bench': 'Ruling',
      'Role': 'Chief Minister',
      'Academic Year': '4th Year',
      'Department': 'Mechanical'
    },
    {
      'Student Name': 'S. Priya',
      'Constituency Number': 13,
      'Party Assignment': 'Party 2',
      'Constituency Name': 'Kolathur',
      'Bench': 'Opposition',
      'Role': 'Leader of the Opposition',
      'Academic Year': '4th Year',
      'Department': 'Civil'
    }
  ];

  const csv = Papa.unparse(sampleAllocation);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'TN_Assembly_PreAllocated_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
