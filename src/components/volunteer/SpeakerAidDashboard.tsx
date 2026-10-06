import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  Search,
  Square,
  LogOut,
  Moon,
  Sun,
  Clock,
  History,
  Volume2,
  RefreshCw,
  X,
  Play,
  ShieldAlert
} from 'lucide-react';
import type { Volunteer, Learner, CollegeEvent, ScoringSession, SpeakingTurn } from '../../types';
import { storageService } from '../../services/storageService';
import { useTheme } from '../../lib/theme';
import { canUseSpeakerAid } from '../../utils/permissions';

interface SpeakerAidDashboardProps {
  volunteer?: Volunteer | null;
  event?: CollegeEvent | null;
  learners?: Learner[];
  onLogout?: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SpeakerAidDashboard: React.FC<SpeakerAidDashboardProps> = ({
  volunteer,
  event,
  learners: propLearners = [],
  onLogout,
  onShowToast
}) => {
  const { theme, toggleTheme } = useTheme();
  const eventId = event?.id || volunteer?.event_id || (() => {
    if (typeof window === 'undefined') return '';
    try {
      const auth = localStorage.getItem('tn_assembly_auth_session');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.currentEventId || parsed.volunteer?.event_id || '';
      }
    } catch {}
    return '';
  })() || '';

  // Effective learners list
  const [internalLearners, setInternalLearners] = useState<Learner[]>(() => {
    if (propLearners && propLearners.length > 0) return propLearners;
    if (eventId) return storageService.getLearners(eventId);
    return [];
  });

  const learners = useMemo(() => {
    if (propLearners && propLearners.length > 0) return propLearners;
    if (internalLearners.length > 0) return internalLearners;
    if (eventId) return storageService.getLearners(eventId);
    return [];
  }, [propLearners, internalLearners, eventId]);

