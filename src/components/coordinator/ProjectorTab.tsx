import React, { useState, useEffect } from 'react';
import type { CollegeEvent, AgendaItem, Election, LiveFlashVote, Learner } from '../../types';
import {
  Copy, Check, ExternalLink, Maximize2, Minimize2,
  Radio, Sparkles, Clock, Send, Eye, Bell, Layers, Tv, Trophy
} from 'lucide-react';

import { getEventSlug } from '../../utils/slug';
import { StandaloneProjectorDisplay } from '../common/StandaloneProjectorDisplay';
import { storageService } from '../../services/storageService';
import type { ProjectorStudioSettings } from '../../types';
export type { ProjectorStudioSettings };

const SETTINGS_KEY = 'tn_assembly_projector_studio_v1';

export function getProjectorSettings(eventId?: string): ProjectorStudioSettings {
  return storageService.getProjectorSettings(eventId);
}

export function saveProjectorSettings(settings: ProjectorStudioSettings, eventId?: string) {
  if (eventId) {
    storageService.saveProjectorSettings(eventId, settings);
  } else {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save projector settings:', e);
    }
  }
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'studio' | 'presentation'>('studio');

  // Projector Studio Controls State
  const [settings, setSettings] = useState<ProjectorStudioSettings>(() => getProjectorSettings(currentEvent?.id));
  const [inputTicker, setInputTicker] = useState(settings.tickerMessage);

  useEffect(() => {
    if (currentEvent?.id) {
      const s = getProjectorSettings(currentEvent.id);
      setSettings(s);
      setInputTicker(s.tickerMessage);
    }
  }, [currentEvent?.id]);

  // Sync settings across components
  const updateSettings = (newSettings: Partial<ProjectorStudioSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveProjectorSettings(updated, currentEvent?.id);
  };

  // Sound Chime Generator
  const playSpeakerBellChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      if (currentEvent?.id) {
        storageService.triggerSpeakerBell(currentEvent.id);
      }
      onShowToast('Speaker Bell Sounded', 'Audio cue transmitted to live auditorium stage & projector', 'info');
    } catch {
      if (currentEvent?.id) {
        storageService.triggerSpeakerBell(currentEvent.id);
      }
      onShowToast('Audio Cue', 'Gavel chime sound triggered', 'info');
    }
  };

  // Public unauthenticated URL for projection screen (auditorium TV/Projector)
  const eventSlug = currentEvent ? getEventSlug(currentEvent) : 'jkkncet-tn-assembly-2026';
  const projectorUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventSlug}/display`
    : `https://tnassembly.vercel.app/events/${eventSlug}/display`;

  // Selected or active agenda item
  const selectedAgenda = agenda.find(a => a.id === settings.selectedAgendaId) || agenda.find(a => a.is_current) || agenda[0] || {
    id: 'default',
    title: 'Speaker Election & Floor Debate',
    description: 'Youth Legislative Assembly Floor Proceedings',
    day: 'Day 1',
    time: '10:00 AM',
    speaker_role: 'SPEAKER ELECTION'
  };

  // Active Live Election
  const activeElection = elections.find(e => e.status === 'Live');
  // Active Flash Vote
  const activeFlashVote = flashVotes.find(f => f.status === 'ACTIVE');

  // Revealed Election Result (ONLY when explicitly requested by settings.revealedElectionId or displayScene === 'election_result')
  const revealedElection = settings.revealedElectionId
    ? elections.find(e => e.id === settings.revealedElectionId)
    : elections.find(e => e.status === 'Closed' || (e.winner && e.winner.trim().length > 0)) || elections[0];

  const sortedCandidates = [...(revealedElection?.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const winnerCandidate = sortedCandidates.length > 0
    ? (sortedCandidates.find(c =>
        (revealedElection?.winner && (c.name.toLowerCase() === revealedElection.winner.toLowerCase() || c.id === revealedElection.winner))
      ) || sortedCandidates[0])
    : null;



  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectorUrl);
    setCopiedLink(true);
    onShowToast('Display Link Copied', 'Share this unauthenticated link on auditorium screen computers (No login required)', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchFullScreen = () => {
    const el = document.getElementById('studio-live-monitor-preview');
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      } else {
        el.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    }
  };

  const handlePushTicker = () => {
    updateSettings({
      tickerMessage: inputTicker,
      isTickerActive: true
    });
    onShowToast('Ticker Pushed Live', 'Updated live ticker banner on auditorium projection displays', 'success');
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Studio Mode Switcher Bar */}
      <div 
        className="flex flex-col sm:flex-row items-center justify-between p-2.5 rounded-2xl shadow-sm gap-3 border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('studio')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeViewMode === 'studio'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>🎛️ Studio Edit Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('presentation')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeViewMode === 'presentation'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>📺 Stage Presentation Screen</span>
          </button>
        </div>

        <button
          onClick={() => window.open(projectorUrl, '_blank')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto justify-center"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Launch Unauthenticated Window ↗</span>
        </button>
      </div>

      {activeViewMode === 'presentation' ? (
        <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 min-h-[650px] relative">
          <StandaloneProjectorDisplay
            currentEvent={currentEvent}
            agenda={agenda}
            elections={elections}
            flashVotes={flashVotes}
            learners={learners}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Tv className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Projector Studio & Live Stage Controller</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  STUDIO ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Edit stage output, reveal animated election results, push notice banners, and control auditorium displays in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Live Projection Link'}</span>
          </button>

          <button
            onClick={() => window.open(projectorUrl, '_blank')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Unauthenticated Stage Screen</span>
          </button>
        </div>
      </div>

      {/* Public Projection Link Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Public Auditorium Projection Display Link (No Login Needed)</span>
          </div>
          <div className="font-mono text-sm md:text-base font-extrabold text-white bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 inline-block select-all">
            {projectorUrl}
          </div>
          <p className="text-xs text-slate-400">
            Open this URL on any projector/TV connected computer. It updates automatically when you change settings below.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={projectorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Launch Display</span>
          </a>
        </div>
      </div>

      {/* VIDEO EDITOR STYLE MINI LIVE PREVIEW MONITOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Stage Studio Canvas Monitor (16:9 Preview)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono">1080p Stage Output</span>
            <span>•</span>
            <span className="font-mono">60 FPS</span>
          </div>
        </div>

        {/* 16:9 Canvas Box */}
        <div
          id="studio-live-monitor-preview"
          className="relative min-h-[420px] md:min-h-[500px] rounded-3xl bg-[#080c15] text-white overflow-hidden shadow-2xl flex flex-col justify-between p-6 md:p-10 border-4 border-slate-900 group"
        >
          {/* Top Tricolor Header Banner */}
          {settings.showTricolorHeader && (
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-600 z-20" />
          )}

          {/* Monitor Overlay Status Header */}
          <div className="flex items-center justify-between pt-2 border-b border-slate-800/80 pb-4 z-10">
            <div className="space-y-0.5">
              <h4 className="text-lg md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{currentEvent ? currentEvent.college_name : (settings.customWelcomeTitle || 'TN Legislative Assembly')}</span>
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {currentEvent ? `${currentEvent.chapter} | ${currentEvent.level}` : 'Legislative Assembly Protocol'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                LIVE ON STAGE
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                SCENE: {settings.displayScene.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Monitor Center Content */}
          <div className="my-auto text-center space-y-6 py-8 z-10">
            
            {settings.displayScene === 'welcome' ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block">
                  WELCOME DELEGATES & DIGNITARIES
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                  {currentEvent ? currentEvent.college_name : 'TN Legislative Assembly'}
                </h1>
                <p className="text-sm md:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
                  Welcome to the Legislative Assembly. Session commencing shortly.
                </p>
              </div>
            ) : settings.displayScene === 'election_result' ? (
              <div className="space-y-4 animate-result-reveal max-w-3xl mx-auto">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-400/30 inline-flex items-center gap-1.5 shadow-lg">
                  <Trophy className="w-4 h-4 text-amber-400 animate-bounce" /> OFFICIAL ELECTION RESULT DECLARED
                </span>
                
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  {revealedElection?.title || 'Speaker Election 2026'}
                </h1>

                {winnerCandidate ? (
                  <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-400/60 shadow-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">ELECTED WINNER</span>
                    <h2 className="text-2xl md:text-3xl font-black text-amber-300">{winnerCandidate.name}</h2>
                    <p className="text-xs text-slate-300 font-semibold">{winnerCandidate.party} • {winnerCandidate.bench} Bench ({winnerCandidate.votes} Votes)</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No winner declared yet.</p>
                )}
              </div>
            ) : settings.displayScene === 'flash_vote' || (settings.displayScene === 'auto' && activeFlashVote) ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block">
                  LIVE FLOOR DIVISION • {activeFlashVote?.motion_type || 'PROCEDURAL MOTION'}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white max-w-3xl mx-auto leading-tight">
                  {activeFlashVote?.question || 'Should the Youth Bill 2026 pass?'}
                </h1>
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="bg-emerald-950/80 border border-emerald-500/40 px-6 py-3 rounded-2xl text-center min-w-[100px]">
                    <span className="text-[11px] uppercase text-emerald-400 font-extrabold block">AYE</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote?.ayes_count || 0}</span>
                  </div>
                  <div className="bg-rose-950/80 border border-rose-500/40 px-6 py-3 rounded-2xl text-center min-w-[100px]">
                    <span className="text-[11px] uppercase text-rose-400 font-extrabold block">NO</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote?.noes_count || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl text-center min-w-[100px]">
                    <span className="text-[11px] uppercase text-slate-400 font-extrabold block">ABSTAIN</span>
                    <span className="text-2xl md:text-3xl font-mono font-black text-white">{activeFlashVote?.abstain_count || 0}</span>
                  </div>
                </div>
              </div>
            ) : settings.displayScene === 'election' || (settings.displayScene === 'auto' && activeElection) ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block">
                  PARLIAMENTARY ELECTION BALLOT LIVE
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {activeElection?.title || 'House Speaker Election 2026'}
                </h1>
                <p className="text-sm md:text-base text-slate-300">
                  Total House Ballots Cast: <span className="text-amber-400 font-extrabold font-mono text-xl">{activeElection?.voted_delegate_ids?.length || activeElection?.total_votes || 0} / {learners.length || 117}</span>
                </p>
              </div>
            ) : settings.displayScene === 'break' ? (
              <div className="space-y-4 animate-slide-up">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/30 inline-block">
                  HOUSE RECESS / SESSION ADJOURNED
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  Session Adjourned for Recess
                </h1>
                <p className="text-sm text-slate-400">
                  Delegates please assemble back in the auditorium chamber shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up max-w-3xl mx-auto">
                {settings.showSpeakerBadge && (
                  <span className="text-xs md:text-sm font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30 inline-block">
                    {selectedAgenda.speaker_role || 'CURRENT LEGISLATIVE SESSION'}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  {selectedAgenda.title}
                </h1>
                {selectedAgenda.description && (
                  <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
                    {selectedAgenda.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="px-3.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {selectedAgenda.time} {selectedAgenda.duration_minutes ? `(${selectedAgenda.duration_minutes} min)` : ''}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Live Marquee Ticker Overlay Banner */}
          {settings.isTickerActive && settings.tickerMessage && (
            <div className="my-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs md:text-sm flex items-center gap-3 overflow-hidden shadow-lg z-20">
              <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] uppercase tracking-wider font-extrabold shrink-0">
                NOTICE
              </span>
              <div className="whitespace-nowrap animate-marquee font-bold tracking-wide">
                {settings.tickerMessage}
              </div>
            </div>
          )}

          {/* Monitor Footer Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 z-10">
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Tamil Nadu Legislative Protocol Standard</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playSpeakerBellChime}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Ring Speaker Bell Chime"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ring Bell</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchFullScreen}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Monitor'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DOWNSIDE STUDIO EDITING & MODIFICATION OPTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

        {/* 1. SCENE MODES & STUDIO DISPLAY MODES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Stage Broadcast Scenes</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Studio Preset</span>
          </div>

          <div className="space-y-2">
            {[
              { id: 'auto', label: 'Auto Detect (Default)', desc: 'Smart switch between live votes & agenda' },
              { id: 'welcome', label: 'Welcome / Standby Screen', desc: 'Displays college logo & welcome banner' },
              { id: 'agenda', label: 'Legislative Agenda Session', desc: 'Broadcasts active agenda item title & role' },
              { id: 'flash_vote', label: 'Live Floor Division', desc: 'Shows real-time motion AYE/NO counters' },
              { id: 'election', label: 'Parliamentary Elections (Live)', desc: 'Shows live election ballot & turnout' },
              { id: 'election_result', label: 'Election Result Reveal (Animated)', desc: 'Animated winner declaration & candidate breakdown' },
              { id: 'break', label: 'House Recess / Adjournment', desc: 'Displays break notice & resume time' }
            ].map(scene => (
              <button
                key={scene.id}
                type="button"
                onClick={() => updateSettings({ displayScene: scene.id as any })}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                  settings.displayScene === scene.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">{scene.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{scene.desc}</div>
                </div>
                {settings.displayScene === scene.id && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. LIVE TICKER & ANNOUNCEMENT BANNER EDITOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Live Ticker Banner Editor</span>
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isTickerActive}
                onChange={e => updateSettings({ isTickerActive: e.target.checked })}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="font-bold">Active</span>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Broadcast Announcement Text
              </label>
              <textarea
                value={inputTicker}
                onChange={e => setInputTicker(e.target.value)}
                rows={3}
                placeholder="Type urgent live notice or announcement here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Quick Notice Presets */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Quick Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '📢 Order in the House - Floor Debate in Session',
                  '⏱️ Voting Commencing in 2 Minutes - Assemble',
                  '☕ House Adjourned for 15-Minute Recess',
                  '🏛️ Speaker Presiding over Resolution Vote'
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputTicker(txt);
                      updateSettings({ tickerMessage: txt, isTickerActive: true });
                      onShowToast('Preset Loaded', 'Pushed preset notice to stage ticker', 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    {txt.slice(0, 24)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePushTicker}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>PUSH TO LIVE DISPLAY</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. ACTIVE ELECTION & SESSION SELECTOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Election & Session Selector</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stage Target</span>
          </div>

          <div className="space-y-4">
            {/* Election Result Revealer Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Select Election to Reveal / Project
              </label>
              <select
                value={settings.revealedElectionId || (elections[0]?.id || '')}
                onChange={e => {
                  updateSettings({
                    revealedElectionId: e.target.value,
                    displayScene: 'election_result'
                  });
                  onShowToast('Projected Result', 'Broadcasting animated election result to stage display', 'success');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {elections.map(elec => (
                  <option key={elec.id} value={elec.id}>
                    {elec.title} ({elec.status || 'Upcoming'} - {elec.winner ? `Winner: ${elec.winner}` : `${elec.candidates?.length || 0} candidates`})
                  </option>
                ))}
              </select>
            </div>

            {/* Agenda Item Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Select Active Broadcast Session
              </label>
              <select
                value={settings.selectedAgendaId || (selectedAgenda.id)}
                onChange={e => {
                  updateSettings({ selectedAgendaId: e.target.value, displayScene: 'agenda' });
                  onShowToast('Stage Session Switch', 'Updated stage presentation session item', 'info');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {agenda.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.day} - {item.time}: {item.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sound Board Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={playSpeakerBellChime}
                className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Trigger House Gavel / Speaker Bell</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )}

    </div>
  );
};
