import type { ProceedingsQuestion } from '../types';
import { getCanonicalQuestionStatus } from '../types';

/**
 * Formats an integer as a permanent Question Number: Q-0001, Q-0002, etc.
 */
export function formatQuestionNumber(num: number): string {
  if (!num || isNaN(num) || num < 1) return 'Q-0001';
  return `Q-${String(num).padStart(4, '0')}`;
}

/**
 * Parses a question number string (e.g. "Q-0061", "q-61", "61") into an integer.
 * Returns null if the string is not a valid question number format.
 */
export function parseQuestionNumber(str?: string | null): number | null {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  const match = trimmed.match(/^Q-(\d+)$/i) || trimmed.match(/^(\d+)$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return isNaN(parsed) || parsed < 1 ? null : parsed;
}

/**
 * Returns the next available sequential permanent Question Number for a list of questions in an event.
 */
export function getNextQuestionNumber(questions: ProceedingsQuestion[]): string {
  let maxNum = 0;
  for (const q of questions) {
    const num = parseQuestionNumber(q.question_number);
    if (num && num > maxNum) {
      maxNum = num;
    }
  }
  return formatQuestionNumber(maxNum + 1);
}

/**
 * Deterministically and idempotently ensures all questions have a permanent Question Number.
 * 
 * Rules:
 * 1. Scope: Questions belonging to an event.
 * 2. Questions that already have a valid question_number are NEVER modified.
 * 3. Unassigned questions are sorted deterministically:
 *    - created_at ASC
 *    - id ASC as tie-breaker
 * 4. Sequential unused numbers are allocated starting from 1 (skipping already assigned numbers).
 * 5. Never touches technical ID, question text, student identity, ministry, status, or queue order.
 */
export function ensureQuestionNumbers(questions: ProceedingsQuestion[]): {
  questions: ProceedingsQuestion[];
  changed: boolean;
} {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { questions: [], changed: false };
  }

  const usedNumbers = new Set<number>();
  let hasMissing = false;

  for (const q of questions) {
    const parsed = parseQuestionNumber(q.question_number);
    if (parsed) {
      usedNumbers.add(parsed);
    } else {
      hasMissing = true;
    }
  }

  if (!hasMissing) {
    return { questions, changed: false };
  }

  // Identify unnumbered questions and sort them deterministically
  const unnumberedWithIndex: { q: ProceedingsQuestion; origIndex: number }[] = [];
  questions.forEach((q, idx) => {
    if (!parseQuestionNumber(q.question_number)) {
      unnumberedWithIndex.push({ q, origIndex: idx });
    }
  });

  unnumberedWithIndex.sort((a, b) => {
    const tA = new Date(a.q.created_at || 0).getTime();
    const tB = new Date(b.q.created_at || 0).getTime();
    if (tA !== tB) return tA - tB;
    return (a.q.id || '').localeCompare(b.q.id || '');
  });

  let nextCandidate = 1;
  const assignments = new Map<number, string>();

  for (const item of unnumberedWithIndex) {
    while (usedNumbers.has(nextCandidate)) {
      nextCandidate++;
    }
    const qNum = formatQuestionNumber(nextCandidate);
    assignments.set(item.origIndex, qNum);
    usedNumbers.add(nextCandidate);
    nextCandidate++;
  }

  const result = questions.map((q, idx) => {
    if (assignments.has(idx)) {
      return {
        ...q,
        question_number: assignments.get(idx)!
      };
    }
    return q;
  });

  return { questions: result, changed: true };
}

export interface QuestionFilterCriteria {
  search?: string;
  statusFilter?: string;
  benchFilter?: string;
  ministryFilter?: string;
  questionNumberFrom?: number | null;
  questionNumberTo?: number | null;
}

/**
 * Pure, in-memory, read-only search and filtering for proceedings questions.
 * Supports:
 * - Exact Question Number match (e.g. "Q-0061" or "61")
 * - Technical Question ID match (e.g. "q-1790696802309-9zqtj")
 * - Student name, constituency name/number, ministry, and question text
 * - Combined with status, bench, ministry, and question number range filters.
 */
