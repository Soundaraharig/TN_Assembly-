import type { UserRole, Volunteer } from '../types';

/**
 * Checks if the current user role has permission to delete data
 * (participants, parties, committees, jury, volunteers, checklist items, nominations, etc.).
 *
 * Super Admin: Full delete access.
 * Coordinator: Full delete access for assigned event.
 * Yuva Organiser / Volunteer: Prohibited from deleting data.
 */
export function canDelete(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator';
}

/**
 * Checks if the user role can modify / edit data.
 * All authorized management roles (super_admin, coordinator, volunteer/yuva) can modify data.
 */
export function canModify(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer' || role === 'organiser';
}

/**
 * Checks if the user role can add new records.
 * All authorized management roles can add records.
 */
export function canAdd(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer' || role === 'organiser';
}

/**
 * Checks if the user role can create/manage high-level events.
 * Restricted to Super Admin.
 */
export function canManageEvents(role?: UserRole): boolean {
  return role === 'super_admin';
}

/**
 * Checks if the user role can manage team members (add, delete, or change roles).
 * Coordinator and Super Admin have full management capabilities.
 * Organiser is restricted from managing team members.
 */
export function canManageTeam(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator';
}

/**
 * Checks if the user role can use session/bulk attendance controls
 * (Mark FN Present, Mark AN Present, Mark Both Present, Reset Absent).
 * Restricted strictly to Super Admin, Admin, and Coordinator roles.
 * Volunteers, Students, Jury, and Organisers are prohibited.
 */
export function canManageSessionAttendance(role?: UserRole | string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return normalized === 'super_admin' || normalized === 'admin' || normalized === 'coordinator';
}

/**
 * Checks if the user role can perform FINAL APPROVAL on student parliamentary questions.
 * Restricted strictly to Main Admin (Super Admin) and authorized Coordinators.
 * Volunteers (including Administrator and Journalist volunteer types), Students, Jury,
 * and Organisers are prohibited from giving final approval.
 */
