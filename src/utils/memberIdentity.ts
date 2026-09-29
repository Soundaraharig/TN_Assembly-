import { TN_CONSTITUENCIES } from '../data/tnConstituencies';
import type { Learner, ProceedingsQuestion } from '../types';
import { isSpeakerRole, isDeputySpeakerRole } from '../services/storageService';

export interface ResolvedConstituency {
  number?: number;
  name?: string;
  formatted: string; // e.g. "#16 — Egmore"
}

// Pre-index TN_CONSTITUENCIES for O(1) lookups
const byNumber = new Map<number, { number: number; name: string; district: string }>();
const byNormName = new Map<string, { number: number; name: string; district: string }>();

const normalizeConstStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

for (const c of TN_CONSTITUENCIES) {
  byNumber.set(c.number, c);
  byNormName.set(normalizeConstStr(c.name), c);
}

/**
 * Checks if a member/learner/role is a Presiding Officer (Speaker or Deputy Speaker).
 * Presiding officers must never appear in Speaking Floor queues.
 */
export function isPresidingOfficer(learnerOrRole?: { role?: string } | string | null): boolean {
  if (!learnerOrRole) return false;
  const role = typeof learnerOrRole === 'string' ? learnerOrRole : learnerOrRole.role;
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return isSpeakerRole(role) || isDeputySpeakerRole(role) || r.includes('speaker');
}

/**
 * Resolves authoritative constituency number and name bi-directionally
 * from any Learner, SpeakingRequest, ProceedingsQuestion, or generic record.
 */
