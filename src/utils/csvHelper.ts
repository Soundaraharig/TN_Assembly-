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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT COLUMN REGISTRY & DEDUPLICATION
// ─────────────────────────────────────────────────────────────────────────────
export interface ExportColumnDef {
  key: string;
  label: string;
  defaultSelected: boolean;
  getValue: (learner: Learner, index: number, parties?: Party[], committees?: Committee[]) => string | number;
}

export const EXPORT_COLUMNS_REGISTRY: ExportColumnDef[] = [
  {
    key: 'sno',
    label: 'S.No',
    defaultSelected: true,
    getValue: (_l, index) => index + 1
  },
  {
    key: 'full_name',
    label: 'Student Name',
    defaultSelected: true,
    getValue: (l) => l.full_name || ''
  },
  {
    key: 'access_code',
    label: 'Access Code',
    defaultSelected: true,
    getValue: (l) => l.access_code || ''
  },
  {
    key: 'constituency_number',
    label: 'Constituency Number',
    defaultSelected: true,
    getValue: (l) => l.constituency_number || ''
  },
  {
    key: 'constituency_name',
    label: 'Constituency Name',
    defaultSelected: true,
    getValue: (l) => l.constituency_name || ''
  },
  {
    key: 'district',
    label: 'District',
    defaultSelected: false,
    getValue: (l) => l.district || ''
  },
  {
    key: 'party',
    label: 'Allocated Party',
    defaultSelected: true,
    getValue: (l, _i, parties) => parties ? getResolvedPartyName(l, parties) : (l.party_name || '')
  },
  {
    key: 'bench',
    label: 'Bench',
    defaultSelected: true,
    getValue: (l) => l.bench || ''
  },
  {
    key: 'committee',
    label: 'Allocated Committee',
    defaultSelected: true,
    getValue: (l, _i, _p, committees) => committees ? getResolvedCommitteeName(l, committees) : (l.committee_name || '')
  },
  {
    key: 'role',
    label: 'Legislative Role',
    defaultSelected: true,
    getValue: (l) => l.role || ''
  },
  {
    key: 'department',
    label: 'Department',
    defaultSelected: true,
    getValue: (l) => l.department || ''
  },
  {
    key: 'academic_year',
    label: 'Academic Year',
    defaultSelected: true,
    getValue: (l) => l.academic_year || ''
  },
  {
    key: 'email',
    label: 'Email ID',
    defaultSelected: false,
    getValue: (l) => l.email || ''
  },
  {
    key: 'phone',
    label: 'Phone Number',
    defaultSelected: false,
    getValue: (l) => l.phone || ''
  },
  {
    key: 'day1_checked_in',
    label: 'Day 1 Check-in',
    defaultSelected: false,
    getValue: (l) => l.day1_checked_in ? 'Checked In' : 'Not Checked In'
  },
  {
    key: 'day2_checked_in',
    label: 'Day 2 Check-in',
    defaultSelected: false,
    getValue: (l) => l.day2_checked_in ? 'Checked In' : 'Not Checked In'
  }
];

export function deduplicateLearners(learners: Learner[]): Learner[] {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const unique: Learner[] = [];

  for (const l of learners) {
    if (!l) continue;
    if (l.id && seenIds.has(l.id)) continue;
    const code = l.access_code?.trim().toUpperCase();
    if (code && seenCodes.has(code)) continue;

    if (l.id) seenIds.add(l.id);
    if (code) seenCodes.add(code);
    unique.push(l);
  }

  return unique;
}

export interface CustomExportOptions {
  learners: Learner[];
  selectedKeys: string[];
  format: 'csv' | 'xlsx';
  customFileName?: string;
  eventName?: string;
  parties?: Party[];
  committees?: Committee[];
}

export function exportCustomParticipantData(options: CustomExportOptions): number {
  const {
    learners,
    selectedKeys,
    format,
    customFileName,
    eventName = 'TN_Assembly',
    parties,
    committees
  } = options;

  const dedupedLearners = deduplicateLearners(learners);

  // Filter columns based on selectedKeys in user-selected order
  const activeColDefs = selectedKeys
    .map(key => EXPORT_COLUMNS_REGISTRY.find(col => col.key === key))
    .filter((col): col is ExportColumnDef => Boolean(col));

  const exportData = dedupedLearners.map((learner, idx) => {
    const row: Record<string, string | number> = {};
    activeColDefs.forEach(col => {
      row[col.label] = col.getValue(learner, idx, parties, committees);
    });
    return row;
  });

  const baseName = customFileName
    ? customFileName.replace(/\.(csv|xlsx)$/i, '')
    : `${eventName.replace(/\s+/g, '_')}_${dedupedLearners.length}_Delegates`;

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    XLSX.writeFile(workbook, `${baseName}.xlsx`);
  } else {
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${baseName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return dedupedLearners.length;
}

export function exportFullParticipantDataToExcel(
  learners: Learner[],
  eventName: string = 'TN_Assembly',
  customFileName?: string,
  parties?: Party[],
  committees?: Committee[]
) {
  const deduped = deduplicateLearners(learners);
  const defaultKeys = EXPORT_COLUMNS_REGISTRY.filter(c => c.defaultSelected).map(c => c.key);
  exportCustomParticipantData({
    learners: deduped,
    selectedKeys: defaultKeys,
    format: 'xlsx',
    eventName,
    customFileName: customFileName || `${eventName.replace(/\s+/g, '_')}_Participant_Roster.xlsx`,
    parties,
    committees
  });
}

export function exportFullParticipantDataToCSV(
  learners: Learner[],
  eventName: string = 'TN_Assembly',
  customFileName?: string,
  parties?: Party[],
  committees?: Committee[]
) {
  const deduped = deduplicateLearners(learners);
  const defaultKeys = EXPORT_COLUMNS_REGISTRY.filter(c => c.defaultSelected).map(c => c.key);
  exportCustomParticipantData({
    learners: deduped,
    selectedKeys: defaultKeys,
    format: 'csv',
    eventName,
    customFileName: customFileName || `${eventName.replace(/\s+/g, '_')}_Roster.csv`,
    parties,
    committees
  });
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
