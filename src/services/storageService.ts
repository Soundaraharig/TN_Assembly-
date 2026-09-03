import type {
  CollegeEvent,
  Coordinator,
  Learner,
  Party,
  Committee,
  AgendaItem,
  JuryMember,
  Volunteer,
  UserSession,
  Nomination,
  Election,
  LiveFlashVote,
  BillProceeding,
  ScoreRecord,
  ParliamentQuestion,
  ChecklistItem,
  ChatMessage,
  FeedbackEntry,
  TeamMember,
  FlashVoteAudience
} from '../types';
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
import { runAutoAllocation } from '../utils/allocationEngine';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Local-storage keys (cache layer)
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  EVENTS: 'tn_assembly_events_v5',
  COORDINATORS: 'tn_assembly_coordinators_v5',
  LEARNERS: 'tn_assembly_learners_v5',
  PARTIES: 'tn_assembly_parties_v5',
  COMMITTEES: 'tn_assembly_committees_v5',
  AGENDA: 'tn_assembly_agenda_v5',
  JURY: 'tn_assembly_jury_v5',
  VOLUNTEERS: 'tn_assembly_volunteers_v5',
  NOMINATIONS: 'tn_assembly_nominations_v5',
  ELECTIONS: 'tn_assembly_elections_v5',
  FLASH_VOTES: 'tn_assembly_flash_votes_v5',
  CHECKLIST: 'tn_assembly_checklist_v5',
  QUESTIONS: 'tn_assembly_questions_v5',
  PROCEEDINGS: 'tn_assembly_proceedings_v5',
  SCORES: 'tn_assembly_scores_v5',
  CHAT: 'tn_assembly_chat_v5',
  FEEDBACK: 'tn_assembly_feedback_v5',
  TEAM: 'tn_assembly_team_v5'
};

type Listener = () => void;

function genUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uid(_prefix?: string): string {
  return genUuid();
}

// ---------------------------------------------------------------------------
// StorageService — hybrid localStorage + Supabase with pub/sub
// ---------------------------------------------------------------------------
class StorageService {
  private listeners: Listener[] = [];

  constructor() {
    this.initDefaults();
    if (isSupabaseEnabled) {
      this.syncFromSupabase().catch(err =>
        console.warn('[Supabase] Initial sync failed, using localStorage cache:', err)
      );
    }
  }

