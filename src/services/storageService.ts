import type {
  CollegeEvent,
  Coordinator,
  Learner,
  Party,
  Committee,
  AgendaItem,
  JuryMember,
  Volunteer,
  UserSession
} from '../types';
import {
  INITIAL_EVENTS,
  INITIAL_COORDINATORS,
  INITIAL_LEARNERS,
  INITIAL_PARTIES,
  INITIAL_COMMITTEES,
  INITIAL_AGENDA
} from '../data/initialMockData';
import { runAutoAllocation } from '../utils/allocationEngine';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Local-storage keys (cache layer)
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  EVENTS: 'tn_assembly_events_v4',
  COORDINATORS: 'tn_assembly_coordinators_v4',
  LEARNERS: 'tn_assembly_learners_v4',
  PARTIES: 'tn_assembly_parties_v4',
  COMMITTEES: 'tn_assembly_committees_v4',
  AGENDA: 'tn_assembly_agenda_v4',
  JURY: 'tn_assembly_jury_v4',
  VOLUNTEERS: 'tn_assembly_volunteers_v4'
};

type Listener = () => void;

// ---------------------------------------------------------------------------
// Helpers — use crypto.randomUUID() for Supabase UUID primary key compatibility
// ---------------------------------------------------------------------------
function uid(_prefix?: string): string {
  // crypto.randomUUID() is available in all modern browsers and Node 14.17+
  return crypto.randomUUID();
}


// ---------------------------------------------------------------------------
// StorageService — hybrid localStorage + Supabase
// ---------------------------------------------------------------------------
class StorageService {
  private listeners: Listener[] = [];

  constructor() {
    this.initDefaults();
    // Sync from Supabase in background on first load
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
      this.setItem(STORAGE_KEYS.JURY, []);
    if (!localStorage.getItem(STORAGE_KEYS.VOLUNTEERS))
      this.setItem(STORAGE_KEYS.VOLUNTEERS, []);
  }

  // ── Supabase sync (runs once on startup) ─────────────────────────────────

  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;

