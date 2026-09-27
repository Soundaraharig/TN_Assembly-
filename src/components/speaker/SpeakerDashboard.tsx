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
  LogOut,
  Landmark,
  Radio,
  Lock,
  Eye,
  Check,
  Award,
  Layers
} from 'lucide-react';

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
  onLogout
}) => {
  const eventId = event?.id || speaker.event_id || '';

  // Determine presiding authority
  const isSpeaker = isSpeakerRole(speaker.role);
  const isDeputy = isDeputySpeakerRole(speaker.role);
  const presidingTitle = isSpeaker ? 'Speaker' : isDeputy ? 'Deputy Speaker' : 'Presiding Officer';
  const roleBadgeText = isSpeaker ? 'SPEAKER' : isDeputy ? 'DEPUTY SPEAKER' : 'PRESIDING OFFICER';

  // Responsive active view tab for mobile / tablet
  const [activeTab, setActiveTab] = useState<'floor' | 'voting' | 'agenda'>('floor');

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
  const waitingRequests = useMemo(() => {
    return speakingRequests
      .filter(r => r.event_id === eventId && r.session_id === activeSession.id && r.status === 'WAITING')
      .sort((a, b) => {
        // Priority: Lowest Total Turns -> Lowest Session Turns -> Earliest Hand Raise
        const totalA = turnCounts.totalCounts[a.learner_id] || 0;
        const totalB = turnCounts.totalCounts[b.learner_id] || 0;
        if (totalA !== totalB) return totalA - totalB;

        const sessA = turnCounts.sessionCounts[a.learner_id] || 0;
        const sessB = turnCounts.sessionCounts[b.learner_id] || 0;
        if (sessA !== sessB) return sessA - sessB;

        const timeA = new Date(a.created_at || a.requested_at || 0).getTime();
        const timeB = new Date(b.created_at || b.requested_at || 0).getTime();
        return timeA - timeB;
      });
  }, [speakingRequests, eventId, activeSession.id, turnCounts]);

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

  // Total Eligible Delegates in Event (dynamic denominator, NEVER hardcoded)
  const totalEligibleDelegates = useMemo(() => {
    const active = learners.filter(l => l.is_active !== false && l.status !== 'Inactive');
    return active.length > 0 ? active.length : (learners.length > 0 ? learners.length : 85);
  }, [learners]);

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

  const previousAgendaItem = useMemo(() => {
    if (currentIndex > 0) {
      return agenda[currentIndex - 1];
    }
    return null;
  }, [agenda, currentIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Presiding Officer Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Branding & Role Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              {isSpeaker ? <Crown className="w-5 h-5 text-amber-400" /> : <Gavel className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">
                  PRESIDING OFFICER DESK
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 font-mono shadow-sm">
                  {roleBadgeText}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Floor Active
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>TN ASSEMBLY</span>
                <span className="text-slate-500 font-normal text-sm">·</span>
                <span className="text-slate-300 text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  {event?.college_name || 'JKKN ARTS'} {event?.chapter || 'TN ASSEMBLY 2026'}
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Presiding Officer Name, Active Session & Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-slate-200">
                {speaker.full_name}
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium">
                {speaker.constituency_name ? `${speaker.constituency_name} · ` : ''}Neutral / Presiding
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                title="Synchronize floor and queue"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                  title="Sign out of Presiding Desk"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* House Banner: Current Event & Current Session Status */}
      <section className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-medium">Session:</span>
              <span className="font-bold text-white">{activeSession.title}</span>
            </div>

            {currentAgendaItem?.day && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentAgendaItem.day} · {currentAgendaItem.time || '10:00 AM'}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>House Roster: <strong className="text-white">{totalEligibleDelegates}</strong> delegates</span>
            </div>
          </div>

          {/* Floor Awareness Status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Floor State:
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-amber-400" />
              {floorStateText}
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden border-b border-slate-800 bg-slate-900/60 px-4 py-2 flex items-center justify-around gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('floor')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'floor'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Speaking Floor ({waitingRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voting')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'voting'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Votes & Ballots</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'agenda'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>House Agenda</span>
        </button>
      </div>

      {/* Main Presiding Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================
              LEFT COLUMN: SPEAKING FLOOR CONTROLS (7 Columns on Desktop)
              ======================================================== */}
          <div className={`lg:col-span-7 space-y-6 ${activeTab === 'floor' ? 'block' : 'hidden md:block'}`}>
            {/* Active Floor Speaker Card */}
            <div className="rounded-2xl border bg-slate-900/90 shadow-xl overflow-hidden transition-all border-slate-800">
              <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    CURRENT SPEAKER ON FLOOR
                  </h2>
                </div>
                {activeSpeakingTurn && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} elapsed
                  </span>
                )}
              </div>

              <div className="p-5">
                {activeSpeakingTurn ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white">
                          {activeSpeakingTurn.learner_name}
                        </span>
                        {activeSpeakerLearner?.bench && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              activeSpeakerLearner.bench === 'Ruling'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {activeSpeakerLearner.bench} Bench
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {activeSpeakerLearner?.constituency_name ? `Constituency: ${activeSpeakerLearner.constituency_name}` : 'House Delegate'} ·
                        Called by <strong className="text-amber-400">{activeSpeakingTurn.called_by || presidingTitle}</strong> at{' '}
                        {new Date(activeSpeakingTurn.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteTurn(activeSpeakingTurn)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-1.5 transition-all shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete Turn / Yield</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                    <Hand className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-400">The floor is currently open</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Recognize a delegate from the waiting queue below by clicking the <strong>CALL</strong> button.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting to Speak Queue */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden space-y-0">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      WAITING TO SPEAK
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {waitingRequests.length}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Priority: Lowest Total Turns → Lowest Session Turns → Earliest Raised Hand
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHandsDownModal(true)}
                  disabled={waitingRequests.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Hand className="w-3.5 h-3.5 rotate-180" />
                  <span>HANDS DOWN</span>
                </button>
              </div>

              {/* Waiting Delegates List */}
              <div className="p-4 space-y-2.5 max-h-[460px] overflow-y-auto">
                {waitingRequests.length === 0 ? (
                  <div className="py-10 text-center space-y-2 text-slate-500">
                    <Users className="w-8 h-8 text-slate-700 mx-auto" />
                    <div className="text-sm font-bold text-slate-400">No delegates currently waiting</div>
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
                    const constituency = reqLearner?.constituency_name || (req.constituency_number ? `Constituency #${req.constituency_number}` : 'MLA');

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white truncate">
                                {req.learner_name}
                              </span>
                              {bench && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    bench === 'Ruling'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {bench}
                                </span>
                              )}
                              <span className="text-slate-400 text-xs">
                                · {constituency}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span>Speaking turns: <strong className="text-slate-200">{totalTurns}</strong> (Session: {sessionTurns})</span>
                              <span className="text-slate-600">·</span>
                              <span>Raised: <strong className="text-slate-300">{raisedTimeStr}</strong></span>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  RECENT SPEAKERS ({recentSpeakers.length})
                </h3>
                <span className="text-[11px] text-slate-500">Floor Audit Record</span>
              </div>

              {recentSpeakers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
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
                    const constituency = spkLearner?.constituency_name || (spkLearner?.constituency_number ? `Constituency #${spkLearner.constituency_number}` : '');

                    return (
                      <div
                        key={spk.id}
                        className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-200">{spk.learner_name}</span>
                            {constituency && (
                              <span className="text-slate-400 ml-1.5 text-[11px]">
                                ({constituency})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                          <span>Turns: <strong className="text-amber-400">{totalTurns}</strong></span>
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
              RIGHT COLUMN: LIVE VOTING & AGENDA (5 Columns on Desktop)
              ======================================================== */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab === 'floor' ? 'hidden md:block' : 'block'}`}>
            {/* Live Voting & Participation Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden space-y-0">
              <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    CURRENT VOTE & PARTICIPATION
                  </h2>
                </div>
                {liveBill ? (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      liveBill.status === 'Vote Open' || liveBill.status === 'Voting'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : liveBill.is_result_revealed
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : liveFlashVote.is_result_revealed
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {liveFlashVote.status === 'ACTIVE' ? 'OPEN' : liveFlashVote.is_result_revealed ? 'REVEALED' : 'CLOSED'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400">
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
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                            BILL PROCEEDING · {liveBill.bill_number}
                          </div>
                          <h3 className="text-sm font-bold text-white leading-snug mt-0.5">
                            {liveBill.title}
                          </h3>
                        </div>

                        {/* Participation Counter */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              VOTES CAST
                            </span>
                            <div className="text-xl font-black font-mono text-white">
                              {votesCast} <span className="text-sm font-normal text-slate-500">/ {eligible}</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-semibold">
                              {turnoutPct}% turnout
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              NOT YET VOTED
                            </span>
                            <div className="text-xl font-black font-mono text-amber-400">
                              {notVoted}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              members pending
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, turnoutPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{votesCast} members voted</span>
                            <span>{notVoted} members have not voted</span>
                          </div>
                        </div>

                        {/* Result Breakdown: Sealed vs Revealed */}
                        {isRevealed ? (
                          <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                HOUSE RESULT REVEALED
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  (liveBill.ayes || 0) >= (liveBill.noes || 0)
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {liveBill.result || ((liveBill.ayes || 0) >= (liveBill.noes || 0) ? 'PASSED' : 'REJECTED')}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[10px] font-bold text-emerald-400 uppercase">YES (AYES)</div>
                                <div className="text-lg font-black text-white font-mono mt-0.5">{liveBill.ayes || 0}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <div className="text-[10px] font-bold text-rose-400 uppercase">NO (NOES)</div>
                                <div className="text-lg font-black text-white font-mono mt-0.5">{liveBill.noes || 0}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">ABSTAIN</div>
                                <div className="text-lg font-black text-slate-300 font-mono mt-0.5">{liveBill.abstain || 0}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
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
                          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                            FLASH DIVISION · {liveFlashVote.motion_type}
                          </div>
                          <h3 className="text-sm font-bold text-white leading-snug mt-0.5">
                            {liveFlashVote.question}
                          </h3>
                        </div>

                        {/* Participation Counter */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              VOTES CAST
                            </span>
                            <div className="text-xl font-black font-mono text-white">
                              {votesCast} <span className="text-sm font-normal text-slate-500">/ {eligible}</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-semibold">
                              {turnoutPct}% turnout
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              NOT YET VOTED
                            </span>
                            <div className="text-xl font-black font-mono text-amber-400">
                              {notVoted}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              members pending
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, turnoutPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{votesCast} members voted</span>
                            <span>{notVoted} members have not voted</span>
                          </div>
                        </div>

                        {/* Result: Sealed vs Revealed */}
                        {isRevealed ? (
                          <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                DIVISION RESULT REVEALED
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  liveFlashVote.ayes_count >= liveFlashVote.noes_count
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {liveFlashVote.ayes_count >= liveFlashVote.noes_count ? 'ADOPTED' : 'NEGATIVED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[10px] font-bold text-emerald-400 uppercase">YES: {liveFlashVote.ayes_count}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <div className="text-[10px] font-bold text-rose-400 uppercase">NO: {liveFlashVote.noes_count}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">ABSTAIN: {liveFlashVote.abstain_count}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>RESULT SEALED</strong> · Division in progress. Tallies will be revealed by Main Admin to the House.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-8 text-center space-y-2 text-slate-500">
                    <Vote className="w-8 h-8 text-slate-700 mx-auto" />
                    <div className="text-sm font-bold text-slate-400">No active bill or flash vote</div>
                    <p className="text-xs text-slate-500">
                      When a bill or division is opened for floor voting, live participation counts will display here automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Authoritative Agenda State */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  CURRENT AGENDA
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Order of Business
                </span>
              </div>

              {currentAgendaItem ? (
                <div className="space-y-3">
                  {/* Current Active Item */}
                  <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase">
                      <span>CURRENT AGENDA ITEM</span>
                      {currentAgendaItem.duration_minutes && (
                        <span>{currentAgendaItem.duration_minutes} mins</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {currentAgendaItem.title}
                    </div>
                    {currentAgendaItem.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {currentAgendaItem.description}
                      </p>
                    )}
                  </div>

                  {/* Next Agenda Item */}
                  {nextAgendaItem && (
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>NEXT AGENDA ITEM</span>
                        {nextAgendaItem.time && <span>{nextAgendaItem.time}</span>}
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {nextAgendaItem.title}
                      </div>
                    </div>
                  )}

                  {/* Previous Item */}
                  {previousAgendaItem && (
                    <div className="p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/30 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">Prev: {previousAgendaItem.title}</span>
                      <span className="text-emerald-400 font-bold uppercase text-[9px]">Completed</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  No agenda items scheduled for this event.
                </div>
              )}
            </div>

            {/* Elections & Ballots Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  ELECTIONS & RESULTS
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {elections.length} Ballots
                </span>
              </div>

              {elections.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
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
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white truncate">
                            {elec.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isLive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                                : isRevealed
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isLive ? 'VOTING OPEN' : isRevealed ? 'RESULT REVEALED' : 'CLOSED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Votes Cast: <strong className="text-slate-200">{votedCount}</strong> / {eligible}</span>
                          <span>{eligible > 0 ? Math.round((votedCount / eligible) * 100) : 0}% Turnout</span>
                        </div>

                        {/* Revealed Winner */}
                        {isRevealed && elec.winner ? (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              Winner: {elec.winner}
                            </span>
                            <span className="text-[10px] font-black uppercase text-amber-400 font-mono">
                              Elected
                            </span>
                          </div>
                        ) : !isRevealed && isLive ? (
                          <div className="text-[10px] text-amber-400/90 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Lower All Waiting Hands?
                </h3>
                <p className="text-xs text-slate-400">
                  Assembly Speaking Floor Control
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will clear all <strong>{waitingRequests.length}</strong> currently waiting delegates from the floor queue for session <em>"{activeSession.title}"</em>.
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Speaking turn history & counts are 100% preserved</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>No question submissions or voting data are affected</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHandsDownModal(false)}
                disabled={isLoweringHands}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
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
    </div>
  );
};
