import { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getEventSlug, findEventBySlug, extractEventFromUrl, pathToTab, tabToPath } from './utils/slug';
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
  EventDay,
  DayAttendanceRecord,
  DayAttendanceStatus
} from './types';
import { storageService } from './services/storageService';
import { Header } from './components/common/Header';
import { Sidebar, type ActiveNavTab } from './components/common/Sidebar';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { StandaloneProjectorDisplay } from './components/common/StandaloneProjectorDisplay';
import { useTheme } from './lib/theme';

import { UnifiedLoginPage } from './components/auth/UnifiedLoginPage';
import { MyEventsDashboard } from './components/admin/MyEventsDashboard';
import { EventOverviewTab } from './components/admin/EventOverviewTab';
import { DaysActivitiesTab } from './components/admin/DaysActivitiesTab';

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
import { StudentJoinView } from './components/student/StudentJoinModal';
import { JuryDashboard } from './components/jury/JuryDashboard';
import { VolunteerDashboard } from './components/volunteer/VolunteerDashboard';

const SESSION_KEY = 'tn_assembly_auth_session';

interface SavedAuthSession {
  role: UserRole;
  email?: string;
  name?: string;
  assigned_event_ids?: string[];
  studentCode?: string;
  student?: Learner;
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

  // Standalone Projector View (/display, ?projector=true, /live-projector) - strictly excluding /events/
  const isStandalone = (
    pathname.includes('/display') ||
    pathname.includes('/live-projector') ||
    search.includes('projector=true') ||
    search.includes('display=true')
  ) && !pathname.includes('/events/');

  if (isStandalone) {
    return { role: 'coordinator' as UserRole, isAuthenticated: true, activeNavTab: 'projector' as ActiveNavTab };
  }

  // If user has a valid saved session, preserve their role and authentication
  if (initialSession) {
    if (initialSession.role === 'coordinator' || initialSession.role === 'super_admin' || initialSession.role === 'organiser') {
      if (!pathname.startsWith('/jury') && !pathname.startsWith('/volunteer') && !pathname.startsWith('/join')) {
        return { role: initialSession.role, isAuthenticated: true };
      }
    } else if (initialSession.role === 'jury' && initialSession.juryCode) {
      if (pathname.includes('/jury') || !pathname.includes('/events/')) {
        return { role: 'jury' as UserRole, isAuthenticated: true };
      }
    } else if (initialSession.role === 'volunteer' && initialSession.volunteerCode) {
      if (pathname.includes('/volunteer') || !pathname.includes('/events/')) {
        return { role: 'volunteer' as UserRole, isAuthenticated: true };
      }
    } else if (initialSession.role === 'student' && initialSession.studentCode) {
      return { role: 'student' as UserRole, isAuthenticated: true };
    }
  }

  // Unauthenticated portal checks (strictly excluding /events/ coordinator routes)
  if (!pathname.includes('/events/')) {
    if (pathname.startsWith('/volunteer')) {
      return { role: 'volunteer' as UserRole, isAuthenticated: false };
    }
    if (pathname.startsWith('/jury')) {
      return { role: 'jury' as UserRole, isAuthenticated: false };
    }
    if (pathname.includes('/join') || pathname.includes('/dashboard') || pathname.includes('/me') || pathname.includes('/student')) {
      return { role: 'student' as UserRole, isAuthenticated: false };
    }
  }

  // Default: Use initialSession
  if (!initialSession) {
    return { role: 'coordinator' as UserRole, isAuthenticated: false };
  }
  return { role: initialSession.role, isAuthenticated: true };
}

