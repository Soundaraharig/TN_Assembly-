import React, { useState, useEffect } from 'react';
import type { CollegeEvent, AgendaItem, Election, LiveFlashVote, Learner } from '../../types';
import { Monitor, Copy, Check, ExternalLink, Volume2, VolumeX, Maximize2, Minimize2, Radio, Sparkles, Clock } from 'lucide-react';

interface ProjectorTabProps {
  currentEvent?: CollegeEvent | null;
  agenda?: AgendaItem[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  learners?: Learner[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProjectorTab: React.FC<ProjectorTabProps> = ({
  currentEvent,
  agenda = [],
  elections = [],
  flashVotes = [],
  learners = [],
  onShowToast
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const projectorUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?projector=true`
    : 'https://tnassembly.vercel.app/?projector=true';

  // Current Agenda Item
  const currentAgenda = agenda.find(a => a.is_current) || agenda[0] || {
    title: 'Speaker Election',
    description: 'House Speaker Candidacy & Floor Division Voting',
    day: 'Day 1',
    time: '10:05 AM',
    speaker_role: 'SPEAKER ELECTION'
  };

  // Active Live Election
  const activeElection = elections.find(e => e.status === 'Live');
  // Active Flash Vote
  const activeFlashVote = flashVotes.find(f => f.status === 'ACTIVE');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectorUrl);
    setCopiedLink(true);
    onShowToast('Projector Link Copied', 'Share this URL on your projection system computer', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunchFullScreen = () => {
    const el = document.getElementById('projector-live-display');
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      } else {
        el.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      window.open(projectorUrl, '_blank', 'width=1280,height=720');
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
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-6 h-6 text-amber-500" />
            <span>Auditorium Projector & Hall Display</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Share the live projector URL to auditorium screens or launch full-screen stage presentation view.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Display Link'}</span>
          </button>

          <button
            onClick={handleLaunchFullScreen}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Projector View</span>
          </button>
        </div>
      </div>

      {/* Shareable Link Banner Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Projection System Shareable URL
          </label>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>{projectorUrl}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Open this URL on any projector/TV connected laptop to display live session titles, timer countdowns, and election results.
          </p>
        </div>

        <a
          href={projectorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Window</span>
        </a>
      </div>

      {/* LIVE PROJECTOR DISPLAY PREVIEW (Matching 5th Screenshot) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Auditorium Screen Output
          </h3>
          <span className="text-xs text-slate-500">16:9 Stage Aspect Display</span>
        </div>

        <div
          id="projector-live-display"
          className="relative min-h-[460px] md:min-h-[540px] rounded-3xl bg-[#090d16] text-white overflow-hidden shadow-2xl flex flex-col justify-between p-6 md:p-10 border border-slate-800"
        >
          {/* Top Indian Tricolor Header Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

          {/* Screen Top Header Bar */}
          <div className="flex items-center justify-between pt-2 border-b border-slate-800/80 pb-4">
            <div className="space-y-0.5">
              <h4 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-100">
                {currentEvent ? currentEvent.college_name : 'Erode Demo Account'}
              </h4>
              <p className="text-xs font-medium text-slate-400">
                {currentEvent ? `${currentEvent.chapter} | Tamil Nadu Youth Legislative Assembly` : 'Erode | Young Indians Parliament'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                DAY 1 LIVE
              </span>
            </div>
          </div>

          {/* Screen Main Center Content */}
          <div className="my-auto text-center space-y-6 py-12">
            
            {activeFlashVote ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block">
                  LIVE FLOOR DIVISION • {activeFlashVote.motion_type}
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white max-w-3xl mx-auto leading-tight tracking-tight">
                  {activeFlashVote.question}
                </h1>
                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="bg-emerald-950/60 border border-emerald-500/40 px-6 py-3 rounded-2xl text-center">
                    <span className="text-xs uppercase text-emerald-400 font-bold block">AYE</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote.ayes_count || 0}</span>
                  </div>
                  <div className="bg-rose-950/60 border border-rose-500/40 px-6 py-3 rounded-2xl text-center">
                    <span className="text-xs uppercase text-rose-400 font-bold block">NO</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote.noes_count || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl text-center">
                    <span className="text-xs uppercase text-slate-400 font-bold block">ABSTAIN</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote.abstain_count || 0}</span>
                  </div>
                </div>
              </div>
            ) : activeElection ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block">
                  PARLIAMENTARY ELECTION
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                  {activeElection.title}
                </h1>
                <p className="text-base text-slate-300">
                  Ballots Cast in House: <span className="text-amber-400 font-bold">{activeElection.total_votes || 0} / {learners.length || 117}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 tracking-wider">
                  {currentAgenda.speaker_role || 'SPEAKER ELECTION'}
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                  {currentAgenda.title}
                </h1>
                {currentAgenda.description && (
                  <p className="text-base text-slate-400 max-w-xl mx-auto">
                    {currentAgenda.description}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Screen Bottom Controls & Sound Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Young Indians Youth Assembly Protocol</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled);
                  onShowToast('Audio Mode', isSoundEnabled ? 'Projector sound muted' : 'Projector sound enabled', 'info');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>{isSoundEnabled ? 'Sound Enabled' : 'Tap once to enable sound'}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchFullScreen}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