export function resolveConstituency(
  item?: {
    constituency_number?: number | string | null;
    constituency_name?: string | null;
    confirmed_constituency_number?: number | string | null;
    confirmed_constituency_name?: string | null;
    constituency_no?: number | string | null;
    constituency?: string | null;
    student_id?: string | null;
    learner_id?: string | null;
    id?: string | null;
  } | null,
  learnersSource?: Learner[] | Map<string, Learner> | null
): ResolvedConstituency {
  if (!item) {
    return { formatted: '' };
  }

  let rawNum = item.constituency_number ?? item.confirmed_constituency_number ?? item.constituency_no;
  let rawName = item.constituency_name ?? item.confirmed_constituency_name ?? item.constituency;

  // If learner_id or student_id is available, check learners source for authoritative allocation
  const lookupId = item.learner_id || item.student_id;
  const lookupName = (item as any).student_name || (item as any).learner_name || (item as any).full_name;
  if (learnersSource) {
    let matchedLearner: Learner | undefined;
    if (lookupId) {
      if (learnersSource instanceof Map) {
        matchedLearner = learnersSource.get(lookupId);
      } else if (Array.isArray(learnersSource)) {
        matchedLearner = learnersSource.find(l => l.id === lookupId);
      }
    }
    if (!matchedLearner && lookupName) {
      const cleanLookup = String(lookupName).trim().toLowerCase();
      const allLearners = learnersSource instanceof Map ? Array.from(learnersSource.values()) : learnersSource;
      matchedLearner = allLearners.find(l => {
        const ln = (l.full_name || '').trim().toLowerCase();
        return ln === cleanLookup || cleanLookup.includes(ln) || ln.includes(cleanLookup);
      });
    }
    if (matchedLearner) {
      if (rawNum === undefined || rawNum === null || rawNum === '') {
        rawNum = matchedLearner.constituency_number;
      }
      if (!rawName || rawName === 'MLA' || rawName === 'Tamil Nadu' || rawName === 'General Assembly') {
        rawName = matchedLearner.constituency_name;
      }
    }
  }

  let parsedNum: number | undefined;
  if (rawNum !== undefined && rawNum !== null && rawNum !== '') {
    const n = Number(rawNum);
    if (!isNaN(n) && n > 0) {
      parsedNum = n;
    }
  }

  let parsedName: string | undefined = rawName ? String(rawName).trim() : undefined;

  // If rawName contains combined string like "#16 — Egmore" or "16 - Egmore" or "16. Egmore" or "161 – Pattukkottai"
  if (parsedName) {
    const matchCombined = parsedName.match(/^#?\s*(\d{1,3})\s*[-\u2013\u2014.:]\s*(.+)$/);
    if (matchCombined) {
      const extractedNum = Number(matchCombined[1]);
      const extractedName = matchCombined[2].trim();
      if (!parsedNum && !isNaN(extractedNum)) {
        parsedNum = extractedNum;
      }
      parsedName = extractedName;
    }
  }

  // Strip duplicate prefix if parsedName still starts with a constituency number pattern
  if (parsedName) {
    parsedName = parsedName.replace(/^#?\d{1,3}\s*[-\u2013\u2014.:]\s*/, '').trim();
  }

  // Cross-reference with TN_CONSTITUENCIES master data
  if (parsedNum && (!parsedName || parsedName.toLowerCase().startsWith('constituency #') || parsedName === 'MLA' || parsedName === 'Tamil Nadu')) {
    const master = byNumber.get(parsedNum);
    if (master) {
      parsedName = master.name;
    }
  } else if (!parsedNum && parsedName) {
    const norm = normalizeConstStr(parsedName);
    let master = byNormName.get(norm);
    if (!master) {
      // Substring/prefix matching against master constituencies (e.g. "Pattukkottai (Thanjavur)" matches "Pattukkottai")
      for (const [normKey, c] of byNormName.entries()) {
        if (norm.startsWith(normKey) || normKey.startsWith(norm)) {
          master = c;
          break;
        }
      }
    }
    if (master) {
      parsedNum = master.number;
      parsedName = master.name;
    }
  } else if (parsedNum && parsedName) {
    // Validate if the name matches master for that number
    const master = byNumber.get(parsedNum);
    if (master && normalizeConstStr(master.name) === normalizeConstStr(parsedName)) {
      parsedName = master.name; // Use canonical spelling
    }
  }

  // Build prominent consistent display: "#16 — Egmore"
  let formatted = '';
  if (parsedNum && parsedName) {
    formatted = `#${parsedNum} — ${parsedName}`;
  } else if (parsedNum) {
    formatted = `#${parsedNum} — Constituency #${parsedNum}`;
  } else if (parsedName) {
    formatted = parsedName;
  }

  return {
    number: parsedNum,
    name: parsedName,
    formatted
  };
}

/**
 * Returns formatted constituency string (e.g. "#16 — Egmore")
 * Prominently including the constituency number everywhere required.
 */
export function formatMemberConstituency(
  item?: any,
  learnersSource?: Learner[] | Map<string, Learner> | null
): string {
  return resolveConstituency(item, learnersSource).formatted;
}

/**
 * Normalizes a student / delegate name into lowercase alphanumeric tokens.
 * Handles Indian name patterns, initials, punctuation, and extra whitespace.
 */
export function normalizeNameTokens(name?: string): string[] {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Robust name comparator for Indian / Tamil Nadu student names.
 * Supports:
 * - Exact case-insensitive match ("Dhanush" === "dhanush")
 * - Swapped initial positions ("K. Dhanush" === "Dhanush K", "BOOMESH.M" === "M. BOOMESH")
 * - Spacing and dot variations ("S.praveen kumar" === "Praveen Kumar S")
 * - Distinguishes students with different initials ("Rithika S" !== "Rithika J")
 */
export function areNamesMatching(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Single-letter initials comparison:
  // If both names have single-letter initials and they do NOT overlap, they are different people!
  const initialsA = tokensA.filter(t => t.length === 1);
  const initialsB = tokensB.filter(t => t.length === 1);
  if (initialsA.length > 0 && initialsB.length > 0) {
    const hasOverlap = initialsA.some(init => initialsB.includes(init));
    if (!hasOverlap) {
      return false; // Distinct initials -> different individuals
    }
  }

  // Permutation / token order match (e.g. "K. Dhanush" and "Dhanush K")
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return true;

  // Multi-letter tokens match when one or both have single-letter initial(s)
  const mainTokensA = tokensA.filter(t => t.length > 1);
  const mainTokensB = tokensB.filter(t => t.length > 1);
  if (mainTokensA.length > 0 && mainTokensB.length > 0) {
    if (mainTokensA.sort().join(' ') === mainTokensB.sort().join(' ')) {
      return true;
    }
  }

  return false;
}

export interface LearnerQuestionMatchResult {
  matches: boolean;
  matchedBy?: 'student_id' | 'learner_id' | 'delegate_id' | 'member_id' | 'participant_id' | 'user_id' | 'access_code' | 'exact_name' | 'normalized_name' | 'constituency_and_name';
  reason?: string;
}

/**
 * Authoritative bi-directional matching between a Learner record and a ProceedingsQuestion.
 * Checks primary UUID, alias IDs, access codes, exact names, tokenized names, and constituency.
 * Strictly enforces event isolation when event IDs are present.
 */
export function isLearnerQuestionMatch(
  learner?: Learner | null,
  question?: ProceedingsQuestion | null,
  targetEventId?: string
): LearnerQuestionMatchResult {
  if (!learner || !question) return { matches: false };

  // Event isolation: A question explicitly tagged with another event must NEVER mark this learner as submitted
  const qEvId = question.event_id;
  const lEvId = learner.event_id || targetEventId;
  if (qEvId && lEvId && qEvId !== lEvId) {
    return { matches: false, reason: 'EVENT_MISMATCH' };
  }

  // 1. Authoritative primary & alias ID matches
  const qStudentId = question.student_id;
  const qLearnerId = (question as any).learner_id;
  const qDelegateId = (question as any).delegate_id;
  const qMemberId = (question as any).member_id;
  const qParticipantId = (question as any).participant_id;
  const qUserId = (question as any).user_id;

  if (qStudentId && learner.id && qStudentId === learner.id) return { matches: true, matchedBy: 'student_id' };
  if (qLearnerId && learner.id && qLearnerId === learner.id) return { matches: true, matchedBy: 'learner_id' };
  if (qDelegateId && learner.id && qDelegateId === learner.id) return { matches: true, matchedBy: 'delegate_id' };
  if (qMemberId && learner.id && qMemberId === learner.id) return { matches: true, matchedBy: 'member_id' };
  if (qParticipantId && learner.id && qParticipantId === learner.id) return { matches: true, matchedBy: 'participant_id' };
  if (qUserId && learner.id && qUserId === learner.id) return { matches: true, matchedBy: 'user_id' };

  // 2. Access code match (case-insensitive)
  const qAccessCode = (question as any).access_code;
  if (qAccessCode && learner.access_code && String(qAccessCode).trim().toUpperCase() === String(learner.access_code).trim().toUpperCase()) {
    return { matches: true, matchedBy: 'access_code' };
  }

  // 3. Name comparisons (exact and token-normalized)
  const qName = question.student_name || (question as any).learner_name || (question as any).delegate_name || (question as any).member_name;
  const lName = learner.full_name || (learner as any).name;
  if (qName && lName) {
    if (qName.trim().toLowerCase() === lName.trim().toLowerCase()) {
      return { matches: true, matchedBy: 'exact_name' };
    }
    if (areNamesMatching(qName, lName)) {
      return { matches: true, matchedBy: 'normalized_name' };
    }
  }

  // 4. Constituency number + partial name token match
  const qConstNum = question.constituency_number || (question as any).constituency_no;
  const lConstNum = learner.constituency_number;
  if (qConstNum && lConstNum && Number(qConstNum) === Number(lConstNum) && qName && lName) {
    const qTokens = normalizeNameTokens(qName).filter(t => t.length > 2);
    const lTokens = normalizeNameTokens(lName).filter(t => t.length > 2);
    if (qTokens.some(t => lTokens.includes(t))) {
      return { matches: true, matchedBy: 'constituency_and_name' };
    }
  }

  return { matches: false };
}

/**
 * Boolean wrapper for isLearnerQuestionMatch.
 */
export function isLearnerQuestion(
  learner?: Learner | null,
  question?: ProceedingsQuestion | null,
  targetEventId?: string
): boolean {
  return isLearnerQuestionMatch(learner, question, targetEventId).matches;
}