function EventSlugOnlyRedirector({ events, role }: { events: CollegeEvent[]; role?: UserRole }) {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const matched = findEventBySlug(events, eventSlug);
  if (!matched && events.length > 0) {
    if (role === 'student') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/events" replace />;
  }
  const slug = matched ? getEventSlug(matched) : (eventSlug || 'jkkncet-tn-assembly-2026');
  if (role === 'student') {
    return <Navigate to={`/events/${slug}/dashboard`} replace />;
  }
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
  handleExecuteAllocation: (ratio: any, targetEventId?: string) => void;
  handleAllocateParties?: (options?: any, targetEventId?: string) => void;
  handleAllocateCommittees?: (options?: any, targetEventId?: string) => void;
  handleAllocateConstituencies?: (options?: any, targetEventId?: string) => void;
  handleResetAllocation: (targetEventId?: string) => void;
  setCurrentEvent: React.Dispatch<React.SetStateAction<CollegeEvent | null>>;
  setEvents?: React.Dispatch<React.SetStateAction<CollegeEvent[]>>;
  handleAssignCabinetRole: (learnerId: string, role: string) => void;
  handleAddJury: (j: Partial<JuryMember>) => void;
  handleDeleteJury: (id: string) => void;
  handleAddVolunteer: (v: Partial<Volunteer>) => void;
  handleDeleteVolunteer: (id: string) => void;
  setVolunteers?: (volunteers: Volunteer[]) => void;
  setLearners: (learners: Learner[]) => void;
  handleSetCurrentAgendaItem: (id: string) => void;
  setElections: (elecs: Election[]) => void;
  setFlashVotes: (votes: LiveFlashVote[]) => void;
  setNominations: (noms: Nomination[]) => void;
  setScores: (scores: ScoreRecord[]) => void;
  setIsAddWalkInOpen: (open: boolean) => void;
  setIsImportCsvOpen: (open: boolean) => void;
  setIsAllocationModalOpen: (open: boolean) => void;
  handleAddAgendaItem: (item: Partial<AgendaItem>) => void;
  handleUpdateAgendaItem?: (item: AgendaItem) => void;
  handleDeleteAgendaItem?: (id: string) => void;
  handleDuplicateAgendaItem?: (id: string) => void;
  handleReorderAgendaItems?: (day: any, orderedIds: string[]) => void;
  handleToggleEnableAgendaItem?: (id: string) => void;
  handleSetAgendaStatus?: (id: string, status: any) => void;
  activeParty?: Party | null;
  activeCommittee?: Committee | null;
  currentStudent?: Learner | null;
  navigate: (path: string, options?: any) => void;
  eventDays: EventDay[];
  dayAttendance: DayAttendanceRecord[];
  handleAddEventDay: (dayData: Partial<EventDay>) => Promise<EventDay>;
  handleUpdateEventDay: (day: EventDay) => Promise<EventDay>;
  handleDeleteEventDay: (dayId: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  handleSetActiveEventDay: (dayId: string) => Promise<void>;
  handleSetStudentDayAttendance: (dayId: string, studentId: string, status: DayAttendanceStatus, markedBy?: string) => Promise<DayAttendanceRecord>;
  handleBatchSetDayAttendance: (dayId: string, studentIds: string[], status: DayAttendanceStatus, markedBy?: string) => Promise<void>;
}

function EventTabRouteHandler(props: EventTabRouteHandlerProps) {
  const { eventSlug, tab } = useParams<{ eventSlug: string; tab: string }>();
  const preferredEventId = props.userSession?.assigned_event_ids?.[0] || props.currentEvent?.id;
  const matchedEvent = findEventBySlug(props.events, eventSlug, preferredEventId);

  useEffect(() => {
    if (props.events.length > 0 && !matchedEvent) {
      if (props.role === 'student') {
        props.navigate('/dashboard', { replace: true });
        return;
      }
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

  // SAFE fallback: only use matchedEvent or currentEvent; NEVER blindly pick events[0]
  // to prevent cross-event contamination (e.g. showing JKKN ARTS data in JKKNCET view)
  const activeEvent = matchedEvent || props.currentEvent || props.events.find(e => e.id === preferredEventId);

  // Strictly event-scoped records computed synchronously so child views and tabs NEVER cross-bleed data across events
  const currentLearners = useMemo(() => {
    return activeEvent?.id ? storageService.getLearners(activeEvent.id) : props.learners;
  }, [activeEvent?.id, props.learners]);

  const currentParties = useMemo(() => {
    return activeEvent?.id ? storageService.getParties(activeEvent.id) : props.parties;
  }, [activeEvent?.id, props.parties]);

  const currentCommittees = useMemo(() => {
    return activeEvent?.id ? storageService.getCommittees(activeEvent.id) : props.committees;
  }, [activeEvent?.id, props.committees]);

  const currentNominations = useMemo(() => {
    return activeEvent?.id ? storageService.getNominations(activeEvent.id) : props.nominations;
  }, [activeEvent?.id, props.nominations]);

  const currentElections = useMemo(() => {
    return activeEvent?.id ? storageService.getElections(activeEvent.id) : props.elections;
  }, [activeEvent?.id, props.elections]);

  const currentFlashVotes = useMemo(() => {
    return activeEvent?.id ? storageService.getFlashVotes(activeEvent.id) : props.flashVotes;
  }, [activeEvent?.id, props.flashVotes]);

  const currentScores = useMemo(() => {
    return activeEvent?.id ? storageService.getScores(activeEvent.id) : props.scores;
  }, [activeEvent?.id, props.scores]);

  const currentAgenda = useMemo(() => {
    return activeEvent?.id ? storageService.getAgenda(activeEvent.id) : props.agenda;
  }, [activeEvent?.id, props.agenda]);

  const currentEventDays = useMemo(() => {
    return activeEvent?.id ? props.eventDays.filter(d => d.event_id === activeEvent.id) : props.eventDays;
  }, [activeEvent?.id, props.eventDays]);

  const currentDayAttendance = useMemo(() => {
    return activeEvent?.id ? props.dayAttendance.filter(a => a.event_id === activeEvent.id) : props.dayAttendance;
  }, [activeEvent?.id, props.dayAttendance]);

  const currentProceedings = useMemo(() => {
    return activeEvent?.id ? storageService.getProceedings(activeEvent.id) : props.proceedings;
  }, [activeEvent?.id, props.proceedings]);

  const currentChatMessages = useMemo(() => {
    return activeEvent?.id ? storageService.getChatMessages(activeEvent.id) : props.chatMessages;
  }, [activeEvent?.id, props.chatMessages]);

  const currentFeedback = useMemo(() => {
    return activeEvent?.id ? storageService.getFeedback(activeEvent.id) : props.feedback;
  }, [activeEvent?.id, props.feedback]);

  const currentJury = useMemo(() => {
    return activeEvent?.id ? storageService.getJury(activeEvent.id) : props.jury;
  }, [activeEvent?.id, props.jury]);

  const currentTeam = useMemo(() => {
    return activeEvent?.id ? storageService.getTeam(activeEvent.id) : props.team;
  }, [activeEvent?.id, props.team]);

  const currentChecklist = useMemo(() => {
    return activeEvent?.id ? storageService.getChecklist(activeEvent.id) : props.checklist;
  }, [activeEvent?.id, props.checklist]);

  const currentVolunteers = useMemo(() => {
    return activeEvent?.id ? storageService.getVolunteers(activeEvent.id) : props.volunteers;
  }, [activeEvent?.id, props.volunteers]);

  if (!activeEvent) {
    if (props.events.length > 0) {
      if (props.role === 'student') {
        return <Navigate to="/dashboard" replace />;
      }
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
    const studentElections = storageService.getElections(activeEvent.id, 'student', props.currentStudent?.id);
    const studentFlashVotes = storageService.getFlashVotes(activeEvent.id, 'student', props.currentStudent?.id);
    const studentNominations = storageService.getNominations(activeEvent.id, 'student', props.currentStudent?.id);

    return props.currentStudent ? (
      <StudentDashboard
        student={props.currentStudent}
        event={activeEvent}
        agenda={currentAgenda}
        party={props.activeParty || null}
        committee={props.activeCommittee || null}
        nominations={studentNominations}
        openNominationPositions={props.openNominationPositions}
        elections={studentElections}
        flashVotes={studentFlashVotes}
        onFileNomination={(nom) => {
          if (props.currentStudent?.role?.toLowerCase().includes('speaker')) {
            props.addToast('Nomination Ineligible', 'Assigned Speaker / Deputy Speaker delegates cannot file nominations.', 'error');
            return;
          }
          const existingNoms = storageService.getNominations(activeEvent?.id, 'student', props.currentStudent!.id);
          if (existingNoms.some(n => n.position === nom.position && n.status !== 'Rejected')) {
            props.addToast('Already Nominated', `You have already filed a nomination for ${nom.position}. Each member is eligible only once per post.`, 'error');
            return;
          }
          try {
            storageService.addNomination(nom);
            if (activeEvent) {
              props.setNominations(storageService.getNominations(activeEvent.id, 'student', props.currentStudent!.id));
            }
          } catch (err: any) {
            props.addToast('Nomination Error', err?.message || 'Failed to file nomination', 'error');
          }
        }}
        onCastVote={(elecId, candId, delId) => {
          storageService.castVoteInElection(elecId, candId, delId || props.currentStudent!.id);
          if (activeEvent) {
            props.setElections(storageService.getElections(activeEvent.id, 'student', props.currentStudent!.id));
          }
        }}
        onCastFlashVote={(vId, l, dec) => {
          storageService.castFlashVote(vId, l, dec);
          if (activeEvent) {
            props.setFlashVotes(storageService.getFlashVotes(activeEvent.id, 'student', props.currentStudent!.id));
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
          participantCount={storageService.getTotalAssignedCount(activeEvent.id || '')}
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
          team={currentTeam}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddMember={(tm) => storageService.addTeamMember(tm)}
          onUpdateMember={(tm) => storageService.updateTeamMember(tm)}
          onDeleteMember={(id) => storageService.deleteTeamMember(id)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'checklist' && (
        <ChecklistTab
          checklist={currentChecklist}
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
          agenda={currentAgenda}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddAgendaItem={props.handleAddAgendaItem}
          onUpdateAgendaItem={props.handleUpdateAgendaItem}
          onDeleteAgendaItem={props.handleDeleteAgendaItem}
          onDuplicateAgendaItem={props.handleDuplicateAgendaItem}
          onReorderAgendaItems={props.handleReorderAgendaItems}
          onToggleEnableAgendaItem={props.handleToggleEnableAgendaItem}
          onSetAgendaStatus={props.handleSetAgendaStatus}
          onSetCurrentItem={props.handleSetCurrentAgendaItem}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'participants' && (
        <ParticipantsTab
          learners={currentLearners}
          parties={currentParties}
          committees={currentCommittees}
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
          nominations={currentNominations}
          learners={currentLearners}
          parties={currentParties}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          openPositions={props.openNominationPositions}
          onToggleOpenPosition={props.handleToggleOpenNominationPosition}
          onSetAllOpenPositions={props.handleSetAllOpenNominationPositions}
          onAddNomination={(nom) => {
            try {
              storageService.addNomination(nom);
              props.setNominations(storageService.getNominations(activeEvent.id));
            } catch (err: any) {
              props.addToast('Nomination Error', err?.message || 'Unable to file nomination', 'error');
            }
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
          learners={currentLearners}
          eventId={activeEvent.id}
          onAddQuestion={(q) => storageService.addQuestion(q)}
          onAnswerQuestion={(id, resp) => storageService.answerQuestion(id, resp)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'committees' && (
        <CommitteesTab
          committees={currentCommittees}
          learners={currentLearners}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddCommittee={props.handleAddCommittee}
          onUpdateCommittee={props.handleUpdateCommittee}
          onDeleteCommittee={props.handleDeleteCommittee}
          onSetCommitteeCount={async (count) => {
            const newComms = await storageService.setCommitteeCount(activeEvent.id, count);
            props.setCommittees(newComms);
            props.setLearners(storageService.getLearners(activeEvent.id));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'parties' && (
        <PartiesTab
          parties={currentParties}
          learners={currentLearners}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onUpdatePartyWhatsApp={(id, link) => storageService.updatePartyWhatsAppLink(id, link)}
          onAddParty={props.handleAddParty}
          onUpdateParty={props.handleUpdateParty}
          onDeleteParty={props.handleDeleteParty}
          onSetPartyCount={async (count) => {
            const newParties = await storageService.setPartyCount(activeEvent.id, count);
            props.setParties(newParties);
            props.setLearners(storageService.getLearners(activeEvent.id));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'allocation' && (
        <AllocationTab
          learners={currentLearners}
          parties={currentParties}
          committees={currentCommittees}
          eventId={activeEvent.id}
          onExecuteAllocation={(rulingRatio) => {
            return props.handleExecuteAllocation(rulingRatio, activeEvent.id);
          }}
          onAllocateParties={(options) => {
            return props.handleAllocateParties?.(options, activeEvent.id);
          }}
          onAllocateCommittees={(options) => {
            return props.handleAllocateCommittees?.(options, activeEvent.id);
          }}
          onAllocateConstituencies={(options) => {
            return props.handleAllocateConstituencies?.(options, activeEvent.id);
          }}
          onResetAllocation={() => {
            return props.handleResetAllocation(activeEvent.id);
          }}
          onUpdateLearner={props.handleUpdateLearner}
          onOpenImportCsv={() => props.setIsImportCsvOpen(true)}
          onUpdatePartyBench={async (partyId, bench, evId) => {
            const targetEventId = evId || activeEvent.id;
            await storageService.setPartyBench(partyId, bench, targetEventId);
            props.setParties(storageService.getParties(targetEventId));
            props.setLearners(storageService.getLearners(targetEventId));
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'cabinet' && (
        <CabinetTab
          learners={currentLearners}
          parties={currentParties}
          eventId={activeEvent.id}
          savedMinistries={activeEvent.cabinet_ministries}
          isLocked={activeEvent.is_locked}
          onSaveCabinet={async (ministries) => {
            const result = await storageService.saveCabinetMinistries(activeEvent.id, ministries);
            if (result.success) {
              props.setCurrentEvent(prev => prev ? { ...prev, cabinet_ministries: ministries } : prev);
              props.setEvents?.(storageService.getEvents());
            }
            return result;
          }}
          onAssignCabinetRole={async (learnerId, portfolioRole) => {
            const result = await storageService.assignCabinetRole(activeEvent.id, learnerId, portfolioRole);
            if (result.success) {
              props.setLearners(storageService.getLearners(activeEvent.id));
            }
            return result;
          }}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'jury' && (
        <JuryTab
          jury={currentJury}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          onAddJury={props.handleAddJury}
          onDeleteJury={props.handleDeleteJury}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'volunteers' && (
        <VolunteersTab
          volunteers={currentVolunteers}
          eventId={activeEvent.id}
          userRole={props.userSession?.role || props.role}
          parties={currentParties}
          committees={currentCommittees}
          onAddVolunteer={props.handleAddVolunteer}
          onToggleArrival={(id) => storageService.toggleVolunteerArrival(id)}
          onBulkImportVolunteers={(vols) => {
            storageService.bulkImportVolunteers(vols, activeEvent.id);
            if (props.setVolunteers) {
              props.setVolunteers(storageService.getVolunteers(activeEvent.id));
            }
          }}
          onDeleteVolunteer={props.handleDeleteVolunteer}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'control' && (
        <ControlTab
          learners={currentLearners}
          parties={currentParties}
          agenda={currentAgenda}
          scores={currentScores}
          elections={currentElections}
          flashVotes={currentFlashVotes}
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
          agenda={currentAgenda}
          elections={currentElections}
          flashVotes={currentFlashVotes}
          learners={currentLearners}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'elections' && (
        <ElectionsTab
          elections={currentElections}
          flashVotes={currentFlashVotes}
          learners={currentLearners}
          parties={currentParties}
          nominations={currentNominations}
          eventId={activeEvent.id}
          onCastVote={(elecId, candId, delId) => {
            storageService.castVoteInElection(elecId, candId, delId);
            props.setElections(storageService.getElections(activeEvent.id));
          }}
          onCloseElection={(elecId) => {
            storageService.closeElection(elecId);
            props.setElections(storageService.getElections(activeEvent.id));
            props.setLearners(storageService.getLearners(activeEvent.id));
          }}
          onSetElectionStatus={(elecId, status) => {
            storageService.setElectionStatus(elecId, status);
            props.setElections(storageService.getElections(activeEvent.id));
            if (status === 'Closed') {
              props.setLearners(storageService.getLearners(activeEvent.id));
            }
          }}
          onAddCandidate={(elecId, cand) => {
            const result = storageService.addCandidateToElection(elecId, cand);
            if (result.success) {
              props.setElections(storageService.getElections(activeEvent.id));
            }
            return result;
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
          proceedings={currentProceedings}
          learners={currentLearners}
          eventId={activeEvent.id}
          eventSlug={getEventSlug(activeEvent)}
          onAddBill={(bill) => storageService.addBill(bill)}
          onUpdateBillStatus={(id, status, ayes, noes) => storageService.updateBillStatus(id, status, ayes, noes)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'chat' && (
        <ChatTab
          messages={currentChatMessages}
          eventId={activeEvent.id}
          onSendMessage={(evId, sName, sRole, msg, isAnn) => storageService.sendChatMessage(evId, sName, sRole, msg, isAnn)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'scoregrid' && (
        <ScoreGridTab
          scores={currentScores}
          learners={currentLearners}
          eventId={activeEvent.id}
          onSaveScore={(sc) => {
            storageService.saveScoreRecord(sc);
            props.setScores(storageService.getScores(activeEvent.id));
          }}
          onResetScores={() => {
            storageService.resetScores(activeEvent.id);
            props.setScores(storageService.getScores(activeEvent.id));
          }}
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
          learners={currentLearners}
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
          feedbackList={currentFeedback}
          eventId={activeEvent.id}
          onSubmitFeedback={(fb) => storageService.submitFeedback(fb)}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'days_activities' && (
        <DaysActivitiesTab
          event={activeEvent}
          eventDays={currentEventDays}
          dayAttendance={currentDayAttendance}
          learners={currentLearners}
          parties={currentParties}
          committees={currentCommittees}
          onAddDay={props.handleAddEventDay}
          onUpdateDay={props.handleUpdateEventDay}
          onDeleteDay={props.handleDeleteEventDay}
          onSetActiveDay={props.handleSetActiveEventDay}
          onSetStudentDayAttendance={props.handleSetStudentDayAttendance}
          onBatchSetDayAttendance={props.handleBatchSetDayAttendance}
          onShowToast={props.addToast}
        />
      )}

      {activeTabFromPath === 'report' && (
        <ReportTab
          event={activeEvent}
          learners={currentLearners}
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
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [dayAttendance, setDayAttendance] = useState<DayAttendanceRecord[]>([]);

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

    const urlEvent = extractEventFromUrl(evs);
    const activeId = targetEventId || urlEvent?.id || currentEventRef.current?.id || savedEventId;
    let activeEv = evs.find(e => e.id === activeId) || urlEvent || evs[0];

    if (activeEv) {
      setCurrentEvent(activeEv);
      currentEventRef.current = activeEv;
      saveSession({ currentEventId: activeEv.id });

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
      setEventDays(storageService.getEventDays(activeEv.id));
      setDayAttendance(storageService.getDayAttendance(activeEv.id));

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

    storageService.setWriteErrorHandler((table, action, error) => {
      const friendlyTable = table.replace(/_/g, ' ');
      const msg = error?.message || (typeof error === 'string' ? error : 'Database rejected write');
      addToast(
        'Save Failed',
        `Supabase rejected ${action} on ${friendlyTable}: ${msg}`,
        'error'
      );
    });

    // Check current browser path and restore authenticated session on refresh
    const checkPathAndRestore = () => {
      try {
        const pathname = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
        const search = (typeof window !== 'undefined' ? window.location.search : '').toLowerCase();

        // 1. Standalone Projector View requested (/display, ?projector=true, /live-projector) - strictly excluding /events/
        const isStandalone = (
          pathname.includes('/display') ||
          pathname.includes('/live-projector') ||
          search.includes('projector=true') ||
          search.includes('display=true')
        ) && !pathname.includes('/events/');

        if (isStandalone) {
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

        // 2. Explicit Volunteer Join Link requested (/join or /volunteer) - strictly excluding coordinator /events/ routes
        if (!pathname.includes('/events/') && (pathname.startsWith('/volunteer') || pathname === '/join' || pathname.startsWith('/join/'))) {
          if (sess && sess.role === 'volunteer' && sess.volunteerCode) {
            const cleanCode = sess.volunteerCode.trim().toUpperCase();
            const allVols = storageService.getVolunteers();
            const foundVol = allVols.find(v => (v.access_code || '').toUpperCase() === cleanCode);
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

        // 3. Explicit Jury Link requested (/jury) - strictly excluding coordinator /events/ routes
        if (!pathname.includes('/events/') && (pathname.startsWith('/jury') || pathname === '/jury')) {
          if (sess && sess.role === 'jury' && sess.juryCode) {
            const cleanCode = sess.juryCode.trim().toUpperCase();
            const allJury = storageService.getJury();
            const foundJury = allJury.find(j => (j.access_code || '').toUpperCase() === cleanCode);
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

        // 4. Explicit Student Delegate Link requested (/me or /student) - strictly excluding coordinator /events/ routes
        if (!pathname.includes('/events/') && (pathname.startsWith('/me') || pathname.startsWith('/student') || pathname === '/dashboard')) {
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

          // If student is on / or /events, redirect to their dashboard
          if (pathname === '/' || pathname === '/events' || pathname === '/events/') {
            const targetEv = evs.find(e => e.id === targetStudent.event_id) || evs[0];
            const targetSlug = targetEv ? getEventSlug(targetEv) : 'jkkncet-tn-assembly-2026';
            navigate(`/events/${targetSlug}/dashboard`, { replace: true });
          }
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

        if (sess.role === 'coordinator' || sess.role === 'organiser') {
          setIsAuthenticated(true);
          setRole(sess.role);
          if (sess.activeNavTab) setActiveNavTab(sess.activeNavTab);
          setUserSession({
            role: sess.role,
            email: sess.email || '',
            name: sess.name || (sess.role === 'organiser' ? 'Event Organiser' : 'Event Coordinator'),
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
      storageService.setWriteErrorHandler(null);
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
    setEventDays(storageService.getEventDays(ev.id));
    setDayAttendance(storageService.getDayAttendance(ev.id));

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

  const handleCreateEvent = async (collegeName: string, coordName: string, coordEmail: string, password: string) => {
    const newEv = storageService.addEvent({
      college_name: collegeName,
      assigned_coordinator_name: coordName,
      assigned_coordinator_email: coordEmail,
      location: 'Main Auditorium',
      dates: 'Day 1 & Day 2',
      status: 'Pre-Event',
      participant_count: 0
    });

    const newCoord: Partial<Coordinator> = {
      event_id: newEv.id,
      name: coordName,
      email: coordEmail,
      password_hash: password || 'coord123',
      raw_temp_password: password || 'coord123'
    };
    await storageService.addCoordinator(newCoord);

    setCurrentEvent(newEv);
    saveSession({ currentEventId: newEv.id });
    addToast('Event Created', `Created ${newEv.college_name}`, 'success');
  };

  const handleUpdateCoordinator = async (coord: Coordinator): Promise<{ success: boolean; error?: any; data?: any }> => {
    const res = await storageService.updateCoordinator(coord);
    if (!res.success) {
      addToast('Coordinator Update Failed', `Database rejected write: ${res.error?.message || 'Check database connection'}`, 'error');
      return res;
    }
    setCoordinators(storageService.getCoordinators());
    if (res.data) {
      setCurrentCoordinator(res.data);
    }
    addToast('Coordinator Updated', `Updated credentials for ${coord.name} (persisted to Supabase)`, 'success');
    return res;
  };

  const handleAddLearner = async (l: Partial<Learner>) => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    const targetEventId = l.event_id || activeEv?.id || '';
    const newLearner = await storageService.addLearner({ ...l, event_id: targetEventId });
    if (targetEventId) {
      setLearners(storageService.getLearners(targetEventId));
      setCurrentEvent(prev => prev ? { ...prev, participant_count: (prev.participant_count || 0) + 1 } : prev);
      setEvents(storageService.getEvents());
    } else {
      setLearners(storageService.getLearners());
    }
    return newLearner;
  };

  const handleUpdateLearner = async (l: Learner) => {
    await storageService.updateLearner(l);
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (activeEv) {
      setLearners(storageService.getLearners(activeEv.id));
    } else {
      setLearners(storageService.getLearners());
    }
  };

  const handleDeleteLearner = async (id: string) => {
    await storageService.deleteLearner(id);
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (activeEv) {
      setLearners(storageService.getLearners(activeEv.id));
      setCurrentEvent(prev => prev ? { ...prev, participant_count: Math.max(0, (prev.participant_count || 1) - 1) } : prev);
      setEvents(storageService.getEvents());
    } else {
      setLearners(storageService.getLearners());
    }
    addToast('Participant Deleted', 'Removed participant from event', 'info');
  };

  const handleDeleteMultipleLearners = async (ids: string[]) => {
    if (currentEvent) {
      await storageService.deleteLearners(ids, currentEvent.id);
      setLearners(storageService.getLearners(currentEvent.id));
      setCurrentEvent(prev => prev ? { ...prev, participant_count: Math.max(0, (prev.participant_count || 0) - ids.length) } : prev);
      setEvents(storageService.getEvents());
      addToast('Mass Delete', `Removed ${ids.length} participants`, 'info');
    }
  };

  const handleClearAllLearners = async () => {
    if (currentEvent) {
      await storageService.clearAllLearners(currentEvent.id);
      setLearners([]);
      setCurrentEvent(prev => prev ? { ...prev, participant_count: 0 } : prev);
      setEvents(storageService.getEvents());
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

  const handleCheckInAll = (day: 1 | 2, present: boolean) => {
    if (currentEvent) {
      storageService.checkInAll(currentEvent.id, day, present);
      setLearners(storageService.getLearners(currentEvent.id));
      addToast('Check-in Updated', `Day ${day} check-in updated for all delegates`, 'success');
    }
  };

  const handleAddParty = async (p: Partial<Party>) => {
    await storageService.addParty(p);
    if (currentEventRef.current) {
      setParties(storageService.getParties(currentEventRef.current.id));
    }
  };

  const handleUpdateParty = async (p: Party) => {
    await storageService.updateParty(p);
    if (currentEventRef.current) {
      setParties(storageService.getParties(currentEventRef.current.id));
      setLearners(storageService.getLearners(currentEventRef.current.id));
    }
  };

  const handleDeleteParty = async (id: string) => {
    await storageService.deleteParty(id);
    if (currentEventRef.current) {
      setParties(storageService.getParties(currentEventRef.current.id));
      setLearners(storageService.getLearners(currentEventRef.current.id));
    }
  };

  const handleAddCommittee = async (c: Partial<Committee>) => {
    await storageService.addCommittee(c);
    if (currentEventRef.current) {
      setCommittees(storageService.getCommittees(currentEventRef.current.id));
    }
  };

  const handleUpdateCommittee = async (c: Committee) => {
    await storageService.updateCommittee(c);
    if (currentEventRef.current) {
      setCommittees(storageService.getCommittees(currentEventRef.current.id));
      setLearners(storageService.getLearners(currentEventRef.current.id));
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    await storageService.deleteCommittee(id);
    if (currentEventRef.current) {
      setCommittees(storageService.getCommittees(currentEventRef.current.id));
      setLearners(storageService.getLearners(currentEventRef.current.id));
    }
  };

  const handleAddAgendaItem = (a: Partial<AgendaItem>) => {
    storageService.addAgendaItem(a);
  };

  const handleUpdateAgendaItem = (a: AgendaItem) => {
    storageService.updateAgendaItem(a);
  };

  const handleDeleteAgendaItem = (id: string) => {
    storageService.deleteAgendaItem(id);
  };

  const handleDuplicateAgendaItem = (id: string) => {
    storageService.duplicateAgendaItem(id);
  };

  const handleReorderAgendaItems = (day: any, orderedIds: string[]) => {
    if (currentEvent) {
      storageService.reorderAgendaItems(currentEvent.id, day, orderedIds);
    }
  };

  const handleToggleEnableAgendaItem = (id: string) => {
    storageService.toggleEnableAgendaItem(id);
  };

  const handleSetAgendaStatus = (id: string, status: any) => {
    storageService.setAgendaItemStatus(id, status);
  };

  const handleAddEventDay = async (dayData: Partial<EventDay>): Promise<EventDay> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) throw new Error('No active event');
    const newDay = await storageService.addEventDay(activeEv.id, dayData);
    setEventDays(storageService.getEventDays(activeEv.id));
    addToast('Day Added', `Created ${newDay.day_number || newDay.name}`, 'success');
    return newDay;
  };

  const handleUpdateEventDay = async (day: EventDay): Promise<EventDay> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) throw new Error('No active event');
    const updated = await storageService.updateEventDay(day);
    setEventDays(storageService.getEventDays(activeEv.id));
    addToast('Day Updated', `Saved changes for ${day.day_number || day.name}`, 'success');
    return updated;
  };

  const handleDeleteEventDay = async (dayId: string, force?: boolean): Promise<{ success: boolean; error?: string }> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) return { success: false, error: 'No active event' };
    const res = await storageService.deleteEventDay(activeEv.id, dayId, force ?? false);
    if (!res.success) {
      addToast('Cannot Delete Day', res.error || 'Failed to delete day', 'error');
      return res;
    }
    setEventDays(storageService.getEventDays(activeEv.id));
    setDayAttendance(storageService.getDayAttendance(activeEv.id));
    addToast('Day Deleted', 'Event day removed successfully', 'info');
    return res;
  };

  const handleSetActiveEventDay = async (dayId: string): Promise<void> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) return;
    await storageService.setActiveEventDay(activeEv.id, dayId);
    setEventDays(storageService.getEventDays(activeEv.id));
    addToast('Active Day Set', 'Volunteers will now record attendance for this day', 'info');
  };

  const handleSetStudentDayAttendance = async (
    dayId: string,
    studentId: string,
    status: DayAttendanceStatus,
    markedBy?: string
  ): Promise<DayAttendanceRecord> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) throw new Error('No active event');
    const rec = await storageService.setStudentDayAttendance(activeEv.id, dayId, studentId, status, markedBy || userSession?.name || role);
    setDayAttendance(storageService.getDayAttendance(activeEv.id));
    setLearners(storageService.getLearners(activeEv.id));
    return rec;
  };

  const handleBatchSetDayAttendance = async (
    dayId: string,
    studentIds: string[],
    status: DayAttendanceStatus,
    markedBy?: string
  ): Promise<void> => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (!activeEv) return;
    await storageService.batchSetDayAttendance(
      activeEv.id,
      dayId,
      studentIds,
      status,
      markedBy || userSession?.name || role
    );
    setDayAttendance(storageService.getDayAttendance(activeEv.id));
    setLearners(storageService.getLearners(activeEv.id));
    addToast('Attendance Updated', `Marked ${studentIds.length} students as ${status}`, 'success');
  };

  const handleSetCurrentAgendaItem = (itemId: string) => {
    if (currentEvent) {
      storageService.setCurrentAgendaItem(currentEvent.id, itemId);
      addToast('Agenda Updated', 'Marked active agenda item', 'info');
    }
  };

  const handleAddJury = async (j: Partial<JuryMember>) => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    const targetEventId = j.event_id || activeEv?.id || '';
    await storageService.addJuryMember({ ...j, event_id: targetEventId });
    if (targetEventId) {
      setJury(storageService.getJury(targetEventId));
    } else {
      setJury(storageService.getJury());
    }
  };

  const handleDeleteJury = async (id: string) => {
    await storageService.deleteJuryMember(id);
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (activeEv) {
      setJury(storageService.getJury(activeEv.id));
    } else {
      setJury(storageService.getJury());
    }
  };

  const handleAddVolunteer = async (v: Partial<Volunteer>) => {
    const activeEv = extractEventFromUrl(events) || currentEvent;
    const targetEventId = v.event_id || activeEv?.id || '';
    await storageService.addVolunteer({ ...v, event_id: targetEventId });
    if (targetEventId) {
      setVolunteers(storageService.getVolunteers(targetEventId));
    } else {
      setVolunteers(storageService.getVolunteers());
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    await storageService.deleteVolunteer(id);
    const activeEv = extractEventFromUrl(events) || currentEvent;
    if (activeEv) {
      setVolunteers(storageService.getVolunteers(activeEv.id));
    } else {
      setVolunteers(storageService.getVolunteers());
    }
  };

  // Auto Allocation Execution
  const handleExecuteAllocation = async (rulingRatio: number, targetEventId?: string) => {
    const activeEv = targetEventId
      ? events.find(e => e.id === targetEventId) || currentEvent
      : extractEventFromUrl(events) || currentEvent;

    if (activeEv) {
      if (storageService.getAllocationLock(activeEv.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to run allocation.', 'error');
        return;
      }
      try {
        await storageService.executeAllocationForEvent(activeEv.id, rulingRatio);
        setLearners(storageService.getLearners(activeEv.id));
        setParties(storageService.getParties(activeEv.id));
        setCommittees(storageService.getCommittees(activeEv.id));
        addToast('Allocation Complete', 'Party, bench, and committee seats allocated successfully.', 'success');
      } catch (err: any) {
        addToast('Allocation Failed', err?.message || 'Cannot execute allocation while lock is enabled.', 'error');
      }
    }
  };

  const handleAllocateParties = async (options?: any, targetEventId?: string) => {
    const activeEv = targetEventId
      ? events.find(e => e.id === targetEventId) || currentEvent
      : extractEventFromUrl(events) || currentEvent;

    if (activeEv) {
      if (storageService.getAllocationLock(activeEv.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to run allocation.', 'error');
        return;
      }
      try {
        await storageService.allocatePartiesForEvent(activeEv.id, options);
        setLearners(storageService.getLearners(activeEv.id));
        setParties(storageService.getParties(activeEv.id));
        addToast('Parties Allocated', 'Parties and constituencies allocated successfully.', 'success');
      } catch (err: any) {
        addToast('Party Allocation Failed', err?.message || 'Cannot execute party allocation while lock is enabled.', 'error');
      }
    }
  };

  const handleAllocateCommittees = async (options?: any, targetEventId?: string) => {
    const activeEv = targetEventId
      ? events.find(e => e.id === targetEventId) || currentEvent
      : extractEventFromUrl(events) || currentEvent;

    if (activeEv) {
      if (storageService.getAllocationLock(activeEv.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to run allocation.', 'error');
        return;
      }
      try {
        await storageService.allocateCommitteesForEvent(activeEv.id, options);
        setLearners(storageService.getLearners(activeEv.id));
        setCommittees(storageService.getCommittees(activeEv.id));
        addToast('Committees Allocated', 'Committees allocated successfully.', 'success');
      } catch (err: any) {
        addToast('Committee Allocation Failed', err?.message || 'Cannot execute committee allocation while lock is enabled.', 'error');
      }
    }
  };

  const handleAllocateConstituencies = async (options?: any, targetEventId?: string) => {
    const activeEv = targetEventId
      ? events.find(e => e.id === targetEventId) || currentEvent
      : extractEventFromUrl(events) || currentEvent;

    if (activeEv) {
      if (storageService.getAllocationLock(activeEv.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to run allocation.', 'error');
        return;
      }
      try {
        await storageService.allocateConstituenciesForEvent(activeEv.id, options);
        setLearners(storageService.getLearners(activeEv.id));
        addToast('Constituencies Allocated', 'Tamil Nadu constituencies allocated successfully.', 'success');
      } catch (err: any) {
        addToast('Constituency Allocation Failed', err?.message || 'Cannot execute constituency allocation while lock is enabled.', 'error');
      }
    }
  };

  const handleResetAllocation = async (targetEventId?: string) => {
    const activeEv = targetEventId
      ? events.find(e => e.id === targetEventId) || currentEvent
      : extractEventFromUrl(events) || currentEvent;

    if (activeEv) {
      if (storageService.getAllocationLock(activeEv.id)) {
        addToast('Allocation Locked', 'Allocation lock is active. Unlock in Control Panel to reset allocation.', 'error');
        return;
      }
      try {
        await storageService.resetAllocationsForEvent(activeEv.id);
        setLearners(storageService.getLearners(activeEv.id));
        addToast('Allocation Reset', 'Party and committee allocations have been reset to blank.', 'info');
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

  // Handle successful access code authentication (volunteer, jury, student)
  const handleAccessCodeLogin = (authResult: {
    role: 'volunteer' | 'jury' | 'student';
    user: Learner | Volunteer | JuryMember;
    eventId: string;
  }) => {
    const targetEv = events.find(e => e.id === authResult.eventId) || currentEvent || events[0];
    if (targetEv) {
      setCurrentEvent(targetEv);
      currentEventRef.current = targetEv;
      setLearners(storageService.getLearners(targetEv.id));
      setParties(storageService.getParties(targetEv.id));
      setCommittees(storageService.getCommittees(targetEv.id));
      setAgenda(storageService.getAgenda(targetEv.id));
      setOpenNominationPositions(storageService.getOpenNominationPositions(targetEv.id));
      setNominations(storageService.getNominations(targetEv.id));
      setElections(storageService.getElections(targetEv.id));
      setFlashVotes(storageService.getFlashVotes(targetEv.id));
      setVolunteers(storageService.getVolunteers(targetEv.id));
    }

    setIsAuthenticated(true);

    if (authResult.role === 'volunteer') {
      const vol = authResult.user as Volunteer;
      setRole('volunteer');
      setCurrentVolunteer(vol);
      setUserSession({ role: 'volunteer', name: vol.name });
      saveSession({
        role: 'volunteer',
        volunteerCode: vol.access_code,
        name: vol.name,
        currentEventId: targetEv?.id || vol.event_id
      });
      if (typeof window !== 'undefined') navigate('/volunteer');
      addToast('Volunteer Operations Access', `Authenticated Volunteer ${vol.name}`, 'success');
      return { id: vol.id, name: vol.name, full_name: vol.name, role: 'volunteer', access_code: vol.access_code };
    }

    if (authResult.role === 'jury') {
      const jury = authResult.user as JuryMember;
      setRole('jury');
      setCurrentJury(jury);
      setUserSession({ role: 'jury', name: jury.name });
      saveSession({
        role: 'jury',
        juryCode: jury.access_code,
        name: jury.name,
        currentEventId: targetEv?.id || jury.event_id
      });
      if (typeof window !== 'undefined') navigate('/jury');
      addToast('Jury Portal Access', `Authenticated Jury Member ${jury.name}`, 'success');
      return { id: jury.id, name: jury.name, full_name: jury.name, role: 'jury', access_code: jury.access_code };
    }

    // Role is student / delegate
    const student = authResult.user as Learner;
    setRole('student');
    setCurrentStudent(student);
    setUserSession({ role: 'student', name: student.full_name });
    saveSession({
      role: 'student',
      studentCode: student.access_code,
      student,
      currentEventId: targetEv?.id || student.event_id
    });
    const slug = targetEv ? getEventSlug(targetEv) : 'jkkncet-tn-assembly-2026';
    if (typeof window !== 'undefined') navigate(`/events/${slug}/dashboard`);
    addToast('Delegate Access Verified', `Welcome, ${student.full_name}`, 'success');
    return { ...student, role: 'student' };
  };

  // Standalone Projector Screen render check (strictly for standalone display paths like /display or /events/*/display, NOT /events/*/projector)
  const isStandaloneProjectorView = (typeof window !== 'undefined') && (
    window.location.pathname.toLowerCase().endsWith('/display') ||
    (window.location.pathname.toLowerCase().includes('/display') && !window.location.pathname.toLowerCase().includes('/projector')) ||
    window.location.pathname.toLowerCase().includes('/live-projector') ||
    window.location.search.toLowerCase().includes('display=true') ||
    (window.location.search.toLowerCase().includes('projector=true') && !window.location.pathname.toLowerCase().includes('/events/'))
  );

  if (isStandaloneProjectorView) {
    const activeEv = extractEventFromUrl(events) || currentEvent || events[0];
    const evId = activeEv?.id || '';
    return (
      <StandaloneProjectorDisplay
        currentEvent={activeEv}
        agenda={storageService.getAgenda(evId)}
        elections={storageService.getElections(evId)}
        flashVotes={storageService.getFlashVotes(evId)}
        learners={storageService.getLearners(evId)}
      />
    );
  }

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

            // 2. Check Event Coordinators strictly with authoritative credentials
            const allCoords = storageService.getCoordinators();
            const coordAccount = allCoords.find(c => c.email.trim().toLowerCase() === emailLower);

            if (coordAccount) {
              const sess = storageService.authenticateCoordinator(emailInput, passTrim);
              if (!sess) {
                // Coordinator account exists but entered password does not match authoritative password
                return null;
              }

              setUserSession(sess);
              setIsAuthenticated(true);
              setRole('coordinator');
              setActiveNavTab('overview');

              const allEvents = storageService.getEvents();
              let targetEv = allEvents.find(e => e.id === coordAccount.event_id);
              if (!targetEv && coordAccount.email) {
                targetEv = allEvents.find(e => e.assigned_coordinator_email?.toLowerCase() === coordAccount.email.toLowerCase());
              }
              if (!targetEv && allEvents.length > 0) {
                targetEv = allEvents[0];
              }

              if (targetEv) {
                setCurrentEvent(targetEv);
                currentEventRef.current = targetEv;
                setLearners(storageService.getLearners(targetEv.id));
                setParties(storageService.getParties(targetEv.id));
                setCommittees(storageService.getCommittees(targetEv.id));
              }

              saveSession({
                role: 'coordinator',
                email: coordAccount.email,
                name: coordAccount.name,
                assigned_event_ids: [coordAccount.event_id],
                currentEventId: targetEv?.id || coordAccount.event_id,
                activeNavTab: 'overview'
              });
              const eventSlugToUse = targetEv ? getEventSlug(targetEv) : 'jkkncet-tn-assembly-2026';
              navigate(`/events/${eventSlugToUse}/overview`);
              return sess;
            }

            // 3. Check Other Team Members (e.g. Organiser)
            const allTeam = storageService.getTeam();
            const teamMember = allTeam.find(
              t => t.email.trim().toLowerCase() === emailLower && t.access_code === passTrim
            );

            if (teamMember) {
              const userRole: UserRole = teamMember.role === 'Organiser' ? 'organiser' : 'coordinator';
              const sess: UserSession = {
                role: userRole,
                email: teamMember.email,
                name: teamMember.name,
                assigned_event_ids: [teamMember.event_id]
              };
              setUserSession(sess);
              setIsAuthenticated(true);
              setRole(userRole);
              setActiveNavTab('overview');

              const allEvents = storageService.getEvents();
              let targetEv = allEvents.find(e => e.id === teamMember.event_id) || allEvents[0];
              if (targetEv) {
                setCurrentEvent(targetEv);
                currentEventRef.current = targetEv;
                setLearners(storageService.getLearners(targetEv.id));
                setParties(storageService.getParties(targetEv.id));
                setCommittees(storageService.getCommittees(targetEv.id));
              }

              saveSession({
                role: userRole,
                email: teamMember.email,
                name: teamMember.name,
                assigned_event_ids: [teamMember.event_id],
                currentEventId: targetEv?.id || teamMember.event_id,
                activeNavTab: 'overview'
              });
              const eventSlugToUse = targetEv ? getEventSlug(targetEv) : 'jkkncet-tn-assembly-2026';
              navigate(`/events/${eventSlugToUse}/overview`);
              return sess;
            }

            return null;
          }}
          onLoginAccessCode={(code: string): any => {
            const cleanCode = code.trim().toUpperCase();
            const targetEventId = currentEvent?.id;
            const authRes = storageService.authenticateAccessCode(cleanCode, targetEventId);
            if (!authRes) return null;
            return handleAccessCodeLogin(authRes);
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
          eventDays={eventDays}
          dayAttendance={dayAttendance}
          onToggleCheckIn={handleToggleCheckIn}
          onCheckInAll={handleCheckInAll}
          onSetStudentDayAttendance={handleSetStudentDayAttendance}
          onBatchSetDayAttendance={handleBatchSetDayAttendance}
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
  if (eventDays.length > 0) completedTabsSet.add('days_activities');
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
            const slug = currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026';
            navigate(`/events/${slug}/dashboard`);
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
            {isTabRoute && role !== 'student' && (
              <Sidebar
                activeTab={activeNavTab}
                onSelectTab={(tab) => handleSelectTab(tab)}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                completedTabs={completedTabsSet}
                role={role}
                eventSlug={currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026'}
                eventId={currentEvent?.id}
                eventName={currentEvent?.college_name}
                onBackToEvents={() => {
                  navigate('/events');
                }}
              />
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
              
              {/* Mobile Quick-Navigation Pill Bar */}
              {isTabRoute && currentEvent && role !== 'student' && (
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
            {/* Root path -> role-based intelligent redirect */}
            <Route
              path="/"
              element={
                role === 'student' ? (
                  <Navigate to={currentEvent ? `/events/${getEventSlug(currentEvent)}/dashboard` : '/dashboard'} replace />
                ) : (
                  <Navigate to="/events" replace />
                )
              }
            />

            {/* Unified Access Code Login (/join) */}
            <Route
              path="/join"
              element={
                <StudentJoinView
                  onLoginSuccess={(authResult) => {
                    handleAccessCodeLogin(authResult);
                  }}
                  onShowToast={addToast}
                  targetEventId={currentEvent?.id}
                />
              }
            />

            {/* Redirect /me, /student, and /delegate to /dashboard */}
            <Route path="/me" element={<Navigate to="/dashboard" replace />} />
            <Route path="/student" element={<Navigate to="/dashboard" replace />} />
            <Route path="/delegate/:delegateId" element={<Navigate to="/dashboard" replace />} />

            {/* Student Dashboard Direct Route (/dashboard) */}
            <Route
              path="/dashboard"
              element={
                currentStudent ? (
                  <StudentDashboard
                    student={currentStudent}
                    event={currentEvent || events[0] || null}
                    agenda={agenda}
                    party={activeParty || null}
                    committee={activeCommittee || null}
                    nominations={storageService.getNominations(currentEvent?.id || events[0]?.id, 'student', currentStudent.id)}
                    openNominationPositions={openNominationPositions}
                    elections={storageService.getElections(currentEvent?.id || events[0]?.id, 'student', currentStudent.id)}
                    flashVotes={storageService.getFlashVotes(currentEvent?.id || events[0]?.id, 'student', currentStudent.id)}
                    onFileNomination={(nom) => {
                      if (currentStudent.role?.toLowerCase().includes('speaker')) {
                        addToast('Nomination Ineligible', 'Assigned Speaker / Deputy Speaker delegates cannot file nominations.', 'error');
                        return;
                      }
                      const targetId = currentEvent?.id || events[0]?.id;
                      const existingNoms = storageService.getNominations(targetId, 'student', currentStudent.id);
                      if (existingNoms.some(n => n.position === nom.position && n.status !== 'Rejected')) {
                        addToast('Already Nominated', `You have already filed a nomination for ${nom.position}. Each member is eligible only once per post.`, 'error');
                        return;
                      }
                      try {
                        storageService.addNomination(nom);
                        if (targetId) {
                          setNominations(storageService.getNominations(targetId, 'student', currentStudent.id));
                        }
                      } catch (err: any) {
                        addToast('Nomination Error', err?.message || 'Failed to file nomination', 'error');
                      }
                    }}
                    onCastVote={(elecId, candId, delId) => {
                      storageService.castVoteInElection(elecId, candId, delId || currentStudent.id);
                      const targetId = currentEvent?.id || events[0]?.id;
                      if (targetId) {
                        setElections(storageService.getElections(targetId, 'student', currentStudent.id));
                      }
                    }}
                    onCastFlashVote={(vId, l, dec) => {
                      storageService.castFlashVote(vId, l, dec);
                      const targetId = currentEvent?.id || events[0]?.id;
                      if (targetId) {
                        setFlashVotes(storageService.getFlashVotes(targetId, 'student', currentStudent.id));
                      }
                    }}
                    onShowToast={addToast}
                  />
                ) : (
                  <Navigate to="/join" replace />
                )
              }
            />

            {/* Event Hub / Selector */}
            <Route
              path="/events"
              element={
                role === 'student' ? (
                  <Navigate to={currentEvent ? `/events/${getEventSlug(currentEvent)}/dashboard` : '/dashboard'} replace />
                ) : (
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
                    learners={learners}
                  />
                )
              }
            />

            {/* Redirect /events/:eventSlug to /events/:eventSlug/overview */}
            <Route
              path="/events/:eventSlug"
              element={
                <EventSlugOnlyRedirector events={events} role={role} />
              }
            />

            {/* Event-specific Student/Delegate Dashboard Route */}
            <Route
              path="/events/:eventSlug/dashboard"
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
                  handleAllocateParties={handleAllocateParties}
                  handleAllocateCommittees={handleAllocateCommittees}
                  handleAllocateConstituencies={handleAllocateConstituencies}
                  handleResetAllocation={handleResetAllocation}
                  setCurrentEvent={setCurrentEvent}
                  setEvents={setEvents}
                  handleAssignCabinetRole={handleAssignCabinetRole}
                  handleAddJury={handleAddJury}
                  handleDeleteJury={handleDeleteJury}
                  handleAddVolunteer={handleAddVolunteer}
                  handleDeleteVolunteer={handleDeleteVolunteer}
                  setVolunteers={setVolunteers}
                  setLearners={setLearners}
                  handleSetCurrentAgendaItem={handleSetCurrentAgendaItem}
                  setElections={setElections}
                  setFlashVotes={setFlashVotes}
                  setNominations={setNominations}
                  setScores={setScores}
                  setIsAddWalkInOpen={setIsAddWalkInOpen}
                  setIsImportCsvOpen={setIsImportCsvOpen}
                  setIsAllocationModalOpen={setIsAllocationModalOpen}
                  handleAddAgendaItem={handleAddAgendaItem}
                  handleUpdateAgendaItem={handleUpdateAgendaItem}
                  handleDeleteAgendaItem={handleDeleteAgendaItem}
                  handleDuplicateAgendaItem={handleDuplicateAgendaItem}
                  handleReorderAgendaItems={handleReorderAgendaItems}
                  handleToggleEnableAgendaItem={handleToggleEnableAgendaItem}
                  handleSetAgendaStatus={handleSetAgendaStatus}
                  activeParty={activeParty}
                  activeCommittee={activeCommittee}
                  currentStudent={currentStudent}
                  navigate={navigate}
                  eventDays={eventDays}
                  dayAttendance={dayAttendance}
                  handleAddEventDay={handleAddEventDay}
                  handleUpdateEventDay={handleUpdateEventDay}
                  handleDeleteEventDay={handleDeleteEventDay}
                  handleSetActiveEventDay={handleSetActiveEventDay}
                  handleSetStudentDayAttendance={handleSetStudentDayAttendance}
                  handleBatchSetDayAttendance={handleBatchSetDayAttendance}
                />
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
                  handleAllocateParties={handleAllocateParties}
                  handleAllocateCommittees={handleAllocateCommittees}
                  handleAllocateConstituencies={handleAllocateConstituencies}
                  handleResetAllocation={handleResetAllocation}
                  setCurrentEvent={setCurrentEvent}
                  setEvents={setEvents}
                  handleAssignCabinetRole={handleAssignCabinetRole}
                  handleAddJury={handleAddJury}
                  handleDeleteJury={handleDeleteJury}
                  handleAddVolunteer={handleAddVolunteer}
                  handleDeleteVolunteer={handleDeleteVolunteer}
                  setVolunteers={setVolunteers}
                  setLearners={setLearners}
                  handleSetCurrentAgendaItem={handleSetCurrentAgendaItem}
                  setElections={setElections}
                  setFlashVotes={setFlashVotes}
                  setNominations={setNominations}
                  setScores={setScores}
                  setIsAddWalkInOpen={setIsAddWalkInOpen}
                  setIsImportCsvOpen={setIsImportCsvOpen}
                  setIsAllocationModalOpen={setIsAllocationModalOpen}
                  handleAddAgendaItem={handleAddAgendaItem}
                  handleUpdateAgendaItem={handleUpdateAgendaItem}
                  handleDeleteAgendaItem={handleDeleteAgendaItem}
                  handleDuplicateAgendaItem={handleDuplicateAgendaItem}
                  handleReorderAgendaItems={handleReorderAgendaItems}
                  handleToggleEnableAgendaItem={handleToggleEnableAgendaItem}
                  handleSetAgendaStatus={handleSetAgendaStatus}
                  activeParty={activeParty}
                  activeCommittee={activeCommittee}
                  currentStudent={currentStudent}
                  navigate={navigate}
                  eventDays={eventDays}
                  dayAttendance={dayAttendance}
                  handleAddEventDay={handleAddEventDay}
                  handleUpdateEventDay={handleUpdateEventDay}
                  handleDeleteEventDay={handleDeleteEventDay}
                  handleSetActiveEventDay={handleSetActiveEventDay}
                  handleSetStudentDayAttendance={handleSetStudentDayAttendance}
                  handleBatchSetDayAttendance={handleBatchSetDayAttendance}
                />
              }
            />

            {/* Fallback wildcard */}
            <Route
              path="*"
              element={
                role === 'student' ? (
                  <Navigate to={currentEvent ? `/events/${getEventSlug(currentEvent)}/dashboard` : '/dashboard'} replace />
                ) : (
                  <Navigate to="/events" replace />
                )
              }
            />
          </Routes>

        </main>
      </div>

      {/* Shared Modals */}
      {(() => {
        const activeEvModal = extractEventFromUrl(events) || currentEvent;
        if (!activeEvModal) return null;
        return (
          <>
            <AddLearnerModal
              isOpen={isAddWalkInOpen}
              onClose={() => setIsAddWalkInOpen(false)}
              eventId={activeEvModal.id}
              existingCodes={existingCodesSet}
              parties={parties}
              committees={committees}
              existingLearners={learners}
              onAddLearner={async (l) => {
                await handleAddLearner({ ...l, event_id: activeEvModal.id });
                addToast('Walk-in Added', `Registered ${l.full_name} with access code ${l.access_code}`, 'success');
              }}
            />

            <CsvImportModal
              isOpen={isImportCsvOpen}
              onClose={() => setIsImportCsvOpen(false)}
              eventId={activeEvModal.id}
              existingCodes={existingCodesSet}
              onImportSuccess={async (imported: Partial<Learner>[]) => {
                const res = await storageService.importLearners(imported, activeEvModal.id);
                if (!res.success) {
                  throw new Error(res.error?.message || 'Failed to save imported participants to database.');
                }
                setLearners(storageService.getLearners(activeEvModal.id));
                setParties(storageService.getParties(activeEvModal.id));
                setCommittees(storageService.getCommittees(activeEvModal.id));
                addToast('Import Successful', `Processed ${imported.length} delegate participants (saved to Supabase)`, 'success');
              }}
              onShowToast={addToast}
            />

            <AllocationModal
              isOpen={isAllocationModalOpen}
              onClose={() => setIsAllocationModalOpen(false)}
              learners={learners}
              parties={parties}
              committees={committees}
              eventId={activeEvModal.id}
              onExecuteAllocation={(ratio) => {
                return handleExecuteAllocation(ratio, activeEvModal.id);
              }}
              onAllocateParties={(options) => {
                return handleAllocateParties(options, activeEvModal.id);
              }}
              onAllocateCommittees={(options) => {
                return handleAllocateCommittees(options, activeEvModal.id);
              }}
              onAllocateConstituencies={(options) => {
                return handleAllocateConstituencies(options, activeEvModal.id);
              }}
            />
          </>
        );
      })()}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}

export default App;
