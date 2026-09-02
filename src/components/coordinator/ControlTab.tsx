import React, { useState, useEffect } from 'react';
import type { Learner } from '../../types';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Users,
  Shield,
  AlertTriangle,
  Mic
} from 'lucide-react';

interface ControlTabProps {
  learners: Learner[];
  eventName?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLivePollModal?: () => void;
}

export const ControlTab: React.FC<ControlTabProps> = ({
  learners,
  onShowToast
}) => {
  // Speech Timer State
  const initialSeconds = 120;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds); // 2 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Gavel animation state
  const [isGavelActive, setIsGavelActive] = useState(false);

  // House Status
  const [houseStatus, setHouseStatus] = useState<'IN_SESSION' | 'RECESS' | 'ADJOURNED'>('IN_SESSION');

  // Active Speaker & Speaker Queue
  const [activeSpeaker, setActiveSpeaker] = useState<Learner | null>(learners[0] || null);
  const [speakerQueue, setSpeakerQueue] = useState<Learner[]>(learners.slice(1, 4));

  // Point of Order counter
  const [pointsOfOrderCount, setPointsOfOrderCount] = useState(3);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft]);

  const handleStrikeGavel = () => {
    setIsGavelActive(true);
    setTimeout(() => setIsGavelActive(false), 800);
    onShowToast('⚖️ GAVEL STRUCK', 'Order in the House! All members requested to resume their seats.', 'info');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleNextSpeaker = () => {
    if (speakerQueue.length > 0) {
      const next = speakerQueue[0];
      setActiveSpeaker(next);
      setSpeakerQueue(prev => prev.slice(1));
      setSecondsLeft(initialSeconds);
      setIsTimerRunning(true);
      onShowToast('Next Speaker on Floor', `Recognized ${next.full_name} (${next.role || 'MLA'})`, 'success');
    } else {
      onShowToast('Queue Empty', 'Add delegates to the speech queue to continue', 'info');
    }
  };

  const handleAddToQueue = (learnerId: string) => {
    const target = learners.find(l => l.id === learnerId);
    if (!target) return;
    if (speakerQueue.some(s => s.id === target.id) || activeSpeaker?.id === target.id) {
      onShowToast('Already Queued', `${target.full_name} is already in the speaker list`, 'info');
      return;
    }
    setSpeakerQueue(prev => [...prev, target]);
    onShowToast('Added to Queue', `${target.full_name} added to speaker roster`, 'success');
  };

  const handleRaisePointOfOrder = () => {
    setPointsOfOrderCount(prev => prev + 1);
    setIsTimerRunning(false); // pause speech for point of order
    onShowToast('⚠️ Point of Order Raised', 'Floor speech paused under Assembly Rule 110', 'info');
  };

  const timerColor = secondsLeft > 30 ? 'text-emerald-500' : secondsLeft > 10 ? 'text-amber-500' : 'text-rose-500 animate-pulse';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dais & Speaker Control Header */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Live Assembly Floor & Speaker Dais Control
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Real-time floor gavel control, speech countdown timers, points of order, and speaker queue management.
          </p>
        </div>

        {/* House State Switcher */}
        <div className="flex items-center gap-2">
          <div
            className="p-1 rounded-xl border flex items-center gap-1 text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => {
                setHouseStatus('IN_SESSION');
                onShowToast('House In Session', 'Parliamentary proceedings active', 'success');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                houseStatus === 'IN_SESSION' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ● In Session
            </button>
            <button
              onClick={() => {
                setHouseStatus('RECESS');
                onShowToast('House in Recess', 'Floor proceedings paused', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                houseStatus === 'RECESS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Short Recess
            </button>
            <button
              onClick={() => {
                setHouseStatus('ADJOURNED');
                onShowToast('House Adjourned', 'Session adjourned until next sitting', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                houseStatus === 'ADJOURNED' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Adjourned
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor Grid: Speaker Dais Gavel + Speech Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Card 1: Speaker Gavel & Dais Discipline */}
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-5 flex flex-col justify-between transition-all ${
            isGavelActive ? 'ring-4 ring-amber-500/50 scale-101' : ''
          }`}
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">
                PRESIDING OFFICER DAIS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Rule 110 Parliamentary Decorum
              </span>
            </div>

            <h4 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              Hon. Speaker's Gavel & Order Command
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Click to strike the gavel to restore floor discipline, silence unparliamentary crosstalk, or enforce house decorum.
            </p>
          </div>

          <div className="py-4 text-center">
            <button
              onClick={handleStrikeGavel}
              className={`w-full py-5 rounded-2xl font-black text-base md:text-lg text-white shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-transform duration-200 active:scale-95 ${
                isGavelActive ? 'bg-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              }`}
            >
              <Volume2 className="w-7 h-7 animate-bounce" />
              <span>⚖️ STRIKE GAVEL — ORDER IN THE HOUSE!</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              onClick={handleRaisePointOfOrder}
              className="py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-amber-500/10 hover:border-amber-500 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Point of Order ({pointsOfOrderCount})</span>
            </button>

            <button
              onClick={() => onShowToast('Floor Warning Issued', 'First formal warning recorded on member speech time', 'info')}
              className="py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-rose-500/10 hover:border-rose-500 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <Shield className="w-4 h-4 text-rose-500" />
              <span>Issue Decorum Warning</span>
            </button>
          </div>
        </div>

        {/* Card 2: Speech Countdown Timer */}
        <div
          className="rounded-2xl p-6 border shadow-sm space-y-5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--text-muted)' }}>
              SPEECH DURATION TIMER
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {isTimerRunning ? 'Timer Active' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Big Digital Clock Display */}
          <div className="text-center py-2">
            <span className={`font-mono text-5xl md:text-6xl font-black tracking-tighter ${timerColor}`}>
              {formatTimer(secondsLeft)}
            </span>
            <span className="block text-xs mt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Allocated Time: {Math.round(initialSeconds / 60)} min per delegate intervention
            </span>
          </div>

          {/* Timer Controls Row */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1 cursor-pointer col-span-2"
              style={{ backgroundColor: isTimerRunning ? 'var(--amber)' : 'var(--accent)' }}
            >
              {isTimerRunning ? <><Pause className="w-4 h-4" /> Pause Timer</> : <><Play className="w-4 h-4" /> Start Speech</>}
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setSecondsLeft(initialSeconds);
              }}
              className="py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>

            <button
              onClick={() => setSecondsLeft(prev => prev + 30)}
              className="py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 cursor-pointer hover:bg-emerald-500 hover:text-white"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              title="Add 30 Seconds"
            >
              +30s
            </button>
          </div>
        </div>

      </div>

      {/* Active Speaker on Floor & Next Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Active Speaker Card */}
        <div
          className="lg:col-span-1 rounded-2xl p-5 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" /> RECOGNIZED ON FLOOR
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Active Floor Time
            </span>
          </div>

          {activeSpeaker ? (
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}
            >
              <div>
                <h4 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  {activeSpeaker.full_name}
                </h4>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {activeSpeaker.role || 'Member of Assembly'}
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Party & Bench:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {activeSpeaker.party_name} ({activeSpeaker.bench || 'Ruling'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>TN Constituency:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    #{activeSpeaker.constituency_number || '—'} {activeSpeaker.constituency_name}
                  </strong>
                </div>
              </div>

              <button
                onClick={handleNextSpeaker}
                className="w-full py-2 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Conclude Speech & Call Next <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400">No active speaker recognized on floor.</p>
          )}
        </div>

        {/* Speaker Queue */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-4 h-4 text-amber-500" /> Upcoming Floor Speaker Queue ({speakerQueue.length})
            </h4>

            {/* Quick Add Delegate to Queue */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddToQueue(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-2.5 py-1 rounded-xl border text-xs font-semibold focus:outline-none"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">+ Add Delegate to Queue...</option>
                {learners.map(l => (
                  <option key={l.id} value={l.id}>{l.full_name} ({l.party_name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {speakerQueue.length === 0 ? (
              <div className="py-8 text-center rounded-xl border italic text-xs" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                Speaker queue is currently empty. Select any delegate from the dropdown above to queue them for intervention.
              </div>
            ) : (
              speakerQueue.map((queued, idx) => (
                <div
                  key={queued.id}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="block text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {queued.full_name}
                      </strong>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {queued.party_name} • #{queued.constituency_number || 'MLA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveSpeaker(queued);
                        setSpeakerQueue(prev => prev.filter(s => s.id !== queued.id));
                        setSecondsLeft(initialSeconds);
                        setIsTimerRunning(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      Recognize Now
                    </button>
                    <button
                      onClick={() => setSpeakerQueue(prev => prev.filter(s => s.id !== queued.id))}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
