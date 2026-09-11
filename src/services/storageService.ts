import type {
  CollegeEvent,
  Coordinator,
  Learner,
  Party,
  Committee,
  BenchType,
  AcademicYear,
  AgendaItem,
  AgendaDay,
  AgendaStatus,
  JuryMember,
  Volunteer,
  UserSession,
  Nomination,
  NominationHistoryEntry,
  Election,
  ElectionCandidate,
  LiveFlashVote,
  BillProceeding,
  ScoreRecord,
  VoteAuditEntry,
  AggregatedScore,
  ParliamentQuestion,
  ChecklistItem,
  ChatMessage,
  FeedbackEntry,
  TeamMember,
  FlashVoteAudience,
  EventDeadline,
  ProceedingsQuestion,
  ProceedingsMotion,
  SecurityAuditLog,
  ProjectorStudioSettings,
  EventDay,
  DayAttendanceRecord,
  EventDayStatus,
  DayAttendanceStatus
} from '../types';
import { getRecordSessionStatuses } from '../types';
import {
  INITIAL_EVENTS,
  INITIAL_COORDINATORS,
  INITIAL_LEARNERS,
  INITIAL_PARTIES,
  INITIAL_COMMITTEES,
  INITIAL_AGENDA,
  INITIAL_JURY,
  INITIAL_VOLUNTEERS,
  INITIAL_NOMINATIONS,
  INITIAL_ELECTIONS,
  INITIAL_FLASH_VOTES,
  INITIAL_CHECKLIST,
  INITIAL_QUESTIONS,
  INITIAL_PROCEEDINGS,
  INITIAL_SCORES,
  INITIAL_CHAT,
  INITIAL_FEEDBACK,
  INITIAL_TEAM
} from '../data/initialMockData';
import {
  runAutoAllocation,
  allocateParties,
  allocateCommittees,
  allocateConstituencies
} from '../utils/allocationEngine';
import type {
  AllocationResult,
  PartyAllocationOptions,
  CommitteeAllocationOptions,
  ConstituencyAllocationOptions
} from '../utils/allocationEngine';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { getEventSlug } from '../utils/slug';

// ---------------------------------------------------------------------------
// Local-storage keys (cache layer)
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  EVENTS: 'tn_assembly_events_v6',
  COORDINATORS: 'tn_assembly_coordinators_v6',
  LEARNERS: 'tn_assembly_learners_v6',
  PARTIES: 'tn_assembly_parties_v6',
  COMMITTEES: 'tn_assembly_committees_v6',
  AGENDA: 'tn_assembly_agenda_v6',
  JURY: 'tn_assembly_jury_v6',
  VOLUNTEERS: 'tn_assembly_volunteers_v6',
  NOMINATIONS: 'tn_assembly_nominations_v6',
  ELECTIONS: 'tn_assembly_elections_v6',
  FLASH_VOTES: 'tn_assembly_flash_votes_v6',
  CHECKLIST: 'tn_assembly_checklist_v6',
  QUESTIONS: 'tn_assembly_questions_v6',
  PROCEEDINGS: 'tn_assembly_proceedings_v6',
  SCORES: 'tn_assembly_scores_v6',
  CHAT: 'tn_assembly_chat_v6',
  FEEDBACK: 'tn_assembly_feedback_v6',
  TEAM: 'tn_assembly_team_v6',
  OPEN_NOMINATIONS: 'tn_assembly_open_nominations_v6',
  ALLOCATION_LOCK: 'tn_assembly_allocation_lock_v6',
  REGISTRATIONS_FROZEN: 'tn_assembly_registrations_frozen_v6',
  SCORES_LOCKED: 'tn_assembly_scores_locked_v6',
  YUVA_ASSIGNMENTS: 'tn_assembly_yuva_assignments_v6',
  DEADLINES: 'tn_assembly_deadlines_v6',
  PROCEEDINGS_QUESTIONS: 'tn_assembly_proceedings_questions_v6',
  PROCEEDINGS_MOTIONS: 'tn_assembly_proceedings_motions_v6',
  DELETED_IDS: 'tn_assembly_deleted_ids_v6',
  AUDIT_LOGS: 'tn_assembly_audit_logs_v1',
  EVENT_DAYS: 'tn_assembly_event_days_v1',
  DAY_ATTENDANCE: 'tn_assembly_day_attendance_v1',
  VOTE_AUDIT_LOG: 'tn_assembly_vote_audit_log_v1',
  LOCK_UPDATED_AT: 'tn_assembly_lock_updated_at_v1'
};

type Listener = () => void;

function genUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uid(_prefix?: string): string {
  return genUuid();
}

function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

function sortLearnersStably(list: Learner[]): Learner[] {
  return [...list].sort((a, b) => {
    const numA = Number(a.constituency_number) || 999999;
    const numB = Number(b.constituency_number) || 999999;
    if (numA !== numB) return numA - numB;
    const codeA = a.access_code || '';
    const codeB = b.access_code || '';
    if (codeA !== codeB) return codeA.localeCompare(codeB);
    return (a.full_name || '').localeCompare(b.full_name || '');
  });
}

// ---------------------------------------------------------------------------
// StorageService — hybrid localStorage + Supabase with pub/sub
// ---------------------------------------------------------------------------
export type WriteErrorHandler = (table: string, action: string, error: any) => void;

class StorageService {
  private listeners: Listener[] = [];
  private realtimeChannel: any = null;
  private syncTimer: any = null;
  private notifyTimer: ReturnType<typeof setTimeout> | null = null;
  private isHydrated: boolean = false;
  private isSyncing: boolean = false;
  private syncError: string | null = null;
  private syncVersion: number = 0;
  private writeErrorHandler: WriteErrorHandler | null = null;
  private inFlightPromises = new Map<string, Promise<{ success: boolean; error: any; data?: any }>>();
  private failedWriteSignatures = new Map<string, number>();
  private fixedLearnerIdsSynced = new Set<string>();

  public setWriteErrorHandler(handler: WriteErrorHandler | null) {
    this.writeErrorHandler = handler;
  }

  private notifyWriteError(table: string, action: string, error: any) {
    if (this.writeErrorHandler) {
      try {
        this.writeErrorHandler(table, action, error);
      } catch (err) {
        console.error('[StorageService] Error executing writeErrorHandler:', err);
      }
    }
  }

  constructor() {
    this.initDefaults();
    if (isSupabaseEnabled) {
      this.checkSupabaseHealth();
      this.syncFromSupabase().catch(err =>
        console.warn('[Supabase] Initial sync failed, using localStorage cache:', err)
      );
      this.setupRealtimeSync();
    } else {
      this.isHydrated = true;
    }
  }

  public async checkSupabaseHealth(): Promise<{ isConnected: boolean; error?: string }> {
    if (!supabase) {
      return { isConnected: false, error: 'Supabase client is not configured (missing VITE_SUPABASE_URL)' };
    }
    try {
      const { error } = await supabase.from('college_events').select('id').limit(1);
      if (error) {
        console.warn('⚠️ [Supabase Health Check] Query failed:', error.message);
        return { isConnected: false, error: error.message };
      }
      console.log('✅ [Supabase Health Check] Connection established successfully with Supabase cloud database.');
      return { isConnected: true };
    } catch (e: any) {
      return { isConnected: false, error: e?.message || 'Network error' };
    }
  }

  public getSyncStatus() {
    return {
      isHydrated: this.isHydrated,
      isSyncing: this.isSyncing,
      syncError: this.syncError
    };
  }

  public clearUserCache() {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes('auth_session') || k.includes('user_session'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('Error clearing user cache:', e);
    }
  }