export function filterProceedingsQuestions(
  questions: ProceedingsQuestion[],
  criteria: QuestionFilterCriteria
): ProceedingsQuestion[] {
  const {
    search = '',
    statusFilter = 'All',
    benchFilter = 'All',
    ministryFilter = 'All',
    questionNumberFrom,
    questionNumberTo
  } = criteria;

  const trimmedQuery = search.trim();
  const queryLower = trimmedQuery.toLowerCase();

  // Check if query is an exact Question Number match candidate: "Q-0061", "q-61", or pure numeric "61"
  const parsedSearchQNum = parseQuestionNumber(trimmedQuery);
  const formattedSearchQNum = parsedSearchQNum ? formatQuestionNumber(parsedSearchQNum) : null;

  // Check if query is an exact technical ID candidate (e.g., starts with "q-" or matches an ID directly)
  const isExactTechnicalId = questions.some(q => q.id.toLowerCase() === queryLower);

  return questions.filter(q => {
    // 1. Status Filter
    const canonicalStatus = getCanonicalQuestionStatus(q);
    if (statusFilter !== 'All') {
      if (statusFilter === 'Approved') {
        if (canonicalStatus !== 'Approved' && canonicalStatus !== 'Starred') return false;
      } else if (canonicalStatus !== statusFilter) {
        return false;
      }
    }

    // 2. Bench Filter
    if (benchFilter !== 'All' && (q.bench || '').toLowerCase() !== benchFilter.toLowerCase()) {
      return false;
    }

    // 3. Ministry Filter
    if (ministryFilter !== 'All' && q.ministry !== ministryFilter) {
      return false;
    }

    // 4. Question Number Range Filter (From / To)
    if (questionNumberFrom != null || questionNumberTo != null) {
      const qNum = parseQuestionNumber(q.question_number);
      if (qNum == null) return false;
      if (questionNumberFrom != null && qNum < questionNumberFrom) return false;
      if (questionNumberTo != null && qNum > questionNumberTo) return false;
    }

    // 5. Search Query Filter
    if (!trimmedQuery) {
      return true;
    }

    // Exact Question Number Priority Match:
    // If the search looks like a question number ("Q-0061" or "61")
    if (formattedSearchQNum) {
      const qNum = parseQuestionNumber(q.question_number);
      if (q.question_number?.toUpperCase() === formattedSearchQNum.toUpperCase() || qNum === parsedSearchQNum) {
        return true;
      }
      // If the query was purely a question number like Q-0061 or pure digits "61",
      // we check if ANY question in the dataset matches this question number.
      // If at least one question matches this question number exactly, do not match unrelated text.
      const hasExactQNumMatch = questions.some(other => {
        const otherNum = parseQuestionNumber(other.question_number);
        return other.question_number?.toUpperCase() === formattedSearchQNum.toUpperCase() || otherNum === parsedSearchQNum;
      });
      if (hasExactQNumMatch) {
        return false;
      }
    }

    // Exact Technical ID Match Priority
    if (isExactTechnicalId) {
      return q.id.toLowerCase() === queryLower;
    }

    // Broad multi-field text search
    const qNumStr = (q.question_number || '').toLowerCase();
    const idStr = (q.id || '').toLowerCase();
    const studentName = (q.student_name || '').toLowerCase();
    const constituency = (q.constituency || '').toLowerCase();
    const constituencyName = (q.constituency_name || '').toLowerCase();
    const constituencyNum = q.constituency_number !== undefined && q.constituency_number !== null ? String(q.constituency_number) : '';
    const ministry = (q.ministry || q.target || q.target_ministry_name || q.target_name || '').toLowerCase();
    const qText = (q.question_text || '').toLowerCase();

    return (
      qNumStr.includes(queryLower) ||
      idStr.includes(queryLower) ||
      studentName.includes(queryLower) ||
      constituency.includes(queryLower) ||
      constituencyName.includes(queryLower) ||
      constituencyNum === trimmedQuery ||
      ministry.includes(queryLower) ||
      qText.includes(queryLower)
    );
  });
}
