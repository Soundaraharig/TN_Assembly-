import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, AcademicYear, BenchType, Party, Committee } from '../types';
import { generateAccessCode } from './accessCodeGenerator';
import { getResolvedPartyName, getResolvedCommitteeName } from '../services/storageService';

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

    // Check if column exists in the uploaded sheet
    const hasField = (aliases: string[]): boolean =>
      aliases.some(a => headerMap.has(normalizeHeader(a)));

    // Find Best Matching Column value
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

    const nameAliases = [
      'fullname', 'name', 'studentname', 'learnername', 'participantname',
      'delegatename', 'candidatename', 'firstname', 'nameofstudent',
      'studentsname', 'nameofthestudent', 'student', 'participant', 'delegate',
      'candidate', 'fullnameofstudent', 'nameofparticipant', 'nameofdelegate'
    ];
    const name = findField(nameAliases);

    const emailAliases = [
      'email', 'emailid', 'emailaddress', 'contactemail', 'mail', 'studentemail',
      'studentsemail', 'mailid', 'useremail'
    ];
    const email = hasField(emailAliases) ? findField(emailAliases) : undefined;

    const phoneAliases = [
      'phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact',
      'contactnumber', 'phoneno', 'mobileno', 'whatsapp', 'cell',
      'whatsappnumber', 'whatsappno', 'cellnumber', 'contactno'
    ];
    const phone = hasField(phoneAliases) ? findField(phoneAliases) : undefined;

    const deptAliases = [
      'department', 'dept', 'branch', 'course', 'major',
      'program', 'programme', 'specialization', 'stream', 'degree',
      'branchdept', 'coursename'
    ];
    const department = hasField(deptAliases) ? findField(deptAliases) : '';

    const yearAliases = [
      'academicyear', 'year', 'yearofstudy', 'studyingyear',
      'currentyear', 'class', 'batch', 'yr', 'std', 'semester', 'sem',
      'classyear', 'yearsem'
    ];
    const yearVal = hasField(yearAliases) ? findField(yearAliases) : '';
    const academic_year = yearVal ? parseAcademicYear(yearVal) : ('' as AcademicYear);

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

    // Constituency parsing - strictly column-driven
    const constNumAliases = [
      'constituencynumber', 'constituencyno', 'constno', 'seatnumber', 'seatno', 'constnum', 'acno', 'acnumber', 'constituencyn'
    ];
    let parsedConstNo: number | undefined = undefined;
    if (hasField(constNumAliases)) {
      const rawConstNum = findField(constNumAliases);
      const numDigits = rawConstNum.match(/\d+/);
      parsedConstNo = numDigits ? parseInt(numDigits[0], 10) : undefined;
    }

    const constNameAliases = [
      'constituencyname', 'constituency', 'tnconstituencyname', 'constname',
      'seatname', 'constituencyseat', 'constituencyseatname'
    ];
    let rawConstName: string | undefined = undefined;
    if (hasField(constNameAliases)) {
      const rawVal = findField(constNameAliases);
      if (rawVal) {
        // If it starts with "1 - Gummidipoondi" and constituency number wasn't given
        const prefixMatch = rawVal.match(/^(\d+)\s*[-:]\s*(.+)$/);
        if (prefixMatch && parsedConstNo === undefined) {
          parsedConstNo = parseInt(prefixMatch[1], 10);
          rawConstName = prefixMatch[2].trim();
        } else {
          rawConstName = rawVal;
        }
      }
    }

    // District parsing - only if column exists in uploaded sheet (never infer/default)
    const districtAliases = ['district', 'tndistrict', 'districtname'];
    const district = hasField(districtAliases) ? findField(districtAliases) : undefined;

    // Party parsing - strictly from sheet
    const partyAliases = [
      'partyassignment', 'party', 'politicalparty', 'partyname',
      'assignedparty', 'partyassigned', 'partyallocated'
    ];
    const rawParty = hasField(partyAliases) ? findField(partyAliases) : '';
    const party_name = rawParty || undefined;

    // Bench parsing - STRICTLY column-driven. Never auto-guess or infer from party name.
    const benchAliases = ['bench', 'benchassignment', 'side', 'rulingopposition', 'benchtype'];
    const rawBench = hasField(benchAliases) ? findField(benchAliases) : '';
    const bench = rawBench ? normalizeBench(rawBench) : undefined;

    // Legislative Role - only if explicit role column exists in sheet
    const roleAliases = [
      'role', 'legislativerole', 'cabinetrole', 'designation',
      'position', 'parliamentaryrole', 'cabinet'
    ];
    const role = hasField(roleAliases) ? (findField(roleAliases) || undefined) : undefined;

    // Committee - only if explicit committee column exists in sheet
    const commAliases = [
      'committee', 'committeename', 'assignedcommittee', 'committeegroup', 'committeeassignment'
    ];
    let committee_name: string | undefined = undefined;
    if (hasField(commAliases)) {
      const rawComm = findField(commAliases);
      if (rawComm) {
        committee_name = /^\d+$/.test(rawComm) ? `Committee ${rawComm}` : rawComm;
      }
    }

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