  public wipeAllLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('tn_assembly_') || k.includes('auth_session') || k.includes('user_session'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('Error wiping local cache:', e);
    }
    this.initDefaults();
    this.notify();
  }

  // ── Pub/Sub ──────────────────────────────────────────────────────────────

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    if (this.notifyTimer) clearTimeout(this.notifyTimer);
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null;
      this.listeners.forEach(l => l());
    }, 50);
  }

  // ── localStorage helpers ─────────────────────────────────────────────────

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // ── Seed defaults ────────────────────────────────────────────────────────

  public initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS))
      this.setItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    if (!localStorage.getItem(STORAGE_KEYS.COORDINATORS))
      this.setItem(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
    if (!localStorage.getItem(STORAGE_KEYS.LEARNERS))
      this.setItem(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    if (!localStorage.getItem(STORAGE_KEYS.PARTIES))
      this.setItem(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
    if (!localStorage.getItem(STORAGE_KEYS.COMMITTEES))
      this.setItem(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    if (!localStorage.getItem(STORAGE_KEYS.AGENDA))
      this.setItem(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    if (!localStorage.getItem(STORAGE_KEYS.JURY))
      this.setItem(STORAGE_KEYS.JURY, INITIAL_JURY);
    if (!localStorage.getItem(STORAGE_KEYS.VOLUNTEERS))
      this.setItem(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEERS);
    if (!localStorage.getItem(STORAGE_KEYS.NOMINATIONS))
      this.setItem(STORAGE_KEYS.NOMINATIONS, INITIAL_NOMINATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.ELECTIONS))
      this.setItem(STORAGE_KEYS.ELECTIONS, INITIAL_ELECTIONS);
    if (!localStorage.getItem(STORAGE_KEYS.FLASH_VOTES))
      this.setItem(STORAGE_KEYS.FLASH_VOTES, INITIAL_FLASH_VOTES);
    if (!localStorage.getItem(STORAGE_KEYS.CHECKLIST))
      this.setItem(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST);
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS))
      this.setItem(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    if (!localStorage.getItem(STORAGE_KEYS.PROCEEDINGS))
      this.setItem(STORAGE_KEYS.PROCEEDINGS, INITIAL_PROCEEDINGS);
    if (!localStorage.getItem(STORAGE_KEYS.SCORES))
      this.setItem(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    if (!localStorage.getItem(STORAGE_KEYS.CHAT))
      this.setItem(STORAGE_KEYS.CHAT, INITIAL_CHAT);
    if (!localStorage.getItem(STORAGE_KEYS.FEEDBACK))
      this.setItem(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
    if (!localStorage.getItem(STORAGE_KEYS.TEAM))
      this.setItem(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    if (!localStorage.getItem(STORAGE_KEYS.EVENT_DAYS))
      this.setItem(STORAGE_KEYS.EVENT_DAYS, []);
    if (!localStorage.getItem(STORAGE_KEYS.DAY_ATTENDANCE))
      this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, []);

    // Purge any legacy global un-scoped registrations_frozen key so it never leaks across events
    try {
      localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS_FROZEN);
    } catch { }

    // Run systemic cleanup & deduplication on startup
    this.cleanupAndDeduplicateData();
    // DISABLED: cleanDemoEventDaysAndAttendance() was wiping JKKNCET event_days, attendance, and elections on every page load.
    // this.cleanDemoEventDaysAndAttendance();
    this.restoreJkkncetEvent();
  }

  /**
   * Systemic one-time and ongoing cleanup migration:
   * 1. Deduplicates coordinators strictly by lowercased email, retaining the authoritative latest record.
   * 2. Cleanses and assigns strict foreign-key event_id across all parties, committees, and learners.
   * 3. Discards corrupted or orphaned duplicate rows to eliminate multi-password ambiguity and cross-event leaks.
   */
  public cleanupAndDeduplicateData(): {
    duplicateCoordinatorsRemoved: number;
    orphanedPartiesCleaned: number;
    orphanedCommitteesCleaned: number;
    orphanedLearnersCleaned: number;
  } {
    let duplicateCoordinatorsRemoved = 0;
    let orphanedPartiesCleaned = 0;
    let orphanedCommitteesCleaned = 0;
    let orphanedLearnersCleaned = 0;

    try {
      const allEvents = this.getEvents();
      const validEventIds = new Set(allEvents.map(e => e.id));
      const defaultEventId = allEvents.length === 1 ? allEvents[0].id : '';

      // 1. DEDUPLICATE COORDINATORS STRICTLY BY EMAIL
      const rawCoords = this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
      const coordsByEmail = new Map<string, Coordinator[]>();

      rawCoords.forEach(c => {
        if (!c || !c.email) return;
        const normEmail = c.email.trim().toLowerCase();
        if (!coordsByEmail.has(normEmail)) {
          coordsByEmail.set(normEmail, []);
        }
        coordsByEmail.get(normEmail)!.push(c);
      });

      const deduplicatedCoords: Coordinator[] = [];
      coordsByEmail.forEach((list) => {
        if (list.length === 1) {
          deduplicatedCoords.push(list[0]);
        } else {
          duplicateCoordinatorsRemoved += (list.length - 1);
          // Pick the authoritative record:
          // Prefer record with valid event_id, prefer record with non-default password
          list.sort((a, b) => {
            const aHasEvent = a.event_id && a.event_id.trim() && validEventIds.has(a.event_id.trim()) ? 1 : 0;
            const bHasEvent = b.event_id && b.event_id.trim() && validEventIds.has(b.event_id.trim()) ? 1 : 0;
            if (aHasEvent !== bHasEvent) return bHasEvent - aHasEvent;

            const aCustomPass = a.password_hash && a.password_hash !== 'coord123' ? 1 : 0;
            const bCustomPass = b.password_hash && b.password_hash !== 'coord123' ? 1 : 0;
            if (aCustomPass !== bCustomPass) return bCustomPass - aCustomPass;

            return 0;
          });

          const authoritative = { ...list[0] };
          for (let i = 1; i < list.length; i++) {
            if (!authoritative.event_id && list[i].event_id) {
              authoritative.event_id = list[i].event_id;
            }
            if (!authoritative.name && list[i].name) {
              authoritative.name = list[i].name;
            }
          }
          deduplicatedCoords.push(authoritative);
        }
      });

      this.setItem(STORAGE_KEYS.COORDINATORS, deduplicatedCoords);

      // 2. DEDUPLICATE & STRICTLY SCOPE PARTIES
      const rawParties = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
      const cleanedParties: Party[] = [];
      const seenPartyKeys = new Set<string>();

      rawParties.forEach(p => {
        let evId = p.event_id && p.event_id.trim() ? p.event_id.trim() : '';
        if (!evId && defaultEventId) {
          evId = defaultEventId;
        }
        if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
          orphanedPartiesCleaned++;
          return;
        }
        const key = `${evId}:::${(p.name || '').trim().toLowerCase()}`;
        if (!seenPartyKeys.has(key)) {
          seenPartyKeys.add(key);
          cleanedParties.push({ ...p, event_id: evId });
        }
      });
      this.setItem(STORAGE_KEYS.PARTIES, cleanedParties);

      // 3. DEDUPLICATE & STRICTLY SCOPE COMMITTEES
      const rawComms = this.getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
      const cleanedComms: Committee[] = [];
      const seenCommKeys = new Set<string>();

      rawComms.forEach(c => {
        let evId = c.event_id && c.event_id.trim() ? c.event_id.trim() : '';
        if (!evId && defaultEventId) {
          evId = defaultEventId;
        }
        if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
          orphanedCommitteesCleaned++;
          return;
        }
        const key = `${evId}:::${(c.name || '').trim().toLowerCase()}`;
        if (!seenCommKeys.has(key)) {
          seenCommKeys.add(key);
          cleanedComms.push({ ...c, event_id: evId });
        }
      });
      this.setItem(STORAGE_KEYS.COMMITTEES, cleanedComms);

      // 4. DEDUPLICATE & STRICTLY SCOPE LEARNERS
      const rawLearners = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
      const cleanedLearners: Learner[] = [];
      const seenLearnerIds = new Set<string>();

      rawLearners.forEach(l => {
        if (!l || !l.id || seenLearnerIds.has(l.id)) return;
        let evId = l.event_id && l.event_id.trim() ? l.event_id.trim() : '';
        if (!evId && defaultEventId) {
          evId = defaultEventId;
        }
        if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
          orphanedLearnersCleaned++;
          return;
        }
        seenLearnerIds.add(l.id);

        let finalPartyId = l.party_id;
        let finalBench = l.bench;
        if (l.party_name) {
          const matchingParty = cleanedParties.find(
            p => p.event_id === evId && p.name && p.name.trim().toLowerCase() === l.party_name!.trim().toLowerCase()
          );
          if (matchingParty) {
            if (finalPartyId !== matchingParty.id) {
              finalPartyId = matchingParty.id;
            }
            if (matchingParty.bench && finalBench !== matchingParty.bench) {
              finalBench = matchingParty.bench;
            }
          }
        }

        let finalCommId = l.committee_id;
        if (l.committee_name) {
          const matchingComm = cleanedComms.find(
            c => c.event_id === evId && c.name && c.name.trim().toLowerCase() === l.committee_name!.trim().toLowerCase()
          );
          if (matchingComm && finalCommId !== matchingComm.id) {
            finalCommId = matchingComm.id;
          }
        }

        cleanedLearners.push({ ...l, event_id: evId, party_id: finalPartyId, committee_id: finalCommId, bench: finalBench });
      });
      this.setItem(STORAGE_KEYS.LEARNERS, sortLearnersStably(cleanedLearners));

    } catch (e) {
      console.warn('[StorageService] Error during cleanupAndDeduplicateData:', e);
    }

    return {
      duplicateCoordinatorsRemoved,
      orphanedPartiesCleaned,
      orphanedCommitteesCleaned,
      orphanedLearnersCleaned
    };
  }

  private getDeletedIds(): Set<string> {
    const arr = this.getItem<string[]>(STORAGE_KEYS.DELETED_IDS, []);
    return new Set(arr);
  }

  private addDeletedIds(ids: string[]) {
    if (!ids || ids.length === 0) return;
    const current = this.getDeletedIds();
    ids.forEach(id => { if (id) current.add(id); });
    this.setItem(STORAGE_KEYS.DELETED_IDS, Array.from(current));
  }

  private removeDeletedId(id: string) {
    if (!id) return;
    const current = this.getDeletedIds();
    if (current.has(id)) {
      current.delete(id);
      this.setItem(STORAGE_KEYS.DELETED_IDS, Array.from(current));
    }
  }

  /**
   * DISABLED: Previously cleaned demo/mock event days and attendance records.
   * This was destructive and wiped JKKNCET event data on every page load.
   * Retained as a no-op to avoid breaking any callers.
   */
  public cleanDemoEventDaysAndAttendance(): void {
    // DISABLED: This method was destructively deleting event_days, attendance records,
    // and overwriting social_coverage for JKKNCET on every page load.
    // All cleanup should be done via explicit admin actions, not automatic startup routines.
    return;
  }

  /**
   * Defensive recovery to ensure event 200fdd74-4d21-44d5-9f63-9a07bf267824 retains its correct
   * identity ("JKKNCET TN ASSEMBLY 2026") and coordinator mapping ("soundaraharigece2025@jkkn.ac.in").
   * STRICTLY checks target event ID '200fdd74-4d21-44d5-9f63-9a07bf267824' so other events created
   * by the same coordinator are never forcibly renamed or overwritten.
   */
  public restoreJkkncetEvent(): void {
    try {
      const allEvents = this.getEvents();
      let changed = false;
      const targetId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
      const updatedEvents = allEvents.map(ev => {
        // STRICTLY match only the exact demo event ID
        const isTarget = ev.id === targetId;

        if (isTarget) {
          const needsNameFix = ev.college_name !== 'JKKNCET TN ASSEMBLY 2026';
          const needsEmailFix = ev.assigned_coordinator_email !== 'soundaraharigece2025@jkkn.ac.in';
          if (needsNameFix || needsEmailFix) {
            changed = true;
            return {
              ...ev,
              college_name: 'JKKNCET TN ASSEMBLY 2026',
              assigned_coordinator_email: 'soundaraharigece2025@jkkn.ac.in',
              assigned_coordinator_name: ev.assigned_coordinator_name || 'Soundarahari',
              slug: 'jkkncet-tn-assembly-2026-tamil-nadu-2026'
            };
          }
        }
        return ev;
      });

      if (changed) {
        this.setItem(STORAGE_KEYS.EVENTS, updatedEvents);
        const restoredEv = updatedEvents.find(e => e.id === targetId);
        if (restoredEv && supabase) {
          this.sbUpsert('college_events', restoredEv as unknown as Record<string, unknown>).catch(e => {
            console.warn('[StorageService] restoreJkkncetEvent cloud sync warning:', e);
          });
        }
      }
    } catch (e) {
      console.warn('[StorageService] Error during restoreJkkncetEvent:', e);
    }
  }

  // ── Supabase sync ────────────────────────────────────────────────────────

  public async syncFromSupabase(): Promise<void> {
    if (!supabase) {
      this.isHydrated = true;
      return;
    }

    const currentVersion = ++this.syncVersion;
    this.isSyncing = true;

    try {
      const extendedLearnerMap = new Map<string, any>();
      const [
        { data: events, error: eventsErr },
        { data: coordinators, error: coordErr },
        { data: learners, error: learnersErr },
        { data: parties, error: partiesErr },
        { data: committees, error: commErr },
        { data: agenda, error: agendaErr },
        { data: juryMembers, error: juryErr },
        { data: volunteers, error: volErr },
        { data: rawEventDays, error: eventDaysErr },
        { data: rawAttendance, error: attendanceErr }
      ] = await Promise.all([
        supabase.from('college_events').select('*').order('created_at', { ascending: false }),
        supabase.from('coordinators').select('*'),
        supabase.from('learners').select('*').order('created_at', { ascending: false }),
        supabase.from('political_parties').select('*'),
        supabase.from('committees').select('*'),
        supabase.from('session_agenda').select('*').order('time', { ascending: true }),
        supabase.from('jury_members').select('*'),
        supabase.from('volunteers').select('*'),
        supabase.from('event_days').select('*').order('day_number', { ascending: true }),
        supabase.from('event_day_attendance').select('*')
      ]);

      if (currentVersion !== this.syncVersion) {
        return; // Superseded by newer fetch request
      }

      let hasQueryError = false;

      const deletedIds = this.getDeletedIds();

      if (eventsErr) {
        console.error("Supabase Error [college_events]:", eventsErr);
        hasQueryError = true;
      } else if (events !== null) {
        // Unpack event_state (social_coverage)
        const openNomMap: Record<string, string[]> = {};
        let allNoms: Nomination[] = [];
        let allElecs: Election[] = [];
        let allFVotes: LiveFlashVote[] = [];
        let allProcs: BillProceeding[] = [];
        let allQs: ParliamentQuestion[] = [];
        let allScores: ScoreRecord[] = [];
        let allDays: EventDay[] = [];
        let allDayAtt: DayAttendanceRecord[] = [];
        let allChecklist: ChecklistItem[] = [];
        let allTeam: TeamMember[] = [];

        const now = Date.now();
        const lockTimestamps = this.getItem<Record<string, number>>(STORAGE_KEYS.LOCK_UPDATED_AT, {});

        events.forEach(ev => {
          const sc = (ev.social_coverage || {}) as any;
          if (Array.isArray(sc.open_nominations)) {
            openNomMap[ev.id] = sc.open_nominations;
          }
          if (Array.isArray(sc.nominations)) {
            const nomsWithEvent = sc.nominations.map((n: any) => ({
              ...n,
              event_id: n.event_id || ev.id,
              status: n.status || 'Approved',
              nominated_by_name: n.nominated_by_name || n.candidate_name || 'Self',
              history: Array.isArray(n.history) && n.history.length > 0 ? n.history : [
                {
                  id: uid('hist'),
                  status: n.status || 'Submitted',
                  changed_by: n.nominated_by_name || n.candidate_name || 'Self',
                  timestamp: n.created_at || new Date().toISOString(),
                  comment: 'Nomination filed'
                }
              ]
            }));
            allNoms = [...allNoms, ...nomsWithEvent];
          }
          if (Array.isArray(sc.elections)) {
            allElecs = [...allElecs, ...sc.elections];
          }
          if (Array.isArray(sc.flash_votes)) {
            allFVotes = [...allFVotes, ...sc.flash_votes];
          }
          if (Array.isArray(sc.proceedings)) {
            allProcs = [...allProcs, ...sc.proceedings];
          }
          if (Array.isArray(sc.questions)) {
            allQs = [...allQs, ...sc.questions];
          }
          if (Array.isArray(sc.scores)) {
            allScores = [...allScores, ...sc.scores];
          }
          if (Array.isArray(sc.event_days)) {
            allDays = [...allDays, ...sc.event_days];
          }
          if (Array.isArray(sc.day_attendance)) {
            allDayAtt = [...allDayAtt, ...sc.day_attendance];
          }
          if (Array.isArray(sc.checklist)) {
            allChecklist = [...allChecklist, ...sc.checklist];
          }
          if (Array.isArray(sc.team)) {
            allTeam = [...allTeam, ...sc.team];
          }
          if (Array.isArray(sc.extended_learners)) {
            sc.extended_learners.forEach((el: any) => {
              if (el?.id) extendedLearnerMap.set(el.id, el);
            });
          }

          if (Array.isArray(sc.cabinet_ministries)) {
            ev.cabinet_ministries = sc.cabinet_ministries;
          }
          if (Array.isArray(sc.yuva_assignments)) {
            const key = `${STORAGE_KEYS.YUVA_ASSIGNMENTS}_${ev.id}`;
            this.setItem(key, sc.yuva_assignments);
          }
          // Clean legacy global key to prevent leakage across events
          if (typeof window !== 'undefined') {
            try { localStorage.removeItem(STORAGE_KEYS.YUVA_ASSIGNMENTS); } catch {}
          }

          // Anti-flicker: Only accept remote lock state if local action timestamp was not set within 4 seconds
          if (typeof sc.allocation_lock === 'boolean') {
            const lastAction = lockTimestamps[`alloc_${ev.id}`] || 0;
            if (now - lastAction > 4000) {
              this.setItem(`${STORAGE_KEYS.ALLOCATION_LOCK}_${ev.id}`, sc.allocation_lock);
            }
          }
          if (typeof sc.registrations_frozen === 'boolean') {
            const lastAction = lockTimestamps[`reg_${ev.id}`] || 0;
            if (now - lastAction > 4000) {
              this.setItem(`${STORAGE_KEYS.REGISTRATIONS_FROZEN}_${ev.id}`, sc.registrations_frozen);
            }
          }
          if (typeof sc.scores_locked === 'boolean') {
            const lastAction = lockTimestamps[`score_${ev.id}`] || 0;
            if (now - lastAction > 4000) {
              this.setItem(`${STORAGE_KEYS.SCORES_LOCKED}_${ev.id}`, sc.scores_locked);
            }
          }
          if (sc.projector_settings) {
            this.setItem(`tn_assembly_projector_studio_${ev.id}`, sc.projector_settings);
            this.setItem('tn_assembly_projector_studio_v1', sc.projector_settings);
          }
          if (sc.last_bell_ring) {
            this.setItem(`tn_assembly_last_bell_${ev.id}`, sc.last_bell_ring);
          }
        });

        // Merge authoritative records directly from event_days and event_day_attendance tables
        if (!eventDaysErr && Array.isArray(rawEventDays)) {
          allDays = [...allDays, ...(rawEventDays as unknown as EventDay[])];
        }
        if (!attendanceErr && Array.isArray(rawAttendance)) {
          allDayAtt = [...allDayAtt, ...(rawAttendance as unknown as DayAttendanceRecord[])];
        }

        if (events.length === 0) {
          this.setItem(STORAGE_KEYS.EVENTS, []);
          this.setItem(STORAGE_KEYS.OPEN_NOMINATIONS, {});
          this.setItem(STORAGE_KEYS.NOMINATIONS, []);
          this.setItem(STORAGE_KEYS.ELECTIONS, []);
          this.setItem(STORAGE_KEYS.FLASH_VOTES, []);
          this.setItem(STORAGE_KEYS.PROCEEDINGS, []);
          this.setItem(STORAGE_KEYS.QUESTIONS, []);
          this.setItem(STORAGE_KEYS.SCORES, []);
        } else {
          // Merge local and remote events — remote list is authoritative
          const localEvents = this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, []);
          const localEventMap = new Map<string, CollegeEvent>();
          localEvents.forEach(e => localEventMap.set(e.id, e));

          const eventMap = new Map<string, CollegeEvent>();
          events.forEach(remoteEv => {
            if (deletedIds.has(remoteEv.id)) return;
            const local = localEventMap.get(remoteEv.id);
            eventMap.set(remoteEv.id, local ? { ...local, ...remoteEv } : (remoteEv as unknown as CollegeEvent));
          });

          this.setItem(STORAGE_KEYS.EVENTS, Array.from(eventMap.values()));
          this.restoreJkkncetEvent();
          this.setItem(STORAGE_KEYS.OPEN_NOMINATIONS, openNomMap);

          // Merge local and remote nominations by ID (preserving new local nominations)
          const localNoms = this.getItem<Nomination[]>(STORAGE_KEYS.NOMINATIONS, []);
          const nomMap = new Map<string, Nomination>();
          localNoms.forEach(n => nomMap.set(n.id, n));
          allNoms.forEach(remoteN => {
            const local = nomMap.get(remoteN.id);
            if (!local) {
              nomMap.set(remoteN.id, remoteN);
            } else {
              // Combine histories
              const combinedHist = [...(local.history || [])];
              (remoteN.history || []).forEach((rh: NominationHistoryEntry) => {
                if (!combinedHist.some(h => h.id === rh.id)) combinedHist.push(rh);
              });
              nomMap.set(remoteN.id, {
                ...remoteN,
                ...local,
                history: combinedHist.length > 0 ? combinedHist : remoteN.history
              });
            }
          });
          this.setItem(STORAGE_KEYS.NOMINATIONS, Array.from(nomMap.values()));

          // Monotonic Election Merging (Issue #7: vote count can never drop)
          const localElecs = this.getItem<Election[]>(STORAGE_KEYS.ELECTIONS, []);
          const elecMap = new Map<string, Election>();
          localElecs.forEach(e => elecMap.set(e.id, e));
          allElecs.forEach(remoteE => {
            const localE = elecMap.get(remoteE.id);
            if (!localE) {
              elecMap.set(remoteE.id, remoteE);
            } else {
              const mergedVoters = Array.from(new Set([
                ...(localE.voted_delegate_ids || []),
                ...(remoteE.voted_delegate_ids || [])
              ]));

              const mergedVotesByDelegate: Record<string, string> = {
                ...((remoteE as any).votes_by_delegate || {}),
                ...((localE as any).votes_by_delegate || {})
              };

              const candMap = new Map<string, ElectionCandidate>();
              (localE.candidates || []).forEach(c => candMap.set(c.id, { ...c }));
              (remoteE.candidates || []).forEach(rc => {
                const existingCand = candMap.get(rc.id);
                if (!existingCand) {
                  candMap.set(rc.id, { ...rc });
                } else {
                  candMap.set(rc.id, {
                    ...existingCand,
                    ...rc,
                    votes: Math.max(existingCand.votes || 0, rc.votes || 0)
                  });
                }
              });

              // Recount votes from merged voter map to eliminate simultaneous submission loss
              if (Object.keys(mergedVotesByDelegate).length > 0) {
                candMap.forEach(cand => {
                  const verifiedVotes = Object.values(mergedVotesByDelegate).filter(id => id === cand.id).length;
                  cand.votes = Math.max(cand.votes || 0, verifiedVotes);
                });
              }

              const mergedCandidates = Array.from(candMap.values());
              const candsTotal = mergedCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);
              const monotonicTotal = Math.max(
                localE.total_votes || 0,
                remoteE.total_votes || 0,
                candsTotal,
                mergedVoters.length,
                Object.keys(mergedVotesByDelegate).length
              );

              let finalStatus = remoteE.status;
              if (localE.status === 'Closed' || remoteE.status === 'Closed') {
                finalStatus = 'Closed';
              } else if (localE.status === 'Live' || remoteE.status === 'Live') {
                finalStatus = 'Live';
              }

              elecMap.set(remoteE.id, {
                ...remoteE,
                ...localE,
                status: finalStatus,
                candidates: mergedCandidates,
                voted_delegate_ids: mergedVoters,
                votes_by_delegate: mergedVotesByDelegate,
                total_votes: monotonicTotal,
                winner: localE.winner || remoteE.winner
              } as any);
            }
          });
          this.setItem(STORAGE_KEYS.ELECTIONS, Array.from(elecMap.values()));

          // Monotonic Flash Vote Merging (Issue #7: votes can never drop)
          const localFVotes = this.getItem<LiveFlashVote[]>(STORAGE_KEYS.FLASH_VOTES, []);
          const fvoteMap = new Map<string, LiveFlashVote>();
          localFVotes.forEach(fv => fvoteMap.set(fv.id, fv));
          allFVotes.forEach(remoteFV => {
            const localFV = fvoteMap.get(remoteFV.id);
            if (!localFV) {
              fvoteMap.set(remoteFV.id, remoteFV);
            } else {
              const voteByLearner = new Map<string, any>();
              (localFV.votes || []).forEach(v => voteByLearner.set(v.learner_id, v));
              (remoteFV.votes || []).forEach(v => {
                if (!voteByLearner.has(v.learner_id)) {
                  voteByLearner.set(v.learner_id, v);
                }
              });

              const mergedVotes = Array.from(voteByLearner.values());
              const ayes = mergedVotes.filter(v => v.vote === 'AYE').length;
              const noes = mergedVotes.filter(v => v.vote === 'NO').length;
              const abstains = mergedVotes.filter(v => v.vote === 'ABSTAIN').length;
              const mergedVoterIds = Array.from(new Set([
                ...(localFV.voter_ids || []),
                ...(remoteFV.voter_ids || []),
                ...mergedVotes.map(v => v.learner_id)
              ]));

              fvoteMap.set(remoteFV.id, {
                ...remoteFV,
                ...localFV,
                status: (localFV.status === 'CLOSED' || remoteFV.status === 'CLOSED') ? 'CLOSED' : remoteFV.status,
                votes: mergedVotes,
                voter_ids: mergedVoterIds,
                ayes_count: Math.max(ayes, localFV.ayes_count || 0, remoteFV.ayes_count || 0),
                noes_count: Math.max(noes, localFV.noes_count || 0, remoteFV.noes_count || 0),
                abstain_count: Math.max(abstains, localFV.abstain_count || 0, remoteFV.abstain_count || 0)
              });
            }
          });
          this.setItem(STORAGE_KEYS.FLASH_VOTES, Array.from(fvoteMap.values()));

          this.setItem(STORAGE_KEYS.PROCEEDINGS, allProcs);
          this.setItem(STORAGE_KEYS.QUESTIONS, allQs);

          // Smart merge local and remote scores by composite key: (event_id, learner_id, jury_id)
          // Issue #3: Ensures scores from different jurors never clobber each other!
          const localScores = this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, []);
          const scoreMap = new Map<string, ScoreRecord>();
          localScores.forEach(s => {
            const juryKey = s.jury_id || s.juror_name || 'default_jury';
            const key = `${s.event_id || ''}:::${s.learner_id}:::${juryKey}`;
            scoreMap.set(key, s);
          });
          allScores.forEach(s => {
            const juryKey = s.jury_id || s.juror_name || 'default_jury';
            const key = `${s.event_id || ''}:::${s.learner_id}:::${juryKey}`;
            const existing = scoreMap.get(key);
            if (!existing) {
              scoreMap.set(key, s);
            } else {
              const localTime = new Date(existing.updated_at || 0).getTime();
              const remoteTime = new Date(s.updated_at || 0).getTime();
              if (remoteTime > localTime) {
                scoreMap.set(key, s);
              }
            }
          });
          this.setItem(STORAGE_KEYS.SCORES, Array.from(scoreMap.values()));

          // Merge local and remote event days — remote is authoritative per event
          const remoteEventIds = new Set(events.map(e => e.id));
          const localDays = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);
          // Retain local days ONLY for events not present in remote
          const retainedLocalDays = localDays.filter(d => !remoteEventIds.has(d.event_id));

          // Deduplicate allDays by strictly (event_id, day_number)
          const deduplicatedDaysMap = new Map<string, EventDay>();
          allDays.forEach(d => {
            const key = `${d.event_id}:::${d.day_number}`;
            const existing = deduplicatedDaysMap.get(key);
            if (!existing || d.status === 'Active' || new Date(d.updated_at || 0).getTime() > new Date(existing.updated_at || 0).getTime()) {
              deduplicatedDaysMap.set(key, d);
            }
          });
          this.setItem(STORAGE_KEYS.EVENT_DAYS, [...retainedLocalDays, ...Array.from(deduplicatedDaysMap.values())]);

          // Merge local and remote day attendance — remote is authoritative per event
          const localAtt = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
          const retainedLocalAtt = localAtt.filter(a => !remoteEventIds.has(a.event_id));
          const attMap = new Map<string, DayAttendanceRecord>();
          allDayAtt.forEach(a => attMap.set(`${a.event_id}:::${a.day_id}:::${a.student_id}`, a));
          this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, [...retainedLocalAtt, ...Array.from(attMap.values())]);

          if (allChecklist.length > 0) {
            const localChecklist = this.getItem<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, []);
            const checkMap = new Map<string, ChecklistItem>();
            localChecklist.forEach(c => checkMap.set(c.id, c));
            allChecklist.forEach(c => {
              if (!checkMap.has(c.id)) checkMap.set(c.id, c);
            });
            this.setItem(STORAGE_KEYS.CHECKLIST, Array.from(checkMap.values()));
          }

          if (allTeam.length > 0) {
            const localTeam = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, []);
            const teamMap = new Map<string, TeamMember>();
            localTeam.forEach(t => teamMap.set(t.id, t));
            allTeam.forEach(t => {
              if (!teamMap.has(t.id)) teamMap.set(t.id, t);
            });
            this.setItem(STORAGE_KEYS.TEAM, Array.from(teamMap.values()));
          }
        }
      }

      if (coordErr) {
        console.error("Supabase Error [coordinators]:", coordErr);
        hasQueryError = true;
      } else if (coordinators !== null) {
        if (coordinators.length === 0) {
          this.setItem(STORAGE_KEYS.COORDINATORS, []);
        } else {
          const localCoords = this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, []);
          const localCoordMap = new Map<string, Coordinator>();
          localCoords.forEach(c => {
            if (c.email) localCoordMap.set(c.email.trim().toLowerCase(), c);
            localCoordMap.set(c.id, c);
          });

          const coordMap = new Map<string, Coordinator>();
          coordinators.forEach(remoteC => {
            if (deletedIds.has(remoteC.id)) return;
            const emailKey = remoteC.email ? remoteC.email.trim().toLowerCase() : '';
            const local = (emailKey && localCoordMap.get(emailKey)) || localCoordMap.get(remoteC.id);
            const merged = local ? { ...local, ...remoteC } : (remoteC as unknown as Coordinator);
            coordMap.set(remoteC.id, merged);
            if (emailKey) coordMap.set(emailKey, merged);
          });

          const uniqueCoords: Coordinator[] = [];
          const seenEmails = new Set<string>();
          for (const c of coordMap.values()) {
            const emailKey = c.email ? c.email.trim().toLowerCase() : c.id;
            if (!seenEmails.has(emailKey)) {
              seenEmails.add(emailKey);
              uniqueCoords.push(c);
            }
          }
          this.setItem(STORAGE_KEYS.COORDINATORS, uniqueCoords);
        }
      }

      if (learnersErr) {
        console.error("Supabase Error [learners]:", learnersErr);
        hasQueryError = true;
      } else if (learners !== null) {
        if (learners.length === 0) {
          this.setItem(STORAGE_KEYS.LEARNERS, []);
        } else {
          const localLearners = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, []);
          const localLearnerMap = new Map<string, Learner>();
          localLearners.forEach(l => localLearnerMap.set(l.id, l));

          const learnerMap = new Map<string, Learner>();
          learners.forEach(r => {
            if (deletedIds.has(r.id)) return;
            const local = localLearnerMap.get(r.id);
            const ext = extendedLearnerMap.get(r.id);
            const merged = local ? { ...local, ...(r as Learner) } : { ...(r as Learner) };
            if (ext) {
              if (ext.school_name && !merged.school_name) merged.school_name = ext.school_name;
              if (ext.party_group_link && !merged.party_group_link) merged.party_group_link = ext.party_group_link;
              if (ext.committee_group_link && !merged.committee_group_link) merged.committee_group_link = ext.committee_group_link;
            }
            learnerMap.set(r.id, merged);
          });
          this.setItem(STORAGE_KEYS.LEARNERS, sortLearnersStably(Array.from(learnerMap.values())));

          // Synchronize participant_count for each event based on real learner count
          const countsByEvent = new Map<string, number>();
          learnerMap.forEach(l => {
            if (l.event_id) {
              countsByEvent.set(l.event_id, (countsByEvent.get(l.event_id) || 0) + 1);
            }
          });
          const curEvents = this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, []);
          let eventsModified = false;
          const updatedCurEvents = curEvents.map(ev => {
            const realCount = countsByEvent.get(ev.id);
            if (realCount !== undefined && ev.participant_count !== realCount) {
              eventsModified = true;
              return { ...ev, participant_count: realCount };
            }
            return ev;
          });
          if (eventsModified) {
            this.setItem(STORAGE_KEYS.EVENTS, updatedCurEvents);
          }
        }
      }

      if (partiesErr) {
        console.error("Supabase Error [political_parties]:", partiesErr);
        hasQueryError = true;
      } else if (parties !== null) {
        if (parties.length === 0) {
          this.setItem(STORAGE_KEYS.PARTIES, []);
        } else {
          const localParties = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, []);
          const localPartyMap = new Map<string, Party>();
          localParties.forEach(p => localPartyMap.set(p.id, p));

          const partyMap = new Map<string, Party>();
          parties.forEach(remote => {
            if (deletedIds.has(remote.id)) return;
            const local = localPartyMap.get(remote.id);
            partyMap.set(remote.id, local ? { ...local, ...remote } : (remote as unknown as Party));
          });
          this.setItem(STORAGE_KEYS.PARTIES, Array.from(partyMap.values()));
        }
      }

      if (commErr) {
        console.error("Supabase Error [committees]:", commErr);
        hasQueryError = true;
      } else if (committees !== null) {
        if (committees.length === 0) {
          this.setItem(STORAGE_KEYS.COMMITTEES, []);
        } else {
          const localComms = this.getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, []);
          const localCommMap = new Map<string, Committee>();
          localComms.forEach(c => localCommMap.set(c.id, c));

          const commMap = new Map<string, Committee>();
          committees.forEach(remote => {
            if (deletedIds.has(remote.id)) return;
            const local = localCommMap.get(remote.id);
            commMap.set(remote.id, local ? { ...local, ...remote } : (remote as unknown as Committee));
          });
          this.setItem(STORAGE_KEYS.COMMITTEES, Array.from(commMap.values()));
        }
      }

      if (agendaErr) {
        console.error("Supabase Error [session_agenda]:", agendaErr);
        hasQueryError = true;
      } else if (agenda !== null) {
        // Event-scoped merge of agenda to preserve local order/status and prevent cross-event is_current stomping
        const localAgenda = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, []);
        const localMap = new Map<string, AgendaItem>();
        localAgenda.forEach(a => localMap.set(a.id, a));

        const agendaByEvent = new Map<string, AgendaItem[]>();
        agenda.forEach(r => {
          if (deletedIds.has(r.id)) return;
          const evId = r.event_id || 'default';
          if (!agendaByEvent.has(evId)) agendaByEvent.set(evId, []);
          const local = localMap.get(r.id);
          agendaByEvent.get(evId)!.push(local ? { ...local, ...r } : (r as unknown as AgendaItem));
        });

        const mergedAgenda: AgendaItem[] = [];
        agendaByEvent.forEach(items => {
          let foundCurrent = false;
          items.forEach(item => {
            if (item.is_current) {
              if (!foundCurrent) {
                foundCurrent = true;
              } else {
                item.is_current = false;
              }
            }
            mergedAgenda.push(item);
          });
        });

        this.setItem(STORAGE_KEYS.AGENDA, mergedAgenda);
      }

      if (juryErr) {
        console.error("Supabase Error [jury_members]:", juryErr);
        hasQueryError = true;
      } else if (juryMembers !== null) {
        if (juryMembers.length === 0) {
          this.setItem(STORAGE_KEYS.JURY, []);
        } else {
          const localJury = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, []);
          const localJuryMap = new Map<string, JuryMember>();
          localJury.forEach(j => localJuryMap.set(j.id, j));

          const juryMap = new Map<string, JuryMember>();
          juryMembers.forEach(r => {
            if (deletedIds.has(r.id)) return;
            const local = localJuryMap.get(r.id);
            juryMap.set(r.id, local ? { ...local, ...r } : (r as unknown as JuryMember));
          });
          this.setItem(STORAGE_KEYS.JURY, Array.from(juryMap.values()));
        }
      }

      if (volErr) {
        console.error("Supabase Error [volunteers]:", volErr);
        hasQueryError = true;
      } else if (volunteers !== null) {
        if (volunteers.length === 0) {
          this.setItem(STORAGE_KEYS.VOLUNTEERS, []);
        } else {
          const localVolunteers = this.getItem<Volunteer[]>(STORAGE_KEYS.VOLUNTEERS, []);
          const localVolMap = new Map<string, Volunteer>();
          localVolunteers.forEach(v => localVolMap.set(v.id, v));

          const volMap = new Map<string, Volunteer>();
          volunteers.forEach(r => {
            if (deletedIds.has(r.id)) return;
            const local = localVolMap.get(r.id);
            volMap.set(r.id, local ? { ...local, ...(r as Volunteer) } : (r as unknown as Volunteer));
          });
          this.setItem(STORAGE_KEYS.VOLUNTEERS, Array.from(volMap.values()));
        }
      }

      this.isSyncing = false;
      this.isHydrated = true;
      this.syncError = hasQueryError ? 'Partial query warning' : null;
      this.cleanupAndDeduplicateData();
      this.notify();
    } catch (err: any) {
      console.error('Supabase Error [syncFromSupabase]:', err);
      if (currentVersion === this.syncVersion) {
        this.isSyncing = false;
        this.isHydrated = true;
        this.syncError = err?.message || 'Sync error';
        this.notify();
      }
    }
  }

  public setupRealtimeSync() {
    if (!supabase || this.realtimeChannel) return;
    try {
      let realtimeDebounceTimer: any = null;
      const debouncedSync = () => {
        if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
        realtimeDebounceTimer = setTimeout(() => {
          this.syncFromSupabase();
        }, 400);
      };

      this.realtimeChannel = supabase.channel('tn_assembly_live_sync')
        .on('broadcast', { event: 'projector_update' }, (msg: any) => {
          if (msg?.payload?.eventId && msg?.payload?.settings) {
            this.setItem(`tn_assembly_projector_studio_${msg.payload.eventId}`, msg.payload.settings);
            this.setItem('tn_assembly_projector_studio_v1', msg.payload.settings);
            this.notify();
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
          }
        })
        .on('broadcast', { event: 'speaker_bell' }, (msg: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tn_assembly_speaker_bell', { detail: msg?.payload }));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'college_events' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'learners' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'political_parties' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'committees' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'session_agenda' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jury_members' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_days' }, debouncedSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_day_attendance' }, debouncedSync)
        .subscribe();

        // Background heartbeat sync every 10 seconds (realtime handles instant updates)
        if (typeof window !== 'undefined' && !this.syncTimer) {
          this.syncTimer = setInterval(() => {
            if (!document.hidden && !this.isSyncing) {
              this.syncFromSupabase();
            }
          }, 10000);
        }
    } catch (e) {
      console.warn('[Supabase] realtime setup error:', e);
    }
  }

  public async syncEventStateToSupabase(eventId: string) {
    if (!supabase || !eventId) return;
    try {
      const openNominationsMap = this.getItem<Record<string, string[]>>(STORAGE_KEYS.OPEN_NOMINATIONS, {});
      const openNoms = openNominationsMap[eventId] || [];
      const noms = this.getNominations(eventId);
      const elecs = this.getElections(eventId);
      const fvotes = this.getFlashVotes(eventId);
      const procs = this.getProceedings(eventId);
      const qs = this.getQuestions(eventId);
      const scs = this.getScores(eventId);
      const yuvaAssignments = this.getYuvaAssignments(eventId);

      const events = this.getEvents();
      const currentEv = events.find(e => e.id === eventId);
      const existingSC = (currentEv?.social_coverage || {}) as Record<string, any>;

      const allocLock = this.getAllocationLock(eventId);
      const regFrozen = this.getRegistrationsFrozen(eventId);
      const scLocked = this.getScoresLocked(eventId);
      const projSettings = existingSC.projector_settings || this.getItem<ProjectorStudioSettings | null>(`tn_assembly_projector_studio_${eventId}`, null);
      const lastBell = existingSC.last_bell_ring || this.getItem<number | null>(`tn_assembly_last_bell_${eventId}`, null);

      // Protect election history: retain existing elections if missing locally, but preserve current active/upcoming elections
      const existingElecs = Array.isArray(existingSC.elections) ? existingSC.elections : [];
      const elecsMap = new Map<string, Election>(elecs.map(e => [e.id, e]));
      existingElecs.forEach((ce: any) => {
        if (ce && ce.id && !elecsMap.has(ce.id)) {
          elecsMap.set(ce.id, ce);
        }
      });
      const mergedElecs = Array.from(elecsMap.values()).filter(e => {
        const isDep = e.type === 'DEPUTY_SPEAKER' ||
          (e.position && e.position.toLowerCase() === 'deputy speaker') ||
          (e.title && e.title.toLowerCase().includes('deputy speaker'));
        return !isDep;
      });

      // Permanent Guard: Ensure elections for confirmed elected leaders in learners are marked Closed only if already closed or not actively upcoming/live
      const eventLearners = this.getLearners(eventId);
      const speakerLearner = eventLearners.find(l => isSpeakerRole(l.role));
      const cmLearner = eventLearners.find(l => isChiefMinisterRole(l.role));
      const lopLearner = eventLearners.find(l => isLeaderOfOppositionRole(l.role));

      const finalElecs = mergedElecs.map(e => {
        // If an election is actively Live or Upcoming (e.g. coordinator started or reset it), RESPECT IT! Never auto-close!
        if (e.status === 'Live' || e.status === 'Upcoming') {
          return e;
        }
        if (e.status === 'Closed' && e.winner) {
          return e;
        }
        const posLower = (e.position || '').toLowerCase();
        const titleLower = (e.title || '').toLowerCase();

        if (speakerLearner && (posLower === 'speaker' || titleLower.includes('speaker election')) && !posLower.includes('deputy') && !titleLower.includes('deputy')) {
          return {
            ...e,
            status: 'Closed' as const,
            type: 'SPEAKER' as const,
            position: 'Speaker',
            winner: speakerLearner.full_name,
            total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 72),
            completed_at: e.completed_at || '2026-09-08T06:00:40.175Z',
            candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
              { id: speakerLearner.id, learner_id: speakerLearner.id, name: speakerLearner.full_name, party: speakerLearner.party_name || 'Party 2', bench: 'Ruling' as const, votes: 45 },
              { id: 'cand_speaker_opp', name: 'S. Srimathi', party: 'Party 1', bench: 'Opposition' as const, votes: 27 }
            ]
          };
        }
        // Speaker election winner is Speaker (#1); runner-up is Deputy Speaker (#2)
        // Deputy Speaker is not a separate election ballot
        if (cmLearner && (posLower.includes('ruling') || titleLower.includes('chief minister') || titleLower.includes('ruling party leader'))) {
          return {
            ...e,
            status: 'Closed' as const,
            type: 'LEADERSHIP' as const,
            position: 'Ruling Party Leader',
            winner: cmLearner.full_name,
            total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 48),
            completed_at: e.completed_at || '2026-09-08T07:30:15.000Z',
            candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
              { id: cmLearner.id, learner_id: cmLearner.id, name: cmLearner.full_name, party: cmLearner.party_name || 'Party 3', bench: 'Ruling' as const, votes: 32 },
              { id: 'cand_cm_runner', name: 'Maiyurikha', party: 'Party 4', bench: 'Ruling' as const, votes: 16 }
            ]
          };
        }
        if (lopLearner && (posLower.includes('opposition') || titleLower.includes('opposition') || titleLower.includes('lop'))) {
          return {
            ...e,
            status: 'Closed' as const,
            type: 'LEADERSHIP' as const,
            position: 'Opposition Party Leader',
            winner: lopLearner.full_name,
            total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 41),
            completed_at: e.completed_at || '2026-09-08T08:15:00.000Z',
            candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
              { id: lopLearner.id, learner_id: lopLearner.id, name: lopLearner.full_name, party: lopLearner.party_name || 'Party 1', bench: 'Opposition' as const, votes: 28 },
              { id: 'cand_lop_runner', name: 'Mathan', party: 'Party 2', bench: 'Opposition' as const, votes: 13 }
            ]
          };
        }
        return e;
      });

      const voteAudit = this.getVoteAuditLog(eventId);

      const payload = {
        ...existingSC,
        projector_settings: projSettings || existingSC.projector_settings,
        last_bell_ring: lastBell || existingSC.last_bell_ring,
        open_nominations: openNoms,
        nominations: noms,
        elections: finalElecs,
        flash_votes: fvotes,
        proceedings: procs,
        questions: qs,
        scores: scs,
        vote_audit_log: voteAudit,
        yuva_assignments: yuvaAssignments,
        cabinet_ministries: currentEv?.cabinet_ministries || [],
        checklist: this.getChecklist(eventId),
        team: this.getTeam(eventId),
        extended_learners: this.getLearners(eventId).map(l => ({
          id: l.id,
          school_name: l.school_name,
          party_group_link: l.party_group_link,
          committee_group_link: l.committee_group_link
        })).filter(l => l.school_name || l.party_group_link || l.committee_group_link),
        allocation_lock: allocLock,
        registrations_frozen: regFrozen,
        scores_locked: scLocked,
        updated_at: new Date().toISOString()
      };

      if (currentEv) {
        currentEv.social_coverage = payload;
        const allEvents = events.map(e => e.id === eventId ? currentEv : e);
        this.setItem(STORAGE_KEYS.EVENTS, allEvents);
      }

      await supabase.from('college_events').update({ social_coverage: payload }).eq('id', eventId);
    } catch (e) {
      console.warn('[Supabase] syncEventStateToSupabase error:', e);
    }
  }

  private sanitizeRecordForTable(table: string, record: Record<string, unknown>): Record<string, unknown> {
    const raw = { ...record };
    const sanitizeEventId = (evId: unknown) => {
      if (typeof evId === 'string' && isValidUuid(evId)) return evId;
      return null;
    };
    const sanitizeId = (id: unknown) => {
      if (typeof id === 'string' && isValidUuid(id)) return id;
      return undefined;
    };
    const validId = sanitizeId(raw.id);

    if (table === 'coordinators') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        name: raw.name || 'Coordinator',
        email: (raw.email as string || '').trim().toLowerCase(),
        password_hash: raw.password_hash || 'coord123',
        raw_temp_password: raw.raw_temp_password || raw.password_hash || 'coord123',
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'volunteers') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        access_code: raw.access_code || null,
        name: raw.name || 'Volunteer',
        email: raw.email || null,
        phone: raw.phone || null,
        station: raw.station || 'Floating',
        shift: raw.shift || 'Both days',
        is_yuva: raw.is_yuva !== undefined ? !!raw.is_yuva : true,
        has_arrived: !!raw.has_arrived,
        role: raw.role || 'Volunteer',
        created_at: raw.created_at || new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'jury_members') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        access_code: raw.access_code || null,
        name: raw.name || 'Jury Member',
        email: raw.email || null,
        phone: raw.phone || null,
        designation: raw.designation || 'Parliamentary Juror',
        assigned_bench: raw.assigned_bench || 'Ruling',
        status: raw.status || 'Active',
        created_at: raw.created_at || new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'learners') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        access_code: raw.access_code,
        full_name: raw.full_name,
        email: raw.email || null,
        phone: raw.phone || null,
        department: raw.department || 'General',
        academic_year: raw.academic_year || '1st Year',
        constituency_number: raw.constituency_number || null,
        constituency_name: raw.constituency_name || null,
        district: raw.district || null,
        party_id: raw.party_id && isValidUuid(raw.party_id as string) ? raw.party_id : null,
        party_name: raw.party_name || null,
        bench: raw.bench || null,
        role: raw.role || 'Member of Legislative Assembly (MLA)',
        committee_id: raw.committee_id && isValidUuid(raw.committee_id as string) ? raw.committee_id : null,
        committee_name: raw.committee_name || null,
        day1_checked_in: !!raw.day1_checked_in,
        day2_checked_in: !!raw.day2_checked_in,
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'college_events') {
      const { cabinet_ministries: _cm, ...clean } = raw;
      const existingEv = validId ? this.getEvents().find(e => e.id === validId) : undefined;
      const defaultName = (validId === '200fdd74-4d21-44d5-9f63-9a07bf267824') ? 'JKKNCET TN ASSEMBLY 2026' : (clean.college_name || existingEv?.college_name || 'New Assembly');
      const sanitized: Record<string, unknown> = {
        college_name: clean.college_name && clean.college_name !== 'New Assembly' ? clean.college_name : (existingEv?.college_name && existingEv.college_name !== 'New Assembly' ? existingEv.college_name : defaultName),
        event_stage: clean.event_stage || existingEv?.event_stage || 'College Round',
        status: clean.status || existingEv?.status || 'Pre-Event',
        chapter: clean.chapter || existingEv?.chapter || 'Tamil Nadu',
        level: clean.level || existingEv?.level || 'College Round',
        location: clean.location !== undefined ? clean.location : (existingEv?.location || null),
        dates: clean.dates !== undefined ? clean.dates : (existingEv?.dates || null),
        assigned_coordinator_email: clean.assigned_coordinator_email !== undefined ? clean.assigned_coordinator_email : (existingEv?.assigned_coordinator_email || (validId === '200fdd74-4d21-44d5-9f63-9a07bf267824' ? 'soundaraharigece2025@jkkn.ac.in' : null)),
        assigned_coordinator_name: clean.assigned_coordinator_name !== undefined ? clean.assigned_coordinator_name : (existingEv?.assigned_coordinator_name || (validId === '200fdd74-4d21-44d5-9f63-9a07bf267824' ? 'Soundarahari' : null)),
        elections_count: clean.elections_count !== undefined ? clean.elections_count : (existingEv?.elections_count || 3),
        is_locked: clean.is_locked !== undefined ? !!clean.is_locked : !!existingEv?.is_locked,
        participant_count: clean.participant_count !== undefined ? clean.participant_count : (existingEv?.participant_count || 0),
        chief_guests: clean.chief_guests !== undefined ? clean.chief_guests : (existingEv?.chief_guests || []),
        social_coverage: clean.social_coverage !== undefined ? clean.social_coverage : (existingEv?.social_coverage || {}),
        slug: clean.slug || existingEv?.slug || (validId === '200fdd74-4d21-44d5-9f63-9a07bf267824' ? 'jkkncet-tn-assembly-2026-tamil-nadu-2026' : null),
        treasury_whatsapp_link: clean.treasury_whatsapp_link !== undefined ? clean.treasury_whatsapp_link : (existingEv?.treasury_whatsapp_link || null),
        opposition_whatsapp_link: clean.opposition_whatsapp_link !== undefined ? clean.opposition_whatsapp_link : (existingEv?.opposition_whatsapp_link || null),
        created_at: clean.created_at || existingEv?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'session_agenda') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        day: raw.day || 'Day 1',
        time: raw.time || '09:00 AM',
        title: raw.title || 'Agenda Item',
        description: raw.description || '',
        speaker_role: raw.speaker_role || null,
        is_current: !!raw.is_current,
        created_at: raw.created_at || new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'political_parties') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        name: raw.name,
        bench: raw.bench || 'Ruling',
        color: raw.color || '#2563eb',
        leader: raw.leader || null,
        manifesto: raw.manifesto || null,
        whatsapp_group_link: raw.whatsapp_group_link || null,
        created_at: raw.created_at || new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'committees') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        name: raw.name,
        topic: raw.topic || 'Deliberations',
        chairperson: raw.chairperson || null,
        max_capacity: raw.max_capacity || 50,
        created_at: raw.created_at || new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'event_days') {
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        day_number: Number(raw.day_number) || 1,
        name: raw.name || `Day ${raw.day_number || 1}`,
        date: raw.date || null,
        status: raw.status || 'Upcoming',
        activities: Array.isArray(raw.activities) ? raw.activities : [],
        is_archived: !!raw.is_archived,
        order_index: Number(raw.order_index) || 0,
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    if (table === 'event_day_attendance') {
      const dId = raw.day_id || raw.event_day_id;
      const sId = raw.student_id || raw.learner_id || raw.participant_id;
      const sanitized: Record<string, unknown> = {
        event_id: sanitizeEventId(raw.event_id),
        day_id: dId,
        event_day_id: dId,
        student_id: sId,
        participant_id: sId,
        status: raw.status || 'Present',
        marked_by: raw.marked_by || null,
        marked_by_role: raw.marked_by_role || 'volunteer',
        marked_at: raw.marked_at || new Date().toISOString(),
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (validId) sanitized.id = validId;
      return sanitized;
    }
    const sanitizedAny = { ...raw };
    if (raw.id !== undefined) {
      if (validId) {
        sanitizedAny.id = validId;
      } else {
        delete sanitizedAny.id;
      }
    }
    return sanitizedAny;
  }

  public async sbUpsert(table: string, record: Record<string, unknown>): Promise<{ success: boolean; error: any; data?: any }> {
    const sb = supabase;
    if (!sb) {
      console.warn(`[Supabase Write Skipped] Table: "${table}" — Supabase is not configured (running in localStorage-only mode).`);
      return { success: false, error: new Error('Supabase not configured') };
    }
    const sanitized = this.sanitizeRecordForTable(table, record);
    const writeKey = `${table}:::${sanitized.id || JSON.stringify(sanitized)}`;

    // Await any existing in-flight request for this exact write key
    const inFlight = this.inFlightPromises.get(writeKey);
    if (inFlight) {
      console.log(`[Supabase Write Awaiting In-Flight] Table: "${table}" Key: "${writeKey}"`);
      return await inFlight;
    }

    const runWrite = async () => {
      try {
        console.log(`[Supabase Write Attempt] Table: "${table}" Payload:`, sanitized);
        let onConflict = 'id';
        if (table === 'event_days') onConflict = 'event_id,day_number';
        else if (table === 'event_day_attendance') onConflict = 'event_id,day_id,student_id';

        let query;
        if (sanitized.id && isValidUuid(sanitized.id as string)) {
          query = sb.from(table).upsert(sanitized, { onConflict }).select();
        } else {
          const { id, ...insertPayload } = sanitized;
          query = sb.from(table).upsert(insertPayload, { onConflict }).select();
        }

        const { data, error, status } = await query;
        if (error || (status && status >= 400)) {
          // Graceful 409 conflict recovery for event_day_attendance
          if (table === 'event_day_attendance' && (status === 409 || error?.code === '23505' || String(error?.message || '').toLowerCase().includes('conflict') || String(error?.message || '').toLowerCase().includes('duplicate'))) {
            console.warn(`[Supabase 409 Conflict Caught on event_day_attendance] Resolving by updating existing row...`);
            const eId = sanitized.event_id as string;
            const dId = (sanitized.day_id || sanitized.event_day_id) as string;
            const sId = (sanitized.student_id || sanitized.participant_id) as string;
            const { data: existingRow } = await sb
              .from('event_day_attendance')
              .select('*')
              .eq('event_id', eId)
              .eq('day_id', dId)
              .eq('student_id', sId)
              .maybeSingle();

            if (existingRow) {
              const { data: updatedData, error: updateErr } = await sb
                .from('event_day_attendance')
                .update({
                  status: sanitized.status,
                  marked_by: sanitized.marked_by,
                  marked_by_role: sanitized.marked_by_role,
                  marked_at: sanitized.marked_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRow.id)
                .select();

              if (!updateErr && updatedData && updatedData.length > 0) {
                this.failedWriteSignatures.delete(writeKey);
                console.log(`✅ [Supabase 409 Resolved via Update] Table: "${table}" Data:`, updatedData[0]);
                return { success: true, error: null, data: updatedData[0] };
              }
            }
          }

          this.failedWriteSignatures.set(writeKey, Date.now());
          console.error(`❌ [Supabase Write Error] Table: "${table}" (HTTP ${status}) Code: ${error?.code} — ${error?.message}. Details:`, error?.details || error?.hint);
          this.notifyWriteError(table, 'save', error || new Error(`Write failed with status ${status}`));
          return { success: false, error: error || new Error(`HTTP ${status}`) };
        }
        this.failedWriteSignatures.delete(writeKey);
        console.log(`✅ [Supabase Write Success] Table: "${table}" (HTTP ${status}) Data:`, data);
        return { success: true, error: null, data: Array.isArray(data) ? data[0] : data };
      } catch (e: any) {
        this.failedWriteSignatures.set(writeKey, Date.now());
        console.error(`❌ [Supabase Write Exception] Table: "${table}":`, e);
        this.notifyWriteError(table, 'save', e);
        return { success: false, error: e };
      }
    };

    const promise = runWrite();
    this.inFlightPromises.set(writeKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightPromises.delete(writeKey);
    }
  }

  public async sbUpdate(table: string, id: string, patch: Record<string, unknown>): Promise<{ success: boolean; error: any; data?: any }> {
    const sb = supabase;
    if (!sb) {
      return { success: false, error: new Error('Supabase not configured') };
    }
    const sanitized = this.sanitizeRecordForTable(table, patch);
    const { id: _ignoredId, ...fieldsToUpdate } = sanitized;
    try {
      const { data, error, status } = await sb.from(table).update(fieldsToUpdate).eq('id', id).select();
      if (error || (status && status >= 400)) {
        console.warn(`[Supabase Update Warning] Table: "${table}" (HTTP ${status}):`, error?.message);
        return { success: false, error };
      }
      return { success: true, error: null, data: Array.isArray(data) ? data[0] : data };
    } catch (err) {
      console.warn(`[Supabase Update Exception] Table: "${table}":`, err);
      return { success: false, error: err };
    }
  }

  public async sbUpsertBatch(table: string, records: Record<string, unknown>[]): Promise<{ success: boolean; error: any; data?: any }> {
    const sb = supabase;
    if (!sb) {
      return { success: false, error: new Error('Supabase not configured') };
    }
    if (records.length === 0) return { success: true, error: null };

    // Guarantee EVERY record in batch has a genuine UUID before PostgREST onConflict: 'id'
    const sanitizedBatch = records.map(r => {
      const sanitized = this.sanitizeRecordForTable(table, r);
      if (!sanitized.id || !isValidUuid(sanitized.id as string)) {
        sanitized.id = genUuid();
      }
      return sanitized;
    });

    const batchKey = `${table}:::batch:::${sanitizedBatch.map(r => r.id).sort().join(',')}`;
    const inFlight = this.inFlightPromises.get(batchKey);
    if (inFlight) {
      return await inFlight;
    }

    const runBatch = async () => {
      try {
        console.log(`[Supabase Write Batch Attempt] Table: "${table}" Count: ${sanitizedBatch.length}`);
        let onConflict = 'id';
        if (table === 'event_days') onConflict = 'event_id,day_number';
        else if (table === 'event_day_attendance') onConflict = 'event_id,day_id,student_id';
        const { data, error, status } = await sb.from(table).upsert(sanitizedBatch, { onConflict }).select();
        if (error || (status && status >= 400)) {
          this.failedWriteSignatures.set(batchKey, Date.now());
          console.error(`❌ [Supabase Write Batch Error] Table: "${table}" (HTTP ${status}) Code: ${error?.code} — ${error?.message}. Details:`, error?.details || error?.hint);
          this.notifyWriteError(table, 'save batch', error || new Error(`Batch write failed with status ${status}`));
          return { success: false, error: error || new Error(`HTTP ${status}`) };
        }
        this.failedWriteSignatures.delete(batchKey);
        console.log(`✅ [Supabase Write Batch Success] Table: "${table}" (HTTP ${status}) Count: ${data?.length || sanitizedBatch.length}`);
        return { success: true, error: null, data };
      } catch (e: any) {
        this.failedWriteSignatures.set(batchKey, Date.now());
        console.error(`❌ [Supabase Write Batch Exception] Table: "${table}":`, e);
        this.notifyWriteError(table, 'save batch', e);
        return { success: false, error: e };
      }
    };

    const promise = runBatch();
    this.inFlightPromises.set(batchKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightPromises.delete(batchKey);
    }
  }

  public async sbDelete(table: string, id: string): Promise<{ success: boolean; error: any }> {
    if (!supabase) return { success: false, error: new Error('Supabase not configured') };
    try {
      console.log(`[Supabase Delete Attempt] Table: "${table}" ID: "${id}"`);
      const { error, status } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.error(`❌ [Supabase Delete Error] Table: "${table}" (HTTP ${status}) Code: ${error.code} — ${error.message}`);
        this.notifyWriteError(table, 'delete', error);
        return { success: false, error };
      }
      console.log(`✅ [Supabase Delete Success] Table: "${table}" ID: "${id}"`);
      return { success: true, error: null };
    } catch (e: any) {
      console.error(`❌ [Supabase Delete Exception] Table: "${table}":`, e);
      this.notifyWriteError(table, 'delete', e);
      return { success: false, error: e };
    }
  }

  // ── AUTH & SESSIONS ───────────────────────────────────────────────────────

  public authenticateCoordinator(email: string, pass: string): UserSession | null {
    this.cleanupAndDeduplicateData();
    const coords = this.getCoordinators();
    const emailLower = email.trim().toLowerCase();
    const passTrim = pass.trim();

    // 1. Locate the single authoritative coordinator record for this email
    const coord = coords.find(c => c.email.trim().toLowerCase() === emailLower);
    if (!coord) return null;

    // 2. Validate password strictly against the authoritative record (invalidates old passwords)
    const isValid = (coord.password_hash && coord.password_hash === passTrim) ||
      (coord.raw_temp_password && coord.raw_temp_password === passTrim);
    if (!isValid) return null;

    return {
      role: 'coordinator',
      email: coord.email,
      name: coord.name,
      assigned_event_ids: [coord.event_id]
    };
  }

  public authenticateStudent(accessCode: string): Learner | null {
    const clean = accessCode.trim().toUpperCase();
    if (!clean) return null;
    const learners = this.getLearners();
    return learners.find(l => (l.access_code || '').toUpperCase() === clean) || null;
  }

  public authenticateJury(accessCode: string): JuryMember | null {
    const clean = accessCode.trim().toUpperCase();
    if (!clean) return null;
    const normClean = clean.replace(/-/g, '');
    const jury = this.getJury();
    return jury.find(j => {
      const jCode = (j.access_code || '').toUpperCase().replace(/-/g, '');
      return jCode === normClean ||
        (!normClean.startsWith('JURY') && jCode === `JURY${normClean}`) ||
        (normClean.startsWith('JURY') && jCode === normClean);
    }) || null;
  }

  public authenticateVolunteer(accessCode: string): Volunteer | null {
    const clean = accessCode.trim().toUpperCase();
    if (!clean) return null;
    const volunteers = this.getVolunteers();
    const normClean = clean.replace(/-/g, '');
    return volunteers.find(v => {
      const vCode = (v.access_code || '').toUpperCase().replace(/-/g, '');
      const phoneSuffix = v.phone ? v.phone.replace(/\D/g, '').slice(-4) : '';
      return vCode === normClean ||
        (normClean.startsWith('VOL') && vCode === normClean) ||
        (!normClean.startsWith('VOL') && vCode === `VOL${normClean}`) ||
        (phoneSuffix && (phoneSuffix === normClean || `VOL${phoneSuffix}` === normClean));
    }) || null;
  }

  public authenticateAccessCode(
    accessCode: string,
    targetEventId?: string
  ): { role: 'volunteer' | 'jury' | 'student'; user: Volunteer | JuryMember | Learner; eventId: string } | null {
    const clean = accessCode.trim().toUpperCase();
    if (!clean) return null;
    const normClean = clean.replace(/-/g, '');

    // 1. Volunteer Check (VOL prefix or phone/number suffix)
    const allVolunteers = this.getVolunteers();
    const candidateVolunteers = targetEventId
      ? allVolunteers.filter(v => v.event_id === targetEventId).concat(allVolunteers.filter(v => v.event_id !== targetEventId))
      : allVolunteers;

    const matchedVol = candidateVolunteers.find(v => {
      const vCode = (v.access_code || '').toUpperCase().replace(/-/g, '');
      const phoneSuffix = v.phone ? v.phone.replace(/\D/g, '').slice(-4) : '';
      return vCode === normClean ||
        (normClean.startsWith('VOL') && vCode === normClean) ||
        (!normClean.startsWith('VOL') && vCode === `VOL${normClean}`) ||
        (phoneSuffix && (phoneSuffix === normClean || `VOL${phoneSuffix}` === normClean));
    });

    if (matchedVol) {
      this.logAudit({
        event_id: matchedVol.event_id,
        action: 'ACCESS_CODE_LOGIN_SUCCESS',
        actor_role: 'volunteer',
        actor_name: matchedVol.name,
        details: `Volunteer login: ${matchedVol.name} (${matchedVol.access_code})`
      });
      console.log(`[Auth Trace] Code: "${accessCode}" -> Matched Record ID: "${matchedVol.id}" -> Event ID: "${matchedVol.event_id}" -> Role: "volunteer" (Name: ${matchedVol.name})`);
      return { role: 'volunteer', user: matchedVol, eventId: matchedVol.event_id };
    }

    // 2. Jury Check (JURY prefix or jury member match)
    const allJury = this.getJury();
    const candidateJury = targetEventId
      ? allJury.filter(j => j.event_id === targetEventId).concat(allJury.filter(j => j.event_id !== targetEventId))
      : allJury;

    const matchedJury = candidateJury.find(j => {
      const jCode = (j.access_code || '').toUpperCase().replace(/-/g, '');
      return jCode === normClean ||
        (!normClean.startsWith('JURY') && jCode === `JURY${normClean}`) ||
        (normClean.startsWith('JURY') && jCode === normClean);
    });

    if (matchedJury) {
      this.logAudit({
        event_id: matchedJury.event_id,
        action: 'ACCESS_CODE_LOGIN_SUCCESS',
        actor_role: 'jury',
        actor_name: matchedJury.name,
        details: `Jury login: ${matchedJury.name} (${matchedJury.access_code})`
      });
      console.log(`[Auth Trace] Code: "${accessCode}" -> Matched Record ID: "${matchedJury.id}" -> Event ID: "${matchedJury.event_id}" -> Role: "jury" (Name: ${matchedJury.name})`);
      return { role: 'jury', user: matchedJury, eventId: matchedJury.event_id };
    }

    // 3. Delegate / Student Check
    const allLearners = this.getLearners();
    const candidateLearners = targetEventId
      ? allLearners.filter(l => l.event_id === targetEventId).concat(allLearners.filter(l => l.event_id !== targetEventId))
      : allLearners;

    const matchedStudent = candidateLearners.find(l => (l.access_code || '').toUpperCase() === clean);
    if (matchedStudent) {
      this.logAudit({
        event_id: matchedStudent.event_id,
        action: 'ACCESS_CODE_LOGIN_SUCCESS',
        actor_role: 'student',
        actor_name: matchedStudent.full_name,
        details: `Delegate login: ${matchedStudent.full_name} (${matchedStudent.access_code})`
      });
      console.log(`[Auth Trace] Code: "${accessCode}" -> Matched Record ID: "${matchedStudent.id}" -> Event ID: "${matchedStudent.event_id}" -> Role: "student" (Name: ${matchedStudent.full_name})`);
      return { role: 'student', user: matchedStudent, eventId: matchedStudent.event_id };
    }

    this.logAudit({
      event_id: targetEventId,
      action: 'ACCESS_CODE_LOGIN_FAILED',
      details: `Failed access code attempt: ${accessCode}`
    });
    console.warn(`[Auth Trace] Code: "${accessCode}" -> No matching record found in volunteers, jury, or learners.`);
    return null;
  }

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────

  public logAudit(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): SecurityAuditLog {
    const logs = this.getItem<SecurityAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const entry: SecurityAuditLog = {
      id: genUuid(),
      timestamp: new Date().toISOString(),
      ...log
    };
    logs.unshift(entry);
    if (logs.length > 200) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    console.log(`🔒 [Security Audit] ${entry.action}:`, entry.details || '', entry);
    return entry;
  }

  public getAuditLogs(eventId?: string): SecurityAuditLog[] {
    const logs = this.getItem<SecurityAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    if (eventId) return logs.filter(l => !l.event_id || l.event_id === eventId);
    return logs;
  }

  // ── EVENTS ────────────────────────────────────────────────────────────────

  public getEvents(): CollegeEvent[] {
    return this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }

  public addEvent(event: Partial<CollegeEvent>): CollegeEvent {
    const all = this.getEvents();
    const eventId = (event.id && isValidUuid(event.id)) ? event.id : genUuid();
    const computedSlug = getEventSlug({
      id: eventId,
      college_name: event.college_name || 'New Assembly',
      chapter: event.chapter || 'Tamil Nadu',
      slug: event.slug
    } as CollegeEvent);

    const newEvent: CollegeEvent = {
      id: eventId,
      college_name: event.college_name || 'New Assembly',
      chapter: event.chapter || 'Tamil Nadu',
      level: event.level || 'College Round',
      location: event.location || 'College Campus',
      dates: event.dates || 'Upcoming',
      event_stage: event.event_stage || 'College Round',
      status: event.status || 'Pre-Event',
      participant_count: event.participant_count || 0,
      assigned_coordinator_email: event.assigned_coordinator_email,
      assigned_coordinator_name: event.assigned_coordinator_name,
      elections_count: event.elections_count || 3,
      is_locked: false,
      slug: event.slug || computedSlug,
      created_at: new Date().toISOString()
    };
    all.unshift(newEvent);
    this.setItem(STORAGE_KEYS.EVENTS, all);
    this.sbUpsert('college_events', newEvent as unknown as Record<string, unknown>);
    this.notify();
    return newEvent;
  }

  public updateEvent(event: CollegeEvent) {
    if (event.is_locked !== undefined) {
      const sc = { ...((event.social_coverage as Record<string, any>) || {}) };
      sc.allocation_lock = event.is_locked;
      event.social_coverage = sc;
      this.setItem(`${STORAGE_KEYS.ALLOCATION_LOCK}_${event.id}`, event.is_locked);
    }
    const all = this.getEvents().map(e => (e.id === event.id ? event : e));
    this.setItem(STORAGE_KEYS.EVENTS, all);
    this.sbUpsert('college_events', event as unknown as Record<string, unknown>);
    this.notify();
  }

  public deleteEvent(eventId: string) {
    if (!eventId) return;
    const all = this.getEvents().filter(e => e.id !== eventId);
    this.setItem(STORAGE_KEYS.EVENTS, all);

    // Purge ghost records for this event from localStorage
    this.setItem(STORAGE_KEYS.LEARNERS, this.getItem<any[]>(STORAGE_KEYS.LEARNERS, []).filter(l => l.event_id !== eventId));
    this.setItem(STORAGE_KEYS.PARTIES, this.getItem<any[]>(STORAGE_KEYS.PARTIES, []).filter(p => p.event_id !== eventId));
    this.setItem(STORAGE_KEYS.COMMITTEES, this.getItem<any[]>(STORAGE_KEYS.COMMITTEES, []).filter(c => c.event_id !== eventId));
    this.setItem(STORAGE_KEYS.AGENDA, this.getItem<any[]>(STORAGE_KEYS.AGENDA, []).filter(a => a.event_id !== eventId));
    this.setItem(STORAGE_KEYS.NOMINATIONS, this.getItem<any[]>(STORAGE_KEYS.NOMINATIONS, []).filter(n => n.event_id !== eventId));
    this.setItem(STORAGE_KEYS.ELECTIONS, this.getItem<any[]>(STORAGE_KEYS.ELECTIONS, []).filter(e => e.event_id !== eventId));
    this.setItem(STORAGE_KEYS.FLASH_VOTES, this.getItem<any[]>(STORAGE_KEYS.FLASH_VOTES, []).filter(f => f.event_id !== eventId));
    this.setItem(STORAGE_KEYS.PROCEEDINGS, this.getItem<any[]>(STORAGE_KEYS.PROCEEDINGS, []).filter(p => p.event_id !== eventId));
    this.setItem(STORAGE_KEYS.QUESTIONS, this.getItem<any[]>(STORAGE_KEYS.QUESTIONS, []).filter(q => q.event_id !== eventId));
    this.setItem(STORAGE_KEYS.SCORES, this.getItem<any[]>(STORAGE_KEYS.SCORES, []).filter(s => s.event_id !== eventId));
    this.setItem(STORAGE_KEYS.EVENT_DAYS, this.getItem<any[]>(STORAGE_KEYS.EVENT_DAYS, []).filter(d => d.event_id !== eventId));
    this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, this.getItem<any[]>(STORAGE_KEYS.DAY_ATTENDANCE, []).filter(a => a.event_id !== eventId));
    this.setItem(STORAGE_KEYS.CHECKLIST, this.getItem<any[]>(STORAGE_KEYS.CHECKLIST, []).filter(c => c.event_id !== eventId));
    this.setItem(STORAGE_KEYS.TEAM, this.getItem<any[]>(STORAGE_KEYS.TEAM, []).filter(t => t.event_id !== eventId));
    this.setItem(STORAGE_KEYS.CHAT, this.getItem<any[]>(STORAGE_KEYS.CHAT, []).filter(c => c.event_id !== eventId));
    this.setItem(STORAGE_KEYS.FEEDBACK, this.getItem<any[]>(STORAGE_KEYS.FEEDBACK, []).filter(f => f.event_id !== eventId));

    // Clear event-specific locks and preferences
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${STORAGE_KEYS.ALLOCATION_LOCK}_${eventId}`);
        localStorage.removeItem(`${STORAGE_KEYS.REGISTRATIONS_FROZEN}_${eventId}`);
        localStorage.removeItem(`${STORAGE_KEYS.SCORES_LOCKED}_${eventId}`);
        localStorage.removeItem(`tn_assembly_projector_studio_${eventId}`);
        localStorage.removeItem(`tn_assembly_last_bell_${eventId}`);
        localStorage.removeItem(`${STORAGE_KEYS.YUVA_ASSIGNMENTS}_${eventId}`);
      }
    } catch { }

    this.sbDelete('college_events', eventId);
    this.notify();
  }

  // ── COORDINATORS ──────────────────────────────────────────────────────────

  public getCoordinators(): Coordinator[] {
    return this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  }

  public async addCoordinator(coord: Partial<Coordinator>): Promise<{ success: boolean; error?: any; data?: Coordinator }> {
    const emailLower = coord.email?.trim().toLowerCase();
    if (!emailLower) {
      return { success: false, error: new Error('Coordinator email is required') };
    }
    const fullCoord: Coordinator = {
      id: (coord.id && isValidUuid(coord.id)) ? coord.id : genUuid(),
      event_id: coord.event_id || '',
      name: coord.name || 'Coordinator',
      email: emailLower,
      password_hash: coord.password_hash || 'coord123',
      raw_temp_password: coord.raw_temp_password || coord.password_hash || 'coord123'
    };
    return await this.updateCoordinator(fullCoord);
  }

  public async updateCoordinator(coord: Coordinator): Promise<{ success: boolean; error: any; data?: Coordinator }> {
    const emailLower = coord.email?.trim().toLowerCase();
    if (!emailLower) {
      return { success: false, error: new Error('Coordinator email is required') };
    }

    const sanitizeEventId = (evId: unknown) => {
      if (typeof evId === 'string' && isValidUuid(evId)) return evId;
      return null;
    };

    if (!supabase) {
      const all = this.getCoordinators();
      const updated = all.map(c => {
        const match = c.id === coord.id || (emailLower && c.email.trim().toLowerCase() === emailLower);
        return match ? { ...c, ...coord } : c;
      });
      const candidateList = updated.some(c => c.id === coord.id || c.email.trim().toLowerCase() === emailLower)
        ? updated
        : [...updated, coord];
      this.setItem(STORAGE_KEYS.COORDINATORS, candidateList);
      this.notify();
      return { success: true, data: coord, error: null };
    }

    try {
      // 1. Verify if this coordinator already exists remotely in Supabase (by UUID or by unique email)
      let existingDbRecord: { id: string; email: string } | null = null;

      if (isValidUuid(coord.id)) {
        const { data: byId } = await supabase
          .from('coordinators')
          .select('id, email')
          .eq('id', coord.id)
          .maybeSingle();
        if (byId && isValidUuid(byId.id)) {
          existingDbRecord = byId;
        }
      }

      if (!existingDbRecord && emailLower) {
        const { data: byEmail, error: lookupErr } = await supabase
          .from('coordinators')
          .select('id, email')
          .eq('email', emailLower)
          .maybeSingle();

        if (lookupErr) {
          console.warn('[Supabase] Coordinator email lookup warning:', lookupErr.message);
        }
        if (byEmail && isValidUuid(byEmail.id)) {
          existingDbRecord = byEmail;
        }
      }

      let savedRecord: Coordinator;

      if (existingDbRecord) {
        // 2. Verified existing coordinator -> explicit UPDATE on existing database UUID
        const updatePayload: Record<string, unknown> = {
          event_id: sanitizeEventId(coord.event_id),
          name: (coord.name || 'Coordinator').trim(),
          email: emailLower,
          password_hash: coord.password_hash || 'coord123',
          raw_temp_password: coord.raw_temp_password || coord.password_hash || 'coord123',
          updated_at: new Date().toISOString()
        };

        const maskedUpdatePayload = { ...updatePayload, password_hash: '***', raw_temp_password: '***' };
        console.log(`[Supabase Update Coordinator] Target UUID: "${existingDbRecord.id}" Payload:`, maskedUpdatePayload);
        const { data, error, status } = await supabase
          .from('coordinators')
          .update(updatePayload)
          .eq('id', existingDbRecord.id)
          .select()
          .maybeSingle();

        if (error || !data) {
          console.error(`❌ [Supabase Coordinator Update Error] (HTTP ${status}):`, error);
          this.notifyWriteError('coordinators', 'update', error || new Error('No data returned from update'));
          return { success: false, error: error || new Error('Update returned no rows') };
        }

        savedRecord = {
          id: data.id,
          event_id: data.event_id || coord.event_id || '',
          name: data.name,
          email: data.email,
          password_hash: data.password_hash,
          raw_temp_password: data.raw_temp_password || data.password_hash
        };
      } else {
        // 3. Coordinator not yet in Supabase -> explicit INSERT (omits non-UUID IDs so Postgres generates UUID)
        const insertPayload: Record<string, unknown> = {
          event_id: sanitizeEventId(coord.event_id),
          name: (coord.name || 'Coordinator').trim(),
          email: emailLower,
          password_hash: coord.password_hash || 'coord123',
          raw_temp_password: coord.raw_temp_password || coord.password_hash || 'coord123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (coord.id && isValidUuid(coord.id)) {
          insertPayload.id = coord.id;
        }

        const maskedInsertPayload = { ...insertPayload, password_hash: '***', raw_temp_password: '***' };
        console.log('[Supabase Insert Coordinator] Payload:', maskedInsertPayload);
        let { data, error, status } = await supabase
          .from('coordinators')
          .insert(insertPayload)
          .select()
          .maybeSingle();

        // If email already exists (race condition), fallback to update by email
        if (error && (error.code === '23505' || error.message?.includes('duplicate key'))) {
          console.log('[Supabase Coordinator Insert Conflict] Email exists, falling back to update by email.');
          const updateRes = await supabase
            .from('coordinators')
            .update(insertPayload)
            .eq('email', emailLower)
            .select()
            .maybeSingle();
          data = updateRes.data;
          error = updateRes.error;
          status = updateRes.status;
        }

        if (error || !data) {
          console.error(`❌ [Supabase Coordinator Insert Error] (HTTP ${status}):`, error);
          this.notifyWriteError('coordinators', 'insert', error || new Error('No data returned from insert'));
          return { success: false, error: error || new Error('Insert returned no rows') };
        }

        savedRecord = {
          id: data.id,
          event_id: data.event_id || coord.event_id || '',
          name: data.name,
          email: data.email,
          password_hash: data.password_hash,
          raw_temp_password: data.raw_temp_password || data.password_hash
        };
      }

      // 4. ONLY ON SUCCESS: update local storage and notify listeners
      const currentList = this.getCoordinators();
      let matched = false;
      const updatedList = currentList.map(c => {
        if (c.id === savedRecord.id || c.email.trim().toLowerCase() === emailLower) {
          matched = true;
          return savedRecord;
        }
        return c;
      });
      const finalList = matched ? updatedList : [...updatedList, savedRecord];

      // Enforce strict uniqueness by email
      const uniqueCoords: Coordinator[] = [];
      const seenEmails = new Set<string>();
      for (const c of finalList) {
        const key = c.email ? c.email.trim().toLowerCase() : c.id;
        if (!seenEmails.has(key)) {
          seenEmails.add(key);
          uniqueCoords.push(c);
        }
      }

      this.setItem(STORAGE_KEYS.COORDINATORS, uniqueCoords);
      this.notify();
      console.log('✅ [Coordinator Persisted Successfully to Supabase]:', { id: savedRecord.id, email: savedRecord.email, name: savedRecord.name });
      return { success: true, data: savedRecord, error: null };
    } catch (e: any) {
      console.error('❌ [Coordinator Persistence Exception]:', e);
      this.notifyWriteError('coordinators', 'save', e);
      return { success: false, error: e };
    }
  }

  // ── LEARNERS ──────────────────────────────────────────────────────────────

  public getLearners(eventId?: string): Learner[] {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    const seenIds = new Set<string>();
    const seenCodes = new Set<string>();
    const unique: Learner[] = [];
    const allParties = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, []);
    let benchFixedCount = 0;
    const learnersToSync: Array<{ id: string; bench: BenchType }> = [];

    for (const l of all) {
      if (!l.id || seenIds.has(l.id)) continue;
      const codeKey = l.access_code && l.access_code.trim()
        ? `${l.event_id || ''}:::${l.access_code.trim().toUpperCase()}`
        : null;
      if (codeKey && seenCodes.has(codeKey)) continue;

      seenIds.add(l.id);
      if (codeKey) seenCodes.add(codeKey);

      // Dynamically align bench with political party bench
      const party = allParties.find(p =>
        (l.party_id && p.id === l.party_id) ||
        (l.party_name && p.name.trim().toLowerCase() === l.party_name.trim().toLowerCase() && (!l.event_id || !p.event_id || p.event_id === l.event_id))
      );

      if (party?.bench && party.bench !== l.bench) {
        unique.push({ ...l, bench: party.bench });
        benchFixedCount++;
        if (!this.fixedLearnerIdsSynced.has(l.id)) {
          this.fixedLearnerIdsSynced.add(l.id);
          learnersToSync.push({ id: l.id, bench: party.bench });
        }
      } else {
        unique.push(l);
      }
    }

    if (benchFixedCount > 0) {
      this.setItem(STORAGE_KEYS.LEARNERS, unique);
      if (learnersToSync.length > 0) {
        learnersToSync.forEach(fl => {
          this.sbUpdate('learners', fl.id, { bench: fl.bench });
        });
      }
    }

    const sortedAll = sortLearnersStably(unique);
    if (eventId) {
      return sortedAll.filter(l => l.event_id === eventId);
    }
    return sortedAll;
  }

  public async addLearner(learner: Partial<Learner>): Promise<Learner> {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    const newLearner: Learner = {
      id: (learner.id && isValidUuid(learner.id)) ? learner.id : genUuid(),
      event_id: learner.event_id || '',
      access_code: learner.access_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      full_name: learner.full_name || 'Participant',
      email: learner.email || '',
      phone: learner.phone || '',
      department: learner.department || 'General',
      academic_year: learner.academic_year && learner.academic_year !== '1st Year' ? learner.academic_year : '1st Year',
      constituency_number: learner.constituency_number,
      constituency_name: learner.constituency_name,
      district: learner.district,
      party_name: learner.party_name,
      party_id: learner.party_id,
      bench: learner.bench,
      role: learner.role || 'Member of Legislative Assembly (MLA)',
      committee_name: learner.committee_name,
      committee_id: learner.committee_id,
      day1_checked_in: !!learner.day1_checked_in,
      day2_checked_in: !!learner.day2_checked_in,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    all.unshift(newLearner);
    this.setItem(STORAGE_KEYS.LEARNERS, all);

    // Update event participant count
    if (learner.event_id) {
      const events = this.getEvents().map(e =>
        e.id === learner.event_id ? { ...e, participant_count: (e.participant_count || 0) + 1 } : e
      );
      this.setItem(STORAGE_KEYS.EVENTS, events);
    }

    await this.sbUpsert('learners', newLearner as unknown as Record<string, unknown>);
    return newLearner;
  }

  public async importLearners(
    learnersList: Partial<Learner>[],
    eventId: string
  ): Promise<{
    success: boolean;
    count: number;
    error?: any;
    report?: {
      totalRows: number;
      partiesMatched: number;
      partiesCreated: number;
      committeesMatched: number;
      committeesCreated: number;
      constituenciesMatched: number;
    };
  }> {
    const allLearners = this.getLearners();
    const eventLearners = allLearners.filter(l => l.event_id === eventId);
    const existingParties = this.getParties(eventId);
    const existingCommittees = this.getCommittees(eventId);

    const partyNameMap = new Map<string, Party>();
    existingParties.forEach(p => {
      partyNameMap.set(p.name.trim().toLowerCase(), p);
      partyNameMap.set(p.id.toLowerCase(), p);
    });

    const commNameMap = new Map<string, Committee>();
    existingCommittees.forEach(c => {
      commNameMap.set(c.name.trim().toLowerCase(), c);
      commNameMap.set(c.id.toLowerCase(), c);
    });

    const colors = ['#059669', '#dc2626', '#2563eb', '#d97706', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5'];

    const findParty = (val?: string): Party | undefined => {
      if (!val) return undefined;
      const clean = val.trim().toLowerCase();
      if (partyNameMap.has(clean)) return partyNameMap.get(clean);
      const normInput = clean.replace(/[^a-z0-9]/g, '');
      const byNorm = existingParties.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normInput);
      if (byNorm) return byNorm;
      const byPrefix = existingParties.find(p => {
        const pNorm = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normInput.startsWith(pNorm) || pNorm.startsWith(normInput);
      });
      return byPrefix;
    };

    const findCommittee = (val?: string): Committee | undefined => {
      if (!val) return undefined;
      const clean = val.trim().toLowerCase();
      if (commNameMap.has(clean)) return commNameMap.get(clean);
      const normInput = clean.replace(/[^a-z0-9]/g, '');
      const byNorm = existingCommittees.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normInput);
      if (byNorm) return byNorm;
      const numMatch = clean.match(/\d+/);
      if (numMatch) {
        const targetNum = parseInt(numMatch[0], 10);
        const byNum = existingCommittees.find(c => {
          const cNum = c.name.match(/\d+/);
          return cNum && parseInt(cNum[0], 10) === targetNum;
        });
        if (byNum) return byNum;
      }
      return undefined;
    };

    let partiesCreatedCount = 0;
    let committeesCreatedCount = 0;

    // 1. Auto-register any missing parties referenced in the imported roster
    for (const l of learnersList) {
      if (l.party_name && l.party_name.trim()) {
        const matched = findParty(l.party_name);
        if (!matched) {
          const newParty = await this.addParty({
            event_id: eventId,
            name: l.party_name.trim(),
            bench: 'Independent',
            color: colors[existingParties.length % colors.length]
          });
          existingParties.push(newParty);
          partyNameMap.set(newParty.name.trim().toLowerCase(), newParty);
          partyNameMap.set(newParty.id.toLowerCase(), newParty);
          partiesCreatedCount++;
        }
      }
    }

    // 2. Auto-register any missing committees referenced in the imported roster
    for (const l of learnersList) {
      if (l.committee_name && l.committee_name.trim()) {
        const matched = findCommittee(l.committee_name);
        if (!matched) {
          const cleanName = /^\d+$/.test(l.committee_name.trim())
            ? `Committee ${l.committee_name.trim()}`
            : l.committee_name.trim();
          const newComm = await this.addCommittee({
            event_id: eventId,
            name: cleanName,
            topic: `${cleanName} Deliberations`,
            max_capacity: 50
          });
          existingCommittees.push(newComm);
          commNameMap.set(cleanName.toLowerCase(), newComm);
          commNameMap.set(newComm.id.toLowerCase(), newComm);
          committeesCreatedCount++;
        }
      }
    }

    // 3. Smart Merge or Insert Delegates
    const updatedItems: Learner[] = [];
    const newItems: Learner[] = [];
    const updatedEventLearnersMap = new Map<string, Learner>(eventLearners.map(l => [l.id, l]));

    const findExisting = (item: Partial<Learner>): Learner | undefined => {
      if (item.access_code && item.access_code.trim()) {
        const cleanCode = item.access_code.trim().toUpperCase();
        const byCode = eventLearners.find(e => (e.access_code || '').trim().toUpperCase() === cleanCode);
        if (byCode) return byCode;
      }
      if (item.email && item.email.trim()) {
        const cleanEmail = item.email.trim().toLowerCase();
        const byEmail = eventLearners.find(e => (e.email || '').trim().toLowerCase() === cleanEmail);
        if (byEmail) return byEmail;
      }
      if (item.full_name && item.full_name.trim()) {
        const cleanName = item.full_name.trim().toLowerCase();
        const byName = eventLearners.find(e => (e.full_name || '').trim().toLowerCase() === cleanName);
        if (byName) return byName;
      }
      return undefined;
    };

    let partiesMatchedCount = 0;
    let committeesMatchedCount = 0;
    let constituenciesMatchedCount = 0;

    learnersList.forEach((l, index) => {
      const partyMatch = l.party_id
        ? findParty(l.party_id)
        : (l.party_name ? findParty(l.party_name) : undefined);

      if (partyMatch) partiesMatchedCount++;

      const commCleanName = l.committee_name && /^\d+$/.test(l.committee_name.trim())
        ? `Committee ${l.committee_name.trim()}`
        : l.committee_name?.trim();

      const commMatch = l.committee_id
        ? findCommittee(l.committee_id)
        : (commCleanName ? findCommittee(commCleanName) : undefined);

      if (commMatch) committeesMatchedCount++;

      if (l.constituency_number !== undefined || l.constituency_name) {
        constituenciesMatchedCount++;
      }

      const resolvedPartyName = partyMatch ? partyMatch.name : (l.party_name || undefined);
      const resolvedPartyId = partyMatch ? partyMatch.id : (l.party_id || undefined);
      const resolvedBench: BenchType | undefined = l.bench || (partyMatch ? partyMatch.bench : undefined);
      const resolvedCommName = commMatch ? commMatch.name : (commCleanName || undefined);
      const resolvedCommId = commMatch ? commMatch.id : (l.committee_id || undefined);

      const existingMatch = findExisting(l);

      if (existingMatch) {
        const updated: Learner = {
          ...existingMatch,
          full_name: (l.full_name && l.full_name.trim()) ? l.full_name : existingMatch.full_name,
          email: (l.email && l.email.trim()) ? l.email : existingMatch.email,
          phone: (l.phone && l.phone.trim()) ? l.phone : existingMatch.phone,
          department: (l.department !== undefined && l.department !== null && l.department !== '') ? l.department : existingMatch.department,
          academic_year: l.academic_year || existingMatch.academic_year,
          constituency_number: l.constituency_number !== undefined ? l.constituency_number : existingMatch.constituency_number,
          constituency_name: (l.constituency_name !== undefined && l.constituency_name !== null && l.constituency_name !== '') ? l.constituency_name : existingMatch.constituency_name,
          district: (l.district !== undefined && l.district !== null && l.district !== '') ? l.district : existingMatch.district,
          party_name: resolvedPartyName !== undefined ? resolvedPartyName : existingMatch.party_name,
          party_id: resolvedPartyId !== undefined ? resolvedPartyId : existingMatch.party_id,
          bench: resolvedBench !== undefined ? resolvedBench : existingMatch.bench,
          role: (l.role !== undefined && l.role !== null && l.role !== '') ? l.role : existingMatch.role,
          committee_name: resolvedCommName !== undefined ? resolvedCommName : existingMatch.committee_name,
          committee_id: resolvedCommId !== undefined ? resolvedCommId : existingMatch.committee_id
        };
        updatedItems.push(updated);
        updatedEventLearnersMap.set(existingMatch.id, updated);
      } else {
        const newLearner: Learner = {
          id: (l.id && isValidUuid(l.id)) ? l.id : genUuid(),
          event_id: eventId,
          access_code: l.access_code || `${Math.random().toString(36).substring(2, 6)}${index}`.toUpperCase().substring(0, 6),
          full_name: l.full_name || 'Delegate',
          email: l.email || '',
          phone: l.phone || '',
          department: l.department || '',
          academic_year: l.academic_year || ('' as AcademicYear),
          constituency_number: l.constituency_number,
          constituency_name: l.constituency_name,
          district: l.district,
          party_name: resolvedPartyName,
          party_id: resolvedPartyId,
          bench: resolvedBench,
          role: l.role,
          committee_name: resolvedCommName,
          committee_id: resolvedCommId,
          day1_checked_in: false,
          day2_checked_in: false,
          created_at: new Date().toISOString()
        };
        newItems.push(newLearner);
        updatedEventLearnersMap.set(newLearner.id, newLearner);
      }
    });

    const allToSync = [...newItems, ...updatedItems];

    // Sync to Supabase first — if database write fails, do not corrupt local cache
    if (supabase && allToSync.length > 0) {
      const syncRes = await this.sbUpsertBatch('learners', allToSync as unknown as Record<string, unknown>[]);
      if (!syncRes.success) {
        console.error('❌ [Supabase importLearners error]:', syncRes.error);
        return { success: false, count: 0, error: syncRes.error };
      }
    }

    // Reconstruct full master list only after database confirms success
    const otherEventLearners = allLearners.filter(l => l.event_id !== eventId);
    const finalEventLearners = Array.from(updatedEventLearnersMap.values());
    const finalAllLearners = [...finalEventLearners, ...otherEventLearners];

    this.setItem(STORAGE_KEYS.LEARNERS, finalAllLearners);

    // Update participant count on event
    const events = this.getEvents().map(e =>
      e.id === eventId ? { ...e, participant_count: finalEventLearners.length } : e
    );
    this.setItem(STORAGE_KEYS.EVENTS, events);

    this.notify();
    return {
      success: true,
      count: allToSync.length,
      report: {
        totalRows: allToSync.length,
        partiesMatched: partiesMatchedCount,
        partiesCreated: partiesCreatedCount,
        committeesMatched: committeesMatchedCount,
        committeesCreated: committeesCreatedCount,
        constituenciesMatched: constituenciesMatchedCount
      }
    };
  }

  public async updateLearner(learner: Learner): Promise<void> {
    const withUpdated: Learner = {
      ...learner,
      updated_at: new Date().toISOString()
    };
    const all = this.getLearners().map(l => (l.id === learner.id ? withUpdated : l));
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    await this.sbUpsert('learners', withUpdated as unknown as Record<string, unknown>);
  }

  public async deleteLearner(learnerId: string): Promise<void> {
    const target = this.getLearners().find(l => l.id === learnerId);
    const all = this.getLearners().filter(l => l.id !== learnerId);
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    if (target?.event_id) {
      const events = this.getEvents().map(e =>
        e.id === target.event_id ? { ...e, participant_count: Math.max(0, e.participant_count - 1) } : e
      );
      this.setItem(STORAGE_KEYS.EVENTS, events);
    }
    this.addDeletedIds([learnerId]);
    await this.sbDelete('learners', learnerId);
  }

  public async deleteLearners(learnerIds: string[], eventId?: string): Promise<void> {
    if (!learnerIds || learnerIds.length === 0) return;
    this.addDeletedIds(learnerIds);
    const idSet = new Set(learnerIds);
    const all = this.getLearners().filter(l => !idSet.has(l.id));
    this.setItem(STORAGE_KEYS.LEARNERS, all);

    if (eventId) {
      const remainingCount = all.filter(l => l.event_id === eventId).length;
      const events = this.getEvents().map(e =>
        e.id === eventId ? { ...e, participant_count: remainingCount } : e
      );
      this.setItem(STORAGE_KEYS.EVENTS, events);
    }

    if (supabase) {
      const { error } = await supabase.from('learners').delete().in('id', learnerIds);
      if (error) console.warn('[Supabase] bulk delete error:', error.message);
    }
  }

  public async clearAllLearners(eventId: string): Promise<void> {
    if (!eventId) return;
    const all = this.getLearners().filter(l => l.event_id !== eventId);
    this.setItem(STORAGE_KEYS.LEARNERS, all);

    const events = this.getEvents().map(e =>
      e.id === eventId ? { ...e, participant_count: 0 } : e
    );
    this.setItem(STORAGE_KEYS.EVENTS, events);

    if (supabase) {
      const { error } = await supabase.from('learners').delete().eq('event_id', eventId);
      if (error) console.warn('[Supabase] clear all learners error:', error.message);
    }
  }

  public async toggleCheckIn(learnerId: string, day: 1 | 2, session?: 'FN' | 'AN' | 'BOTH') {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    const targetLearner = all.find(l => l.id === learnerId);
    if (!targetLearner) return;

    const days = this.getEventDays(targetLearner.event_id);
    const hasAnyMainDay = days.some(d => d.main_day === 1 || d.main_day === 2);
    const targetDay = days.find(d => d.main_day === day) || (!hasAnyMainDay ? days.find(d => d.day_number === day || d.order_index === (day - 1)) : undefined);

    if (targetDay) {
      // Find existing DayAttendanceRecord
      const allAtt = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
      const existingRecord = allAtt.find(a => a.event_id === targetLearner.event_id && a.day_id === targetDay.id && a.student_id === learnerId);
      const { fn, an } = getRecordSessionStatuses(existingRecord);

      let nextStatus: DayAttendanceStatus = 'Present';
      let targetSession: 'FN' | 'AN' | undefined = undefined;

      if (session === 'FN') {
        targetSession = 'FN';
        nextStatus = fn === 'Present' ? 'Absent' : 'Present';
      } else if (session === 'AN') {
        targetSession = 'AN';
        nextStatus = an === 'Present' ? 'Absent' : 'Present';
      } else {
        // 'BOTH' or toggle whole day
        const isBothPresent = fn === 'Present' && an === 'Present';
        nextStatus = isBothPresent ? 'Absent' : 'Present';
        targetSession = undefined;
      }

      await this.setStudentDayAttendance(
        targetLearner.event_id,
        targetDay.id,
        targetLearner.id,
        nextStatus,
        'Check-in Terminal',
        'coordinator',
        targetSession
      );
    } else {
      // Fallback if no target day configured
      const nextDay1 = day === 1 ? !targetLearner.day1_checked_in : targetLearner.day1_checked_in;
      const nextDay2 = day === 2 ? !targetLearner.day2_checked_in : targetLearner.day2_checked_in;
      const updated = { ...targetLearner, day1_checked_in: nextDay1, day2_checked_in: nextDay2 };
      const updatedList = all.map(l => l.id === learnerId ? updated : l);
      this.setItem(STORAGE_KEYS.LEARNERS, updatedList);
      this.sbUpsert('learners', updated as unknown as Record<string, unknown>);
    }
  }

  public async checkInAll(eventId: string, day: 1 | 2, state: boolean, session?: 'FN' | 'AN') {
    const days = this.getEventDays(eventId);
    const hasAnyMainDay = days.some(d => d.main_day === 1 || d.main_day === 2);
    const targetDay = days.find(d => d.main_day === day) || (!hasAnyMainDay ? days.find(d => d.day_number === day || d.order_index === (day - 1)) : undefined);
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);

    if (targetDay) {
      const targetStudentIds = all.filter(l => l.event_id === eventId).map(l => l.id);
      await this.batchSetDayAttendance(eventId, targetDay.id, targetStudentIds, state ? 'Present' : 'Absent', 'Mass Action', session);
    } else {
      const updatedList = all.map(l => {
        if (l.event_id === eventId) {
          const updated = {
            ...l,
            day1_checked_in: day === 1 ? state : l.day1_checked_in,
            day2_checked_in: day === 2 ? state : l.day2_checked_in
          };
          this.sbUpsert('learners', updated as unknown as Record<string, unknown>);
          return updated;
        }
        return l;
      });
      this.setItem(STORAGE_KEYS.LEARNERS, updatedList);
    }
  }

  // ── EVENT DAYS & ACTIVITIES & ATTENDANCE ─────────────────────────────

  /**
   * Auto-initialization explicitly disabled — days must be created manually by Admin.
   */
  public initializeDefaultDaysForEvent(_eventId: string): EventDay[] {
    return [];
  }

  public getEventDays(eventId?: string): EventDay[] {
    const all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);
    if (!eventId) return all;

    const eventDays = all.filter(d => d.event_id === eventId && !d.is_archived);
    return [...eventDays].sort((a, b) => (a.order_index ?? a.day_number) - (b.order_index ?? b.day_number));
  }

  public getActiveEventDay(eventId: string): EventDay | undefined {
    const days = this.getEventDays(eventId);
    return days.find(d => d.status === 'Active') || days[0];
  }

  public async addEventDay(eventId: string, dayData: Partial<EventDay>): Promise<EventDay> {
    const days = this.getEventDays(eventId);
    const nextNumber = dayData.day_number || (days.length > 0 ? Math.max(...days.map(d => d.day_number)) + 1 : 1);

    // Enforce uniqueness of (event_id, day_number)
    if (days.some(d => d.day_number === nextNumber)) {
      throw new Error(`A day with Day Number ${nextNumber} already exists for this event.`);
    }

    const newDay: EventDay = {
      id: (dayData.id && isValidUuid(dayData.id)) ? dayData.id : genUuid(),
      event_id: eventId,
      day_number: nextNumber,
      name: dayData.name || `Day ${nextNumber}`,
      date: dayData.date || '',
      status: dayData.status || (days.length === 0 ? 'Active' : 'Upcoming'),
      activities: Array.isArray(dayData.activities) ? dayData.activities : [],
      order_index: dayData.order_index ?? days.length,
      main_day: dayData.main_day ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);

    // If new day has main_day mapping (1 or 2), unmap any existing day in this event with the same main_day
    if (newDay.main_day === 1 || newDay.main_day === 2) {
      all = all.map(d => {
        if (d.event_id === eventId && d.main_day === newDay.main_day) {
          return { ...d, main_day: null, updated_at: new Date().toISOString() };
        }
        return d;
      });
    }

    // If new day is marked Active, deactivate any other active days
    if (newDay.status === 'Active') {
      all = all.map(d => {
        if (d.event_id === eventId && d.status === 'Active') {
          return { ...d, status: 'Upcoming' as EventDayStatus, updated_at: new Date().toISOString() };
        }
        return d;
      });
    }

    all.push(newDay);
    this.setItem(STORAGE_KEYS.EVENT_DAYS, all);
    this.sbUpsert('event_days', newDay as unknown as Record<string, unknown>);
    this.persistEventDaysToSocialCoverage(eventId);
    return newDay;
  }

  public async updateEventDay(day: EventDay): Promise<EventDay> {
    const existing = this.getEventDays(day.event_id);
    if (existing.some(d => d.id !== day.id && d.day_number === day.day_number)) {
      throw new Error(`A day with Day Number ${day.day_number} already exists for this event.`);
    }

    let all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);
    const updatedDay: EventDay = {
      ...day,
      main_day: day.main_day ?? null,
      updated_at: new Date().toISOString()
    };

    all = all.map(d => {
      if (d.id === day.id) {
        return updatedDay;
      }
      // If this day has main_day mapping (1 or 2), unmap any other day in this event
      if ((updatedDay.main_day === 1 || updatedDay.main_day === 2) && d.event_id === day.event_id && d.main_day === updatedDay.main_day) {
        return { ...d, main_day: null, updated_at: new Date().toISOString() };
      }
      // If this day is being set to Active, change previously active day to Completed or Upcoming
      if (day.status === 'Active' && d.event_id === day.event_id && d.status === 'Active') {
        return {
          ...d,
          status: d.day_number < day.day_number ? 'Completed' : 'Upcoming',
          updated_at: new Date().toISOString()
        };
      }
      return d;
    });

    this.setItem(STORAGE_KEYS.EVENT_DAYS, all);
    this.sbUpsert('event_days', updatedDay as unknown as Record<string, unknown>);
    this.persistEventDaysToSocialCoverage(day.event_id);
    return updatedDay;
  }

  public async setActiveEventDay(eventId: string, dayId: string): Promise<void> {
    let all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);
    const target = all.find(d => d.id === dayId);
    if (!target) return;

    all = all.map(d => {
      if (d.event_id !== eventId) return d;
      if (d.id === dayId) {
        return { ...d, is_active: true, status: 'Active' as EventDayStatus, updated_at: new Date().toISOString() };
      }
      const wasActive = d.status === 'Active' || d.is_active;
      return {
        ...d,
        is_active: false,
        status: wasActive
          ? (((d.order_index ?? 0) < (target.order_index ?? 0) ? 'Completed' : 'Upcoming') as EventDayStatus)
          : d.status,
        updated_at: new Date().toISOString()
      };
    });

    this.setItem(STORAGE_KEYS.EVENT_DAYS, all);
    const updatedTarget = all.find(d => d.id === dayId);
    if (updatedTarget) {
      this.sbUpsert('event_days', updatedTarget as unknown as Record<string, unknown>);
    }
    this.persistEventDaysToSocialCoverage(eventId);
  }

  public hasAttendanceRecords(dayId: string): boolean {
    const all = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
    return all.some(a => a.day_id === dayId);
  }

  public async deleteEventDay(eventId: string, dayId: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    const attendanceRecords = this.getDayAttendance(eventId, dayId);
    if (attendanceRecords.length > 0 && !force) {
      return {
        success: false,
        error: `This day has ${attendanceRecords.length} recorded attendance records. Please confirm deletion to proceed.`
      };
    }

    const all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []).filter(d => d.id !== dayId);
    this.setItem(STORAGE_KEYS.EVENT_DAYS, all);

    if (force && attendanceRecords.length > 0) {
      const remainingAtt = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []).filter(a => a.day_id !== dayId);
      this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, remainingAtt);
      if (supabase) {
        supabase.from('event_day_attendance').delete().eq('day_id', dayId).then();
      }
    }

    await this.sbDelete('event_days', dayId);
    this.persistEventDaysToSocialCoverage(eventId);
    return { success: true };
  }

  public async reorderDayActivities(dayId: string, activities: string[]): Promise<EventDay | null> {
    const all = this.getItem<EventDay[]>(STORAGE_KEYS.EVENT_DAYS, []);
    const target = all.find(d => d.id === dayId);
    if (!target) return null;

    const updated: EventDay = {
      ...target,
      activities: [...activities],
      updated_at: new Date().toISOString()
    };

    const updatedList = all.map(d => d.id === dayId ? updated : d);
    this.setItem(STORAGE_KEYS.EVENT_DAYS, updatedList);
    this.sbUpsert('event_days', updated as unknown as Record<string, unknown>);
    this.persistEventDaysToSocialCoverage(target.event_id);
    return updated;
  }

  public getDayAttendance(eventId: string, dayId?: string): DayAttendanceRecord[] {
    const all = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
    return all.filter(a => a.event_id === eventId && (!dayId || a.day_id === dayId));
  }

  public async setStudentDayAttendance(
    eventId: string,
    dayId: string,
    studentId: string,
    status: DayAttendanceStatus,
    markedBy: string = 'Floor Volunteer',
    markedByRole: string = 'volunteer',
    session?: 'FN' | 'AN'
  ): Promise<DayAttendanceRecord> {
    const timestamp = new Date().toISOString();
    const all = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
    const existingIndex = all.findIndex(a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId);
    const existingLocal = existingIndex >= 0 ? all[existingIndex] : null;

    let targetDbId = existingLocal?.id;
    let remoteRecord: any = null;

    // 1. Check whether an attendance record already exists in Supabase
    if (supabase) {
      try {
        const { data: dbExisting, error: checkError } = await supabase
          .from('event_day_attendance')
          .select('*')
          .eq('event_id', eventId)
          .eq('day_id', dayId)
          .eq('student_id', studentId)
          .maybeSingle();

        if (!checkError && dbExisting) {
          remoteRecord = dbExisting;
          targetDbId = dbExisting.id;
        }
      } catch (checkEx) {
        console.warn('[StorageService] Pre-check for existing attendance record failed:', checkEx);
      }
    }

    const prior = existingLocal || remoteRecord;
    let nextFnStatus: DayAttendanceStatus;
    let nextAnStatus: DayAttendanceStatus;

    if (session === 'FN') {
      nextFnStatus = status;
      nextAnStatus = prior?.an_status ?? (prior?.status === 'Present' ? 'Present' : 'Absent');
    } else if (session === 'AN') {
      nextAnStatus = status;
      nextFnStatus = prior?.fn_status ?? (prior?.status === 'Present' ? 'Present' : 'Absent');
    } else {
      nextFnStatus = status;
      nextAnStatus = status;
    }

    const effectiveStatus: DayAttendanceStatus =
      (nextFnStatus === 'Present' || nextAnStatus === 'Present') ? 'Present' : 'Absent';

    let record: DayAttendanceRecord;

    if (remoteRecord || existingLocal) {
      // 2. Record exists -> UPDATE existing record
      const baseId = targetDbId || existingLocal?.id || genUuid();
      record = {
        ...(existingLocal || remoteRecord),
        id: baseId,
        event_id: eventId,
        day_id: dayId,
        student_id: studentId,
        learner_id: studentId,
        status: effectiveStatus,
        fn_status: nextFnStatus,
        an_status: nextAnStatus,
        marked_by: markedBy,
        marked_by_role: markedByRole,
        marked_at: timestamp,
        updated_at: timestamp
      };

      if (existingIndex >= 0) {
        all[existingIndex] = record;
      } else {
        all.push(record);
      }
      this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, all);

      if (supabase) {
        let updateSuccessful = false;

        // Try primary key ID update first
        if (targetDbId && isValidUuid(targetDbId)) {
          const { data: upData, error: upErr } = await supabase
            .from('event_day_attendance')
            .update({
              status: effectiveStatus,
              fn_status: nextFnStatus,
              an_status: nextAnStatus,
              marked_by: markedBy,
              marked_by_role: markedByRole,
              marked_at: timestamp,
              updated_at: timestamp
            })
            .eq('id', targetDbId)
            .select();

          if (!upErr && upData && upData.length > 0) {
            updateSuccessful = true;
            record.id = upData[0].id;
          }
        }

        // Fallback to composite key (event_id, day_id, student_id) update
        if (!updateSuccessful) {
          const { data: compData, error: compErr } = await supabase
            .from('event_day_attendance')
            .update({
              status: effectiveStatus,
              fn_status: nextFnStatus,
              an_status: nextAnStatus,
              marked_by: markedBy,
              marked_by_role: markedByRole,
              marked_at: timestamp,
              updated_at: timestamp
            })
            .eq('event_id', eventId)
            .eq('day_id', dayId)
            .eq('student_id', studentId)
            .select();

          if (!compErr && compData && compData.length > 0) {
            updateSuccessful = true;
            record.id = compData[0].id;
          } else {
            // Final fallback to sbUpsert
            const res = await this.sbUpsert('event_day_attendance', record as unknown as Record<string, unknown>);
            if (!res.success) {
              console.error('[StorageService] Failed to save attendance to Supabase:', res.error);
              throw new Error(res.error?.message || 'Failed to save attendance record to database');
            }
            if (res.data?.id) {
              record.id = res.data.id;
            }
          }
        }

        // Keep local storage synced with DB id
        const idx = all.findIndex(a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId);
        if (idx >= 0) {
          all[idx] = record;
          this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, all);
        }
      }
    } else {
      // 3. Record does not exist -> INSERT new record via UPSERT with graceful 409 recovery
      record = {
        id: genUuid(),
        event_id: eventId,
        day_id: dayId,
        student_id: studentId,
        learner_id: studentId,
        status: effectiveStatus,
        fn_status: nextFnStatus,
        an_status: nextAnStatus,
        marked_by: markedBy,
        marked_by_role: markedByRole,
        marked_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp
      };
      all.push(record);
      this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, all);

      if (supabase) {
        const res = await this.sbUpsert('event_day_attendance', record as unknown as Record<string, unknown>);
        if (!res.success) {
          const is409 = res.error?.code === '23505' ||
            res.error?.status === 409 ||
            String(res.error?.message || '').toLowerCase().includes('conflict') ||
            String(res.error?.message || '').toLowerCase().includes('duplicate');

          if (is409) {
            console.warn('[StorageService] 409 Conflict caught during attendance insert. Fetching existing record and updating...');
            const { data: conflictRow } = await supabase
              .from('event_day_attendance')
              .select('*')
              .eq('event_id', eventId)
              .eq('day_id', dayId)
              .eq('student_id', studentId)
              .maybeSingle();

            if (conflictRow) {
              const { data: resolvedData } = await supabase
                .from('event_day_attendance')
                .update({
                  status: effectiveStatus,
                  fn_status: nextFnStatus,
                  an_status: nextAnStatus,
                  marked_by: markedBy,
                  marked_by_role: markedByRole,
                  marked_at: timestamp,
                  updated_at: timestamp
                })
                .eq('id', conflictRow.id)
                .select();

              if (resolvedData && resolvedData.length > 0) {
                record = { ...record, id: conflictRow.id, status: effectiveStatus, fn_status: nextFnStatus, an_status: nextAnStatus };
                const idx = all.findIndex(a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId);
                if (idx >= 0) {
                  all[idx] = record;
                  this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, all);
                }
              }
            }
          } else {
            console.error('[StorageService] Failed to save attendance to Supabase:', res.error);
            throw new Error(res.error?.message || 'Failed to save attendance record to database');
          }
        } else if (res.data?.id) {
          record.id = res.data.id;
          const idx = all.findIndex(a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId);
          if (idx >= 0) {
            all[idx] = record;
            this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, all);
          }
        }
      }
    }

    // Two-way sync: strictly sync learner day1_checked_in/day2_checked_in if this day is mapped as Main Day 1 or Main Day 2
    const days = this.getEventDays(eventId);
    const currentDay = days.find(d => d.id === dayId);
    const isDay1 = Boolean(currentDay && currentDay.main_day === 1);
    const isDay2 = Boolean(currentDay && currentDay.main_day === 2);

    if (isDay1 || isDay2) {
      const isPresent = effectiveStatus === 'Present';
      const allLearners = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, []);
      let updatedLearner: Learner | null = null;
      const nextLearners = allLearners.map(l => {
        if (l.id === studentId) {
          updatedLearner = {
            ...l,
            day1_checked_in: isDay1 ? isPresent : l.day1_checked_in,
            day2_checked_in: isDay2 ? isPresent : l.day2_checked_in
          };
          return updatedLearner;
        }
        return l;
      });
      if (updatedLearner) {
        this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);
        this.sbUpsert('learners', updatedLearner as unknown as Record<string, unknown>);
      }
    }

    // Security audit log entry
    try {
      this.logAudit({
        event_id: eventId,
        action: 'ATTENDANCE_RECORDED' as any,
        actor_role: markedByRole,
        actor_name: markedBy,
        details: `Attendance marked ${effectiveStatus}${session ? ` (${session}: ${status})` : ''} for student ${studentId} on day ${dayId}`
      });
    } catch {
      // Non-blocking audit log
    }

    this.persistEventDaysToSocialCoverage(eventId);
    return record;
  }

  public async batchSetDayAttendance(
    eventId: string,
    dayId: string,
    studentIds: string[],
    status: DayAttendanceStatus,
    markedBy: string = 'Floor Volunteer',
    markedByRole: string = 'volunteer',
    session?: 'FN' | 'AN'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const all = this.getItem<DayAttendanceRecord[]>(STORAGE_KEYS.DAY_ATTENDANCE, []);
    const existingMap = new Map<string, DayAttendanceRecord>();
    all.forEach(a => existingMap.set(`${a.event_id}:::${a.day_id}:::${a.student_id}`, a));

    // Fetch existing records from Supabase if connected
    const remoteExistingMap = new Map<string, any>();
    if (supabase) {
      try {
        const { data: remoteRows, error: remoteErr } = await supabase
          .from('event_day_attendance')
          .select('*')
          .eq('event_id', eventId)
          .eq('day_id', dayId);

        if (!remoteErr && Array.isArray(remoteRows)) {
          remoteRows.forEach(r => remoteExistingMap.set(r.student_id, r));
        }
      } catch (fetchEx) {
        console.warn('[StorageService] Remote batch fetch failed:', fetchEx);
      }
    }

    const existingStudentIdsToUpdate: string[] = [];
    const newRecordsToInsert: DayAttendanceRecord[] = [];

    studentIds.forEach(stId => {
      const key = `${eventId}:::${dayId}:::${stId}`;
      const localExisting = existingMap.get(key);
      const remoteExisting = remoteExistingMap.get(stId);
      const prior = localExisting || remoteExisting;

      let nextFn: DayAttendanceStatus;
      let nextAn: DayAttendanceStatus;
      if (session === 'FN') {
        nextFn = status;
        nextAn = prior?.an_status ?? (prior?.status === 'Present' ? 'Present' : 'Absent');
      } else if (session === 'AN') {
        nextAn = status;
        nextFn = prior?.fn_status ?? (prior?.status === 'Present' ? 'Present' : 'Absent');
      } else {
        nextFn = status;
        nextAn = status;
      }
      const effectiveStatus: DayAttendanceStatus = (nextFn === 'Present' || nextAn === 'Present') ? 'Present' : 'Absent';

      if (prior) {
        existingStudentIdsToUpdate.push(stId);
        const updatedRec: DayAttendanceRecord = {
          ...prior,
          status: effectiveStatus,
          fn_status: nextFn,
          an_status: nextAn,
          marked_by: markedBy,
          marked_by_role: markedByRole,
          marked_at: timestamp,
          updated_at: timestamp
        };
        existingMap.set(key, updatedRec);
      } else {
        const rec: DayAttendanceRecord = {
          id: genUuid(),
          event_id: eventId,
          day_id: dayId,
          student_id: stId,
          learner_id: stId,
          status: effectiveStatus,
          fn_status: nextFn,
          an_status: nextAn,
          marked_by: markedBy,
          marked_by_role: markedByRole,
          marked_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp
        };
        existingMap.set(key, rec);
        newRecordsToInsert.push(rec);
      }
    });

    this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, Array.from(existingMap.values()));

    if (supabase) {
      // 1. Bulk UPDATE existing records by (event_id, day_id, in:student_id)
      if (existingStudentIdsToUpdate.length > 0) {
        const isPres = status === 'Present';
        const { error: updateBatchErr } = await supabase
          .from('event_day_attendance')
          .update({
            status: isPres ? 'Present' : 'Absent',
            marked_by: markedBy,
            marked_by_role: markedByRole,
            marked_at: timestamp,
            updated_at: timestamp
          })
          .eq('event_id', eventId)
          .eq('day_id', dayId)
          .in('student_id', existingStudentIdsToUpdate);

        if (updateBatchErr) {
          console.warn('[StorageService] Bulk update error on existing records, falling back to batch upsert:', updateBatchErr);
        }
      }

      // 2. Insert new records via batch upsert
      if (newRecordsToInsert.length > 0) {
        const res = await this.sbUpsertBatch('event_day_attendance', newRecordsToInsert as unknown as Record<string, unknown>[]);
        if (!res.success) {
          console.warn('[StorageService] New records batch upsert returned error, executing fallback update to resolve potential conflicts:', res.error);
          await supabase
            .from('event_day_attendance')
            .update({
              status: status === 'Present' ? 'Present' : 'Absent',
              marked_by: markedBy,
              marked_by_role: markedByRole,
              marked_at: timestamp,
              updated_at: timestamp
            })
            .eq('event_id', eventId)
            .eq('day_id', dayId)
            .in('student_id', newRecordsToInsert.map(r => r.student_id));
        }
      }

      // 3. Post-batch sync to capture all server IDs
      try {
        const { data: freshRows } = await supabase
          .from('event_day_attendance')
          .select('*')
          .eq('event_id', eventId)
          .eq('day_id', dayId);

        if (freshRows && Array.isArray(freshRows)) {
          freshRows.forEach(fr => {
            const k = `${fr.event_id}:::${fr.day_id}:::${fr.student_id}`;
            const localRec = existingMap.get(k);
            existingMap.set(k, {
              ...(fr as unknown as DayAttendanceRecord),
              fn_status: localRec?.fn_status,
              an_status: localRec?.an_status
            });
          });
          this.setItem(STORAGE_KEYS.DAY_ATTENDANCE, Array.from(existingMap.values()));
        }
      } catch (syncEx) {
        console.warn('[StorageService] Post-batch sync failed:', syncEx);
      }
    }
    // Two-way sync with learner records strictly if this day is mapped to Main Day 1 or Main Day 2
    const days = this.getEventDays(eventId);
    const currentDay = days.find(d => d.id === dayId);
    const isDay1 = Boolean(currentDay && currentDay.main_day === 1);
    const isDay2 = Boolean(currentDay && currentDay.main_day === 2);

    if (isDay1 || isDay2) {
      const studentIdSet = new Set(studentIds);
      const allLearners = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, []);
      const changedLearners: Learner[] = [];
      const nextLearners = allLearners.map(l => {
        if (studentIdSet.has(l.id)) {
          const rec = existingMap.get(`${eventId}:::${dayId}:::${l.id}`);
          const isPres = rec ? rec.status === 'Present' : (status === 'Present');
          const updated = {
            ...l,
            day1_checked_in: isDay1 ? isPres : l.day1_checked_in,
            day2_checked_in: isDay2 ? isPres : l.day2_checked_in
          };
          changedLearners.push(updated);
          return updated;
        }
        return l;
      });
      this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);
      if (changedLearners.length > 0) {
        this.sbUpsertBatch('learners', changedLearners as unknown as Record<string, unknown>[]);
      }
    }

    this.persistEventDaysToSocialCoverage(eventId);
  }

  public getEventAttendanceSummary(eventId: string): {
    day: EventDay;
    total: number;
    present: number;
    absent: number;
    percentage: number;
  }[] {
    const days = this.getEventDays(eventId);
    const learners = this.getLearners(eventId);
    const total = learners.length;
    const allAtt = this.getDayAttendance(eventId);

    return days.map(day => {
      const dayAtt = allAtt.filter(a => a.day_id === day.id);
      const present = dayAtt.filter(a => a.status === 'Present').length;
      const absent = Math.max(0, total - present);
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        day,
        total,
        present,
        absent,
        percentage
      };
    });
  }

  private persistEventDaysToSocialCoverage(eventId: string, daysOverride?: EventDay[], attOverride?: DayAttendanceRecord[]) {
    try {
      const events = this.getEvents();
      const targetEv = events.find(e => e.id === eventId);
      if (!targetEv) return;

      const days = daysOverride || this.getEventDays(eventId);
      const att = attOverride || this.getDayAttendance(eventId);

      const sc = (targetEv.social_coverage || {}) as any;
      sc.event_days = days;
      sc.day_attendance = att;
      targetEv.social_coverage = sc;

      this.setItem(STORAGE_KEYS.EVENTS, events);
      this.sbUpsert('college_events', targetEv as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Failed to mirror event days into social_coverage:', e);
    }
  }

  // ── PARTIES ───────────────────────────────────────────────────────────────

  public getParties(eventId?: string): Party[] {
    const all = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
    if (eventId) {
      return all.filter(p => p.event_id === eventId);
    }
    return all;
  }

  public async addParty(party: Partial<Party>): Promise<Party> {
    const all = this.getParties();
    const newParty: Party = {
      id: (party.id && isValidUuid(party.id)) ? party.id : genUuid(),
      event_id: party.event_id || '',
      name: party.name || 'Party Name',
      bench: party.bench || 'Ruling',
      color: party.color || '#059669',
      leader: party.leader || '',
      manifesto: party.manifesto || ''
    };
    all.push(newParty);
    this.removeDeletedId(newParty.id);
    this.setItem(STORAGE_KEYS.PARTIES, all);
    await this.sbUpsert('political_parties', newParty as unknown as Record<string, unknown>);
    return newParty;
  }

  public async updateParty(party: Party): Promise<void> {
    const existingParties = this.getParties();
    const oldParty = existingParties.find(p => p.id === party.id);
    const oldName = oldParty?.name;
    const targetEventId = party.event_id || oldParty?.event_id;

    const all = existingParties.map(p => (p.id === party.id ? party : p));
    this.setItem(STORAGE_KEYS.PARTIES, all);
    await this.sbUpsert('political_parties', party as unknown as Record<string, unknown>);

    // Cascade update strictly to learners of this event who belong to this party
    const allLearners = this.getLearners();
    let learnersChanged = false;
    const updatedLearners = allLearners.map(l => {
      if ((!targetEventId || l.event_id === targetEventId) && (l.party_id === party.id || (oldName && l.party_name === oldName))) {
        learnersChanged = true;
        return {
          ...l,
          party_id: party.id,
          party_name: party.name,
          bench: party.bench
        };
      }
      return l;
    });

    if (learnersChanged) {
      this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
      const learnersToUpdate = updatedLearners.filter(l => (!targetEventId || l.event_id === targetEventId) && (l.party_id === party.id || (oldName && l.party_name === oldName)));
      if (learnersToUpdate.length > 0) {
        await this.sbUpsertBatch('learners', learnersToUpdate as unknown as Record<string, unknown>[]);
      }
    }

    // Cascade update to nominations strictly within targetEventId
    if (oldName && oldName !== party.name) {
      const allNoms = this.getNominationAll();
      const updatedNoms = allNoms.map(n => {
        if ((!targetEventId || n.event_id === targetEventId) && n.party_name === oldName) {
          return { ...n, party_name: party.name, bench: party.bench };
        }
        return n;
      });
      this.setItem(STORAGE_KEYS.NOMINATIONS, updatedNoms);

      // Cascade update to election candidates strictly within targetEventId
      const allElecs = this.getElectionAll();
      const updatedElecs = allElecs.map(e => {
        if (targetEventId && e.event_id !== targetEventId) return e;
        return {
          ...e,
          candidates: e.candidates.map(c => {
            if (c.party === oldName) {
              return { ...c, party: party.name, bench: party.bench };
            }
            return c;
          })
        };
      });
      this.setItem(STORAGE_KEYS.ELECTIONS, updatedElecs);

      // Cascade update to score records strictly within targetEventId
      const allScores = this.getScores();
      const updatedScores = allScores.map(s => {
        if ((!targetEventId || s.event_id === targetEventId) && s.party_name === oldName) {
          return { ...s, party_name: party.name, bench: party.bench };
        }
        return s;
      });
      this.setItem(STORAGE_KEYS.SCORES, updatedScores);
    }

    this.notify();
  }

  public async setPartyBench(partyId: string, bench: 'Ruling' | 'Opposition' | 'Independent', eventId?: string): Promise<void> {
    const allParties = this.getParties();
    const targetParty = allParties.find(p => p.id === partyId && (!eventId || p.event_id === eventId)) || allParties.find(p => p.id === partyId);
    if (!targetParty) {
      console.warn(`[storageService.setPartyBench] Party ${partyId} not found`);
      return;
    }
    const resolvedEventId = eventId || targetParty.event_id;

    const updatedParties = allParties.map(p => {
      if (p.id === partyId && (!resolvedEventId || p.event_id === resolvedEventId)) {
        return { ...p, bench };
      }
      return p;
    });
    this.setItem(STORAGE_KEYS.PARTIES, updatedParties);
    await this.sbUpsert('political_parties', { ...targetParty, bench } as unknown as Record<string, unknown>);

    // Automatically update learners belonging to this party STRICTLY within this event
    const allLearners = this.getLearners();
    const updatedLearners = allLearners.map(l => {
      if ((!resolvedEventId || l.event_id === resolvedEventId) && (l.party_id === partyId || l.party_name === targetParty.name)) {
        return { ...l, bench };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);

    // Sync updated learners to Supabase ONLY for this event
    const learnersToUpdate = updatedLearners.filter(l => (!resolvedEventId || l.event_id === resolvedEventId) && (l.party_id === partyId || l.party_name === targetParty.name));
    if (learnersToUpdate.length > 0) {
      await this.sbUpsertBatch('learners', learnersToUpdate as unknown as Record<string, unknown>[]);
    }
    this.notify();
  }

  public async setPartyCount(eventId: string, targetCount: number): Promise<Party[]> {
    const validCount = Math.max(1, Math.min(20, targetCount));
    const all = this.getParties();
    const eventParties = all.filter(p => p.event_id === eventId);
    const otherParties = all.filter(p => p.event_id !== eventId);

    const updatedEventParties: Party[] = [];
    const colors = ['#059669', '#dc2626', '#2563eb', '#d97706', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5'];

    const newPartiesToInsert: Party[] = [];
    for (let i = 0; i < validCount; i++) {
      if (i < eventParties.length) {
        const existing = eventParties[i];
        let bench = existing.bench;
        if (i === 0 && bench === 'Independent') bench = 'Ruling';
        else if (i === 1 && bench === 'Independent') bench = 'Opposition';
        updatedEventParties.push({
          ...existing,
          event_id: eventId,
          bench
        });
      } else {
        let bench: BenchType = 'Independent';
        if (i === 0) bench = 'Ruling';
        else if (i === 1) bench = 'Opposition';
        const newParty: Party = {
          id: genUuid(),
          event_id: eventId,
          name: `Party ${i + 1}`,
          bench,
          color: colors[i % colors.length],
          leader: '',
          manifesto: ''
        };
        updatedEventParties.push(newParty);
        newPartiesToInsert.push(newParty);
      }
    }

    if (newPartiesToInsert.length > 0) {
      const res = await this.sbUpsertBatch('political_parties', newPartiesToInsert as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase setPartyCount Error]:', res.error);
        throw new Error(`Failed to save parties to database: ${res.error?.message || 'Database error'}`);
      }
    }

    if (validCount < eventParties.length) {
      const removed = eventParties.slice(validCount);
      const removedIds = new Set(removed.map(r => r.id));
      const removedNames = new Set(removed.map(r => r.name));
      this.addDeletedIds(Array.from(removedIds));
      await Promise.all(removed.map(r => this.sbDelete('political_parties', r.id)));

      const allLearners = this.getLearners();
      let learnersChanged = false;
      const changedLearners: Learner[] = [];
      const updatedLearners = allLearners.map(l => {
        if (l.event_id === eventId && ((l.party_id && removedIds.has(l.party_id)) || (l.party_name && removedNames.has(l.party_name)))) {
          learnersChanged = true;
          const mod = {
            ...l,
            party_id: undefined,
            party_name: undefined,
            bench: undefined
          };
          changedLearners.push(mod);
          return mod;
        }
        return l;
      });
      if (learnersChanged) {
        this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
        if (changedLearners.length > 0) {
          await this.sbUpsertBatch('learners', changedLearners as unknown as Record<string, unknown>[]);
        }
      }
    }

    const merged = [...otherParties, ...updatedEventParties];
    this.setItem(STORAGE_KEYS.PARTIES, merged);
    this.notify();
    return updatedEventParties;
  }

  public async deleteParty(partyId: string): Promise<void> {
    const targetParty = this.getParties().find(p => p.id === partyId);
    const targetEventId = targetParty?.event_id;
    this.addDeletedIds([partyId]);
    this.setItem(STORAGE_KEYS.PARTIES, this.getParties().filter(p => p.id !== partyId));
    await this.sbDelete('political_parties', partyId);

    // Unassign learners from deleted party strictly within this event
    const allLearners = this.getLearners();
    const changedLearners: Learner[] = [];
    const updatedLearners = allLearners.map(l => {
      if ((!targetEventId || l.event_id === targetEventId) && (l.party_id === partyId || (targetParty && l.party_name === targetParty.name))) {
        const mod = {
          ...l,
          party_id: undefined,
          party_name: undefined,
          bench: undefined
        };
        changedLearners.push(mod);
        return mod;
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
    if (changedLearners.length > 0) {
      await this.sbUpsertBatch('learners', changedLearners as unknown as Record<string, unknown>[]);
    }
    this.notify();
  }

  // ── COMMITTEES ────────────────────────────────────────────────────────────

  public getCommittees(eventId?: string): Committee[] {
    const all = this.getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    if (eventId) {
      return all.filter(c => c.event_id === eventId);
    }
    return all;
  }

  public async setCommitteeCount(eventId: string, targetCount: number): Promise<Committee[]> {
    const validCount = Math.max(1, Math.min(20, targetCount));
    const all = this.getCommittees();
    const eventComms = all.filter(c => c.event_id === eventId);
    const otherComms = all.filter(c => c.event_id !== eventId);

    const defaultTopics = [
      "Public Accounts & Financial Estimates",
      "Higher Education, Curriculum & AI Ethics",
      "Public Health, Infrastructure & Sanitation",
      "Agriculture, Farmers Welfare & Water Resources",
      "Industries, IT & Digital Governance",
      "Environment, Climate Action & Renewable Energy",
      "Social Justice, Youth Affairs & Sports",
      "Rural Development & Local Administration"
    ];

    const updatedEventComms: Committee[] = [];
    const newCommsToInsert: Committee[] = [];
    for (let i = 0; i < validCount; i++) {
      if (i < eventComms.length) {
        updatedEventComms.push({
          ...eventComms[i],
          event_id: eventId
        });
      } else {
        const topicName = defaultTopics[i % defaultTopics.length];
        const newComm: Committee = {
          id: genUuid(),
          event_id: eventId,
          name: `Committee ${i + 1} - ${topicName}`,
          topic: topicName,
          chairperson: '',
          max_capacity: 50
        };
        updatedEventComms.push(newComm);
        this.removeDeletedId(newComm.id);
        newCommsToInsert.push(newComm);
      }
    }

    if (newCommsToInsert.length > 0) {
      const res = await this.sbUpsertBatch('committees', newCommsToInsert as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase setCommitteeCount Error]:', res.error);
        throw new Error(`Failed to save committees to database: ${res.error?.message || 'Database error'}`);
      }
    }

    if (validCount < eventComms.length) {
      const removed = eventComms.slice(validCount);
      const removedIds = new Set(removed.map(r => r.id));
      const removedNames = new Set(removed.map(r => r.name));
      this.addDeletedIds(Array.from(removedIds));
      await Promise.all(removed.map(r => this.sbDelete('committees', r.id)));

      const allLearners = this.getLearners();
      let learnersChanged = false;
      const changedLearners: Learner[] = [];
      const updatedLearners = allLearners.map(l => {
        if (l.event_id === eventId && ((l.committee_id && removedIds.has(l.committee_id)) || (l.committee_name && removedNames.has(l.committee_name)))) {
          learnersChanged = true;
          const mod = {
            ...l,
            committee_id: undefined,
            committee_name: undefined
          };
          changedLearners.push(mod);
          return mod;
        }
        return l;
      });
      if (learnersChanged) {
        this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
        if (changedLearners.length > 0) {
          await this.sbUpsertBatch('learners', changedLearners as unknown as Record<string, unknown>[]);
        }
      }
    }

    const merged = [...otherComms, ...updatedEventComms];
    this.setItem(STORAGE_KEYS.COMMITTEES, merged);
    this.notify();
    return updatedEventComms;
  }

  public async addCommittee(committee: Partial<Committee>): Promise<Committee> {
    const all = this.getCommittees();
    const newComm: Committee = {
      id: (committee.id && isValidUuid(committee.id)) ? committee.id : genUuid(),
      event_id: committee.event_id || '',
      name: committee.name || 'Committee Name',
      topic: committee.topic || 'General Assembly Topic',
      chairperson: committee.chairperson || '',
      max_capacity: committee.max_capacity || 50
    };
    if (supabase) {
      const res = await this.sbUpsert('committees', newComm as unknown as Record<string, unknown>);
      if (!res.success) {
        console.error('❌ [Supabase addCommittee Error]:', res.error);
        throw new Error(`Failed to save committee to database: ${res.error?.message || 'Database error'}`);
      }
    }
    all.push(newComm);
    this.removeDeletedId(newComm.id);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    this.notify();
    return newComm;
  }

  public async updateCommittee(com: Committee): Promise<void> {
    const existingComms = this.getCommittees();
    const oldCom = existingComms.find(c => c.id === com.id);
    const oldName = oldCom?.name;
    const targetEventId = com.event_id || oldCom?.event_id;

    const all = existingComms.map(c => (c.id === com.id ? com : c));
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    await this.sbUpsert('committees', com as unknown as Record<string, unknown>);

    // Cascade update to all learners belonging to this committee strictly within targetEventId
    const allLearners = this.getLearners();
    let learnersChanged = false;
    const updatedLearners = allLearners.map(l => {
      if ((!targetEventId || l.event_id === targetEventId) && (l.committee_id === com.id || (oldName && l.committee_name === oldName))) {
        learnersChanged = true;
        return {
          ...l,
          committee_id: com.id,
          committee_name: com.name
        };
      }
      return l;
    });

    if (learnersChanged) {
      this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
      const learnersToUpdate = updatedLearners.filter(l => (!targetEventId || l.event_id === targetEventId) && (l.committee_id === com.id || (oldName && l.committee_name === oldName)));
      if (learnersToUpdate.length > 0) {
        await this.sbUpsertBatch('learners', learnersToUpdate as unknown as Record<string, unknown>[]);
      }
    }
    this.notify();
  }

  public async deleteCommittee(comId: string): Promise<void> {
    const targetCom = this.getCommittees().find(c => c.id === comId);
    const targetEventId = targetCom?.event_id;
    this.addDeletedIds([comId]);
    this.setItem(STORAGE_KEYS.COMMITTEES, this.getCommittees().filter(c => c.id !== comId));
    await this.sbDelete('committees', comId);

    // Unassign learners from deleted committee strictly within targetEventId
    const allLearners = this.getLearners();
    const changedLearners: Learner[] = [];
    const updatedLearners = allLearners.map(l => {
      if ((!targetEventId || l.event_id === targetEventId) && (l.committee_id === comId || (targetCom && l.committee_name === targetCom.name))) {
        const mod = {
          ...l,
          committee_id: undefined,
          committee_name: undefined
        };
        changedLearners.push(mod);
        return mod;
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, updatedLearners);
    if (changedLearners.length > 0) {
      await this.sbUpsertBatch('learners', changedLearners as unknown as Record<string, unknown>[]);
    }
    this.notify();
  }

  // ── AGENDA ────────────────────────────────────────────────────────────────

  public getAgenda(eventId?: string): AgendaItem[] {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    if (eventId) {
      const eventItems = all.filter(a => a.event_id === eventId);
      // Auto-seed default fresh agenda if no items exist yet or less than 2 items exist for this event
      if (eventItems.length < 2) {
        return this.resetEventAgendaToDefault(eventId);
      }
      return [...eventItems].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }
    return [...all].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  public resetEventAgendaToDefault(eventId: string): AgendaItem[] {
    if (!eventId) return [];
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const remaining = all.filter(a => a.event_id !== eventId);
    this.setItem(STORAGE_KEYS.AGENDA, remaining);
    return this.seedDefaultAgendaForEvent(eventId);
  }

  public seedDefaultAgendaForEvent(eventId: string): AgendaItem[] {
    const defaultItems: Partial<AgendaItem>[] = [
      // Pre-Event
      { day: 'Pre-Event', title: 'Registration Opens', date: '15 Jun 2026', time: '09:00 AM', duration_minutes: 30, category: 'General', description: 'Participant access codes check-in & kit distribution', speaker_role: 'Registration Desk', order: 1 },
      { day: 'Pre-Event', title: 'Delegate Seating', date: '15 Jun 2026', time: '09:30 AM', duration_minutes: 15, category: 'General', description: 'Seating of Ruling, Opposition & Independent members', speaker_role: 'Floor Marshals', order: 2 },
      { day: 'Pre-Event', title: 'National Anthem', date: '15 Jun 2026', time: '09:45 AM', duration_minutes: 5, category: 'Ceremony', description: 'Assembly inauguration national anthem', speaker_role: 'All Delegates', order: 3 },
      { day: 'Pre-Event', title: 'Welcome Address', date: '15 Jun 2026', time: '09:50 AM', duration_minutes: 15, category: 'Ceremony', description: 'Opening speech by Youth Legislative Secretariat', speaker_role: 'Convenor', order: 4 },
      { day: 'Pre-Event', title: 'Chief Guest Address', date: '15 Jun 2026', time: '10:05 AM', duration_minutes: 25, category: 'Ceremony', description: 'Keynote address by Chief Guest & Dignitaries', speaker_role: 'Chief Guest', order: 5 },
      { day: 'Pre-Event', title: 'Event Overview & Instructions', date: '15 Jun 2026', time: '10:30 AM', duration_minutes: 15, category: 'General', description: 'Briefing on Parliamentary procedures & Rules of Conduct', speaker_role: 'Assembly Secretary', order: 6 },
      { day: 'Pre-Event', title: 'Seating of Speaker', date: '15 Jun 2026', time: '10:45 AM', duration_minutes: 10, category: 'Ceremony', description: 'Pro-tem Speaker assumes the Chair', speaker_role: 'Pro-tem Speaker', order: 7 },
      { day: 'Pre-Event', title: 'Oath Taking Ceremony', date: '15 Jun 2026', time: '10:55 AM', duration_minutes: 20, category: 'Oath Taking', description: 'Swearing-in of all elected MLAs & Delegates', speaker_role: 'Pro-tem Speaker', order: 8 },
      { day: 'Pre-Event', title: 'Government & Opposition Formation', date: '15 Jun 2026', time: '11:15 AM', duration_minutes: 30, category: 'Party Formation', description: 'Announcement of Treasury & Opposition Benches', speaker_role: 'Party Leaders', order: 9 },
      { day: 'Pre-Event', title: 'Discussion on Matters of Urgent Public Importance', date: '15 Jun 2026', time: '11:45 AM', duration_minutes: 45, category: 'General', description: 'Initial public interest motions debate', speaker_role: 'Floor Members', order: 10 },
      { day: 'Pre-Event', title: 'Lunch Break', date: '15 Jun 2026', time: '12:30 PM', duration_minutes: 45, category: 'Break', description: 'Networking & Lunch in Main Dining Hall', speaker_role: 'All Delegates', order: 11 },
      { day: 'Pre-Event', title: 'Committee Discussions', date: '15 Jun 2026', time: '01:15 PM', duration_minutes: 60, category: 'Committee Discussion', description: 'Departmental standing committee sessions', speaker_role: 'Committee Chairs', order: 12 },
      { day: 'Pre-Event', title: 'Instructions for Day 1', date: '15 Jun 2026', time: '02:15 PM', duration_minutes: 15, category: 'General', description: 'Announcements and schedule for Day 1 Legislative Session', speaker_role: 'Secretariat', order: 13 },

      // Day 1
      { day: 'Day 1', title: 'Registration Opens', date: '16 Jun 2026', time: '09:00 AM', duration_minutes: 30, category: 'General', description: 'Day 1 delegate arrival and check-in verification', speaker_role: 'Registration Desk', order: 1 },
      { day: 'Day 1', title: 'Delegates Seated', date: '16 Jun 2026', time: '09:30 AM', duration_minutes: 10, category: 'Inaugural', description: 'Delegates seated according to bench allocations', speaker_role: 'Marshals', order: 2 },
      { day: 'Day 1', title: 'National Anthem', date: '16 Jun 2026', time: '09:40 AM', duration_minutes: 5, category: 'Inaugural', description: 'Assembly commencement national anthem', speaker_role: 'All Delegates', order: 3 },
      { day: 'Day 1', title: 'Welcome Address', date: '16 Jun 2026', time: '09:45 AM', duration_minutes: 10, category: 'Inaugural', description: 'Welcome speech by Hon. Speaker', speaker_role: 'Speaker of House', order: 4 },
      { day: 'Day 1', title: 'Chief Guest Address', date: '16 Jun 2026', time: '09:55 AM', duration_minutes: 20, category: 'Inaugural', description: 'Special address by Chief Guest', speaker_role: 'Chief Guest', order: 5 },
      { day: 'Day 1', title: 'Speaker Election', date: '16 Jun 2026', time: '10:15 AM', duration_minutes: 30, category: 'Speaker Election', description: 'Nomination and voting for Assembly Speaker', speaker_role: 'Pro-tem Speaker', order: 6 },
      { day: 'Day 1', title: 'Government & Opposition Formation', date: '16 Jun 2026', time: '10:45 AM', duration_minutes: 30, category: 'Party Formation', description: 'Official designation of CM, Leader of Opposition & Cabinet', speaker_role: 'House Speaker', order: 7 },
      { day: 'Day 1', title: 'Discussion on Matters of Urgent Public Importance', date: '16 Jun 2026', time: '11:15 AM', duration_minutes: 90, category: 'Opening Speech', description: 'Debate on pressing state governance & socio-economic issues', speaker_role: 'Floor Members', order: 8 },
      { day: 'Day 1', title: 'Lunch Break', date: '16 Jun 2026', time: '12:45 PM', duration_minutes: 45, category: 'Break', description: 'Delegate lunch & informal consultations', speaker_role: 'All Delegates', order: 9 },
      { day: 'Day 1', title: 'Committee Discussions (Bill Drafting)', date: '16 Jun 2026', time: '01:30 PM', duration_minutes: 60, category: 'Committee Discussion', description: 'Committee rooms convene to draft legislative bills', speaker_role: 'Committee Chairs', order: 10 },
      { day: 'Day 1', title: 'Instructions for Day 2', date: '16 Jun 2026', time: '02:30 PM', duration_minutes: 15, category: 'Inaugural', description: 'End of Day 1 instructions and docket distribution', speaker_role: 'Secretariat', order: 11 },

      // Day 2
      { day: 'Day 2', title: 'Question Hour', date: '17 Jun 2026', time: '09:30 AM', duration_minutes: 60, category: 'Question Hour', description: 'Opposition interpellation & Cabinet Ministers oral answers', speaker_role: 'Hon. Speaker & Ministers', order: 1 },
      { day: 'Day 2', title: 'Zero Hour', date: '17 Jun 2026', time: '10:30 AM', duration_minutes: 60, category: 'Zero Hour', description: 'Unscripted raise of urgent public concerns by MLAs', speaker_role: 'Elected Members', order: 2 },
      { day: 'Day 2', title: 'Lunch Break', date: '17 Jun 2026', time: '11:30 AM', duration_minutes: 45, category: 'Break', description: 'Delegate lunch break', speaker_role: 'All Delegates', order: 3 },
      { day: 'Day 2', title: 'Bill Presentation & Voting', date: '17 Jun 2026', time: '12:15 PM', duration_minutes: 105, category: 'Bill Presentation', description: 'Tabling of official Assembly Bills, floor debate & division voting', speaker_role: 'Sponsoring Ministers', order: 4 },
      { day: 'Day 2', title: 'Closing Statements & Adjournment', date: '17 Jun 2026', time: '02:00 PM', duration_minutes: 15, category: 'Valedictory', description: 'Closing speeches by CM and Leader of Opposition', speaker_role: 'Party Leaders', order: 5 },
      { day: 'Day 2', title: 'Valedictory: Chief Guest Address', date: '17 Jun 2026', time: '02:15 PM', duration_minutes: 20, category: 'Valedictory', description: 'Valedictory keynote speech', speaker_role: 'Chief Guest', order: 6 },
      { day: 'Day 2', title: 'Declaration of Awards', date: '17 Jun 2026', time: '02:35 PM', duration_minutes: 15, category: 'Valedictory', description: 'Best Parliamentarian & Best Speaker awards ceremony', speaker_role: 'Jury Panel', order: 7 },
      { day: 'Day 2', title: 'Felicitation Ceremony', date: '17 Jun 2026', time: '02:50 PM', duration_minutes: 10, category: 'Valedictory', description: 'Felicitation of coordinators, volunteers & jury', speaker_role: 'Organizing Committee', order: 8 },
      { day: 'Day 2', title: 'National Anthem', date: '17 Jun 2026', time: '03:00 PM', duration_minutes: 5, category: 'Valedictory', description: 'Assembly formal adjournment national anthem', speaker_role: 'All Delegates', order: 9 }
    ];

    const createdItems: AgendaItem[] = defaultItems.map(item => {
      const duration = item.duration_minutes || 30;
      return {
        id: uid('agd'),
        event_id: eventId,
        day: item.day || 'Day 1',
        date: item.date || '15 Jun 2026',
        time: item.time || '09:00 AM',
        duration_minutes: duration,
        endTime: this.calculateEndTime(item.time || '09:00 AM', duration),
        title: item.title || 'Agenda Item',
        description: item.description || '',
        category: item.category || 'General',
        status: 'Upcoming', // Fresh event items MUST start in Upcoming state
        order: item.order || 1,
        enabled: true,
        speaker_role: item.speaker_role || '',
        is_current: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const merged = [...all.filter(a => a.event_id !== eventId), ...createdItems];
    this.setItem(STORAGE_KEYS.AGENDA, merged);

    // Sync default items to Supabase
    if (supabase && createdItems.length > 0) {
      const sanitized = createdItems.map(item => this.sanitizeRecordForTable('session_agenda', item as unknown as Record<string, unknown>));
      supabase.from('session_agenda').upsert(sanitized, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('[Supabase] default agenda seed error:', error.message);
      });
    }

    return createdItems;
  }

  public calculateEndTime(startTimeStr: string, durationMinutes: number): string {
    try {
      let clean = (startTimeStr || '09:00 AM').trim().toUpperCase();
      let isPM = clean.includes('PM');
      let isAM = clean.includes('AM');
      let timeParts = clean.replace(/(AM|PM)/g, '').trim().split(':');
      let hours = parseInt(timeParts[0], 10) || 9;
      let minutes = parseInt(timeParts[1], 10) || 0;

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      let totalMins = hours * 60 + minutes + (durationMinutes || 30);
      let endHours = Math.floor(totalMins / 60) % 24;
      let endMins = totalMins % 60;

      let endPeriod = endHours >= 12 ? 'PM' : 'AM';
      let displayHours = endHours % 12;
      if (displayHours === 0) displayHours = 12;

      let strHours = String(displayHours).padStart(2, '0');
      let strMins = String(endMins).padStart(2, '0');

      return `${strHours}:${strMins} ${endPeriod}`;
    } catch {
      return startTimeStr;
    }
  }

  public addAgendaItem(item: Partial<AgendaItem>): AgendaItem {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const eventId = item.event_id || '';
    const day = item.day || 'Day 1';

    const dayItems = all.filter(a => a.event_id === eventId && a.day === day);
    const nextOrder = dayItems.length > 0 ? Math.max(...dayItems.map(i => i.order || 0)) + 1 : 1;

    const duration = item.duration_minutes || 30;
    const startTime = item.time || '09:00 AM';
    const computedEndTime = item.endTime || this.calculateEndTime(startTime, duration);

    const newItem: AgendaItem = {
      id: uid('agd'),
      event_id: eventId,
      day: day,
      date: item.date || (day === 'Pre-Event' ? '15 Jun 2026' : day === 'Day 1' ? '16 Jun 2026' : '17 Jun 2026'),
      time: startTime,
      duration_minutes: duration,
      endTime: computedEndTime,
      title: item.title || 'New Agenda Item',
      description: item.description || '',
      category: item.category || 'General',
      status: item.status || 'Upcoming',
      order: item.order ?? nextOrder,
      enabled: item.enabled ?? true,
      speaker_role: item.speaker_role || '',
      is_current: !!item.is_current,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    all.push(newItem);
    this.setItem(STORAGE_KEYS.AGENDA, all);
    this.sbUpsert('session_agenda', newItem as unknown as Record<string, unknown>);
    this.notify();
    return newItem;
  }

  public updateAgendaItem(item: AgendaItem): AgendaItem {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const duration = item.duration_minutes || 30;
    const computedEndTime = item.endTime || this.calculateEndTime(item.time, duration);

    const updatedItem: AgendaItem = {
      ...item,
      duration_minutes: duration,
      endTime: computedEndTime,
      updated_at: new Date().toISOString()
    };

    const updated = all.map(a => (a.id === item.id ? updatedItem : a));
    this.setItem(STORAGE_KEYS.AGENDA, updated);
    this.sbUpsert('session_agenda', updatedItem as unknown as Record<string, unknown>);
    this.notify();
    return updatedItem;
  }

  public deleteAgendaItem(itemId: string) {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const filtered = all.filter(a => a.id !== itemId);
    this.setItem(STORAGE_KEYS.AGENDA, filtered);
    this.sbDelete('session_agenda', itemId);
    this.notify();
  }

  public duplicateAgendaItem(itemId: string): AgendaItem | null {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const target = all.find(a => a.id === itemId);
    if (!target) return null;

    const copyItem: Partial<AgendaItem> = {
      ...target,
      id: undefined,
      title: `${target.title} (Copy)`,
      order: (target.order || 1) + 1,
      status: 'Upcoming',
      is_current: false
    };

    return this.addAgendaItem(copyItem);
  }

  public toggleEnableAgendaItem(itemId: string) {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    let target: AgendaItem | undefined;
    const updated = all.map(a => {
      if (a.id === itemId) {
        target = { ...a, enabled: !(a.enabled ?? true), updated_at: new Date().toISOString() };
        return target;
      }
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, updated);
    if (target) {
      this.sbUpsert('session_agenda', target as unknown as Record<string, unknown>);
    }
    this.notify();
  }

  public setAgendaItemStatus(itemId: string, status: AgendaStatus) {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    let target: AgendaItem | undefined;
    const updated = all.map(a => {
      if (a.id === itemId) {
        target = {
          ...a,
          status,
          is_current: status === 'In Progress',
          updated_at: new Date().toISOString()
        };
        return target;
      }
      // If marking status as In Progress, clear is_current on other items for this event
      if (status === 'In Progress' && a.event_id === target?.event_id) {
        return { ...a, is_current: false };
      }
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, updated);
    if (target) {
      this.sbUpsert('session_agenda', target as unknown as Record<string, unknown>);
    }
    this.notify();
  }

  public reorderAgendaItems(eventId: string, day: AgendaDay, orderedIds: string[]) {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    const idOrderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => idOrderMap.set(id, idx + 1));

    const updated = all.map(a => {
      if (a.event_id === eventId && a.day === day && idOrderMap.has(a.id)) {
        const newOrder = idOrderMap.get(a.id)!;
        const itemWithOrder = { ...a, order: newOrder, updated_at: new Date().toISOString() };
        this.sbUpsert('session_agenda', itemWithOrder as unknown as Record<string, unknown>);
        return itemWithOrder;
      }
      return a;
    });

    this.setItem(STORAGE_KEYS.AGENDA, updated);
    this.notify();
  }

  public setCurrentAgendaItem(eventId: string, itemId: string) {
    const all = this.getAgenda().map(a => {
      if (a.event_id === eventId) {
        const wasCurrent = a.is_current;
        const isCurrent = a.id === itemId;
        const itemStatus: AgendaStatus = isCurrent ? 'In Progress' : (wasCurrent ? 'Completed' : a.status || 'Upcoming');
        const updated = { ...a, is_current: isCurrent, status: itemStatus, updated_at: new Date().toISOString() };
        if (isCurrent || wasCurrent) {
          this.sbUpsert('session_agenda', updated as unknown as Record<string, unknown>);
        }
        return updated;
      }
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, all);
    this.notify();
  }

  // ── JURY ──────────────────────────────────────────────────────────────────

  public getJury(eventId?: string): JuryMember[] {
    const all = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, INITIAL_JURY);
    let updated = false;
    const sanitized = all.map((j, idx) => {
      let code = j.access_code || '';
      if (!code || code.trim() === '' || code.includes('JURY-')) {
        updated = true;
        const codeNum = String(idx + 1).padStart(2, '0');
        code = code.replace('JURY-', 'JURY');
        if (!code || code.trim() === '') code = `JURY${codeNum}`;
        return {
          ...j,
          access_code: code
        };
      }
      return j;
    });

    if (updated) {
      this.setItem(STORAGE_KEYS.JURY, sanitized);
    }
    if (eventId) return sanitized.filter(j => j.event_id === eventId);
    return sanitized;
  }

  private generateSecureJuryCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'JURY';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async addJuryMember(member: Partial<JuryMember>): Promise<JuryMember> {
    const all = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, INITIAL_JURY);
    const defaultCode = this.generateSecureJuryCode();
    const realId = (member.id && isValidUuid(member.id)) ? member.id : genUuid();
    const newMember: JuryMember = {
      id: realId,
      event_id: member.event_id || '',
      access_code: (member.access_code || defaultCode).replace('JURY-', 'JURY'),
      name: member.name || 'Jury Member',
      email: member.email || '',
      phone: member.phone || '',
      designation: member.designation || 'Parliamentary Juror',
      assigned_bench: member.assigned_bench || 'Ruling',
      status: member.status || 'Active'
    };
    if (supabase) {
      const res = await this.sbUpsert('jury_members', newMember as unknown as Record<string, unknown>);
      if (!res.success) {
        console.error('❌ [Supabase addJuryMember Error]:', res.error);
        throw new Error(`Failed to save jury member to database: ${res.error?.message || 'Database error'}`);
      }
    }
    all.push(newMember);
    this.setItem(STORAGE_KEYS.JURY, all);
    this.notify();
    return newMember;
  }

  public async deleteJuryMember(memberId: string): Promise<void> {
    if (supabase) {
      const res = await this.sbDelete('jury_members', memberId);
      if (!res.success) {
        console.error('❌ [Supabase deleteJuryMember Error]:', res.error);
        throw new Error(`Failed to delete jury member from database: ${res.error?.message || 'Database error'}`);
      }
    }
    this.setItem(STORAGE_KEYS.JURY, this.getJury().filter(j => j.id !== memberId));
    this.notify();
  }

  // ── VOLUNTEERS ────────────────────────────────────────────────────────────

  public getVolunteers(eventId?: string): Volunteer[] {
    const all = this.getItem<Volunteer[]>(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEERS);
    let updated = false;
    const sanitized = all.map((v, idx) => {
      let code = v.access_code || '';
      const isPhoneCode = !code || code === v.phone || /^\d{10}$/.test(code.replace(/\s+/g, '')) || code.includes('VOL-');
      if (isPhoneCode) {
        updated = true;
        const numPart = (v.phone ? v.phone.replace(/\D/g, '').slice(-4) : (101 + idx).toString());
        const cleanCode = code ? code.replace('VOL-', 'VOL') : `VOL${numPart}`;
        return {
          ...v,
          access_code: cleanCode.startsWith('VOL') ? cleanCode : `VOL${cleanCode}`
        };
      }
      return v;
    });

    if (updated) {
      this.setItem(STORAGE_KEYS.VOLUNTEERS, sanitized);
    }
    if (eventId) return sanitized.filter(v => v.event_id === eventId);
    return sanitized;
  }

  public async addVolunteer(volunteer: Partial<Volunteer>): Promise<Volunteer> {
    const all = this.getVolunteers();
    const codeNum = volunteer.phone ? volunteer.phone.replace(/\D/g, '').slice(-4) : Math.floor(100 + Math.random() * 900).toString();
    const defaultCode = `VOL${codeNum}`;
    const realId = (volunteer.id && isValidUuid(volunteer.id)) ? volunteer.id : genUuid();
    const newVol: Volunteer = {
      id: realId,
      event_id: volunteer.event_id || '',
      access_code: (volunteer.access_code || defaultCode).replace('VOL-', 'VOL'),
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      station: volunteer.station || 'Floating',
      shift: volunteer.shift || 'Both days',
      is_yuva: volunteer.is_yuva !== undefined ? volunteer.is_yuva : true,
      has_arrived: volunteer.has_arrived !== undefined ? volunteer.has_arrived : false,
      role: volunteer.role || (volunteer.is_yuva ? 'YUVA Volunteer' : 'Volunteer'),
      created_at: new Date().toISOString()
    };
    if (supabase) {
      const res = await this.sbUpsert('volunteers', newVol as unknown as Record<string, unknown>);
      if (!res.success) {
        console.error('❌ [Supabase addVolunteer Error]:', res.error);
        throw new Error(`Failed to save volunteer to database: ${res.error?.message || 'Database error'}`);
      }
    }
    all.push(newVol);
    this.setItem(STORAGE_KEYS.VOLUNTEERS, all);
    this.notify();
    return newVol;
  }

  public toggleVolunteerArrival(volunteerId: string) {
    let updatedVol: Volunteer | undefined;
    const all = this.getVolunteers().map(v => {
      if (v.id === volunteerId) {
        updatedVol = { ...v, has_arrived: !v.has_arrived };
        return updatedVol;
      }
      return v;
    });
    this.setItem(STORAGE_KEYS.VOLUNTEERS, all);
    if (updatedVol) {
      this.sbUpsert('volunteers', updatedVol as unknown as Record<string, unknown>);
    }
    this.notify();
  }

  public async bulkImportVolunteers(volunteersList: Partial<Volunteer>[], eventId: string): Promise<{ success: boolean; count: number; error?: any }> {
    const existing = this.getVolunteers();
    const newItems: Volunteer[] = volunteersList.map((v, idx) => {
      const codeNum = v.phone ? v.phone.replace(/\D/g, '').slice(-4) : (101 + idx).toString();
      const defaultCode = `VOL${codeNum}`;
      return {
        id: (v.id && isValidUuid(v.id)) ? v.id : genUuid(),
        event_id: eventId,
        access_code: (v.access_code || defaultCode).replace('VOL-', 'VOL'),
        name: v.name || 'Volunteer',
        email: v.email || '',
        phone: v.phone || '',
        station: v.station || 'Floating',
        shift: v.shift || 'Both days',
        is_yuva: v.is_yuva !== undefined ? v.is_yuva : true,
        has_arrived: v.has_arrived || false,
        role: v.role || 'YUVA Volunteer',
        created_at: new Date().toISOString()
      };
    });
    if (supabase && newItems.length > 0) {
      const res = await this.sbUpsertBatch('volunteers', newItems as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase bulkImportVolunteers Error]:', res.error);
        return { success: false, count: 0, error: res.error };
      }
    }
    this.setItem(STORAGE_KEYS.VOLUNTEERS, [...existing, ...newItems]);
    this.notify();
    return { success: true, count: newItems.length };
  }

  public async deleteVolunteer(volunteerId: string): Promise<void> {
    if (supabase) {
      const res = await this.sbDelete('volunteers', volunteerId);
      if (!res.success) {
        console.error('❌ [Supabase deleteVolunteer Error]:', res.error);
        throw new Error(`Failed to delete volunteer from database: ${res.error?.message || 'Database error'}`);
      }
    }
    this.setItem(STORAGE_KEYS.VOLUNTEERS, this.getVolunteers().filter(v => v.id !== volunteerId));
    this.notify();
  }

  public async saveCabinetMinistries(eventId: string, ministries: string[]): Promise<{ success: boolean; error?: any }> {
    // Update both cabinet_ministries AND social_coverage.cabinet_ministries so both persist to Supabase
    const events = this.getEvents().map(e => {
      if (e.id === eventId) {
        const sc = { ...((e.social_coverage as Record<string, unknown>) || {}) };
        sc.cabinet_ministries = ministries;
        return { ...e, cabinet_ministries: ministries, social_coverage: sc };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.EVENTS, events);
    this.notify();

    const target = events.find(e => e.id === eventId);
    if (target && supabase) {
      try {
        const { error } = await supabase.from('college_events').update({
          social_coverage: target.social_coverage
        }).eq('id', eventId);
        if (error) {
          console.error('[Supabase] saveCabinetMinistries error:', error.message);
          return { success: false, error };
        }
      } catch (err) {
        console.error('[Supabase] saveCabinetMinistries exception:', err);
        return { success: false, error: err };
      }
    }
    return { success: true };
  }

  public saveWhatsAppLinks(eventId: string, treasuryLink: string, oppositionLink: string) {
    const events = this.getEvents().map(e =>
      e.id === eventId
        ? { ...e, treasury_whatsapp_link: treasuryLink, opposition_whatsapp_link: oppositionLink }
        : e
    );
    this.setItem(STORAGE_KEYS.EVENTS, events);
  }

  public updatePartyWhatsAppLink(partyId: string, link: string) {
    const parties = this.getParties().map(p =>
      p.id === partyId ? { ...p, whatsapp_group_link: link } : p
    );
    this.setItem(STORAGE_KEYS.PARTIES, parties);
  }

  public async assignCabinetRole(
    eventId: string,
    learnerId: string | undefined | null,
    portfolioRole: string
  ): Promise<{ success: boolean; message?: string; learners: Learner[] }> {
    if (!eventId || !portfolioRole) {
      return { success: false, message: 'Event ID and role are required', learners: this.getLearners(eventId) };
    }

    const canonicalRole = normalizeLeadershipRole(portfolioRole);
    const parties = this.getParties(eventId);
    const allLearners = this.getLearners();

    let targetLearner: Learner | undefined;
    if (learnerId && learnerId.trim()) {
      targetLearner = allLearners.find(l => l.event_id === eventId && (l.id === learnerId || l.access_code === learnerId));
      if (!targetLearner) {
        return { success: false, message: 'Participant not found in roster', learners: this.getLearners(eventId) };
      }

      const bench = getResolvedLearnerBench(targetLearner, parties);

      // Bench rules validation:
      if (isChiefMinisterRole(canonicalRole)) {
        if (bench === 'Opposition') {
          return {
            success: false,
            message: 'Chief Minister must belong to the Ruling party / bench (Opposition delegates cannot be appointed CM)',
            learners: this.getLearners(eventId)
          };
        }
      } else if (isLeaderOfOppositionRole(canonicalRole)) {
        if (bench === 'Ruling') {
          return {
            success: false,
            message: 'Leader of Opposition must belong to the Opposition party / bench (Ruling delegates cannot be appointed LOP)',
            learners: this.getLearners(eventId)
          };
        }
      }
    }

    const isMatchingRole = (r?: string) => isAssemblyRoleMatching(r, canonicalRole);

    const updated = allLearners.map(l => {
      if (l.event_id === eventId) {
        // If this learner is target, assign canonicalRole
        if (targetLearner && l.id === targetLearner.id) {
          return { ...l, role: canonicalRole };
        }
        // If another learner currently holds this role (or alias), reset them to default MLA
        if (isMatchingRole(l.role) && (!targetLearner || l.id !== targetLearner.id)) {
          return { ...l, role: 'Member of Legislative Assembly (MLA)' };
        }
      }
      return l;
    });

    this.setItem(STORAGE_KEYS.LEARNERS, updated);

    // Maintain event-level dual-layer leadership role index on college_events
    const allEvents = this.getEvents();
    const targetEv = allEvents.find(e => e.id === eventId);
    if (targetEv) {
      const sc = { ...((targetEv.social_coverage as Record<string, unknown>) || {}) };
      const currentRoles = { ...((sc.leadership_roles as Record<string, string>) || {}) };
      if (targetLearner) {
        currentRoles[canonicalRole] = targetLearner.id;
      } else {
        delete currentRoles[canonicalRole];
      }
      sc.leadership_roles = currentRoles;
      const updatedEvents = allEvents.map(e => e.id === eventId ? { ...e, social_coverage: sc } : e);
      this.setItem(STORAGE_KEYS.EVENTS, updatedEvents);
      if (supabase) {
        try {
          await supabase.from('college_events').update({ social_coverage: sc }).eq('id', eventId);
        } catch (e) {
          console.warn('[Supabase] leadership_roles sync error:', e);
        }
      }
    }

    if (supabase) {
      const affected = updated.filter(l =>
        l.event_id === eventId &&
        (isMatchingRole(l.role) || (allLearners.find(oldL => oldL.id === l.id && isMatchingRole(oldL.role))))
      );
      if (affected.length > 0) {
        const sanitizedBatch = affected.map(item => this.sanitizeRecordForTable('learners', item as unknown as Record<string, unknown>));
        try {
          const { error } = await supabase.from('learners').upsert(sanitizedBatch, { onConflict: 'id' });
          if (error) console.warn('[Supabase] assign cabinet role sync error:', error.message);
        } catch (err) {
          console.warn('[Supabase] assign cabinet role sync exception:', err);
        }
      }
    }

    this.notify();
    const eventLearners = updated.filter(l => l.event_id === eventId);
    return { success: true, learners: eventLearners };
  }

  public getLeadershipRoles(eventId: string): Record<string, string> {
    if (!eventId) return {};
    const event = this.getEvents().find(e => e.id === eventId);
    const roles: Record<string, string> = (event?.social_coverage as any)?.leadership_roles || {};
    return roles;
  }

  public getPartyBenches(eventId: string): Record<string, 'Ruling' | 'Opposition' | 'Independent'> {
    if (!eventId) return {};
    const parties = this.getParties(eventId);
    const benches: Record<string, 'Ruling' | 'Opposition' | 'Independent'> = {};
    parties.forEach(p => {
      benches[p.id] = p.bench || 'Independent';
    });
    return benches;
  }

  // ── NOMINATIONS ───────────────────────────────────────────────────────────

  public getOpenNominationPositions(eventId?: string): string[] {
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.OPEN_NOMINATIONS, {});
    const validRoles = ['Speaker', 'Chief Minister', 'Leader of Opposition', 'Party Leader'];
    if (eventId) {
      if (eventId in map) {
        const list = map[eventId] || [];
        return list.filter(p => validRoles.includes(p));
      }
      return validRoles;
    }
    return validRoles;
  }

  public toggleNominationPositionStatus(eventId: string, position: string): boolean {
    if (!eventId || !position) return false;
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.OPEN_NOMINATIONS, {});
    const validRoles = ['Speaker', 'Chief Minister', 'Leader of Opposition', 'Party Leader'];
    const currentList = eventId in map ? map[eventId] : validRoles;

    let isOpenNow = false;
    let nextList: string[];
    if (currentList.includes(position)) {
      nextList = currentList.filter(p => p !== position);
      isOpenNow = false;
    } else {
      nextList = [...currentList, position];
      isOpenNow = true;
    }

    map[eventId] = nextList;
    this.setItem(STORAGE_KEYS.OPEN_NOMINATIONS, map);
    this.syncEventStateToSupabase(eventId);
    return isOpenNow;
  }

  public setAllNominationPositionsStatus(eventId: string, open: boolean, allPositions: string[] = []): string[] {
    if (!eventId) return [];
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.OPEN_NOMINATIONS, {});
    const validRoles = ['Speaker', 'Chief Minister', 'Leader of Opposition', 'Party Leader'];
    const rolesToUse = allPositions.length > 0 ? allPositions : validRoles;
    const nextList = open ? [...rolesToUse] : [];
    map[eventId] = nextList;
    this.setItem(STORAGE_KEYS.OPEN_NOMINATIONS, map);
    this.syncEventStateToSupabase(eventId);
    return nextList;
  }

  public setOpenNominationPositions(eventId: string, positions: string[]): string[] {
    if (!eventId) return [];
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.OPEN_NOMINATIONS, {});
    map[eventId] = positions;
    this.setItem(STORAGE_KEYS.OPEN_NOMINATIONS, map);
    this.syncEventStateToSupabase(eventId);
    return positions;
  }

  public getNominations(eventId?: string, role?: string, studentId?: string): Nomination[] {
    const all = this.getItem<Nomination[]>(STORAGE_KEYS.NOMINATIONS, INITIAL_NOMINATIONS);
    const list = eventId ? all.filter(n => n.event_id === eventId) : all;
    if (role === 'student') {
      return studentId ? list.filter(n => n.candidate_learner_id === studentId) : [];
    }
    return list;
  }

  public addNomination(nom: Partial<Nomination>): Nomination {
    const all = this.getNominationAll();

    // Guard 1: Assigned Speaker or Deputy Speaker cannot nominate
    if (nom.candidate_learner_id || nom.candidate_name) {
      const learners = this.getLearners(nom.event_id);
      const matchLearner = learners.find(l =>
        (nom.candidate_learner_id && l.id === nom.candidate_learner_id) ||
        (nom.candidate_name && l.full_name?.toLowerCase() === nom.candidate_name.toLowerCase())
      );
      if (matchLearner?.role && matchLearner.role.toLowerCase().includes('speaker')) {
        console.warn(`[storageService] Delegate ${matchLearner.full_name} is assigned as ${matchLearner.role} and cannot nominate.`);
        throw new Error(`Assigned ${matchLearner.role} is ineligible to file candidacy nominations.`);
      }
    }

    // Guard 2: A member is eligible only one time to nominate of a post within an event
    if ((nom.candidate_learner_id || nom.candidate_name) && nom.position) {
      const existing = all.find(n =>
        (!nom.event_id || n.event_id === nom.event_id) &&
        ((nom.candidate_learner_id && n.candidate_learner_id === nom.candidate_learner_id) ||
          (nom.candidate_name && n.candidate_name?.toLowerCase() === nom.candidate_name.toLowerCase())) &&
        n.position === nom.position &&
        n.status !== 'Rejected'
      );
      if (existing) {
        throw new Error(`Delegate ${nom.candidate_name || 'selected'} is already nominated for ${nom.position}. Each member is eligible only once per post.`);
      }
    }

    const nominatorName = nom.nominated_by_name || nom.candidate_name || 'Self';
    const initialHist: NominationHistoryEntry = {
      id: uid('hist'),
      status: (nom.status as any) || 'Submitted',
      changed_by: nominatorName,
      timestamp: new Date().toISOString(),
      comment: nom.nominated_by_name ? `Nominated by ${nom.nominated_by_name}` : 'Self-nomination filed'
    };

    const newNom: Nomination = {
      id: uid('nom'),
      event_id: nom.event_id || '',
      position: nom.position || 'Speaker',
      candidate_learner_id: nom.candidate_learner_id || '',
      candidate_name: nom.candidate_name || '',
      party_name: nom.party_name || '',
      bench: nom.bench || 'Ruling',
      manifesto: nom.manifesto || '',
      status: nom.status || 'Pending',
      votes_received: 0,
      created_at: new Date().toISOString(),
      nominated_by_name: nominatorName,
      nominated_by_id: nom.nominated_by_id,
      history: [initialHist]
    };
    all.unshift(newNom);
    this.setItem(STORAGE_KEYS.NOMINATIONS, all);
    if (newNom.event_id) this.syncEventStateToSupabase(newNom.event_id);
    return newNom;
  }

  private getNominationAll(): Nomination[] {
    return this.getItem<Nomination[]>(STORAGE_KEYS.NOMINATIONS, INITIAL_NOMINATIONS);
  }

  public updateNominationStatus(
    id: string,
    status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn',
    changedBy: string = 'Coordinator',
    comment?: string
  ) {
    let targetEventId = '';
    const all = this.getNominationAll().map(n => {
      if (n.id === id) {
        targetEventId = n.event_id;
        const history = Array.isArray(n.history) ? [...n.history] : [];
        history.push({
          id: uid('hist'),
          status,
          changed_by: changedBy,
          timestamp: new Date().toISOString(),
          comment: comment || `Status updated to ${status}`
        });
        return { ...n, status, history };
      }
      return n;
    });
    this.setItem(STORAGE_KEYS.NOMINATIONS, all);

    // If approved, ensure candidate is linked to election if active
    if (status === 'Approved') {
      const target = all.find(n => n.id === id);
      if (target) {
        this.syncApprovedNominationToElection(target);
      }
    }
    if (targetEventId) this.syncEventStateToSupabase(targetEventId);
  }

  public withdrawNomination(id: string, delegateName: string = 'Delegate') {
    this.updateNominationStatus(id, 'Withdrawn', delegateName, 'Nomination withdrawn by candidate');
  }

  public getNominationHistory(eventId?: string) {
    const noms = this.getNominations(eventId);
    return noms.map(n => ({
      nomination_id: n.id,
      candidate_name: n.candidate_name,
      position: n.position,
      party_name: n.party_name,
      bench: n.bench,
      nominated_by_name: n.nominated_by_name || n.candidate_name,
      created_at: n.created_at,
      status: n.status,
      history: (n.history && n.history.length > 0) ? n.history : [
        {
          id: uid('hist'),
          status: n.status || 'Submitted',
          changed_by: n.nominated_by_name || n.candidate_name || 'Self',
          timestamp: n.created_at || new Date().toISOString(),
          comment: 'Nomination filed'
        }
      ]
    }));
  }

  private syncApprovedNominationToElection(nom: Nomination) {
    let elections = this.getElections(nom.event_id);
    let targetType: 'SPEAKER' | 'LEADERSHIP' | 'DEPUTY_SPEAKER' | 'COMMITTEE' = 'LEADERSHIP';
    if (nom.position === 'Speaker') targetType = 'SPEAKER';
    if (nom.position === 'Deputy Speaker') targetType = 'DEPUTY_SPEAKER';
    if (nom.position === 'Committee Chair') targetType = 'COMMITTEE';

    let election = elections.find(e => e.type === targetType);
    if (!election) {
      // Create the appropriate election type based on nomination position
      let electionTitle: string;
      if (nom.position === 'Speaker') {
        electionTitle = 'Assembly Speaker Election';
      } else if (nom.position === 'Ruling Party Leader') {
        electionTitle = 'Ruling Party Leader Election';
      } else if (nom.position === 'Opposition Party Leader') {
        electionTitle = 'Opposition Party Leader Election';
      } else if (nom.position === 'Deputy Speaker') {
        electionTitle = 'Deputy Speaker Election';
      } else if (nom.position === 'Committee Chair') {
        electionTitle = 'Committee Chairperson Election';
      } else {
        electionTitle = 'Election';
      }

      election = {
        id: uid('elec'),
        event_id: nom.event_id,
        title: electionTitle,
        position: nom.position,
        type: targetType,
        status: 'Live',
        candidates: [],
        total_votes: 0,
        voted_delegate_ids: [],
        created_at: new Date().toISOString()
      } as Election;
      elections = [election, ...(elections || [])];
      this.setItem(STORAGE_KEYS.ELECTIONS, elections);
    }

    const alreadyHas = election.candidates.some(c => c.name === nom.candidate_name);
    if (!alreadyHas) {
      election.candidates.push({
        id: uid('cand'),
        learner_id: nom.candidate_learner_id,
        name: nom.candidate_name,
        party: nom.party_name,
        bench: nom.bench,
        votes: 0
      });
      this.updateElection(election);
    }
  }

  public deleteNomination(id: string) {
    const target = this.getNominationAll().find(n => n.id === id);
    const all = this.getNominationAll().filter(n => n.id !== id);
    this.setItem(STORAGE_KEYS.NOMINATIONS, all);
    if (target?.event_id) this.syncEventStateToSupabase(target.event_id);
  }

  // ── ELECTIONS ─────────────────────────────────────────────────────────────

  public getElections(eventId?: string, role?: string, studentId?: string): Election[] {
    const all = this.getItem<Election[]>(STORAGE_KEYS.ELECTIONS, INITIAL_ELECTIONS);
    const targetId = eventId || this.getActiveEventId();
    const list = targetId ? all.filter(e => e.event_id === targetId) : all;

    // Self-healing: if learners table has elected leaders, ensure elections reflect Closed with winner
    const learners = targetId ? this.getLearners(targetId) : this.getLearners();
    const speakerLearner = learners.find(l => isSpeakerRole(l.role));
    const cmLearner = learners.find(l => isChiefMinisterRole(l.role));
    const lopLearner = learners.find(l => isLeaderOfOppositionRole(l.role));

    let modified = false;
    const healedList = list.map(e => {
      // Respect active coordinator actions: Live and Upcoming elections must NEVER be auto-closed
      if (e.status === 'Upcoming' || e.status === 'Live') return e;
      if (e.status === 'Closed' && e.winner) return e;
      const posLower = (e.position || '').toLowerCase();
      const titleLower = (e.title || '').toLowerCase();

      if (speakerLearner && (posLower === 'speaker' || titleLower.includes('speaker election')) && !posLower.includes('deputy') && !titleLower.includes('deputy')) {
        modified = true;
        return {
          ...e,
          status: 'Closed' as const,
          type: 'SPEAKER' as const,
          position: 'Speaker',
          winner: speakerLearner.full_name,
          total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 72),
          completed_at: e.completed_at || '2026-09-08T06:00:40.175Z',
          candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
            { id: speakerLearner.id, learner_id: speakerLearner.id, name: speakerLearner.full_name, party: speakerLearner.party_name || 'Party 2', bench: 'Ruling' as const, votes: 45 },
            { id: 'cand_speaker_opp', name: 'S. Srimathi', party: 'Party 1', bench: 'Opposition' as const, votes: 27 }
          ]
        };
      }
      // Deputy Speaker is not a separate election ballot; 2nd highest in Speaker election is Deputy Speaker
      if (cmLearner && (posLower.includes('ruling') || titleLower.includes('chief minister') || titleLower.includes('ruling party leader'))) {
        modified = true;
        return {
          ...e,
          status: 'Closed' as const,
          type: 'LEADERSHIP' as const,
          position: 'Ruling Party Leader',
          winner: cmLearner.full_name,
          total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 48),
          completed_at: e.completed_at || '2026-09-08T07:30:15.000Z',
          candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
            { id: cmLearner.id, learner_id: cmLearner.id, name: cmLearner.full_name, party: cmLearner.party_name || 'Party 3', bench: 'Ruling' as const, votes: 32 },
            { id: 'cand_cm_runner', name: 'Maiyurikha', party: 'Party 4', bench: 'Ruling' as const, votes: 16 }
          ]
        };
      }
      if (lopLearner && (posLower.includes('opposition') || titleLower.includes('opposition') || titleLower.includes('lop'))) {
        modified = true;
        return {
          ...e,
          status: 'Closed' as const,
          type: 'LEADERSHIP' as const,
          position: 'Opposition Party Leader',
          winner: lopLearner.full_name,
          total_votes: e.total_votes > 0 ? e.total_votes : (e.candidates && e.candidates.length > 0 ? e.candidates.reduce((s, c) => s + (c.votes || 0), 0) : 41),
          completed_at: e.completed_at || '2026-09-08T08:15:00.000Z',
          candidates: (e.candidates && e.candidates.length > 0) ? e.candidates : [
            { id: lopLearner.id, learner_id: lopLearner.id, name: lopLearner.full_name, party: lopLearner.party_name || 'Party 1', bench: 'Opposition' as const, votes: 28 },
            { id: 'cand_lop_runner', name: 'Mathan', party: 'Party 2', bench: 'Opposition' as const, votes: 13 }
          ]
        };
      }
      return e;
    });

    if (modified) {
      const healedMap = new Map(healedList.map(e => [e.id, e]));
      const updatedAll = all.map(e => healedMap.get(e.id) || e);
      this.setItem(STORAGE_KEYS.ELECTIONS, updatedAll);
    }

    const nonDeputyList = healedList.filter(e =>
      e.type !== 'DEPUTY_SPEAKER' &&
      e.position !== 'Deputy Speaker' &&
      !e.title?.toLowerCase().includes('deputy speaker')
    );

    if (role === 'student') {
      return nonDeputyList.map(e => ({
        ...e,
        total_votes: undefined as any,
        voted_delegate_ids: studentId && e.voted_delegate_ids?.includes(studentId) ? [studentId] : [],
        candidates: (e.candidates || []).map(c => ({
          ...c,
          votes: undefined as any
        }))
      }));
    }
    return nonDeputyList;
  }

  public addElection(elec: Partial<Election>): Election {
    const all = this.getElectionAll();
    const newElec: Election = {
      id: elec.id || uid('elec'),
      event_id: elec.event_id || '',
      title: elec.title || 'New Election',
      position: elec.position || 'Assembly Role',
      type: elec.type || 'LEADERSHIP',
      status: elec.status || 'Live',
      candidates: elec.candidates || [],
      total_votes: elec.total_votes ?? 0,
      voted_delegate_ids: elec.voted_delegate_ids || [],
      created_at: elec.created_at || new Date().toISOString()
    };
    all.unshift(newElec);
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (newElec.event_id) this.syncEventStateToSupabase(newElec.event_id);
    return newElec;
  }

  public createElection(elec: Partial<Election>): Election {
    return this.addElection(elec);
  }

  private getElectionAll(): Election[] {
    return this.getItem<Election[]>(STORAGE_KEYS.ELECTIONS, INITIAL_ELECTIONS);
  }

  public updateElection(election: Election) {
    const all = this.getElectionAll().map(e => (e.id === election.id ? election : e));
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (election.event_id) this.syncEventStateToSupabase(election.event_id);
  }

  public castVoteInElection(electionId: string, candidateId: string, delegateId?: string): boolean {
    const all = this.getElectionAll();
    const election = all.find(e => e.id === electionId);
    if (!election || election.status !== 'Live') return false;

    if (delegateId) {
      if (election.voted_delegate_ids?.includes(delegateId)) {
        return false; // Already voted
      }

      // Server-Side Voter Eligibility Enforcement for Political Party Leader Elections
      const partyLeaderParty = this.getPartyLeaderElectionParty(election);
      if (partyLeaderParty) {
        const learners = this.getLearners();
        const voterLearner = learners.find(l => l.id === delegateId);
        if (voterLearner) {
          const isPartyMatch = voterLearner.party_id
            ? voterLearner.party_id === partyLeaderParty.id
            : voterLearner.party_name?.toLowerCase() === partyLeaderParty.name.toLowerCase();
          if (!isPartyMatch) {
            console.warn(`[StorageService] Rejected vote: Delegate ${voterLearner.full_name} is not a member of party ${partyLeaderParty.name}. Only members of ${partyLeaderParty.name} can vote in this election.`);
            return false;
          }
        }
      }
    }

    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) return false;

    candidate.votes += 1;
    election.total_votes += 1;
    if (delegateId) {
      if (!election.voted_delegate_ids) election.voted_delegate_ids = [];
      election.voted_delegate_ids.push(delegateId);

      const anyElec = election as any;
      if (!anyElec.votes_by_delegate) anyElec.votes_by_delegate = {};
      anyElec.votes_by_delegate[delegateId] = candidate.id;

      const learners = this.getLearners(election.event_id);
      const voterLearner = learners.find(l => l.id === delegateId);
      this.recordVoteAuditEntry({
        id: uid('vote_aud'),
        event_id: election.event_id,
        poll_id: election.id,
        poll_type: 'ELECTION',
        voter_id: delegateId,
        voter_name: voterLearner?.full_name || 'Delegate',
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        timestamp: new Date().toISOString()
      });
    }

    // Check leader
    const sorted = [...election.candidates].sort((a, b) => b.votes - a.votes);
    if (sorted.length > 0 && sorted[0].votes > 0) {
      election.winner = sorted[0].name;
    }

    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (election.event_id) this.syncEventStateToSupabase(election.event_id);
    return true;
  }

  public closeElection(electionId: string) {
    let targetEventId = '';
    let winnerRoleToAssign = '';
    let winnerCandidate: ElectionCandidate | undefined;

    let runnerUpCandidate: ElectionCandidate | undefined;

    const all = this.getElectionAll().map(e => {
      if (e.id === electionId) {
        targetEventId = e.event_id;
        const sorted = [...e.candidates].sort((a, b) => b.votes - a.votes);
        const win = sorted.length > 0 && sorted[0].votes > 0 ? sorted[0].name : undefined;
        if (win && sorted[0]) {
          winnerCandidate = sorted[0];
          const pos = (e.position || e.title || '').trim();
          if (isSpeakerRole(pos) || e.type === 'SPEAKER') {
            winnerRoleToAssign = CANONICAL_ROLES.SPEAKER;
            if (sorted.length > 1 && sorted[1]) {
              runnerUpCandidate = sorted[1];
            }
          } else if (isChiefMinisterRole(pos)) {
            winnerRoleToAssign = CANONICAL_ROLES.CHIEF_MINISTER;
          } else if (isLeaderOfOppositionRole(pos)) {
            winnerRoleToAssign = CANONICAL_ROLES.LEADER_OF_OPPOSITION;
          }
        }
        return {
          ...e,
          status: 'Closed' as const,
          winner: win,
          completed_at: e.completed_at || new Date().toISOString()
        };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.ELECTIONS, all);

    // Sync winner leadership role to learner record
    if (targetEventId && winnerRoleToAssign && winnerCandidate) {
      const allLearners = this.getLearners(targetEventId);
      const cand = winnerCandidate as ElectionCandidate;
      const targetLearner = allLearners.find(l =>
        (cand.learner_id && l.id === cand.learner_id) ||
        (cand.id && l.id === cand.id) ||
        l.full_name.toLowerCase() === cand.name.toLowerCase()
      );
      if (targetLearner) {
        this.assignCabinetRole(targetEventId, targetLearner.id, winnerRoleToAssign);
      }
      // If Speaker election, assign 2nd highest vote candidate as Deputy Speaker
      if (winnerRoleToAssign === CANONICAL_ROLES.SPEAKER && runnerUpCandidate) {
        const runnerCand = runnerUpCandidate as ElectionCandidate;
        const runnerLearner = allLearners.find(l =>
          (runnerCand.learner_id && l.id === runnerCand.learner_id) ||
          (runnerCand.id && l.id === runnerCand.id) ||
          l.full_name.toLowerCase() === runnerCand.name.toLowerCase()
        );
        if (runnerLearner) {
          this.assignCabinetRole(targetEventId, runnerLearner.id, CANONICAL_ROLES.DEPUTY_SPEAKER);
        }
      }
    }

    if (targetEventId) this.syncEventStateToSupabase(targetEventId);
  }

  public setElectionStatus(electionId: string, status: 'Upcoming' | 'Live' | 'Closed') {
    let targetEventId = '';
    let winnerRoleToAssign = '';
    let winnerCandidate: ElectionCandidate | undefined;

    let runnerUpCandidate: ElectionCandidate | undefined;

    const all = this.getElectionAll().map(e => {
      if (e.id === electionId) {
        targetEventId = e.event_id;
        let winner = e.winner;
        let completedAt = e.completed_at;
        if (status === 'Closed') {
          const sorted = [...e.candidates].sort((a, b) => b.votes - a.votes);
          winner = sorted.length > 0 && sorted[0].votes > 0 ? sorted[0].name : undefined;
          if (winner && sorted[0]) {
            winnerCandidate = sorted[0];
            const pos = (e.position || e.title || '').trim();
            if (isSpeakerRole(pos) || e.type === 'SPEAKER') {
              winnerRoleToAssign = CANONICAL_ROLES.SPEAKER;
              if (sorted.length > 1 && sorted[1]) {
                runnerUpCandidate = sorted[1];
              }
            } else if (isChiefMinisterRole(pos)) {
              winnerRoleToAssign = CANONICAL_ROLES.CHIEF_MINISTER;
            } else if (isLeaderOfOppositionRole(pos)) {
              winnerRoleToAssign = CANONICAL_ROLES.LEADER_OF_OPPOSITION;
            }
          }
          if (!completedAt) completedAt = new Date().toISOString();
        }
        return { ...e, status, winner, completed_at: completedAt };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.ELECTIONS, all);

    // Sync winner leadership role to learner record
    if (targetEventId && winnerRoleToAssign && winnerCandidate) {
      const allLearners = this.getLearners(targetEventId);
      const cand = winnerCandidate as ElectionCandidate;
      const targetLearner = allLearners.find(l =>
        (cand.learner_id && l.id === cand.learner_id) ||
        (cand.id && l.id === cand.id) ||
        l.full_name.toLowerCase() === cand.name.toLowerCase()
      );
      if (targetLearner) {
        this.assignCabinetRole(targetEventId, targetLearner.id, winnerRoleToAssign);
      }
      // If Speaker election, assign 2nd highest vote candidate as Deputy Speaker
      if (winnerRoleToAssign === CANONICAL_ROLES.SPEAKER && runnerUpCandidate) {
        const runnerCand = runnerUpCandidate as ElectionCandidate;
        const runnerLearner = allLearners.find(l =>
          (runnerCand.learner_id && l.id === runnerCand.learner_id) ||
          (runnerCand.id && l.id === runnerCand.id) ||
          l.full_name.toLowerCase() === runnerCand.name.toLowerCase()
        );
        if (runnerLearner) {
          this.assignCabinetRole(targetEventId, runnerLearner.id, CANONICAL_ROLES.DEPUTY_SPEAKER);
        }
      }
    }

    if (targetEventId) this.syncEventStateToSupabase(targetEventId);
  }

  public getPartyLeaderElectionParty(election: Election): Party | null {
    const parties = this.getParties(election.event_id);
    if (election.party_id) {
      const match = parties.find(p => p.id === election.party_id);
      if (match) return match;
    }
    const title = (election.title || '').toLowerCase();
    const pos = (election.position || '').toLowerCase();
    if ((pos === 'party leader' || title.includes('party leader')) && !title.includes('ruling') && !title.includes('opposition')) {
      const match = parties.find(p => p.name && (title.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(title.replace('leader election', '').trim())));
      if (match) return match;

      // Fallback: extract party name from title e.g. "Party 1 Leader Election" -> "Party 1"
      const extracted = (election.title || '').replace(/\s+leader election$/i, '').trim();
      if (extracted && extracted.toLowerCase() !== 'party') {
        return {
          id: election.party_id || '',
          event_id: election.event_id,
          name: extracted,
          bench: 'Independent',
          color: '#059669'
        };
      }
    }
    return null;
  }

  public addCandidateToElection(electionId: string, candidate: Partial<ElectionCandidate>): { success: boolean; reason?: string } {
    const all = this.getElectionAll();
    const election = all.find(e => e.id === electionId);
    if (!election) return { success: false, reason: 'Election not found.' };

    // Enforce Backend Nomination Locking while Live or Closed
    if (election.status === 'Live' || election.status === 'Closed') {
      const reason = 'Nominations are locked while voting is live or closed.';
      console.warn(`[StorageService] Rejected candidate addition: ${reason}`);
      return { success: false, reason };
    }

    // Server-Side Validation: Restrict Party Leader Election to members of that specific party
    const partyLeaderParty = this.getPartyLeaderElectionParty(election);
    if (partyLeaderParty) {
      const learners = this.getLearners(election.event_id);
      const candidateLearner = learners.find(
        l => (candidate.learner_id && l.id === candidate.learner_id) || l.full_name?.toLowerCase() === candidate.name?.toLowerCase()
      );

      const candidatePartyId = candidateLearner?.party_id;
      const candidatePartyName = (candidateLearner ? getResolvedPartyName(candidateLearner, this.getParties(election.event_id)) : '') || candidateLearner?.party_name || candidate.party;

      const isPartyMatch = Boolean(
        (partyLeaderParty.id && candidatePartyId && candidatePartyId === partyLeaderParty.id) ||
        (partyLeaderParty.name && candidatePartyName && candidatePartyName.trim().toLowerCase() === partyLeaderParty.name.trim().toLowerCase())
      );

      if (!isPartyMatch) {
        const reason = `${candidate.name || 'Candidate'} cannot be added — not a registered member of ${partyLeaderParty.name}. Candidate must be a member of the party holding this election.`;
        console.warn(`[StorageService] Rejected candidate addition: ${reason}`);
        return { success: false, reason };
      }
    }

    // Check if already in ballot
    const existing = election.candidates.find(
      c => (candidate.learner_id && c.learner_id === candidate.learner_id) || c.name.toLowerCase() === candidate.name?.toLowerCase()
    );
    if (existing) return { success: false, reason: `${candidate.name || 'Candidate'} is already nominated on this ballot.` };

    const newCandidate: ElectionCandidate = {
      id: candidate.id || uid('cand'),
      learner_id: candidate.learner_id,
      name: candidate.name || 'Nominated Candidate',
      party: candidate.party || partyLeaderParty?.name || 'Independent',
      bench: candidate.bench || partyLeaderParty?.bench || 'Ruling',
      votes: 0
    };

    election.candidates.push(newCandidate);
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (election.event_id) this.syncEventStateToSupabase(election.event_id);
    return { success: true };
  }

  public removeCandidateFromElection(electionId: string, candidateId: string): boolean {
    const all = this.getElectionAll();
    const election = all.find(e => e.id === electionId);
    if (!election) return false;

    // Enforce Backend Nomination Locking while Live or Closed
    if (election.status === 'Live' || election.status === 'Closed') {
      console.warn('[StorageService] Rejected candidate removal: Nominations are locked while voting is live or closed.');
      return false;
    }

    election.candidates = election.candidates.filter(c => c.id !== candidateId && c.learner_id !== candidateId);
    // Recalculate total votes
    election.total_votes = election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (election.event_id) this.syncEventStateToSupabase(election.event_id);
    return true;
  }

  public resetElection(electionId: string) {
    let targetEventId = '';
    const all = this.getElectionAll().map(e => {
      if (e.id === electionId) {
        targetEventId = e.event_id;
        return {
          ...e,
          status: 'Upcoming' as const,
          total_votes: 0,
          winner: undefined,
          voted_delegate_ids: [],
          candidates: e.candidates.map(c => ({ ...c, votes: 0 }))
        };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (targetEventId) this.syncEventStateToSupabase(targetEventId);
  }

  public deleteElection(electionId: string) {
    const target = this.getElectionAll().find(e => e.id === electionId);
    const all = this.getElectionAll().filter(e => e.id !== electionId);
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    if (target?.event_id) this.syncEventStateToSupabase(target.event_id);
  }

  // ── LIVE FLASH VOTES (Instant Yes/No Division Polls) ──────────────────────

  public getFlashVotes(eventId?: string, role?: string, studentId?: string): LiveFlashVote[] {
    const all = this.getItem<LiveFlashVote[]>(STORAGE_KEYS.FLASH_VOTES, INITIAL_FLASH_VOTES);
    const list = eventId ? all.filter(f => f.event_id === eventId) : all;
    if (role === 'student') {
      return list.map(v => {
        const studentVote = studentId && v.votes ? v.votes.find(vt => vt.learner_id === studentId) : undefined;
        return {
          ...v,
          ayes_count: 0,
          noes_count: 0,
          abstain_count: 0,
          voter_ids: studentId && v.voter_ids?.includes(studentId) ? [studentId] : [],
          votes: studentVote ? [studentVote] : []
        };
      });
    }
    return list;
  }

  private getFlashVoteAll(): LiveFlashVote[] {
    return this.getItem<LiveFlashVote[]>(STORAGE_KEYS.FLASH_VOTES, INITIAL_FLASH_VOTES);
  }

  public createFlashVote(
    eventId: string,
    question: string,
    audience: FlashVoteAudience = 'ALL',
    motionType: LiveFlashVote['motion_type'] = 'Division'
  ): LiveFlashVote {
    const all = this.getFlashVoteAll();
    const newVote: LiveFlashVote = {
      id: uid('flash'),
      event_id: eventId,
      question,
      motion_type: motionType,
      target_audience: audience,
      status: 'ACTIVE',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ayes_count: 0,
      noes_count: 0,
      abstain_count: 0,
      voter_ids: [],
      votes: []
    };
    all.unshift(newVote);
    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
    if (eventId) this.syncEventStateToSupabase(eventId);
    return newVote;
  }

  public castFlashVote(
    voteId: string,
    learner: Learner,
    decision: 'AYE' | 'NO' | 'ABSTAIN'
  ): boolean {
    const all = this.getFlashVoteAll();
    const target = all.find(f => f.id === voteId);
    if (!target || target.status !== 'ACTIVE') return false;

    // Check if audience matches
    if (target.target_audience === 'MINISTERS' && !learner.role?.includes('Minister') && !learner.role?.includes('Chief')) {
      return false;
    }
    if (target.target_audience === 'RULING' && learner.bench !== 'Ruling') return false;
    if (target.target_audience === 'OPPOSITION' && learner.bench !== 'Opposition') return false;

    // Check if already voted
    const existingIndex = target.votes.findIndex(v => v.learner_id === learner.id);
    if (existingIndex >= 0) {
      const prev = target.votes[existingIndex].vote;
      if (prev === 'AYE') target.ayes_count = Math.max(0, target.ayes_count - 1);
      if (prev === 'NO') target.noes_count = Math.max(0, target.noes_count - 1);
      if (prev === 'ABSTAIN') target.abstain_count = Math.max(0, target.abstain_count - 1);
      target.votes.splice(existingIndex, 1);
    } else {
      target.voter_ids.push(learner.id);
    }

    if (decision === 'AYE') target.ayes_count += 1;
    if (decision === 'NO') target.noes_count += 1;
    if (decision === 'ABSTAIN') target.abstain_count += 1;

    target.votes.push({
      learner_id: learner.id,
      learner_name: learner.full_name,
      role: learner.role || 'MLA',
      bench: learner.bench || 'Ruling',
      vote: decision,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (target.event_id) {
      this.recordVoteAuditEntry({
        id: uid('vote_aud'),
        event_id: target.event_id,
        poll_id: target.id,
        poll_type: 'FLASH_VOTE',
        voter_id: learner.id,
        voter_name: learner.full_name,
        decision,
        timestamp: new Date().toISOString()
      });
    }

    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
    if (target.event_id) this.syncEventStateToSupabase(target.event_id);
    return true;
  }

  public closeFlashVote(voteId: string) {
    let targetEventId = '';
    const all = this.getFlashVoteAll().map(v => {
      if (v.id === voteId) {
        targetEventId = v.event_id;
        return { ...v, status: 'CLOSED' as const };
      }
      return v;
    });
    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
    if (targetEventId) this.syncEventStateToSupabase(targetEventId);
  }

  public deleteFlashVote(voteId: string) {
    const target = this.getFlashVoteAll().find(f => f.id === voteId);
    const all = this.getFlashVoteAll().filter(f => f.id !== voteId);
    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
    if (target?.event_id) this.syncEventStateToSupabase(target.event_id);
  }


  // ── CHECKLIST ─────────────────────────────────────────────────────────────

  public getChecklist(eventId?: string): ChecklistItem[] {
    const all = this.getItem<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST);
    if (eventId) return all.filter(c => c.event_id === eventId);
    return all;
  }

  public toggleChecklistItem(id: string) {
    const all = this.getItem<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST).map(c =>
      c.id === id ? { ...c, is_completed: !c.is_completed } : c
    );
    this.setItem(STORAGE_KEYS.CHECKLIST, all);
  }

  public addChecklistItem(item: Partial<ChecklistItem>): ChecklistItem {
    const all = this.getItem<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST);
    const newItem: ChecklistItem = {
      id: uid('chk'),
      event_id: item.event_id || '',
      category: item.category || 'Venue & Stage',
      task: item.task || 'New Task',
      is_completed: false,
      assigned_to: item.assigned_to || 'Secretariat'
    };
    all.push(newItem);
    this.setItem(STORAGE_KEYS.CHECKLIST, all);
    return newItem;
  }

  public deleteChecklistItem(id: string) {
    const all = this.getItem<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST).filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CHECKLIST, all);
  }

  // ── QUESTIONNAIRE ─────────────────────────────────────────────────────────

  public getQuestions(eventId?: string): ParliamentQuestion[] {
    const all = this.getItem<ParliamentQuestion[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    if (eventId) return all.filter(q => q.event_id === eventId);
    return all;
  }

  public addQuestion(q: Partial<ParliamentQuestion>): ParliamentQuestion {
    const all = this.getItem<ParliamentQuestion[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    const newQ: ParliamentQuestion = {
      id: uid('q'),
      event_id: q.event_id || '',
      question_number: q.question_number || `Q-${Math.floor(100 + Math.random() * 900)}`,
      type: q.type || 'Starred',
      ministry: q.ministry || 'General Administration',
      submitter_name: q.submitter_name || 'MLA',
      submitter_party: q.submitter_party || 'Assembly',
      question_text: q.question_text || '',
      status: q.status || 'Submitted',
      created_at: new Date().toISOString()
    };
    all.unshift(newQ);
    this.setItem(STORAGE_KEYS.QUESTIONS, all);
    return newQ;
  }

  public answerQuestion(id: string, response: string) {
    const all = this.getItem<ParliamentQuestion[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS).map(q =>
      q.id === id ? { ...q, status: 'Answered' as const, minister_response: response } : q
    );
    this.setItem(STORAGE_KEYS.QUESTIONS, all);
  }

  public updateQuestionStatus(id: string, status: ParliamentQuestion['status']) {
    const all = this.getItem<ParliamentQuestion[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS).map(q =>
      q.id === id ? { ...q, status } : q
    );
    this.setItem(STORAGE_KEYS.QUESTIONS, all);
  }

  // ── PROCEEDINGS ───────────────────────────────────────────────────────────

  public getProceedings(eventId?: string): BillProceeding[] {
    const all = this.getItem<BillProceeding[]>(STORAGE_KEYS.PROCEEDINGS, INITIAL_PROCEEDINGS);
    if (eventId) return all.filter(p => p.event_id === eventId);
    return all;
  }

  public addBill(bill: Partial<BillProceeding>): BillProceeding {
    const all = this.getItem<BillProceeding[]>(STORAGE_KEYS.PROCEEDINGS, INITIAL_PROCEEDINGS);
    const newBill: BillProceeding = {
      id: uid('bill'),
      event_id: bill.event_id || '',
      bill_number: bill.bill_number || `TN-BILL-${Math.floor(10 + Math.random() * 90)}/2026`,
      title: bill.title || 'New Legislative Bill',
      introduced_by: bill.introduced_by || 'Member',
      bench: bill.bench || 'Ruling',
      summary: bill.summary || '',
      status: bill.status || 'Introduced',
      ayes: 0,
      noes: 0,
      created_at: new Date().toISOString()
    };
    all.unshift(newBill);
    this.setItem(STORAGE_KEYS.PROCEEDINGS, all);
    return newBill;
  }

  public updateBillStatus(id: string, status: BillProceeding['status'], ayes?: number, noes?: number) {
    const all = this.getItem<BillProceeding[]>(STORAGE_KEYS.PROCEEDINGS, INITIAL_PROCEEDINGS).map(b => {
      if (b.id === id) {
        return {
          ...b,
          status,
          ayes: ayes !== undefined ? ayes : b.ayes,
          noes: noes !== undefined ? noes : b.noes
        };
      }
      return b;
    });
    this.setItem(STORAGE_KEYS.PROCEEDINGS, all);
  }

  // ── SCORE GRID ────────────────────────────────────────────────────────────

  public getScores(eventId?: string): ScoreRecord[] {
    const all = this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    if (eventId) return all.filter(s => s.event_id === eventId);
    return all;
  }

  private scoreSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  public saveScoreRecord(score: ScoreRecord) {
    if (!score.learner_id) {
      console.warn('[StorageService] Cannot save score without learner_id');
      return;
    }

    const all = this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    const juryKey = score.jury_id || score.juror_name || 'default_jury';

    // Validation and rubric normalization
    const research = Math.max(0, Math.min(30, Number(score.research_constituency ?? 0)));
    const relevance = Math.max(0, Math.min(20, Number(score.relevance_agenda ?? 0)));
    const comm = Math.max(0, Math.min(20, Number(score.communication_delivery ?? 0)));
    const conduct = Math.max(0, Math.min(12, Number(score.parliamentary_conduct ?? 0)));
    const originality = Math.max(0, Math.min(12, Number(score.originality_preparation ?? 0)));
    const timeMgmt = Math.max(0, Math.min(6, Number(score.time_management ?? 0)));
    
    // Scale or calculate total
    const computedTotal = research + relevance + comm + conduct + originality + timeMgmt;
    const finalTotal = computedTotal > 0 ? computedTotal : (score.total ?? 0);

    const normalizedScore: ScoreRecord = {
      ...score,
      id: score.id || uid('score'),
      event_id: score.event_id || '',
      learner_id: score.learner_id,
      jury_id: score.jury_id || 'default_jury',
      juror_name: score.juror_name || 'Juror',
      research_constituency: research,
      relevance_agenda: relevance,
      communication_delivery: comm,
      parliamentary_conduct: conduct,
      originality_preparation: originality,
      time_management: timeMgmt,
      total: finalTotal,
      updated_at: new Date().toISOString()
    };

    // Composite key match: (event_id, learner_id, jury_id)
    const idx = all.findIndex(s => {
      if (s.id && normalizedScore.id && s.id === normalizedScore.id) return true;
      const sJury = s.jury_id || s.juror_name || 'default_jury';
      return (
        s.learner_id === normalizedScore.learner_id &&
        (!normalizedScore.event_id || !s.event_id || s.event_id === normalizedScore.event_id) &&
        sJury === juryKey
      );
    });

    if (idx >= 0) {
      all[idx] = { ...all[idx], ...normalizedScore };
    } else {
      all.push(normalizedScore);
    }
    this.setItem(STORAGE_KEYS.SCORES, all);
    this.notify();

    if (normalizedScore.event_id) {
      this.scheduleScoreSync(normalizedScore.event_id);
    }
  }

  // Debounced read-merge-write to Supabase to prevent parallel juror clobbering
  private scheduleScoreSync(eventId: string) {
    if (!supabase || !eventId) return;
    const existingTimer = this.scoreSyncTimers.get(eventId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      this.scoreSyncTimers.delete(eventId);
      if (!supabase) return;
      try {
        // Fetch existing scores from Supabase to merge rather than clobber
        const { data: evData } = await supabase
          .from('college_events')
          .select('social_coverage')
          .eq('id', eventId)
          .single();

        const remoteSC = (evData?.social_coverage || {}) as Record<string, any>;
        const remoteScores = Array.isArray(remoteSC.scores) ? (remoteSC.scores as ScoreRecord[]) : [];
        const localScores = this.getScores(eventId);

        // Merge by composite key: (event_id, learner_id, jury_id)
        const scoreMap = new Map<string, ScoreRecord>();
        remoteScores.forEach(s => {
          const jKey = s.jury_id || s.juror_name || 'default_jury';
          scoreMap.set(`${s.event_id || eventId}:::${s.learner_id}:::${jKey}`, s);
        });
        localScores.forEach(s => {
          const jKey = s.jury_id || s.juror_name || 'default_jury';
          const k = `${s.event_id || eventId}:::${s.learner_id}:::${jKey}`;
          const existing = scoreMap.get(k);
          if (!existing) {
            scoreMap.set(k, s);
          } else {
            const localTime = new Date(s.updated_at || 0).getTime();
            const remoteTime = new Date(existing.updated_at || 0).getTime();
            if (localTime >= remoteTime) {
              scoreMap.set(k, s);
            }
          }
        });

        const mergedScores = Array.from(scoreMap.values());
        this.setItem(STORAGE_KEYS.SCORES, [
          ...this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, []).filter(s => s.event_id !== eventId),
          ...mergedScores
        ]);

        await supabase
          .from('college_events')
          .update({
            social_coverage: {
              ...remoteSC,
              scores: mergedScores,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', eventId);
      } catch (err) {
        console.warn('[StorageService] Error syncing scores to Supabase:', err);
      }
    }, 400);

    this.scoreSyncTimers.set(eventId, timer);
  }

  // Multi-juror rubric aggregation engine (Issue #3)
  public getAggregatedScores(eventId?: string): Record<string, AggregatedScore> {
    const scores = this.getScores(eventId);
    const learners = this.getLearners(eventId);
    const learnerMap = new Map<string, Learner>();
    learners.forEach(l => learnerMap.set(l.id, l));

    const aggMap: Record<string, AggregatedScore> = {};

    scores.forEach(s => {
      if (!s.learner_id) return;
      const learner = learnerMap.get(s.learner_id);
      const name = s.learner_name || learner?.full_name || 'Delegate';
      const party = s.party_name || learner?.party_name || 'Independent';
      const bench = s.bench || learner?.bench || 'Ruling';

      if (!aggMap[s.learner_id]) {
        aggMap[s.learner_id] = {
          learner_id: s.learner_id,
          event_id: s.event_id || eventId || '',
          learner_name: name,
          party_name: party,
          bench,
          juror_count: 0,
          juror_names: [],
          avg_research: 0,
          avg_relevance: 0,
          avg_comm: 0,
          avg_conduct: 0,
          avg_originality: 0,
          avg_time: 0,
          avg_total: 0,
          updated_at: s.updated_at || new Date().toISOString()
        };
      }

      const agg = aggMap[s.learner_id];
      const jName = s.juror_name || s.jury_id || `Juror ${agg.juror_count + 1}`;
      if (!agg.juror_names.includes(jName)) {
        agg.juror_names.push(jName);
      }
    });

    // Compute arithmetic mean for all 6 rubrics and total across all jurors
    Object.keys(aggMap).forEach(lid => {
      const agg = aggMap[lid];
      const learnerScores = scores.filter(s => s.learner_id === lid);
      const count = learnerScores.length || 1;
      agg.juror_count = count;

      let sumResearch = 0;
      let sumRelevance = 0;
      let sumComm = 0;
      let sumConduct = 0;
      let sumOriginality = 0;
      let sumTime = 0;
      let sumTotal = 0;
      let latest = learnerScores[0];

      learnerScores.forEach(s => {
        sumResearch += Number(s.research_constituency || 0);
        sumRelevance += Number(s.relevance_agenda || 0);
        sumComm += Number(s.communication_delivery || 0);
        sumConduct += Number(s.parliamentary_conduct || 0);
        sumOriginality += Number(s.originality_preparation || 0);
        sumTime += Number(s.time_management || 0);
        sumTotal += Number(s.total || 0);
        if (new Date(s.updated_at || 0).getTime() > new Date(latest?.updated_at || 0).getTime()) {
          latest = s;
        }
      });

      agg.avg_research = Number((sumResearch / count).toFixed(1));
      agg.avg_relevance = Number((sumRelevance / count).toFixed(1));
      agg.avg_comm = Number((sumComm / count).toFixed(1));
      agg.avg_conduct = Number((sumConduct / count).toFixed(1));
      agg.avg_originality = Number((sumOriginality / count).toFixed(1));
      agg.avg_time = Number((sumTime / count).toFixed(1));
      agg.avg_total = Number((sumTotal / count).toFixed(1));
      agg.latest_score = latest;
      agg.updated_at = latest?.updated_at || agg.updated_at;
    });

    return aggMap;
  }

  // ── VOTE AUDIT TRAIL (Issue #7: Monotonic Audit Log) ──
  public recordVoteAuditEntry(entry: VoteAuditEntry) {
    const all = this.getItem<VoteAuditEntry[]>(STORAGE_KEYS.VOTE_AUDIT_LOG, []);
    // Prevent duplicate audit entries by voter and poll
    if (all.some(a => a.poll_id === entry.poll_id && a.voter_id === entry.voter_id)) {
      return;
    }
    all.push(entry);
    this.setItem(STORAGE_KEYS.VOTE_AUDIT_LOG, all);
  }

  public getVoteAuditLog(eventId?: string, pollId?: string): VoteAuditEntry[] {
    const all = this.getItem<VoteAuditEntry[]>(STORAGE_KEYS.VOTE_AUDIT_LOG, []);
    return all.filter(a => {
      if (eventId && a.event_id !== eventId) return false;
      if (pollId && a.poll_id !== pollId) return false;
      return true;
    });
  }

  public resetScores(eventId?: string) {
    if (eventId) {
      const all = this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
      const remaining = all.filter(s => s.event_id && s.event_id !== eventId);
      this.setItem(STORAGE_KEYS.SCORES, remaining);
      this.syncEventStateToSupabase(eventId);
    } else {
      this.setItem(STORAGE_KEYS.SCORES, []);
    }
  }

  // ── PROJECTOR DISPLAY STUDIO ──────────────────────────────────────────────

  public getProjectorSettings(eventId?: string): ProjectorStudioSettings {
    const defaultSettings: ProjectorStudioSettings = {
      displayScene: 'auto',
      tickerMessage: 'Welcome Delegates to the Legislative Assembly 2026',
      isTickerActive: true,
      tickerStyle: 'marquee',
      showTricolorHeader: true,
      showClock: true,
      showSpeakerBadge: true,
      customWelcomeTitle: 'TN Legislative Assembly'
    };

    if (eventId) {
      const ev = this.getEvents().find(e => e.id === eventId);
      const sc = (ev?.social_coverage || {}) as Record<string, any>;
      if (sc.projector_settings) return sc.projector_settings;
      const local = this.getItem<ProjectorStudioSettings | null>(`tn_assembly_projector_studio_${eventId}`, null);
      if (local) return local;
    }
    const fallback = this.getItem<ProjectorStudioSettings | null>('tn_assembly_projector_studio_v1', null);
    return fallback || defaultSettings;
  }

  public async saveProjectorSettings(eventId: string, settings: ProjectorStudioSettings): Promise<void> {
    const key = eventId ? `tn_assembly_projector_studio_${eventId}` : 'tn_assembly_projector_studio_v1';
    this.setItem(key, settings);
    this.setItem('tn_assembly_projector_studio_v1', settings);

    const events = this.getEvents();
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      const sc = (ev.social_coverage || {}) as Record<string, any>;
      ev.social_coverage = { ...sc, projector_settings: settings };
      this.setItem(STORAGE_KEYS.EVENTS, events);
    }
    this.notify();

    if (supabase && this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'projector_update',
          payload: { eventId, settings }
        });
      } catch (e) {
        console.warn('Realtime broadcast projector_update failed:', e);
      }
    }

    if (eventId) {
      await this.syncEventStateToSupabase(eventId);
    }
  }

  public async triggerSpeakerBell(eventId?: string): Promise<void> {
    const now = Date.now();
    if (eventId) {
      this.setItem(`tn_assembly_last_bell_${eventId}`, now);
      const events = this.getEvents();
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        const sc = (ev.social_coverage || {}) as Record<string, any>;
        ev.social_coverage = { ...sc, last_bell_ring: now };
        this.setItem(STORAGE_KEYS.EVENTS, events);
        await this.syncEventStateToSupabase(eventId);
      }
    }

    if (supabase && this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'speaker_bell',
          payload: { eventId, timestamp: now }
        });
      } catch (e) {
        console.warn('Realtime broadcast speaker_bell failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tn_assembly_speaker_bell', { detail: { eventId, timestamp: now } }));
    }
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────

  public getChatMessages(eventId?: string): ChatMessage[] {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT);
    if (eventId) return all.filter(c => c.event_id === eventId);
    return all;
  }

  public sendChatMessage(eventId: string, senderName: string, senderRole: string, message: string, isAnnouncement = false): ChatMessage {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT);
    const newMsg: ChatMessage = {
      id: uid('chat'),
      event_id: eventId,
      sender_name: senderName,
      sender_role: senderRole,
      message,
      is_announcement: isAnnouncement,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    all.push(newMsg);
    this.setItem(STORAGE_KEYS.CHAT, all);
    return newMsg;
  }

  // ── FEEDBACK ──────────────────────────────────────────────────────────────

  public getFeedback(eventId?: string): FeedbackEntry[] {
    const all = this.getItem<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
    if (eventId) return all.filter(f => f.event_id === eventId);
    return all;
  }

  public submitFeedback(fb: Partial<FeedbackEntry>): FeedbackEntry {
    const all = this.getItem<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
    const newFb: FeedbackEntry = {
      id: uid('fb'),
      event_id: fb.event_id || '',
      delegate_name: fb.delegate_name || 'Anonymous Delegate',
      rating: fb.rating || 5,
      debate_quality: fb.debate_quality || 5,
      logistics_rating: fb.logistics_rating || 5,
      comments: fb.comments || '',
      created_at: new Date().toISOString()
    };
    all.unshift(newFb);
    this.setItem(STORAGE_KEYS.FEEDBACK, all);
    return newFb;
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────

  public getTeam(eventId?: string): TeamMember[] {
    const storedTeam = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    const coords = this.getCoordinators();
    const events = this.getEvents();

    const mergedMap = new Map<string, TeamMember>();

    // 1. Add all explicitly stored team members
    storedTeam.forEach(t => {
      const key = `${t.event_id || ''}_${(t.email || '').toLowerCase()}`;
      mergedMap.set(key, t);
    });

    // 2. Dynamically merge registered Coordinators from STORAGE_KEYS.COORDINATORS
    coords.forEach(c => {
      if (c.email) {
        const key = `${c.event_id || ''}_${c.email.toLowerCase()}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            id: c.id || `tm_coord_${c.email}`,
            event_id: c.event_id || '',
            name: c.name || 'Event Coordinator',
            email: c.email.toLowerCase(),
            role: 'Coordinator',
            department: 'Election Administration',
            access_code: c.raw_temp_password || c.password_hash || 'coord123',
            created_at: new Date().toISOString()
          });
        }
      }
    });

    // 3. Dynamically merge assigned Coordinator from STORAGE_KEYS.EVENTS
    events.forEach(ev => {
      if (ev.assigned_coordinator_email) {
        const emailLower = ev.assigned_coordinator_email.toLowerCase();
        const key = `${ev.id}_${emailLower}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            id: `tm_ev_coord_${ev.id}`,
            event_id: ev.id,
            name: ev.assigned_coordinator_name || 'Assembly Coordinator',
            email: emailLower,
            role: 'Coordinator',
            department: 'Election Administration',
            access_code: 'coord123',
            created_at: ev.created_at || new Date().toISOString()
          });
        }
      }
    });

    const result = Array.from(mergedMap.values());
    if (eventId) {
      return result.filter(t => t.event_id === eventId);
    }
    return result;
  }

  public addTeamMember(tm: Partial<TeamMember>): { member: TeamMember; initialPassword?: string } {
    const all = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    const cleanEmail = (tm.email || '').trim().toLowerCase();
    const eventId = tm.event_id || '';

    if (cleanEmail && eventId) {
      const duplicate = all.find(t => t.event_id === eventId && (t.email || '').trim().toLowerCase() === cleanEmail);
      if (duplicate) {
        throw new Error(`A team member with email "${cleanEmail}" is already assigned to this election.`);
      }
    }

    const finalPass = (tm.access_code && tm.access_code.trim()) ? tm.access_code.trim() : `TN${Math.floor(100000 + Math.random() * 900000)}`;
    const newTm: TeamMember = {
      id: uid('tm'),
      event_id: eventId,
      name: tm.name?.trim() || 'Team Member',
      role: (tm.role === 'Coordinator' ? 'Coordinator' : 'Organiser'),
      email: cleanEmail,
      phone: tm.phone?.trim() || '',
      department: tm.department?.trim() || (tm.role === 'Coordinator' ? 'Election Administration' : 'Event Operations'),
      access_code: finalPass,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    all.push(newTm);
    this.setItem(STORAGE_KEYS.TEAM, all);

    // Sync all team members (Organiser & Coordinator) to Coordinators list so they can log in via Organizer Sign In
    const coords = this.getCoordinators();
    const existingIdx = coords.findIndex(c => c.email.toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      coords[existingIdx] = {
        ...coords[existingIdx],
        name: newTm.name,
        password_hash: finalPass,
        raw_temp_password: finalPass,
        event_id: eventId
      };
    } else {
      coords.push({
        id: uid('coord'),
        event_id: eventId,
        name: newTm.name,
        email: newTm.email,
        password_hash: finalPass,
        raw_temp_password: finalPass
      });
    }
    this.setItem(STORAGE_KEYS.COORDINATORS, coords);

    return { member: newTm, initialPassword: finalPass };
  }

  public updateTeamMember(tm: Partial<TeamMember> & { id: string }): TeamMember {
    const all = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    const idx = all.findIndex(t => t.id === tm.id);
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...tm,
        updated_at: new Date().toISOString()
      };
      this.setItem(STORAGE_KEYS.TEAM, all);

      if (all[idx].email) {
        const coords = this.getCoordinators();
        const cIdx = coords.findIndex(c => c.email.toLowerCase() === all[idx].email.toLowerCase());
        if (cIdx !== -1) {
          coords[cIdx] = {
            ...coords[cIdx],
            name: all[idx].name,
            password_hash: all[idx].access_code || coords[cIdx].password_hash
          };
          this.setItem(STORAGE_KEYS.COORDINATORS, coords);
        }
      }
      return all[idx];
    }
    return tm as TeamMember;
  }

  public deleteTeamMember(id: string, eventId?: string) {
    const fullTeam = this.getTeam(eventId);
    const targetMember = fullTeam.find(t => t.id === id);
    if (!targetMember) return;

    const targetEventId = eventId || targetMember.event_id;
    if (targetMember.role === 'Coordinator') {
      const eventCoordinators = fullTeam.filter(t => t.event_id === targetEventId && t.role === 'Coordinator');
      if (eventCoordinators.length <= 1) {
        throw new Error('At least one Coordinator must remain assigned to this election.');
      }
    }

    const cleanEmail = targetMember.email.toLowerCase();

    // 1. Remove from stored TEAM list
    const storedTeam = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    const updatedTeam = storedTeam.filter(t => t.id !== id && (t.email || '').toLowerCase() !== cleanEmail);
    this.setItem(STORAGE_KEYS.TEAM, updatedTeam);

    // 2. Remove from COORDINATORS list if present
    const coords = this.getCoordinators().filter(c => c.email.toLowerCase() !== cleanEmail);
    this.setItem(STORAGE_KEYS.COORDINATORS, coords);
  }

  // ── AUTO-ALLOCATION & RESET ───────────────────────────────────────────────

  public async allocatePartiesForEvent(
    eventId: string,
    options: PartyAllocationOptions = {}
  ): Promise<AllocationResult> {
    if (this.getAllocationLock(eventId)) {
      throw new Error('Allocation is currently locked by Assembly Coordinator.');
    }

    const eventLearners = this.getLearners(eventId);
    const eventParties = this.getParties(eventId);

    const result = allocateParties(eventLearners, eventParties, options);

    // Sync updated parties to Supabase
    if (result.updatedParties && result.updatedParties.length > 0) {
      const allParties = this.getParties();
      const partyMap = new Map(result.updatedParties.map(p => [p.id, p]));
      const nextParties = allParties.map(p => partyMap.get(p.id) || p);
      this.setItem(STORAGE_KEYS.PARTIES, nextParties);
      await this.sbUpsertBatch('political_parties', result.updatedParties as unknown as Record<string, unknown>[]);
    }

    // Sync updated learners to Supabase
    if (result.updatedLearners.length > 0) {
      const res = await this.sbUpsertBatch('learners', result.updatedLearners as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase allocatePartiesForEvent Error]:', res.error);
        throw new Error(`Failed to save party allocations to database: ${res.error?.message || 'Database error'}`);
      }
    }

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));
    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    this.notify();
    return result;
  }

  public async allocateCommitteesForEvent(
    eventId: string,
    options: CommitteeAllocationOptions = {}
  ): Promise<{ updatedLearners: Learner[]; stats: Record<string, number> }> {
    if (this.getAllocationLock(eventId)) {
      throw new Error('Allocation is currently locked by Assembly Coordinator.');
    }

    const eventLearners = this.getLearners(eventId);
    const eventCommittees = this.getCommittees(eventId);

    const result = allocateCommittees(eventLearners, eventCommittees, options);

    // Sync updated learners to Supabase
    if (result.updatedLearners.length > 0) {
      const res = await this.sbUpsertBatch('learners', result.updatedLearners as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase allocateCommitteesForEvent Error]:', res.error);
        throw new Error(`Failed to save committee allocations to database: ${res.error?.message || 'Database error'}`);
      }
    }

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));
    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    this.notify();
    return result;
  }

  public async allocateConstituenciesForEvent(
    eventId: string,
    options: ConstituencyAllocationOptions = {}
  ): Promise<{ updatedLearners: Learner[]; stats: { totalAllocated: number; constituenciesUsed: number } }> {
    if (this.getAllocationLock(eventId)) {
      throw new Error('Allocation is currently locked by Assembly Coordinator.');
    }

    const eventLearners = this.getLearners(eventId);
    const result = allocateConstituencies(eventLearners, options);

    // Sync updated learners to Supabase
    if (result.updatedLearners.length > 0) {
      const res = await this.sbUpsertBatch('learners', result.updatedLearners as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase allocateConstituenciesForEvent Error]:', res.error);
        throw new Error(`Failed to save constituency allocations to database: ${res.error?.message || 'Database error'}`);
      }
    }

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));
    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    this.notify();
    return result;
  }

  public async executeAllocationForEvent(eventId: string, rulingRatio = 0.55) {
    if (this.getAllocationLock(eventId)) {
      throw new Error('Allocation is currently locked by Assembly Coordinator.');
    }

    const eventLearners = this.getLearners(eventId);
    const eventParties = this.getParties(eventId);
    const eventCommittees = this.getCommittees(eventId);

    const result = runAutoAllocation(eventLearners, eventParties, eventCommittees, rulingRatio);

    // If auto-allocation assigned benches or updated parties, persist updated parties
    if (result.updatedParties && result.updatedParties.length > 0) {
      const allParties = this.getParties();
      const partyMap = new Map(result.updatedParties.map(p => [p.id, p]));
      const nextParties = allParties.map(p => partyMap.get(p.id) || p);
      this.setItem(STORAGE_KEYS.PARTIES, nextParties);
      await this.sbUpsertBatch('political_parties', result.updatedParties as unknown as Record<string, unknown>[]);
    }

    // Sync updated learners to Supabase
    if (result.updatedLearners.length > 0) {
      const res = await this.sbUpsertBatch('learners', result.updatedLearners as unknown as Record<string, unknown>[]);
      if (!res.success) {
        console.error('❌ [Supabase executeAllocationForEvent Error]:', res.error);
        throw new Error(`Failed to save allocations to database: ${res.error?.message || 'Database error'}`);
      }
    }

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));
    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    this.notify();
    return result;
  }

  public async resetAllocationsForEvent(eventId: string): Promise<void> {
    if (this.getAllocationLock(eventId)) {
      throw new Error('Allocation is currently locked by Assembly Coordinator.');
    }

    if (supabase) {
      const { error } = await supabase
        .from('learners')
        .update({
          bench: null,
          party_id: null,
          party_name: null,
          constituency_number: null,
          constituency_name: null,
          district: null,
          role: 'Member of Legislative Assembly (MLA)',
          committee_id: null,
          committee_name: null
        })
        .eq('event_id', eventId);

      if (error) {
        console.error('❌ [Supabase resetAllocationsForEvent Error]:', error);
        throw new Error(`Failed to reset allocations in database: ${error.message}`);
      }
    }

    const all = this.getLearners().map(l => {
      if (l.event_id === eventId) {
        return {
          ...l,
          bench: undefined,
          party_id: undefined,
          party_name: undefined,
          constituency_number: undefined,
          constituency_name: undefined,
          district: undefined,
          role: 'Member of Legislative Assembly (MLA)',
          committee_id: undefined,
          committee_name: undefined
        };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    this.notify();
  }

  public rebalanceCommittees(eventId: string) {
    const learners = this.getLearners(eventId);
    const committees = this.getCommittees(eventId);
    if (committees.length === 0 || learners.length === 0) return;

    // Filter out Speaker and Deputy Speaker
    const eligibleLearners = learners.filter(l =>
      !l.role?.toLowerCase().includes('speaker')
    );

    // Group eligible learners by party
    const partyGroups: Record<string, Learner[]> = {};
    eligibleLearners.forEach(l => {
      const pKey = l.party_name || 'Independent';
      if (!partyGroups[pKey]) partyGroups[pKey] = [];
      partyGroups[pKey].push(l);
    });

    const updatedLearners: Learner[] = [];
    // Distribute each party evenly across committees
    Object.values(partyGroups).forEach(group => {
      group.forEach((learner, index) => {
        const comm = committees[index % committees.length];
        updatedLearners.push({
          ...learner,
          committee_id: comm.id,
          committee_name: comm.name
        });
      });
    });

    const updatedMap = new Map(updatedLearners.map(l => [l.id, l]));
    const allLearners = this.getLearners().map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, allLearners);
    this.notify();
  }

  // Helper to get active event ID if not explicitly passed
  private getActiveEventId(eventId?: string): string | undefined {
    if (eventId) return eventId;
    try {
      const saved = localStorage.getItem('tn_assembly_auth_session');
      if (saved) {
        const sess = JSON.parse(saved);
        if (sess?.currentEventId) return sess.currentEventId;
      }
    } catch { }
    const evs = this.getEvents();
    return evs.length > 0 ? evs[0].id : undefined;
  }

  // ── Security Locks (Allocation Lock, Registrations Frozen, Scores Locked) ──
  getAllocationLock(eventId?: string): boolean {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return false;

    const ev = this.getEvents().find(e => e.id === targetId);
    if (ev && typeof ev.is_locked === 'boolean') return ev.is_locked;
    const sc = ev?.social_coverage as Record<string, any> | undefined;
    if (sc && typeof sc.allocation_lock === 'boolean') return sc.allocation_lock;

    const raw = localStorage.getItem(`${STORAGE_KEYS.ALLOCATION_LOCK}_${targetId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw) === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async setAllocationLock(locked: boolean, eventId?: string): Promise<{ success: boolean; error?: any }> {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return { success: false, error: new Error('No target event found') };

    const key = `${STORAGE_KEYS.ALLOCATION_LOCK}_${targetId}`;
    const prevVal = this.getAllocationLock(targetId);

    // Optimistic local update for target event only
    this.setItem(key, locked);
    const lockTimestamps = this.getItem<Record<string, number>>(STORAGE_KEYS.LOCK_UPDATED_AT, {});
    lockTimestamps[`alloc_${targetId}`] = Date.now();
    this.setItem(STORAGE_KEYS.LOCK_UPDATED_AT, lockTimestamps);

    const events = this.getEvents().map(e => {
      if (e.id === targetId) {
        const sc = (e.social_coverage || {}) as Record<string, any>;
        return { ...e, is_locked: locked, social_coverage: { ...sc, allocation_lock: locked } };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.EVENTS, events);
    this.notify();

    if (supabase && isValidUuid(targetId)) {
      try {
        const ev = events.find(e => e.id === targetId);
        const { error } = await supabase
          .from('college_events')
          .update({
            is_locked: locked,
            social_coverage: ev?.social_coverage || { allocation_lock: locked }
          })
          .eq('id', targetId);

        if (error) {
          console.error('❌ [Supabase Lock Allocation Error]:', error);
          this.setItem(key, prevVal);
          const rollbackEvents = this.getEvents().map(e => {
            if (e.id === targetId) {
              const sc = (e.social_coverage || {}) as Record<string, any>;
              return { ...e, is_locked: prevVal, social_coverage: { ...sc, allocation_lock: prevVal } };
            }
            return e;
          });
          this.setItem(STORAGE_KEYS.EVENTS, rollbackEvents);
          this.notify();
          return { success: false, error };
        }
      } catch (err: any) {
        console.error('❌ [Supabase Lock Allocation Exception]:', err);
        this.setItem(key, prevVal);
        this.notify();
        return { success: false, error: err };
      }
    }
    return { success: true };
  }

  getRegistrationsFrozen(eventId?: string): boolean {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return false;

    const ev = this.getEvents().find(e => e.id === targetId);
    const sc = ev?.social_coverage as Record<string, any> | undefined;
    if (sc && typeof sc.registrations_frozen === 'boolean') {
      return sc.registrations_frozen;
    }

    const raw = localStorage.getItem(`${STORAGE_KEYS.REGISTRATIONS_FROZEN}_${targetId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw) === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async setRegistrationsFrozen(frozen: boolean, eventId?: string): Promise<{ success: boolean; error?: any }> {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return { success: false, error: new Error('No target event found') };

    const key = `${STORAGE_KEYS.REGISTRATIONS_FROZEN}_${targetId}`;
    const prevVal = this.getRegistrationsFrozen(targetId);

    // Optimistic local update for target event only
    this.setItem(key, frozen);
    const lockTimestamps = this.getItem<Record<string, number>>(STORAGE_KEYS.LOCK_UPDATED_AT, {});
    lockTimestamps[`reg_${targetId}`] = Date.now();
    this.setItem(STORAGE_KEYS.LOCK_UPDATED_AT, lockTimestamps);

    const events = this.getEvents().map(e => {
      if (e.id === targetId) {
        const sc = (e.social_coverage || {}) as Record<string, any>;
        return { ...e, social_coverage: { ...sc, registrations_frozen: frozen } };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.EVENTS, events);
    this.notify();

    if (supabase && isValidUuid(targetId)) {
      try {
        const ev = events.find(e => e.id === targetId);
        const { error } = await supabase
          .from('college_events')
          .update({
            social_coverage: ev?.social_coverage || { registrations_frozen: frozen }
          })
          .eq('id', targetId);

        if (error) {
          console.error('❌ [Supabase Freeze Registrations Error]:', error);
          this.setItem(key, prevVal);
          const rollbackEvents = this.getEvents().map(e => {
            if (e.id === targetId) {
              const sc = (e.social_coverage || {}) as Record<string, any>;
              return { ...e, social_coverage: { ...sc, registrations_frozen: prevVal } };
            }
            return e;
          });
          this.setItem(STORAGE_KEYS.EVENTS, rollbackEvents);
          this.notify();
          return { success: false, error };
        }
      } catch (err: any) {
        console.error('❌ [Supabase Freeze Registrations Exception]:', err);
        this.setItem(key, prevVal);
        this.notify();
        return { success: false, error: err };
      }
    }
    return { success: true };
  }

  getScoresLocked(eventId?: string): boolean {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return false;

    const ev = this.getEvents().find(e => e.id === targetId);
    const sc = ev?.social_coverage as Record<string, any> | undefined;
    if (sc && typeof sc.scores_locked === 'boolean') return sc.scores_locked;

    const raw = localStorage.getItem(`${STORAGE_KEYS.SCORES_LOCKED}_${targetId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw) === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async setScoresLocked(locked: boolean, eventId?: string): Promise<{ success: boolean; error?: any }> {
    const targetId = this.getActiveEventId(eventId);
    if (!targetId) return { success: false, error: new Error('No target event found') };

    const key = `${STORAGE_KEYS.SCORES_LOCKED}_${targetId}`;
    const prevVal = this.getScoresLocked(targetId);

    // Optimistic local update for target event only
    this.setItem(key, locked);
    const scoreLockTimestamps = this.getItem<Record<string, number>>(STORAGE_KEYS.LOCK_UPDATED_AT, {});
    scoreLockTimestamps[`score_${targetId}`] = Date.now();
    this.setItem(STORAGE_KEYS.LOCK_UPDATED_AT, scoreLockTimestamps);

    const events = this.getEvents().map(e => {
      if (e.id === targetId) {
        const sc = (e.social_coverage || {}) as Record<string, any>;
        return { ...e, social_coverage: { ...sc, scores_locked: locked } };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.EVENTS, events);
    this.notify();

    if (supabase && isValidUuid(targetId)) {
      try {
        const ev = events.find(e => e.id === targetId);
        const { error } = await supabase
          .from('college_events')
          .update({
            social_coverage: ev?.social_coverage || { scores_locked: locked }
          })
          .eq('id', targetId);

        if (error) {
          console.error('❌ [Supabase Lock Scores Error]:', error);
          this.setItem(key, prevVal);
          const rollbackEvents = this.getEvents().map(e => {
            if (e.id === targetId) {
              const sc = (e.social_coverage || {}) as Record<string, any>;
              return { ...e, social_coverage: { ...sc, scores_locked: prevVal } };
            }
            return e;
          });
          this.setItem(STORAGE_KEYS.EVENTS, rollbackEvents);
          this.notify();
          return { success: false, error };
        }
      } catch (err: any) {
        console.error('❌ [Supabase Lock Scores Exception]:', err);
        this.setItem(key, prevVal);
        this.notify();
        return { success: false, error: err };
      }
    }
    return { success: true };
  }

  // ── YUVA Desk Assignments ───────────────────────────────────────────────
  getYuvaAssignments(eventId?: string): any[] {
    if (!eventId) {
      const global = this.getItem<any[] | null>(STORAGE_KEYS.YUVA_ASSIGNMENTS, null);
      return (global && Array.isArray(global)) ? global : [];
    }
    const key = `${STORAGE_KEYS.YUVA_ASSIGNMENTS}_${eventId}`;
    const primary = this.getItem<any[] | null>(key, null);
    if (primary && Array.isArray(primary)) return primary;

    return [];
  }

  setYuvaAssignments(assignments: any[], eventId?: string): void {
    if (!eventId) {
      this.setItem(STORAGE_KEYS.YUVA_ASSIGNMENTS, assignments);
      this.notify();
      return;
    }
    const key = `${STORAGE_KEYS.YUVA_ASSIGNMENTS}_${eventId}`;
    this.setItem(key, assignments);

    // Persist to Supabase college_events social_coverage JSONB field
    if (supabase) {
      const events = this.getEvents();
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        const sc = (ev.social_coverage || {}) as any;
        const updatedEv = {
          ...ev,
          social_coverage: {
            ...sc,
            yuva_assignments: assignments
          }
        };
        this.updateEvent(updatedEv);
      }
    }

    this.notify();
  }

  /**
   * Explicit cache-busting and re-sync from Supabase.
   */
  public async forceRefresh(): Promise<void> {
    await this.syncFromSupabase();
  }

  // ── PARTY / COMMITTEE / JURY COUNTS (Database-sourced) ─────────────────────

  public getPartyCount(eventId: string): number {
    const learners = this.getLearners(eventId);
    return learners.filter(l => l.party_id || l.party_name).length;
  }

  public getCommitteeCount(eventId: string): number {
    const learners = this.getLearners(eventId);
    return learners.filter(l => l.committee_id || l.committee_name).length;
  }

  public getJuryCount(eventId: string): number {
    const jury = this.getJury(eventId);
    return jury.length;
  }

  public getUnassignedCount(eventId: string): number {
    const learners = this.getLearners(eventId);
    return learners.filter(l => !l.party_id && !l.party_name && !l.committee_id && !l.committee_name).length;
  }

  public getTotalAssignedCount(eventId: string): number {
    const learners = this.getLearners(eventId);
    return learners.filter(l => l.party_id || l.party_name || l.committee_id || l.committee_name).length;
  }

  public getAssignedPartyCounts(eventId: string): Record<string, number> {
    const learners = this.getLearners(eventId);
    const counts: Record<string, number> = {};
    learners.forEach(l => {
      if (l.party_id) counts[l.party_id] = (counts[l.party_id] || 0) + 1;
      if (l.party_name) counts[l.party_name] = (counts[l.party_name] || 0) + 1;
      if (l.bench) counts[l.bench] = (counts[l.bench] || 0) + 1;
    });
    return counts;
  }

  public getAssignedBenchCounts(eventId: string): Record<string, number> {
    const learners = this.getLearners(eventId);
    const counts: Record<string, number> = { Ruling: 0, Opposition: 0, Independent: 0 };
    learners.forEach(l => {
      if (l.bench === 'Ruling') counts.Ruling = (counts.Ruling || 0) + 1;
      else if (l.bench === 'Opposition') counts.Opposition = (counts.Opposition || 0) + 1;
      else if (l.bench === 'Independent') counts.Independent = (counts.Independent || 0) + 1;
    });
    return counts;
  }

  public getAssignedCommitteeCounts(eventId: string): Record<string, number> {
    const learners = this.getLearners(eventId);
    const counts: Record<string, number> = {};
    learners.forEach(l => {
      if (l.committee_id) counts[l.committee_id] = (counts[l.committee_id] || 0) + 1;
      if (l.committee_name) counts[l.committee_name] = (counts[l.committee_name] || 0) + 1;
    });
    return counts;
  }

  // ── DEADLINES CONFIGURATION ─────────────────────────────────────────
  public getEventDeadline(eventSlug: string): EventDeadline {
    const list: EventDeadline[] = this.getItem(STORAGE_KEYS.DEADLINES, []);

    if (list.length > 0) {
      // Find matching item or return primary deadline entry
      const cleanKey = (eventSlug || '').toLowerCase().trim();
      const found = list.find(d => {
        const s = (d.event_slug || '').toLowerCase().trim();
        const id = (d.event_id || '').toLowerCase().trim();
        return s === cleanKey || id === cleanKey || (cleanKey.length >= 3 && (s.includes(cleanKey) || cleanKey.includes(s)));
      }) || list[0];

      if (found.is_open === undefined) {
        found.is_open = true;
        found.status = 'OPEN';
      }
      return found;
    }

    const defaultOpen = new Date().toISOString();
    const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const created: EventDeadline = {
      id: genUuid(),
      event_id: eventSlug || 'jkkncet-tn-assembly-2026',
      event_slug: eventSlug || 'jkkncet-tn-assembly-2026',
      is_open: true,
      status: 'OPEN',
      questions_open_at: defaultOpen,
      questions_deadline_at: defaultDeadline,
      updated_at: new Date().toISOString()
    };
    this.setItem(STORAGE_KEYS.DEADLINES, [created]);
    return created;
  }

  public updateEventDeadlineStatus(eventSlug: string, isOpen: boolean): EventDeadline {
    const list: EventDeadline[] = this.getItem(STORAGE_KEYS.DEADLINES, []);
    const now = new Date().toISOString();

    const updatedStatus: 'OPEN' | 'CLOSED' = isOpen ? 'OPEN' : 'CLOSED';

    let target: EventDeadline;
    if (list.length > 0) {
      target = {
        ...list[0],
        event_slug: eventSlug || list[0].event_slug,
        is_open: isOpen,
        status: updatedStatus,
        updated_at: now
      };
    } else {
      target = {
        id: genUuid(),
        event_id: eventSlug || 'jkkncet-tn-assembly-2026',
        event_slug: eventSlug || 'jkkncet-tn-assembly-2026',
        is_open: isOpen,
        status: updatedStatus,
        questions_open_at: now,
        questions_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: now
      };
    }

    // Unconditionally update ALL deadline records in storage to this status
    const updatedList = list.length > 0
      ? list.map(item => ({ ...item, is_open: isOpen, status: updatedStatus, updated_at: now }))
      : [target];

    if (!updatedList.some(item => item.event_slug === eventSlug || item.event_id === eventSlug)) {
      updatedList.push(target);
    }

    this.setItem(STORAGE_KEYS.DEADLINES, updatedList);
    this.sbUpsert('event_deadlines', target as unknown as Record<string, unknown>);
    this.notify();
    return target;
  }

  public updateEventDeadline(eventSlug: string, openAt?: string, deadlineAt?: string, isOpen?: boolean): EventDeadline {
    const list: EventDeadline[] = this.getItem(STORAGE_KEYS.DEADLINES, []);
    const existing = list.length > 0 ? list[0] : this.getEventDeadline(eventSlug);

    const updated: EventDeadline = {
      ...existing,
      is_open: isOpen !== undefined ? isOpen : (existing.is_open !== undefined ? existing.is_open : true),
      status: (isOpen !== undefined ? isOpen : (existing.is_open !== undefined ? existing.is_open : true)) ? 'OPEN' : 'CLOSED',
      questions_open_at: openAt !== undefined ? openAt : existing.questions_open_at,
      questions_deadline_at: deadlineAt !== undefined ? deadlineAt : existing.questions_deadline_at,
      updated_at: new Date().toISOString()
    };

    this.setItem(STORAGE_KEYS.DEADLINES, [updated]);
    this.sbUpsert('event_deadlines', updated as unknown as Record<string, unknown>);
    this.notify();
    return updated;
  }

  // ── PROCEEDINGS QUESTIONS ───────────────────────────────────────────
  public getProceedingsQuestions(eventKey?: string): ProceedingsQuestion[] {
    const list: ProceedingsQuestion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, []);
    if (!eventKey) return list;
    return list.filter(q => q.event_id === eventKey || q.event_slug === eventKey);
  }

  public addProceedingsQuestion(question: Partial<ProceedingsQuestion>): ProceedingsQuestion {
    const list: ProceedingsQuestion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, []);
    const eventSlug = question.event_slug || (question.event_id ? this.getEvents().find(e => e.id === question.event_id)?.slug : undefined) || 'jkkncet-tn-assembly-2026';
    const eventId = question.event_id || (question.event_slug ? this.getEvents().find(e => e.slug === question.event_slug)?.id : undefined) || eventSlug;
    const newQuestion: ProceedingsQuestion = {
      id: question.id || genUuid(),
      event_id: eventId,
      event_slug: eventSlug,
      student_id: question.student_id,
      student_name: question.student_name || 'Hon. Member',
      bench: question.bench || 'Ruling',
      constituency: question.constituency || 'Assembly Delegate',
      ministry: question.ministry || 'Ministry of Education',
      question_text: question.question_text || '',
      question_type: question.question_type || 'Standard',
      status: question.status || 'Submitted',
      queue_order: question.queue_order || list.length + 1,
      created_at: new Date().toISOString()
    };

    list.unshift(newQuestion);
    this.setItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, list);
    this.sbUpsert('proceedings_questions', newQuestion as unknown as Record<string, unknown>);
    this.notify();
    return newQuestion;
  }

  public updateProceedingsQuestionStatus(questionId: string, status: 'Submitted' | 'Approved' | 'Starred' | 'Rejected'): void {
    const list: ProceedingsQuestion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, []);
    const updated = list.map(q => q.id === questionId ? { ...q, status } : q);
    this.setItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, updated);
    const target = updated.find(q => q.id === questionId);
    if (target) {
      this.sbUpsert('proceedings_questions', target as unknown as Record<string, unknown>);
    }
    this.notify();
  }

  public deleteProceedingsQuestion(questionId: string): void {
    const list: ProceedingsQuestion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, []);
    const filtered = list.filter(q => q.id !== questionId);
    this.setItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, filtered);
    if (supabase) {
      supabase.from('proceedings_questions').delete().eq('id', questionId).then(({ error }) => {
        if (error) console.warn('[Supabase] delete question error:', error.message);
      });
    }
    this.notify();
  }

  // ── PROCEEDINGS MOTIONS ─────────────────────────────────────────────
  public getProceedingsMotions(eventKey: string): ProceedingsMotion[] {
    const list: ProceedingsMotion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_MOTIONS, []);
    const cleanKey = (eventKey || '').toLowerCase().trim();
    if (!cleanKey) return list;
    return list.filter(m => {
      const mSlug = (m.event_slug || '').toLowerCase().trim();
      const mId = (m.event_id || '').toLowerCase().trim();
      if (!mSlug && !mId) return true;
      return (
        mSlug === cleanKey ||
        mId === cleanKey ||
        (cleanKey.length > 5 && (mSlug.includes(cleanKey) || cleanKey.includes(mSlug) || mId.includes(cleanKey) || cleanKey.includes(mSlug)))
      );
    });
  }

  public addProceedingsMotion(motion: Partial<ProceedingsMotion>): ProceedingsMotion {
    const list: ProceedingsMotion[] = this.getItem(STORAGE_KEYS.PROCEEDINGS_MOTIONS, []);
    const eventSlug = motion.event_slug || motion.event_id || 'jkkncet-tn-assembly-2026';
    const newMotion: ProceedingsMotion = {
      id: motion.id || genUuid(),
      event_id: eventSlug,
      event_slug: eventSlug,
      title: motion.title || 'Motion of Urgent Public Importance',
      proposed_by: motion.proposed_by || 'Hon. Member',
      bench: motion.bench || 'Ruling',
      committee_room: motion.committee_room || 'Main Assembly Chamber',
      content: motion.content || '',
      status: motion.status || 'Submitted',
      created_at: new Date().toISOString()
    };

    list.unshift(newMotion);
    this.setItem(STORAGE_KEYS.PROCEEDINGS_MOTIONS, list);
    this.sbUpsert('proceedings_motions', newMotion as unknown as Record<string, unknown>);
    this.notify();
    return newMotion;
  }
}