    try {
      const [
        { data: events },
        { data: coordinators },
        { data: learners },
        { data: parties },
        { data: committees },
        { data: agenda },
        { data: jury },
        { data: volunteers }
      ] = await Promise.all([
        supabase.from('college_events').select('*').order('created_at', { ascending: false }),
        supabase.from('coordinators').select('*'),
        supabase.from('learners').select('*').order('created_at', { ascending: false }),
        supabase.from('political_parties').select('*'),
        supabase.from('committees').select('*'),
        supabase.from('session_agenda').select('*').order('created_at', { ascending: true }),
        supabase.from('jury_members').select('*'),
        supabase.from('volunteers').select('*')
      ]);

      if (events?.length) this.setItem(STORAGE_KEYS.EVENTS, events);
      if (coordinators?.length) this.setItem(STORAGE_KEYS.COORDINATORS, coordinators);
      if (learners?.length) this.setItem(STORAGE_KEYS.LEARNERS, learners);
      if (parties?.length) this.setItem(STORAGE_KEYS.PARTIES, parties);
      if (committees?.length) this.setItem(STORAGE_KEYS.COMMITTEES, committees);
      if (agenda?.length) this.setItem(STORAGE_KEYS.AGENDA, agenda);
      if (jury?.length) this.setItem(STORAGE_KEYS.JURY, jury);
      if (volunteers?.length) this.setItem(STORAGE_KEYS.VOLUNTEERS, volunteers);

      console.log('[Supabase] Sync complete ✅');
    } catch (err) {
      console.warn('[Supabase] Sync error:', err);
    }
  }

  // ── Fire-and-forget Supabase write (never blocks the UI) ─────────────────

  private async sbUpsert(table: string, data: Record<string, unknown>) {
    if (!supabase) return;
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    if (error) console.warn(`[Supabase] upsert ${table}:`, error.message);
  }

  private async sbDelete(table: string, id: string) {
    if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[Supabase] delete ${table}:`, error.message);
  }

  // ── AUTHENTICATION ────────────────────────────────────────────────────────

  public loginWithCredentials(email: string, pass: string): UserSession | null {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Super Admin
    if (
      (cleanEmail === 'admin@tnassembly.in' || cleanEmail === 'admin') &&
      (cleanPass === 'admin123' || cleanPass === 'admin')
    ) {
      return { role: 'super_admin', email: 'admin@tnassembly.in', name: 'Super Admin' };
    }

    // Coordinators (from localStorage cache, which is synced from Supabase)
    const coords = this.getCoordinators();
    const coord = coords.find(
      c => c.email.toLowerCase() === cleanEmail && c.password_hash === cleanPass
    );

    if (coord) {
      const assignedEvents = this.getEvents().filter(
        e =>
          e.assigned_coordinator_email?.toLowerCase() === cleanEmail ||
          e.id === coord.event_id
      );
      return {
        role: 'coordinator',
        email: coord.email,
        name: coord.name,
        assigned_event_ids: assignedEvents.map(e => e.id)
      };
    }

    return null;
  }

  // ── EVENTS ────────────────────────────────────────────────────────────────

  public getEvents(session?: UserSession | null): CollegeEvent[] {
    const all = this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    if (session && session.role === 'coordinator') {
      const email = session.email?.toLowerCase();
      const assignedIds = new Set(session.assigned_event_ids || []);
      return all.filter(
        e =>
          (e.assigned_coordinator_email &&
            e.assigned_coordinator_email.toLowerCase() === email) ||
          assignedIds.has(e.id)
      );
    }
    return all;
  }

  public addEvent(
    college_name: string,
    coordName?: string,
    coordEmail?: string
  ): CollegeEvent {
    const events = this.getEvents();
    const newEvent: CollegeEvent = {
      id: uid('evt'),
      college_name,
      chapter: 'College Domain',
      level: 'College Round',
      location: `${college_name}, Tamil Nadu`,
      dates: '10 Sep 2026 – 11 Sep 2026',
      event_stage: 'College Round',
      status: 'Day 1 Live',
      participant_count: 0,
      assigned_coordinator_email: coordEmail,
      assigned_coordinator_name: coordName,
      elections_count: 2,
      is_locked: false,
      created_at: new Date().toISOString()
    };
    events.unshift(newEvent);
    this.setItem(STORAGE_KEYS.EVENTS, events);
    // Supabase async write
    this.sbUpsert('college_events', newEvent as unknown as Record<string, unknown>);
    return newEvent;
  }

  public updateEvent(updated: CollegeEvent) {
    const events = this.getEvents().map(e => (e.id === updated.id ? updated : e));
    this.setItem(STORAGE_KEYS.EVENTS, events);
    this.sbUpsert('college_events', updated as unknown as Record<string, unknown>);
  }

  // ── COORDINATORS ──────────────────────────────────────────────────────────

  public getCoordinators(): Coordinator[] {
    return this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  }

  public addCoordinator(
    event_id: string,
    name: string,
    email: string,
    raw_password: string
  ): Coordinator {
    const coordinators = this.getCoordinators();
    const newCoord: Coordinator = {
      id: uid('coord'),
      event_id,
      name,
      email,
      password_hash: raw_password,
      raw_temp_password: raw_password
    };
    coordinators.push(newCoord);
    this.setItem(STORAGE_KEYS.COORDINATORS, coordinators);

    // Link coordinator to event
    const events = this.getEvents();
    const ev = events.find(e => e.id === event_id);
    if (ev) {
      ev.assigned_coordinator_email = email;
      ev.assigned_coordinator_name = name;
      this.updateEvent(ev);
    }

    this.sbUpsert('coordinators', newCoord as unknown as Record<string, unknown>);
    return newCoord;
  }

  // ── LEARNERS ──────────────────────────────────────────────────────────────

  public getLearners(eventId?: string): Learner[] {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    if (eventId) return all.filter(l => l.event_id === eventId);
    return all;
  }

  public getLearnerByAccessCode(code: string): Learner | null {
    const cleanCode = code.trim().toUpperCase();
    return this.getLearners().find(l => l.access_code.toUpperCase() === cleanCode) || null;
  }

  public addLearner(learner: Partial<Learner>): Learner {
    const all = this.getLearners();
    const newLearner: Learner = {
      id: uid('l'),
      event_id: learner.event_id || '',
      access_code: learner.access_code || '',
      full_name: learner.full_name || '',
      email: learner.email || '',
      phone: learner.phone || '',
      department: learner.department || 'General',
      academic_year: learner.academic_year || '1st Year',
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString(),
      ...learner
    };
    all.unshift(newLearner);
    this.setItem(STORAGE_KEYS.LEARNERS, all);
    this.updateEventParticipantCount(newLearner.event_id);
    this.sbUpsert('learners', newLearner as unknown as Record<string, unknown>);
    return newLearner;
  }

  public updateLearner(learner: Learner): Learner {
    const next = this.getLearners().map(l => (l.id === learner.id ? learner : l));
    this.setItem(STORAGE_KEYS.LEARNERS, next);
    this.sbUpsert('learners', learner as unknown as Record<string, unknown>);
    return learner;
  }

  public bulkImportLearners(eventId: string, newLearners: Partial<Learner>[]): number {
    const all = this.getLearners();
    const formatted: Learner[] = newLearners.map((l, idx) => ({
      id: `l_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      access_code: l.access_code || '',
      full_name: l.full_name || '',
      email: l.email || '',
      phone: l.phone || '',
      department: l.department || 'General',
      academic_year: l.academic_year || '1st Year',
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString()
    }));
    this.setItem(STORAGE_KEYS.LEARNERS, [...formatted, ...all]);
    this.updateEventParticipantCount(eventId);

    // Bulk upsert to Supabase
    if (supabase && formatted.length > 0) {
      supabase
        .from('learners')
        .upsert(formatted as unknown as Record<string, unknown>[], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] bulk import learners:', error.message);
        });
    }

    return formatted.length;
  }

  private updateEventParticipantCount(eventId: string) {
    if (!eventId) return;
    const count = this.getLearners(eventId).length;
    const events = this.getEvents();
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      ev.participant_count = count;
      this.updateEvent(ev);
    }
  }

  public toggleCheckIn(learnerId: string, day: 1 | 2): Learner | null {
    const all = this.getLearners();
    let updated: Learner | null = null;
    const next = all.map(l => {
      if (l.id === learnerId) {
        updated = {
          ...l,
          day1_checked_in: day === 1 ? !l.day1_checked_in : l.day1_checked_in,
          day2_checked_in: day === 2 ? !l.day2_checked_in : l.day2_checked_in
        };
        return updated;
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, next);
    if (updated) this.sbUpsert('learners', updated as unknown as Record<string, unknown>);
    return updated;
  }

  public checkInAll(eventId: string, day: 1 | 2, checkInState = true) {
    const all = this.getLearners();
    const updatedOnes: Learner[] = [];
    const next = all.map(l => {
      if (l.event_id === eventId) {
        const u = {
          ...l,
          day1_checked_in: day === 1 ? checkInState : l.day1_checked_in,
          day2_checked_in: day === 2 ? checkInState : l.day2_checked_in
        };
        updatedOnes.push(u);
        return u;
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, next);
    if (supabase && updatedOnes.length > 0) {
      supabase
        .from('learners')
        .upsert(updatedOnes as unknown as Record<string, unknown>[], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] checkInAll:', error.message);
        });
    }
  }

  public deleteLearner(learnerId: string) {
    const all = this.getLearners();
    const target = all.find(l => l.id === learnerId);
    this.setItem(STORAGE_KEYS.LEARNERS, all.filter(l => l.id !== learnerId));
    if (target) this.updateEventParticipantCount(target.event_id);
    this.sbDelete('learners', learnerId);
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
      id: uid('party'),
      event_id: party.event_id || '',
      name: party.name || 'New Political Party',
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

  public addCommittee(committee: Partial<Committee>): Committee {
    const all = this.getCommittees();
    const newComm: Committee = {
      id: uid('comm'),
      event_id: committee.event_id || '',
      name: committee.name || 'New Legislative Committee',
      topic: committee.topic || 'General Legislative Reform',
      chairperson: committee.chairperson || '',
      max_capacity: committee.max_capacity || 50
    };
    all.push(newComm);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    this.sbUpsert('committees', newComm as unknown as Record<string, unknown>);
    return newComm;
  }

  public updateCommittee(committee: Committee) {
    const all = this.getCommittees().map(c => (c.id === committee.id ? committee : c));
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    this.sbUpsert('committees', committee as unknown as Record<string, unknown>);
  }

  public deleteCommittee(committeeId: string) {
    this.setItem(STORAGE_KEYS.COMMITTEES, this.getCommittees().filter(c => c.id !== committeeId));
    this.sbDelete('committees', committeeId);
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
      id: uid('ag'),
      event_id: item.event_id || '',
      day: item.day || 'Day 1',
      time: item.time || '09:00 AM',
      title: item.title || 'Assembly Discussion',
      description: item.description || '',
      speaker_role: item.speaker_role || 'Speaker',
      is_current: false
    };
    all.push(newItem);
    this.setItem(STORAGE_KEYS.AGENDA, all);
    this.sbUpsert('session_agenda', newItem as unknown as Record<string, unknown>);
    return newItem;
  }

  public setCurrentAgendaItem(itemId: string, eventId: string) {
    const all = this.getAgenda().map(a => {
      if (a.event_id === eventId) return { ...a, is_current: a.id === itemId };
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, all);
    // Update all agenda items for this event in Supabase
    if (supabase) {
      const eventItems = all.filter(a => a.event_id === eventId);
      supabase
        .from('session_agenda')
        .upsert(eventItems as unknown as Record<string, unknown>[], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] setCurrentAgendaItem:', error.message);
        });
    }
  }

  // ── JURY ──────────────────────────────────────────────────────────────────

  public getJury(eventId?: string): JuryMember[] {
    const all = this.getItem<JuryMember[]>(STORAGE_KEYS.JURY, []);
    if (eventId) return all.filter(j => j.event_id === eventId);
    return all;
  }

  public addJuryMember(member: Partial<JuryMember>): JuryMember {
    const all = this.getJury();
    const newMember: JuryMember = {
      id: uid('jury'),
      event_id: member.event_id || '',
      name: member.name || '',
      designation: member.designation || '',
      assigned_bench: member.assigned_bench || 'Ruling'
    };
    all.push(newMember);
    this.setItem(STORAGE_KEYS.JURY, all);
    this.sbUpsert('jury_members', newMember as unknown as Record<string, unknown>);
    return newMember;
  }

  public updateJuryMember(member: JuryMember) {
    const all = this.getJury().map(j => (j.id === member.id ? member : j));
    this.setItem(STORAGE_KEYS.JURY, all);
    this.sbUpsert('jury_members', member as unknown as Record<string, unknown>);
  }

  public deleteJuryMember(memberId: string) {
    this.setItem(STORAGE_KEYS.JURY, this.getJury().filter(j => j.id !== memberId));
    this.sbDelete('jury_members', memberId);
  }

  // ── VOLUNTEERS ────────────────────────────────────────────────────────────

  public getVolunteers(eventId?: string): Volunteer[] {
    const all = this.getItem<Volunteer[]>(STORAGE_KEYS.VOLUNTEERS, []);
    if (eventId) return all.filter(v => v.event_id === eventId);
    return all;
  }

  public addVolunteer(volunteer: Partial<Volunteer>): Volunteer {
    const all = this.getVolunteers();
    const newVol: Volunteer = {
      id: uid('vol'),
      event_id: volunteer.event_id || '',
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      role: volunteer.role || 'General'
    };
    all.push(newVol);
    this.setItem(STORAGE_KEYS.VOLUNTEERS, all);
    this.sbUpsert('volunteers', newVol as unknown as Record<string, unknown>);
    return newVol;
  }

  public updateVolunteer(volunteer: Volunteer) {
    const all = this.getVolunteers().map(v => (v.id === volunteer.id ? volunteer : v));
    this.setItem(STORAGE_KEYS.VOLUNTEERS, all);
    this.sbUpsert('volunteers', volunteer as unknown as Record<string, unknown>);
  }

  public deleteVolunteer(volunteerId: string) {
    this.setItem(STORAGE_KEYS.VOLUNTEERS, this.getVolunteers().filter(v => v.id !== volunteerId));
    this.sbDelete('volunteers', volunteerId);
  }

  // ── AUTO-ALLOCATION ───────────────────────────────────────────────────────

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
}

export const storageService = new StorageService();
