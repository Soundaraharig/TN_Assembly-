import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Learner, Party, Committee } from '../types';
import { TN_CONSTITUENCIES } from '../data/tnConstituencies';

export interface FieldChange {
  field: 'party' | 'committee' | 'constituency_name' | 'constituency_number';
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface MatchedParticipantUpdate {
  learnerId: string;
  accessCode: string;
  studentName: string;
  rowNumber: number;
  changes: FieldChange[];
  patch: {
    party_name?: string;
    party_id?: string;
    committee_name?: string;
    committee_id?: string;
    constituency_name?: string;
    constituency_number?: number;
  };
}

export interface UnmatchedRow {
  rowNumber: number;
  identifier: string;
  identifierType: string;
  studentName?: string;
  reason: string;
}

export interface DuplicateRow {
  rowNumber: number;
  identifier: string;
  identifierType: string;
  studentName?: string;
}

export interface ValidationError {
  rowNumber: number;
  identifier: string;
  studentName?: string;
  field: string;
  value: string;
  message: string;
}

export interface UpdateCSVParseResult {
  totalRows: number;
  matchedCount: number;
  willUpdateCount: number;
  unchangedCount: number;
  updates: MatchedParticipantUpdate[];
  unmatchedRows: UnmatchedRow[];
  duplicateRows: DuplicateRow[];
  validationErrors: ValidationError[];
  detectedHeaders: string[];
  presentUpdateColumns: Array<'party' | 'committee' | 'constituency_name' | 'constituency_number'>;
}

const normalizeHeader = (h: string): string =>
  h ? h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

const IDENTIFIER_ALIASES = {
  id: ['id', 'learnerid', 'participantid', 'studentid', 'delegateid'],
  access_code: ['accesscode', 'code', 'delegatecode', 'studentcode', 'passcode'],
  email: ['email', 'emailid', 'emailaddress', 'contactemail', 'mail', 'studentemail']
};

const FIELD_ALIASES = {
  name: [
    'studentname', 'name', 'delegatename', 'participantname', 'fullname', 'learnername',
    'candidatename', 'firstname', 'nameofstudent', 'studentsname', 'nameofthestudent',
    'student', 'participant', 'delegate'
  ],
  party: [
    'party', 'partyname', 'allocatedparty', 'assignedparty', 'partyassignment',
    'politicalparty', 'partyassigned', 'partyallocated'
  ],
  committee: [
    'committee', 'committeename', 'allocatedcommittee', 'assignedcommittee',
    'committeegroup', 'committeeassignment'
  ],
  constituency_name: [
    'constituencyname', 'constituency', 'tnconstituencyname', 'constname',
    'seatname', 'constituencyseat', 'constituencyseatname'
  ],
  constituency_number: [
    'constituencynumber', 'constituencyno', 'constno', 'constnum', 'seatnumber', 'seatno',
    'acno', 'acnumber', 'constituencyn', 'constituencyid'
  ]
};

export function processUpdateRows(
  rows: Record<string, unknown>[],
  existingLearners: Learner[],
  configuredParties: Party[],
  configuredCommittees: Committee[]
): UpdateCSVParseResult {
  const updates: MatchedParticipantUpdate[] = [];
  const unmatchedRows: UnmatchedRow[] = [];
  const duplicateRows: DuplicateRow[] = [];
  const validationErrors: ValidationError[] = [];

  // 1. Detect present headers and identify columns
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

  const headerNorms = new Set(detectedHeaders.map(h => normalizeHeader(h)));

  const hasAnyHeader = (aliases: string[]) => aliases.some(a => headerNorms.has(normalizeHeader(a)));

  const isPartyColPresent = hasAnyHeader(FIELD_ALIASES.party);
  const isCommitteeColPresent = hasAnyHeader(FIELD_ALIASES.committee);
  const isConstNameColPresent = hasAnyHeader(FIELD_ALIASES.constituency_name);
  const isConstNumColPresent = hasAnyHeader(FIELD_ALIASES.constituency_number);

  const presentUpdateColumns: Array<'party' | 'committee' | 'constituency_name' | 'constituency_number'> = [];
  if (isPartyColPresent) presentUpdateColumns.push('party');
  if (isCommitteeColPresent) presentUpdateColumns.push('committee');
  if (isConstNameColPresent) presentUpdateColumns.push('constituency_name');
  if (isConstNumColPresent) presentUpdateColumns.push('constituency_number');

  // Build maps for efficient lookup
  const learnersById = new Map<string, Learner>();
  const learnersByCode = new Map<string, Learner>();
  const learnersByEmail = new Map<string, Learner>();

  existingLearners.forEach(l => {
    if (l.id) learnersById.set(l.id.toLowerCase(), l);
    if (l.access_code) learnersByCode.set(l.access_code.trim().toUpperCase(), l);
    if (l.email && l.email.trim()) learnersByEmail.set(l.email.trim().toLowerCase(), l);
  });

  // Track occurrences of identifiers to catch duplicates within the CSV
  const seenIdentifiers = new Map<string, number>(); // key -> first rowNumber seen

  // Helper to extract value from row given aliases
  const getFieldValue = (row: Record<string, unknown>, aliases: string[]): { found: boolean; value: string } => {
    const rawKeys = Object.keys(row);
    for (const key of rawKeys) {
      const normKey = normalizeHeader(key);
      if (aliases.some(a => normalizeHeader(a) === normKey)) {
        const rawVal = row[key];
        if (rawVal !== undefined && rawVal !== null) {
          const strVal = String(rawVal).trim();
          return { found: true, value: strVal };
        }
        return { found: true, value: '' };
      }
    }
    return { found: false, value: '' };
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (!row || typeof row !== 'object') return;

    // Check if the entire row is empty
    const hasAnyContent = Object.values(row).some(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (!hasAnyContent) return;

    // Extract student name for UI logging
    const nameData = getFieldValue(row, FIELD_ALIASES.name);
    const studentName = nameData.value || undefined;

    // 2. Identify the participant
    const idData = getFieldValue(row, IDENTIFIER_ALIASES.id);
    const codeData = getFieldValue(row, IDENTIFIER_ALIASES.access_code);
    const emailData = getFieldValue(row, IDENTIFIER_ALIASES.email);

    let identifier = '';
    let identifierType = '';
    let matchedLearner: Learner | undefined = undefined;

    if (idData.found && idData.value) {
      identifier = idData.value;
      identifierType = 'Learner ID';
      matchedLearner = learnersById.get(identifier.toLowerCase());
    } else if (codeData.found && codeData.value) {
      identifier = codeData.value.toUpperCase();
      identifierType = 'Access Code';
      matchedLearner = learnersByCode.get(identifier);
    } else if (emailData.found && emailData.value) {
      identifier = emailData.value.toLowerCase();
      identifierType = 'Email';
      matchedLearner = learnersByEmail.get(identifier);
    }

    if (!identifier) {
      unmatchedRows.push({
        rowNumber,
        identifier: '(missing identifier)',
        identifierType: 'None',
        studentName,
        reason: 'No Access Code, Learner ID, or Email provided in row'
      });
      return;
    }

    // 3. Duplicate Identifier Detection in CSV
    const duplicateKey = `${identifierType}:::${identifier.toUpperCase()}`;
    if (seenIdentifiers.has(duplicateKey)) {
      duplicateRows.push({
        rowNumber,
        identifier,
        identifierType,
        studentName
      });
      return;
    }
    seenIdentifiers.set(duplicateKey, rowNumber);

    // 4. Unmatched Check
    if (!matchedLearner) {
      unmatchedRows.push({
        rowNumber,
        identifier,
        identifierType,
        studentName,
        reason: `Participant not found with ${identifierType}: "${identifier}"`
      });
      return;
    }

    // 5. Extract & Validate Fields to Update
    const changes: FieldChange[] = [];
    const patch: MatchedParticipantUpdate['patch'] = {};

    // --- PARTY VALIDATION ---
    if (isPartyColPresent) {
      const partyData = getFieldValue(row, FIELD_ALIASES.party);
      if (partyData.found && partyData.value !== '') {
        const rawPartyVal = partyData.value;
        const normalizedInput = rawPartyVal.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Match against event's configured parties
        const matchedParty = configuredParties.find(p => {
          const pNorm = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return pNorm === normalizedInput || p.name.trim().toLowerCase() === rawPartyVal.toLowerCase();
        });

        if (!matchedParty) {
          validationErrors.push({
            rowNumber,
            identifier,
            studentName: matchedLearner.full_name,
            field: 'Party',
            value: rawPartyVal,
            message: `Party "${rawPartyVal}" does not match any configured event party (${configuredParties.map(p => p.name).join(', ') || 'None configured'}).`
          });
        } else {
          const currentPartyName = matchedLearner.party_name || '';
          if (currentPartyName !== matchedParty.name) {
            changes.push({
              field: 'party',
              fieldLabel: 'Party',
              oldValue: currentPartyName || '(Unassigned)',
              newValue: matchedParty.name
            });
            patch.party_name = matchedParty.name;
            patch.party_id = matchedParty.id;
          }
        }
      }
      // Note: Empty cells do NOT clear existing party by safety rule.
    }

    // --- COMMITTEE VALIDATION ---
    if (isCommitteeColPresent) {
      const commData = getFieldValue(row, FIELD_ALIASES.committee);
      if (commData.found && commData.value !== '') {
        const rawCommVal = commData.value;
        const normalizedCommInput = rawCommVal.toLowerCase().replace(/[^a-z0-9]/g, '');

        const matchedComm = configuredCommittees.find(c => {
          const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cNorm === normalizedCommInput || c.name.trim().toLowerCase() === rawCommVal.toLowerCase()) {
            return true;
          }
          // Support pure number like '1' -> 'Committee 1'
          const numMatch = rawCommVal.match(/^\d+$/);
          if (numMatch) {
            const targetNum = parseInt(numMatch[0], 10);
            const cNum = c.name.match(/\d+/);
            return cNum && parseInt(cNum[0], 10) === targetNum;
          }
          return false;
        });

        if (!matchedComm) {
          validationErrors.push({
            rowNumber,
            identifier,
            studentName: matchedLearner.full_name,
            field: 'Committee',
            value: rawCommVal,
            message: `Committee "${rawCommVal}" does not match any configured committee (${configuredCommittees.map(c => c.name).join(', ') || 'None configured'}).`
          });
        } else {
          const currentCommName = matchedLearner.committee_name || '';
          if (currentCommName !== matchedComm.name) {
            changes.push({
              field: 'committee',
              fieldLabel: 'Committee',
              oldValue: currentCommName || '(Unassigned)',
              newValue: matchedComm.name
            });
            patch.committee_name = matchedComm.name;
            patch.committee_id = matchedComm.id;
          }
        }
      }
    }

    // --- CONSTITUENCY VALIDATION ---
    let parsedConstNum: number | undefined = undefined;
    let parsedConstName: string | undefined = undefined;

    if (isConstNumColPresent) {
      const numData = getFieldValue(row, FIELD_ALIASES.constituency_number);
      if (numData.found && numData.value !== '') {
        const digits = numData.value.match(/\d+/);
        if (digits) {
          const n = parseInt(digits[0], 10);
          if (n >= 1 && n <= 234) {
            parsedConstNum = n;
          } else {
            validationErrors.push({
              rowNumber,
              identifier,
              studentName: matchedLearner.full_name,
              field: 'Constituency Number',
              value: numData.value,
              message: `Constituency number ${n} is outside valid Tamil Nadu assembly range (1–234).`
            });
          }
        } else {
          validationErrors.push({
            rowNumber,
            identifier,
            studentName: matchedLearner.full_name,
            field: 'Constituency Number',
            value: numData.value,
            message: `Invalid constituency number "${numData.value}". Expected a number between 1 and 234.`
          });
        }
      }
    }

    if (isConstNameColPresent) {
      const nameColData = getFieldValue(row, FIELD_ALIASES.constituency_name);
      if (nameColData.found && nameColData.value !== '') {
        const rawName = nameColData.value;
        // Check if format is "4 - Thiruvallur" or similar
        const prefixMatch = rawName.match(/^(\d+)\s*[-:]\s*(.+)$/);
        if (prefixMatch && parsedConstNum === undefined) {
          const n = parseInt(prefixMatch[1], 10);
          if (n >= 1 && n <= 234) {
            parsedConstNum = n;
          }
          parsedConstName = prefixMatch[2].trim();
        } else {
          parsedConstName = rawName.trim();
        }
      }
    }

    // Validate constituency against TN master data
    let finalConstNum: number | undefined = undefined;
    let finalConstName: string | undefined = undefined;

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPhonetic = (s: string) => norm(s).replace(/pp/g, 'p').replace(/tt/g, 't');

    if (parsedConstNum !== undefined && parsedConstName) {
      const matchByNo = TN_CONSTITUENCIES.find(c => c.number === parsedConstNum);
      if (!matchByNo) {
        validationErrors.push({
          rowNumber,
          identifier,
          studentName: matchedLearner.full_name,
          field: 'Constituency Number',
          value: String(parsedConstNum),
          message: `Constituency number ${parsedConstNum} is invalid (must be between 1 and 234).`
        });
      } else {
        const normDb = norm(matchByNo.name);
        const normInput = norm(parsedConstName);
        const isExactMatch = normDb === normInput || normPhonetic(matchByNo.name) === normPhonetic(parsedConstName);

        if (isExactMatch) {
          finalConstNum = matchByNo.number;
          finalConstName = matchByNo.name;
        } else {
          // Check if the provided name corresponds to a different constituency number
          const matchByName = TN_CONSTITUENCIES.find(c => {
            const n = norm(c.name);
            return n === normInput || normPhonetic(c.name) === normPhonetic(parsedConstName);
          });

          if (matchByName) {
            validationErrors.push({
              rowNumber,
              identifier,
              studentName: matchedLearner.full_name,
              field: 'Constituency',
              value: `#${parsedConstNum} ${parsedConstName}`,
              message: `Constituency mismatch: Number ${parsedConstNum} is "${matchByNo.name}", but sheet provided "${parsedConstName}" (Expected number for "${matchByName.name}" is #${matchByName.number}).`
            });
          } else {
            validationErrors.push({
              rowNumber,
              identifier,
              studentName: matchedLearner.full_name,
              field: 'Constituency',
              value: `#${parsedConstNum} ${parsedConstName}`,
              message: `Constituency mismatch: Number ${parsedConstNum} is "${matchByNo.name}", but sheet provided "${parsedConstName}" (which is not a recognized Tamil Nadu Assembly constituency).`
            });
          }
        }
      }
    } else if (parsedConstNum !== undefined && !parsedConstName) {
      const matchByNo = TN_CONSTITUENCIES.find(c => c.number === parsedConstNum);
      if (matchByNo) {
        finalConstNum = matchByNo.number;
        finalConstName = matchByNo.name;
      } else {
        validationErrors.push({
          rowNumber,
          identifier,
          studentName: matchedLearner.full_name,
          field: 'Constituency Number',
          value: String(parsedConstNum),
          message: `Constituency number ${parsedConstNum} is invalid (must be between 1 and 234).`
        });
      }
    } else if (parsedConstNum === undefined && parsedConstName) {
      const normInput = norm(parsedConstName);
      const matchByName = TN_CONSTITUENCIES.find(c => {
        const n = norm(c.name);
        return n === normInput || normPhonetic(c.name) === normPhonetic(parsedConstName);
      });
      if (matchByName) {
        finalConstNum = matchByName.number;
        finalConstName = matchByName.name;
      } else {
        validationErrors.push({
          rowNumber,
          identifier,
          studentName: matchedLearner.full_name,
          field: 'Constituency Name',
          value: parsedConstName,
          message: `Constituency name "${parsedConstName}" does not match any recognized Tamil Nadu Assembly constituency.`
        });
      }
    }

    // Check constituency changes
    if (isConstNumColPresent && finalConstNum !== undefined) {
      const currentNum = matchedLearner.constituency_number;
      if (currentNum !== finalConstNum) {
        changes.push({
          field: 'constituency_number',
          fieldLabel: 'Constituency Number',
          oldValue: currentNum !== undefined ? String(currentNum) : '(Unassigned)',
          newValue: String(finalConstNum)
        });
        patch.constituency_number = finalConstNum;
      }
    }

    if (isConstNameColPresent && finalConstName !== undefined) {
      const currentName = matchedLearner.constituency_name || '';
      if (currentName.trim().toLowerCase() !== finalConstName.trim().toLowerCase()) {
        changes.push({
          field: 'constituency_name',
          fieldLabel: 'Constituency Name',
          oldValue: currentName || '(Unassigned)',
          newValue: finalConstName
        });
        patch.constituency_name = finalConstName;
      }
    }

    updates.push({
      learnerId: matchedLearner.id,
      accessCode: matchedLearner.access_code,
      studentName: matchedLearner.full_name,
      rowNumber,
      changes,
      patch
    });
  });

