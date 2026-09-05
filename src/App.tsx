import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getEventSlug, findEventBySlug, pathToTab, tabToPath } from './utils/slug';
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
import { ProjectorTab } from './components/coordinator/ProjectorTab';
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

function getInitialRouteInfo(initialSession: SavedAuthSession | null) {
  if (typeof window === 'undefined') {
    return {
      role: initialSession?.role || ('coordinator' as UserRole),
      isAuthenticated: !!initialSession
    };
  }

  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();

  // Standalone Projector View (/display, /projector, or ?projector=true)
  if (pathname.includes('/display') || pathname.includes('/projector') || search.includes('projector=true')) {
    return { role: 'coordinator' as UserRole, isAuthenticated: true, activeNavTab: 'projector' as ActiveNavTab };
  }

  // Volunteer Join Link (/join)
  if (pathname.includes('/join')) {
    return { role: 'volunteer' as UserRole, isAuthenticated: false };
  }

  // Jury Link (/jury)
  if (pathname.includes('/jury')) {
    return { role: 'jury' as UserRole, isAuthenticated: false };
  }

  // Student Delegate Link (/me or /student)
  if (pathname.includes('/me') || pathname.includes('/student')) {
    return { role: 'student' as UserRole, isAuthenticated: false };
  }

  // Default: Use initialSession
  if (!initialSession) {
    return { role: 'coordinator' as UserRole, isAuthenticated: false };
  }
  return { role: initialSession.role, isAuthenticated: true };
}

function EventSlugOnlyRedirector({ events }: { events: CollegeEvent[] }) {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const matched = findEventBySlug(events, eventSlug);
  if (!matched && events.length > 0) {
    return <Navigate to="/events" replace />;
  }
  const slug = matched ? getEventSlug(matched) : (eventSlug || 'jkkncet-tn-assembly-2026');
  return <Navigate to={`/events/${slug}/overview`} replace />;
}

interface EventTabRouteHandlerProps {
  events: CollegeEvent[];
  coordinators: Coordinator[];
  currentEvent: CollegeEvent | null;
  onEventChange: (ev: CollegeEvent) => void;
  activeNavTab: ActiveNavTab;
  setActiveNavTab: (tab: ActiveNavTab) => void;
  saveSession: (sess: Partial<SavedAuthSession>) => void;
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  agenda: AgendaItem[];
  jury: JuryMember[];
  volunteers: Volunteer[];
  nominations: Nomination[];
  elections: Election[];
  flashVotes: LiveFlashVote[];
  checklist: ChecklistItem[];
  questions: ParliamentQuestion[];
  proceedings: BillProceeding[];
  scores: ScoreRecord[];
  chatMessages: ChatMessage[];
  feedback: FeedbackEntry[];
  team: TeamMember[];
  openNominationPositions: string[];
  role: UserRole;
  userSession: UserSession | null;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  handleToggleCheckIn: (id: string, day: 1 | 2) => void;
  handleCheckInAll: (day: 1 | 2, present: boolean) => void;
  handleUpdateLearner: (l: Learner) => void;
  handleDeleteLearner: (id: string) => void;
  handleDeleteMultipleLearners: (ids: string[]) => void;
  handleClearAllLearners: () => void;
  handleToggleOpenNominationPosition: (pos: string) => void;
  handleSetAllOpenNominationPositions: (open: boolean, pos: string[]) => void;
  handleAddCommittee: (comm: Partial<Committee>) => void;
  handleUpdateCommittee: (comm: Committee) => void;
  handleDeleteCommittee: (id: string) => void;
  setCommittees: (comms: Committee[]) => void;
  handleAddParty: (party: Partial<Party>) => void;
  handleUpdateParty: (party: Party) => void;
  handleDeleteParty: (id: string) => void;
  setParties: (parties: Party[]) => void;
  handleExecuteAllocation: (ratio: any) => void;
  handleResetAllocation: () => void;
  setCurrentEvent: React.Dispatch<React.SetStateAction<CollegeEvent | null>>;
  setEvents?: React.Dispatch<React.SetStateAction<CollegeEvent[]>>;
  handleAssignCabinetRole: (learnerId: string, role: string) => void;
  handleAddJury: (j: Partial<JuryMember>) => void;
  handleDeleteJury: (id: string) => void;
  handleAddVolunteer: (v: Partial<Volunteer>) => void;
  handleDeleteVolunteer: (id: string) => void;
  setLearners: (learners: Learner[]) => void;
  handleSetCurrentAgendaItem: (id: string) => void;
  setElections: (elecs: Election[]) => void;
  setFlashVotes: (votes: LiveFlashVote[]) => void;
  setNominations: (noms: Nomination[]) => void;
  setIsAddWalkInOpen: (open: boolean) => void;
  setIsImportCsvOpen: (open: boolean) => void;
  setIsAllocationModalOpen: (open: boolean) => void;
  handleAddAgendaItem: (item: Partial<AgendaItem>) => void;
  activeParty?: Party | null;
  activeCommittee?: Committee | null;
  currentStudent?: Learner | null;
  navigate: (path: string, options?: any) => void;
}

