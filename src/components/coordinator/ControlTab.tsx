import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  Learner,
  Party,
  AgendaItem,
  ScoreRecord,
  Election,
  LiveFlashVote,
  CollegeEvent,
  SpeakingRequest,
  SpeakingTurn
} from '../../types';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  Megaphone,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Monitor,
  History,
  X,
  Mic,
  Search,
  Hand
} from 'lucide-react';

import { storageService } from '../../services/storageService';

interface ControlTabProps {
  learners: Learner[];
  parties?: Party[];
  agenda?: AgendaItem[];
  scores?: ScoreRecord[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  currentEvent?: CollegeEvent | null;
  eventName?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onSetCurrentAgendaItem?: (eventId: string, itemId: string) => void;
  onUpdatePartyBench?: (partyId: string, bench: 'Ruling' | 'Opposition' | 'Independent') => void;
  onOpenLivePollModal?: () => void;
  onOpenProjectorView?: () => void;
}

export const ControlTab: React.FC<ControlTabProps> = ({
  learners,
  parties = [],
  agenda = [],
  scores = [],
  elections: _elections = [],
  flashVotes: _flashVotes = [],
  currentEvent,
  eventName: _eventName = 'TN Youth Assembly',
  onShowToast,
  onSetCurrentAgendaItem,
  onUpdatePartyBench,
  onOpenProjectorView
}) => {


  // ── Agenda Navigation State ──────────────────────────────────────────────
  const [activeDayTab, setActiveDayTab] = useState<'Pre-Event' | 'Day 1' | 'Day 2'>('Day 1');
  const [agendaFilter, setAgendaFilter] = useState<'ALL' | 'SCORED_VOTED'>('ALL');



  const allEventAgenda = agenda.length >= 2 ? agenda : storageService.getAgenda(currentEvent?.id);

  const currentAgendaList = allEventAgenda
    .filter(a => activeDayTab === 'Pre-Event' ? (a.day === 'Pre-Event' || a.day.includes('Pre')) : a.day === activeDayTab)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const filteredAgendaList = currentAgendaList.filter(item => {
    if (agendaFilter === 'SCORED_VOTED') {
      return item.title.toLowerCase().includes('election') ||
             item.title.toLowerCase().includes('bill') ||
             item.title.toLowerCase().includes('debate') ||
             item.speaker_role?.toLowerCase().includes('election');
    }
    return true;
  });

  const [currentAgendaIndex, setCurrentAgendaIndex] = useState<number>(() => {
    const idx = currentAgendaList.findIndex(a => a.is_current);
    return idx >= 0 ? idx : Math.min(8, currentAgendaList.length - 1);
  });

  const activeAgendaItem = currentAgendaList[currentAgendaIndex] || currentAgendaList[0] || {
    id: 'ag_curr',
    event_id: currentEvent?.id || '',
    day: 'Day 1',
    time: '10:05 AM',
    title: 'Speaker Election',
    description: '10 min',
    speaker_role: 'speaker_election',
    is_current: true
  };

  // ── Speech Timer State ───────────────────────────────────────────────────
  const [timerDurationSec, setTimerDurationSec] = useState(() => {
    return storageService.getLiveTimerState(currentEvent?.id)?.durationSec || 600;
  });
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const s = storageService.getLiveTimerState(currentEvent?.id);
    return s.secondsLeft !== undefined ? s.secondsLeft : 600;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    return !!storageService.getLiveTimerState(currentEvent?.id)?.isRunning;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  useEffect(() => {
    const handleTimerSync = () => {
      const state = storageService.getLiveTimerState(currentEvent?.id);
      if (state) {
        setTimerDurationSec(state.durationSec);
        if (state.isRunning && state.startedAt) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
          setSecondsLeft(Math.max(0, state.secondsLeft - elapsed));
        } else {
          setSecondsLeft(state.secondsLeft);
        }
        setIsTimerRunning(state.isRunning);
      }
    };
    handleTimerSync();
    const unsub = storageService.subscribe(handleTimerSync);
    window.addEventListener('tn_assembly_timer_update', handleTimerSync);
    return () => {
      unsub();
      window.removeEventListener('tn_assembly_timer_update', handleTimerSync);
    };
  }, [currentEvent?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (currentEvent?.id) {
              storageService.saveLiveTimerState(currentEvent.id, {
                durationSec: timerDurationSec,
                secondsLeft: 0,
                isRunning: false,
                updatedAt: Date.now()
              });
            }
            if (isSoundEnabled) {
              playTimerBeep();
            }
            onShowToast('⏰ Time Expired', `Floor time for ${activeAgendaItem.title} concluded`, 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft, isSoundEnabled, activeAgendaItem, currentEvent?.id, timerDurationSec]);

  const playTimerBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const formatTimerDigits = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // ── Speaking Floor & Hand-Raise State (Real Persisted) ───────────────────
  const [isPhoneHandRaiseOn, setIsPhoneHandRaiseOn] = useState(() => {
    return currentEvent?.id ? storageService.getHandRaiseEnabled(currentEvent.id) : true;
  });

  useEffect(() => {
    if (!currentEvent?.id) return;
    const syncHandRaise = () => {
      setIsPhoneHandRaiseOn(storageService.getHandRaiseEnabled(currentEvent.id));
    };
    syncHandRaise();
    window.addEventListener('tn_assembly_hand_raise_setting', syncHandRaise);
    const unsub = storageService.subscribe(syncHandRaise);
    return () => {
      unsub();
      window.removeEventListener('tn_assembly_hand_raise_setting', syncHandRaise);
    };
  }, [currentEvent?.id]);

  const [speakingRequests, setSpeakingRequests] = useState<SpeakingRequest[]>(() => {
    return currentEvent?.id ? storageService.getSpeakingRequests(currentEvent.id) : [];
  });
  const [speakingTurns, setSpeakingTurns] = useState<SpeakingTurn[]>(() => {
    return currentEvent?.id ? storageService.getSpeakingTurns(currentEvent.id) : [];
  });
  const [callingSpeakerId, setCallingSpeakerId] = useState<string | null>(null);
  const [finishingTurnId, setFinishingTurnId] = useState<string | null>(null);
  const [showHandsDownModal, setShowHandsDownModal] = useState(false);
  const [isLoweringHands, setIsLoweringHands] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySessionFilter, setHistorySessionFilter] = useState<string>('all');
  const [selectedHistoryLearnerId, setSelectedHistoryLearnerId] = useState<string | null>(null);