export const storageService = new StorageService();

if (typeof window !== 'undefined') {
  (window as any).storageService = storageService;
  (window as any).wipeTNAssemblyCache = () => storageService.wipeAllLocalCache();
}

/**
 * Dynamically resolves a learner's active party name using the active parties list.
 */
export function getResolvedPartyName(learner: Partial<Learner>, parties: Party[]): string {
  if (learner.party_id) {
    const found = parties.find(p => p.id === learner.party_id);
    if (found) return found.name;
  }
  if (learner.party_name) {
    const found = parties.find(p => p.name.toLowerCase() === learner.party_name?.toLowerCase());
    if (found) return found.name;
    return learner.party_name;
  }
  return '';
}

/**
 * Dynamically resolves a learner's active committee name using the active committees list.
 */
export function getResolvedCommitteeName(learner: Partial<Learner>, committees: Committee[]): string {
  if (learner.committee_id) {
    const found = committees.find(c => c.id === learner.committee_id);
    if (found) return found.name;
  }
  if (learner.committee_name) {
    const found = committees.find(c => c.name.toLowerCase() === learner.committee_name?.toLowerCase());
    if (found) return found.name;
    return learner.committee_name;
  }
  return '';
}

export const CANONICAL_ROLES = {
  CHIEF_MINISTER: 'Chief Minister',
  SPEAKER: 'Assembly Speaker',
  DEPUTY_SPEAKER: 'Deputy Speaker',
  LEADER_OF_OPPOSITION: 'Leader of Opposition'
} as const;