  // Available sessions
  const sessions = useMemo<ScoringSession[]>(() => {
    if (!eventId) return [];
    return storageService.getScoringSessions(eventId);
  }, [eventId]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (sessions.length > 0) return sessions[0].id;
    return 'session_general';
  });

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || {
      id: selectedSessionId || 'session_general',
      name: 'Assembly Floor Session'
    };
  }, [sessions, selectedSessionId]);

  const [envTick, setEnvTick] = useState(0);
  const testMode = useMemo(() => {
    return storageService.getScoringTestMode(eventId);
  }, [eventId, envTick]);
  const isTestMode = testMode.isTestMode;
  const activeTestRunId = testMode.testRunId;

  // Active speaking turn
  const [activeSpeakerTurn, setActiveSpeakerTurn] = useState<SpeakingTurn | null>(() => {
    const tm = storageService.getScoringTestMode(eventId);
    return storageService.getAuthoritativeCurrentSpeaker(eventId, selectedSessionId, tm.isTestMode ? 'test' : 'live', tm.testRunId);
  });

  // Recent speaking turns log
  const [turnsLog, setTurnsLog] = useState<SpeakingTurn[]>(() => {
    const tm = storageService.getScoringTestMode(eventId);
    return storageService.getSpeakingTurns(eventId, undefined, tm.isTestMode ? 'test' : 'live', tm.testRunId).slice(-15).reverse();
  });

  // Fast Search and Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [benchFilter, setBenchFilter] = useState<'ALL' | 'Ruling' | 'Opposition' | 'Independent'>('ALL');
  const [isStartingTurn, setIsStartingTurn] = useState(false);
  const [isFinishingTurn, setIsFinishingTurn] = useState(false);

  // Live Speaking Timer (client memory derived, zero database writes)
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with storageService
  const refreshFloorState = () => {
    const tm = storageService.getScoringTestMode(eventId);
    const mode = tm.isTestMode ? 'test' : 'live';
    const active = storageService.getAuthoritativeCurrentSpeaker(eventId, selectedSessionId, mode, tm.testRunId);
    setActiveSpeakerTurn(active);
    const all = storageService.getSpeakingTurns(eventId, undefined, mode, tm.testRunId);
    setTurnsLog(all.slice(-15).reverse());
    setEnvTick(t => t + 1);
  };

  // Authoritative operational role check: ONLY genuine Speaker Aid may access this dashboard
  const isAuthorized = canUseSpeakerAid(volunteer, 'volunteer', null);

  // Mount effect: connect realtime sync, fetch cloud speaking turns & sync scoring environment
  useEffect(() => {
    if (!isAuthorized || !eventId) return;
    storageService.setupRealtimeSync(eventId);
    storageService.syncScoringEnvironment(eventId).then(() => {
      refreshFloorState();
    }).catch(() => {});
    storageService.fetchSpeakingTurns(eventId).then(() => {
      refreshFloorState();
    }).catch(() => {});
    const cur = storageService.getLearners(eventId);
    if (cur.length === 0) {
      storageService.fetchPaginatedLearners(eventId, { limit: 500 }).then(res => {
        if (res.data && res.data.length > 0) {
          setInternalLearners(res.data);
        }
      }).catch(() => {});
    }
  }, [isAuthorized, eventId]);

  useEffect(() => {
    if (!isAuthorized) return;
    refreshFloorState();
    const unsub = storageService.subscribe(refreshFloorState);

    const handleSpeakerChanged = () => {
      refreshFloorState();
    };

    window.addEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
    window.addEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
    window.addEventListener('tn_assembly_speaking_update', handleSpeakerChanged);
    window.addEventListener('tn_assembly_scoring_environment_update', handleSpeakerChanged);
    window.addEventListener('tn_assembly_test_mode_update', handleSpeakerChanged);
    window.addEventListener('tn_assembly_jury_scoring_reset', handleSpeakerChanged);
    window.addEventListener('storage', handleSpeakerChanged);

    return () => {
      unsub();
      window.removeEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_speaking_update', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_scoring_environment_update', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_test_mode_update', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_jury_scoring_reset', handleSpeakerChanged);
      window.removeEventListener('storage', handleSpeakerChanged);
    };
  }, [isAuthorized, eventId, selectedSessionId]);

  // Timer Tick (in-memory)
  useEffect(() => {
    if (activeSpeakerTurn && activeSpeakerTurn.status === 'SPEAKING' && activeSpeakerTurn.started_at) {
      const startTime = new Date(activeSpeakerTurn.started_at).getTime();
      const updateTimer = () => {
        const now = Date.now();
        setElapsedSec(Math.max(0, Math.floor((now - startTime) / 1000)));
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedSec(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSpeakerTurn]);

  // Format MM:SS
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filtered learners for instant inline list
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      if (benchFilter !== 'ALL' && l.bench !== benchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const constNumStr = l.constituency_number !== undefined && l.constituency_number !== null ? String(l.constituency_number) : '';
        const constMatches = constNumStr === q || constNumStr.includes(q) || `#${constNumStr}`.includes(q);
        const nameMatches = l.full_name ? l.full_name.toLowerCase().includes(q) : false;
        const constNameMatches = l.constituency_name ? l.constituency_name.toLowerCase().includes(q) : false;
        const partyMatches = l.party_name ? l.party_name.toLowerCase().includes(q) : false;
        const codeMatches = l.access_code ? l.access_code.toLowerCase().includes(q) : false;
        return constMatches || nameMatches || constNameMatches || partyMatches || codeMatches;
      }
      return true;
    });
  }, [learners, benchFilter, searchQuery]);

  // Active Speaker details
  const activeLearner = useMemo(() => {
    if (!activeSpeakerTurn) return null;
    return learners.find(l => l.id === activeSpeakerTurn.learner_id);
  }, [activeSpeakerTurn, learners]);


  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div
          className="max-w-md w-full rounded-3xl p-8 border shadow-2xl text-center space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-rose-600 tracking-tight">Access Restricted</h2>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
              Speaker Aid Console
            </p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            This operational console is strictly reserved for designated Speaker Aid volunteers.
            Your current assignment ({volunteer?.station || volunteer?.volunteer_type || volunteer?.role || 'Unauthorized'}) does not have permission to control the assembly floor.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/join';
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Return to Login / Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle speaker selection (1-click fast operation)
  const handleSelectSpeaker = async (learner: Learner) => {
    if (!isAuthorized) return;
    if (isStartingTurn) return;
    setIsStartingTurn(true);
    try {
      const targetEventId = eventId || volunteer?.event_id || learner.event_id || '';
      const tm = storageService.getScoringTestMode(targetEventId);
      const res = await storageService.setAuthoritativeCurrentSpeaker({
        eventId: targetEventId,
        sessionId: selectedSession.id,
        sessionName: selectedSession.name,
        learnerId: learner.id,
        learnerName: learner.full_name,
        calledBy: volunteer?.name ? `Speaker Aid (${volunteer.name})` : 'Speaker Aid',
        isTest: tm.isTestMode,
        testRunId: tm.testRunId
      });

      if (res.success && res.turn) {
        setActiveSpeakerTurn(res.turn);
        setSearchQuery('');
        onShowToast?.(
          'Speaker Active',
          `${learner.full_name} is now speaking on the floor (Turn ${res.turn.sequence_number})`,
          'success'
        );
      } else {
        onShowToast?.('Error', res.error || 'Failed to start speaking turn', 'error');
      }
    } catch (err: any) {
      onShowToast?.('Error', err?.message || 'Failed to start speaking turn', 'error');
    } finally {
      setIsStartingTurn(false);
    }
  };

  // Handle finish speech
  const handleFinishSpeech = async () => {
    if (!isAuthorized) return;
    if (isFinishingTurn || !activeSpeakerTurn) return;
    setIsFinishingTurn(true);
    try {
      const targetEventId = eventId || volunteer?.event_id || activeSpeakerTurn.event_id || '';
      const tm = storageService.getScoringTestMode(targetEventId);
      const res = await storageService.endAuthoritativeCurrentSpeaker({
        eventId: targetEventId,
        sessionId: activeSpeakerTurn.session_id,
        turnId: activeSpeakerTurn.id,
        isTest: tm.isTestMode
      });
      if (res.success) {
        setActiveSpeakerTurn(null);
        onShowToast?.('Speech Concluded', `${activeSpeakerTurn.learner_name}'s speech has concluded.`, 'info');
      }
    } catch (err: any) {
      onShowToast?.('Error', err?.message || 'Failed to conclude speech', 'error');
    } finally {
      setIsFinishingTurn(false);
    }
  };

  // Focus search input
  const handleSwitchSpeaker = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  };


  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <header className="border-b px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs max-w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                SPEAKER AID
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Floor Control Console
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {event?.college_name || 'TN Assembly 2026'} • Operator: {volunteer?.name || 'Floor Volunteer'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Session Dropdown */}
          {sessions.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold hidden md:inline">Session:</span>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sign Out */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Test / Live Mode Banner */}
      <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-bold ${
        isTestMode
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isTestMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          <span className="uppercase tracking-wider font-black">
            {isTestMode ? '🟠 TEST SPEAKER AID' : '🟢 LIVE SPEAKER AID'}
          </span>
          {isTestMode && activeTestRunId && (
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-500/40 font-bold">
              CURRENT TEST RUN: {activeTestRunId}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium opacity-85">
          {isTestMode ? 'Speaking turns in test mode are completely isolated from production' : 'Official live assembly floor proceedings'}
        </span>
      </div>

      {/* Main Console Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        
        {/* CURRENT SPEAKER CARD */}
        <section
          className="rounded-3xl border shadow-md overflow-hidden transition-all"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeSpeakerTurn ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`}></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                CURRENT SPEAKER
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Session: {selectedSession.name}
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {activeSpeakerTurn && activeSpeakerTurn.status === 'SPEAKING' ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        🔴 NOW SPEAKING
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        Speaking Turn {activeSpeakerTurn.sequence_number}
                      </span>
                      {activeLearner?.bench && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            backgroundColor: activeLearner.bench === 'Ruling' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                            color: activeLearner.bench === 'Ruling' ? '#059669' : '#dc2626',
                            borderColor: activeLearner.bench === 'Ruling' ? '#059669' : '#dc2626'
                          }}
                        >
                          {activeLearner.bench} Bench
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      {activeSpeakerTurn.learner_name}
                    </h2>

                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                      {activeLearner?.constituency_number !== undefined ? `Constituency #${activeLearner.constituency_number} — ` : ''}
                      {activeLearner?.constituency_name || 'Assembly Delegate'}
                      {activeLearner?.party_name ? ` • ${activeLearner.party_name}` : ''}
                    </p>
                  </div>

                  {/* Live Timer (0 DB writes) */}
                  <div className="flex flex-col sm:items-end justify-center">
                    <div className="px-5 py-3 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-inner flex items-center gap-3">
                      <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Speech Duration</div>
                        <div className="font-mono text-2xl font-black tracking-widest text-white">
                          {formatDuration(elapsedSec)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Fast Actions */}
                <div className="pt-3 border-t flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <button
                    type="button"
                    disabled={isFinishingTurn}
                    onClick={handleFinishSpeech}
                    className="flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-xl font-bold text-xs border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current text-rose-600 dark:text-rose-400" />
                    <span>{isFinishingTurn ? 'Finishing...' : 'FINISH SPEECH'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchSpeaker}
                    className="flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>SWITCH SPEAKER</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle state: No MLA speaking */
              <div className="text-center py-6 sm:py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    🔵 NO SPEAKER ACTIVE
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    The floor is currently idle. Search and click "START SPEAKING" below to recognize the next MLA.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAST INLINE SEARCH & MLA SELECTION ROSTER */}
        <section
          className="rounded-3xl border shadow-sm p-5 space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-rose-500" />
                SEARCH MLA / ROSTER
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1-click to start speech. Connects immediately to all Jury dashboards.
              </p>
            </div>

            {/* Bench Filters */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {(['ALL', 'Ruling', 'Opposition', 'Independent'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBenchFilter(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    benchFilter === b
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                } else if (e.key === 'Enter' && filteredLearners.length > 0) {
                  handleSelectSpeaker(filteredLearners[0]);
                }
              }}
              placeholder="Search by MLA name, seat/constituency #, or constituency name..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Fast Delegate Card List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredLearners.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No delegates found matching "{searchQuery}".
              </div>
            ) : (
              filteredLearners.map(learner => {
                const isCurrent = activeSpeakerTurn?.learner_id === learner.id && activeSpeakerTurn?.status === 'SPEAKING';
                return (
                  <div
                    key={learner.id}
                    data-testid={`speaker-row-${learner.id}`}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isCurrent
                        ? 'border-rose-500 bg-rose-500/10 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 w-9 text-right shrink-0">
                        #{learner.constituency_number ?? '?'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {learner.full_name}
                          </h4>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                              SPEAKING
                            </span>
                          )}
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              background: learner.bench === 'Ruling' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                              color: learner.bench === 'Ruling' ? '#059669' : '#dc2626',
                              borderColor: learner.bench === 'Ruling' ? '#059669' : '#dc2626'
                            }}
                          >
                            {learner.bench || 'Ruling'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {learner.constituency_name || 'Assembly Delegate'} • {learner.party_name || 'Independent'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled={isFinishingTurn}
                          onClick={handleFinishSpeech}
                          className="px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Finish</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isStartingTurn}
                          onClick={() => handleSelectSpeaker(learner)}
                          className="px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white dark:hover:text-white transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>SELECT & START</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RECENT SPEAKING TURNS */}
        <section
          className="rounded-3xl border shadow-xs overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                RECENT SPEAKING TURNS
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {turnsLog.length} recorded
            </span>
          </div>

          <div className="divide-y max-h-56 overflow-y-auto" style={{ borderColor: 'var(--border-soft)' }}>
            {turnsLog.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No recorded speaking turns yet for this session.
              </div>
            ) : (
              turnsLog.map(turn => {
                const isCurrentlyActive = turn.id === activeSpeakerTurn?.id && turn.status === 'SPEAKING';
                let durText = '—';
                if (turn.started_at && turn.completed_at) {
                  const s = new Date(turn.started_at).getTime();
                  const e = new Date(turn.completed_at).getTime();
                  durText = formatDuration(Math.max(0, Math.floor((e - s) / 1000)));
                } else if (isCurrentlyActive) {
                  durText = formatDuration(elapsedSec);
                }

                return (
                  <div
                    key={turn.id}
                    className={`p-3.5 flex items-center justify-between text-xs transition ${
                      isCurrentlyActive ? 'bg-rose-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400 w-14">
                        Turn {turn.sequence_number}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{turn.learner_name}</span>
                          {isCurrentlyActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                              SPEAKING
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {turn.session_name || selectedSession.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {durText}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          turn.status === 'SPEAKING'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {turn.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