  // Sync active session and speaking floor data with persistent storage & realtime
  useEffect(() => {
    if (!currentEvent?.id) return;

    // Set active session for speaking requests
    storageService.setActiveSession(currentEvent.id, { id: activeAgendaItem.id, title: activeAgendaItem.title });

    const refreshSpeakingData = () => {
      if (!currentEvent?.id) return;
      const reqs = storageService.getSpeakingRequests(currentEvent.id);
      const turns = storageService.getSpeakingTurns(currentEvent.id);
      setSpeakingRequests([...reqs]);
      setSpeakingTurns([...turns]);
    };

    refreshSpeakingData();

    // Async fetch from Supabase
    storageService.fetchActiveSpeakingRequests(currentEvent.id).then(reqs => {
      setSpeakingRequests([...reqs]);
    }).catch(console.error);

    storageService.fetchSpeakingTurns(currentEvent.id).then(turns => {
      setSpeakingTurns([...turns]);
    }).catch(console.error);

    const handleReqUpdate = () => refreshSpeakingData();
    const handleTurnUpdate = () => refreshSpeakingData();
    const unsub = storageService.subscribe(refreshSpeakingData);
    window.addEventListener('tn_assembly_speaking_request_update', handleReqUpdate);
    window.addEventListener('tn_assembly_speaking_turn_update', handleTurnUpdate);
    window.addEventListener('tn_assembly_speaking_update', handleReqUpdate);

    return () => {
      unsub();
      window.removeEventListener('tn_assembly_speaking_request_update', handleReqUpdate);
      window.removeEventListener('tn_assembly_speaking_turn_update', handleTurnUpdate);
      window.removeEventListener('tn_assembly_speaking_update', handleReqUpdate);
    };
  }, [currentEvent?.id, activeAgendaItem.id, activeAgendaItem.title]);

