import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  Search,
  AlertCircle,
  Play,
  Square,
  LogOut,
  Moon,
  Sun,
  Clock,
  Users,
  ChevronRight,
  X,
  History,
  Volume2
} from 'lucide-react';
import type { Volunteer, Learner, CollegeEvent, ScoringSession, SpeakingTurn } from '../../types';
import { storageService } from '../../services/storageService';
import { useTheme } from '../../lib/theme';

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
  const eventId = event?.id || '';

  // Effective learners list
  const learners = useMemo(() => {
    if (propLearners && propLearners.length > 0) return propLearners;
    if (eventId) return storageService.getLearners(eventId);
    return [];
  }, [propLearners, eventId]);

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

  // Active speaking turn
  const [activeSpeakerTurn, setActiveSpeakerTurn] = useState<SpeakingTurn | null>(() => {
    return storageService.getAuthoritativeCurrentSpeaker(eventId, selectedSessionId);
  });

  // Recent speaking turns log
  const [turnsLog, setTurnsLog] = useState<SpeakingTurn[]>(() => {
    return storageService.getSpeakingTurns(eventId).slice(-15).reverse();
  });

  // Modal and Selection State
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [benchFilter, setBenchFilter] = useState<'ALL' | 'Ruling' | 'Opposition' | 'Independent'>('ALL');
  const [candidateSpeaker, setCandidateSpeaker] = useState<Learner | null>(null);
  const [isStartingTurn, setIsStartingTurn] = useState(false);
  const [isFinishingTurn, setIsFinishingTurn] = useState(false);

  // Live Speaking Timer (client memory derived, 0 database writes)
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with storageService
  const refreshFloorState = () => {
    const active = storageService.getAuthoritativeCurrentSpeaker(eventId, selectedSessionId);
    setActiveSpeakerTurn(active);
    const all = storageService.getSpeakingTurns(eventId);
    setTurnsLog(all.slice(-15).reverse());
  };

  useEffect(() => {
    refreshFloorState();
    const unsub = storageService.subscribe(refreshFloorState);

    const handleSpeakerChanged = () => {
      refreshFloorState();
    };

    window.addEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
    window.addEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
    window.addEventListener('storage', handleSpeakerChanged);

    return () => {
      unsub();
      window.removeEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
      window.removeEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
      window.removeEventListener('storage', handleSpeakerChanged);
    };
  }, [eventId, selectedSessionId]);

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

  // Filtered learners for modal
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      if (benchFilter !== 'ALL' && l.bench !== benchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const constNumStr = l.constituency_number !== undefined && l.constituency_number !== null ? String(l.constituency_number) : '';
        const constMatches = constNumStr === q || constNumStr.includes(q) || `#${constNumStr}`.includes(q);
        const nameMatches = l.full_name?.toLowerCase().includes(q);
        const constNameMatches = l.constituency_name?.toLowerCase().includes(q);
        const partyMatches = l.party_name?.toLowerCase().includes(q);
        return constMatches || nameMatches || constNameMatches || partyMatches;
      }
      return true;
    });
  }, [learners, benchFilter, searchQuery]);

  // Handle speaker selection
  const handleSelectSpeaker = async (learner: Learner) => {
    if (isStartingTurn) return;
    setIsStartingTurn(true);
    try {
      const res = await storageService.setAuthoritativeCurrentSpeaker({
        eventId,
        sessionId: selectedSession.id,
        sessionName: selectedSession.name,
        learnerId: learner.id,
        learnerName: learner.full_name,
        calledBy: volunteer?.name ? `Speaker Aid (${volunteer.name})` : 'Speaker Aid'
      });

      if (res.success && res.turn) {
        setActiveSpeakerTurn(res.turn);
        setIsSelectModalOpen(false);
        setCandidateSpeaker(null);
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
    if (isFinishingTurn || !activeSpeakerTurn) return;
    setIsFinishingTurn(true);
    try {
      const res = await storageService.endAuthoritativeCurrentSpeaker({
        eventId,
        sessionId: activeSpeakerTurn.session_id,
        turnId: activeSpeakerTurn.id
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

  // Active Speaker details
  const activeLearner = useMemo(() => {
    if (!activeSpeakerTurn) return null;
    return learners.find(l => l.id === activeSpeakerTurn.learner_id);
  }, [activeSpeakerTurn, learners]);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <header className="border-b px-6 py-3.5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                SPEAKER AID
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Floor Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {event?.college_name || 'TN Assembly 2026'} • Official: {volunteer?.name || 'Floor Volunteer'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Session Dropdown */}
          {sessions.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Session:</span>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
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
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* CURRENT SPEAKER CARD */}
        <section
          className="rounded-3xl border shadow-lg overflow-hidden transition-all"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CURRENT SPEAKER
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Session: {selectedSession.name}
            </span>
          </div>

          <div className="p-6 sm:p-8">
            {activeSpeakerTurn && activeSpeakerTurn.status === 'SPEAKING' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        🔴 NOW SPEAKING
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        Speaking Turn {activeSpeakerTurn.sequence_number}
                      </span>
                      {activeLearner?.bench && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold border"
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

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white pt-1">
                      {activeSpeakerTurn.learner_name}
                    </h2>

                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {activeLearner?.constituency_number !== undefined ? `Constituency #${activeLearner.constituency_number} — ` : ''}
                      {activeLearner?.constituency_name || 'Assembly Delegate'}
                      {activeLearner?.party_name ? ` • ${activeLearner.party_name}` : ''}
                    </p>
                  </div>

                  {/* Live Timer */}
                  <div className="flex flex-col sm:items-end justify-center">
                    <div className="px-5 py-3 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-inner flex items-center gap-3">
                      <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        <div className="font-mono text-2xl font-black tracking-widest text-white">
                          {formatDuration(elapsedSec)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="pt-4 border-t flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateSpeaker(null);
                      setSearchQuery('');
                      setIsSelectModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl font-black text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>CHANGE SPEAKER</span>
                  </button>

                  <button
                    type="button"
                    disabled={isFinishingTurn}
                    onClick={handleFinishSpeech}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl font-bold text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current text-slate-500" />
                    <span>FINISH SPEECH</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle state: No MLA speaking */
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    No MLA speaking
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    The floor is currently idle. Click below to select the delegate who has the floor.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateSpeaker(null);
                      setSearchQuery('');
                      setIsSelectModalOpen(true);
                    }}
                    className="px-8 py-4 rounded-2xl font-black text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    <span>SELECT MLA</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RECENT SPEAKING TURNS */}
        <section
          className="rounded-3xl border shadow-sm overflow-hidden"
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

          <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
            {turnsLog.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
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
                    className={`p-4 flex items-center justify-between text-xs transition ${
                      isCurrentlyActive ? 'bg-rose-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400 w-16">
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

      {/* SELECT MLA MODAL */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-in flex flex-col max-h-[85vh]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  SEARCH MLA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the MLA who is speaking now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSelectModalOpen(false);
                  setCandidateSpeaker(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Bench Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, constituency #, or constituency name..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'Ruling', 'Opposition'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBenchFilter(b)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex-1 ${
                      benchFilter === b
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Safety Confirmation Card if speaker selected */}
            {candidateSpeaker && (
              <div className="rounded-2xl p-4 border bg-amber-500/10 border-amber-500/30 space-y-3">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Confirm Speaker Transition</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Speaker</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {activeSpeakerTurn ? `${activeSpeakerTurn.learner_name} (Turn ${activeSpeakerTurn.sequence_number})` : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-black block">New Speaker</span>
                    <span className="font-black text-rose-700 dark:text-rose-300">
                      {candidateSpeaker.full_name} (#{candidateSpeaker.constituency_number ?? '?'})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCandidateSpeaker(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isStartingTurn}
                    onClick={() => handleSelectSpeaker(candidateSpeaker)}
                    className="px-4 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Speaking Turn</span>
                  </button>
                </div>
              </div>
            )}

            {/* Delegates List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1" style={{ maxHeight: '350px' }}>
              {filteredLearners.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No delegates found matching "{searchQuery}".
                </div>
              ) : (
                filteredLearners.map(learner => {
                  const isCurrent = activeSpeakerTurn?.learner_id === learner.id && activeSpeakerTurn?.status === 'SPEAKING';
                  const isCandidate = candidateSpeaker?.id === learner.id;
                  return (
                    <button
                      type="button"
                      key={learner.id}
                      data-testid={`speaker-select-${learner.id}`}
                      onClick={() => {
                        if (activeSpeakerTurn) {
                          setCandidateSpeaker(learner);
                        } else {
                          handleSelectSpeaker(learner);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isCandidate
                          ? 'border-rose-500 bg-rose-500/10'
                          : isCurrent
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                      style={{ borderColor: isCandidate ? 'var(--rose-500)' : 'var(--border-soft)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-blue-500 w-10 text-right">
                          #{learner.constituency_number ?? '?'}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{learner.full_name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                                SPEAKING
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {learner.constituency_name || 'Assembly Delegate'} • {learner.party_name || 'Independent'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
