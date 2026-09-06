import React, { useState, useEffect } from 'react';
import type { CollegeEvent, AgendaItem, Election, LiveFlashVote, Learner } from '../../types';
import { Radio, Volume2, VolumeX, Maximize2, Minimize2, Clock, Sparkles } from 'lucide-react';

interface StandaloneProjectorDisplayProps {
  currentEvent?: CollegeEvent | null;
  agenda?: AgendaItem[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  learners?: Learner[];
}

export const StandaloneProjectorDisplay: React.FC<StandaloneProjectorDisplayProps> = ({
  currentEvent,
  agenda = [],
  elections = [],
  flashVotes = [],
  learners = []
}) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Current Agenda Item
  const currentAgenda = agenda.find(a => a.is_current) || agenda.find(a => a.status === 'In Progress') || agenda[0] || {
    title: 'Welcome Address & Assembly Opening',
    description: 'Youth Legislative Assembly Floor Proceedings',
    day: 'Day 1',
    time: '09:00 AM',
    speaker_role: 'CONVENOR'
  };

  // Active Live Election
  const activeElection = elections.find(e => e.status === 'Live');
  // Active Flash Vote
  const activeFlashVote = flashVotes.find(f => f.status === 'ACTIVE');

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
    <div className="min-h-screen w-screen bg-[#090d16] text-white flex flex-col justify-between p-6 md:p-12 select-none relative overflow-hidden font-sans">
      
      {/* Top Indian Tricolor Header Banner */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-600 z-20" />

      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Screen Top Header Bar */}
      <div className="flex items-center justify-between pt-2 border-b border-slate-800/80 pb-6 z-10">
        <div className="space-y-1">
          <h4 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{currentEvent ? currentEvent.college_name : 'Tamil Nadu Youth Legislative Assembly'}</span>
          </h4>
          <p className="text-xs md:text-sm font-semibold text-slate-400">
            {currentEvent ? `${currentEvent.chapter} | ${currentEvent.level}` : 'State Legislative Assembly Domain'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-2 animate-pulse shadow-lg shadow-emerald-950/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {currentEvent?.status ? `${currentEvent.status.toUpperCase()} LIVE` : 'ASSEMBLY SESSION LIVE'}
          </span>
        </div>
      </div>

      {/* Screen Main Center Content */}
      <div className="my-auto text-center space-y-8 py-12 z-10">
        
        {activeFlashVote ? (
          <div className="space-y-6 animate-slide-up">
            <span className="text-xs md:text-base font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              <Sparkles className="w-4 h-4 inline mr-2" /> LIVE FLOOR DIVISION • {activeFlashVote.motion_type}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white max-w-4xl mx-auto leading-tight tracking-tight drop-shadow-lg">
              {activeFlashVote.question}
            </h1>
            <div className="flex items-center justify-center gap-8 pt-6">
              <div className="bg-emerald-950/80 border-2 border-emerald-500/50 px-8 py-5 rounded-3xl text-center shadow-2xl min-w-[140px]">
                <span className="text-xs md:text-sm uppercase text-emerald-400 font-extrabold block">AYE</span>
                <span className="text-4xl md:text-5xl font-mono font-black text-white">{activeFlashVote.ayes_count || 0}</span>
              </div>
              <div className="bg-rose-950/80 border-2 border-rose-500/50 px-8 py-5 rounded-3xl text-center shadow-2xl min-w-[140px]">
                <span className="text-xs md:text-sm uppercase text-rose-400 font-extrabold block">NO</span>
                <span className="text-4xl md:text-5xl font-mono font-black text-white">{activeFlashVote.noes_count || 0}</span>
              </div>
              <div className="bg-slate-900/90 border-2 border-slate-700 px-8 py-5 rounded-3xl text-center shadow-2xl min-w-[140px]">
                <span className="text-xs md:text-sm uppercase text-slate-400 font-extrabold block">ABSTAIN</span>
                <span className="text-4xl md:text-5xl font-mono font-black text-white">{activeFlashVote.abstain_count || 0}</span>
              </div>
            </div>
          </div>
        ) : activeElection ? (
          <div className="space-y-6 animate-slide-up">
            <span className="text-xs md:text-base font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              PARLIAMENTARY ELECTION IN PROGRESS
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg">
              {activeElection.title}
            </h1>
            <p className="text-lg md:text-xl text-slate-300">
              Ballots Cast in House: <span className="text-amber-400 font-extrabold font-mono text-2xl ml-2">{activeElection.total_votes || 0} / {learners.length || 117}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
            <span className="text-xs md:text-base font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/30 inline-block">
              {currentAgenda.speaker_role || 'CURRENT LEGISLATIVE SESSION'}
            </span>
            
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
              {currentAgenda.title}
            </h1>

            {currentAgenda.description && (
              <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                {currentAgenda.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 pt-4">
              <span className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm md:text-base font-mono font-bold text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                {currentAgenda.time} {currentAgenda.duration_minutes ? `(${currentAgenda.duration_minutes} min)` : ''}
              </span>

              {currentAgenda.category && (
                <span className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm md:text-base font-bold text-slate-300">
                  {currentAgenda.category}
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Screen Bottom Protocol & Controls Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 z-10">
        <div className="text-xs md:text-sm text-slate-500 font-mono flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Tamil Nadu Youth Legislative Assembly Stage Presentation Screen</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{isSoundEnabled ? 'Sound On' : 'Enable Sound'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Stage Fullscreen'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