  // Turn counts for each learner in the CURRENT session
  const sessionTurnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    speakingTurns
      .filter(t => t.event_id === currentEvent?.id && t.session_id === activeAgendaItem.id && t.status !== 'CANCELLED')
      .forEach(t => {
        counts[t.learner_id] = (counts[t.learner_id] || 0) + 1;
      });
    return counts;
  }, [speakingTurns, currentEvent?.id, activeAgendaItem.id]);

  // Total turn counts for each learner across ALL sessions of the CURRENT EVENT
  const totalTurnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    speakingTurns
      .filter(t => t.event_id === currentEvent?.id && t.status !== 'CANCELLED')
      .forEach(t => {
        counts[t.learner_id] = (counts[t.learner_id] || 0) + 1;
      });
    return counts;
  }, [speakingTurns, currentEvent?.id]);

  // Speaking priority queue for CURRENT session:
  // 1. Lowest total speaking turns across the event first
  // 2. Lowest speaking count in current session first
  // 3. Earliest hand-raise/request time first
  // 4. Stable deterministic tie-breaker
  const waitingRequests = useMemo(() => {
    return speakingRequests
      .filter(r => r.event_id === currentEvent?.id && r.session_id === activeAgendaItem.id && r.status === 'WAITING')
      .sort((a, b) => {
        const totalA = totalTurnCounts[a.learner_id] || 0;
        const totalB = totalTurnCounts[b.learner_id] || 0;
        if (totalA !== totalB) return totalA - totalB;

        const sessionA = sessionTurnCounts[a.learner_id] || 0;
        const sessionB = sessionTurnCounts[b.learner_id] || 0;
        if (sessionA !== sessionB) return sessionA - sessionB;

        const timeA = new Date(a.requested_at).getTime();
        const timeB = new Date(b.requested_at).getTime();
        if (timeA !== timeB) return timeA - timeB;

        return a.learner_name.localeCompare(b.learner_name);
      });
  }, [speakingRequests, currentEvent?.id, activeAgendaItem.id, totalTurnCounts, sessionTurnCounts]);

  // Currently active speaker turn for this session (status === 'SPEAKING')
  const activeSpeakerTurn = useMemo(() => {
    return speakingTurns.find(t => t.event_id === currentEvent?.id && t.session_id === activeAgendaItem.id && t.status === 'SPEAKING');
  }, [speakingTurns, currentEvent?.id, activeAgendaItem.id]);

  // Unique learners who have spoken in this session
  const spokenLearnerIds = useMemo(() => {
    const ids = new Set<string>();
    speakingTurns
      .filter(t => t.event_id === currentEvent?.id && t.session_id === activeAgendaItem.id && t.status !== 'CANCELLED')
      .forEach(t => ids.add(t.learner_id));
    return ids;
  }, [speakingTurns, currentEvent?.id, activeAgendaItem.id]);

  const spokenLearnersCount = spokenLearnerIds.size;

  // Actual event participants who have NOT yet spoken in the current session
  const yetToSpeakLearners = useMemo(() => {
    return learners.filter(l => !spokenLearnerIds.has(l.id));
  }, [learners, spokenLearnerIds]);

  const handleCallSpeaker = async (req: SpeakingRequest) => {
    if (!currentEvent?.id) return;
    setCallingSpeakerId(req.id);
    try {
      const res = await storageService.callSpeaker({
        requestId: req.id,
        eventId: currentEvent.id,
        sessionId: req.session_id,
        sessionName: req.session_name,
        learnerId: req.learner_id,
        learnerName: req.learner_name,
        calledBy: 'Speaker / Control'
      });
      if (res.success) {
        onShowToast('Floor Granted', `${req.learner_name} has been called to the floor`, 'success');
      } else {
        onShowToast('Call Failed', res.error || 'Failed to call speaker', 'error');
      }
    } catch (err: any) {
      onShowToast('Call Failed', err?.message || 'Failed to call speaker', 'error');
    } finally {
      setCallingSpeakerId(null);
    }
  };

  const handleFinishTurn = async (turn: SpeakingTurn) => {
    if (!currentEvent?.id) return;
    setFinishingTurnId(turn.id);
    try {
      const res = await storageService.completeSpeakingTurn({
        turnId: turn.id,
        requestId: turn.request_id,
        eventId: currentEvent.id,
        sessionId: turn.session_id
      });
      if (res.success) {
        onShowToast('Turn Completed', `${turn.learner_name}'s speech recorded in Hansard`, 'success');
      } else {
        onShowToast('Turn Finish Error', res.error || 'Failed to complete speaking turn', 'error');
      }
    } catch (err: any) {
      onShowToast('Turn Finish Error', err?.message || 'Failed to complete speaking turn', 'error');
    } finally {
      setFinishingTurnId(null);
    }
  };

  const handleCancelRequest = async (req: SpeakingRequest) => {
    if (!currentEvent?.id) return;
    try {
      await storageService.cancelSpeakingRequest(req.id, currentEvent.id, req.session_id);
      onShowToast('Request Dismissed', `${req.learner_name}'s request was dismissed`, 'info');
    } catch (err: any) {
      onShowToast('Dismiss Error', err?.message || 'Failed to dismiss request', 'error');
    }
  };

  const handleTogglePhoneHandRaise = async () => {
    if (!currentEvent?.id) return;
    const next = !isPhoneHandRaiseOn;
    setIsPhoneHandRaiseOn(next);
    await storageService.setHandRaiseEnabled(currentEvent.id, next);
    onShowToast('Hand-Raise Control', next ? 'Phone hand-raise active for delegates' : 'Phone hand-raise disabled', 'info');
  };

  const handleLowerAllHands = async () => {
    if (!currentEvent?.id) return;
    setIsLoweringHands(true);
    try {
      const res = await storageService.lowerAllSpeakingRequests(currentEvent.id, activeAgendaItem.id);
      setShowHandsDownModal(false);
      onShowToast('Hands Down', `Cleared ${res.count} waiting speaking request${res.count === 1 ? '' : 's'}.`, 'success');
    } catch (err: any) {
      onShowToast('Hands Down Failed', err?.message || 'Error clearing waiting requests', 'error');
    } finally {
      setIsLoweringHands(false);
    }
  };

  // ── Government Formation State (Parties & Bench) ──────────────────────────
  const handlePartyBenchChange = (partyId: string, newBench: 'Ruling' | 'Opposition' | 'Independent') => {
    if (onUpdatePartyBench) {
      onUpdatePartyBench(partyId, newBench);
    }
    const targetParty = parties.find(p => p.id === partyId);
    onShowToast(
      'Party Bench Updated',
      `${targetParty?.name || 'Party'} set to ${newBench}`,
      newBench === 'Ruling' ? 'success' : 'info'
    );
  };

  const computedRulingCount = useMemo(() => {
    return learners.filter(l => l.bench === 'Ruling').length;
  }, [learners]);

  const computedOppositionCount = useMemo(() => {
    return learners.filter(l => l.bench === 'Opposition').length;
  }, [learners]);

  const [isGovtFormationOpen, setIsGovtFormationOpen] = useState(true);

  // ── Individual Agenda Item Reset State ────────────────────────────────────
  const [resetConfirmItem, setResetConfirmItem] = useState<AgendaItem | null>(null);
  const [isResettingItem, setIsResettingItem] = useState(false);

  const handleConfirmResetItem = async () => {
    if (!resetConfirmItem || !currentEvent) return;
    setIsResettingItem(true);
    try {
      const res = storageService.resetIndividualAgendaItem(currentEvent.id, resetConfirmItem.id);
      if (res.success) {
        onShowToast('Agenda Item Reset', `"${resetConfirmItem.title}" marked as Upcoming and can now be activated.`, 'success');
      } else {
        onShowToast('Reset Failed', res.error || 'Could not reset agenda item.', 'error');
      }
    } catch (e: any) {
      onShowToast('Error', e.message || 'Failed to reset agenda item', 'error');
    } finally {
      setIsResettingItem(false);
      setResetConfirmItem(null);
    }
  };

  // ── Projector Broadcast State ─────────────────────────────────────────────
  const [bannerText, setBannerText] = useState('');
  const [flashBanner, setFlashBanner] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // ── Locks & Controls ──────────────────────────────────────────────────────
  const [allocationLock, setAllocationLock] = useState(() => storageService.getAllocationLock(currentEvent?.id));
  const [registrationsFrozen, setRegistrationsFrozen] = useState(() => storageService.getRegistrationsFrozen(currentEvent?.id));
  const [scoresLocked, setScoresLocked] = useState(() => storageService.getScoresLocked(currentEvent?.id));

  // Issue #6: Monotonic lock timestamps & busy tracking to eliminate toggle flickering
  const [togglingLocks, setTogglingLocks] = useState<Set<'allocation' | 'frozen' | 'scores'>>(new Set());
  const lastLocalToggleTimestampRef = useRef<{ allocation?: number; frozen?: number; scores?: number }>({});

  useEffect(() => {
    const updateLocks = () => {
      const now = Date.now();
      const recent = lastLocalToggleTimestampRef.current;

      if (!recent.allocation || now - recent.allocation > 3500) {
        setAllocationLock(storageService.getAllocationLock(currentEvent?.id));
      }
      if (!recent.frozen || now - recent.frozen > 3500) {
        setRegistrationsFrozen(storageService.getRegistrationsFrozen(currentEvent?.id));
      }
      if (!recent.scores || now - recent.scores > 3500) {
        setScoresLocked(storageService.getScoresLocked(currentEvent?.id));
      }
    };
    updateLocks();
    const unsub = storageService.subscribe(updateLocks);
    return unsub;
  }, [currentEvent?.id]);



  const handleToggleTimer = () => {
    const nextRunning = !isTimerRunning;
    if (nextRunning && isSoundEnabled) playTimerBeep();
    setIsTimerRunning(nextRunning);
    if (currentEvent?.id) {
      storageService.saveLiveTimerState(currentEvent.id, {
        durationSec: timerDurationSec,
        secondsLeft: secondsLeft,
        isRunning: nextRunning,
        startedAt: nextRunning ? Date.now() : undefined,
        pausedAt: !nextRunning ? Date.now() : undefined,
        updatedAt: Date.now()
      });
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft(timerDurationSec);
    if (currentEvent?.id) {
      storageService.saveLiveTimerState(currentEvent.id, {
        durationSec: timerDurationSec,
        secondsLeft: timerDurationSec,
        isRunning: false,
        updatedAt: Date.now()
      });
    }
  };

  const handleDurationChange = (val: number) => {
    const dur = Math.max(10, val);
    setTimerDurationSec(dur);
    if (!isTimerRunning) {
      setSecondsLeft(dur);
      if (currentEvent?.id) {
        storageService.saveLiveTimerState(currentEvent.id, {
          durationSec: dur,
          secondsLeft: dur,
          isRunning: false,
          updatedAt: Date.now()
        });
      }
    }
  };

  const handleNextAgenda = () => {
    if (currentAgendaIndex < currentAgendaList.length - 1) {
      const nextIdx = currentAgendaIndex + 1;
      setCurrentAgendaIndex(nextIdx);
      const nextItem = currentAgendaList[nextIdx];
      if (currentEvent) {
        storageService.setCurrentAgendaItem(currentEvent.id, nextItem.id);
        if (onSetCurrentAgendaItem) {
          onSetCurrentAgendaItem(currentEvent.id, nextItem.id);
        }
        storageService.saveLiveTimerState(currentEvent.id, {
          durationSec: timerDurationSec,
          secondsLeft: timerDurationSec,
          isRunning: false,
          updatedAt: Date.now()
        });
      }
      setSecondsLeft(timerDurationSec);
      setIsTimerRunning(false);
      onShowToast('Next Session Item', nextItem.title, 'success');
    }
  };

  const handlePrevAgenda = () => {
    if (currentAgendaIndex > 0) {
      const prevIdx = currentAgendaIndex - 1;
      setCurrentAgendaIndex(prevIdx);
      const prevItem = currentAgendaList[prevIdx];
      if (currentEvent) {
        storageService.setCurrentAgendaItem(currentEvent.id, prevItem.id);
        if (onSetCurrentAgendaItem) {
          onSetCurrentAgendaItem(currentEvent.id, prevItem.id);
        }
        storageService.saveLiveTimerState(currentEvent.id, {
          durationSec: timerDurationSec,
          secondsLeft: timerDurationSec,
          isRunning: false,
          updatedAt: Date.now()
        });
      }
      setSecondsLeft(timerDurationSec);
      setIsTimerRunning(false);
      onShowToast('Previous Session Item', prevItem.title, 'info');
    }
  };

  const handlePushToProjector = () => {
    if (!bannerText.trim()) return;
    setIsBroadcasting(true);
    onShowToast('Broadcast Pushed', 'Banner broadcast is now live on the main projector screen', 'success');
  };

  const handleClearProjector = () => {
    setBannerText('');
    setIsBroadcasting(false);
    onShowToast('Broadcast Cleared', 'Projector screen reset', 'info');
  };

  // Checked in count
  const eventIdForCounts = currentEvent?.id || (learners.length > 0 ? learners[0].event_id : undefined);
  const checkedInCount = useMemo(() => {
    if (eventIdForCounts) {
      // Use database-sourced checked-in count
      const allLearners = storageService.getLearners(eventIdForCounts);
      return allLearners.filter(l => l.day1_checked_in || l.day2_checked_in).length;
    }
    return learners.filter(l => l.day1_checked_in || l.day2_checked_in).length;
  }, [eventIdForCounts, learners]);

  const totalParticipantCount = useMemo(() => {
    if (eventIdForCounts) {
      return storageService.getTotalAssignedCount(eventIdForCounts);
    }
    return learners.length;
  }, [eventIdForCounts, learners]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Top Quick Status & Projector View Bar (Matching 4th Image) */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeDayTab}
          </span>
          <button
            type="button"
            onClick={onOpenProjectorView || (() => window.open('/?projector=true', '_blank'))}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Monitor className="w-4 h-4 text-blue-500" />
            <span>Open Projector View</span>
          </button>
        </div>
      </div>
      
      {/* 2-Column Responsive Layout matching User Reference Images 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT MAIN COLUMN (Col 1 to 7) ─────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. CURRENT AGENDA ITEM CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Current Agenda Item</span>
              </div>
              <button
                onClick={() => onShowToast('Add On-The-Spot Item', 'Enter an ad-hoc point of order or special debate', 'info')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>On-the-spot item</span>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeAgendaItem.title}
                </h2>
                {activeAgendaItem.status === 'Completed' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
                    COMPLETED
                  </span>
                )}
                {activeAgendaItem.status === 'Completed' && (
                  <button
                    type="button"
                    onClick={() => setResetConfirmItem(activeAgendaItem)}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                    title="Reset this completed agenda item"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Planned duration: <strong>{activeAgendaItem.description || '10 min'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold">
                  {activeAgendaItem.speaker_role || 'speaker_election'}
                </span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrevAgenda}
                disabled={currentAgendaIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={handleNextAgenda}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={handleNextAgenda}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all ml-auto cursor-pointer"
              >
                <span>Next</span> <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. SPEECH DURATION TIMER CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="font-mono text-6xl md:text-7xl font-black tracking-tight text-slate-400 dark:text-slate-300 select-none">
                {formatTimerDigits(secondsLeft)}
              </span>
            </div>

            <div className="space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timerDurationSec}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 600;
                    handleDurationChange(val);
                  }}
                  className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500 font-semibold">sec</span>

                <button
                  onClick={handleToggleTimer}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isTimerRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                </button>

                <button
                  onClick={handleResetTimer}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <button
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled);
                  onShowToast('Audio Feedback', isSoundEnabled ? 'Timer alert sound muted' : 'Timer alert sound enabled', 'info');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isSoundEnabled ? 'Timer sound enabled' : 'Tap once to enable timer sound'}</span>
              </button>
            </div>
          </div>

          {/* 3. SPEAKING FLOOR CARD (Production Realtime & Persisted) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  ✋ Speaking Floor
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {waitingRequests.length} waiting
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowHandsDownModal(true)}
                  disabled={waitingRequests.length === 0}
                  className="px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Hand className="w-3.5 h-3.5 rotate-180" />
                  <span>HANDS DOWN</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePhoneHandRaise}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isPhoneHandRaiseOn
                      ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone hand-raise: {isPhoneHandRaiseOn ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Live session: <strong className="text-slate-800 dark:text-slate-200">{activeAgendaItem.title}</strong>
              </div>
              <span className="text-[11px] text-slate-400">
                Priority: Lowest Total Turns → Lowest Session Turns → Earliest Hand
              </span>
            </div>

            {/* Active Speaker Banner (if someone is called and currently speaking) */}
            {activeSpeakerTurn && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow">
                      <Mic className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        NOW SPEAKING
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Turn #{activeSpeakerTurn.sequence_number}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeSpeakerTurn.learner_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Called at {new Date(activeSpeakerTurn.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFinishTurn(activeSpeakerTurn)}
                  disabled={finishingTurnId === activeSpeakerTurn.id}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{finishingTurnId === activeSpeakerTurn.id ? 'Recording...' : 'Mark Spoken / Yield Floor'}</span>
                </button>
              </div>
            )}

            {/* Priority Waiting Queue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  WAITING TO SPEAK ({waitingRequests.length})
                </span>
                {waitingRequests.length > 0 && (
                  <span className="text-[10px] text-slate-400 italic">
                    Ordered by priority
                  </span>
                )}
              </div>

              {waitingRequests.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  No delegates currently waiting to speak in this session.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {waitingRequests.map((req, idx) => {
                    const learner = learners.find(l => l.id === req.learner_id);
                    const sessionTurns = sessionTurnCounts[req.learner_id] || 0;
                    const totalTurns = totalTurnCounts[req.learner_id] || 0;
                    const isCalling = callingSpeakerId === req.id;

                    return (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            #{learner?.constituency_number || (idx + 1)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {req.learner_name}
                              </span>
                              {learner?.bench && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  learner.bench === 'Ruling'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                    : learner.bench === 'Opposition'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {learner.bench}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {learner?.constituency_number ? `#${learner.constituency_number} ` : ''}{learner?.constituency_name || ''}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-0.5">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Session: {sessionTurns} {sessionTurns === 1 ? 'turn' : 'turns'}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                Total: {totalTurns} {totalTurns === 1 ? 'turn' : 'turns'}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-slate-400 font-mono">
                                Raised: {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCallSpeaker(req)}
                            disabled={isCalling}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Mic className="w-3 h-3" />
                            <span>{isCalling ? 'Calling...' : 'CALL'}</span>
                          </button>
                          <button
                            onClick={() => handleCancelRequest(req)}
                            title="Dismiss hand-raise"
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Speaking Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{spokenLearnersCount} of {learners.length || 1} delegates have spoken</span>
                <span>{Math.round((spokenLearnersCount / Math.max(learners.length, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round((spokenLearnersCount / Math.max(learners.length, 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Yet to speak list */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  YET TO SPEAK — {yetToSpeakLearners.length}
                </span>
                <span className="text-[10px] text-slate-400">
                  Zero turns in this session
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {yetToSpeakLearners.length > 0 ? (
                  yetToSpeakLearners.map((s, idx) => (
                    <span
                      key={s.id || idx}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-sm flex items-center gap-1"
                    >
                      <span className="font-mono text-[11px] opacity-75">#{s.constituency_number || (idx + 101)}</span>
                      <span>{s.full_name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    All delegates in the roster have spoken in this session.
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Turns are counted from the Now Speaking desk — call on someone above when hands go up to keep the floor fair.
            </p>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>See the full speaking record →</span>
            </button>
          </div>

          {/* 4. GOVERNMENT FORMATION COLLAPSIBLE (Matching User Reference Image 2) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <button
              onClick={() => setIsGovtFormationOpen(!isGovtFormationOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  🏛️ Government Formation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Ruling · {computedRulingCount}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Opposition · {computedOppositionCount}
                </span>
                {isGovtFormationOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {isGovtFormationOpen && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Move each party to the Ruling or Opposition bench. Members follow their party automatically. You can change this at any time during the event.
                </p>

                {/* Party Bench Assignment List */}
                <div className="space-y-2.5 pt-1">
                  {parties.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      No political parties configured yet. Import participants with party assignments or configure parties in the Parties tab.
                    </div>
                  ) : (
                    parties.map((party) => {
                      const partyMemberCount = learners.filter(
                        l => l.party_id === party.id || (!l.party_id && l.party_name === party.name)
                      ).length;
                      const isRuling = party.bench === 'Ruling';
                      const isOpposition = party.bench === 'Opposition';

                      return (
                        <div
                          key={party.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isRuling
                              ? 'border-blue-400 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm'
                              : isOpposition
                                ? 'border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <strong
                              className={`text-xs font-bold ${
                                isRuling
                                  ? 'text-blue-700 dark:text-blue-400'
                                  : isOpposition
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {party.name}
                            </strong>
                            <span className="text-slate-400 text-[11px] font-normal">
                              {partyMemberCount} member{partyMemberCount !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Interactive Ruling / Opposition / Clear Bench Switchers */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Ruling Button */}
                            <button
                              onClick={() => handlePartyBenchChange(party.id, 'Ruling')}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isRuling
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isRuling && <span>✓</span>}
                              <span>Ruling</span>
                            </button>

                            {/* Opposition Button */}
                            <button
                              onClick={() => handlePartyBenchChange(party.id, 'Opposition')}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isOpposition
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isOpposition && <span>✓</span>}
                              <span>Opposition</span>
                            </button>

                            {/* Clear Button */}
                            <button
                              onClick={() => handlePartyBenchChange(party.id, 'Independent')}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer font-medium"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>





          {/* 7. BROADCAST (PROJECTOR BANNER) CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Broadcast (Projector Banner)
              </h4>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                maxLength={280}
                placeholder="Breaking news — appears on projector screen"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{280 - bannerText.length} chars remaining</span>
                <span className={isBroadcasting ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                  {isBroadcasting ? '● Live on Projector' : 'Not broadcasting'}
                </span>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={flashBanner}
                  onChange={(e) => setFlashBanner(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Flash the banner — off keeps it steady on screen, better for a notice you leave up</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePushToProjector}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" /> Push to projector
              </button>
              <button
                onClick={handleClearProjector}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (Col 8 to 12): Agenda Timeline, Quick Stats, Security Locks ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* AGENDA CARD - YIP STYLED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Header: Agenda Title + Day Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Agenda</h3>

              {/* Day Sub-tabs (YIP style: Orange active pill, white outlined inactive pills) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['Pre-Event', 'Day 1', 'Day 2'] as const).map(day => {
                  const isActive = activeDayTab === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveDayTab(day)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-sm font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day === 'Pre-Event' ? 'Pre-Event (Online)' : day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Show filter pills (YIP style) */}
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 font-medium">Show:</span>
              <button
                onClick={() => setAgendaFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  agendaFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Full agenda
              </button>
              <button
                onClick={() => setAgendaFilter('SCORED_VOTED')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  agendaFilter === 'SCORED_VOTED'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Scored / voted only
              </button>
            </div>

            {/* Scrollable Agenda Item List (YIP Style) */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredAgendaList.map((item, idx) => {
                const isSelected = item.id === activeAgendaItem.id;
                const isCompleted = item.status === 'Completed';
                const durationText = item.duration_minutes
                  ? `${item.duration_minutes} min`
                  : item.description && item.description.includes('min')
                    ? item.description
                    : 'No duration set';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isCompleted) {
                        onShowToast('Item Completed', `"${item.title}" is already completed. Click Reset to re-open it.`, 'info');
                        return;
                      }
                      setCurrentAgendaIndex(idx);
                      const targetItem = item;
                      if (currentEvent) {
                        storageService.setCurrentAgendaItem(currentEvent.id, targetItem.id);
                        if (onSetCurrentAgendaItem) {
                          onSetCurrentAgendaItem(currentEvent.id, targetItem.id);
                        }
                        const dur = (targetItem.duration_minutes || 10) * 60;
                        setTimerDurationSec(dur);
                        setSecondsLeft(dur);
                        setIsTimerRunning(false);
                        storageService.saveLiveTimerState(currentEvent.id, {
                          durationSec: dur,
                          secondsLeft: dur,
                          isRunning: false,
                          updatedAt: Date.now()
                        });
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'opacity-85 bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                        : isSelected
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400/80 dark:border-emerald-600/80 shadow-sm cursor-pointer'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Status Bullet: Green solid dot if selected, check icon if completed, Circle outline if unselected */}
                      {isSelected ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                      ) : isCompleted ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 mt-0.5 shrink-0 flex items-center justify-center text-[9px] font-black">
                          ✓
                        </span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 mt-0.5 shrink-0 flex items-center justify-center text-[8px] text-slate-400" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className={`text-xs font-bold leading-tight ${
                            isSelected
                              ? 'text-emerald-800 dark:text-emerald-300 font-extrabold'
                              : isCompleted
                                ? 'text-slate-500 dark:text-slate-400 font-semibold line-through'
                                : 'text-slate-900 dark:text-white font-bold'
                          }`}>
                            {item.title}
                          </h5>
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 font-normal">
                          {durationText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Small Reset Button - Visible ONLY for completed item */}
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetConfirmItem(item);
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                          title="Reset this completed agenda item"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Reset</span>
                        </button>
                      )}

                      {/* Pencil Edit Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowToast('Edit Agenda Item', `Editing "${item.title}" in Agenda Builder`, 'info');
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                        title="Edit item"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUICK STATS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Quick Stats
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Participants</span>
                </div>
                <strong className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {totalParticipantCount}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Checked In</span>
                </div>
                <strong className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {checkedInCount}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Scores Submitted</span>
                </div>
                <strong className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {scores.length || 38}
                </strong>
              </div>
            </div>
          </div>

          {/* SECURITY LOCKS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Locks</h4>
            </div>

            <div className="space-y-4 text-xs">
              {/* Allocation Lock */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <strong className="block text-slate-900 dark:text-white font-bold">Allocation lock</strong>
                  <span className="text-slate-500 text-[11px]">Disables further role & party changes.</span>
                </div>
                <label className={`relative inline-flex items-center shrink-0 ${togglingLocks.has('allocation') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={allocationLock}
                    disabled={togglingLocks.has('allocation')}
                    onChange={async (e) => {
                      if (togglingLocks.has('allocation')) return;
                      const val = e.target.checked;
                      setTogglingLocks(prev => new Set(prev).add('allocation'));
                      lastLocalToggleTimestampRef.current.allocation = Date.now();
                      setAllocationLock(val);

                      try {
                        const res = await storageService.setAllocationLock(val, currentEvent?.id);
                        if (!res.success) {
                          setAllocationLock(!val);
                          delete lastLocalToggleTimestampRef.current.allocation;
                          onShowToast('Lock Failed', res.error?.message || 'Database update failed', 'error');
                          return;
                        }
                        onShowToast(val ? '🔒 Allocation Locked' : '🔓 Allocation Unlocked', val ? 'Role & party allocations locked' : 'Allocations unlocked', 'info');
                      } catch (err: any) {
                        setAllocationLock(!val);
                        delete lastLocalToggleTimestampRef.current.allocation;
                        onShowToast('Lock Error', err?.message || 'Network error updating lock', 'error');
                      } finally {
                        setTimeout(() => {
                          setTogglingLocks(prev => {
                            const next = new Set(prev);
                            next.delete('allocation');
                            return next;
                          });
                        }, 400);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Registrations Frozen */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <strong className="block text-slate-900 dark:text-white font-bold">Registrations frozen</strong>
                  <span className="text-slate-500 text-[11px]">Blocks new walk-in additions.</span>
                </div>
                <label className={`relative inline-flex items-center shrink-0 ${togglingLocks.has('frozen') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={registrationsFrozen}
                    disabled={togglingLocks.has('frozen')}
                    onChange={async (e) => {
                      if (togglingLocks.has('frozen')) return;
                      const val = e.target.checked;
                      setTogglingLocks(prev => new Set(prev).add('frozen'));
                      lastLocalToggleTimestampRef.current.frozen = Date.now();
                      setRegistrationsFrozen(val);

                      try {
                        const res = await storageService.setRegistrationsFrozen(val, currentEvent?.id);
                        if (!res.success) {
                          setRegistrationsFrozen(!val);
                          delete lastLocalToggleTimestampRef.current.frozen;
                          onShowToast('Freeze Failed', res.error?.message || 'Database update failed', 'error');
                          return;
                        }
                        onShowToast(val ? '❄️ Registrations Frozen' : '🔓 Registrations Open', val ? 'Walk-in & CSV additions blocked' : 'Registrations open', 'info');
                      } catch (err: any) {
                        setRegistrationsFrozen(!val);
                        delete lastLocalToggleTimestampRef.current.frozen;
                        onShowToast('Freeze Error', err?.message || 'Network error updating lock', 'error');
                      } finally {
                        setTimeout(() => {
                          setTogglingLocks(prev => {
                            const next = new Set(prev);
                            next.delete('frozen');
                            return next;
                          });
                        }, 400);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Scores Locked */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <strong className="block text-slate-900 dark:text-white font-bold">Scores locked</strong>
                  <span className="text-slate-500 text-[11px]">Blocks jury submissions live.</span>
                </div>
                <label className={`relative inline-flex items-center shrink-0 ${togglingLocks.has('scores') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={scoresLocked}
                    disabled={togglingLocks.has('scores')}
                    onChange={async (e) => {
                      if (togglingLocks.has('scores')) return;
                      const val = e.target.checked;
                      setTogglingLocks(prev => new Set(prev).add('scores'));
                      lastLocalToggleTimestampRef.current.scores = Date.now();
                      setScoresLocked(val);

                      try {
                        const res = await storageService.setScoresLocked(val, currentEvent?.id);
                        if (!res.success) {
                          setScoresLocked(!val);
                          delete lastLocalToggleTimestampRef.current.scores;
                          onShowToast('Lock Failed', res.error?.message || 'Database update failed', 'error');
                          return;
                        }
                        onShowToast(val ? '🔒 Scores Locked' : '🔓 Scores Unlocked', val ? 'Jury evaluation scoring locked' : 'Scoring open', 'info');
                      } catch (err: any) {
                        setScoresLocked(!val);
                        delete lastLocalToggleTimestampRef.current.scores;
                        onShowToast('Lock Error', err?.message || 'Network error updating lock', 'error');
                      } finally {
                        setTimeout(() => {
                          setTogglingLocks(prev => {
                            const next = new Set(prev);
                            next.delete('scores');
                            return next;
                          });
                        }, 400);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── HANSARD SPEAKING RECORD MODAL (Part 11) ────────────────────────────── */}
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
                  <option value={activeAgendaItem.id}>Current: {activeAgendaItem.title}</option>
                  {Array.from(new Set(speakingTurns.map(t => t.session_name || t.session_id)))
                    .filter(s => s !== activeAgendaItem.title && s !== activeAgendaItem.id)
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
                  const currentSessionTurns = sessionTurnCounts[learnerId] || 0;
                  const eventTotalTurns = totalTurnCounts[learnerId] || turns.length;

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
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hands Down Confirmation Modal */}
      {showHandsDownModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Hand className="w-5 h-5 rotate-180 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Lower all raised hands?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  All currently waiting speaking requests for this session will be cleared.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowHandsDownModal(false)}
                disabled={isLoweringHands}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLowerAllHands}
                disabled={isLoweringHands}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-900/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoweringHands ? 'Lowering...' : 'Lower All Hands'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Agenda Item Reset Confirmation Modal */}
      {resetConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reset this agenda item?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  This will mark this agenda item as active again and allow it to be started again.
                </p>
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Item: <span className="font-bold text-slate-900 dark:text-white">{resetConfirmItem.title}</span> ({resetConfirmItem.day})
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResetConfirmItem(null)}
                disabled={isResettingItem}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetItem}
                disabled={isResettingItem}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-950/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResettingItem ? 'Resetting...' : 'Reset Agenda Item'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