function EventTabRouteHandler(props: EventTabRouteHandlerProps) {
  const { eventSlug, tab } = useParams<{ eventSlug: string; tab: string }>();
  const matchedEvent = findEventBySlug(props.events, eventSlug);

  useEffect(() => {
    if (props.events.length > 0 && !matchedEvent) {
      props.navigate('/events', { replace: true });
      return;
    }
    if (matchedEvent && props.currentEvent?.id !== matchedEvent.id) {
      props.onEventChange(matchedEvent);
    }
  }, [eventSlug, matchedEvent?.id, props.currentEvent?.id, props.events.length]);

  const activeTabFromPath = pathToTab(tab);

  useEffect(() => {
    if (props.activeNavTab !== activeTabFromPath) {
      props.setActiveNavTab(activeTabFromPath);
      props.saveSession({ activeNavTab: activeTabFromPath });
    }
  }, [activeTabFromPath, props.activeNavTab]);

  const activeEvent = matchedEvent || props.currentEvent || props.events[0];
  if (!activeEvent) {
    if (props.events.length > 0) {
      return <Navigate to="/events" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading event details...</span>
        </div>
      </div>
    );
  }

  if (props.role === 'student') {
    return props.currentStudent ? (
      <StudentDashboard
        student={props.currentStudent}
        event={activeEvent}
        agenda={props.agenda}
        party={props.activeParty || null}
        committee={props.activeCommittee || null}
        nominations={props.nominations}
        openNominationPositions={props.openNominationPositions}
        elections={props.elections}
        flashVotes={props.flashVotes}
        onFileNomination={(nom) => {
          storageService.addNomination(nom);
          if (activeEvent) {
            props.setNominations(storageService.getNominations(activeEvent.id));
          }
        }}
        onCastVote={(elecId, candId, delId) => {
          storageService.castVoteInElection(elecId, candId, delId || props.currentStudent!.id);
          if (activeEvent) {
            props.setElections(storageService.getElections(activeEvent.id));
          }
        }}
        onCastFlashVote={(vId, l, dec) => {
          storageService.castFlashVote(vId, l, dec);
          if (activeEvent) {
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id));
          }
        }}
        onShowToast={props.addToast}
      />
    ) : (
      <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        No student delegate details found. Please sign in with your access code.
      </div>
    );
  }

  return (
    <>
      {activeTabFromPath === 'overview' && (
        <EventOverviewTab
          event={activeEvent}
          participantCount={props.learners.filter(l => l.event_id === activeEvent.id || !l.event_id).length}
          electionsCount={props.elections.filter(e => e.event_id === activeEvent.id || !e.event_id).length || activeEvent.elections_count || 3}
          onUpdateEvent={(upd) => {
            storageService.updateEvent(upd);
            props.setCurrentEvent(upd);
            props.setEvents?.(storageService.getEvents());
          }}
          onNavigateTab={(tab) => {
            const slug = getEventSlug(activeEvent);
            props.navigate(`/events/${slug}/${tab}`);
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'team' && (
        <TeamTab
          team={props.team}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddMember={(tm) => storageService.addTeamMember(tm)}
          onDeleteMember={(id) => storageService.deleteTeamMember(id)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'checklist' && (
        <ChecklistTab
          checklist={props.checklist}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onToggleItem={(id) => storageService.toggleChecklistItem(id)}
          onAddItem={(item) => storageService.addChecklistItem(item)}
          onDeleteItem={(id) => storageService.deleteChecklistItem(id)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'agenda' && (
        <AgendaTab
          agenda={props.agenda}
          eventId={activeEvent.id}
          onAddAgendaItem={props.handleAddAgendaItem}
          onSetCurrentItem={props.handleSetCurrentAgendaItem}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'participants' && (
        <ParticipantsTab
          learners={props.learners}
          parties={props.parties}
          committees={props.committees}
          eventName={activeEvent.college_name}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onToggleCheckIn={props.handleToggleCheckIn}
          onCheckInAll={props.handleCheckInAll}
          onOpenAddWalkIn={() => props.setIsAddWalkInOpen(true)}
          onOpenImportCsv={() => props.setIsImportCsvOpen(true)}
          onOpenAllocationModal={() => props.setIsAllocationModalOpen(true)}
          onUpdateLearner={props.handleUpdateLearner}
          onDeleteLearner={props.handleDeleteLearner}
          onDeleteMultipleLearners={props.handleDeleteMultipleLearners}
          onClearAllLearners={props.handleClearAllLearners}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'nominations' && (
        <NominationsTab
          nominations={props.nominations}
          learners={props.learners}
          parties={props.parties}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          openPositions={props.openNominationPositions}
          onToggleOpenPosition={props.handleToggleOpenNominationPosition}
          onSetAllOpenPositions={props.handleSetAllOpenNominationPositions}
          onAddNomination={(nom) => {
            storageService.addNomination(nom);
            props.setNominations(storageService.getNominations(activeEvent.id));
          }}
          onUpdateStatus={(id, status) => {
            storageService.updateNominationStatus(id, status);
            props.setNominations(storageService.getNominations(activeEvent.id));
          }}
          onDeleteNomination={(id) => {
            storageService.deleteNomination(id);
            props.setNominations(storageService.getNominations(activeEvent.id));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'questionnaire' && (
        <QuestionnaireTab
          questions={props.questions}
          learners={props.learners}
          eventId={activeEvent.id}
          onAddQuestion={(q) => storageService.addQuestion(q)}
          onAnswerQuestion={(id, resp) => storageService.answerQuestion(id, resp)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'committees' && (
        <CommitteesTab
          committees={props.committees}
          learners={props.learners}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddCommittee={props.handleAddCommittee}
          onUpdateCommittee={props.handleUpdateCommittee}
          onDeleteCommittee={props.handleDeleteCommittee}
          onSetCommitteeCount={(count) => {
            const newComms = storageService.setCommitteeCount(activeEvent.id, count);
            props.setCommittees(newComms);
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'parties' && (
        <PartiesTab
          parties={props.parties}
          learners={props.learners}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onUpdatePartyWhatsApp={(id, link) => storageService.updatePartyWhatsAppLink(id, link)}
          onAddParty={props.handleAddParty}
          onUpdateParty={props.handleUpdateParty}
          onDeleteParty={props.handleDeleteParty}
          onSetPartyCount={(count) => {
            const newParties = storageService.setPartyCount(activeEvent.id, count);
            props.setParties(newParties);
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'allocation' && (
        <AllocationTab
          learners={props.learners}
          parties={props.parties}
          committees={props.committees}
          eventId={activeEvent.id}
          onExecuteAllocation={props.handleExecuteAllocation}
          onResetAllocation={props.handleResetAllocation}
          onUpdateLearner={props.handleUpdateLearner}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'cabinet' && (
        <CabinetTab
          learners={props.learners}
          eventId={activeEvent.id}
          savedMinistries={activeEvent.cabinet_ministries}
          onSaveCabinet={(ministries) => {
            storageService.saveCabinetMinistries(activeEvent.id, ministries);
            props.setCurrentEvent(prev => prev ? { ...prev, cabinet_ministries: ministries } : prev);
            props.setEvents?.(storageService.getEvents());
          }}
          onAssignCabinetRole={(learnerId, portfolioRole) => {
            storageService.assignCabinetRole(activeEvent.id, learnerId, portfolioRole);
            props.setLearners(storageService.getLearners(activeEvent.id));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'jury' && (
        <JuryTab
          jury={props.jury}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddJury={props.handleAddJury}
          onDeleteJury={props.handleDeleteJury}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'volunteers' && (
        <VolunteersTab
          volunteers={props.volunteers}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          parties={props.parties}
          committees={props.committees}
          onAddVolunteer={props.handleAddVolunteer}
          onToggleArrival={(id) => storageService.toggleVolunteerArrival(id)}
          onBulkImportVolunteers={(vols) => storageService.bulkImportVolunteers(vols, activeEvent.id)}
          onDeleteVolunteer={props.handleDeleteVolunteer}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'control' && (
        <ControlTab
          learners={props.learners}
          parties={props.parties}
          agenda={props.agenda}
          scores={props.scores}
          elections={props.elections}
          flashVotes={props.flashVotes}
          currentEvent={activeEvent}
          eventName={activeEvent.college_name}
          onShowToast={props.addToast}
          onSetCurrentAgendaItem={props.handleSetCurrentAgendaItem}
          onUpdatePartyBench={(partyId, bench) => {
            storageService.setPartyBench(partyId, bench, activeEvent.id);
            props.setParties(storageService.getParties(activeEvent.id));
            props.setLearners(storageService.getLearners(activeEvent.id));
          }}
          onOpenLivePollModal={() => props.navigate(`/events/${getEventSlug(activeEvent)}/elections`)}
          onOpenProjectorView={() => props.navigate(`/events/${getEventSlug(activeEvent)}/projector`)}
        />
      )}

      {activeTabFromPath === 'projector' && (
        <ProjectorTab
          currentEvent={activeEvent}
          agenda={props.agenda}
          elections={props.elections}
          flashVotes={props.flashVotes}
          learners={props.learners}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'elections' && (
        <ElectionsTab
          elections={props.elections}
          flashVotes={props.flashVotes}
          learners={props.learners}
          parties={props.parties}
          nominations={props.nominations}
          eventId={activeEvent.id}
          onCastVote={(elecId, candId, delId) => {
            storageService.castVoteInElection(elecId, candId, delId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onCloseElection={(elecId) => {
            storageService.closeElection(elecId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onSetElectionStatus={(elecId, status) => {
            storageService.setElectionStatus(elecId, status);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onAddCandidate={(elecId, cand) => {
            storageService.addCandidateToElection(elecId, cand);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onRemoveCandidate={(elecId, candId) => {
            storageService.removeCandidateFromElection(elecId, candId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onResetElection={(elecId) => {
            storageService.resetElection(elecId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onDeleteElection={(elecId) => {
            storageService.deleteElection(elecId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onCreateElection={(elec) => {
            storageService.createElection(elec);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onCreateFlashVote={(evId, q, audience, motion) => {
            storageService.createFlashVote(evId || activeEvent.id, q, audience, motion);
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id));
          }}
          onCastFlashVote={(vId, learner, decision) => {
            const res = storageService.castFlashVote(vId, learner, decision);
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id));
            return res;
          }}
          onCloseFlashVote={(vId) => {
            storageService.closeFlashVote(vId);
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id));
          }}
          onDeleteFlashVote={(vId) => {
            storageService.deleteFlashVote(vId);
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'proceedings' && (
        <ProceedingsTab
          proceedings={props.proceedings}
          learners={props.learners}
          eventId={activeEvent.id}
          onAddBill={(bill) => storageService.addBill(bill)}
          onUpdateBillStatus={(id, status, ayes, noes) => storageService.updateBillStatus(id, status, ayes, noes)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'chat' && (
        <ChatTab
          messages={props.chatMessages}
          eventId={activeEvent.id}
          onSendMessage={(evId, sName, sRole, msg, isAnn) => storageService.sendChatMessage(evId, sName, sRole, msg, isAnn)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'scoregrid' && (
        <ScoreGridTab
          scores={props.scores}
          learners={props.learners}
          eventId={activeEvent.id}
          onSaveScore={(sc) => storageService.saveScoreRecord(sc)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'media' && (
        <MediaTab
          eventName={activeEvent.college_name}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'awards' && (
        <AwardsTab
          learners={props.learners}
          eventName={activeEvent.college_name}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'chapterawards' && (
        <ChapterAwardsTab
          eventName={activeEvent.college_name}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'feedback' && (
        <FeedbackTab
          feedbackList={props.feedback}
          eventId={activeEvent.id}
          onSubmitFeedback={(fb) => storageService.submitFeedback(fb)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'report' && (
        <ReportTab
          event={activeEvent}
          learners={props.learners}
          proceedings={props.proceedings}
          onShowToast={props.addToast}
        />
      )}
    </>
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const initialSession = getInitialSavedSession();
  const routeInfo = getInitialRouteInfo(initialSession);

  const [role, setRole] = useState<UserRole>(() => routeInfo.role);
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>(() => routeInfo.activeNavTab || initialSession?.activeNavTab || (initialSession?.role === 'super_admin' ? 'events_dashboard' : 'participants'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => routeInfo.isAuthenticated);
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    if (!routeInfo.isAuthenticated || !initialSession) return null;
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
    setToasts(prev => {
      const last = prev[prev.length - 1];
      if (last && last.title === title && last.message === message) {
        return prev;
      }
      const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return [...prev, { id, title, message, type }];
    });
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
      storageService.clearUserCache();
      setUserSession(null);
      setCurrentStudent(null);
      setCurrentVolunteer(null);
      setCurrentJury(null);
      storageService.forceRefresh();
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

      // Sync active user objects (volunteer, student, jury) with DB records to prevent stale session IDs
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const sess = JSON.parse(saved);
          if (sess.role === 'volunteer' && sess.volunteerCode) {
            const cleanCode = sess.volunteerCode.trim().toUpperCase();
            const allVols = storageService.getVolunteers();
            const matched = allVols.find(v => (v.access_code || '').trim().toUpperCase() === cleanCode || (v.phone && cleanCode.length >= 4 && v.phone.replace(/\D/g, '').endsWith(cleanCode.replace(/\D/g, ''))));
            if (matched) {
              setCurrentVolunteer(matched);
            }
          } else if (sess.role === 'student' && sess.studentCode) {
            const cleanCode = sess.studentCode.trim().toUpperCase();
            const allL = storageService.getLearners();
            const matched = allL.find(l => (l.access_code || '').trim().toUpperCase() === cleanCode);
            if (matched) {
              setCurrentStudent(matched);
            }
          } else if (sess.role === 'jury' && sess.juryCode) {
            const cleanCode = sess.juryCode.trim().toUpperCase();
            const allJ = storageService.getJury();
            const matched = allJ.find(j => (j.access_code || '').trim().toUpperCase() === cleanCode);
            if (matched) {
              setCurrentJury(matched);
            }
          }
        }
      } catch (e) {
        console.error('Session sync error:', e);
      }
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
        const pathname = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
        const search = (typeof window !== 'undefined' ? window.location.search : '').toLowerCase();

        // 1. Standalone Projector View requested (/display, /projector, or ?projector=true)
        if (pathname.includes('/display') || pathname.includes('/projector') || search.includes('projector=true')) {
          setRole('coordinator');
          setActiveNavTab('projector');
          setIsAuthenticated(true);
          return;
        }

        const saved = localStorage.getItem(SESSION_KEY);
        const sess: SavedAuthSession | null = saved ? JSON.parse(saved) : null;
        const evs = storageService.getEvents();

        if (sess?.currentEventId) {
          const targetEv = evs.find(e => e.id === sess.currentEventId);
          if (targetEv) {
            setCurrentEvent(targetEv);
            currentEventRef.current = targetEv;
          }
        }

        // 2. Explicit Volunteer Join Link requested (/join)
        if (pathname.includes('/join')) {
          if (sess && sess.role === 'volunteer' && sess.volunteerCode) {
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
          // If no active volunteer session, present Volunteer Access Sign-in page
          setIsAuthenticated(false);
          setRole('volunteer');
          return;
        }

        // 3. Explicit Jury Link requested (/jury)
        if (pathname.includes('/jury')) {
          if (sess && sess.role === 'jury' && sess.juryCode) {
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
          setIsAuthenticated(false);
          setRole('jury');
          return;
        }

        // 4. Explicit Student Delegate Link requested (/me or /student)
        if (pathname.includes('/me') || pathname.includes('/student')) {
          if (sess && sess.role === 'student' && sess.studentCode) {
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
          setIsAuthenticated(false);
          setRole('student');
          return;
        }

        if (!sess) {
          setIsAuthenticated(false);
          return;
        }

        // Standard Session Restoration (Default Route /)
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

  const handleSetAllOpenNominationPositions = (open: boolean, positions: string[]) => {
    if (currentEvent) {
      storageService.setAllNominationPositionsStatus(currentEvent.id, open, positions);
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
    if (tab === 'events_dashboard') {
      navigate('/events');
    } else {
      const slug = currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026';
      const path = tabToPath(tab);
      navigate(`/events/${slug}/${path}`);
    }
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
    if (currentEvent) {
      setLearners(storageService.getLearners(currentEvent.id));
    } else {
      setLearners(storageService.getLearners());
    }
  };

  const handleCheckInAll = (day: 1 | 2, state: boolean) => {
    if (currentEvent) {
      storageService.checkInAll(currentEvent.id, day, state);
      setLearners(storageService.getLearners(currentEvent.id));
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
      if (storageService.getAllocationLock(currentEvent.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to run allocation.', 'error');
        return;
      }
      try {
        storageService.executeAllocationForEvent(currentEvent.id, rulingRatio);
      } catch (err: any) {
        addToast('Allocation Locked', err?.message || 'Cannot execute allocation while lock is enabled.', 'error');
      }
    }
  };

  const handleResetAllocation = () => {
    if (currentEvent) {
      if (storageService.getAllocationLock(currentEvent.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to reset allocation.', 'error');
        return;
      }
      try {
        storageService.resetAllocationsForEvent(currentEvent.id);
      } catch (err: any) {
        addToast('Allocation Locked', err?.message || 'Cannot reset allocation while lock is enabled.', 'error');
      }
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
            const normCode = cleanCode.replace(/-/g, '');
            const foundJury = storageService.getJury().find(j => {
              const code = (j.access_code || '').toUpperCase().replace(/-/g, '');
              return code === normCode || code === `JURY${normCode}` || `JURY${code}` === normCode;
            });
            if (foundJury || normCode.includes('JURY') || normCode.startsWith('JUR')) {
              const juryCodeVal = (foundJury?.access_code || cleanCode).replace('JURY-', 'JURY');
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

            // 3. Check Volunteer Access Code - enhanced matching
            // Find volunteer with normalized code matching
            const foundVol = storageService.getVolunteers().find(v => {
              // Normalize both the input code and stored code for comparison
              const code = (v.access_code || '').toUpperCase().replace(/-/g, '');
              const normCode = cleanCode.replace(/-/g, '').toUpperCase();
              const phoneSuffix = v.phone ? v.phone.replace(/\D/g, '').slice(-4) : '';
              
              // Multiple matching strategies
              const codeMatches =
                code === normCode ||                                    // Exact match
                code === `VOL${normCode}` ||                           // VOL prefix
                normCode === `VOL${code}` ||                           // Reverse VOL prefix
                (phoneSuffix && phoneSuffix === normCode);             // Phone suffix only
              
              const codeFormatMatch =
                code.startsWith('VOL') &&                              // Stored has VOL prefix
                normCode.replace('VOL', '').length > 0;                // Input has content after VOL
              
              return codeMatches || codeFormatMatch || (phoneSuffix && phoneSuffix === normCode);
            });
            if (foundVol || normCode.includes('VOL') || normCode.startsWith('V0')) {
              const volCodeVal = (foundVol?.access_code || cleanCode).replace('VOL-', 'VOL');
              const volObj: Volunteer = foundVol || { id: 'vol', name: 'Assembly Volunteer', access_code: volCodeVal, event_id: currentEvent?.id || '', station: 'Main Floor' };
              setCurrentVolunteer(volObj);
              setIsAuthenticated(true);
              setRole('volunteer');
              
              // CRITICAL FIX: Always set currentEvent from foundVol event_id, even if undefined
              // This ensures the dashboard loads learners from the correct event
              if (foundVol?.event_id) {
                const targetEv = events.find(e => e.id === foundVol.event_id);
                if (targetEv) {
                  setCurrentEvent(targetEv);
                }
              } else if (!currentEvent && events.length > 0) {
                // Fallback: use first event if no specific event tied to volunteer
                setCurrentEvent(events[0]);
              }
              
              saveSession({
                role: 'volunteer',
                volunteerCode: volCodeVal,
                name: foundVol?.name || 'Assembly Volunteer',
                currentEventId: foundVol?.event_id || (currentEvent?.id || '')
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
            clearSession();
            setIsAuthenticated(false);
            setRole('volunteer');
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/join');
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
          parties={parties}
          committees={committees}
          elections={elections}
          flashVotes={flashVotes}
          onToggleCheckIn={handleToggleCheckIn}
          onCheckInAll={handleCheckInAll}
          onAddWalkIn={(l) => {
            handleAddLearner(l);
            setLearners(storageService.getLearners(currentEvent?.id));
          }}
          onCastVote={(elecId, candId, delId) => {
            storageService.castVoteInElection(elecId, candId, delId);
            if (currentEvent) setElections(storageService.getElections(currentEvent.id));
          }}
          onCastFlashVote={(vId, l, dec) => {
            storageService.castFlashVote(vId, l, dec);
            if (currentEvent) setFlashVotes(storageService.getFlashVotes(currentEvent.id));
          }}
          onToggleVolunteerArrival={(id) => storageService.toggleVolunteerArrival(id)}
          onLogout={() => {
            clearSession();
            setIsAuthenticated(false);
            setRole('volunteer');
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/join');
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

  const isTabRoute = location.pathname.startsWith('/events/') && location.pathname !== '/events';

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
        onEventChange={(ev) => {
          handleEventChange(ev);
          const slug = getEventSlug(ev);
          navigate(`/events/${slug}/overview`);
        }}
        onLogout={() => {
          clearSession();
          setIsAuthenticated(false);
          setRole('coordinator');
          navigate('/');
          addToast('Signed Out', 'You have been signed out', 'info');
        }}
        onGoHome={() => {
          if (role === 'student') {
            navigate('/me');
            return;
          }
          navigate('/events');
        }}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />

      {/* Main Body Layout */}
      <div className="flex">
            
            {/* Left Vertical Sidebar (Desktop + Mobile Slide-Out Drawer) */}
            {isTabRoute && (
              <Sidebar
                activeTab={activeNavTab}
                onSelectTab={(tab) => handleSelectTab(tab)}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                completedTabs={completedTabsSet}
                role={role}
                eventSlug={currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026'}
                onBackToEvents={() => {
                  navigate('/events');
                }}
              />
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
              
              {/* Mobile Quick-Navigation Pill Bar */}
              {isTabRoute && currentEvent && (
                <div className="lg:hidden mb-4 overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-none">
                  {mobileQuickTabs.map(qTab => {
                    const isActive = activeNavTab === qTab.id;
                    const targetSlug = currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026';
                    const targetPath = tabToPath(qTab.id);
                    return (
                      <Link
                        key={qTab.id}
                        to={`/events/${targetSlug}/${targetPath}`}
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
                      </Link>
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

              <Routes>
            {/* Root path -> redirect to /events */}
            <Route path="/" element={<Navigate to="/events" replace />} />

            {/* Event Hub / Selector */}
            <Route
              path="/events"
              element={
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
                    const slug = getEventSlug(ev);
                    navigate(`/events/${slug}/overview`);
                    addToast('Event Selected', `Opened ${ev.college_name}`, 'info');
                  }}
                  onShowToast={addToast}
                />
              }
            />

            {/* Redirect /events/:eventSlug to /events/:eventSlug/overview */}
            <Route
              path="/events/:eventSlug"
              element={
                <EventSlugOnlyRedirector events={events} />
              }
            />

            {/* Event Tab Routes: /events/:eventSlug/:tab */}
            <Route
              path="/events/:eventSlug/:tab"
              element={
                <EventTabRouteHandler
                  events={events}
                  coordinators={coordinators}
                  currentEvent={currentEvent}
                  onEventChange={handleEventChange}
                  activeNavTab={activeNavTab}
                  setActiveNavTab={setActiveNavTab}
                  saveSession={saveSession}
                  learners={learners}
                  parties={parties}
                  committees={committees}
                  agenda={agenda}
                  jury={jury}
                  volunteers={volunteers}
                  nominations={nominations}
                  elections={elections}
                  flashVotes={flashVotes}
                  checklist={checklist}
                  questions={questions}
                  proceedings={proceedings}
                  scores={scores}
                  chatMessages={chatMessages}
                  feedback={feedback}
                  team={team}
                  openNominationPositions={openNominationPositions}
                  role={role}
                  userSession={userSession}
                  addToast={addToast}
                  handleToggleCheckIn={handleToggleCheckIn}
                  handleCheckInAll={handleCheckInAll}
                  handleUpdateLearner={handleUpdateLearner}
                  handleDeleteLearner={handleDeleteLearner}
                  handleDeleteMultipleLearners={handleDeleteMultipleLearners}
                  handleClearAllLearners={handleClearAllLearners}
                  handleToggleOpenNominationPosition={handleToggleOpenNominationPosition}
                  handleSetAllOpenNominationPositions={handleSetAllOpenNominationPositions}
                  handleAddCommittee={handleAddCommittee}
                  handleUpdateCommittee={handleUpdateCommittee}
                  handleDeleteCommittee={handleDeleteCommittee}
                  setCommittees={setCommittees}
                  handleAddParty={handleAddParty}
                  handleUpdateParty={handleUpdateParty}
                  handleDeleteParty={handleDeleteParty}
                  setParties={setParties}
                  handleExecuteAllocation={handleExecuteAllocation}
                  handleResetAllocation={handleResetAllocation}
                  setCurrentEvent={setCurrentEvent}
                  setEvents={setEvents}
                  handleAssignCabinetRole={handleAssignCabinetRole}
                  handleAddJury={handleAddJury}
                  handleDeleteJury={handleDeleteJury}
                  handleAddVolunteer={handleAddVolunteer}
                  handleDeleteVolunteer={handleDeleteVolunteer}
                  setLearners={setLearners}
                  handleSetCurrentAgendaItem={handleSetCurrentAgendaItem}
                  setElections={setElections}
                  setFlashVotes={setFlashVotes}
                  setNominations={setNominations}
                  setIsAddWalkInOpen={setIsAddWalkInOpen}
                  setIsImportCsvOpen={setIsImportCsvOpen}
                  setIsAllocationModalOpen={setIsAllocationModalOpen}
                  handleAddAgendaItem={handleAddAgendaItem}
                  activeParty={activeParty}
                  activeCommittee={activeCommittee}
                  currentStudent={currentStudent}
                  navigate={navigate}
                />
              }
            />

            {/* Fallback wildcard */}
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Routes>

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
            eventId={currentEvent.id}
            onExecuteAllocation={(ratio) => {
              handleExecuteAllocation(ratio);
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
