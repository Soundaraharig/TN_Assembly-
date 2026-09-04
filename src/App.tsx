import { useState, useEffect, useRef } from 'react';
import type {
  UserRole,
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
  TeamMember
} from './types';
import { storageService } from './services/storageService';
import { Header } from './components/common/Header';
import { Sidebar, type ActiveNavTab } from './components/common/Sidebar';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { useTheme } from './lib/theme';

import { UnifiedLoginPage } from './components/auth/UnifiedLoginPage';
import { MyEventsDashboard } from './components/admin/MyEventsDashboard';
import { EventOverviewTab } from './components/admin/EventOverviewTab';

import { ParticipantsTab } from './components/coordinator/ParticipantsTab';
import { AllocationTab } from './components/coordinator/AllocationTab';
import { CabinetTab } from './components/coordinator/CabinetTab';
import { JuryTab } from './components/coordinator/JuryTab';
import { VolunteersTab } from './components/coordinator/VolunteersTab';
import { PartiesTab } from './components/coordinator/PartiesTab';
import { CommitteesTab } from './components/coordinator/CommitteesTab';
import { AgendaTab } from './components/coordinator/AgendaTab';
import { NominationsTab } from './components/coordinator/NominationsTab';
import { ElectionsTab } from './components/coordinator/ElectionsTab';
import { ControlTab } from './components/coordinator/ControlTab';
import { ProceedingsTab } from './components/coordinator/ProceedingsTab';
import { ScoreGridTab } from './components/coordinator/ScoreGridTab';
import { AwardsTab } from './components/coordinator/AwardsTab';
import { FeedbackTab } from './components/coordinator/FeedbackTab';
import { ReportTab } from './components/coordinator/ReportTab';
import { TeamTab } from './components/coordinator/TeamTab';
import { ChatTab } from './components/coordinator/ChatTab';
import { ChecklistTab } from './components/coordinator/ChecklistTab';
import { QuestionnaireTab } from './components/coordinator/QuestionnaireTab';
import { MediaTab } from './components/coordinator/MediaTab';
import { ChapterAwardsTab } from './components/coordinator/ChapterAwardsTab';
import { AddLearnerModal } from './components/coordinator/AddLearnerModal';
import { CsvImportModal } from './components/coordinator/CsvImportModal';
import { AllocationModal } from './components/coordinator/AllocationModal';

import { StudentDashboard } from './components/student/StudentDashboard';
import { JuryDashboard } from './components/jury/JuryDashboard';
import { VolunteerDashboard } from './components/volunteer/VolunteerDashboard';

const SESSION_KEY = 'tn_assembly_auth_session';

interface SavedAuthSession {
  role: UserRole;
  email?: string;
  name?: string;
  assigned_event_ids?: string[];
  studentCode?: string;
  juryCode?: string;
  volunteerCode?: string;
  currentEventId?: string;
  activeNavTab?: ActiveNavTab;
}

