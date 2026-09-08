import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, AcademicYear, BenchType, Party, Committee } from '../types';
import { generateAccessCode } from './accessCodeGenerator';
import { getResolvedPartyName, getResolvedCommitteeName } from '../services/storageService';
import { TN_CONSTITUENCIES } from '../data/tnConstituencies';

export interface CSVImportStats {
  totalRows: number;
  rowsWithParty: number;
  rowsWithCommittee: number;
  rowsWithConstituency: number;
  rowsWithMissingOptional: number;
}

export interface CSVImportResult {
  learners: Partial<Learner>[];
  errors: string[];
  detectedHeaders: string[];
  mappedFields: string[];
  unmappedHeaders: string[];
  stats: CSVImportStats;
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

export function processRows(rows: any[], eventId: string, existingCodes: Set<string>): CSVImportResult {
  const learners: Partial<Learner>[] = [];
  const errors: string[] = [];

  const normalizeHeader = (h: string) =>
    h ? h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  // 1. Detect all unique raw headers from rows
  const rawHeadersSet = new Set<string>();
  rows.forEach(r => {
    if (r && typeof r === 'object') {
      Object.keys(r).forEach(k => {
        const trimmed = k.replace(/^\uFEFF/, '').trim();
        if (trimmed && !trimmed.startsWith('__parsed_extra')) {
          rawHeadersSet.add(trimmed);
        }
      });
    }
  });
  const detectedHeaders = Array.from(rawHeadersSet);

  // 2. Field definitions with full alias coverage
  const FIELD_MAP: {
    key: string;
    label: string;
    aliases: string[];
    isIdentifier?: boolean;
  }[] = [
    {
      key: 'name',
      label: 'Student Name',
      aliases: [
        'studentname', 'name', 'delegatename', 'participantname', 'fullname', 'learnername',
        'candidatename', 'firstname', 'nameofstudent', 'studentsname', 'nameofthestudent',
        'student', 'participant', 'delegate', 'candidate', 'fullnameofstudent', 'nameofparticipant', 'nameofdelegate'
      ],
      isIdentifier: true
    },
    {
      key: 'constituency_number',
      label: 'Constituency Number',
      aliases: [
        'constituencynumber', 'constituencyno', 'constno', 'constnum', 'seatnumber', 'seatno',
        'acno', 'acnumber', 'constituencyn', 'constituencyid'
      ]
    },
    {
      key: 'constituency_name',
      label: 'Constituency Name',
      aliases: [
        'constituencyname', 'constituency', 'tnconstituencyname', 'constname',
        'seatname', 'constituencyseat', 'constituencyseatname'
      ]
    },
    {
      key: 'party',
      label: 'Allocated Party',
      aliases: [
        'allocatedparty', 'party', 'partyname', 'assignedparty', 'partyassignment',
        'politicalparty', 'partyassigned', 'partyallocated'
      ]
    },
    {
      key: 'committee',
      label: 'Allocated Committee',
      aliases: [
        'allocatedcommittee', 'committee', 'committeename', 'assignedcommittee',
        'committeegroup', 'committeeassignment'
      ]
    },
    {
      key: 'access_code',
      label: 'Access Code',
      aliases: [
        'accesscode', 'code', 'delegatecode', 'studentcode', 'passcode'
      ]
    },
    {
      key: 'bench',
      label: 'Bench',
      aliases: [
        'bench', 'benchassignment', 'side', 'rulingopposition', 'benchtype'
      ]
    },
    {
      key: 'role',
      label: 'Legislative Role',
      aliases: [
        'role', 'legislativerole', 'cabinetrole', 'designation', 'position', 'parliamentaryrole', 'cabinet'
      ]
    },
    {
      key: 'department',
      label: 'Department',
      aliases: [
        'department', 'dept', 'branch', 'course', 'major', 'program', 'programme',
        'specialization', 'stream', 'degree', 'branchdept', 'coursename'
      ]
    },
    {
      key: 'academic_year',
      label: 'Academic Year',
      aliases: [
        'academicyear', 'year', 'yearofstudy', 'studyingyear', 'currentyear', 'class',
        'batch', 'yr', 'std', 'semester', 'sem', 'classyear', 'yearsem'
      ]
    },
    {
      key: 'email',
      label: 'Email ID',
      aliases: [
        'email', 'emailid', 'emailaddress', 'contactemail', 'mail', 'studentemail',
        'studentsemail', 'mailid', 'useremail'
      ]
    },
    {
      key: 'phone',
      label: 'Phone Number',
      aliases: [
        'phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber',
        'phoneno', 'mobileno', 'whatsapp', 'cell', 'whatsappnumber', 'whatsappno', 'cellnumber', 'contactno'
      ]
    },
    {
      key: 'district',
      label: 'District',
      aliases: ['district', 'tndistrict', 'districtname']
    },
    {
      key: 'sno',
      label: 'S.No',
      aliases: ['sno', 'slno', 'serialno', 'serialnumber', 'no']
    }
  ];

  // Determine mapped fields and unmapped headers across all detected headers
  const mappedFieldsSet = new Set<string>();
  const unmappedHeadersSet = new Set<string>();

  detectedHeaders.forEach(rawH => {
    const norm = normalizeHeader(rawH);
    const matchedDef = FIELD_MAP.find(f => f.aliases.includes(norm));
    if (matchedDef) {
      if (matchedDef.key !== 'sno') {
        mappedFieldsSet.add(matchedDef.label);
      }
    } else {
      unmappedHeadersSet.add(rawH);
    }
  });

  const mappedFields = Array.from(mappedFieldsSet);
  const unmappedHeaders = Array.from(unmappedHeadersSet);

  rows.forEach((row: any, index: number) => {
    if (!row || typeof row !== 'object') return;
    const rawHeaders = Object.keys(row);
    const headerMap = new Map(rawHeaders.map(h => [normalizeHeader(h), h]));

    const hasField = (aliases: string[]): boolean =>
      aliases.some(a => headerMap.has(normalizeHeader(a)));

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

    const nameDef = FIELD_MAP.find(f => f.key === 'name')!;
    const name = findField(nameDef.aliases);

    // If an entire row is blank or lacks a name, skip or log error
    if (!name) {
      const hasAnyValue = rawHeaders.some(k => row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '');
      if (hasAnyValue) {
        errors.push(`Row ${index + 1}: Missing delegate name`);
      }
      return;
    }

    const email = hasField(FIELD_MAP.find(f => f.key === 'email')!.aliases)
      ? findField(FIELD_MAP.find(f => f.key === 'email')!.aliases)
      : undefined;

    const phone = hasField(FIELD_MAP.find(f => f.key === 'phone')!.aliases)
      ? findField(FIELD_MAP.find(f => f.key === 'phone')!.aliases)
      : undefined;

    const department = hasField(FIELD_MAP.find(f => f.key === 'department')!.aliases)
      ? findField(FIELD_MAP.find(f => f.key === 'department')!.aliases)
      : '';

    const yearVal = hasField(FIELD_MAP.find(f => f.key === 'academic_year')!.aliases)
      ? findField(FIELD_MAP.find(f => f.key === 'academic_year')!.aliases)
      : '';
    const academic_year = yearVal ? parseAcademicYear(yearVal) : ('' as AcademicYear);

    // Access code
    const rawCode = findField(FIELD_MAP.find(f => f.key === 'access_code')!.aliases);
    let code = rawCode ? rawCode.toUpperCase().trim() : '';
    if (!code) {
      code = generateAccessCode(existingCodes);
    }
    existingCodes.add(code);

    // Constituency parsing & validation
    const constNumAliases = FIELD_MAP.find(f => f.key === 'constituency_number')!.aliases;
    let parsedConstNo: number | undefined = undefined;
    if (hasField(constNumAliases)) {
      const rawConstNum = findField(constNumAliases);
      const numDigits = rawConstNum.match(/\d+/);
      parsedConstNo = numDigits ? parseInt(numDigits[0], 10) : undefined;
    }

    const constNameAliases = FIELD_MAP.find(f => f.key === 'constituency_name')!.aliases;
    let rawConstName: string | undefined = undefined;
    if (hasField(constNameAliases)) {
      const rawVal = findField(constNameAliases);
      if (rawVal) {
        const prefixMatch = rawVal.match(/^(\d+)\s*[-:]\s*(.+)$/);
        if (prefixMatch && parsedConstNo === undefined) {
          parsedConstNo = parseInt(prefixMatch[1], 10);
          rawConstName = prefixMatch[2].trim();
        } else {
          rawConstName = rawVal;
        }
      }
    }

    const districtAliases = FIELD_MAP.find(f => f.key === 'district')!.aliases;
    let district = hasField(districtAliases) ? findField(districtAliases) : undefined;

    // Validate constituency consistency against TN Assembly master data
    let finalConstNo: number | undefined = parsedConstNo;
    let finalConstName: string | undefined = rawConstName;
    let finalDistrict: string | undefined = district;

    if (parsedConstNo !== undefined && rawConstName) {
      const matchByNo = TN_CONSTITUENCIES.find(c => c.number === parsedConstNo);
      if (matchByNo) {
        const normDbName = matchByNo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normRowName = rawConstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const namesMatch =
          normDbName === normRowName ||
          normDbName.includes(normRowName) ||
          normRowName.includes(normDbName);

        if (!namesMatch) {
          errors.push(
            `Row ${index + 1}: Constituency conflict — No. ${parsedConstNo} is "${matchByNo.name}" (${matchByNo.district}), but file specified "${rawConstName}".`
          );
          finalConstNo = undefined;
          finalConstName = undefined;
        } else {
          finalConstName = matchByNo.name;
          finalDistrict = finalDistrict || matchByNo.district;
        }
      }
    } else if (parsedConstNo !== undefined && !rawConstName) {
      const matchByNo = TN_CONSTITUENCIES.find(c => c.number === parsedConstNo);
      if (matchByNo) {
        finalConstName = matchByNo.name;
        finalDistrict = finalDistrict || matchByNo.district;
      }
    } else if (parsedConstNo === undefined && rawConstName) {
      const normRowName = rawConstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchByName = TN_CONSTITUENCIES.find(c => {
        const normDb = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normDb === normRowName || normDb.includes(normRowName) || normRowName.includes(normDb);
      });
      if (matchByName) {
        finalConstNo = matchByName.number;
        finalConstName = matchByName.name;
        finalDistrict = finalDistrict || matchByName.district;
      }
    }

    // Party parsing
    const partyAliases = FIELD_MAP.find(f => f.key === 'party')!.aliases;
    const rawParty = hasField(partyAliases) ? findField(partyAliases) : '';
    const party_name = rawParty || undefined;

    // Bench parsing - STRICTLY column-driven
    const benchAliases = FIELD_MAP.find(f => f.key === 'bench')!.aliases;
    const rawBench = hasField(benchAliases) ? findField(benchAliases) : '';
    const bench = rawBench ? normalizeBench(rawBench) : undefined;

    // Role
    const roleAliases = FIELD_MAP.find(f => f.key === 'role')!.aliases;
    const role = hasField(roleAliases) ? (findField(roleAliases) || undefined) : undefined;

    // Committee
    const commAliases = FIELD_MAP.find(f => f.key === 'committee')!.aliases;
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
      constituency_number: finalConstNo,
      constituency_name: finalConstName || undefined,
      district: finalDistrict || undefined,
      party_name: party_name || undefined,
      bench: bench || undefined,
      role: role,
      committee_name: committee_name || undefined,
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString()
    });
  });

  const stats: CSVImportStats = {
    totalRows: learners.length,
    rowsWithParty: learners.filter(l => Boolean(l.party_name)).length,
    rowsWithCommittee: learners.filter(l => Boolean(l.committee_name)).length,
    rowsWithConstituency: learners.filter(l => Boolean(l.constituency_number || l.constituency_name)).length,
    rowsWithMissingOptional: learners.filter(l => !l.party_name || !l.committee_name || !l.constituency_number).length
  };

  return {
    learners,
    errors,
    detectedHeaders,
    mappedFields,
    unmappedHeaders,
    stats
  };
}

export function parseCSVFile(
  file: File,
  eventId: string,
  existingCodes: Set<string>
): Promise<CSVImportResult> {
  const emptyStats: CSVImportStats = {
    totalRows: 0,
    rowsWithParty: 0,
    rowsWithCommittee: 0,
    rowsWithConstituency: 0,
    rowsWithMissingOptional: 0
  };

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
          resolve({
            learners: [],
            errors: [`Excel parse error: ${err.message}`],
            detectedHeaders: [],
            mappedFields: [],
            unmappedHeaders: [],
            stats: emptyStats
          });
        }
      };
      reader.onerror = () =>
        resolve({
          learners: [],
          errors: ['Failed to read Excel file'],
          detectedHeaders: [],
          mappedFields: [],
          unmappedHeaders: [],
          stats: emptyStats
        });
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
          resolve({
            learners: [],
            errors: [err.message],
            detectedHeaders: [],
            mappedFields: [],
            unmappedHeaders: [],
            stats: emptyStats
          });
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
