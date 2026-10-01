import React, { useState, useEffect, useRef } from 'react';
import type { CollegeEvent, AgendaItem, Election, LiveFlashVote, Learner, BillProceeding, LiveTimerState, ProceedingsQuestion } from '../../types';
import { Radio, Maximize2, Minimize2, Clock, Sparkles, Trophy, Crown, Shield, FileText, CheckCircle2, XCircle, Volume2, WifiOff } from 'lucide-react';
import type { ProjectorStudioSettings } from '../../types';
import { storageService, areJsonbObjectsEqual, deriveBillVoteCounts } from '../../services/storageService';
import { extractEventFromUrl, extractEventSlugCandidateFromUrl } from '../../utils/slug';
import { formatMemberConstituency } from '../../utils/memberIdentity';
import { playTimerAlarm, stopAllAlertAudio, unlockAudioContext, playStartChirp } from '../../utils/audioAlert';

interface StandaloneProjectorDisplayProps {
  currentEvent?: CollegeEvent | null;
  agenda?: AgendaItem[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  learners?: Learner[];
}

export const StandaloneProjectorDisplay: React.FC<StandaloneProjectorDisplayProps> = ({
  currentEvent: initialEvent,
  agenda: initialAgenda = [],
  elections: initialElections = [],
  flashVotes: initialFlashVotes = [],
  learners: initialLearners = []
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Authoritative State
  const [currentEvent, setCurrentEvent] = useState<CollegeEvent | null>(initialEvent || null);
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda);
  const [elections, setElections] = useState<Election[]>(initialElections);
  const [flashVotes, setFlashVotes] = useState<LiveFlashVote[]>(initialFlashVotes);
  const [learners, setLearners] = useState<Learner[]>(initialLearners);
  const [bills, setBills] = useState<BillProceeding[]>(() => storageService.getBills(initialEvent?.id));
  const [questions, setQuestions] = useState<ProceedingsQuestion[]>(() => storageService.getProceedingsQuestions(initialEvent?.id));

  // Authoritative studio settings pushed from ControlTab / ElectionsTab
  const [settings, setSettings] = useState<ProjectorStudioSettings>(() =>
    storageService.getProjectorSettings(initialEvent?.id)
  );

  // Authoritative Timer State (Synchronized without aggressive polling)
  const [timerState, setTimerState] = useState<LiveTimerState>(() =>
    storageService.getLiveTimerState(initialEvent?.id)
  );
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => {
    const ts = storageService.getLiveTimerState(initialEvent?.id);
    return storageService.calculateCurrentRemainingSec(ts);
  });