export function exportFullParticipantDataToExcel(
  learners: Learner[],
  eventName: string = 'TN_Assembly',
  customFileName?: string,
  parties?: Party[],
  committees?: Committee[]
) {
  const exportData = learners.map((l, index) => ({
    'S.No': index + 1,
    'Student Name': l.full_name,
    'Constituency Number': l.constituency_number || '',
    'Constituency Name': l.constituency_name || '',
    'Allocated Party': parties ? getResolvedPartyName(l, parties) : (l.party_name || ''),
    'Allocated Committee': committees ? getResolvedCommitteeName(l, committees) : (l.committee_name || ''),
    'Bench': l.bench || '',
    'Legislative Role': l.role || '',
    'Access Code': l.access_code,
    'Department': l.department || '',
    'Academic Year': l.academic_year || '',
    'Email ID': l.email || '',
    'Phone Number': l.phone || '',
    'Day 1 Check-in': l.day1_checked_in ? 'Checked In' : 'Not Checked In',
    'Day 2 Check-in': l.day2_checked_in ? 'Checked In' : 'Not Checked In'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

  // Auto column width formatting
  const max_widths = [
    { wch: 6 },  // S.No
    { wch: 24 }, // Student Name
    { wch: 20 }, // Constituency Number
    { wch: 30 }, // Constituency Name
    { wch: 24 }, // Allocated Party
    { wch: 28 }, // Allocated Committee
    { wch: 14 }, // Bench
    { wch: 30 }, // Legislative Role
    { wch: 14 }, // Access Code
    { wch: 20 }, // Department
    { wch: 14 }, // Academic Year
    { wch: 26 }, // Email
    { wch: 15 }, // Phone
    { wch: 16 }, // Day 1
    { wch: 16 }  // Day 2
  ];
  worksheet['!cols'] = max_widths;

  const fileName = customFileName 
    ? (customFileName.endsWith('.xlsx') ? customFileName : `${customFileName}.xlsx`)
    : `${eventName.replace(/\s+/g, '_')}_Participant_Roster.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportFullParticipantDataToCSV(
  learners: Learner[],
  eventName: string = 'TN_Assembly',
  customFileName?: string,
  parties?: Party[],
  committees?: Committee[]
) {
  const exportData = learners.map((l, index) => ({
    'S.No': index + 1,
    'Student Name': l.full_name,
    'Constituency Number': l.constituency_number || '',
    'Constituency Name': l.constituency_name || '',
    'Allocated Party': parties ? getResolvedPartyName(l, parties) : (l.party_name || ''),
    'Allocated Committee': committees ? getResolvedCommitteeName(l, committees) : (l.committee_name || ''),
    'Bench': l.bench || '',
    'Legislative Role': l.role || '',
    'Access Code': l.access_code,
    'Department': l.department || '',
    'Academic Year': l.academic_year || '',
    'Email ID': l.email || '',
    'Phone Number': l.phone || '',
    'Day 1 Check-in': l.day1_checked_in ? 'Checked In' : 'Not Checked In',
    'Day 2 Check-in': l.day2_checked_in ? 'Checked In' : 'Not Checked In'
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = customFileName 
    ? (customFileName.endsWith('.csv') ? customFileName : `${customFileName}.csv`)
    : `${eventName.replace(/\s+/g, '_')}_Roster.csv`;
  link.setAttribute('download', fileName);
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