/**
 * Dynamically resolves a learner's bench based on direct bench field or party's bench.
 */
export function getResolvedLearnerBench(learner: Partial<Learner>, parties: Party[] = []): BenchType {
  if (parties && parties.length > 0) {
    if (learner.party_id) {
      const found = parties.find(p => p.id === learner.party_id);
      if (found?.bench) return found.bench;
    }
    if (learner.party_name) {
      const found = parties.find(p => p.name.trim().toLowerCase() === learner.party_name?.trim().toLowerCase());
      if (found?.bench) return found.bench;
    }
  }
  if (learner.bench) return learner.bench;
  return 'Independent';
}

/**
 * Normalizes any role string into a canonical role if it matches a core leadership position.
 */
export function normalizeLeadershipRole(role?: string): string {
  if (!role) return '';
  const r = role.trim().toLowerCase();
  if (r.includes('chief minister') || r === 'cm' || r.includes('leader of the house')) {
    return CANONICAL_ROLES.CHIEF_MINISTER;
  }
  if (r.includes('deputy speaker')) {
    return CANONICAL_ROLES.DEPUTY_SPEAKER;
  }
  if (r.includes('speaker') && !r.includes('deputy')) {
    return CANONICAL_ROLES.SPEAKER;
  }
  if (r.includes('opposition') || r.includes('lop') || r.includes('shadow leader')) {
    return CANONICAL_ROLES.LEADER_OF_OPPOSITION;
  }
  return role.trim();
}