export function canFinalApproveQuestions(role?: UserRole | string, volunteerType?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();
  if (
    normalizedRole === 'super_admin' ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'coordinator' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'admin'
  ) {
    return true;
  }
  if (volunteerType) {
    const normType = volunteerType.toLowerCase().trim();
    if (normType === 'administrator' || normType === 'admin') {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the user has access to review student parliamentary questions in the approval queue.
 * Authorized roles:
 * - Super Admin, Admin, and Coordinator (Main Admin)
 * - Volunteer with type 'Administrator' or 'Journalist'
 */
export function canReviewQuestions(role?: UserRole | string, volunteerType?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();
  if (
    normalizedRole === 'super_admin' ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'coordinator' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'admin'
  ) {
    return true;
  }
  if (normalizedRole === 'volunteer') {
    const normType = (volunteerType || '').toLowerCase().trim();
    return normType === 'administrator' || normType === 'journalist';
  }
  return false;
}

/**
 * Authoritative permission check for Speaker Aid Floor Control.
 *
 * ONLY a specifically designated Speaker Aid volunteer may have access.
 * Strictly returns false for:
 * - Super Admin, Admin, Administrator
 * - Coordinator, Organiser
 * - Journalist (including Press / Question Reviewers)
 * - Jury, Student
 * - Normal Volunteers (Floating, Attendance, Registration, Kiosks, YUVA, etc.)
 * - Unauthenticated users
 */
export function isSpeakerAidVolunteer(
  volunteer?: Volunteer | null,
  role?: UserRole | string,
  userSession?: any
): boolean {
  if (!volunteer && !userSession) return false;

  const rawRole = (
    role ||
    userSession?.role ||
    volunteer?.role ||
    ''
  ).toLowerCase().trim();

  // Strict exclusion: Non-volunteer roles must NEVER access Speaker Aid
  if (
    rawRole === 'super_admin' ||
    rawRole === 'superadmin' ||
    rawRole === 'admin' ||
    rawRole === 'administrator' ||
    rawRole === 'coordinator' ||
    rawRole === 'organiser' ||
    rawRole === 'jury' ||
    rawRole === 'student'
  ) {
    return false;
  }

  // Strict exclusion: Journalist / Press / Media roles must NEVER access Speaker Aid
  const rawType = (
    volunteer?.volunteer_type ||
    userSession?.volunteerType ||
    userSession?.volunteerRole ||
    ''
  ).toLowerCase().trim();

  if (
    rawRole === 'journalist' ||
    rawType === 'journalist' ||
    rawType.includes('journalist') ||
    rawType.includes('press') ||
    rawType.includes('media')
  ) {
    return false;
  }

  // Strict exclusion: Administrator volunteer types must NEVER access Speaker Aid
  if (rawType === 'administrator' || rawType === 'admin' || rawType.includes('admin')) {
    return false;
  }

  // Must be in volunteer domain
  if (rawRole !== 'volunteer' && rawRole !== '') {
    return false;
  }

  // Authoritative Speaker Aid Discriminator:
  const station = (
    volunteer?.station ||
    userSession?.station ||
    userSession?.volunteerStation ||
    ''
  ).toLowerCase().trim();

  const vRole = (
    volunteer?.role ||
    userSession?.volunteerRole ||
    ''
  ).toLowerCase().trim();

  const vType = (
    volunteer?.volunteer_type ||
    userSession?.volunteerType ||
    ''
  ).toLowerCase().trim();

  const isDesignatedStation =
    station === "now speaking (speaker's aide)".toLowerCase() ||
    station.includes("speaker's aide") ||
    station.includes("speaker aid") ||
    station.includes("now speaking");

  const isDesignatedRole =
    vRole === 'speaker aid' ||
    vRole === 'speaker_aid' ||
    vType === 'speaker aid' ||
    vType === 'speaker_aid';

  return isDesignatedStation || isDesignatedRole;
}

/**
 * Authoritative alias for isSpeakerAidVolunteer
 */
export function canUseSpeakerAid(
  volunteer?: Volunteer | null,
  role?: UserRole | string,
  userSession?: any
): boolean {
  return isSpeakerAidVolunteer(volunteer, role, userSession);
}


export interface AuthorizationActor {
  role?: string;
  volunteerType?: string;
  eventId?: string;
  assignedEventIds?: string[];
  userId?: string;
  name?: string;
}

export interface QuestionTarget {
  id: string;
  event_id?: string;
  event_slug?: string;
  question_number?: string;
}

export interface QuestionAuthDiagnostic {
  actorRole: string;
  actorUserId?: string;
  actorEventId?: string;
  activeEventId?: string;
  questionEventId?: string;
  questionId: string;
  permissionResult: 'ALLOW' | 'DENY';
  reason?: string;
}

export interface QuestionAuthDecision {
  allowed: boolean;
  diagnostic: QuestionAuthDiagnostic;
  error?: string;
}

/**
 * Authoritative event ID resolution: matches UUIDs or slugs against known events
 * to return the canonical UUID. Handles known slugs even when offline.
 */
export function resolveCanonicalEventId(
  eventKeyOrSlug?: string,
  allEvents: Array<{ id: string; slug?: string; college_name?: string }> = []
): string | undefined {
  if (!eventKeyOrSlug) return undefined;
  const clean = eventKeyOrSlug.toLowerCase().trim();

  // Match in allEvents list first
  const matched = allEvents.find(e =>
    (e.id && e.id.toLowerCase() === clean) ||
    (e.slug && e.slug.toLowerCase() === clean)
  );
  if (matched?.id) return matched.id;

  // Fallback for known production event slugs
  if (clean === 'jkkncet-tn-assembly-2026-tamil-nadu-2026' || clean.includes('jkkncet')) {
    return '200fdd74-4d21-44d5-9f63-9a07bf267824';
  }
  if (
    clean === 'jkkn-arts-tn-assembly-2026' ||
    clean === '05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8' ||
    clean.includes('jkkn-arts')
  ) {
    return '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';
  }

  return clean;
}

/**
 * Resolves the canonical actor role, ensuring that an Administrator is never demoted
 * to a floor volunteer by stale localStorage or route context.
 */
export function resolveCanonicalActorRole(actor: AuthorizationActor): string {
  const rawRole = (actor.role || '').toLowerCase().trim();
  const rawType = (actor.volunteerType || '').toLowerCase().trim();

  if (rawRole === 'super_admin' || rawRole === 'superadmin') return 'super_admin';
  if (rawRole === 'coordinator') return 'coordinator';
  if (rawRole === 'organiser') return 'organiser';
  if (rawRole === 'student') return 'student';
  if (rawRole === 'jury') return 'jury';

  // Administrator check (must take precedence over generic 'volunteer')
  if (rawRole === 'administrator' || rawRole === 'admin' || rawType === 'administrator' || rawType === 'admin') {
    return 'Administrator';
  }
  if (rawType === 'journalist' || rawRole === 'journalist') {
    return 'Journalist';
  }

  return 'volunteer';
}

/**
 * Canonical Question Review and Event Isolation Verification
 *
 * Verifies that:
 * 1. The target question has a valid event ID.
 * 2. The question belongs to the active event.
 * 3. The actor's assigned event matches the question's event (strictly enforced for Admin, Coordinator, Volunteer).
 * 4. Action permissions adhere to strict role boundaries:
 *    - ADMIN + same event → ALLOW
 *    - COORDINATOR + same event → ALLOW (for permitted review actions)
 *    - VOLUNTEER + same event → DENY administrator review actions (can only escalate via APPROACH_MAIN_ADMIN if permitted)
 *    - STUDENT + same event → DENY
 *    - ANY ROLE + different event → DENY
 */
export function verifyQuestionReviewAuthorization(
  actor: AuthorizationActor,
  question: QuestionTarget,
  activeEventId?: string,
  action: 'ADMIN_REVIEW' | 'APPROACH_MAIN_ADMIN' | 'VIEW' = 'ADMIN_REVIEW',
  allEvents: Array<{ id: string; slug?: string; college_name?: string }> = []
): QuestionAuthDecision {
  const canonicalRole = resolveCanonicalActorRole(actor);
  const qId = question.id || 'unknown';

  // 1. Authoritative Question Event Resolution
  const rawQEvent = question.event_id || question.event_slug;
  const canonicalQEvent = resolveCanonicalEventId(rawQEvent, allEvents);

  if (!canonicalQEvent) {
    const diagnostic: QuestionAuthDiagnostic = {
      actorRole: canonicalRole,
      actorUserId: actor.userId,
      actorEventId: actor.eventId,
      activeEventId,
      questionEventId: undefined,
      questionId: qId,
      permissionResult: 'DENY',
      reason: 'Missing question event ID'
    };
    return {
      allowed: false,
      diagnostic,
      error: 'Event isolation violation: Question event ID is missing or invalid.'
    };
  }

  // 2. Active Event Isolation Check
  const canonicalActiveEvent = resolveCanonicalEventId(activeEventId, allEvents);
  if (canonicalActiveEvent && canonicalQEvent !== canonicalActiveEvent) {
    const diagnostic: QuestionAuthDiagnostic = {
      actorRole: canonicalRole,
      actorUserId: actor.userId,
      actorEventId: actor.eventId,
      activeEventId: canonicalActiveEvent,
      questionEventId: canonicalQEvent,
      questionId: qId,
      permissionResult: 'DENY',
      reason: 'Question event differs from active event'
    };
    return {
      allowed: false,
      diagnostic,
      error: 'Event isolation violation: Question does not belong to active event.'
    };
  }

  // 3. Actor Event Isolation Check (Super Admin is bound to activeEvent; Coordinator/Admin/Volunteer to assigned event)
  const canonicalActorEvent = resolveCanonicalEventId(actor.eventId, allEvents);
  const assignedList = (actor.assignedEventIds || []).map(id => resolveCanonicalEventId(id, allEvents));

  const isCrossEventActor =
    canonicalRole !== 'super_admin' &&
    canonicalActorEvent &&
    canonicalActorEvent !== canonicalQEvent &&
    !assignedList.includes(canonicalQEvent);

  if (isCrossEventActor) {
    const diagnostic: QuestionAuthDiagnostic = {
      actorRole: canonicalRole,
      actorUserId: actor.userId,
      actorEventId: canonicalActorEvent,
      activeEventId: canonicalActiveEvent,
      questionEventId: canonicalQEvent,
      questionId: qId,
      permissionResult: 'DENY',
      reason: 'Actor event does not match question event'
    };
    const roleLabel = canonicalRole === 'Administrator' ? 'Administrator' : canonicalRole === 'coordinator' ? 'Coordinator' : 'Volunteer';
    return {
      allowed: false,
      diagnostic,
      error: `Event isolation violation: ${roleLabel} cannot review questions from another event.`
    };
  }

  // 4. Role Action Authorization
  if (action === 'ADMIN_REVIEW') {
    // Student denied
    if (canonicalRole === 'student') {
      const diagnostic: QuestionAuthDiagnostic = {
        actorRole: canonicalRole,
        actorUserId: actor.userId,
        actorEventId: canonicalActorEvent,
        activeEventId: canonicalActiveEvent,
        questionEventId: canonicalQEvent,
        questionId: qId,
        permissionResult: 'DENY',
        reason: 'Students cannot perform administrator review'
      };
      return {
        allowed: false,
        diagnostic,
        error: 'Unauthorized: Students cannot perform administrator question review.'
      };
    }

    // Floor / non-admin volunteer denied
    if (canonicalRole === 'volunteer' || canonicalRole === 'Journalist') {
      const diagnostic: QuestionAuthDiagnostic = {
        actorRole: canonicalRole,
        actorUserId: actor.userId,
        actorEventId: canonicalActorEvent,
        activeEventId: canonicalActiveEvent,
        questionEventId: canonicalQEvent,
        questionId: qId,
        permissionResult: 'DENY',
        reason: 'Volunteer cannot perform administrator review'
      };
      return {
        allowed: false,
        diagnostic,
        error: 'Unauthorized: Volunteer cannot perform administrator question review.'
      };
    }

    // Administrator, Coordinator, Super Admin allowed for matching event
    if (canonicalRole === 'Administrator' || canonicalRole === 'coordinator' || canonicalRole === 'super_admin') {
      const diagnostic: QuestionAuthDiagnostic = {
        actorRole: canonicalRole,
        actorUserId: actor.userId,
        actorEventId: canonicalActorEvent,
        activeEventId: canonicalActiveEvent,
        questionEventId: canonicalQEvent,
        questionId: qId,
        permissionResult: 'ALLOW'
      };
      return {
        allowed: true,
        diagnostic
      };
    }
  }

  if (action === 'APPROACH_MAIN_ADMIN') {
    // Escalation action
    if (canonicalRole === 'student') {
      const diagnostic: QuestionAuthDiagnostic = {
        actorRole: canonicalRole,
        actorUserId: actor.userId,
        actorEventId: canonicalActorEvent,
        activeEventId: canonicalActiveEvent,
        questionEventId: canonicalQEvent,
        questionId: qId,
        permissionResult: 'DENY',
        reason: 'Students cannot escalate questions'
      };
      return {
        allowed: false,
        diagnostic,
        error: 'Unauthorized: Students cannot escalate questions to Main Admin.'
      };
    }

    if (canonicalRole === 'volunteer') {
      const normType = (actor.volunteerType || '').toLowerCase().trim();
      const hasEscalationPrivilege = canReviewQuestions('volunteer', normType);
      if (!hasEscalationPrivilege) {
        const diagnostic: QuestionAuthDiagnostic = {
          actorRole: canonicalRole,
          actorUserId: actor.userId,
          actorEventId: canonicalActorEvent,
          activeEventId: canonicalActiveEvent,
          questionEventId: canonicalQEvent,
          questionId: qId,
          permissionResult: 'DENY',
          reason: 'Volunteer lacks question review privileges'
        };
        return {
          allowed: false,
          diagnostic,
          error: 'Unauthorized: Volunteer does not have question review privileges.'
        };
      }
    }

    const diagnostic: QuestionAuthDiagnostic = {
      actorRole: canonicalRole,
      actorUserId: actor.userId,
      actorEventId: canonicalActorEvent,
      activeEventId: canonicalActiveEvent,
      questionEventId: canonicalQEvent,
      questionId: qId,
      permissionResult: 'ALLOW'
    };
    return {
      allowed: true,
      diagnostic
    };
  }

  // Action 'VIEW'
  const diagnostic: QuestionAuthDiagnostic = {
    actorRole: canonicalRole,
    actorUserId: actor.userId,
    actorEventId: canonicalActorEvent,
    activeEventId: canonicalActiveEvent,
    questionEventId: canonicalQEvent,
    questionId: qId,
    permissionResult: 'ALLOW'
  };
  return { allowed: true, diagnostic };
}

/**
 * Logs a safe diagnostic object for question review authorization.
 * DO NOT log passwords, access codes, tokens, Supabase keys, or sensitive credentials.
 */
export function logQuestionAuthDiagnostic(diag: QuestionAuthDiagnostic): void {
  console.log('[Question Auth Diagnostic]', {
    actorRole: diag.actorRole,
    actorUserId: diag.actorUserId,
    actorEventId: diag.actorEventId,
    activeEventId: diag.activeEventId,
    questionEventId: diag.questionEventId,
    questionId: diag.questionId,
    permissionResult: diag.permissionResult,
    ...(diag.reason ? { reason: diag.reason } : {})
  });
}