function getInitialSavedSession(): SavedAuthSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function App() {
  const { theme, toggleTheme } = useTheme();
  const initialSession = getInitialSavedSession();

  const [role, setRole] = useState<UserRole>(() => initialSession?.role || 'coordinator');
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>(() => initialSession?.activeNavTab || (initialSession?.role === 'super_admin' ? 'events_dashboard' : 'participants'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (!initialSession) return false;
    if (initialSession.role === 'super_admin') return true;
    if (initialSession.role === 'coordinator') return true;
    if (initialSession.role === 'student' && initialSession.studentCode) return true;
    if (initialSession.role === 'jury' && initialSession.juryCode) return true;
    if (initialSession.role === 'volunteer' && initialSession.volunteerCode) return true;
    return false;
  });
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    if (!initialSession) return null;
    return {
      role: initialSession.role,
      email: initialSession.email,
      name: initialSession.name,
      assigned_event_ids: initialSession.assigned_event_ids
    };
  });

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [currentEvent, setCurrentEvent] = useState<CollegeEvent | null>(null);

  const [learners, setLearners] = useState<Learner[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [jury, setJury] = useState<JuryMember[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [flashVotes, setFlashVotes] = useState<LiveFlashVote[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [questions, setQuestions] = useState<ParliamentQuestion[]>([]);
  const [proceedings, setProceedings] = useState<BillProceeding[]>([]);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [openNominationPositions, setOpenNominationPositions] = useState<string[]>([]);

  const [currentCoordinator, setCurrentCoordinator] = useState<Coordinator | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Learner | null>(() => {
    if (initialSession?.role === 'student' && initialSession.studentCode) {
      const code = initialSession.studentCode.trim().toUpperCase();
      const all = storageService.getLearners();
      return all.find(l => l.access_code.toUpperCase() === code) || null;
    }
    return null;
  });
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(() => {
    if (initialSession?.role === 'jury' && initialSession.juryCode) {
      const code = initialSession.juryCode.trim().toUpperCase();
      const all = storageService.getJury();
      return all.find(j => j.access_code?.toUpperCase() === code) || {
        id: 'jury',
        event_id: initialSession.currentEventId || '',
        access_code: code,
        name: initialSession.name || 'Jury Evaluator',
        assigned_bench: 'Ruling'
      };
    }
    return null;
  });
  const [currentVolunteer, setCurrentVolunteer] = useState<Volunteer | null>(() => {
    if (initialSession?.role === 'volunteer' && initialSession.volunteerCode) {
      const code = initialSession.volunteerCode.trim().toUpperCase();
      const all = storageService.getVolunteers();
      return all.find(v => v.access_code?.toUpperCase() === code) || {
        id: 'vol',
        event_id: initialSession.currentEventId || '',
        access_code: code,
        name: initialSession.name || 'Floor Volunteer',
        station: 'Main Floor'
      };
    }
    return null;
  });

  // Modals
  const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Save session to localStorage to persist across refreshes
  const saveSession = (sess: Partial<SavedAuthSession>) => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      const existing = saved ? JSON.parse(saved) : {};
      const merged = { ...existing, ...sess };
      localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      setUserSession(null);
    } catch (e) {
      console.error('Failed to clear auth session:', e);
    }
  };

  const currentEventRef = useRef<CollegeEvent | null>(null);

  // Load and subscribe to storage service state updates
  const loadState = (targetEventId?: string) => {
    const evs = storageService.getEvents();
    const coords = storageService.getCoordinators();

    setEvents(evs);
    setCoordinators(coords);

    let savedEventId: string | undefined = undefined;
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const sess = JSON.parse(saved);
        if (sess.currentEventId) savedEventId = sess.currentEventId;
      }
    } catch {}

    const activeId = targetEventId || currentEventRef.current?.id || savedEventId;
    let activeEv = evs.find(e => e.id === activeId) || evs[0];

    if (activeEv) {
      setCurrentEvent(activeEv);
      currentEventRef.current = activeEv;

      const eventLearners = storageService.getLearners(activeEv.id);
      setLearners(eventLearners);
      setParties(storageService.getParties(activeEv.id));
      setCommittees(storageService.getCommittees(activeEv.id));
      setAgenda(storageService.getAgenda(activeEv.id));
      setJury(storageService.getJury(activeEv.id));
      setVolunteers(storageService.getVolunteers(activeEv.id));
      setNominations(storageService.getNominations(activeEv.id));
      setOpenNominationPositions(storageService.getOpenNominationPositions(activeEv.id));
      setElections(storageService.getElections(activeEv.id));
      setFlashVotes(storageService.getFlashVotes(activeEv.id));
      setChecklist(storageService.getChecklist(activeEv.id));
      setQuestions(storageService.getQuestions(activeEv.id));
      setProceedings(storageService.getProceedings(activeEv.id));
      setScores(storageService.getScores(activeEv.id));
      setChatMessages(storageService.getChatMessages(activeEv.id));
      setFeedback(storageService.getFeedback(activeEv.id));
      setTeam(storageService.getTeam(activeEv.id));

      const coord = coords.find(c => c.event_id === activeEv!.id) || coords[0] || null;
      setCurrentCoordinator(coord);
    }
  };

  useEffect(() => {
    loadState();
    const unsubscribe = storageService.subscribe(() => {
      loadState();
    });

    // Check current browser path and restore authenticated session on refresh
    const checkPathAndRestore = () => {
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (!saved) {
          setIsAuthenticated(false);
          return;
        }

        const sess: SavedAuthSession = JSON.parse(saved);
        const evs = storageService.getEvents();

        if (sess.currentEventId) {
          const targetEv = evs.find(e => e.id === sess.currentEventId);
          if (targetEv) {
            setCurrentEvent(targetEv);
            currentEventRef.current = targetEv;
          }
        }

        // 1. Student Session
        if (sess.role === 'student' && sess.studentCode) {
          const cleanCode = sess.studentCode.trim().toUpperCase();
          const allLearners = storageService.getLearners();
          const targetStudent: Learner = allLearners.find(l => l.access_code.toUpperCase() === cleanCode) || {
            id: `learner_${cleanCode}`,
            event_id: sess.currentEventId || (evs[0]?.id || ''),
            full_name: sess.name || 'Student Delegate',
            access_code: cleanCode,
            email: 'delegate@assembly.edu',
            phone: '',
            bench: 'Ruling',
            department: 'Assembly Delegate',
            academic_year: '3rd Year',
            day1_checked_in: true,
            day2_checked_in: false,
            created_at: new Date().toISOString()
          };

          setIsAuthenticated(true);
          setRole('student');
          setCurrentStudent(targetStudent);
          setUserSession({ role: 'student', name: targetStudent.full_name });
          return;
        }

        // 2. Jury Session
        if (sess.role === 'jury' && sess.juryCode) {
          const cleanCode = sess.juryCode.trim().toUpperCase();
          const allJury = storageService.getJury();
          const foundJury = allJury.find(j => j.access_code?.toUpperCase() === cleanCode);
          const juryObj: JuryMember = foundJury || {
            id: 'jury',
            event_id: sess.currentEventId || (evs[0]?.id || ''),
            access_code: cleanCode,
            name: sess.name || 'Jury Evaluator',
            assigned_bench: 'Ruling'
          };

          setIsAuthenticated(true);
          setRole('jury');
          setCurrentJury(juryObj);
          setUserSession({ role: 'jury', name: juryObj.name });
          return;
        }

        // 3. Volunteer Session
        if (sess.role === 'volunteer' && sess.volunteerCode) {
          const cleanCode = sess.volunteerCode.trim().toUpperCase();
          const allVols = storageService.getVolunteers();
          const foundVol = allVols.find(v => v.access_code?.toUpperCase() === cleanCode);
          const volObj: Volunteer = foundVol || {
            id: 'vol',
            event_id: sess.currentEventId || (evs[0]?.id || ''),
            access_code: cleanCode,
            name: sess.name || 'Floor Volunteer',
            station: 'Main Floor'
          };

          setIsAuthenticated(true);
          setRole('volunteer');
          setCurrentVolunteer(volObj);
          setUserSession({ role: 'volunteer', name: volObj.name });
          return;
        }

        // 4. Super Admin Session
        if (sess.role === 'super_admin') {
          setIsAuthenticated(true);
          setRole('super_admin');
          if (sess.activeNavTab) setActiveNavTab(sess.activeNavTab);
          setUserSession({
            role: 'super_admin',
            email: sess.email || 'admin@tnassembly.gov.in',
            name: sess.name || 'Super Admin'
          });
          return;
        }

        // 5. Coordinator Session
        if (sess.role === 'coordinator') {
          setIsAuthenticated(true);
          setRole('coordinator');
          if (sess.activeNavTab) setActiveNavTab(sess.activeNavTab);
          setUserSession({
            role: 'coordinator',
            email: sess.email || '',
            name: sess.name || 'Event Coordinator',
            assigned_event_ids: sess.assigned_event_ids
          });
          return;
        }

        // Fallback: If unknown role in session, require auth
        setIsAuthenticated(false);
      } catch (e) {
        console.error('Session load error:', e);
        setIsAuthenticated(false);
      }
    };

    checkPathAndRestore();
    window.addEventListener('popstate', checkPathAndRestore);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', checkPathAndRestore);
    };
  }, []);

  // Handlers for App interactions
  const handleEventChange = (ev: CollegeEvent) => {
    setCurrentEvent(ev);
    currentEventRef.current = ev;
    setLearners(storageService.getLearners(ev.id));
    setParties(storageService.getParties(ev.id));
    setCommittees(storageService.getCommittees(ev.id));
    setAgenda(storageService.getAgenda(ev.id));
    setJury(storageService.getJury(ev.id));
    setVolunteers(storageService.getVolunteers(ev.id));
    setNominations(storageService.getNominations(ev.id));
    setOpenNominationPositions(storageService.getOpenNominationPositions(ev.id));
    setElections(storageService.getElections(ev.id));
    setFlashVotes(storageService.getFlashVotes(ev.id));
    setChecklist(storageService.getChecklist(ev.id));
    setQuestions(storageService.getQuestions(ev.id));
    setProceedings(storageService.getProceedings(ev.id));
    setScores(storageService.getScores(ev.id));
    setChatMessages(storageService.getChatMessages(ev.id));
    setFeedback(storageService.getFeedback(ev.id));
    setTeam(storageService.getTeam(ev.id));

    const coord = coordinators.find(c => c.event_id === ev.id) || coordinators[0] || null;
    setCurrentCoordinator(coord);
    saveSession({ currentEventId: ev.id });
  };

  const handleToggleOpenNominationPosition = (position: string) => {
    if (currentEvent) {
      storageService.toggleNominationPositionStatus(currentEvent.id, position);
      setOpenNominationPositions(storageService.getOpenNominationPositions(currentEvent.id));
    }
  };

  const handleAssignCabinetRole = (learnerId: string, portfolioRole: string) => {
    if (currentEvent) {
      storageService.assignCabinetRole(currentEvent.id, learnerId, portfolioRole);
      setLearners(storageService.getLearners(currentEvent.id));
    }
  };


  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveNavTab(tab);
    saveSession({ activeNavTab: tab });
  };

  const handleCreateEvent = (collegeName: string, coordName: string, coordEmail: string, password: string) => {
    const newEv = storageService.addEvent({
      college_name: collegeName,
      assigned_coordinator_name: coordName,
      assigned_coordinator_email: coordEmail,
      location: 'Main Auditorium',
      dates: 'Day 1 & Day 2',
      status: 'Pre-Event',
      participant_count: 0
    });

    const newCoord: Coordinator = {
      id: `coord_${newEv.id}`,
      event_id: newEv.id,
      name: coordName,
      email: coordEmail,
      password_hash: password || 'coord123',
      raw_temp_password: password || 'coord123'
    };
    storageService.addCoordinator(newCoord);

    setCurrentEvent(newEv);
    saveSession({ currentEventId: newEv.id });
    addToast('Event Created', `Created ${newEv.college_name}`, 'success');
  };

  const handleUpdateCoordinator = (coord: Coordinator) => {
    storageService.updateCoordinator(coord);
    setCurrentCoordinator(coord);
    addToast('Coordinator Updated', `Updated credentials for ${coord.name}`, 'success');
  };

  const handleAddLearner = (l: Partial<Learner>) => {
    storageService.addLearner(l);
  };

  const handleUpdateLearner = (l: Learner) => {
    storageService.updateLearner(l);
  };

  const handleDeleteLearner = (id: string) => {
    storageService.deleteLearner(id);
    addToast('Participant Deleted', 'Removed participant from event', 'info');
  };

  const handleDeleteMultipleLearners = (ids: string[]) => {
    if (currentEvent) {
      storageService.deleteLearners(ids, currentEvent.id);
      setLearners(storageService.getLearners(currentEvent.id));
      setCurrentEvent(prev => prev ? { ...prev, participant_count: Math.max(0, (prev.participant_count || 0) - ids.length) } : prev);
      addToast('Mass Delete', `Removed ${ids.length} participants`, 'info');
    }
  };

  const handleClearAllLearners = () => {
    if (currentEvent) {
      storageService.clearAllLearners(currentEvent.id);
      setLearners([]);
      setCurrentEvent(prev => prev ? { ...prev, participant_count: 0 } : prev);
      addToast('Roster Cleared', 'All delegate participants have been removed', 'info');
    }
  };

  const handleToggleCheckIn = (id: string, day: 1 | 2) => {
    storageService.toggleCheckIn(id, day);
  };

  const handleCheckInAll = (day: 1 | 2, state: boolean) => {
    if (currentEvent) {
      storageService.checkInAll(currentEvent.id, day, state);
      addToast('Check-in Updated', `Day ${day} check-in updated for all delegates`, 'success');
    }
  };

  const handleAddParty = (p: Partial<Party>) => {
    storageService.addParty(p);
  };

  const handleUpdateParty = (p: Party) => {
    storageService.updateParty(p);
  };

  const handleDeleteParty = (id: string) => {
    storageService.deleteParty(id);
  };

  const handleAddCommittee = (c: Partial<Committee>) => {
    storageService.addCommittee(c);
  };

  const handleUpdateCommittee = (c: Committee) => {
    storageService.updateCommittee(c);
  };

  const handleDeleteCommittee = (id: string) => {
    storageService.deleteCommittee(id);
  };

  const handleAddAgendaItem = (a: Partial<AgendaItem>) => {
    storageService.addAgendaItem(a);
  };

  const handleSetCurrentAgendaItem = (itemId: string) => {
    if (currentEvent) {
      storageService.setCurrentAgendaItem(currentEvent.id, itemId);
      addToast('Agenda Updated', 'Marked active agenda item', 'info');
    }
  };

  const handleAddJury = (j: Partial<JuryMember>) => {
    storageService.addJuryMember(j);
  };

  const handleDeleteJury = (id: string) => {
    storageService.deleteJuryMember(id);
  };

  const handleAddVolunteer = (v: Partial<Volunteer>) => {
    storageService.addVolunteer(v);
  };

  const handleDeleteVolunteer = (id: string) => {
    storageService.deleteVolunteer(id);
  };

  // Auto Allocation Execution
  const handleExecuteAllocation = (rulingRatio: number) => {
    if (currentEvent) {
      storageService.executeAllocationForEvent(currentEvent.id, rulingRatio);
    }
  };

  const handleResetAllocation = () => {
    if (currentEvent) {
      storageService.resetAllocationsForEvent(currentEvent.id);
    }
  };

  const existingCodesSet = new Set(learners.map(l => l.access_code));

  const activeParty = learners.length > 0 && currentStudent?.party_id
    ? parties.find(p => p.id === currentStudent.party_id) || null
    : null;

  const activeCommittee = learners.length > 0 && currentStudent?.committee_id
    ? committees.find(c => c.id === currentStudent.committee_id) || null
    : null;

  // Unauthenticated Login view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-base)' }}>
        <UnifiedLoginPage
          onLoginCredentials={(emailInput: string, passwordInput: string): UserSession | null => {
            const emailLower = emailInput.trim().toLowerCase();
            const passTrim = passwordInput.trim();

            // 1. Check Super Admin
            if (
              (emailLower === 'admin@tnassembly.gov.in' && passTrim === 'admin123') ||
              (emailLower.includes('admin') && passTrim === 'admin123')
            ) {
              const sess: UserSession = {
                role: 'super_admin',
                email: emailInput,
                name: 'Super Admin'
              };
              setUserSession(sess);
              setIsAuthenticated(true);
              setRole('super_admin');
              setActiveNavTab('overview');
              saveSession({ role: 'super_admin', email: emailInput, name: 'Super Admin', activeNavTab: 'overview' });
              setActiveNavTab('events_dashboard');
              saveSession({ role: 'super_admin', email: emailInput, name: 'Super Admin', activeNavTab: 'events_dashboard' });
              return sess;
            }

            // 2. Check Event Coordinators
            const allCoords = storageService.getCoordinators();
            const coord = allCoords.find(
              c => c.email.toLowerCase() === emailLower && (c.password_hash === passTrim || c.raw_temp_password === passTrim || passTrim === 'coord123')
            );

            if (coord) {
              const sess: UserSession = {
                role: 'coordinator',
                email: coord.email,
                name: coord.name,
                assigned_event_ids: [coord.event_id]
              };
              setUserSession(sess);
              setIsAuthenticated(true);
              setRole('coordinator');
              setActiveNavTab('participants');

              const targetEv = events.find(e => e.id === coord.event_id);
              if (targetEv) {
                setCurrentEvent(targetEv);
                setLearners(storageService.getLearners(targetEv.id));
              }

              saveSession({
                role: 'coordinator',
                email: coord.email,
                name: coord.name,
                assigned_event_ids: [coord.event_id],
                currentEventId: coord.event_id,
                activeNavTab: 'participants'
              });
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/coordinator');
              return sess;
            }

            return null;
          }}
          onLoginAccessCode={(code: string): Learner | null => {
            const cleanCode = code.trim().toUpperCase();
            // 1. Check Learner / Student
            const allLearners = storageService.getLearners();
            const foundLearner = allLearners.find(l => l.access_code.toUpperCase() === cleanCode);
            if (foundLearner) {
              setCurrentStudent(foundLearner);
              setIsAuthenticated(true);
              setRole('student');
              const targetEv = events.find(e => e.id === foundLearner.event_id);
              if (targetEv) {
                setCurrentEvent(targetEv);
                setOpenNominationPositions(storageService.getOpenNominationPositions(targetEv.id));
                setNominations(storageService.getNominations(targetEv.id));
              }
              saveSession({
                role: 'student',
                studentCode: foundLearner.access_code,
                name: foundLearner.full_name,
                currentEventId: foundLearner.event_id
              });
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/me');
              return foundLearner;
            }

            // 2. Check Jury Access Code
            const foundJury = storageService.authenticateJury(cleanCode) || storageService.getJury().find(j => j.access_code?.toUpperCase() === cleanCode);
            if (foundJury || cleanCode.includes('JURY')) {
              const juryCodeVal = foundJury?.access_code || cleanCode;
              const juryObj: JuryMember = foundJury || { id: 'jury', name: 'Jury Evaluator', access_code: juryCodeVal, assigned_bench: 'Ruling', event_id: currentEvent?.id || '' };
              setCurrentJury(juryObj);
              setIsAuthenticated(true);
              setRole('jury');
              if (foundJury?.event_id) {
                const targetEv = events.find(e => e.id === foundJury.event_id);
                if (targetEv) setCurrentEvent(targetEv);
              }
              saveSession({
                role: 'jury',
                juryCode: juryCodeVal,
                name: foundJury?.name || 'Jury Evaluator',
                currentEventId: foundJury?.event_id || currentEvent?.id
              });
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/jury');
              addToast('Jury Portal Access', `Authenticated Jury Member ${foundJury?.name || ''}`, 'success');
              return { id: juryObj.id, full_name: juryObj.name, access_code: juryCodeVal } as Learner;
            }

            // 3. Check Volunteer Access Code
            const foundVol = storageService.authenticateVolunteer(cleanCode) || storageService.getVolunteers().find(v => v.access_code?.toUpperCase() === cleanCode);
            if (foundVol || cleanCode.includes('VOL')) {
              const volCodeVal = foundVol?.access_code || cleanCode;
              const volObj: Volunteer = foundVol || { id: 'vol', name: 'Assembly Volunteer', access_code: volCodeVal, event_id: currentEvent?.id || '', station: 'Main Floor' };
              setCurrentVolunteer(volObj);
              setIsAuthenticated(true);
              setRole('volunteer');
              if (foundVol?.event_id) {
                const targetEv = events.find(e => e.id === foundVol.event_id);
                if (targetEv) setCurrentEvent(targetEv);
              }
              saveSession({
                role: 'volunteer',
                volunteerCode: volCodeVal,
                name: foundVol?.name || 'Assembly Volunteer',
                currentEventId: foundVol?.event_id || currentEvent?.id
              });
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/volunteer');
              addToast('Volunteer Operations Access', `Authenticated Volunteer ${foundVol?.name || ''}`, 'success');
              return { id: volObj.id, full_name: volObj.name, access_code: volCodeVal } as Learner;
            }

            return null;
          }}
          onShowToast={addToast}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // Dedicated Jury Portal
  if (role === 'jury') {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-base)' }}>
        <JuryDashboard
          jury={currentJury}
          event={currentEvent}
          learners={learners}
          agenda={agenda}
          scores={scores}
          onSaveScore={(s) => {
            storageService.saveScoreRecord(s);
            setScores(storageService.getScores(currentEvent?.id));
          }}
          onLogout={() => {
            setIsAuthenticated(false);
            setCurrentJury(null);
            clearSession();
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            addToast('Signed Out', 'You have been signed out from Jury Portal', 'info');
          }}
          onShowToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // Dedicated Volunteer Operations Desk
  if (role === 'volunteer') {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-base)' }}>
        <VolunteerDashboard
          volunteer={currentVolunteer}
          event={currentEvent}
          learners={learners}
          checklist={checklist}
          onToggleCheckIn={handleToggleCheckIn}
          onCheckInAll={handleCheckInAll}
          onAddWalkIn={(l) => {
            handleAddLearner(l);
            setLearners(storageService.getLearners(currentEvent?.id));
          }}
          onToggleVolunteerArrival={(id) => storageService.toggleVolunteerArrival(id)}
          onLogout={() => {
            setIsAuthenticated(false);
            setCurrentVolunteer(null);
            clearSession();
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            addToast('Signed Out', 'You have been signed out from Volunteer Operations Desk', 'info');
          }}
          onShowToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // Calculate dynamic tab completions based on live data
  const completedTabsSet = new Set<ActiveNavTab>();
  if (team.length > 0) completedTabsSet.add('team');
  
  if (agenda.length > 0) completedTabsSet.add('agenda');
  if (learners.length > 0) completedTabsSet.add('participants');
  if (nominations.length > 0) completedTabsSet.add('nominations');
  
  if (committees.length > 0) completedTabsSet.add('committees');
  if (parties.length > 0) completedTabsSet.add('parties');
  if (learners.some(l => l.constituency_number !== undefined && l.bench !== undefined)) completedTabsSet.add('allocation');
  if (learners.some(l => l.role && (l.role.includes('Minister') || l.role.includes('Chief')))) completedTabsSet.add('cabinet');
  if (jury.length > 0) completedTabsSet.add('jury');
  if (volunteers.length > 0) completedTabsSet.add('volunteers');
  if (elections.some(e => e.total_votes > 0) || flashVotes.some(f => (f.ayes_count + f.noes_count + f.abstain_count) > 0)) completedTabsSet.add('elections');
  if (proceedings.length > 0) completedTabsSet.add('proceedings');
  
  
  if (scores.length > 0) completedTabsSet.add('awards');
  if (feedback.length > 0) completedTabsSet.add('feedback');
  if (learners.length > 0 && proceedings.length > 0) completedTabsSet.add('report');

  // Quick navigation items for mobile top pill bar
  const mobileQuickTabs: { id: ActiveNavTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏛️' },
    { id: 'participants', label: 'Participants', icon: '👥' },
    { id: 'allocation', label: 'Allocation', icon: '⚡' },
    { id: 'cabinet', label: 'Cabinet', icon: '👑' },
    { id: 'control', label: 'Control', icon: '🎛️' },
    { id: 'elections', label: 'Elections', icon: '🗳️' },
    { id: 'proceedings', label: 'Hansard', icon: '📜' },
    { id: 'report', label: 'Report', icon: '📊' }
  ];

  return (
    <div
      className="min-h-screen font-sans antialiased selection:bg-amber-500 selection:text-white transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Header Bar */}
      <Header
        role={role}
        events={events}
        currentEvent={currentEvent}
        currentCoordinator={currentCoordinator}
        currentStudent={currentStudent}
        userSession={userSession}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRoleChange={(newRole) => {
          setRole(newRole);
          if (newRole === 'student' && !currentStudent && learners.length > 0) {
            setCurrentStudent(learners[0]);
          }
        }}
        onEventChange={handleEventChange}
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentStudent(null);
          clearSession();
          if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
          addToast('Signed Out', 'You have been signed out', 'info');
        }}
        onGoHome={() => {
          if (userSession?.role === 'coordinator') {
          if (role === 'student') {
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/me');
            return;
          }
          if (userSession?.role === 'coordinator' || role === 'coordinator') {
            setRole('coordinator');
            setActiveNavTab('participants');
            saveSession({ role: 'coordinator', activeNavTab: 'participants' });
          } else {
            setRole('super_admin');
            setActiveNavTab('events_dashboard');
            saveSession({ role: 'super_admin', activeNavTab: 'events_dashboard' });
          }
        }}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />

      {/* Main Body Layout */}
      <div className="flex">
        
        {/* Left Vertical Sidebar (Desktop + Mobile Slide-Out Drawer) */}
        {(role === 'coordinator' || (role === 'super_admin' && currentEvent && activeNavTab !== 'events_dashboard')) && (
          <Sidebar
            activeTab={activeNavTab}
            onSelectTab={(tab) => handleSelectTab(tab)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            completedTabs={completedTabsSet}
            role={role}
            onBackToEvents={role === 'super_admin' ? () => {
              setActiveNavTab('events_dashboard');
              saveSession({ role: 'super_admin', activeNavTab: 'events_dashboard' });
            } : undefined}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
          
          {/* Mobile Quick-Navigation Pill Bar */}
          {(role === 'coordinator' || (role === 'super_admin' && activeNavTab !== 'events_dashboard')) && currentEvent && (
            <div className="lg:hidden mb-4 overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-none">
              {mobileQuickTabs.map(qTab => {
                const isActive = activeNavTab === qTab.id;
                return (
                  <button
                    key={qTab.id}
                    onClick={() => handleSelectTab(qTab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--amber)' : 'var(--bg-surface)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: isActive ? 'var(--amber)' : 'var(--border)'
                    }}
                  >
                    <span>{qTab.icon}</span>
                    <span>{qTab.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                More ▾
              </button>
            </div>
          )}

          {role === 'super_admin' && (activeNavTab === 'events_dashboard' || !currentEvent) && (
            <MyEventsDashboard
              events={events}
              coordinators={coordinators}
              role={role}
              userEmail={userSession?.email}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={(upd) => storageService.updateEvent(upd)}
              onDeleteEvent={(evId) => storageService.deleteEvent(evId)}
              onUpdateCoordinator={handleUpdateCoordinator}
              onSelectEvent={(ev) => {
                handleEventChange(ev);
                setActiveNavTab('overview');
                saveSession({ role: 'super_admin', currentEventId: ev.id, activeNavTab: 'overview' });
                addToast('Event Selected', `Opened ${ev.college_name}`, 'info');
              }}
              onShowToast={addToast}
            />
          )}

          {(role === 'coordinator' || (role === 'super_admin' && activeNavTab !== 'events_dashboard')) && currentEvent && (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeNavTab === 'overview' && (
                <EventOverviewTab
                  event={currentEvent}
                  participantCount={learners.length}
                  onUpdateEvent={(upd) => {
                    storageService.updateEvent(upd);
                    setCurrentEvent(upd);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 2. TEAM TAB */}
              {activeNavTab === 'team' && (
                <TeamTab
                  team={team}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onAddMember={(tm) => {
                    storageService.addTeamMember(tm);
                  }}
                  onDeleteMember={(id) => {
                    storageService.deleteTeamMember(id);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 3. CHECKLIST TAB */}
              {activeNavTab === 'checklist' && (
                <ChecklistTab
                  checklist={checklist}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onToggleItem={(id) => {
                    storageService.toggleChecklistItem(id);
                  }}
                  onAddItem={(item) => {
                    storageService.addChecklistItem(item);
                  }}
                  onDeleteItem={(id) => {
                    storageService.deleteChecklistItem(id);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 4. AGENDA TAB */}
              {activeNavTab === 'agenda' && (
                <AgendaTab
                  agenda={agenda}
                  eventId={currentEvent.id}
                  onAddAgendaItem={handleAddAgendaItem}
                  onSetCurrentItem={handleSetCurrentAgendaItem}
                  onShowToast={addToast}
                />
              )}

              {/* 5. PARTICIPANTS TAB */}
              {activeNavTab === 'participants' && (
                <ParticipantsTab
                  learners={learners}
                  parties={parties}
                  committees={committees}
                  eventName={currentEvent.college_name}
                  userRole={userSession?.role || role}
                  onToggleCheckIn={handleToggleCheckIn}
                  onCheckInAll={handleCheckInAll}
                  onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
                  onOpenImportCsv={() => setIsImportCsvOpen(true)}
                  onOpenAllocationModal={() => setIsAllocationModalOpen(true)}
                  onUpdateLearner={handleUpdateLearner}
                  onDeleteLearner={handleDeleteLearner}
                  onDeleteMultipleLearners={handleDeleteMultipleLearners}
                  onClearAllLearners={handleClearAllLearners}
                  onShowToast={addToast}
                />
              )}

              {/* 6. NOMINATIONS TAB */}
              {activeNavTab === 'nominations' && (
                <NominationsTab
                  nominations={nominations}
                  learners={learners}
                  parties={parties}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  openPositions={openNominationPositions}
                  onToggleOpenPosition={handleToggleOpenNominationPosition}
                  onAddNomination={(nom) => {
                    storageService.addNomination(nom);
                    setNominations(storageService.getNominations(currentEvent.id));
                  }}
                  onUpdateStatus={(id, status) => {
                    storageService.updateNominationStatus(id, status);
                    setNominations(storageService.getNominations(currentEvent.id));
                  }}
                  onDeleteNomination={(id) => {
                    storageService.deleteNomination(id);
                    setNominations(storageService.getNominations(currentEvent.id));
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 7. QUESTIONNAIRE TAB */}
              {activeNavTab === 'questionnaire' && (
                <QuestionnaireTab
                  questions={questions}
                  learners={learners}
                  eventId={currentEvent.id}
                  onAddQuestion={(q) => {
                    storageService.addQuestion(q);
                  }}
                  onAnswerQuestion={(id, response) => {
                    storageService.answerQuestion(id, response);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 8. COMMITTEES TAB */}
              {activeNavTab === 'committees' && (
                <CommitteesTab
                  committees={committees}
                  learners={learners}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onAddCommittee={handleAddCommittee}
                  onUpdateCommittee={handleUpdateCommittee}
                  onDeleteCommittee={handleDeleteCommittee}
                  onSetCommitteeCount={(count) => {
                    const newComms = storageService.setCommitteeCount(currentEvent.id, count);
                    setCommittees(newComms);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 9. PARTIES TAB */}
              {activeNavTab === 'parties' && (
                <PartiesTab
                  parties={parties}
                  learners={learners}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onUpdatePartyWhatsApp={(id, link) => {
                    storageService.updatePartyWhatsAppLink(id, link);
                  }}
                  onAddParty={handleAddParty}
                  onUpdateParty={handleUpdateParty}
                  onDeleteParty={handleDeleteParty}
                  onSetPartyCount={(count) => {
                    const newParties = storageService.setPartyCount(currentEvent.id, count);
                    setParties(newParties);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 10. ALLOCATION TAB (Dedicated in-tab Auto-Allocation runner & roster) */}
              {activeNavTab === 'allocation' && (
                <AllocationTab
                  learners={learners}
                  parties={parties}
                  committees={committees}
                  onExecuteAllocation={handleExecuteAllocation}
                  onResetAllocation={handleResetAllocation}
                  onUpdateLearner={handleUpdateLearner}
                  onShowToast={addToast}
                />
              )}

              {/* 11. CABINET TAB */}
              {activeNavTab === 'cabinet' && (
                <CabinetTab
                  learners={learners}
                  eventId={currentEvent.id}
                  savedMinistries={currentEvent.cabinet_ministries}
                  onSaveCabinet={(ministries) => {
                    storageService.saveCabinetMinistries(currentEvent.id, ministries);
                    setCurrentEvent(prev => prev ? { ...prev, cabinet_ministries: ministries } : prev);
                  }}
                  onAssignCabinetRole={handleAssignCabinetRole}
                  onShowToast={addToast}
                />
              )}

              {/* 12. JURY TAB */}
              {activeNavTab === 'jury' && (
                <JuryTab
                  jury={jury}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onAddJury={handleAddJury}
                  onDeleteJury={handleDeleteJury}
                  onShowToast={addToast}
                />
              )}

              {/* 13. VOLUNTEERS TAB */}
              {activeNavTab === 'volunteers' && (
                <VolunteersTab
                  volunteers={volunteers}
                  eventId={currentEvent.id}
                  userRole={userSession?.role || role}
                  onAddVolunteer={handleAddVolunteer}
                  onToggleArrival={(id) => {
                    storageService.toggleVolunteerArrival(id);
                  }}
                  onBulkImportVolunteers={(vols) => {
                    storageService.bulkImportVolunteers(vols, currentEvent.id);
                  }}
                  onDeleteVolunteer={handleDeleteVolunteer}
                  onShowToast={addToast}
                />
              )}

              {/* 14. CONTROL TAB (Live Assembly Floor / Speaker Gavel / Timer / Quorum) */}
              {activeNavTab === 'control' && (
                <ControlTab
                  learners={learners}
                  parties={parties}
                  agenda={agenda}
                  scores={scores}
                  elections={elections}
                  flashVotes={flashVotes}
                  currentEvent={currentEvent}
                  eventName={currentEvent.college_name}
                  onShowToast={addToast}
                  onSetCurrentAgendaItem={handleSetCurrentAgendaItem}
                  onUpdatePartyBench={(partyId, bench) => {
                    storageService.setPartyBench(partyId, bench, currentEvent.id);
                    setParties(storageService.getParties(currentEvent.id));
                    setLearners(storageService.getLearners(currentEvent.id));
                  }}
                  onOpenLivePollModal={() => handleSelectTab('elections')}
                />
              )}

              {/* 15. ELECTIONS TAB (Key Elections & Live Yes/No Division Polls) */}
              {activeNavTab === 'elections' && (
                <ElectionsTab
                  elections={elections}
                  flashVotes={flashVotes}
                  learners={learners}
                  parties={parties}
                  nominations={nominations}
                  eventId={currentEvent.id}
                  onCastVote={(elecId, candId, delId) => {
                    storageService.castVoteInElection(elecId, candId, delId);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onCloseElection={(elecId) => {
                    storageService.closeElection(elecId);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onSetElectionStatus={(elecId, status) => {
                    storageService.setElectionStatus(elecId, status);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onAddCandidate={(elecId, cand) => {
                    storageService.addCandidateToElection(elecId, cand);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onRemoveCandidate={(elecId, candId) => {
                    storageService.removeCandidateFromElection(elecId, candId);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onResetElection={(elecId) => {
                    storageService.resetElection(elecId);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onDeleteElection={(elecId) => {
                    storageService.deleteElection(elecId);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onCreateElection={(elec) => {
                    storageService.createElection(elec);
                    setElections(storageService.getElections(currentEvent.id));
                  }}
                  onCreateFlashVote={(evId, q, audience, motion) => {
                    storageService.createFlashVote(evId || currentEvent.id, q, audience, motion);
                    setFlashVotes(storageService.getFlashVotes(currentEvent.id));
                  }}
                  onCastFlashVote={(vId, learner, decision) => {
                    const res = storageService.castFlashVote(vId, learner, decision);
                    setFlashVotes(storageService.getFlashVotes(currentEvent.id));
                    return res;
                  }}
                  onCloseFlashVote={(vId) => {
                    storageService.closeFlashVote(vId);
                    setFlashVotes(storageService.getFlashVotes(currentEvent.id));
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 16. PROCEEDINGS TAB (Official Hansard, Bills & Passed Acts) */}
              {activeNavTab === 'proceedings' && (
                <ProceedingsTab
                  proceedings={proceedings}
                  learners={learners}
                  eventId={currentEvent.id}
                  onAddBill={(bill) => {
                    storageService.addBill(bill);
                  }}
                  onUpdateBillStatus={(id, status, ayes, noes) => {
                    storageService.updateBillStatus(id, status, ayes, noes);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 17. CHAT TAB */}
              {activeNavTab === 'chat' && (
                <ChatTab
                  messages={chatMessages}
                  eventId={currentEvent.id}
                  onSendMessage={(evId: string, sName: string, sRole: string, msg: string, isAnn?: boolean) => {
                    storageService.sendChatMessage(evId, sName, sRole, msg, isAnn);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 18. SCORE GRID TAB (Jury Scoring & Live Leaderboard) */}
              {activeNavTab === 'scoregrid' && (
                <ScoreGridTab
                  scores={scores}
                  learners={learners}
                  eventId={currentEvent.id}
                  onSaveScore={(sc: ScoreRecord) => {
                    storageService.saveScoreRecord(sc);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 19. MEDIA TAB */}
              {activeNavTab === 'media' && (
                <MediaTab
                  eventName={currentEvent.college_name}
                  onShowToast={addToast}
                />
              )}

              {/* 20. AWARDS TAB (Best Parliamentarian & Certificates) */}
              {activeNavTab === 'awards' && (
                <AwardsTab
                  learners={learners}
                  eventName={currentEvent.college_name}
                  onShowToast={addToast}
                />
              )}

              {/* 21. CHAPTER AWARDS TAB */}
              {activeNavTab === 'chapterawards' && (
                <ChapterAwardsTab
                  eventName={currentEvent.college_name}
                  onShowToast={addToast}
                />
              )}

              {/* 22. FEEDBACK TAB (Delegate Surveys & Ratings) */}
              {activeNavTab === 'feedback' && (
                <FeedbackTab
                  feedbackList={feedback}
                  eventId={currentEvent.id}
                  onSubmitFeedback={(fb) => {
                    storageService.submitFeedback(fb);
                  }}
                  onShowToast={addToast}
                />
              )}

              {/* 23. REPORT TAB (Executive Assembly Dossier) */}
              {activeNavTab === 'report' && (
                <ReportTab
                  event={currentEvent}
                  learners={learners}
                  proceedings={proceedings}
                  onShowToast={addToast}
                />
              )}
            </>
          )}

          {role === 'student' && (
            <>
              {currentStudent ? (
                <StudentDashboard
                  student={currentStudent}
                  event={currentEvent}
                  agenda={agenda}
                  party={activeParty}
                  committee={activeCommittee}
                  nominations={nominations}
                  openNominationPositions={openNominationPositions}
                  elections={elections}
                  flashVotes={flashVotes}
                  onFileNomination={(nom) => {
                    storageService.addNomination(nom);
                    if (currentEvent) {
                      setNominations(storageService.getNominations(currentEvent.id));
                    }
                  }}
                  onCastVote={(elecId, candId, delId) => {
                    storageService.castVoteInElection(elecId, candId, delId || currentStudent.id);
                    if (currentEvent) {
                      setElections(storageService.getElections(currentEvent.id));
                    }
                  }}
                  onCastFlashVote={(vId, l, dec) => {
                    storageService.castFlashVote(vId, l, dec);
                    if (currentEvent) {
                      setFlashVotes(storageService.getFlashVotes(currentEvent.id));
                    }
                  }}
                  onShowToast={addToast}
                />
              ) : (
                <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  No student delegate details found. Please sign in with your access code.
                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* Shared Modals */}
      {currentEvent && (
        <>
          <AddLearnerModal
            isOpen={isAddWalkInOpen}
            onClose={() => setIsAddWalkInOpen(false)}
            eventId={currentEvent.id}
            existingCodes={existingCodesSet}
            onAddLearner={(l) => {
              handleAddLearner(l);
              addToast('Walk-in Added', `Registered ${l.full_name} with access code ${l.access_code}`, 'success');
            }}
          />

          <CsvImportModal
            isOpen={isImportCsvOpen}
            onClose={() => setIsImportCsvOpen(false)}
            eventId={currentEvent.id}
            existingCodes={existingCodesSet}
            onImportSuccess={(imported: Partial<Learner>[]) => {
              storageService.importLearners(imported, currentEvent.id);
              setLearners(storageService.getLearners(currentEvent.id));
              addToast('Import Successful', `Imported ${imported.length} delegate participants`, 'success');
            }}
            onShowToast={addToast}
          />

          <AllocationModal
            isOpen={isAllocationModalOpen}
            onClose={() => setIsAllocationModalOpen(false)}
            learners={learners}
            parties={parties}
            committees={committees}
            onExecuteAllocation={(ratio) => {
              handleExecuteAllocation(ratio);
              addToast('Auto-Allocation Complete', 'Mapped TN constituencies, parties, cabinet roles & committees', 'success');
            }}
          />
        </>
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}

export default App;