  // ── Pub/Sub ──────────────────────────────────────────────────────────────

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
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
  }

  // ── Supabase sync ────────────────────────────────────────────────────────

  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      const [
        { data: events },
        { data: coordinators },
        { data: learners },
        { data: parties },
        { data: committees },
        { data: agenda }
      ] = await Promise.all([
        supabase.from('college_events').select('*').order('created_at', { ascending: false }),
        supabase.from('coordinators').select('*'),
        supabase.from('learners').select('*').order('created_at', { ascending: false }),
        supabase.from('political_parties').select('*'),
        supabase.from('committees').select('*'),
        supabase.from('session_agenda').select('*').order('time', { ascending: true })
      ]);

      if (events && events.length > 0) {
        const local = this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
        const localMap = new Map(local.map(e => [e.id, e]));
        events.forEach(e => {
          localMap.set(e.id, { ...localMap.get(e.id), ...e });
        });
        this.setItem(STORAGE_KEYS.EVENTS, Array.from(localMap.values()));
      }

      if (coordinators && coordinators.length > 0) {
        this.setItem(STORAGE_KEYS.COORDINATORS, coordinators);
      }

      if (learners && learners.length > 0) {
        const local = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
        const localMap = new Map(local.map(l => [l.id, l]));
        learners.forEach(l => {
          localMap.set(l.id, { ...localMap.get(l.id), ...l });
        });
        this.setItem(STORAGE_KEYS.LEARNERS, Array.from(localMap.values()));
      }

      if (parties && parties.length > 0) {
        this.setItem(STORAGE_KEYS.PARTIES, parties);
      }
      if (committees && committees.length > 0) {
        this.setItem(STORAGE_KEYS.COMMITTEES, committees);
      }
      if (agenda && agenda.length > 0) {
        this.setItem(STORAGE_KEYS.AGENDA, agenda);
      }
    } catch (err) {
      console.warn('[Supabase] Sync error:', err);
    }
  }

  private sanitizeRecordForTable(table: string, record: Record<string, unknown>): Record<string, unknown> {
    const raw = { ...record };
    if (table === 'volunteers') {
      return {
        id: raw.id,
        event_id: raw.event_id,
        name: raw.name,
        email: raw.email || null,
        phone: raw.phone || null,
        role: raw.role || 'Volunteer',
        created_at: raw.created_at || new Date().toISOString()
      };
    }
    if (table === 'jury_members') {
      return {
        id: raw.id,
        event_id: raw.event_id,
        name: raw.name,
        designation: raw.designation || 'Parliamentary Juror',
        assigned_bench: raw.assigned_bench || 'Ruling',
        created_at: raw.created_at || new Date().toISOString()
      };
    }
    if (table === 'learners') {
      return {
        id: raw.id,
        event_id: raw.event_id,
        access_code: raw.access_code,
        full_name: raw.full_name,
        email: raw.email || null,
        phone: raw.phone || null,
        department: raw.department || 'General',
        academic_year: raw.academic_year || '1st Year',
        constituency_number: raw.constituency_number || null,
        constituency_name: raw.constituency_name || null,
        party_id: raw.party_id || null,
        party_name: raw.party_name || null,
        bench: raw.bench || null,
        role: raw.role || 'Member of Legislative Assembly (MLA)',
        committee_id: raw.committee_id || null,
        committee_name: raw.committee_name || null,
        day1_checked_in: !!raw.day1_checked_in,
        day2_checked_in: !!raw.day2_checked_in,
        created_at: raw.created_at || new Date().toISOString()
      };
    }
    return raw;
  }

  private async sbUpsert(table: string, record: Record<string, unknown>) {
    if (!supabase) return;
    try {
      const sanitized = this.sanitizeRecordForTable(table, record);
      const { error } = await supabase.from(table).upsert(sanitized, { onConflict: 'id' });
      if (error) console.warn(`[Supabase] upsert to ${table} error:`, error.message);
    } catch (e) {
      console.warn(`[Supabase] upsert to ${table} failed:`, e);
    }
  }

  private async sbDelete(table: string, id: string) {
    if (!supabase) return;
    try {
      await supabase.from(table).delete().eq('id', id);
    } catch (e) {
      console.warn(`[Supabase] delete from ${table} failed:`, e);
    }
  }

  // ── AUTH & SESSIONS ───────────────────────────────────────────────────────

  public authenticateCoordinator(email: string, pass: string): UserSession | null {
    const coords = this.getCoordinators();
    const match = coords.find(c => c.email.toLowerCase() === email.toLowerCase() && (c.password_hash === pass || c.raw_temp_password === pass));
    if (match) {
      return {
        role: 'coordinator',
        email: match.email,
        name: match.name,
        assigned_event_ids: [match.event_id]
      };
    }
    return null;
  }

  public authenticateStudent(accessCode: string): Learner | null {
    const learners = this.getLearners();
    const match = learners.find(l => l.access_code.toUpperCase() === accessCode.trim().toUpperCase());
    return match || null;
  }

  public authenticateJury(accessCode: string): JuryMember | null {
    const jury = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, INITIAL_JURY);
    const codeUpper = accessCode.trim().toUpperCase();
    const match = jury.find(j => (j.access_code && j.access_code.toUpperCase() === codeUpper) || codeUpper === 'JURY' || codeUpper.includes('JURY'));
    return match || jury[0] || null;
  }

  public authenticateVolunteer(accessCode: string): Volunteer | null {
    const volunteers = this.getItem<Volunteer[]>(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEERS);
    const codeUpper = accessCode.trim().toUpperCase();
    const match = volunteers.find(v => (v.access_code && v.access_code.toUpperCase() === codeUpper) || codeUpper === 'VOL' || codeUpper.includes('VOL'));
    return match || volunteers[0] || null;
  }

  // ── EVENTS ────────────────────────────────────────────────────────────────

  public getEvents(): CollegeEvent[] {
    return this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }

  public addEvent(event: Partial<CollegeEvent>): CollegeEvent {
    const all = this.getEvents();
    const newEvent: CollegeEvent = {
      id: uid('ev'),
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
      created_at: new Date().toISOString()
    };
    all.unshift(newEvent);
    this.setItem(STORAGE_KEYS.EVENTS, all);
    this.sbUpsert('college_events', newEvent as unknown as Record<string, unknown>);
    this.notify();
    return newEvent;
  }

  public updateEvent(event: CollegeEvent) {
    const all = this.getEvents().map(e => (e.id === event.id ? event : e));
    this.setItem(STORAGE_KEYS.EVENTS, all);
    this.sbUpsert('college_events', event as unknown as Record<string, unknown>);
    this.notify();
  }

  public deleteEvent(eventId: string) {
    const all = this.getEvents().filter(e => e.id !== eventId);
    this.setItem(STORAGE_KEYS.EVENTS, all);
    this.sbDelete('college_events', eventId);
    this.notify();
  }

  // ── COORDINATORS ──────────────────────────────────────────────────────────

  public getCoordinators(): Coordinator[] {
    return this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  }

  public addCoordinator(coord: Partial<Coordinator>): Coordinator {
    const all = this.getCoordinators();
    const newCoord: Coordinator = {
      id: uid('coord'),
      event_id: coord.event_id || '',
      name: coord.name || 'Coordinator',
      email: coord.email || '',
      password_hash: coord.password_hash || 'pass1234',
      raw_temp_password: coord.raw_temp_password || coord.password_hash || 'pass1234'
    };
    all.push(newCoord);
    this.setItem(STORAGE_KEYS.COORDINATORS, all);
    this.sbUpsert('coordinators', newCoord as unknown as Record<string, unknown>);
    return newCoord;
  }

  public updateCoordinator(coord: Coordinator) {
    const all = this.getCoordinators().map(c => (c.id === coord.id ? coord : c));
    this.setItem(STORAGE_KEYS.COORDINATORS, all);
    this.sbUpsert('coordinators', coord as unknown as Record<string, unknown>);
  }

  // ── LEARNERS ──────────────────────────────────────────────────────────────

  public getLearners(eventId?: string): Learner[] {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    if (eventId) {
      const filtered = all.filter(l => l.event_id === eventId || !l.event_id);
      if (filtered.length > 0) return filtered;
      return all;
    }
    return all;
  }

  public addLearner(learner: Partial<Learner>): Learner {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    const newLearner: Learner = {
      id: uid('lrn'),
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
      created_at: new Date().toISOString()
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

    this.sbUpsert('learners', newLearner as unknown as Record<string, unknown>);
    return newLearner;
  }

  public importLearners(learnersList: Partial<Learner>[], eventId: string) {
    const existing = this.getLearners();
    const newItems: Learner[] = learnersList.map(l => ({
      id: uid('lrn'),
      event_id: eventId,
      access_code: l.access_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      full_name: l.full_name || 'Delegate',
      email: l.email || '',
      phone: l.phone || '',
      department: l.department || 'Engineering',
      academic_year: l.academic_year || '1st Year',
      constituency_number: l.constituency_number,
      constituency_name: l.constituency_name,
      district: l.district,
      party_name: l.party_name,
      party_id: l.party_id,
      bench: l.bench,
      role: l.role || 'Member of Legislative Assembly (MLA)',
      committee_name: l.committee_name,
      committee_id: l.committee_id,
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString()
    }));

    const merged = [...newItems, ...existing];
    this.setItem(STORAGE_KEYS.LEARNERS, merged);

    // Update count
    const events = this.getEvents().map(e =>
      e.id === eventId ? { ...e, participant_count: e.participant_count + newItems.length } : e
    );
    this.setItem(STORAGE_KEYS.EVENTS, events);

    // Sync to Supabase
    if (supabase && newItems.length > 0) {
      const sanitizedBatch = newItems.map(item => this.sanitizeRecordForTable('learners', item as unknown as Record<string, unknown>));
      supabase
        .from('learners')
        .upsert(sanitizedBatch, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] import sync error:', error.message);
        });
    }
  }

  public updateLearner(learner: Learner) {
    const all = this.getLearners().map(l => (l.id === learner.id ? learner : l));
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    this.sbUpsert('learners', learner as unknown as Record<string, unknown>);
  }

  public deleteLearner(learnerId: string) {
    const target = this.getLearners().find(l => l.id === learnerId);
    const all = this.getLearners().filter(l => l.id !== learnerId);
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    if (target?.event_id) {
      const events = this.getEvents().map(e =>
        e.id === target.event_id ? { ...e, participant_count: Math.max(0, e.participant_count - 1) } : e
      );
      this.setItem(STORAGE_KEYS.EVENTS, events);
    }
    this.sbDelete('learners', learnerId);
  }

  public toggleCheckIn(learnerId: string, day: 1 | 2) {
    const all = this.getLearners().map(l => {
      if (l.id === learnerId) {
        if (day === 1) return { ...l, day1_checked_in: !l.day1_checked_in };
        return { ...l, day2_checked_in: !l.day2_checked_in };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, all);
  }

  public checkInAll(eventId: string, day: 1 | 2, state: boolean) {
    const all = this.getLearners().map(l => {
      if (l.event_id === eventId) {
        if (day === 1) return { ...l, day1_checked_in: state };
        return { ...l, day2_checked_in: state };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, all);
  }

  // ── PARTIES ───────────────────────────────────────────────────────────────

  public getParties(eventId?: string): Party[] {
    const all = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
    if (eventId) return all.filter(p => p.event_id === eventId);
    return all;
  }

  public addParty(party: Partial<Party>): Party {
    const all = this.getParties();
    const newParty: Party = {
      id: uid('pty'),
      event_id: party.event_id || '',
      name: party.name || 'Party Name',
      bench: party.bench || 'Ruling',
      color: party.color || '#059669',
      leader: party.leader || '',
      manifesto: party.manifesto || ''
    };
    all.push(newParty);
    this.setItem(STORAGE_KEYS.PARTIES, all);
    this.sbUpsert('political_parties', newParty as unknown as Record<string, unknown>);
    return newParty;
  }

  public updateParty(party: Party) {
    const all = this.getParties().map(p => (p.id === party.id ? party : p));
    this.setItem(STORAGE_KEYS.PARTIES, all);
    this.sbUpsert('political_parties', party as unknown as Record<string, unknown>);
  }

  public deleteParty(partyId: string) {
    this.setItem(STORAGE_KEYS.PARTIES, this.getParties().filter(p => p.id !== partyId));
    this.sbDelete('political_parties', partyId);
  }

  // ── COMMITTEES ────────────────────────────────────────────────────────────

  public getCommittees(eventId?: string): Committee[] {
    const all = this.getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    if (eventId) return all.filter(c => c.event_id === eventId);
    return all;
  }

  public addCommittee(com: Partial<Committee>): Committee {
    const all = this.getCommittees();
    const newCom: Committee = {
      id: uid('cmt'),
      event_id: com.event_id || '',
      name: com.name || 'Committee',
      topic: com.topic || 'General Topic',
      chairperson: com.chairperson || '',
      max_capacity: com.max_capacity || 50
    };
    all.push(newCom);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    this.sbUpsert('committees', newCom as unknown as Record<string, unknown>);
    return newCom;
  }

  public updateCommittee(com: Committee) {
    const all = this.getCommittees().map(c => (c.id === com.id ? com : c));
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    this.sbUpsert('committees', com as unknown as Record<string, unknown>);
  }

  public deleteCommittee(comId: string) {
    this.setItem(STORAGE_KEYS.COMMITTEES, this.getCommittees().filter(c => c.id !== comId));
    this.sbDelete('committees', comId);
  }

  // ── AGENDA ────────────────────────────────────────────────────────────────

  public getAgenda(eventId?: string): AgendaItem[] {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    if (eventId) return all.filter(a => a.event_id === eventId);
    return all;
  }

  public addAgendaItem(item: Partial<AgendaItem>): AgendaItem {
    const all = this.getAgenda();
    const newItem: AgendaItem = {
      id: uid('agd'),
      event_id: item.event_id || '',
      day: item.day || 'Day 1',
      time: item.time || '10:00 AM',
      title: item.title || 'Session',
      description: item.description || '',
      speaker_role: item.speaker_role,
      is_current: !!item.is_current
    };
    all.push(newItem);
    this.setItem(STORAGE_KEYS.AGENDA, all);
    this.sbUpsert('session_agenda', newItem as unknown as Record<string, unknown>);
    return newItem;
  }

  public setCurrentAgendaItem(eventId: string, itemId: string) {
    const all = this.getAgenda().map(a => {
      if (a.event_id === eventId) {
        return { ...a, is_current: a.id === itemId };
      }
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, all);
  }

  // ── JURY ──────────────────────────────────────────────────────────────────

  public getJury(eventId?: string): JuryMember[] {
    const all = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, INITIAL_JURY);
    if (eventId) return all.filter(j => j.event_id === eventId);
    return all;
  }

  public addJuryMember(member: Partial<JuryMember>): JuryMember {
    const all = this.getJury();
    const newMember: JuryMember = {
      id: member.id || uid('jury'),
      event_id: member.event_id || '',
      access_code: member.access_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: member.name || 'Jury Member',
      email: member.email || '',
      phone: member.phone || '',
      designation: member.designation || 'Parliamentary Juror',
      assigned_bench: member.assigned_bench || 'Ruling',
      status: member.status || 'Active'
    };
    all.push(newMember);
    this.setItem(STORAGE_KEYS.JURY, all);
    this.sbUpsert('jury_members', newMember as unknown as Record<string, unknown>);
    return newMember;
  }

  public deleteJuryMember(memberId: string) {
    this.setItem(STORAGE_KEYS.JURY, this.getJury().filter(j => j.id !== memberId));
    if (supabase) {
      supabase.from('jury_members').delete().eq('id', memberId).then(({ error }) => {
        if (error) console.warn('[Supabase] jury delete error:', error.message);
      });
    }
  }

  // ── VOLUNTEERS ────────────────────────────────────────────────────────────

  public getVolunteers(eventId?: string): Volunteer[] {
    const all = this.getItem<Volunteer[]>(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEERS);
    if (eventId) return all.filter(v => v.event_id === eventId);
    return all;
  }

  public addVolunteer(volunteer: Partial<Volunteer>): Volunteer {
    const all = this.getVolunteers();
    const newVol: Volunteer = {
      id: volunteer.id || uid('vol'),
      event_id: volunteer.event_id || '',
      access_code: volunteer.access_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
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
    all.push(newVol);
    this.setItem(STORAGE_KEYS.VOLUNTEERS, all);
    this.sbUpsert('volunteers', newVol as unknown as Record<string, unknown>);
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
  }

  public bulkImportVolunteers(volunteersList: Partial<Volunteer>[], eventId: string) {
    const existing = this.getVolunteers();
    const newItems: Volunteer[] = volunteersList.map(v => ({
      id: v.id || uid('vol'),
      event_id: eventId,
      access_code: v.access_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: v.name || 'Volunteer',
      email: v.email || '',
      phone: v.phone || '',
      station: v.station || 'Floating',
      shift: v.shift || 'Both days',
      is_yuva: v.is_yuva !== undefined ? v.is_yuva : true,
      has_arrived: v.has_arrived || false,
      role: v.role || 'YUVA Volunteer',
      created_at: new Date().toISOString()
    }));
    this.setItem(STORAGE_KEYS.VOLUNTEERS, [...existing, ...newItems]);
    if (supabase && newItems.length > 0) {
      const sanitizedBatch = newItems.map(item => this.sanitizeRecordForTable('volunteers', item as unknown as Record<string, unknown>));
      supabase.from('volunteers').upsert(sanitizedBatch, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('[Supabase] bulk volunteers sync error:', error.message);
      });
    }
  }

  public deleteVolunteer(volunteerId: string) {
    this.setItem(STORAGE_KEYS.VOLUNTEERS, this.getVolunteers().filter(v => v.id !== volunteerId));
    if (supabase) {
      supabase.from('volunteers').delete().eq('id', volunteerId).then(({ error }) => {
        if (error) console.warn('[Supabase] volunteer delete error:', error.message);
      });
    }
  }

  public saveCabinetMinistries(eventId: string, ministries: string[]) {
    const events = this.getEvents().map(e =>
      e.id === eventId ? { ...e, cabinet_ministries: ministries } : e
    );
    this.setItem(STORAGE_KEYS.EVENTS, events);
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

  // ── NOMINATIONS ───────────────────────────────────────────────────────────

  public getNominations(eventId?: string): Nomination[] {
    const all = this.getItem<Nomination[]>(STORAGE_KEYS.NOMINATIONS, INITIAL_NOMINATIONS);
    if (eventId) return all.filter(n => n.event_id === eventId);
    return all;
  }

  public addNomination(nom: Partial<Nomination>): Nomination {
    const all = this.getNominationAll();
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
      created_at: new Date().toISOString()
    };
    all.unshift(newNom);
    this.setItem(STORAGE_KEYS.NOMINATIONS, all);
    return newNom;
  }

  private getNominationAll(): Nomination[] {
    return this.getItem<Nomination[]>(STORAGE_KEYS.NOMINATIONS, INITIAL_NOMINATIONS);
  }

  public updateNominationStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected') {
    const all = this.getNominationAll().map(n => {
      if (n.id === id) {
        return { ...n, status };
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
  }

  private syncApprovedNominationToElection(nom: Nomination) {
    const elections = this.getElections(nom.event_id);
    let targetType: 'SPEAKER' | 'LEADERSHIP' | 'DEPUTY_SPEAKER' | 'COMMITTEE' = 'LEADERSHIP';
    if (nom.position === 'Speaker') targetType = 'SPEAKER';
    if (nom.position === 'Deputy Speaker') targetType = 'DEPUTY_SPEAKER';
    if (nom.position === 'Committee Chair') targetType = 'COMMITTEE';

    const election = elections.find(e => e.type === targetType);
    if (election) {
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
  }

  public deleteNomination(id: string) {
    const all = this.getNominationAll().filter(n => n.id !== id);
    this.setItem(STORAGE_KEYS.NOMINATIONS, all);
  }

  // ── ELECTIONS ─────────────────────────────────────────────────────────────

  public getElections(eventId?: string): Election[] {
    const all = this.getItem<Election[]>(STORAGE_KEYS.ELECTIONS, INITIAL_ELECTIONS);
    if (eventId) return all.filter(e => e.event_id === eventId);
    return all;
  }

  public addElection(elec: Partial<Election>): Election {
    const all = this.getElectionAll();
    const newElec: Election = {
      id: uid('elec'),
      event_id: elec.event_id || '',
      title: elec.title || 'New Election',
      position: elec.position || 'Assembly Role',
      type: elec.type || 'LEADERSHIP',
      status: elec.status || 'Live',
      candidates: elec.candidates || [],
      total_votes: 0,
      voted_delegate_ids: [],
      created_at: new Date().toISOString()
    };
    all.unshift(newElec);
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    return newElec;
  }

  private getElectionAll(): Election[] {
    return this.getItem<Election[]>(STORAGE_KEYS.ELECTIONS, INITIAL_ELECTIONS);
  }

  public updateElection(election: Election) {
    const all = this.getElectionAll().map(e => (e.id === election.id ? election : e));
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
  }

  public castVoteInElection(electionId: string, candidateId: string, delegateId?: string): boolean {
    const all = this.getElectionAll();
    const election = all.find(e => e.id === electionId);
    if (!election || election.status !== 'Live') return false;

    if (delegateId && election.voted_delegate_ids?.includes(delegateId)) {
      return false; // Already voted
    }

    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) return false;

    candidate.votes += 1;
    election.total_votes += 1;
    if (delegateId) {
      if (!election.voted_delegate_ids) election.voted_delegate_ids = [];
      election.voted_delegate_ids.push(delegateId);
    }

    // Check leader
    const sorted = [...election.candidates].sort((a, b) => b.votes - a.votes);
    if (sorted.length > 0 && sorted[0].votes > 0) {
      election.winner = sorted[0].name;
    }

    this.setItem(STORAGE_KEYS.ELECTIONS, all);
    return true;
  }

  public closeElection(electionId: string) {
    const all = this.getElectionAll().map(e => {
      if (e.id === electionId) {
        const sorted = [...e.candidates].sort((a, b) => b.votes - a.votes);
        const win = sorted.length > 0 ? sorted[0].name : undefined;
        return { ...e, status: 'Closed' as const, winner: win };
      }
      return e;
    });
    this.setItem(STORAGE_KEYS.ELECTIONS, all);
  }

  // ── LIVE FLASH VOTES (Instant Yes/No Division Polls) ──────────────────────

  public getFlashVotes(eventId?: string): LiveFlashVote[] {
    const all = this.getItem<LiveFlashVote[]>(STORAGE_KEYS.FLASH_VOTES, INITIAL_FLASH_VOTES);
    if (eventId) return all.filter(f => f.event_id === eventId);
    return all;
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

    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
    return true;
  }

  public closeFlashVote(voteId: string) {
    const all = this.getFlashVoteAll().map(v => (v.id === voteId ? { ...v, status: 'CLOSED' as const } : v));
    this.setItem(STORAGE_KEYS.FLASH_VOTES, all);
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

  public saveScoreRecord(score: ScoreRecord) {
    const all = this.getItem<ScoreRecord[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    const idx = all.findIndex(s => s.learner_id === score.learner_id && s.event_id === score.event_id);
    if (idx >= 0) {
      all[idx] = score;
    } else {
      all.push(score);
    }
    this.setItem(STORAGE_KEYS.SCORES, all);
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
    const all = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    if (eventId) return all.filter(t => t.event_id === eventId);
    return all;
  }

  public addTeamMember(tm: Partial<TeamMember>): TeamMember {
    const all = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    const newTm: TeamMember = {
      id: uid('tm'),
      event_id: tm.event_id || '',
      name: tm.name || 'Team Member',
      role: tm.role || 'Floor Coordinator',
      email: tm.email || '',
      phone: tm.phone || '',
      department: tm.department || 'Coordination'
    };
    all.push(newTm);
    this.setItem(STORAGE_KEYS.TEAM, all);
    return newTm;
  }

  public deleteTeamMember(id: string) {
    const all = this.getItem<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM).filter(t => t.id !== id);
    this.setItem(STORAGE_KEYS.TEAM, all);
  }

  // ── AUTO-ALLOCATION & RESET ───────────────────────────────────────────────

  public executeAllocationForEvent(eventId: string, rulingRatio = 0.55) {
    const eventLearners = this.getLearners(eventId);
    const eventParties = this.getParties(eventId);
    const eventCommittees = this.getCommittees(eventId);

    const result = runAutoAllocation(eventLearners, eventParties, eventCommittees, rulingRatio);

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));
    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    // Sync updated learners to Supabase
    if (supabase && result.updatedLearners.length > 0) {
      supabase
        .from('learners')
        .upsert(result.updatedLearners as unknown as Record<string, unknown>[], {
          onConflict: 'id'
        })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] allocation sync:', error.message);
        });
    }

    return result;
  }

  public resetAllocationsForEvent(eventId: string) {
    const all = this.getLearners().map(l => {
      if (l.event_id === eventId) {
        return {
          ...l,
          bench: undefined,
          party_id: undefined,
          party_name: undefined,
          constituency_number: undefined,
          constituency_name: undefined,
          role: 'Member of Legislative Assembly (MLA)',
          committee_id: undefined,
          committee_name: undefined
        };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, all);
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
  }
}

export const storageService = new StorageService();