  const hasProjectorAlarmTriggeredRef = useRef(false);

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
    const targetId = currentEvent?.id || initialEvent?.id;
    const audioCfg = storageService.getTimerAudioConfig(targetId);
    playTimerAlarm(audioCfg);
  };

  // Pre-fetch persistent audio settings for the active event
  useEffect(() => {
    const targetId = currentEvent?.id || initialEvent?.id;
    if (targetId) {
      storageService.fetchTimerAudioConfig(targetId).catch(() => {});
    }
  }, [currentEvent?.id, initialEvent?.id]);

  // Client-side countdown tick calculated from authoritative timestamps: 0 network egress
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimerState(currentTs => {
        const remaining = storageService.calculateCurrentRemainingSec(currentTs);
        setDisplaySeconds(remaining);
        if (currentTs.isRunning) {
          if (remaining <= 0 && !hasProjectorAlarmTriggeredRef.current) {
            hasProjectorAlarmTriggeredRef.current = true;
            const targetId = currentEvent?.id || initialEvent?.id;
            const audioCfg = storageService.getTimerAudioConfig(targetId);
            if (!audioCfg.is_muted) {
              playTimerAlarm(audioCfg);
            }
          } else if (remaining > 0) {
            hasProjectorAlarmTriggeredRef.current = false;
          }
        } else {
          if (remaining > 0) {
            hasProjectorAlarmTriggeredRef.current = false;
          }
        }
        return currentTs;
      });
    }, 500);

    return () => clearInterval(timerInterval);
  }, [currentEvent?.id, initialEvent?.id]);

  // Scoped on-demand Display portal fetch (runs once on mount)
  const hasMountedDisplayFetchRef = useRef(false);
  useEffect(() => {
    if (hasMountedDisplayFetchRef.current) return;
    hasMountedDisplayFetchRef.current = true;
    const evs = storageService.getEvents();
    const activeEv = extractEventFromUrl(evs) || initialEvent || (currentEvent?.id ? evs.find(e => e.id === currentEvent.id) : null) || evs[0];
    const target = activeEv?.id || extractEventSlugCandidateFromUrl();
    if (target) {
      storageService.fetchDisplayPortalData(target, true).catch(err =>
        console.warn('[StandaloneProjectorDisplay] display data fetch warning:', err)
      );
    }
  }, [initialEvent?.id, currentEvent?.id]);

  // Sync state from storage event listeners & subscription (NO aggressive network polling)
  useEffect(() => {
    const syncState = () => {
      const evs = storageService.getEvents();
      const urlEv = extractEventFromUrl(evs);
      const ev = urlEv || (currentEvent?.id ? evs.find(e => e.id === currentEvent.id) : null) || initialEvent || evs[0];
      if (ev) {
        setCurrentEvent(ev);
        setSettings(storageService.getProjectorSettings(ev.id));
        const freshAgenda = storageService.getAgenda(ev.id);
        setAgenda(prev => (areJsonbObjectsEqual(prev, freshAgenda) ? prev : freshAgenda));
        setElections(storageService.getElections(ev.id));
        setFlashVotes(storageService.getFlashVotes(ev.id));
        setLearners(storageService.getLearners(ev.id));
        setBills(storageService.getBills(ev.id));
        setQuestions(storageService.getProceedingsQuestions(ev.id));

        const freshTimer = storageService.getLiveTimerState(ev.id);
        setTimerState(freshTimer);
        const rem = storageService.calculateCurrentRemainingSec(freshTimer);
        setDisplaySeconds(rem);
      }
    };

    syncState();
    window.addEventListener('storage', syncState);
    window.addEventListener('tn_assembly_timer_update', syncState);
    window.addEventListener('tn_assembly_projector_update', syncState);
    window.addEventListener('tn_assembly_agenda_update', syncState);

    const handleRevalidate = () => {
      syncState();
      const evs = storageService.getEvents();
      const activeEv = extractEventFromUrl(evs) || initialEvent || (currentEvent?.id ? evs.find(e => e.id === currentEvent.id) : null) || evs[0];
      const target = activeEv?.id || extractEventSlugCandidateFromUrl();
      if (target && !document.hidden) {
        storageService.fetchDisplayPortalData(target, true).catch(() => {});
      }
    };

    const handleAlarmEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const targetId = currentEvent?.id || initialEvent?.id;
      if (detail.eventId && targetId && detail.eventId !== targetId) return;
      if (detail.action === 'stop') {
        stopAllAlertAudio();
      } else if (detail.action === 'trigger') {
        const audioCfg = storageService.getTimerAudioConfig(targetId);
        if (!audioCfg.is_muted) {
          playTimerAlarm(audioCfg);
        }
      }
    };

    window.addEventListener('online', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('tn_assembly_timer_alarm_event', handleAlarmEvent);
    const unsubscribe = storageService.subscribe(syncState);

    return () => {
      window.removeEventListener('storage', syncState);
      window.removeEventListener('tn_assembly_timer_update', syncState);
      window.removeEventListener('tn_assembly_projector_update', syncState);
      window.removeEventListener('tn_assembly_agenda_update', syncState);
      window.removeEventListener('tn_assembly_timer_alarm_event', handleAlarmEvent);
      window.removeEventListener('online', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
      stopAllAlertAudio();
      unsubscribe();
    };
  }, [currentEvent?.id, initialEvent?.id]);

  // Authoritative Current Agenda Item
  const currentItem = agenda.find(a => a.is_current);
  const selectedAgenda =
    currentItem ||
    (settings.selectedAgendaId ? agenda.find(a => a.id === settings.selectedAgendaId) : null) ||
    (settings.return_agenda_item_id ? agenda.find(a => a.id === settings.return_agenda_item_id) : null) || ({
      id: 'not_started',
      event_id: currentEvent?.id || '',
      title: 'NOT STARTED',
      description: 'Legislative Assembly Floor Proceedings',
      day: 'Day 1',
      time: '--:--',
      speaker_role: 'NOT STARTED',
      duration_minutes: 0,
      category: 'Special',
      status: 'Upcoming',
      is_current: false
    } as AgendaItem);

  // Authoritative Election State
  const activeElection = elections.find(e => (e.status === 'Live' || e.status === 'live') && !e.is_archived);
  const targetBallotElection = settings.revealedElectionId
    ? elections.find(e => e.id === settings.revealedElectionId)
    : (activeElection || (settings.displayScene === 'election' ? elections.find(e => e.status === 'Closed' && !e.is_dismissed) : null));
  const isElectionLive = targetBallotElection?.status === 'Live' || targetBallotElection?.status === 'live';
  const isElectionClosed = targetBallotElection?.status === 'Closed';

  // Revealed Election Candidate Tally (ONLY when explicitly requested by settings.revealedElectionId or displayScene === 'election_result')
  const revealedElection = settings.revealedElectionId
    ? elections.find(e => e.id === settings.revealedElectionId)
    : (settings.displayScene === 'election_result' ? elections.find(e => e.is_result_revealed && !e.is_dismissed) : null);

  const isElectionResultScene = !!(
    (settings.displayScene === 'election_result' && revealedElection) ||
    (settings.displayScene === 'auto' && settings.revealedElectionId && revealedElection && revealedElection.is_result_revealed && !revealedElection.is_dismissed)
  );

  const isElectionVotingScene = !!(
    (settings.displayScene === 'election' && targetBallotElection) ||
    (settings.displayScene === 'auto' && isElectionLive)
  );

  const sortedCandidates = [...(revealedElection?.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const winnerCandidate = sortedCandidates.length > 0
    ? (sortedCandidates.find(c =>
        (revealedElection?.winner && (c.name.toLowerCase() === revealedElection.winner.toLowerCase() || c.id === revealedElection.winner))
      ) || sortedCandidates[0])
    : null;
  const runnerUpCandidate = sortedCandidates.length > 1 ? sortedCandidates[1] : null;
  const totalElectionVotes = (revealedElection?.total_votes || 0) > 0
    ? (revealedElection?.total_votes || 0)
    : sortedCandidates.reduce((acc, c) => acc + (c.votes || 0), 0);

  const winnerPct = winnerCandidate && totalElectionVotes > 0
    ? Math.round((winnerCandidate.votes / totalElectionVotes) * 100)
    : (winnerCandidate ? 100 : 0);

  const victoryMargin = winnerCandidate && runnerUpCandidate
    ? Math.max(0, winnerCandidate.votes - runnerUpCandidate.votes)
    : (winnerCandidate?.votes || 0);

  // Authoritative Bill State
  const liveBill = bills.find(b => b.status === 'Vote Open' || b.status === 'Voting');
  const targetBill = (settings.revealedBillId || settings.activeBillId)
    ? bills.find(b => b.id === (settings.revealedBillId || settings.activeBillId))
    : (liveBill || null);

  const isBillResultRevealed = !!(
    (settings.displayScene === 'bill_result' && targetBill && targetBill.is_result_revealed) ||
    (settings.displayScene === 'auto' && settings.revealedBillId && targetBill && targetBill.is_result_revealed && !targetBill.is_dismissed)
  );

  const isBillVotingActive = !!(
    (settings.displayScene === 'bill_voting' && targetBill && (targetBill.status === 'Vote Open' || targetBill.status === 'Voting')) ||
    (settings.displayScene === 'auto' && liveBill)
  );

  const isBillClosedUnrevealed = !!(
    settings.displayScene === 'bill_voting' && targetBill && targetBill.status === 'Vote Closed' && !targetBill.is_result_revealed
  );

  // Authoritative Question Hour State
  const activeQuestionId = settings.activeQuestionId || storageService.getActiveQuestionId(currentEvent?.id);
  const activeQuestion = questions.find(q => q.id === activeQuestionId) || (settings.displayScene === 'question_hour' ? questions.find(q => q.called_status === 'calling') : null);
  // Question is shown on projector ONLY when questionProjectorEnabled is explicitly true
  const isQuestionProjectorOn = settings.questionProjectorEnabled === true;
  const isQuestionHourScene = !!(
    isQuestionProjectorOn && activeQuestion && (
      settings.displayScene === 'question_hour' ||
      (settings.displayScene === 'auto' && activeQuestion.called_status === 'calling')
    )
  );

  const isBillUpcoming = !!(
    settings.displayScene === 'bill_voting' && targetBill && (targetBill.status === 'Draft' || targetBill.status === 'Ready')
  );

  // Authoritative Flash Vote State
  const liveFlashVote = flashVotes.find(f => (f.status === 'ACTIVE' || (f.status as string) === 'active') && !f.is_dismissed);
  const revealedFlashVote = settings.revealedFlashVoteId
    ? flashVotes.find(f => f.id === settings.revealedFlashVoteId)
    : (settings.displayScene === 'flash_vote' ? flashVotes.find(f => f.is_result_revealed && !f.is_dismissed) : null);
  const activeFlashVote = liveFlashVote || revealedFlashVote;

  const isFlashVoteScene = !!(
    (settings.displayScene === 'flash_vote' && activeFlashVote) ||
    (settings.displayScene === 'auto' && liveFlashVote)
  );

  // Timer Display Derivations
  const timerMins = Math.floor(displaySeconds / 60);
  const timerSecs = displaySeconds % 60;
  const formattedTimer = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;
  const isTimerRunning = timerState.isRunning;
  const isTimerPaused = !timerState.isRunning && displaySeconds > 0 && displaySeconds < timerState.durationSec;
  const isTimerExpired = displaySeconds === 0;

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#060912] text-white flex flex-col justify-between p-6 md:p-12 select-none relative overflow-hidden font-sans">
      
      {/* Top Indian Tricolor Header Banner */}
      {settings.showTricolorHeader && (
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600 z-20" />
      )}

      {/* Background Decorative Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Screen Top Header Bar */}
      <div className="flex items-center justify-between pt-2 border-b border-slate-800/80 pb-6 z-10">
        <div className="space-y-1">
          <h4 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{currentEvent ? currentEvent.college_name : (settings.customWelcomeTitle || 'TN Legislative Assembly')}</span>
          </h4>
          <p className="text-sm md:text-base font-semibold text-slate-400">
            {currentEvent ? `${currentEvent.chapter} | ${currentEvent.level}` : 'Legislative Assembly Domain'}
          </p>
        </div>

        {/* Live Status, Network Status, Audio Control & Live Timer Widget */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Connection Status Badge */}
          {connectionStatus === 'offline' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/25 text-rose-400 border border-rose-500/50 flex items-center gap-1.5 animate-pulse shadow-md">
              <WifiOff className="w-3.5 h-3.5" />
              <span>OFFLINE</span>
            </span>
          )}
          {connectionStatus === 'reconnecting' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/25 text-amber-400 border border-amber-500/50 flex items-center gap-1.5 animate-pulse shadow-md">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>RECONNECTING...</span>
            </span>
          )}

          {/* Audio Unlock & Test Control */}
          {!isAudioUnlocked ? (
            <button
              type="button"
              onClick={handleUnlockAudio}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/30 animate-pulse cursor-pointer"
              title="Click once to unlock browser audio alarms on this projector screen"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>ENABLE AUDIO</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTestSound}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Sound unlocked and active. Click to test configured alarm."
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>TEST SOUND</span>
            </button>
          )}

          {/* Synchronized Stage Timer Pill */}
          <div
            className={`px-5 py-2 rounded-2xl border flex items-center gap-3 transition-all ${
              isTimerRunning
                ? 'bg-emerald-950/60 border-emerald-500/60 shadow-lg shadow-emerald-950/80'
                : isTimerPaused
                  ? 'bg-amber-950/60 border-amber-500/60 shadow-lg shadow-amber-950/80'
                  : isTimerExpired
                    ? 'bg-rose-950/70 border-rose-500/70 shadow-lg shadow-rose-950/80'
                    : 'bg-slate-900/80 border-slate-700/80'
            }`}
          >
            <Clock
              className={`w-5 h-5 ${
                isTimerRunning
                  ? 'text-emerald-400 animate-pulse'
                  : isTimerPaused
                    ? 'text-amber-400'
                    : isTimerExpired
                      ? 'text-rose-400 animate-bounce'
                      : 'text-slate-400'
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl md:text-3xl font-black tracking-tight text-white">
                {formattedTimer}
              </span>
              {isTimerPaused && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  PAUSED
                </span>
              )}
              {isTimerExpired && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                  00:00
                </span>
              )}
            </div>
          </div>

          <span className="px-4 py-2 rounded-full text-xs md:text-sm font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-2 animate-pulse shadow-lg shadow-emerald-950/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {currentEvent?.status ? `${currentEvent.status.toUpperCase()} LIVE` : 'STAGE LIVE'}
          </span>
        </div>
      </div>

      {/* Screen Main Center Content */}
      <div className="my-auto text-center space-y-8 py-8 z-10 w-full">
        
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SCENE 1: WELCOME SCREEN                                                */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {settings.displayScene === 'welcome' ? (
          <div className="space-y-6 animate-result-reveal max-w-5xl mx-auto">
            <span className="text-sm md:text-lg font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              WELCOME DELEGATES & DIGNITARIES
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
              {currentEvent ? currentEvent.college_name : 'TN Legislative Assembly'}
            </h1>
            <p className="text-xl md:text-3xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
              Welcome to the Legislative Assembly. House proceedings commencing shortly.
            </p>
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE: PARLIAMENTARY QUESTION HOUR (CURRENT ACTIVE QUESTION)           */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : isQuestionHourScene && activeQuestion ? (
          <div className="space-y-8 animate-result-reveal max-w-5xl mx-auto w-full text-center">
            <div className="space-y-3">
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-6 py-2 rounded-full border border-amber-400/40 inline-flex items-center gap-2 shadow-xl shadow-amber-950/40">
                PARLIAMENTARY QUESTION HOUR
              </span>
              <div className="text-2xl md:text-4xl font-mono font-black text-amber-400">
                QUESTION NO. {activeQuestion.question_number || `Q-${String(activeQuestion.calling_order || activeQuestion.queue_order || 1).padStart(4, '0')}`}
              </div>
              {activeQuestion.calling_order && (
                <div className="text-xs md:text-sm font-mono text-slate-400">
                  Calling Order #{activeQuestion.calling_order}
                </div>
              )}
            </div>

            {/* Member and Ministry Meta Pill */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm md:text-base font-bold">
              <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-slate-300">
                Hon. Member: <strong className="text-white text-base md:text-lg">{activeQuestion.student_name}</strong>
              </div>
              {formatMemberConstituency(activeQuestion, learners) ? (
                <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-slate-300">
                  Constituency: <strong className="text-amber-400 font-mono font-bold">{formatMemberConstituency(activeQuestion, learners)}</strong>
                </div>
              ) : activeQuestion.constituency ? (
                <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-slate-300">
                  Constituency: <strong className="text-white">{activeQuestion.constituency}</strong>
                </div>
              ) : null}
              <div className="px-4 py-2 rounded-2xl bg-amber-950/50 border border-amber-500/40 shadow-lg text-amber-300">
                Target Ministry: <strong className="text-white">{activeQuestion.ministry}</strong>
              </div>
              <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                activeQuestion.bench === 'Ruling'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {activeQuestion.bench} Bench
              </span>
            </div>

            {/* Question Text in Large Elegant Presentation Card */}
            <div className="p-8 md:p-12 rounded-3xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl max-w-4xl mx-auto text-left relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
              <p className="text-2xl md:text-4xl font-serif text-white leading-relaxed font-medium">
                "{activeQuestion.question_text}"
              </p>
            </div>
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 2: BILL VOTING RESULT REVEAL (VERY LARGE STAGE MESSAGE)          */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : isBillResultRevealed && targetBill ? (
          <div className="space-y-8 animate-result-reveal max-w-5xl mx-auto w-full">
            
            {/* Header */}
            <div className="space-y-3">
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-6 py-2 rounded-full border border-purple-400/40 inline-flex items-center gap-2 shadow-xl shadow-purple-950/40">
                <FileText className="w-5 h-5 text-purple-400" /> LEGISLATIVE BILL RESULT DECLARED
              </span>
              <div className="text-xl md:text-2xl font-mono font-black text-purple-400">
                {targetBill.bill_number}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                {targetBill.title}
              </h1>
              {targetBill.description && (
                <p className="text-sm md:text-lg text-slate-300 max-w-3xl mx-auto font-medium">
                  {targetBill.description}
                </p>
              )}
              {targetBill.proposer && (
                <p className="text-xs md:text-sm text-slate-400">
                  Introduced by: <span className="text-slate-200 font-semibold">{targetBill.proposer}</span>
                </p>
              )}
            </div>

            {(() => {
              const counts = deriveBillVoteCounts(targetBill, learners.length);
              return (
                <>
                  {/* Vote Totals Breakdown Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-2">
                    <div className="p-6 rounded-3xl bg-emerald-950/50 border-2 border-emerald-500/60 shadow-xl text-center space-y-1">
                      <span className="text-xs md:text-sm uppercase font-black text-emerald-400 tracking-wider block">
                        AYES (YES)
                      </span>
                      <span className="text-4xl md:text-6xl font-mono font-black text-white">
                        {counts.ayes}
                      </span>
                    </div>

                    <div className="p-6 rounded-3xl bg-rose-950/50 border-2 border-rose-500/60 shadow-xl text-center space-y-1">
                      <span className="text-xs md:text-sm uppercase font-black text-rose-400 tracking-wider block">
                        NOES (NO)
                      </span>
                      <span className="text-4xl md:text-6xl font-mono font-black text-white">
                        {counts.noes}
                      </span>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border-2 border-slate-700/60 shadow-xl text-center space-y-1">
                      <span className="text-xs md:text-sm uppercase font-black text-slate-400 tracking-wider block">
                        ABSTAIN
                      </span>
                      <span className="text-4xl md:text-6xl font-mono font-black text-white">
                        {counts.abstain}
                      </span>
                    </div>

                    <div className="p-6 rounded-3xl bg-amber-950/50 border-2 border-amber-500/60 shadow-xl text-center space-y-1">
                      <span className="text-xs md:text-sm uppercase font-black text-amber-400 tracking-wider block">
                        TOTAL VOTES
                      </span>
                      <span className="text-4xl md:text-6xl font-mono font-black text-amber-300">
                        {counts.totalVotes}
                      </span>
                    </div>
                  </div>

                  {/* GIANT BILL PASSED / BILL FAILED BANNER */}
                  <div className="pt-4 max-w-4xl mx-auto">
                    {counts.result === 'PASSED' ? (
                      <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-emerald-950/90 via-slate-900 to-emerald-950/90 border-4 border-emerald-400 text-emerald-400 shadow-2xl shadow-emerald-950/80 animate-gold-glow flex flex-col items-center justify-center gap-4">
                        <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-emerald-400 animate-bounce" />
                        <span className="text-5xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                          BILL PASSED
                        </span>
                        <p className="text-lg md:text-2xl text-emerald-300 font-semibold">
                          The House has resolved in affirmative by majority division.
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-rose-950/90 via-slate-900 to-rose-950/90 border-4 border-rose-500 text-rose-400 shadow-2xl shadow-rose-950/80 flex flex-col items-center justify-center gap-4">
                        <XCircle className="w-16 h-16 md:w-20 md:h-20 text-rose-500 animate-bounce" />
                        <span className="text-5xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                          BILL FAILED
                        </span>
                        <p className="text-lg md:text-2xl text-rose-300 font-semibold">
                          The House has declined the motion. Division vote defeated.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 3: BILL VOTING LIVE STAGE (VOTING NOT OPEN / OPEN / CLOSED)     */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : (isBillVotingActive || isBillClosedUnrevealed || isBillUpcoming) && targetBill ? (
          <div className="flex flex-col items-center justify-center space-y-6 animate-slide-up max-w-4xl mx-auto text-center py-6 w-full">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-6 py-2 rounded-full border border-purple-500/30 inline-flex items-center gap-2 shadow-lg">
              <FileText className="w-4 h-4" /> BILL VOTING • FLOOR DIVISION
            </span>

            <div className="text-xl md:text-2xl font-mono font-bold text-purple-400">
              {targetBill.bill_number}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              {targetBill.title}
            </h1>

            {targetBill.description && (
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                {targetBill.description}
              </p>
            )}

            {/* Voting State Pill & Directions */}
            {isBillVotingActive ? (
              <div className="space-y-4 pt-4">
                <div className="px-10 py-4 rounded-full border-2 border-emerald-500/80 bg-emerald-950/60 text-emerald-400 text-3xl md:text-5xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 animate-ping" />
                  <span>VOTING OPEN</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-200">
                  Cast your vote (AYE / NO / ABSTAIN)
                </p>
                <div className="px-6 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-400 font-mono inline-block">
                  Votes Submitted: <span className="text-purple-400 font-bold">{deriveBillVoteCounts(targetBill, learners.length).totalVotes}</span>
                </div>
              </div>
            ) : isBillClosedUnrevealed ? (
              <div className="space-y-4 pt-4">
                <div className="px-10 py-4 rounded-full border-2 border-amber-500/80 bg-amber-950/60 text-amber-400 text-3xl md:text-5xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30">
                  <span>VOTING CLOSED</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-300">
                  RESULT NOT YET REVEALED
                </p>
                <p className="text-sm md:text-base text-slate-500 font-medium">
                  The House division tally is being prepared by the Speaker.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="px-10 py-4 rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-400 text-2xl md:text-4xl font-bold flex items-center justify-center gap-3 shadow-xl">
                  <span>VOTING NOT OPEN</span>
                </div>
                <p className="text-xl md:text-2xl font-medium text-slate-400">
                  Awaiting Speaker call for division
                </p>
              </div>
            )}
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 4: ANIMATED CANDIDATE ELECTION RESULT REVEAL SCREEN              */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : isElectionResultScene && revealedElection ? (
          <div className="space-y-8 animate-result-reveal max-w-6xl mx-auto w-full">
            
            {/* Reveal Header */}
            <div className="space-y-2">
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-300 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 px-6 py-2 rounded-full border border-amber-400/40 inline-flex items-center gap-2 shadow-xl shadow-amber-950/40">
                <Trophy className="w-5 h-5 text-amber-400 animate-bounce" /> OFFICIAL ELECTION RESULT DECLARED
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                {revealedElection?.title || 'Assembly Speaker Election'}
              </h1>
              <p className="text-sm md:text-base text-slate-400 font-mono">
                Total Ballots Cast: <span className="text-amber-400 font-bold">{totalElectionVotes}</span> • Electorate: <span className="text-slate-200 font-bold">{revealedElection?.position || 'Whole House'}</span>
              </p>
            </div>

            {/* Winner Spotlight Banner (Giant Gold Illuminated Card) */}
            {winnerCandidate ? (
              <div className="relative bg-gradient-to-b from-amber-950/80 via-slate-900/90 to-amber-950/80 border-2 border-amber-400/80 p-8 md:p-10 rounded-3xl shadow-2xl animate-gold-glow overflow-hidden max-w-4xl mx-auto">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-xs md:text-sm uppercase tracking-widest">
                    <Crown className="w-5 h-5 text-amber-400" /> ELECTED WINNER
                  </div>

                  <h2 className="text-4xl md:text-7xl font-black text-amber-300 tracking-tight drop-shadow-xl">
                    {winnerCandidate.name}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <span className="px-4 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs md:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" /> {winnerCandidate.party}
                    </span>
                    <span className="px-4 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs md:text-sm font-bold text-amber-400">
                      {winnerCandidate.bench} Bench
                    </span>
                    <span className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs md:text-sm font-extrabold text-emerald-300">
                      {winnerCandidate.votes} Votes ({winnerPct}%)
                    </span>
                    {victoryMargin > 0 && (
                      <span className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs md:text-sm font-extrabold text-amber-300">
                        +{victoryMargin} Victory Margin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 max-w-xl mx-auto">
                No candidates on this ballot.
              </div>
            )}

            {/* Candidate Breakdown Percentage Bars */}
            <div className="max-w-4xl mx-auto space-y-3.5 pt-4 text-left">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 text-center mb-4">
                Full House Ballot Division breakdown
              </h3>

              {sortedCandidates.map((cand, idx) => {
                const pct = totalElectionVotes > 0 ? Math.round(((cand.votes || 0) / totalElectionVotes) * 100) : (idx === 0 ? 100 : 0);
                const isWinner = idx === 0;
                return (
                  <div
                    key={cand.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWinner
                        ? 'bg-amber-950/40 border-amber-500/50 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${
                          isWinner ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className={`text-base md:text-lg font-black ${isWinner ? 'text-white' : 'text-slate-200'}`}>
                            {cand.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2 font-medium">
                            ({cand.party} • {cand.bench})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg md:text-xl font-mono font-black text-white">
                          {cand.votes}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1.5">
                          ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full animate-bar-grow transition-all duration-1000 ${
                          isWinner
                            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 5: PARLIAMENTARY ELECTION VOTING STAGE                          */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : isElectionVotingScene && targetBallotElection ? (
          <div className="flex flex-col items-center justify-center space-y-6 animate-slide-up max-w-4xl mx-auto text-center py-6 w-full">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              PARLIAMENTARY ELECTION
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              {targetBallotElection?.title || 'Speaker Election'}
            </h1>

            {isElectionClosed ? (
              <div className="space-y-4 pt-4">
                <div className="px-10 py-3.5 rounded-full border-2 border-amber-500/80 bg-amber-950/40 text-amber-400 text-3xl md:text-5xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20">
                  <span>VOTING CLOSED</span>
                </div>
                <p className="text-xl md:text-3xl font-medium text-slate-300">
                  RESULT NOT YET REVEALED
                </p>
                <p className="text-sm md:text-base text-slate-500 font-medium">
                  Awaiting Speaker declaration of final election results.
                </p>
              </div>
            ) : isElectionLive ? (
              <div className="space-y-4 pt-4">
                <div className="px-8 py-3.5 rounded-full border-2 border-emerald-500/80 bg-emerald-950/40 text-emerald-400 text-3xl md:text-5xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                  <span>VOTING OPEN</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-200">
                  Cast your vote on your device
                </p>
                <div className="mt-4 px-6 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-400 font-mono inline-block">
                  House Ballots Cast: <span className="text-amber-400 font-bold">{targetBallotElection?.voted_delegate_ids?.length || targetBallotElection?.total_votes || 0}</span> / {learners.length || 117}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="px-8 py-3.5 rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-400 text-2xl md:text-4xl font-bold flex items-center justify-center gap-3 shadow-xl">
                  <span>VOTING NOT OPEN</span>
                </div>
                <p className="text-xl md:text-2xl font-medium text-slate-400">
                  Ballot is scheduled to open shortly
                </p>
              </div>
            )}
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 6: LIVE FLOOR DIVISION (FLASH VOTE) STAGE                       */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : isFlashVoteScene && activeFlashVote ? (
          <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
            <span className="text-sm md:text-base font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              <Sparkles className="w-5 h-5 inline mr-2" /> LIVE FLOOR DIVISION • {activeFlashVote?.motion_type || 'PROCEDURAL MOTION'}
              {activeFlashVote.is_result_revealed ? ' • RESULT REVEALED' : activeFlashVote.status === 'CLOSED' ? ' • VOTING CLOSED' : ' • VOTING OPEN'}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white max-w-4xl mx-auto leading-tight tracking-tight drop-shadow-lg">
              {activeFlashVote?.question || 'Should the Assembly Bill pass the House Division vote?'}
            </h1>
            {activeFlashVote.status === 'CLOSED' && !activeFlashVote.is_result_revealed ? (
              <div className="space-y-4 pt-4">
                <div className="px-10 py-3.5 rounded-full border-2 border-amber-500/80 bg-amber-950/40 text-amber-400 text-3xl md:text-5xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20 inline-flex">
                  <span>VOTING CLOSED</span>
                </div>
                <p className="text-xl md:text-3xl font-medium text-slate-300">
                  RESULT NOT YET REVEALED
                </p>
                <p className="text-sm md:text-base text-slate-500 font-medium">
                  Awaiting Speaker declaration of floor division totals.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-8 pt-6">
                <div className="bg-emerald-950/90 border-2 border-emerald-500/50 px-10 py-6 rounded-3xl text-center shadow-2xl min-w-[160px]">
                  <span className="text-sm uppercase text-emerald-400 font-extrabold block tracking-wider">AYE</span>
                  <span className="text-5xl md:text-6xl font-mono font-black text-white">{activeFlashVote?.ayes_count || 0}</span>
                </div>
                <div className="bg-rose-950/90 border-2 border-rose-500/50 px-10 py-6 rounded-3xl text-center shadow-2xl min-w-[160px]">
                  <span className="text-sm uppercase text-rose-400 font-extrabold block tracking-wider">NO</span>
                  <span className="text-5xl md:text-6xl font-mono font-black text-white">{activeFlashVote?.noes_count || 0}</span>
                </div>
                <div className="bg-slate-900/90 border-2 border-slate-700 px-10 py-6 rounded-3xl text-center shadow-2xl min-w-[160px]">
                  <span className="text-sm uppercase text-slate-400 font-extrabold block tracking-wider">ABSTAIN</span>
                  <span className="text-5xl md:text-6xl font-mono font-black text-white">{activeFlashVote?.abstain_count || 0}</span>
                </div>
              </div>
            )}
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 7: HOUSE RECESS / BREAK                                         */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : settings.displayScene === 'break' ? (
          <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
            <span className="text-sm md:text-lg font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-6 py-2 rounded-full border border-indigo-500/30 inline-block shadow-lg">
              HOUSE RECESS / SESSION ADJOURNED
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg">
              Session Adjourned for Recess
            </h1>
            <p className="text-xl text-slate-300">
              Delegates please assemble back in the auditorium chamber shortly.
            </p>
          </div>

        /* ══════════════════════════════════════════════════════════════════════ */
        /* SCENE 8: DEFAULT AUTHORITATIVE AGENDA BROADCAST STAGE                 */
        /* ══════════════════════════════════════════════════════════════════════ */
        ) : (
          <div className="space-y-6 animate-slide-up max-w-6xl mx-auto w-full px-4">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/30 inline-block shadow-md">
              {selectedAgenda.speaker_role || 'CURRENT SESSION'}
            </span>
            
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              {selectedAgenda.title}
            </h1>

            {selectedAgenda.description && (
              <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                {selectedAgenda.description}
              </p>
            )}

            {/* DOMINANT PROMINENT STAGE TIMER DISPLAY AREA (AUDITORIUM OPTIMIZED) */}
            <div className="py-6 md:py-8 flex flex-col items-center justify-center">
              <div
                className={`w-full max-w-3xl p-8 md:p-12 rounded-[2.5rem] border-4 transition-all flex flex-col items-center justify-center shadow-2xl ${
                  isTimerRunning
                    ? 'bg-emerald-950/60 border-emerald-400/90 shadow-emerald-950/90 ring-8 ring-emerald-500/30'
                    : isTimerPaused
                      ? 'bg-amber-950/60 border-amber-400/90 shadow-amber-950/90 ring-8 ring-amber-500/30'
                      : isTimerExpired
                        ? 'bg-rose-950/70 border-rose-400/90 shadow-rose-950/90 ring-8 ring-rose-500/40'
                        : 'bg-slate-900/90 border-slate-700 shadow-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Clock
                    className={`w-7 h-7 md:w-9 md:h-9 ${
                      isTimerRunning
                        ? 'text-emerald-400 animate-pulse'
                        : isTimerPaused
                          ? 'text-amber-400'
                          : isTimerExpired
                            ? 'text-rose-400 animate-bounce'
                            : 'text-slate-400'
                    }`}
                  />
                  <span className="text-sm md:text-base font-black uppercase tracking-widest text-slate-200">
                    {isTimerRunning
                      ? 'SESSION TIME REMAINING'
                      : isTimerPaused
                        ? 'SESSION TIMER PAUSED'
                        : isTimerExpired
                          ? 'SESSION TIME ELAPSED'
                          : 'SESSION TIMER'}
                  </span>
                </div>

                <div
                  className={`font-mono text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-black tracking-tight drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] select-none leading-none my-4 ${
                    isTimerRunning
                      ? 'text-emerald-400'
                      : isTimerPaused
                        ? 'text-amber-400'
                        : isTimerExpired
                          ? 'text-rose-400 animate-pulse'
                          : 'text-white'
                  }`}
                >
                  {formattedTimer}
                </div>

                <div className="flex items-center gap-3 mt-3 text-sm md:text-base text-slate-300 font-bold">
                  <span>Planned: {selectedAgenda.duration_minutes ? `${selectedAgenda.duration_minutes} min` : (selectedAgenda.time || '10 min')}</span>
                  {selectedAgenda.category && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">{selectedAgenda.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="px-5 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm md:text-base font-bold text-slate-300">
                {selectedAgenda.day || 'Day 1'} • {selectedAgenda.time || '10:00 AM'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Live Marquee Ticker Overlay Banner */}
      {settings.isTickerActive && settings.tickerMessage && (
        <div className="mb-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm md:text-lg flex items-center gap-4 shadow-2xl z-20">
          <span className="px-3 py-1 rounded bg-slate-950 text-amber-400 text-xs md:text-sm uppercase tracking-wider font-extrabold shrink-0">
            ANNOUNCEMENT
          </span>
          <div className="whitespace-nowrap animate-marquee font-bold tracking-wide">
            {settings.tickerMessage}
          </div>
        </div>
      )}

      {/* Screen Bottom Protocol & Display-Only Controls Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 z-10">
        <div className="text-xs md:text-sm text-slate-500 font-mono flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>TN Legislative Assembly Live Stage Presentation</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs md:text-sm shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Stage Fullscreen'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
