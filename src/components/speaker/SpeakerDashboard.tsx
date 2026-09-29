import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  Learner,
  CollegeEvent,
  AgendaItem,
  Election,
  LiveFlashVote,
  BillProceeding,
  SpeakingRequest,
  SpeakingTurn
} from '../../types';
import {
  storageService,
  isSpeakerRole,
  isDeputySpeakerRole,
  areJsonbObjectsEqual
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
  X,
  History,
  Search,
  ChevronDown,
  ChevronUp,
  Volume2,
  WifiOff
} from 'lucide-react';
import {
  formatMemberConstituency,
  isPresidingOfficer
} from '../../utils/memberIdentity';
import { QuestionCallingPanel } from '../common/QuestionCallingPanel';
import { playTimerAlarm, stopAllAlertAudio, unlockAudioContext, playStartChirp } from '../../utils/audioAlert';

export interface SpeakerDashboardProps {
  speaker: Learner;
  event: CollegeEvent | null;
  learners?: Learner[];
  agenda?: AgendaItem[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onLogout?: () => void;
}

export const SpeakerDashboard: React.FC<SpeakerDashboardProps> = ({
  speaker,
  event,
  learners: initialLearners = [],
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
  const [learners, setLearners] = useState<Learner[]>(() => {
    if (initialLearners && initialLearners.length > 0) return initialLearners;
    return eventId ? storageService.getLearners(eventId) : [];
  });

  useEffect(() => {
    if (initialLearners && initialLearners.length > 0) {
      setLearners(initialLearners);
    }
  }, [initialLearners]);

  // Modal & Action states
  const [showHandsDownModal, setShowHandsDownModal] = useState<boolean>(false);
  const [isLoweringHands, setIsLoweringHands] = useState<boolean>(false);
  const [callingRequestId, setCallingRequestId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Hansard Speaking Record Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historySessionFilter, setHistorySessionFilter] = useState<string>('all');
  const [selectedHistoryLearnerId, setSelectedHistoryLearnerId] = useState<string | null>(null);

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
    const freshAgenda = storageService.getAgenda(eventId);
    setAgenda(prev => (areJsonbObjectsEqual(prev, freshAgenda) ? prev : freshAgenda));
    setSpeakingRequests(storageService.getSpeakingRequests(eventId));
    setSpeakingTurns(storageService.getSpeakingTurns(eventId));
    setBills(storageService.getBills(eventId));
    setElections(storageService.getElections(eventId));
    setFlashVotes(storageService.getFlashVotes(eventId));
    const allLearners = storageService.getLearners(eventId);
    if (allLearners.length > 0) {
      setLearners(allLearners);
    }
    setTurnCounts(storageService.getSpeakingTurnCounts(eventId, currentSession.id));
    // Determine approved questions count for quick tab badge
    const currentApprovedQs = storageService.getProceedingsQuestions(eventId).filter(
      q => q.status === 'Approved' || q.status === 'Starred'
    );
    setApprovedQuestionsCount(currentApprovedQs.length);
  }, [eventId]);

  const [approvedQuestionsCount, setApprovedQuestionsCount] = useState<number>(() => {
    return eventId
      ? storageService.getProceedingsQuestions(eventId).filter(
          q => q.status === 'Approved' || q.status === 'Starred'
        ).length
      : 0;
  });

  // Speech timer synchronization & audio alert
  const hasAlarmTriggeredRef = useRef(false);

