import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  Learner,
  CollegeEvent,
  AgendaItem,
  Election,
  LiveFlashVote,
  BillProceeding,
  SpeakingRequest,
  SpeakingTurn,
  ProceedingsQuestion
} from '../../types';
import {
  storageService,
  isSpeakerRole,
  isDeputySpeakerRole
} from '../../services/storageService';
import {
  Crown,
  Gavel,
  Hand,
  Users,
  Vote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Landmark,
  Radio,
  Lock,
  Eye,
  Check,
  Award,
  Layers,
  HelpCircle,
  Star,
  X,
  MessageSquare,
  Play
} from 'lucide-react';
import {
  formatMemberConstituency,
  isPresidingOfficer
} from '../../utils/memberIdentity';

export interface SpeakerDashboardProps {
  speaker: Learner;
  event: CollegeEvent | null;
  agenda?: AgendaItem[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onLogout?: () => void;
}

export const SpeakerDashboard: React.FC<SpeakerDashboardProps> = ({
  speaker,
  event,
  agenda: initialAgenda = [],
  elections: initialElections = [],
  flashVotes: initialFlashVotes = [],
  onShowToast,
  onLogout: _onLogout
}) => {
  const eventId = event?.id || speaker.event_id || '';

  // Determine presiding authority
  const isSpeaker = isSpeakerRole(speaker.role);
  const isDeputy = isDeputySpeakerRole(speaker.role);
  const presidingTitle = isSpeaker ? 'Speaker' : isDeputy ? 'Deputy Speaker' : 'Presiding Officer';
  const roleBadgeText = isSpeaker ? 'SPEAKER' : isDeputy ? 'DEPUTY SPEAKER' : 'PRESIDING OFFICER';

  // Responsive active view tab for mobile / tablet
  const [activeTab, setActiveTab] = useState<'floor' | 'voting' | 'agenda' | 'questions'>('floor');

  // Authoritative State Sync
  const [activeSession, setActiveSession] = useState<{ id: string; title: string }>(() =>
    storageService.getActiveSession(eventId)
  );
  const [agenda, setAgenda] = useState<AgendaItem[]>(() =>
    eventId ? storageService.getAgenda(eventId) : initialAgenda
  );
  const [speakingRequests, setSpeakingRequests] = useState<SpeakingRequest[]>(() =>
    eventId ? storageService.getSpeakingRequests(eventId) : []
  );
  const [speakingTurns, setSpeakingTurns] = useState<SpeakingTurn[]>(() =>
    eventId ? storageService.getSpeakingTurns(eventId) : []
  );
  const [bills, setBills] = useState<BillProceeding[]>(() =>
    eventId ? storageService.getBills(eventId) : []
  );
  const [elections, setElections] = useState<Election[]>(() =>
    eventId ? storageService.getElections(eventId) : initialElections
  );
  const [flashVotes, setFlashVotes] = useState<LiveFlashVote[]>(() =>
    eventId ? storageService.getFlashVotes(eventId) : initialFlashVotes
  );
  const [learners, setLearners] = useState<Learner[]>(() =>
    eventId ? storageService.getLearners(eventId) : []
  );

  // Modal & Action states
  const [showHandsDownModal, setShowHandsDownModal] = useState<boolean>(false);
  const [isLoweringHands, setIsLoweringHands] = useState<boolean>(false);
  const [callingRequestId, setCallingRequestId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ── Question Hour State (read-only, same source as Main Admin ControlTab) ──
  const [questionsList, setQuestionsList] = useState<ProceedingsQuestion[]>(() =>
    eventId
      ? storageService.getProceedingsQuestions(eventId).filter(q => q.status === 'Approved' || q.status === 'Starred')
      : []
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(() =>
    eventId ? storageService.getActiveQuestionId(eventId) : null
  );
  const [inspectQuestion, setInspectQuestion] = useState<ProceedingsQuestion | null>(null);
  const [isCallingQuestion, setIsCallingQuestion] = useState<boolean>(false);
  const [isCompletingQuestion, setIsCompletingQuestion] = useState<boolean>(false);

  // Map of learners by id for quick lookup of constituency / bench
  const learnersMap = useMemo(() => {
    return new Map<string, Learner>(learners.map(l => [l.id, l]));
  }, [learners]);

  // Turn counts by learner
  const [turnCounts, setTurnCounts] = useState<{
    sessionCounts: Record<string, number>;
    totalCounts: Record<string, number>;
  }>(() => storageService.getSpeakingTurnCounts(eventId, activeSession.id));

  // Sync all authoritative floor data from storage
  const syncFloorData = useCallback(() => {
    if (!eventId) return;
    const currentSession = storageService.getActiveSession(eventId);
    setActiveSession(currentSession);
    setAgenda(storageService.getAgenda(eventId));
    setSpeakingRequests(storageService.getSpeakingRequests(eventId));
    setSpeakingTurns(storageService.getSpeakingTurns(eventId));
    setBills(storageService.getBills(eventId));
    setElections(storageService.getElections(eventId));
    setFlashVotes(storageService.getFlashVotes(eventId));
    setLearners(storageService.getLearners(eventId));
    setTurnCounts(storageService.getSpeakingTurnCounts(eventId, currentSession.id));
    // Sync Question Hour data (same source as Main Admin ControlTab)
    const qs = storageService.getProceedingsQuestions(eventId).filter(
      q => q.status === 'Approved' || q.status === 'Starred'
    );
    setQuestionsList(qs);
    setActiveQuestionId(storageService.getActiveQuestionId(eventId));
  }, [eventId]);

  // Initial load & listeners (compact realtime event bindings, zero aggressive polling)
  useEffect(() => {
    syncFloorData();

    // Fetch cloud speaking requests on mount without blocking
    if (eventId) {
      storageService.fetchActiveSpeakingRequests(eventId).then(() => {
        syncFloorData();
      }).catch(() => {});
    }

    const unsub = storageService.subscribe(syncFloorData);
    const handleSpeakingUpdate = () => syncFloorData();
    const handleTurnUpdate = () => syncFloorData();
    const handleVoteCast = () => syncFloorData();
    const handleBillUpdate = () => syncFloorData();
    const handleElectionUpdate = () => syncFloorData();
    const handleFlashVoteUpdate = () => syncFloorData();
    const handleAgendaUpdate = () => syncFloorData();

    window.addEventListener('tn_assembly_speaking_update', handleSpeakingUpdate);
    window.addEventListener('tn_assembly_speaking_turn_update', handleTurnUpdate);
    window.addEventListener('tn_assembly_vote_cast', handleVoteCast);
    window.addEventListener('tn_assembly_bill_update', handleBillUpdate);
    window.addEventListener('tn_assembly_election_update', handleElectionUpdate);
    window.addEventListener('tn_assembly_flash_vote_update', handleFlashVoteUpdate);
    window.addEventListener('tn_assembly_agenda_update', handleAgendaUpdate);
    window.addEventListener('tn_assembly_proceedings_question_update', handleSpeakingUpdate);
    window.addEventListener('storage', handleSpeakingUpdate);

    return () => {
      unsub();
      window.removeEventListener('tn_assembly_speaking_update', handleSpeakingUpdate);
      window.removeEventListener('tn_assembly_speaking_turn_update', handleTurnUpdate);
      window.removeEventListener('tn_assembly_vote_cast', handleVoteCast);
      window.removeEventListener('tn_assembly_bill_update', handleBillUpdate);
      window.removeEventListener('tn_assembly_election_update', handleElectionUpdate);
      window.removeEventListener('tn_assembly_flash_vote_update', handleFlashVoteUpdate);
      window.removeEventListener('tn_assembly_agenda_update', handleAgendaUpdate);
      window.removeEventListener('tn_assembly_proceedings_question_update', handleSpeakingUpdate);
      window.removeEventListener('storage', handleSpeakingUpdate);
    };
  }, [eventId, syncFloorData]);

  // Manual fast refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (eventId) {
        await storageService.fetchActiveSpeakingRequests(eventId);
      }
      syncFloorData();
      onShowToast('Floor Refreshed', 'Speaking queue and voting status synchronized.', 'info');
    } catch {
      syncFloorData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Currently waiting requests for current event and active session
  // Presiding officers (Speaker / Deputy Speaker) are strictly excluded
  const waitingRequests = useMemo(() => {
    return speakingRequests
      .filter(r => {
        if (r.event_id !== eventId || r.session_id !== activeSession.id || r.status !== 'WAITING') {
          return false;
        }
        const reqLearner = learnersMap.get(r.learner_id);
        if (isPresidingOfficer(reqLearner) || isPresidingOfficer(r.bench)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Priority: Lowest Total Turns -> Lowest Session Turns -> Earliest Hand Raise -> Stable tie-breaker
        const totalA = turnCounts.totalCounts[a.learner_id] || 0;
        const totalB = turnCounts.totalCounts[b.learner_id] || 0;
        if (totalA !== totalB) return totalA - totalB;

        const sessA = turnCounts.sessionCounts[a.learner_id] || 0;
        const sessB = turnCounts.sessionCounts[b.learner_id] || 0;
        if (sessA !== sessB) return sessA - sessB;

        const timeA = new Date(a.requested_at || a.created_at || 0).getTime();
        const timeB = new Date(b.requested_at || b.created_at || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;

        return (a.learner_name || '').localeCompare(b.learner_name || '');
      });
  }, [speakingRequests, eventId, activeSession.id, turnCounts, learnersMap]);

  // Current active speaker (CALLED or SPEAKING)
  const activeSpeakingTurn = useMemo(() => {
    return speakingTurns.find(
      t => t.event_id === eventId && t.session_id === activeSession.id && t.status === 'SPEAKING'
    );
  }, [speakingTurns, eventId, activeSession.id]);

  // Active speaker learner profile
  const activeSpeakerLearner = useMemo(() => {
    if (!activeSpeakingTurn) return null;
    return learnersMap.get(activeSpeakingTurn.learner_id) || null;
  }, [activeSpeakingTurn, learnersMap]);

  // Recent completed speakers for this session/event
  const recentSpeakers = useMemo(() => {
    return speakingTurns
      .filter(t => t.event_id === eventId && (t.session_id === activeSession.id || !t.session_id) && t.status === 'SPOKEN')
      .sort((a, b) => {
        const timeA = new Date(a.completed_at || a.called_at || 0).getTime();
        const timeB = new Date(b.completed_at || b.called_at || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 10);
  }, [speakingTurns, eventId, activeSession.id]);

  // Elapsed speaking timer for active speaker
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const activeTurnRef = useRef(activeSpeakingTurn);
  activeTurnRef.current = activeSpeakingTurn;

  useEffect(() => {
    if (!activeSpeakingTurn) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () => {
      const turn = activeTurnRef.current;
      if (!turn?.started_at && !turn?.called_at) return;
      const start = new Date(turn.started_at || turn.called_at).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSpeakingTurn?.id]);

  // Call member to speak
  const handleCallMember = async (req: SpeakingRequest) => {
    if (callingRequestId) return;
    setCallingRequestId(req.id);
    const reqLearner = learnersMap.get(req.learner_id);
    const learnerConstituency = reqLearner?.constituency_name || (req.constituency_number ? `Constituency #${req.constituency_number}` : 'MLA');

    try {
      const res = await storageService.callSpeaker({
        requestId: req.id,
        eventId,
        sessionId: activeSession.id,
        sessionName: activeSession.title,
        learnerId: req.learner_id,
        learnerName: req.learner_name,
        calledBy: presidingTitle
      });
      if (res.success) {
        onShowToast(
          'Member Called to Speak',
          `${req.learner_name} (${learnerConstituency}) has been recognized on the floor.`,
          'success'
        );
        syncFloorData();
      } else {
        onShowToast('Call Error', res.error || 'Unable to call member to speak.', 'error');
      }
    } catch (err: any) {
      onShowToast('Call Error', err?.message || 'Failed to call member.', 'error');
    } finally {
      setCallingRequestId(null);
    }
  };

  // Complete speaking turn
  const handleCompleteTurn = async (turn: SpeakingTurn) => {
    try {
      const res = await storageService.completeSpeakingTurn({
        turnId: turn.id,
        requestId: turn.request_id,
        eventId,
        sessionId: activeSession.id
      });
      if (res.success) {
        onShowToast(
          'Turn Completed',
          `Speaking turn concluded for ${turn.learner_name}. Floor is now open.`,
          'info'
        );
        syncFloorData();
      } else {
        onShowToast('Error', res.error || 'Failed to complete speaking turn', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to complete turn', 'error');
    }
  };

  // Parliamentary Question Calling Handlers (Question Hour / Urgent Discussion)
  const handleCallQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId || isCallingQuestion) return;
    setIsCallingQuestion(true);
    try {
      await storageService.setActiveQuestion(eventId, q.id, {
        role: speaker?.role || 'Speaker',
        name: speaker?.full_name || 'Speaker'
      });
      syncFloorData();
      onShowToast(
        'Question Called',
        `Question #${q.calling_order || q.queue_order || 1} by ${q.student_name} called to floor and projected.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to call question.', 'error');
    } finally {
      setIsCallingQuestion(false);
    }
  };

  const handleCompleteQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId || isCompletingQuestion) return;
    setIsCompletingQuestion(true);
    try {
      await storageService.completeActiveQuestion(eventId, q.id, {
        role: speaker?.role || 'Speaker',
        name: speaker?.full_name || 'Speaker'
      });
      syncFloorData();
      onShowToast(
        'Question Answered',
        `Question #${q.calling_order || q.queue_order || 1} answered and completed. Ready for next question.`,
        'info'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to complete question.', 'error');
    } finally {
      setIsCompletingQuestion(false);
    }
  };

  const handleSkipQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId) return;
    try {
      await storageService.skipActiveQuestion(eventId, q.id, {
        role: speaker?.role || 'Speaker',
        name: speaker?.full_name || 'Speaker'
      });
      syncFloorData();
      onShowToast(
        'Question Yielded',
        `Question #${q.calling_order || q.queue_order || 1} yielded.`,
        'info'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to yield question.', 'error');
    }
  };

  // Hands Down action (clear waiting queue with confirmation)
  const handleConfirmHandsDown = async () => {
    setIsLoweringHands(true);
    try {
      const res = await storageService.lowerAllSpeakingRequests(eventId, activeSession.id);
      setShowHandsDownModal(false);
      onShowToast(
        'Hands Down Executed',
        `Cleared ${res.count} waiting requests for ${activeSession.title}. Speaking history preserved.`,
        'info'
      );
      syncFloorData();
    } catch (err: any) {
      onShowToast('Hands Down Failed', err?.message || 'Failed to clear waiting requests', 'error');
    } finally {
      setIsLoweringHands(false);
    }
  };

  // Total Eligible Delegates in Event (dynamic denominator, NEVER hardcoded)
  const totalEligibleDelegates = useMemo(() => {
    const eventLearners = learners.filter(l => !eventId || l.event_id === eventId);
    const active = eventLearners.filter(l => l.is_active !== false && l.status !== 'Inactive');
    return active.length > 0 ? active.length : eventLearners.length;
  }, [learners, eventId]);

  // Projector Settings for Floor Awareness
  const projectorSettings = useMemo(() => {
    return eventId ? storageService.getProjectorSettings(eventId) : null;
  }, [eventId, bills, elections, flashVotes]);

  // Authoritative Current Active Vote (Bill, Election, or Flash Vote)
  const liveBill = useMemo(() => {
    return bills.find(b => b.status === 'Vote Open' || b.status === 'Voting' || b.status === 'Vote Closed' || b.status === 'Result Revealed' || b.status === 'Result Hidden');
  }, [bills]);

  const liveElection = useMemo(() => {
    return elections.find(e => (e.status === 'Live' || e.status === 'live' || (e.status === 'Closed' && e.is_result_revealed)) && !e.is_archived);
  }, [elections]);

  const liveFlashVote = useMemo(() => {
    return flashVotes.find(f => (f.status === 'ACTIVE' || (f.status === 'CLOSED' && f.is_result_revealed)) && !f.is_dismissed);
  }, [flashVotes]);

  // Floor State Description
  const floorStateText = useMemo(() => {
    if (liveBill && (liveBill.status === 'Vote Open' || liveBill.status === 'Voting')) {
      return 'Bill Division in Progress';
    }
    if (liveFlashVote && liveFlashVote.status === 'ACTIVE') {
      return 'Flash Vote in Progress';
    }
    if (liveElection && (liveElection.status === 'Live' || liveElection.status === 'live')) {
      return 'Ballot Election in Progress';
    }
    if (projectorSettings?.displayScene === 'question_hour') {
      return 'Question Hour in Progress';
    }
    if (activeSpeakingTurn) {
      return `Member Speaking (${activeSpeakingTurn.learner_name})`;
    }
    return 'Assembly Debate & Floor Open';
  }, [liveBill, liveFlashVote, liveElection, projectorSettings?.displayScene, activeSpeakingTurn]);

  // Agenda items: Current, Next, Completed
  const currentAgendaItem = useMemo(() => {
    const cur = agenda.find(a => a.is_current);
    if (cur) return cur;
    return agenda.find(a => a.id === activeSession.id) || agenda[0] || null;
  }, [agenda, activeSession.id]);

  const currentIndex = useMemo(() => {
    if (!currentAgendaItem) return -1;
    return agenda.findIndex(a => a.id === currentAgendaItem.id);
  }, [agenda, currentAgendaItem]);

  const nextAgendaItem = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < agenda.length - 1) {
      return agenda[currentIndex + 1];
    }
    return null;
  }, [agenda, currentIndex]);

  const completedAgendaItems = useMemo(() => {
    if (currentIndex > 0) {
      return agenda.slice(0, currentIndex).reverse();
    }
    return agenda.filter(a => a.status === 'Completed');
  }, [agenda, currentIndex]);

  const isUrgentDiscussion = useMemo(() => {
    const t = (activeSession.title || '').toLowerCase();
    return t.includes('urgent') || t.includes('public importance') || t.includes('zero hour');
  }, [activeSession.title]);

  const isQuestionHourSession = useMemo(() => {
    const t = (activeSession.title || '').toLowerCase();
    return t.includes('question hour') || t.includes('question');
  }, [activeSession.title]);

  const relevantQuestions = useMemo(() => {
    if (isUrgentDiscussion) {
      const urgent = questionsList.filter(q => q.question_type === 'Zero Hour' || q.question_type === 'Calling Attention');
      return urgent.length > 0 ? urgent : questionsList;
    }
    return questionsList;
  }, [isUrgentDiscussion, questionsList]);

  // ── Question Hour / Urgent Discussion Computed Values ──
  const qhActiveQuestion = useMemo(() => {
    return relevantQuestions.find(q => q.id === activeQuestionId) || relevantQuestions.find(q => q.called_status === 'calling') || null;
  }, [relevantQuestions, activeQuestionId]);

  const qhCompletedQuestions = useMemo(() => {
    return relevantQuestions.filter(q => q.called_status === 'completed');
  }, [relevantQuestions]);

  const qhUncalledQuestions = useMemo(() => {
    return relevantQuestions.filter(q => q.called_status !== 'completed' && q.id !== qhActiveQuestion?.id);
  }, [relevantQuestions, qhActiveQuestion]);

  const qhNextQuestion = useMemo(() => {
    return qhUncalledQuestions[0] || null;
  }, [qhUncalledQuestions]);

  const qhUpcomingQuestions = useMemo(() => {
    return qhActiveQuestion ? qhUncalledQuestions : qhUncalledQuestions.slice(1);
  }, [qhActiveQuestion, qhUncalledQuestions]);

  const qhIsActive = useMemo(() => {
    return Boolean(qhActiveQuestion) || qhCompletedQuestions.length > 0 || isQuestionHourSession || isUrgentDiscussion;
  }, [qhActiveQuestion, qhCompletedQuestions, isQuestionHourSession, isUrgentDiscussion]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors">
      {/* Presiding Officer Desk Status Banner (Compact sub-header, non-duplicate) */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Role Identity & Floor Live State */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              {isSpeaker ? <Crown className="w-5 h-5 text-amber-500" /> : <Gavel className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 font-mono">
                  PRESIDING OFFICER DESK
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 font-mono shadow-sm">
                  {roleBadgeText}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Floor Active
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <strong className="text-slate-900 dark:text-slate-200">{speaker.full_name}</strong>
                {formatMemberConstituency(speaker) && (
                  <>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {formatMemberConstituency(speaker)}
                    </span>
                  </>
                )}
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Neutral / Presiding</span>
              </div>
            </div>
          </div>

          {/* Right: Session Info, House Roster & Floor State */}
          <div className="flex items-center flex-wrap gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <Landmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Session:</span>
              <span className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{activeSession.title}</span>
            </div>

            {currentAgendaItem?.day && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{currentAgendaItem.day} · {currentAgendaItem.time || '10:00 AM'}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>House Roster: <strong className="text-indigo-950 dark:text-white">{totalEligibleDelegates}</strong> delegates</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold">
              <Radio className="w-3 h-3 animate-pulse text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{floorStateText}</span>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Synchronize floor and queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Mobile / Tablet Tab Navigation */}
      <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-3 py-2 flex items-center justify-around gap-1 sticky top-0 z-20 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveTab('floor')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'floor'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Floor ({waitingRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Questions{relevantQuestions.length > 0 ? ` (${relevantQuestions.length})` : ''}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'agenda'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Agenda</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voting')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'voting'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40'
          }`}
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Votes</span>
        </button>
      </div>

      {/* Main Presiding Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================
              LEFT COLUMN: SPEAKING FLOOR CONTROLS (7 Columns on Desktop)
              ======================================================== */}
          <div className={`lg:col-span-7 space-y-6 ${activeTab === 'floor' ? 'block' : 'hidden lg:block'}`}>
            {/* Active Floor Speaker Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden transition-all">
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    CURRENT SPEAKER ON FLOOR
                  </h2>
                </div>
                {activeSpeakingTurn && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} elapsed
                  </span>
                )}
              </div>

              <div className="p-5">
                {activeSpeakingTurn ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20">
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {activeSpeakingTurn.learner_name}
                        </span>
                        {formatMemberConstituency(activeSpeakerLearner || activeSpeakingTurn, learnersMap) && (
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatMemberConstituency(activeSpeakerLearner || activeSpeakingTurn, learnersMap)}
                          </span>
                        )}
                        {activeSpeakerLearner?.bench && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              activeSpeakerLearner.bench === 'Ruling'
                                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40'
                                : 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/40'
                            }`}
                          >
                            {activeSpeakerLearner.bench} Bench
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Called by <strong className="text-amber-700 dark:text-amber-400">{activeSpeakingTurn.called_by || presidingTitle}</strong> at{' '}
                        {new Date(activeSpeakingTurn.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteTurn(activeSpeakingTurn)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-1.5 transition-all shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete Turn / Yield</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <Hand className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-400">The floor is currently open</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Recognize a delegate from the waiting queue below by clicking the <strong>CALL</strong> button.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting to Speak Queue */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden space-y-0">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      WAITING TO SPEAK
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {waitingRequests.length}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Priority: Lowest Total Turns → Lowest Session Turns → Earliest Raised Hand
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHandsDownModal(true)}
                  disabled={waitingRequests.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Hand className="w-3.5 h-3.5 rotate-180" />
                  <span>HANDS DOWN</span>
                </button>
              </div>

              {/* Waiting Delegates List */}
              <div className="p-4 space-y-2.5 max-h-[460px] overflow-y-auto">
                {waitingRequests.length === 0 ? (
                  <div className="py-10 text-center space-y-2 text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-400">No delegates currently waiting</div>
                    <p className="text-xs text-slate-500">
                      When delegates raise their hands in the House, their requests will appear here in priority order.
                    </p>
                  </div>
                ) : (
                  waitingRequests.map((req, idx) => {
                    const reqLearner = learnersMap.get(req.learner_id);
                    const totalTurns = turnCounts.totalCounts[req.learner_id] || 0;
                    const sessionTurns = turnCounts.sessionCounts[req.learner_id] || 0;
                    const isCalling = callingRequestId === req.id;
                    const rawTime = req.requested_at || req.created_at;
                    const raisedTimeStr = rawTime
                      ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now';
                    const bench = req.bench || reqLearner?.bench;
                    const constituencyDisplay = formatMemberConstituency(reqLearner || req, learnersMap);

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {req.learner_name}
                              </span>
                              {constituencyDisplay && (
                                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {constituencyDisplay}
                                </span>
                              )}
                              {bench && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    bench === 'Ruling'
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {bench}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>Speaking turns: <strong className="text-slate-800 dark:text-slate-200">{totalTurns}</strong> (Session: {sessionTurns})</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span>Raised: <strong className="text-slate-700 dark:text-slate-300">{raisedTimeStr}</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCallMember(req)}
                          disabled={isCalling}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>{isCalling ? 'CALLING...' : 'CALL'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Speakers History */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  RECENT SPEAKERS ({recentSpeakers.length})
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Floor Audit Record</span>
              </div>

              {recentSpeakers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No previous speaking turns completed in this session yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSpeakers.map((spk) => {
                    const spkLearner = learnersMap.get(spk.learner_id);
                    const totalTurns = turnCounts.totalCounts[spk.learner_id] || 1;
                    const timeStr = spk.completed_at || spk.called_at
                      ? new Date(spk.completed_at || spk.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const constituencyDisplay = formatMemberConstituency(spkLearner || spk, learnersMap);

                    return (
                      <div
                        key={spk.id}
                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{spk.learner_name}</span>
                            {constituencyDisplay && (
                              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold ml-1.5 text-[11px]">
                                ({constituencyDisplay})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                          <span>Turns: <strong className="text-amber-600 dark:text-amber-400">{totalTurns}</strong></span>
                          <span>Spoke at: {timeStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: LIVE VOTING & AGENDA & QUESTIONS (5 Columns on Desktop)
              ======================================================== */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab !== 'floor' ? 'block' : 'hidden lg:block'}`}>
            {/* ════════════════════════════════════════════════════════════════
                QUESTION HOUR / URGENT DISCUSSION — Presiding Floor Control
                Uses exact same data source as Main Admin ControlTab.
                ════════════════════════════════════════════════════════════════ */}
            <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden ${activeTab === 'questions' ? 'block' : 'hidden lg:block'}`}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      {isUrgentDiscussion ? 'URGENT PUBLIC IMPORTANCE DISCUSSION' : 'QUESTION HOUR'}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {relevantQuestions.length} tabled
                      </span>
                      {qhCompletedQuestions.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {qhCompletedQuestions.length} answered
                        </span>
                      )}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isUrgentDiscussion
                        ? 'Urgent public interest motions & queries · Presiding Floor Control'
                        : 'Official calling order set by Main Admin · Presiding Floor Control'}
                    </p>
                  </div>
                </div>
                {qhIsActive && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 animate-pulse flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    IN SESSION
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Current Active Question */}
                {qhActiveQuestion ? (
                  <div className="p-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/50 dark:via-amber-950/20 space-y-3 shadow-md shadow-amber-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                          {isUrgentDiscussion ? 'CURRENT ITEM' : 'CURRENT QUESTION'}
                        </span>
                        <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                          #{qhActiveQuestion.calling_order || qhActiveQuestion.queue_order || 1}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        CALLED / CURRENT
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {qhActiveQuestion.student_name}
                        </span>
                        {formatMemberConstituency(qhActiveQuestion, learnersMap) && (
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatMemberConstituency(qhActiveQuestion, learnersMap)}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            qhActiveQuestion.bench === 'Ruling'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {qhActiveQuestion.bench}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            {qhActiveQuestion.ministry}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-serif italic line-clamp-2">
                        "{qhActiveQuestion.question_text}"
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setInspectQuestion(qhActiveQuestion)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>VIEW FULL QUESTION</span>
                      </button>
                      <button
                        type="button"
                        disabled={isCompletingQuestion}
                        onClick={() => handleCompleteQuestion(qhActiveQuestion)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCompletingQuestion ? 'Completing...' : 'MARK ANSWERED & NEXT'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkipQuestion(qhActiveQuestion)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        Yield
                      </button>
                    </div>
                  </div>
                ) : relevantQuestions.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-400">No questions tabled</div>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      When questions are tabled, the official calling queue will appear here.
                    </p>
                  </div>
                ) : qhCompletedQuestions.length === relevantQuestions.length ? (
                  <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
                    All tabled questions have been called and answered!
                  </div>
                ) : null}

                {/* Next Question to Call (When no question is actively on floor) */}
                {qhNextQuestion && !qhActiveQuestion && relevantQuestions.length > 0 && qhCompletedQuestions.length < relevantQuestions.length && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {isUrgentDiscussion ? 'NEXT ITEM' : 'NEXT QUESTION'}
                        </span>
                        <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                          #{qhNextQuestion.calling_order || qhNextQuestion.queue_order || 1}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        QUEUED
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{qhNextQuestion.student_name}</span>
                        {formatMemberConstituency(qhNextQuestion, learnersMap) && (
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatMemberConstituency(qhNextQuestion, learnersMap)}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${qhNextQuestion.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>{qhNextQuestion.bench}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">{qhNextQuestion.ministry}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1">
                        "{qhNextQuestion.question_text}"
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isCallingQuestion}
                        onClick={() => handleCallQuestion(qhNextQuestion)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all shrink-0 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{isCallingQuestion ? 'CALLING...' : 'CALL'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectQuestion(qhNextQuestion)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>VIEW FULL QUESTION</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Up Next Preview (When a question is ALREADY active on floor) */}
                {qhNextQuestion && qhActiveQuestion && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                          UP NEXT
                        </span>
                        <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                          #{qhNextQuestion.calling_order || qhNextQuestion.queue_order || 1}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        QUEUED
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{qhNextQuestion.student_name}</span>
                      {formatMemberConstituency(qhNextQuestion, learnersMap) && (
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatMemberConstituency(qhNextQuestion, learnersMap)}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${qhNextQuestion.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>{qhNextQuestion.bench}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">{qhNextQuestion.ministry}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isCallingQuestion}
                        onClick={() => handleCallQuestion(qhNextQuestion)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>CALL NEXT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectQuestion(qhNextQuestion)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3 h-3 text-amber-500" />
                        <span>VIEW FULL</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Questions Summary */}
                {qhCompletedQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <span>COMPLETED ({qhCompletedQuestions.length})</span>
                      <span className="text-emerald-500 font-bold">Answered</span>
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {qhCompletedQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/30 flex items-center justify-between gap-2 text-xs opacity-70"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="w-5 h-5 rounded-md bg-emerald-950/80 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">#{q.calling_order || q.queue_order || '?'}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{q.student_name}</span>
                            {formatMemberConstituency(q, learnersMap) && (
                              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] truncate hidden sm:inline">
                                ({formatMemberConstituency(q, learnersMap)})
                              </span>
                            )}
                            <span className="text-slate-400 text-[11px] truncate hidden sm:inline">{q.ministry}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInspectQuestion(q)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Questions Queue */}
                {qhUpcomingQuestions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <span>UPCOMING OFFICIAL ORDER ({qhUpcomingQuestions.length})</span>
                      <span className="text-slate-500 dark:text-slate-600">Deterministic sequence</span>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {qhUpcomingQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-2 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              #{q.calling_order || q.queue_order || '?'}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {q.student_name}
                              </span>
                              {formatMemberConstituency(q, learnersMap) && (
                                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] truncate">
                                  {formatMemberConstituency(q, learnersMap)}
                                </span>
                              )}
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${q.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                              {q.bench}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 hidden sm:inline">
                              {q.ministry}
                            </span>
                            {q.status === 'Starred' && (
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isCallingQuestion}
                              onClick={() => handleCallQuestion(q)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-950 bg-amber-500 hover:bg-amber-400 cursor-pointer flex items-center gap-1 transition-colors shrink-0 disabled:opacity-50"
                            >
                              <Play className="w-2.5 h-2.5 fill-slate-950" />
                              <span>CALL</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectQuestion(q)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-amber-500" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Voting & Participation Card */}
            <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden space-y-0 ${activeTab === 'voting' ? 'block' : 'hidden lg:block'}`}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    CURRENT VOTE & PARTICIPATION
                  </h2>
                </div>
                {liveBill ? (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      liveBill.status === 'Vote Open' || liveBill.status === 'Voting'
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 animate-pulse'
                        : liveBill.is_result_revealed
                        ? 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-500/40'
                        : 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/40'
                    }`}
                  >
                    {liveBill.status === 'Vote Open' || liveBill.status === 'Voting'
                      ? 'OPEN'
                      : liveBill.is_result_revealed
                      ? 'REVEALED'
                      : 'CLOSED'}
                  </span>
                ) : liveFlashVote ? (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      liveFlashVote.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 animate-pulse'
                        : liveFlashVote.is_result_revealed
                        ? 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-500/40'
                        : 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/40'
                    }`}
                  >
                    {liveFlashVote.status === 'ACTIVE' ? 'OPEN' : liveFlashVote.is_result_revealed ? 'REVEALED' : 'CLOSED'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    IDLE
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {liveBill ? (
                  (() => {
                    const votesCast = liveBill.voted_delegate_ids?.length || liveBill.votes?.length || liveBill.total_votes || 0;
                    const eligible = totalEligibleDelegates;
                    const notVoted = Math.max(0, eligible - votesCast);
                    const turnoutPct = eligible > 0 ? Math.round((votesCast / eligible) * 100) : 0;
                    const isRevealed = Boolean(liveBill.is_result_revealed || liveBill.status === 'Result Revealed' || liveBill.status === 'Finalized');

                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                            BILL PROCEEDING · {liveBill.bill_number}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                            {liveBill.title}
                          </h3>
                        </div>

                        {/* Participation Counter */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              VOTES CAST
                            </span>
                            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                              {votesCast} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {eligible}</span>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {turnoutPct}% turnout
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              NOT YET VOTED
                            </span>
                            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                              {notVoted}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              members pending
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, turnoutPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>{votesCast} members voted</span>
                            <span>{notVoted} members have not voted</span>
                          </div>
                        </div>

                        {/* Result Breakdown: Sealed vs Revealed */}
                        {isRevealed ? (
                          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/80 dark:bg-indigo-950/20 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                HOUSE RESULT REVEALED
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  (liveBill.ayes || 0) >= (liveBill.noes || 0)
                                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40'
                                    : 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/40'
                                }`}
                              >
                                {liveBill.result || ((liveBill.ayes || 0) >= (liveBill.noes || 0) ? 'PASSED' : 'REJECTED')}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">YES (AYES)</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{liveBill.ayes || 0}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">NO (NOES)</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{liveBill.noes || 0}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">ABSTAIN</div>
                                <div className="text-lg font-black text-slate-800 dark:text-slate-300 font-mono mt-0.5">{liveBill.abstain || 0}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                              <strong>RESULT SEALED</strong> · Secret ballot in progress. Official tallies will be revealed by Main Admin to the House.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : liveFlashVote ? (
                  (() => {
                    const votesCast = liveFlashVote.voter_ids?.length || liveFlashVote.votes?.length || 0;
                    const eligible = totalEligibleDelegates;
                    const notVoted = Math.max(0, eligible - votesCast);
                    const turnoutPct = eligible > 0 ? Math.round((votesCast / eligible) * 100) : 0;
                    const isRevealed = Boolean(liveFlashVote.is_result_revealed);

                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                            FLASH DIVISION · {liveFlashVote.motion_type}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                            {liveFlashVote.question}
                          </h3>
                        </div>

                        {/* Participation Counter */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              VOTES CAST
                            </span>
                            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                              {votesCast} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {eligible}</span>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {turnoutPct}% turnout
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              NOT YET VOTED
                            </span>
                            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                              {notVoted}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              members pending
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, turnoutPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>{votesCast} members voted</span>
                            <span>{notVoted} members have not voted</span>
                          </div>
                        </div>

                        {/* Result: Sealed vs Revealed */}
                        {isRevealed ? (
                          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/80 dark:bg-indigo-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                DIVISION RESULT REVEALED
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  liveFlashVote.ayes_count >= liveFlashVote.noes_count
                                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40'
                                    : 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/40'
                                }`}
                              >
                                {liveFlashVote.ayes_count >= liveFlashVote.noes_count ? 'ADOPTED' : 'NEGATIVED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">YES: {liveFlashVote.ayes_count}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">NO: {liveFlashVote.noes_count}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">ABSTAIN: {liveFlashVote.abstain_count}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                              <strong>RESULT SEALED</strong> · Division in progress. Tallies will be revealed by Main Admin to the House.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-8 text-center space-y-2 text-slate-400 dark:text-slate-500">
                    <Vote className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-400">No active bill or flash vote</div>
                    <p className="text-xs text-slate-500">
                      When a bill or division is opened for floor voting, live participation counts will display here automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Authoritative Agenda State */}
            <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl p-5 space-y-4 ${activeTab === 'agenda' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  CURRENT AGENDA
                </h3>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  Order of Business
                </span>
              </div>

              {currentAgendaItem ? (
                <div className="space-y-3">
                  {/* Current Active Item */}
                  <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-500/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                      <span>CURRENT AGENDA ITEM</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          {currentAgendaItem.status || 'Active'}
                        </span>
                        {currentAgendaItem.duration_minutes && (
                          <span>{currentAgendaItem.duration_minutes} mins</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentAgendaItem.title}
                    </div>
                    {currentAgendaItem.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {currentAgendaItem.description}
                      </p>
                    )}
                  </div>

                  {/* Next Agenda Item */}
                  {nextAgendaItem && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <span>NEXT AGENDA ITEM</span>
                        {nextAgendaItem.time && <span>{nextAgendaItem.time}</span>}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {nextAgendaItem.title}
                      </div>
                    </div>
                  )}

                  {/* Completed Agenda Items */}
                  {completedAgendaItems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        COMPLETED ITEMS ({completedAgendaItems.length})
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {completedAgendaItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-2 rounded-lg border border-slate-200/80 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/30 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] shrink-0">
                              Completed
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No agenda items scheduled for this event.
                </div>
              )}
            </div>

            {/* Elections & Ballots Section */}
            <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl p-5 space-y-3 ${activeTab === 'voting' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  ELECTIONS & RESULTS
                </h3>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  {elections.length} Ballots
                </span>
              </div>

              {elections.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No elections configured for this event.
                </div>
              ) : (
                <div className="space-y-3">
                  {elections.map((elec) => {
                    const isLive = elec.status === 'Live' || elec.status === 'live';
                    const isRevealed = Boolean(elec.is_result_revealed);
                    const votedCount = elec.voted_delegate_ids?.length || elec.total_votes || 0;
                    const eligible = totalEligibleDelegates;

                    return (
                      <div
                        key={elec.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {elec.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isLive
                                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 animate-pulse'
                                : isRevealed
                                ? 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-500/40'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isLive ? 'VOTING OPEN' : isRevealed ? 'RESULT REVEALED' : 'CLOSED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>Votes Cast: <strong className="text-slate-800 dark:text-slate-200">{votedCount}</strong> / {eligible}</span>
                          <span>{eligible > 0 ? Math.round((votedCount / eligible) * 100) : 0}% Turnout</span>
                        </div>

                        {/* Revealed Winner */}
                        {isRevealed && elec.winner ? (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              Winner: {elec.winner}
                            </span>
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono">
                              Elected
                            </span>
                          </div>
                        ) : !isRevealed && isLive ? (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400/90 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Secret ballot in progress. Outcome sealed.</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Hands Down */}
      {showHandsDownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Lower All Waiting Hands?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assembly Speaking Floor Control
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              This action will clear all <strong>{waitingRequests.length}</strong> currently waiting delegates from the floor queue for session <em>"{activeSession.title}"</em>.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Speaking turn history & counts are 100% preserved</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>No question submissions or voting data are affected</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHandsDownModal(false)}
                disabled={isLoweringHands}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHandsDown}
                disabled={isLoweringHands}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-900/40 cursor-pointer disabled:opacity-50"
              >
                {isLoweringHands ? 'Lowering Hands...' : 'Confirm Hands Down'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FULL QUESTION INSPECTION MODAL
          Same design as ArrangeQuestionOrderModal's inspect view.
          Preserves complete Tamil/English text without truncation.
          ═══════════════════════════════════════════════════════════════════ */}
      {inspectQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setInspectQuestion(null)}>
          <div
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Full Parliamentary Question</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order Position #{questionsList.findIndex(q => q.id === inspectQuestion.id) + 1} of {questionsList.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content — Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Member Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Member Name</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{inspectQuestion.student_name}</div>
                  {formatMemberConstituency(inspectQuestion, learnersMap) && (
                    <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatMemberConstituency(inspectQuestion, learnersMap)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Bench</span>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inspectQuestion.bench === 'Ruling'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {inspectQuestion.bench}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Constituency</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 font-mono">
                    {formatMemberConstituency(inspectQuestion, learnersMap) || 'General Assembly'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Target Ministry</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">{inspectQuestion.ministry}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Question Type</span>
                  <div className="font-bold text-slate-700 dark:text-slate-200 text-sm mt-0.5 flex items-center gap-1.5">
                    {inspectQuestion.question_type || 'Standard'}
                    {inspectQuestion.status === 'Starred' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Calling Status</span>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      inspectQuestion.called_status === 'calling'
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : inspectQuestion.called_status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {inspectQuestion.called_status === 'calling' ? 'CURRENT' : inspectQuestion.called_status === 'completed' ? 'ANSWERED' : 'QUEUED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Question Text — Never Truncated */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Full Question Text</span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-wrap break-words">
                  "{inspectQuestion.question_text}"
                </div>
              </div>

              {/* Administrative Metadata */}
              <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span>Approval Status: <strong className="text-emerald-600 dark:text-emerald-400">{inspectQuestion.status}</strong></span>
                  {inspectQuestion.approved_by && (
                    <span>Approved by: <strong className="text-slate-700 dark:text-white">{inspectQuestion.approved_by}</strong></span>
                  )}
                </div>
                {inspectQuestion.created_at && (
                  <div className="flex items-center justify-between">
                    <span>Submitted: <strong className="text-slate-700 dark:text-slate-300">{new Date(inspectQuestion.created_at).toLocaleString()}</strong></span>
                    {inspectQuestion.approved_at && (
                      <span>Approved: <strong className="text-slate-700 dark:text-slate-300">{new Date(inspectQuestion.approved_at).toLocaleString()}</strong></span>
                    )}
                  </div>
                )}
                {inspectQuestion.reviewed_by && (
                  <div>
                    <span>Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{inspectQuestion.reviewed_by}</strong></span>
                    {inspectQuestion.review_note && (
                      <span className="ml-2 italic text-slate-400">— "{inspectQuestion.review_note}"</span>
                    )}
                  </div>
                )}
                {inspectQuestion.seat_number && (
                  <div>Seat Number: <strong className="text-slate-700 dark:text-slate-300">{inspectQuestion.seat_number}</strong></div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
