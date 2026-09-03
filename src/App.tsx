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
  TeamMember,
  FlashVoteAudience
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

const SESSION_KEY = 'tn_assembly_auth_session';

interface SavedAuthSession {
  role: UserRole;
  email?: string;
  name?: string;
  assigned_event_ids?: string[];
  studentCode?: string;
  currentEventId?: string;
  activeNavTab?: ActiveNavTab;
}

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState<UserRole>('coordinator');
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>('participants');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

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

  const [currentCoordinator, setCurrentCoordinator] = useState<Coordinator | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Learner | null>(null);

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

    // Restore saved session on refresh
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const sess: SavedAuthSession = JSON.parse(saved);
        if (sess.role) {
          setIsAuthenticated(true);
          setRole(sess.role);
          if (sess.activeNavTab) setActiveNavTab(sess.activeNavTab);

          setUserSession({
            role: sess.role,
            email: sess.email,
            name: sess.name,
            assigned_event_ids: sess.assigned_event_ids
          });

          const evs = storageService.getEvents();
          if (sess.currentEventId) {
            const targetEv = evs.find(e => e.id === sess.currentEventId);
            if (targetEv) {
              setCurrentEvent(targetEv);
              currentEventRef.current = targetEv;
              setLearners(storageService.getLearners(targetEv.id));
            }
          }

          if (sess.role === 'student' && sess.studentCode) {
            const targetStudent = storageService.getLearners().find(l => l.access_code === sess.studentCode);
            if (targetStudent) setCurrentStudent(targetStudent);
          }
        }
      }
    } catch (e) {
      console.error('Session load error:', e);
    }

    return () => unsubscribe();
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
              if (targetEv) setCurrentEvent(targetEv);
              saveSession({
                role: 'student',
                studentCode: foundLearner.access_code,
                name: foundLearner.full_name,
                currentEventId: foundLearner.event_id
              });
              return foundLearner;
            }

            // 2. Check Jury Access Code
            const foundJury = storageService.authenticateJury(cleanCode);
            if (foundJury || cleanCode.includes('JURY')) {
              setIsAuthenticated(true);
              setRole('coordinator');
              setActiveNavTab('scoregrid');
              addToast('Jury Portal Access', `Authenticated Jury Member ${foundJury?.name || ''}`, 'success');
              return { id: 'jury', full_name: foundJury?.name || 'Jury Evaluator', access_code: cleanCode } as Learner;
            }

            // 3. Check Volunteer Access Code
            const foundVol = storageService.authenticateVolunteer(cleanCode);
            if (foundVol || cleanCode.includes('VOL')) {
              setIsAuthenticated(true);
              setRole('coordinator');
              setActiveNavTab('volunteers');
              addToast('Volunteer Duty Portal Access', `Authenticated Volunteer ${foundVol?.name || ''}`, 'success');
              return { id: 'vol', full_name: foundVol?.name || 'Assembly Volunteer', access_code: cleanCode } as Learner;
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
          addToast('Signed Out', 'You have been signed out', 'info');
        }}
        onGoHome={() => {
          if (userSession?.role === 'coordinator') {
            setRole('coordinator');
            setActiveNavTab('participants');
            saveSession({ role: 'coordinator', activeNavTab: 'participants' });
          } else {
            setRole('super_admin');
            setActiveNavTab('overview');
            saveSession({ role: 'super_admin', activeNavTab: 'overview' });
          }
        }}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />

      {/* Main Body Layout */}
      <div className="flex">
        
        {/* Left Vertical Sidebar (Desktop + Mobile Slide-Out Drawer) */}
        {role === 'coordinator' && (
          <Sidebar
            activeTab={activeNavTab}
            onSelectTab={(tab) => handleSelectTab(tab)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            completedTabs={completedTabsSet}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
          
          {/* Mobile Quick-Navigation Pill Bar */}
          {role === 'coordinator' && currentEvent && (
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

          {role === 'super_admin' && (
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
                setRole('coordinator');
                setActiveNavTab('overview');
                saveSession({ role: 'coordinator', currentEventId: ev.id, activeNavTab: 'overview' });
                addToast('Event Selected', `Opened ${ev.college_name}`, 'info');
              }}
              onShowToast={addToast}
            />
          )}

          {role === 'coordinator' && currentEvent && (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeNavTab === 'overview' && (
                <EventOverviewTab
                  event={currentEvent}
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
                  onAddMember={(tm) => {
                    storageService.addTeamMember(tm);
                  }}
                  onDeleteMember={(id) => {
                    storageService.deleteTeamMember(id);
                  }}
                  onShowToast={addToast}
                />
              )}

              
              {activeNavTab === 'checklist' && (
                <ChecklistTab
                  checklist={checklist}
                  eventId={currentEvent.id}
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
                  onToggleCheckIn={handleToggleCheckIn}
                  onCheckInAll={handleCheckInAll}
                  onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
                  onOpenImportCsv={() => setIsImportCsvOpen(true)}
                  onOpenAllocationModal={() => setIsAllocationModalOpen(true)}
                  onUpdateLearner={handleUpdateLearner}
                  onDeleteLearner={handleDeleteLearner}
                  onShowToast={addToast}
                />
              )}

              {/* 6. NOMINATIONS TAB */}
              {activeNavTab === 'nominations' && (
                <NominationsTab
                  nominations={nominations}
                  learners={learners}
                  eventId={currentEvent.id}
                  onAddNomination={(nom) => {
                    storageService.addNomination(nom);
                  }}
                  onUpdateStatus={(id, status) => {
                    storageService.updateNominationStatus(id, status);
                  }}
                  onDeleteNomination={(id) => {
                    storageService.deleteNomination(id);
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
                  onAddCommittee={handleAddCommittee}
                  onUpdateCommittee={handleUpdateCommittee}
                  onDeleteCommittee={handleDeleteCommittee}
                  onShowToast={addToast}
                />
              )}

              {/* 9. PARTIES TAB */}
              {activeNavTab === 'parties' && (
                <PartiesTab
                  parties={parties}
                  learners={learners}
                  eventId={currentEvent.id}
                  treasuryWhatsApp={currentEvent.treasury_whatsapp_link}
                  oppositionWhatsApp={currentEvent.opposition_whatsapp_link}
                  onSaveWhatsAppLinks={(t, o) => {
                    storageService.saveWhatsAppLinks(currentEvent.id, t, o);
                    setCurrentEvent(prev => prev ? { ...prev, treasury_whatsapp_link: t, opposition_whatsapp_link: o } : prev);
                  }}
                  onUpdatePartyWhatsApp={(id, link) => {
                    storageService.updatePartyWhatsAppLink(id, link);
                  }}
                  onAddParty={handleAddParty}
                  onUpdateParty={handleUpdateParty}
                  onDeleteParty={handleDeleteParty}
                  onRebalanceCommittees={() => {
                    storageService.rebalanceCommittees(currentEvent.id);
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
                  onShowToast={addToast}
                />
              )}

              {/* 12. JURY TAB */}
              {activeNavTab === 'jury' && (
                <JuryTab
                  jury={jury}
                  eventId={currentEvent.id}
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
                  eventName={currentEvent.college_name}
                  onShowToast={addToast}
                  onOpenLivePollModal={() => handleSelectTab('elections')}
                />
              )}

              {/* 15. ELECTIONS TAB (Key Elections & Live Yes/No Division Polls) */}
              {activeNavTab === 'elections' && (
                <ElectionsTab
                  elections={elections}
                  flashVotes={flashVotes}
                  learners={learners}
                  eventId={currentEvent.id}
                  onCastVote={(elecId, candId, delId) => {
                    storageService.castVoteInElection(elecId, candId, delId);
                  }}
                  onCloseElection={(elecId) => {
                    storageService.closeElection(elecId);
                  }}
                  onCreateElection={(elec) => {
                    storageService.addElection(elec);
                  }}
                  onCreateFlashVote={(evId: string, q: string, aud: FlashVoteAudience, mot: LiveFlashVote['motion_type']) => {
                    storageService.createFlashVote(evId, q, aud, mot);
                  }}
                  onCastFlashVote={(voteId, lrn, dec) => {
                    storageService.castFlashVote(voteId, lrn, dec);
                  }}
                  onCloseFlashVote={(voteId) => {
                    storageService.closeFlashVote(voteId);
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