  // Audio Context Unlock & Network Connection State
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tn_assembly_audio_unlocked') === 'true';
    }
    return false;
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>(() =>
    storageService.getConnectionStatus()
  );

  useEffect(() => {
    const handleConn = (e: any) => {
      if (e?.detail?.status) {
        setConnectionStatus(e.detail.status);
      } else {
        setConnectionStatus(storageService.getConnectionStatus());
      }
    };
    window.addEventListener('tn_assembly_connection_status', handleConn);
    window.addEventListener('online', handleConn);
    window.addEventListener('offline', handleConn);
    return () => {
      window.removeEventListener('tn_assembly_connection_status', handleConn);
      window.removeEventListener('online', handleConn);
      window.removeEventListener('offline', handleConn);
    };
  }, []);

  const handleUnlockAudio = () => {
    unlockAudioContext();
    playStartChirp(0.2);
    setIsAudioUnlocked(true);
    try {
      localStorage.setItem('tn_assembly_audio_unlocked', 'true');
    } catch {}
  };

  const handleTestSound = () => {
    unlockAudioContext();
    if (eventId) {
      const audioCfg = storageService.getTimerAudioConfig(eventId);
      playTimerAlarm(audioCfg);
    }
  };

  const [timerState, setTimerState] = useState(() => storageService.getLiveTimerState(eventId));
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(() => {
    const ts = storageService.getLiveTimerState(eventId);
    return storageService.calculateCurrentRemainingSec(ts);
  });

  useEffect(() => {
    const handleTimerSync = () => {
      const ts = storageService.getLiveTimerState(eventId);
      setTimerState(ts);
      setTimerSecondsLeft(storageService.calculateCurrentRemainingSec(ts));
    };

    const handleAlarmEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.eventId && eventId && detail.eventId !== eventId) return;
      if (detail.action === 'stop') {
        stopAllAlertAudio();
      } else if (detail.action === 'trigger') {
        const audioCfg = storageService.getTimerAudioConfig(eventId);
        if (!audioCfg.is_muted) {
          playTimerAlarm(audioCfg);
        }
      }
    };

    handleTimerSync();
    const unsub = storageService.subscribe(handleTimerSync);
    window.addEventListener('tn_assembly_timer_update', handleTimerSync);
    window.addEventListener('tn_assembly_timer_alarm_event', handleAlarmEvent);
    window.addEventListener('storage', handleTimerSync);
    return () => {
      unsub();
      window.removeEventListener('tn_assembly_timer_update', handleTimerSync);
      window.removeEventListener('tn_assembly_timer_alarm_event', handleAlarmEvent);
      window.removeEventListener('storage', handleTimerSync);
      stopAllAlertAudio();
    };
  }, [eventId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        const live = storageService.getLiveTimerState(eventId);
        const rem = storageService.calculateCurrentRemainingSec(live);
        setTimerSecondsLeft(rem);
        if (live.isRunning && rem === 0 && !hasAlarmTriggeredRef.current) {
          hasAlarmTriggeredRef.current = true;
          const audioCfg = storageService.getTimerAudioConfig(eventId);
          if (!audioCfg.is_muted) {
            playTimerAlarm(audioCfg);
          }
        } else if (rem > 0) {
          hasAlarmTriggeredRef.current = false;
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, eventId]);

  // Initial load & listeners (compact realtime event bindings, zero aggressive polling)
  useEffect(() => {
    syncFloorData();

    // Setup compact realtime WebSocket sync and fetch cloud data
    if (eventId) {
      storageService.setupRealtimeSync(eventId);
      storageService.fetchActiveSpeakingRequests(eventId).then(() => syncFloorData()).catch(() => {});
      storageService.fetchSpeakingTurns(eventId).then(() => syncFloorData()).catch(() => {});
      storageService.fetchProceedingsQuestionsOnDemand(eventId).then(() => syncFloorData()).catch(() => {});
      if (storageService.getLearners(eventId).length === 0 || !storageService.isEventHydrated(eventId)) {
        storageService.hydrateFullEventData(eventId).then(() => syncFloorData()).catch(() => {});
      }
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
        await Promise.allSettled([
          storageService.fetchActiveSpeakingRequests(eventId),
          storageService.fetchSpeakingTurns(eventId),
          storageService.fetchProceedingsQuestionsOnDemand(eventId),
          storageService.hydrateFullEventData(eventId, true)
        ]);
      }
      syncFloorData();
      onShowToast('Floor Refreshed', 'Speaking queue, non-spoken delegates, and question order synchronized.', 'info');
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

  // ── Authoritative Speaking Floor Delegate Counting (Matching ControlTab Exactly) ──
  // Unique learners who have spoken in this session
  const spokenLearnerIds = useMemo(() => {
    const ids = new Set<string>();
    speakingTurns
      .filter(t => t.event_id === eventId && t.session_id === activeSession.id && t.status !== 'CANCELLED')
      .forEach(t => ids.add(t.learner_id));
    return ids;
  }, [speakingTurns, eventId, activeSession.id]);

  const spokenLearnersCount = spokenLearnerIds.size;

  // Presiding officers (Speaker / Deputy Speaker) are strictly excluded from speaking counts
  const totalEligibleDelegatesCount = useMemo(() => {
    return learners.filter(l => !isPresidingOfficer(l)).length;
  }, [learners]);

  const totalEligibleDelegates = totalEligibleDelegatesCount;

  // Actual event participants who have NOT yet spoken in the current session
  // Presiding officers are strictly excluded from ordinary Speaking Floor participation
  const yetToSpeakLearners = useMemo(() => {
    return learners.filter(l => !isPresidingOfficer(l) && !spokenLearnerIds.has(l.id));
  }, [learners, spokenLearnerIds]);

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

  // Agenda items: Current, Next, Upcoming, Completed scoped to the active day
  const currentAgendaItem = useMemo(() => {
    const cur = agenda.find(a => a.is_current);
    if (cur) return cur;
    if (activeSession.id) {
      const match = agenda.find(a => a.id === activeSession.id);
      if (match) return match;
    }
    return agenda.find(a => a.status === 'In Progress') || null;
  }, [agenda, activeSession.id]);

  const currentDayAgenda = useMemo(() => {
    const targetDay = currentAgendaItem?.day || 'Day 1';
    return agenda
      .filter(a => targetDay === 'Pre-Event' ? (a.day === 'Pre-Event' || a.day.includes('Pre')) : a.day === targetDay)
      .sort((a, b) => {
        const orderA = a.order ?? (a as any).order_number;
        const orderB = b.order ?? (b as any).order_number;
        if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
          return orderA - orderB;
        }
        const timeDiff = storageService.parseTimeToMinutes(a.time) - storageService.parseTimeToMinutes(b.time);
        if (timeDiff !== 0) return timeDiff;
        return (a.created_at || '').localeCompare(b.created_at || '');
      });
  }, [agenda, currentAgendaItem?.day]);

  const currentIndex = useMemo(() => {
    if (!currentAgendaItem) return -1;
    return currentDayAgenda.findIndex(a => a.id === currentAgendaItem.id);
  }, [currentDayAgenda, currentAgendaItem]);

  const nextAgendaItem = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < currentDayAgenda.length - 1) {
      return currentDayAgenda[currentIndex + 1];
    }
    return null;
  }, [currentDayAgenda, currentIndex]);

  const upcomingAgendaItems = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < currentDayAgenda.length - 2) {
      return currentDayAgenda.slice(currentIndex + 2);
    }
    return [];
  }, [currentDayAgenda, currentIndex]);

  const completedAgendaItems = useMemo(() => {
    if (currentIndex > 0) {
      return currentDayAgenda.slice(0, currentIndex).reverse();
    }
    return currentDayAgenda.filter(a => a.status === 'Completed');
  }, [currentDayAgenda, currentIndex]);

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

            {/* Live Synchronized Floor Speech Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs transition-all shadow-sm ${
                timerState.isRunning
                  ? timerSecondsLeft <= 15
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse'
                    : timerSecondsLeft <= 60
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
              title="Official Assembly Floor Speech Timer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}</span>
              {timerState.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
            </div>

            {/* Network Offline / Reconnecting Badge */}
            {connectionStatus === 'offline' && (
              <span className="px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 flex items-center gap-1 animate-pulse shadow-sm">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            )}
            {connectionStatus === 'reconnecting' && (
              <span className="px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse shadow-sm">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>Reconnecting...</span>
              </span>
            )}

            {/* Audio Unlock & Test Button */}
            {!isAudioUnlocked ? (
              <button
                type="button"
                onClick={handleUnlockAudio}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20 animate-pulse cursor-pointer"
                title="Click once to unlock browser audio alarms on Speaker screen"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Enable Audio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestSound}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Audio unlocked. Click to test configured chime/tone."
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Test Sound</span>
              </button>
            )}

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
          <span>Questions{approvedQuestionsCount > 0 ? ` (${approvedQuestionsCount})` : ''}</span>
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
                              <span className="text-sm font-bold text-slate-900 dark:text-white break-words">
                                {req.learner_name}
                              </span>
                              {constituencyDisplay && (
                                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 break-words">
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

            {/* Speaking Progress Bar & Yet to Speak (Authoritative Shared State matching Control Panel) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{spokenLearnersCount} of {totalEligibleDelegatesCount || 1} delegates have spoken</span>
                  <span>{Math.round((spokenLearnersCount / Math.max(totalEligibleDelegatesCount, 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((spokenLearnersCount / Math.max(totalEligibleDelegatesCount, 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Yet to speak list */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    YET TO SPEAK — {yetToSpeakLearners.length}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Zero turns in this session
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {yetToSpeakLearners.length > 0 ? (
                    yetToSpeakLearners.map((s, idx) => (
                      <span
                        key={s.id || idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-sm flex items-center gap-1.5"
                      >
                        <span className="font-bold">{s.full_name}</span>
                        {formatMemberConstituency(s, learnersMap) && (
                          <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                            ({formatMemberConstituency(s, learnersMap)})
                          </span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      All delegates in the roster have spoken in this session.
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Turns are counted from the Now Speaking desk — call on someone above when hands go up to keep the floor fair.
              </p>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>See the full speaking record →</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: LIVE VOTING & AGENDA & QUESTIONS (5 Columns on Desktop)
              ======================================================== */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab !== 'floor' ? 'block' : 'hidden lg:block'}`}>
            {/* ════════════════════════════════════════════════════════════════
                QUESTION HOUR / URGENT DISCUSSION — Presiding Floor Control
                Uses exact same shared QuestionCallingPanel as Main Admin ControlTab.
                ════════════════════════════════════════════════════════════════ */}
            <div className={activeTab === 'questions' ? 'block' : 'hidden lg:block'}>
              {eventId && (
                <QuestionCallingPanel
                  eventId={eventId}
                  userRole={speaker.role}
                  userName={speaker.full_name}
                  learners={learners}
                  onShowToast={onShowToast}
                />
              )}
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

                  {/* Upcoming Agenda Items */}
                  {upcomingAgendaItems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        UPCOMING ITEMS ({upcomingAgendaItems.length})
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {upcomingAgendaItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-2 rounded-lg border border-slate-200/80 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/30 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                              {item.time || `${item.duration_minutes || 15}m`}
                            </span>
                          </div>
                        ))}
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
          ASSEMBLY HANSARD — SPEAKING HISTORY MODAL
          Matches ControlTab exact audit record & details
          ═══════════════════════════════════════════════════════════════════ */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Assembly Hansard — Speaking History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official audit log of delegate speaking turns across assembly sessions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by delegate, constituency, party..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={historySessionFilter}
                  onChange={(e) => setHistorySessionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">All Assembly Sessions</option>
                  <option value={activeSession.title}>Current: {activeSession.title}</option>
                  {Array.from(new Set(speakingTurns.map(t => t.session_name || t.session_id)))
                    .filter(s => s && s !== activeSession.title)
                    .map(sess => (
                      <option key={sess} value={sess}>{sess}</option>
                    ))}
                </select>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold whitespace-nowrap">
                  {speakingTurns.length} Total Turns
                </div>
              </div>
            </div>

            {/* Speaking Records List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {(() => {
                // Filter turns by session if selected
                const filteredTurns = speakingTurns.filter(turn => {
                  if (historySessionFilter === 'all') return true;
                  return turn.session_id === historySessionFilter || turn.session_name === historySessionFilter;
                });

                // Group turns by learner
                const turnsByLearner = new Map<string, SpeakingTurn[]>();
                filteredTurns.forEach(turn => {
                  const list = turnsByLearner.get(turn.learner_id) || [];
                  list.push(turn);
                  turnsByLearner.set(turn.learner_id, list);
                });

                // Convert to participant summaries
                const participantSummaries = Array.from(turnsByLearner.entries()).map(([learnerId, turns]) => {
                  const learner = learners.find(l => l.id === learnerId);
                  const sortedTurns = [...turns].sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime());
                  const latestTurn = sortedTurns[0];
                  const currentSessionTurns = turnCounts.sessionCounts[learnerId] ?? 0;
                  const eventTotalTurns = turnCounts.totalCounts[learnerId] ?? turns.filter(t => t.status !== 'CANCELLED').length;

                  return {
                    learnerId,
                    name: learner?.full_name || turns[0]?.learner_name || 'Delegate',
                    constituency: learner?.constituency_name || 'Tamil Nadu',
                    constituencyNo: learner?.constituency_number || '',
                    party: learner?.party_name || 'Independent',
                    bench: learner?.bench || 'Independent',
                    turns: sortedTurns,
                    totalTurns: turns.length,
                    eventTotalTurns,
                    currentSessionTurns,
                    latestTurnAt: latestTurn?.called_at
                  };
                });

                // Search query filter
                const searchedSummaries = participantSummaries.filter(p => {
                  if (!historySearchQuery.trim()) return true;
                  const q = historySearchQuery.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.constituency.toLowerCase().includes(q) ||
                    p.party.toLowerCase().includes(q) ||
                    p.bench.toLowerCase().includes(q)
                  );
                });

                if (searchedSummaries.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <History className="w-6 h-6 opacity-40" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {speakingTurns.length === 0 ? 'No speaking records recorded yet' : 'No delegates match your search'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {speakingTurns.length === 0
                          ? 'When the Speaker calls delegates from the Speaking Floor, every speaking turn is permanently recorded here with timestamps.'
                          : 'Try searching with a different name or clear the filter.'}
                      </p>
                    </div>
                  );
                }

                return searchedSummaries.map(p => {
                  const isExpanded = selectedHistoryLearnerId === p.learnerId;

                  return (
                    <div
                      key={p.learnerId}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden transition-all"
                    >
                      <div
                        onClick={() => setSelectedHistoryLearnerId(isExpanded ? null : p.learnerId)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                            #{p.constituencyNo || p.turns[0]?.sequence_number || '•'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {p.name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.bench === 'Ruling'
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  : p.bench === 'Opposition'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {p.bench}
                              </span>
                              <span className="text-xs text-slate-400">
                                {p.party} · {p.constituency}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Latest speech: {p.latestTurnAt ? new Date(p.latestTurnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                              Event Total: {p.eventTotalTurns} {p.eventTotalTurns === 1 ? 'Turn' : 'Turns'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Session: {p.currentSessionTurns} {p.currentSessionTurns === 1 ? 'turn' : 'turns'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Turns Breakdown */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                            Speaking Turn Timeline ({p.turns.length})
                          </div>
                          <div className="space-y-1.5">
                            {p.turns.map((turn, tIdx) => (
                              <div
                                key={turn.id || tIdx}
                                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {turn.sequence_number || tIdx + 1}
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {turn.session_name || 'Assembly Session'}
                                    </span>
                                    <div className="text-[10px] text-slate-400">
                                      Speaking turn #{turn.sequence_number || tIdx + 1} · Called by {turn.called_by || 'Speaker'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {new Date(turn.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                    turn.status === 'SPEAKING'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  }`}>
                                    {turn.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Data persisted server-side • Hansard records cannot be overwritten
              </span>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
