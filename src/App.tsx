import { useState, useEffect } from 'react';
import type { UserRole, CollegeEvent, Coordinator, Learner, Party, Committee, AgendaItem, JuryMember, Volunteer, UserSession } from './types';
import { storageService } from './services/storageService';
import { Header } from './components/common/Header';
import { Sidebar, type ActiveNavTab } from './components/common/Sidebar';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { useTheme } from './lib/theme';

import { UnifiedLoginPage } from './components/auth/UnifiedLoginPage';
import { MyEventsDashboard } from './components/admin/MyEventsDashboard';
import { EventOverviewTab } from './components/admin/EventOverviewTab';

import { ParticipantsTab } from './components/coordinator/ParticipantsTab';
import { CabinetTab } from './components/coordinator/CabinetTab';
import { JuryTab } from './components/coordinator/JuryTab';
import { VolunteersTab } from './components/coordinator/VolunteersTab';
import { PartiesTab } from './components/coordinator/PartiesTab';
import { CommitteesTab } from './components/coordinator/CommitteesTab';
import { AgendaTab } from './components/coordinator/AgendaTab';
import { AnalyticsTab } from './components/coordinator/AnalyticsTab';
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

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [currentEvent, setCurrentEvent] = useState<CollegeEvent | null>(null);

  const [learners, setLearners] = useState<Learner[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [jury, setJury] = useState<JuryMember[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

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
  const saveSession = (sess: SavedAuthSession) => {
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

  // Load and subscribe to storage service state updates
  const loadState = () => {
    const evs = storageService.getEvents();
    const coords = storageService.getCoordinators();

    setEvents(evs);
    setCoordinators(coords);

    let activeEv = currentEvent;
    if (!activeEv && evs.length > 0) {
      activeEv = evs[0];
      setCurrentEvent(activeEv);
    }

    if (activeEv) {
      setLearners(storageService.getLearners(activeEv.id));
      setParties(storageService.getParties(activeEv.id));
      setCommittees(storageService.getCommittees(activeEv.id));
      setAgenda(storageService.getAgenda(activeEv.id));

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
              setLearners(storageService.getLearners(targetEv.id));
              setParties(storageService.getParties(targetEv.id));
              setCommittees(storageService.getCommittees(targetEv.id));
              setAgenda(storageService.getAgenda(targetEv.id));
            }
          }

          if (sess.role === 'student' && sess.studentCode) {
            const student = storageService.getLearnerByAccessCode(sess.studentCode);
            if (student) {
              setCurrentStudent(student);
              const ev = evs.find(e => e.id === student.event_id) || null;
              if (ev) setCurrentEvent(ev);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error restoring auth session:', e);
    }

    return () => unsubscribe();
  }, []);

  const handleEventChange = (ev: CollegeEvent) => {
    setCurrentEvent(ev);
    setLearners(storageService.getLearners(ev.id));
    setParties(storageService.getParties(ev.id));
    setCommittees(storageService.getCommittees(ev.id));
    setAgenda(storageService.getAgenda(ev.id));

    const coords = storageService.getCoordinators();
    const coord = coords.find(c => c.event_id === ev.id) || null;
    setCurrentCoordinator(coord);

    saveSession({ currentEventId: ev.id, role });
  };

  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveNavTab(tab);
    saveSession({ activeNavTab: tab, currentEventId: currentEvent?.id, role });
  };

  // Organizer Authentication (returns UserSession | null for UnifiedLoginPage)
  const handleOrganizerSignIn = (email: string, pass: string): UserSession | null => {
    const session = storageService.loginWithCredentials(email, pass);
    if (session) {
      setIsAuthenticated(true);
      setUserSession(session);
      const userRole = session.role === 'super_admin' ? 'super_admin' : 'coordinator';
      setRole(userRole);

      if (userRole === 'coordinator') {
        const coordEvents = storageService.getEvents(session);
        const targetEv = coordEvents[0] || events[0] || null;
        if (targetEv) {
          setCurrentEvent(targetEv);
          setLearners(storageService.getLearners(targetEv.id));
          setParties(storageService.getParties(targetEv.id));
          setCommittees(storageService.getCommittees(targetEv.id));
          setAgenda(storageService.getAgenda(targetEv.id));
          saveSession({
            role: 'coordinator',
            email: session.email,
            name: session.name,
            assigned_event_ids: session.assigned_event_ids,
            currentEventId: targetEv.id,
            activeNavTab: 'participants'
          });
        }
      } else {
        saveSession({
          role: 'super_admin',
          email: session.email,
          name: session.name,
          activeNavTab: 'participants'
        });
      }
      return session;
    }
    return null;
  };

  // Student Access Code Login (returns Learner | null for UnifiedLoginPage)
  const handleStudentLoginWithCode = (code: string): Learner | null => {
    const student = storageService.getLearnerByAccessCode(code);
    if (student) {
      setCurrentStudent(student);
      setIsAuthenticated(true);
      setRole('student');
      setUserSession({
        role: 'student',
        name: student.full_name,
        email: student.email
      });

      const ev = events.find(e => e.id === student.event_id) || null;
      if (ev) handleEventChange(ev);

      saveSession({
        role: 'student',
        name: student.full_name,
        studentCode: student.access_code,
        currentEventId: student.event_id
      });
      return student;
    }
    return null;
  };

  // Super Admin handlers
  const handleCreateEvent = (collegeName: string, coordName: string, coordEmail: string, pass: string) => {
    const newEvent = storageService.addEvent(collegeName);
    const newCoord = storageService.addCoordinator(newEvent.id, coordName, coordEmail, pass);

    storageService.addParty({ event_id: newEvent.id, name: 'Party A', bench: 'Ruling', color: '#059669' });
    storageService.addParty({ event_id: newEvent.id, name: 'Party B', bench: 'Opposition', color: '#dc2626' });

    storageService.addCommittee({ event_id: newEvent.id, name: 'Higher Education & Skill Dev', topic: 'Curriculum Modernization' });
    storageService.addCommittee({ event_id: newEvent.id, name: 'Public Health & Welfare', topic: 'Rural Telemedicine' });

    setCurrentEvent(newEvent);
    setCurrentCoordinator(newCoord);
  };

  const handleUpdateCoordinator = (updated: Coordinator) => {
    storageService.updateCoordinator(updated);
    loadState();
  };

  // Coordinator learner actions
  const handleToggleCheckIn = (learnerId: string, day: 1 | 2) => storageService.toggleCheckIn(learnerId, day);
  const handleCheckInAll = (day: 1 | 2, state: boolean) => {
    if (currentEvent) storageService.checkInAll(currentEvent.id, day, state);
  };
  const handleAddLearner = (learner: Partial<Learner>) => storageService.addLearner(learner);
  const handleBulkImportLearners = (newLearners: Partial<Learner>[]) => {
    if (currentEvent) storageService.bulkImportLearners(currentEvent.id, newLearners);
  };
  const handleUpdateLearner = (learner: Learner) => {
    storageService.updateLearner(learner);
    addToast('Learner Updated', `Updated ${learner.full_name}`, 'success');
  };

  const handleDeleteLearner = (id: string) => {
    storageService.deleteLearner(id);
    addToast('Learner Deleted', 'Removed delegate from roster', 'info');
  };

  // Party handlers
  const handleAddParty = (p: Partial<Party>) => storageService.addParty(p);
  const handleUpdateParty = (p: Party) => storageService.updateParty(p);
  const handleDeleteParty = (id: string) => storageService.deleteParty(id);

  // Committee handlers
  const handleAddCommittee = (c: Partial<Committee>) => storageService.addCommittee(c);
  const handleUpdateCommittee = (c: Committee) => storageService.updateCommittee(c);
  const handleDeleteCommittee = (id: string) => storageService.deleteCommittee(id);

  // Agenda handlers
  const handleAddAgendaItem = (a: Partial<AgendaItem>) => storageService.addAgendaItem(a);
  const handleSetCurrentAgendaItem = (id: string) => {
    if (currentEvent) storageService.setCurrentAgendaItem(id, currentEvent.id);
  };

  // Auto Allocation Execution
  const handleExecuteAllocation = (rulingRatio: number) => {
    if (currentEvent) storageService.executeAllocationForEvent(currentEvent.id, rulingRatio);
  };

  // Jury & Volunteer actions
  const handleAddJury = (j: Partial<JuryMember>) => {
    const newJ: JuryMember = { id: `j_${Date.now()}`, event_id: currentEvent?.id || '', name: j.name || '', designation: j.designation || '', assigned_bench: j.assigned_bench || 'Ruling' };
    setJury(prev => [...prev, newJ]);
  };
  const handleDeleteJury = (id: string) => setJury(prev => prev.filter(j => j.id !== id));

  const handleAddVolunteer = (v: Partial<Volunteer>) => {
    const newV: Volunteer = { id: `v_${Date.now()}`, event_id: currentEvent?.id || '', name: v.name || '', email: v.email || '', phone: v.phone || '', role: v.role || 'Logistics' };
    setVolunteers(prev => [...prev, newV]);
  };
  const handleDeleteVolunteer = (id: string) => setVolunteers(prev => prev.filter(v => v.id !== id));

  const existingCodes = new Set(learners.map(l => l.access_code));
  const activeParty = currentStudent ? parties.find(p => p.name === currentStudent.party_name) || null : null;
  const activeCommittee = currentStudent ? committees.find(c => c.name === currentStudent.committee_name) || null : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen transition-colors duration-300">
        <UnifiedLoginPage
          onLoginCredentials={handleOrganizerSignIn}
          onLoginAccessCode={handleStudentLoginWithCode}
          onShowToast={addToast}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

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
            setActiveNavTab('participants');
            saveSession({ role: 'super_admin', activeNavTab: 'participants' });
          }
        }}
      />

      {/* Main Body Layout */}
      <div className="flex">
        
        {/* Left Vertical Sidebar (Only for Coordinator/Organiser mode) */}
        {role === 'coordinator' && (
          <Sidebar
            activeTab={activeNavTab}
            onSelectTab={(tab) => handleSelectTab(tab)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          
          {role === 'super_admin' && (
            <MyEventsDashboard
              events={events}
              coordinators={coordinators}
              onCreateEvent={handleCreateEvent}
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

              {activeNavTab === 'parties' && (
                <PartiesTab
                  parties={parties}
                  learners={learners}
                  eventId={currentEvent.id}
                  onAddParty={handleAddParty}
                  onUpdateParty={handleUpdateParty}
                  onDeleteParty={handleDeleteParty}
                  onShowToast={addToast}
                />
              )}

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

              {activeNavTab === 'cabinet' && (
                <CabinetTab learners={learners} />
              )}

              {activeNavTab === 'jury' && (
                <JuryTab
                  jury={jury}
                  eventId={currentEvent.id}
                  onAddJury={handleAddJury}
                  onDeleteJury={handleDeleteJury}
                  onShowToast={addToast}
                />
              )}

              {activeNavTab === 'volunteers' && (
                <VolunteersTab
                  volunteers={volunteers}
                  eventId={currentEvent.id}
                  onAddVolunteer={handleAddVolunteer}
                  onDeleteVolunteer={handleDeleteVolunteer}
                  onShowToast={addToast}
                />
              )}

              {activeNavTab === 'agenda' && (
                <AgendaTab
                  agenda={agenda}
                  eventId={currentEvent.id}
                  onAddAgendaItem={handleAddAgendaItem}
                  onSetCurrentItem={handleSetCurrentAgendaItem}
                  onShowToast={addToast}
                />
              )}

              {(activeNavTab === 'allocation' || activeNavTab === 'control') && (
                <AnalyticsTab
                  learners={learners}
                  parties={parties}
                  committees={committees}
                />
              )}

              {/* Fallback for remaining sidebar tabs */}
              {['team', 'checklist', 'nominations', 'questionnaire', 'elections', 'proceedings', 'chat', 'scoregrid', 'media', 'awards', 'chapterawards', 'feedback', 'report'].includes(activeNavTab) && (
                <div
                  className="rounded-2xl p-8 text-center space-y-2 border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <h3 className="text-lg font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>{activeNavTab} Module</h3>
                  <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                    This section is active for {currentEvent.college_name}. All parliamentary logs and delegate criteria are synchronized.
                  </p>
                </div>
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
            existingCodes={existingCodes}
            onAddLearner={(l) => {
              handleAddLearner(l);
              addToast('Walk-in Added', `Registered ${l.full_name} with access code ${l.access_code}`, 'success');
            }}
          />

          <CsvImportModal
            isOpen={isImportCsvOpen}
            onClose={() => setIsImportCsvOpen(false)}
            eventId={currentEvent.id}
            existingCodes={existingCodes}
            onImportSuccess={handleBulkImportLearners}
            onShowToast={addToast}
          />

          <AllocationModal
            isOpen={isAllocationModalOpen}
            onClose={() => setIsAllocationModalOpen(false)}
            learners={learners}
            parties={parties}
            committees={committees}
            onExecuteAllocation={(rulingRatio) => {
              handleExecuteAllocation(rulingRatio);
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
