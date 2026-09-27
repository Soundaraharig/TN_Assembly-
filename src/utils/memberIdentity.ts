import { TN_CONSTITUENCIES } from '../data/tnConstituencies';
import type { Learner } from '../types';
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
