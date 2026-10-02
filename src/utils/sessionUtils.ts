/**
 * Session Canonicalization Engine
 * 
 * Guarantees that any session reference (whether raw canonical slug,
 * AgendaItem UUID, or human-readable title) maps deterministically to a single
 * canonical session key across scoring, speaking turns, and leaderboards.
 */

export interface CanonicalSessionDefinition {
  canonicalId: string;
  canonicalName: string;
  patterns: RegExp[];
  orderNumber: number;
}

export const CANONICAL_SESSIONS: CanonicalSessionDefinition[] = [
  {
    canonicalId: 'zero_hour',
    canonicalName: 'Zero Hour',
    patterns: [/zero\s*hour/i, /^zero$/i, /zero_hour/i],
    orderNumber: 1
  },
  {
    canonicalId: 'question_hour',
    canonicalName: 'Question Hour',
    patterns: [/question\s*hour/i, /^question$/i, /question_hour/i],
    orderNumber: 2
  },
  {
    canonicalId: 'bill_presenting',
    canonicalName: 'Bill Presenting',
    patterns: [/bill\s*(present|intro|vot|read|pass)/i, /bill_presenting/i],
    orderNumber: 3
  },
  {
    canonicalId: '90_sec_speech',
    canonicalName: '90 Sec Speech',
    patterns: [/90\s*(sec|second)?\s*speech/i, /90_sec_speech/i],
    orderNumber: 4
  }
];

export interface ResolvedCanonicalSession {
  canonicalId: string;
  displayName: string;
  isCanonical: boolean;
  orderNumber: number;
}

/**
 * Resolves any session identifier (agenda UUID, title, slug, or legacy string)
 * into a single deterministic canonical session identity.
 * 
 * @param sessionId - The session identifier (e.g. UUID, slug, or undefined)
 * @param sessionName - Optional human-readable title (e.g. "Zero Hour")
 * @param agendaItems - Optional agenda items list to resolve UUIDs
 */
export function resolveCanonicalSession(
  sessionId?: string | null,
  sessionName?: string | null,
  agendaItems?: Array<{ id: string; title?: string; description?: string }>
): ResolvedCanonicalSession {
  const cleanId = (sessionId || '').trim();
  const cleanName = (sessionName || '').trim();

  // 1. Direct match against known canonical slugs
  for (const def of CANONICAL_SESSIONS) {
    if (cleanId.toLowerCase() === def.canonicalId.toLowerCase()) {
      return {
        canonicalId: def.canonicalId,
        displayName: cleanName || def.canonicalName,
        isCanonical: true,
        orderNumber: def.orderNumber
      };
    }
  }

  // 2. Resolve via AgendaItem list if sessionId is a UUID
  if (agendaItems && cleanId) {
    const matchedAgenda = agendaItems.find(a => a.id === cleanId);
    if (matchedAgenda) {
      const agendaTitle = matchedAgenda.title || '';
      const agendaDesc = matchedAgenda.description || '';
      for (const def of CANONICAL_SESSIONS) {
        if (def.patterns.some(p => p.test(agendaTitle) || p.test(agendaDesc))) {
          return {
            canonicalId: def.canonicalId,
            displayName: matchedAgenda.title || def.canonicalName,
            isCanonical: true,
            orderNumber: def.orderNumber
          };
        }
      }
      // If it's a custom agenda item not matching canonical 4
      return {
        canonicalId: matchedAgenda.id,
        displayName: matchedAgenda.title || 'Special Session',
        isCanonical: false,
        orderNumber: 10
      };
    }
  }

  // 3. Pattern match against cleanName or cleanId
  const candidateText = `${cleanName} ${cleanId}`.trim();
  for (const def of CANONICAL_SESSIONS) {
    if (def.patterns.some(p => p.test(candidateText))) {
      return {
        canonicalId: def.canonicalId,
        displayName: cleanName || def.canonicalName,
        isCanonical: true,
        orderNumber: def.orderNumber
      };
    }
  }

  // 4. Fallback for custom or unknown sessions
  const fallbackId = cleanId || (cleanName ? cleanName.toLowerCase().replace(/\s+/g, '_') : 'default_session');
  return {
    canonicalId: fallbackId,
    displayName: cleanName || 'Session',
    isCanonical: false,
    orderNumber: 99
  };
}
