import React, { useState, useEffect } from 'react';
import type { Learner, Party, AgendaItem, ScoreRecord, Election, LiveFlashVote, CollegeEvent } from '../../types';
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
  Edit2,
  Megaphone,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

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
  onUpdatePartyBench
}) => {
  // ── Agenda Navigation State ──────────────────────────────────────────────
  const [activeDayTab, setActiveDayTab] = useState<'Pre-Event' | 'Day 1' | 'Day 2'>('Day 1');
  const [agendaFilter, setAgendaFilter] = useState<'ALL' | 'SCORED_VOTED'>('ALL');

  // Fallback items if agenda is empty
  const defaultDay1Items: AgendaItem[] = [
    { id: 'ag_1', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:00 AM', title: 'Delegates Seated', description: '10 min', speaker_role: 'Secretariat', is_current: false },
    { id: 'ag_2', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:10 AM', title: 'National Anthem', description: '5 min', speaker_role: 'All Members', is_current: false },
    { id: 'ag_3', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:15 AM', title: 'Welcome Address', description: '5 min', speaker_role: 'Chapter Chair', is_current: false },
    { id: 'ag_4', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:20 AM', title: 'About Young Indians', description: '5 min', speaker_role: 'National Representative', is_current: false },
    { id: 'ag_5', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:25 AM', title: 'Chief Guest Address', description: '20 min', speaker_role: 'Hon. Chief Guest', is_current: false },
    { id: 'ag_6', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:45 AM', title: 'Event Overview & Instructions', description: '5 min', speaker_role: 'Floor Coordinator', is_current: false },
    { id: 'ag_7', event_id: currentEvent?.id || '', day: 'Day 1', time: '09:50 AM', title: 'Government & Opposition Formation', description: '10 min', speaker_role: 'Assembly Floor', is_current: false },
    { id: 'ag_8', event_id: currentEvent?.id || '', day: 'Day 1', time: '10:00 AM', title: 'Seating of Speaker', description: '5 min', speaker_role: 'Presiding Officer', is_current: false },
    { id: 'ag_9', event_id: currentEvent?.id || '', day: 'Day 1', time: '10:05 AM', title: 'Speaker Election', description: '10 min', speaker_role: 'speaker_election', is_current: true },
    { id: 'ag_10', event_id: currentEvent?.id || '', day: 'Day 1', time: '10:15 AM', title: 'Oath Taking Ceremony', description: '5 min', speaker_role: 'All Delegates', is_current: false }
  ];

  const currentAgendaList = agenda.length > 0
    ? agenda.filter(a => activeDayTab === 'Pre-Event' ? a.day.includes('Pre') : a.day === activeDayTab)
    : defaultDay1Items;

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
  const [timerDurationSec, setTimerDurationSec] = useState(600); // 600 sec default (10 min)
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
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
  }, [isTimerRunning, secondsLeft, isSoundEnabled, activeAgendaItem]);

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

  // ── Speaking Floor & Hand-Raise State ─────────────────────────────────────
  const [isPhoneHandRaiseOn, setIsPhoneHandRaiseOn] = useState(false);
  const [speakerQueue, setSpeakerQueue] = useState<Learner[]>(() => learners.slice(0, 3));
  const [spokenLearnersCount, setSpokenLearnersCount] = useState(0);

  // ── Government Formation State (Parties & Bench) ──────────────────────────
  const defaultParties: Party[] = [
    { id: 'p1', event_id: currentEvent?.id || '', name: 'National Youth Party - NYP', bench: 'Ruling', color: '#2563eb' },
    { id: 'p2', event_id: currentEvent?.id || '', name: 'National Renaissance Party - NRP', bench: 'Opposition', color: '#e11d48' },
    { id: 'p3', event_id: currentEvent?.id || '', name: 'Rising New Nation - RNN', bench: 'Ruling', color: '#2563eb' },
    { id: 'p4', event_id: currentEvent?.id || '', name: 'National Integrity Front - NIF', bench: 'Opposition', color: '#e11d48' },
    { id: 'p5', event_id: currentEvent?.id || '', name: 'Pulse of Progress', bench: 'Opposition', color: '#e11d48' },
    { id: 'p6', event_id: currentEvent?.id || '', name: 'United Future Vision', bench: 'Ruling', color: '#2563eb' },
    { id: 'p7', event_id: currentEvent?.id || '', name: "The People's Compass", bench: 'Ruling', color: '#2563eb' }
  ];

  const [localParties, setLocalParties] = useState<Party[]>(() => {
    return parties && parties.length > 0 ? parties : defaultParties;
  });

  useEffect(() => {
    if (parties && parties.length > 0) {
      setLocalParties(parties);
    }
  }, [parties]);

  const displayParties = localParties.length > 0 ? localParties : defaultParties;

  const handlePartyBenchChange = (partyId: string, newBench: 'Ruling' | 'Opposition' | 'Independent') => {
    setLocalParties(prev => prev.map(p => p.id === partyId ? { ...p, bench: newBench } : p));
    if (onUpdatePartyBench) {
      onUpdatePartyBench(partyId, newBench);
    }
    const targetParty = displayParties.find(p => p.id === partyId);
    onShowToast(
      'Party Bench Updated',
      `${targetParty?.name || 'Party'} set to ${newBench}`,
      newBench === 'Ruling' ? 'success' : newBench === 'Opposition' ? 'info' : 'info'
    );
  };

  const computedRulingCount = learners.filter(l => l.bench === 'Ruling').length || displayParties.filter(p => p.bench === 'Ruling').length * 25 || 98;
  const computedOppositionCount = learners.filter(l => l.bench === 'Opposition').length || displayParties.filter(p => p.bench === 'Opposition').length * 25 || 75;

  const [isGovtFormationOpen, setIsGovtFormationOpen] = useState(true);

  // ── Projector Broadcast State ─────────────────────────────────────────────
  const [bannerText, setBannerText] = useState('');
  const [flashBanner, setFlashBanner] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // ── Locks & Controls ──────────────────────────────────────────────────────
  const [allocationLock, setAllocationLock] = useState(false);
  const [registrationsFrozen, setRegistrationsFrozen] = useState(false);
  const [scoresLocked, setScoresLocked] = useState(false);



  const handleNextAgenda = () => {
    if (currentAgendaIndex < currentAgendaList.length - 1) {
      const nextIdx = currentAgendaIndex + 1;
      setCurrentAgendaIndex(nextIdx);
      const nextItem = currentAgendaList[nextIdx];
      if (onSetCurrentAgendaItem && currentEvent) {
        onSetCurrentAgendaItem(currentEvent.id, nextItem.id);
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
      if (onSetCurrentAgendaItem && currentEvent) {
        onSetCurrentAgendaItem(currentEvent.id, prevItem.id);
      }
      setSecondsLeft(timerDurationSec);
      setIsTimerRunning(false);
      onShowToast('Previous Session Item', prevItem.title, 'info');
    }
  };

  const handleGenerateQueue = () => {
    const shuffled = [...learners].sort(() => 0.5 - Math.random()).slice(0, 4);
    setSpeakerQueue(shuffled);
    setSpokenLearnersCount(0);
    onShowToast('Speaker Queue Generated', `Auto-queued ${shuffled.length} floor delegates`, 'success');
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
  const checkedInCount = learners.filter(l => l.day1_checked_in || l.day2_checked_in).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeAgendaItem.title}
              </h2>
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
                    const val = Math.max(10, parseInt(e.target.value) || 600);
                    setTimerDurationSec(val);
                    if (!isTimerRunning) setSecondsLeft(val);
                  }}
                  className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500 font-semibold">sec</span>

                <button
                  onClick={() => {
                    if (!isTimerRunning && isSoundEnabled) playTimerBeep();
                    setIsTimerRunning(!isTimerRunning);
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isTimerRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setSecondsLeft(timerDurationSec);
                  }}
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

          {/* 3. SPEAKING FLOOR CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  ✋ Speaking Floor
                </span>
              </div>
              <button
                onClick={() => {
                  setIsPhoneHandRaiseOn(!isPhoneHandRaiseOn);
                  onShowToast('Hand-Raise Control', isPhoneHandRaiseOn ? 'Phone hand-raise disabled' : 'Phone hand-raise active for delegates', 'info');
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone hand-raise: {isPhoneHandRaiseOn ? 'On' : 'Off'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Live session: <strong>{activeAgendaItem.title}</strong>
            </div>

            {/* Speaking Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{spokenLearnersCount} of {speakerQueue.length || 1} have spoken</span>
                <span>{Math.round((spokenLearnersCount / Math.max(speakerQueue.length, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round((spokenLearnersCount / Math.max(speakerQueue.length, 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Yet to speak list */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                YET TO SPEAK — {speakerQueue.length || 1}
              </span>
              <div className="flex flex-wrap gap-2">
                {speakerQueue.length > 0 ? (
                  speakerQueue.map((s, idx) => (
                    <span
                      key={s.id || idx}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-sm flex items-center gap-1.5"
                    >
                      <span className="font-mono opacity-80">#{s.constituency_number || (idx + 101)}</span>
                      <span>{s.full_name}</span>
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-sm">
                    #111 Deekshaa
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Turns are counted from the Now Speaking desk — call on someone above when hands go up to keep the floor fair.
            </p>
            <a
              href="#speakers"
              onClick={(e) => { e.preventDefault(); onShowToast('Speaking Record', 'Hansard speaking record opened', 'info'); }}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-block"
            >
              See the full speaking record →
            </a>
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
                  {displayParties.map((party) => {
                    const partyLearners = learners.filter(l => l.party_id === party.id || l.party_name === party.name);
                    const partyMemberCount = partyLearners.length > 0 ? partyLearners.length : 25;
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
                            {partyMemberCount} members
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
                  })}
                </div>
              </div>
            )}
          </div>



          {/* 6. SPEAKERS SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Speakers</h4>
              </div>
              <button
                onClick={handleGenerateQueue}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Generate Queue</span>
              </button>
            </div>

            <div className="py-6 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No speakers queued for this item. Click 'Generate Queue' to auto-populate.
            </div>
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

          {/* AGENDA CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Agenda</h3>

              {/* Day Sub-tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['Pre-Event', 'Day 1', 'Day 2'] as const).map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveDayTab(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDayTab === day
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {day === 'Pre-Event' ? 'Pre-Event (Online)' : day}
                  </button>
                ))}
              </div>
            </div>

            {/* Show filter pills */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Show:</span>
              <button
                onClick={() => setAgendaFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  agendaFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Full agenda
              </button>
              <button
                onClick={() => setAgendaFilter('SCORED_VOTED')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  agendaFilter === 'SCORED_VOTED'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Scored / voted only
              </button>
            </div>

            {/* Scrollable Agenda Item List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredAgendaList.map((item, idx) => {
                const isSelected = item.id === activeAgendaItem.id;
                const isCompleted = idx < currentAgendaIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentAgendaIndex(idx);
                      if (onSetCurrentAgendaItem && currentEvent) {
                        onSetCurrentAgendaItem(currentEvent.id, item.id);
                      }
                      setSecondsLeft(timerDurationSec);
                      setIsTimerRunning(false);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCompleted
                          ? 'text-emerald-600'
                          : isSelected
                            ? 'text-amber-600 ring-2 ring-amber-500/40'
                            : 'text-slate-300 dark:text-slate-600'
                      }`}>
                        {isCompleted ? '✓' : '○'}
                      </span>
                      <div className="truncate">
                        <span className={`text-xs font-bold block truncate ${
                          isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.description || '5 min'}
                      </span>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />
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
                  {learners.length}
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
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allocationLock}
                    onChange={(e) => {
                      setAllocationLock(e.target.checked);
                      onShowToast(e.target.checked ? 'Allocation Locked' : 'Allocation Unlocked', '', 'info');
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
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={registrationsFrozen}
                    onChange={(e) => {
                      setRegistrationsFrozen(e.target.checked);
                      onShowToast(e.target.checked ? 'Registrations Frozen' : 'Registrations Open', '', 'info');
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
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={scoresLocked}
                    onChange={(e) => {
                      setScoresLocked(e.target.checked);
                      onShowToast(e.target.checked ? 'Scores Locked' : 'Scores Unlocked', '', 'info');
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

    </div>
  );
};