  const willUpdateCount = updates.filter(u => u.changes.length > 0).length;
  const unchangedCount = updates.filter(u => u.changes.length === 0).length;

  return {
    totalRows: rows.length,
    matchedCount: updates.length,
    willUpdateCount,
    unchangedCount,
    updates,
    unmatchedRows,
    duplicateRows,
    validationErrors,
    detectedHeaders,
    presentUpdateColumns
  };
}

export async function parseUpdateCSVFile(
  file: File,
  existingLearners: Learner[],
  configuredParties: Party[],
  configuredCommittees: Committee[]
): Promise<UpdateCSVParseResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    return processUpdateRows(rows, existingLearners, configuredParties, configuredCommittees);
  }

  // Otherwise handle as standard CSV via PapaParse
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const parsed = processUpdateRows(results.data, existingLearners, configuredParties, configuredCommittees);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
}

/**
 * Generates and downloads a CSV template pre-filled with the event's current participants,
 * student names, and access codes. This ensures 100% accurate matching with zero typos.
 */
export function exportExistingParticipantsUpdateTemplate(
  learners: Learner[],
  _parties?: Party[],
  _committees?: Committee[]
) {
  const headers = [
    'Student Name',
    'Access Code',
    'Party',
    'Committee',
    'Constituency Name',
    'Constituency Number'
  ];

  const rows = learners.map(l => [
    `"${(l.full_name || '').replace(/"/g, '""')}"`,
    `"${(l.access_code || '').replace(/"/g, '""')}"`,
    `"${(l.party_name || '').replace(/"/g, '""')}"`,
    `"${(l.committee_name || '').replace(/"/g, '""')}"`,
    `"${(l.constituency_name || '').replace(/"/g, '""')}"`,
    l.constituency_number !== undefined ? String(l.constituency_number) : ''
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ];

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TN_Assembly_Update_Allocations_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
