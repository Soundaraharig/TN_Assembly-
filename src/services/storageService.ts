import type {
  CollegeEvent,
  Coordinator,
  Learner,
  Party,
  Committee,
  AgendaItem,
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

const STORAGE_KEYS = {
  EVENTS: 'tn_assembly_events_v4',
  COORDINATORS: 'tn_assembly_coordinators_v4',
  LEARNERS: 'tn_assembly_learners_v4',
  PARTIES: 'tn_assembly_parties_v4',
  COMMITTEES: 'tn_assembly_committees_v4',
  AGENDA: 'tn_assembly_agenda_v4'
};

type Listener = () => void;

class StorageService {
  private listeners: Listener[] = [];

  constructor() {
    this.initDefaults();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

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

  public initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.setItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COORDINATORS)) {
      this.setItem(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEARNERS)) {
      this.setItem(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARTIES)) {
      this.setItem(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMITTEES)) {
      this.setItem(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENDA)) {
      this.setItem(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    }
  }

  // --- AUTHENTICATION ---
  public loginWithCredentials(email: string, pass: string): UserSession | null {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check Super Admin
    if (cleanEmail === 'admin@tnassembly.in' && cleanPass === 'admin123') {
      return {
        role: 'super_admin',
        email: 'admin@tnassembly.in',
        name: 'Super Admin'
      };
    }

    // Fallback for easy testing
    if (cleanEmail === 'admin' && cleanPass === 'admin') {
      return {
        role: 'super_admin',
        email: 'admin@tnassembly.in',
        name: 'Super Admin'
      };
    }

    // 2. Check Coordinators
    const coords = this.getCoordinators();
    const coord = coords.find(c => c.email.toLowerCase() === cleanEmail && c.password_hash === cleanPass);

    if (coord) {
      const assignedEvents = this.getEvents().filter(e => e.assigned_coordinator_email?.toLowerCase() === cleanEmail || e.id === coord.event_id);
      return {
        role: 'coordinator',
        email: coord.email,
        name: coord.name,
        assigned_event_ids: assignedEvents.map(e => e.id)
      };
    }

    return null;
  }

  // --- EVENTS ---
  public getEvents(session?: UserSession | null): CollegeEvent[] {
    const all = this.getItem<CollegeEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    if (session && session.role === 'coordinator') {
      const email = session.email?.toLowerCase();
      const assignedIds = new Set(session.assigned_event_ids || []);
      return all.filter(e => 
        (e.assigned_coordinator_email && e.assigned_coordinator_email.toLowerCase() === email) ||
        assignedIds.has(e.id)
      );
    }
    return all;
  }

  public addEvent(college_name: string, coordName?: string, coordEmail?: string): CollegeEvent {
    const events = this.getEvents();
    const newEvent: CollegeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    return newEvent;
  }

  public updateEvent(updated: CollegeEvent) {
    const events = this.getEvents().map(e => e.id === updated.id ? updated : e);
    this.setItem(STORAGE_KEYS.EVENTS, events);
  }

  // --- COORDINATORS ---
  public getCoordinators(): Coordinator[] {
    return this.getItem<Coordinator[]>(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  }

  public addCoordinator(event_id: string, name: string, email: string, raw_password: string): Coordinator {
    const coordinators = this.getCoordinators();
    const newCoord: Coordinator = {
      id: `coord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_id,
      name,
      email,
      password_hash: raw_password,
      raw_temp_password: raw_password
    };
    coordinators.push(newCoord);
    this.setItem(STORAGE_KEYS.COORDINATORS, coordinators);

    // Update event assigned coordinator fields
    const events = this.getEvents();
    const ev = events.find(e => e.id === event_id);
    if (ev) {
      ev.assigned_coordinator_email = email;
      ev.assigned_coordinator_name = name;
      this.updateEvent(ev);
    }

    return newCoord;
  }

  // --- LEARNERS ---
  public getLearners(eventId?: string): Learner[] {
    const all = this.getItem<Learner[]>(STORAGE_KEYS.LEARNERS, INITIAL_LEARNERS);
    if (eventId) {
      return all.filter(l => l.event_id === eventId);
    }
    return all;
  }

  public getLearnerByAccessCode(code: string): Learner | null {
    const all = this.getLearners();
    const cleanCode = code.trim().toUpperCase();
    return all.find(l => l.access_code.toUpperCase() === cleanCode) || null;
  }

  public addLearner(learner: Partial<Learner>): Learner {
    const all = this.getLearners();
    const newLearner: Learner = {
      id: `l_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    // Update count in event
    this.updateEventParticipantCount(learner.event_id || '');

    return newLearner;
  }

  public updateLearner(learner: Learner): Learner {
    const all = this.getLearners();
    const next = all.map(l => l.id === learner.id ? learner : l);
    this.setItem(STORAGE_KEYS.LEARNERS, next);
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
    return updated;
  }

  public checkInAll(eventId: string, day: 1 | 2, checkInState: boolean = true) {
    const all = this.getLearners();
    const next = all.map(l => {
      if (l.event_id === eventId) {
        return {
          ...l,
          day1_checked_in: day === 1 ? checkInState : l.day1_checked_in,
          day2_checked_in: day === 2 ? checkInState : l.day2_checked_in
        };
      }
      return l;
    });
    this.setItem(STORAGE_KEYS.LEARNERS, next);
  }

  public deleteLearner(learnerId: string) {
    const all = this.getLearners();
    const target = all.find(l => l.id === learnerId);
    const filtered = all.filter(l => l.id !== learnerId);
    this.setItem(STORAGE_KEYS.LEARNERS, filtered);
    if (target) {
      this.updateEventParticipantCount(target.event_id);
    }
  }

  // --- PARTIES ---
  public getParties(eventId?: string): Party[] {
    const all = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
    if (eventId) {
      return all.filter(p => p.event_id === eventId);
    }
    return all;
  }

  public addParty(party: Partial<Party>): Party {
    const all = this.getParties();
    const newParty: Party = {
      id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: party.event_id || '',
      name: party.name || 'New Political Party',
      bench: party.bench || 'Ruling',
      color: party.color || '#059669',
      leader: party.leader || '',
      manifesto: party.manifesto || ''
    };
    all.push(newParty);
    this.setItem(STORAGE_KEYS.PARTIES, all);
    return newParty;
  }

  public updateParty(party: Party) {
    const all = this.getParties().map(p => p.id === party.id ? party : p);
    this.setItem(STORAGE_KEYS.PARTIES, all);
  }

  public deleteParty(partyId: string) {
    const all = this.getParties().filter(p => p.id !== partyId);
    this.setItem(STORAGE_KEYS.PARTIES, all);
  }

  // --- COMMITTEES ---
  public getCommittees(eventId?: string): Committee[] {
    const all = this.getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    if (eventId) {
      return all.filter(c => c.event_id === eventId);
    }
    return all;
  }

  public addCommittee(committee: Partial<Committee>): Committee {
    const all = this.getCommittees();
    const newComm: Committee = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: committee.event_id || '',
      name: committee.name || 'New Legislative Committee',
      topic: committee.topic || 'General Legislative Reform',
      chairperson: committee.chairperson || '',
      max_capacity: committee.max_capacity || 50
    };
    all.push(newComm);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
    return newComm;
  }

  public updateCommittee(committee: Committee) {
    const all = this.getCommittees().map(c => c.id === committee.id ? committee : c);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
  }

  public deleteCommittee(committeeId: string) {
    const all = this.getCommittees().filter(c => c.id !== committeeId);
    this.setItem(STORAGE_KEYS.COMMITTEES, all);
  }

  // --- AGENDA ---
  public getAgenda(eventId?: string): AgendaItem[] {
    const all = this.getItem<AgendaItem[]>(STORAGE_KEYS.AGENDA, INITIAL_AGENDA);
    if (eventId) {
      return all.filter(a => a.event_id === eventId);
    }
    return all;
  }

  public addAgendaItem(item: Partial<AgendaItem>): AgendaItem {
    const all = this.getAgenda();
    const newItem: AgendaItem = {
      id: `ag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    return newItem;
  }

  public setCurrentAgendaItem(itemId: string, eventId: string) {
    const all = this.getAgenda().map(a => {
      if (a.event_id === eventId) {
        return { ...a, is_current: a.id === itemId };
      }
      return a;
    });
    this.setItem(STORAGE_KEYS.AGENDA, all);
  }

  // --- AUTO-ALLOCATION ---
  public executeAllocationForEvent(eventId: string, rulingRatio: number = 0.55) {
    const eventLearners = this.getLearners(eventId);
    const eventParties = this.getParties(eventId);
    const eventCommittees = this.getCommittees(eventId);

    const result = runAutoAllocation(eventLearners, eventParties, eventCommittees, rulingRatio);

    const allLearners = this.getLearners();
    const updatedMap = new Map(result.updatedLearners.map(l => [l.id, l]));

    const nextLearners = allLearners.map(l => updatedMap.get(l.id) || l);
    this.setItem(STORAGE_KEYS.LEARNERS, nextLearners);

    return result;
  }
}

export const storageService = new StorageService();
