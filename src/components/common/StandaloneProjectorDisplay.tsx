import React, { useState, useEffect } from 'react';
import type { CollegeEvent, AgendaItem, Election, LiveFlashVote, Learner } from '../../types';
import { Radio, Volume2, VolumeX, Maximize2, Minimize2, Clock, Sparkles, Trophy, Crown, Shield } from 'lucide-react';
import type { ProjectorStudioSettings } from '../../types';
import { storageService } from '../../services/storageService';
import { extractEventFromUrl } from '../../utils/slug';

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
  // Default sound enabled to TRUE as requested
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Storage State
  const [currentEvent, setCurrentEvent] = useState<CollegeEvent | null>(initialEvent || null);
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda);
  const [elections, setElections] = useState<Election[]>(initialElections);
  const [flashVotes, setFlashVotes] = useState<LiveFlashVote[]>(initialFlashVotes);
  const [learners, setLearners] = useState<Learner[]>(initialLearners);

  // Read real-time studio settings pushed from ProjectorTab / ElectionsTab
  const [settings, setSettings] = useState<ProjectorStudioSettings>(() => storageService.getProjectorSettings(initialEvent?.id));
  const [lastBellTime, setLastBellTime] = useState<number>(0);

  const playBellSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  // Sync state from storage & events
  useEffect(() => {
    const onBell = () => {
      if (isSoundEnabled) {
        playBellSound();
      }
    };
    window.addEventListener('tn_assembly_speaker_bell', onBell);

    const syncState = () => {
      const evs = storageService.getEvents();
      const urlEv = extractEventFromUrl(evs);
      const ev = urlEv || (currentEvent?.id ? evs.find(e => e.id === currentEvent.id) : null) || initialEvent || evs[0];
      if (ev) {
        setCurrentEvent(ev);
        setSettings(storageService.getProjectorSettings(ev.id));
        setAgenda(storageService.getAgenda(ev.id));
        setElections(storageService.getElections(ev.id));
        setFlashVotes(storageService.getFlashVotes(ev.id));
        setLearners(storageService.getLearners(ev.id));

        const sc = (ev.social_coverage || {}) as Record<string, any>;
        if (sc.last_bell_ring && sc.last_bell_ring > lastBellTime) {
          setLastBellTime(sc.last_bell_ring);
          if (lastBellTime > 0 && isSoundEnabled) {
            playBellSound();
          }
        }
      }
    };

    syncState();
    window.addEventListener('storage', syncState);
    const unsubscribe = storageService.subscribe(syncState);
    const interval = setInterval(syncState, 1000);

    return () => {
      window.removeEventListener('storage', syncState);
      window.removeEventListener('tn_assembly_speaker_bell', onBell);
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentEvent?.id, initialEvent?.id, isSoundEnabled, lastBellTime]);

  // Selected or active agenda item
  const selectedAgenda = agenda.find(a => a.id === settings.selectedAgendaId) || agenda.find(a => a.is_current) || agenda[0] || {
    title: 'Speaker Election & Floor Proceedings',
    description: 'Legislative Assembly Floor Proceedings',
    day: 'Day 1',
    time: '10:00 AM',
    speaker_role: 'SPEAKER ELECTION'
  };

  // Active Live Election or target ballot for election scene
  const activeElection = elections.find(e => e.status === 'Live');
  const targetBallotElection = settings.revealedElectionId
    ? elections.find(e => e.id === settings.revealedElectionId)
    : (activeElection || elections.find(e => e.status === 'Closed') || elections[0]);
  const isBallotClosed = targetBallotElection?.status === 'Closed';
  // Active Flash Vote
  const activeFlashVote = flashVotes.find(f => f.status === 'ACTIVE');

  // Revealed Election Result (ONLY when explicitly requested by settings.revealedElectionId or displayScene === 'election_result')
  const revealedElection = settings.revealedElectionId
    ? elections.find(e => e.id === settings.revealedElectionId)
    : elections.find(e => e.status === 'Closed' || (e.winner && e.winner.trim().length > 0)) || elections[0];

  const sortedCandidates = [...(revealedElection?.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  // Determine winner candidate accurately
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

        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-2 animate-pulse shadow-lg shadow-emerald-950/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {currentEvent?.status ? `${currentEvent.status.toUpperCase()} LIVE` : 'STAGE LIVE'}
          </span>
        </div>
      </div>

      {/* Screen Main Center Content */}
      <div className="my-auto text-center space-y-8 py-8 z-10">
        
        {/* SCENE 1: WELCOME SCREEN */}
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

        /* SCENE 2: ANIMATED ELECTION RESULT REVEAL SCREEN (Only when displayScene === 'election_result') */
        ) : settings.displayScene === 'election_result' ? (
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

                    {/* Animated Progress Bar */}
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

        /* SCENE 3: PARLIAMENTARY ELECTION VOTING STAGE */
        ) : settings.displayScene === 'election' || (settings.displayScene === 'auto' && activeElection) ? (
          <div className="flex flex-col items-center justify-center space-y-6 animate-slide-up max-w-4xl mx-auto text-center py-10 w-full">
            {isBallotClosed ? (
              <>
                <div className="px-10 py-3.5 rounded-full border-2 border-amber-500/80 bg-amber-950/40 text-amber-400 text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20">
                  <span>VOTING CLOSED</span>
                </div>
                
                <p className="text-xl md:text-3xl font-medium text-slate-300">
                  Tallying results...
                </p>
                
                <p className="text-sm md:text-lg text-slate-400 font-semibold uppercase tracking-wider">
                  {targetBallotElection?.title || 'Speaker Election'}
                </p>
              </>
            ) : (
              <>
                <div className="px-8 py-3 rounded-full border-2 border-emerald-500/80 bg-emerald-950/40 text-emerald-400 text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                  <span>• VOTING IS OPEN</span>
                </div>
                
                <p className="text-xl md:text-3xl font-medium text-slate-200">
                  Cast your vote on your phone
                </p>
                
                <p className="text-sm md:text-lg text-slate-400 font-semibold uppercase tracking-wider">
                  {targetBallotElection?.title || 'Speaker Election'}
                </p>
              </>
            )}

            {/* Turnout Stats Box */}
            <div className="mt-4 px-6 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-400 font-mono">
              House Ballots Cast: <span className="text-amber-400 font-bold">{targetBallotElection?.voted_delegate_ids?.length || targetBallotElection?.total_votes || 0}</span> / {learners.length || 117}
            </div>
          </div>

        /* SCENE 4: LIVE FLOOR DIVISION (FLASH VOTE) STAGE */
        ) : settings.displayScene === 'flash_vote' || (settings.displayScene === 'auto' && activeFlashVote) ? (
          <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
            <span className="text-sm md:text-base font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/30 inline-block shadow-lg">
              <Sparkles className="w-5 h-5 inline mr-2" /> LIVE FLOOR DIVISION • {activeFlashVote?.motion_type || 'PROCEDURAL MOTION'}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white max-w-4xl mx-auto leading-tight tracking-tight drop-shadow-lg">
              {activeFlashVote?.question || 'Should the Assembly Bill pass the House Division vote?'}
            </h1>
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
          </div>

        /* SCENE 5: HOUSE RECESS / BREAK */
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

        /* SCENE 6: DEFAULT AGENDA BROADCAST STAGE */
        ) : (
          <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
            {settings.showSpeakerBadge && (
              <span className="text-sm md:text-base font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/30 inline-block">
                {selectedAgenda.speaker_role || 'CURRENT LEGISLATIVE SESSION'}
              </span>
            )}
            
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
              {selectedAgenda.title}
            </h1>

            {selectedAgenda.description && (
              <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                {selectedAgenda.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 pt-4">
              {settings.showClock && (
                <span className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base md:text-lg font-mono font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  {selectedAgenda.time} {selectedAgenda.duration_minutes ? `(${selectedAgenda.duration_minutes} min)` : ''}
                </span>
              )}

              {selectedAgenda.category && (
                <span className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base md:text-lg font-bold text-slate-300">
                  {selectedAgenda.category}
                </span>
              )}
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

      {/* Screen Bottom Protocol & Controls Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 z-10">
        <div className="text-xs md:text-sm text-slate-500 font-mono flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>TN Legislative Assembly Stage Presentation Screen (Unauthenticated Public Link)</span>
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