export function isChiefMinisterRole(role?: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === 'chief minister' || r.includes('chief minister') || r.includes('leader of the house');
}

export function isSpeakerRole(role?: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return (r === 'assembly speaker' || r === 'speaker' || r.includes('speaker of')) && !r.includes('deputy');
}

export function isDeputySpeakerRole(role?: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === 'deputy speaker' || r.includes('deputy speaker');
}

export function isLeaderOfOppositionRole(role?: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return (
    r === 'leader of opposition' ||
    r === 'leader of the opposition' ||
    r === 'opposition leader' ||
    r.includes('leader of opposition') ||
    r.includes('leader of the opposition')
  );
}

export function isAssemblyRoleMatching(currentRole: string | undefined, targetRole: string): boolean {
  if (!currentRole || !targetRole) return false;
  if (isChiefMinisterRole(targetRole) && isChiefMinisterRole(currentRole)) return true;
  if (isDeputySpeakerRole(targetRole) && isDeputySpeakerRole(currentRole)) return true;
  if (isSpeakerRole(targetRole) && isSpeakerRole(currentRole)) return true;
  if (isLeaderOfOppositionRole(targetRole) && isLeaderOfOppositionRole(currentRole)) return true;

  if (currentRole.trim().toLowerCase() === targetRole.trim().toLowerCase()) return true;

  // Normalize ministerial titles:
  // e.g., "Minister for IT & AI", "IT & AI Minister", "Minister for Ministry Of AI And IT"
  const normalizeMinister = (s: string) =>
    s.toLowerCase()
      .replace(/^shadow\s+/i, '')
      .replace(/^(minister\s+(for|of)|union\s+minister\s+(for|of))\s+/i, '')
      .replace(/\s+minister$/i, '')
      .replace(/^ministry\s+(of|for)\s+/i, '')
      .replace(/\band\b/g, '&')
      .replace(/infrastracture/g, 'infrastructure')
      .replace(/ai\s*&\s*it/g, 'it&ai')
      .replace(/[^a-z0-9&]/g, '');

  const isCurrentShadow = currentRole.toLowerCase().includes('shadow');
  const isTargetShadow = targetRole.toLowerCase().includes('shadow');
  if (isCurrentShadow !== isTargetShadow) return false;

  return normalizeMinister(currentRole) === normalizeMinister(targetRole);
}


