import React, { useState, useMemo } from 'react';
import type { Election, LiveFlashVote, Learner, FlashVoteAudience, ElectionCandidate, Nomination } from '../../types';
import {
  Vote,
  Plus,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Zap,
  Search,
  Lock,
  Play,
  RotateCcw,
  UserPlus
} from 'lucide-react';

interface ElectionsTabProps {
  elections: Election[];
  flashVotes: LiveFlashVote[];
  learners: Learner[];
  nominations?: Nomination[];
  eventId: string;
  onCastVote: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCloseElection: (electionId: string) => void;
  onSetElectionStatus?: (electionId: string, status: 'Upcoming' | 'Live' | 'Closed') => void;
  onAddCandidate?: (electionId: string, candidate: Partial<ElectionCandidate>) => void;
  onRemoveCandidate?: (electionId: string, candidateId: string) => void;
  onResetElection?: (electionId: string) => void;
  onDeleteElection?: (electionId: string) => void;
  onCreateElection: (elec: Partial<Election>) => void;
  onCreateFlashVote: (eventId: string, question: string, audience: FlashVoteAudience, motionType: LiveFlashVote['motion_type']) => void;
  onCastFlashVote: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onCloseFlashVote: (voteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_POSTS = [
  {
    title: 'Assembly Speaker Election',
    position: 'Speaker',
    type: 'SPEAKER' as const,
    electorate: 'ALL' as const,
    description: 'Whole House (Ruling + Opposition + Independent delegates)'
  },
  {
    title: 'Deputy Speaker Election',
    position: 'Deputy Speaker',
    type: 'DEPUTY_SPEAKER' as const,
    electorate: 'ALL' as const,
    description: 'Whole House (Ruling + Opposition + Independent delegates)'
  },
  {
    title: 'Ruling Party Leader & Chief Minister Election',
    position: 'Ruling Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'RULING' as const,
    description: 'Ruling Bench delegates only'
  },
  {
    title: 'Leader of the Opposition (LOP) Election',
    position: 'Opposition Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'OPPOSITION' as const,
    description: 'Opposition Bench delegates only'
  }
];

export const ElectionsTab: React.FC<ElectionsTabProps> = ({
  elections,
  flashVotes,
  learners,
  nominations = [],
  eventId,
  onCastVote,
  onCloseElection,
  onSetElectionStatus,
  onAddCandidate,
  onRemoveCandidate,
  onResetElection,
  onCreateElection,
  onCreateFlashVote,
  onCastFlashVote,
  onShowToast
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'ELECTIONS' | 'FLASH_VOTES'>('ELECTIONS');
  const [selectedVoterId, setSelectedVoterId] = useState<string>('');

  // Modal State for adding a new election post
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [customPostTitle, setCustomPostTitle] = useState('');
  const [customPosition, setCustomPosition] = useState('Speaker');
  const [customElectorate, setCustomElectorate] = useState<'ALL' | 'RULING' | 'OPPOSITION'>('ALL');

  // Modal State for Nominating / Adding candidates to an election
  const [activeNominateElectionId, setActiveNominateElectionId] = useState<string | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [nominationSourceTab, setNominationSourceTab] = useState<'NOMINATIONS' | 'ALL_DELEGATES'>('NOMINATIONS');

  // Flash vote form
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollAudience, setPollAudience] = useState<FlashVoteAudience>('ALL');
  const [pollMotionType, setPollMotionType] = useState<LiveFlashVote['motion_type']>('Division');

  // Default selected voter
  React.useEffect(() => {
    if (!selectedVoterId && learners.length > 0) {
      setSelectedVoterId(learners[0].id);
    }
  }, [learners, selectedVoterId]);

  // Active selected voter object
  const currentVoter = useMemo(() => {
    return learners.find(l => l.id === selectedVoterId) || learners[0] || null;
  }, [learners, selectedVoterId]);

  // Auto-initialize standard 4 posts if no elections exist for this event
  React.useEffect(() => {
    if (elections.length === 0 && eventId) {
      DEFAULT_POSTS.forEach(p => {
        onCreateElection({
          event_id: eventId,
          title: p.title,
          position: p.position,
          type: p.type,
          status: 'Upcoming',
          candidates: [],
          total_votes: 0,
          voted_delegate_ids: []
        });
      });
    }
  }, [elections.length, eventId]);

  const getElectorateType = (election: Election): 'ALL' | 'RULING' | 'OPPOSITION' => {
    const pos = (election.position || election.title || '').toLowerCase();
    if (pos.includes('opposition') || pos.includes('lop')) return 'OPPOSITION';
    if (pos.includes('ruling') || pos.includes('chief minister')) return 'RULING';
    return 'ALL';
  };

  const isVoterEligibleForElection = (voter: Learner | null, election: Election): { eligible: boolean; reason?: string } => {
    if (!voter) return { eligible: false, reason: 'No voter selected' };
    const electorate = getElectorateType(election);

    if (electorate === 'OPPOSITION' && voter.bench !== 'Opposition') {
      return { eligible: false, reason: 'Leader of Opposition (LOP) election is restricted to Opposition Bench delegates only.' };
    }
    if (electorate === 'RULING' && voter.bench !== 'Ruling') {
      return { eligible: false, reason: 'Ruling Party Leader election is restricted to Ruling Bench delegates only.' };
    }
    return { eligible: true };
  };

  const handleCreateCustomPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPostTitle.trim()) return;

    onCreateElection({
      event_id: eventId,
      title: customPostTitle.trim(),
      position: customPosition,
      type: customPosition === 'Speaker' ? 'SPEAKER' : customPosition === 'Deputy Speaker' ? 'DEPUTY_SPEAKER' : customPosition === 'Committee Chair' ? 'COMMITTEE' : 'LEADERSHIP',
      status: 'Upcoming',
      candidates: [],
      total_votes: 0,
      voted_delegate_ids: []
    });

    setIsNewPostModalOpen(false);
    setCustomPostTitle('');
    onShowToast('Election Post Created', `Created ${customPostTitle}`, 'success');
  };

  const activeElectionForNominate = useMemo(() => {
    return elections.find(e => e.id === activeNominateElectionId) || null;
  }, [elections, activeNominateElectionId]);

  // Matching filed nominations for this active election post
  const relevantFiledNominations = useMemo(() => {
    if (!activeElectionForNominate) return [];
    const targetPos = activeElectionForNominate.position.toLowerCase();
    return nominations.filter(n => {
      if (n.position.toLowerCase() === targetPos) return true;
      if (targetPos.includes('speaker') && n.position === 'Speaker') return true;
      if (targetPos.includes('deputy') && n.position === 'Deputy Speaker') return true;
      if (targetPos.includes('ruling') && n.position === 'Ruling Party Leader') return true;
      if ((targetPos.includes('opposition') || targetPos.includes('lop')) && n.position === 'Opposition Party Leader') return true;
      return false;
    });
  }, [nominations, activeElectionForNominate]);

  // Filtered all learners for candidate search
  const filteredCandidateLearners = useMemo(() => {
    if (!activeElectionForNominate) return [];
    const electorate = getElectorateType(activeElectionForNominate);
    let pool = learners;
    if (electorate === 'OPPOSITION') {
      pool = learners.filter(l => l.bench === 'Opposition');
    } else if (electorate === 'RULING') {
      pool = learners.filter(l => l.bench === 'Ruling');
    }

    if (!candidateSearchQuery.trim()) return pool.slice(0, 30);
    const q = candidateSearchQuery.toLowerCase();
    return pool.filter(l =>
      l.full_name.toLowerCase().includes(q) ||
      l.access_code.toLowerCase().includes(q) ||
      (l.constituency_name && l.constituency_name.toLowerCase().includes(q)) ||
      (l.constituency_number !== undefined && l.constituency_number.toString().includes(q)) ||
      (l.party_name && l.party_name.toLowerCase().includes(q))
    );
  }, [learners, candidateSearchQuery, activeElectionForNominate]);

  const handleAddCandidateToActiveElection = (cand: { id?: string; learner_id?: string; name: string; party: string; bench: Learner['bench'] }) => {
    if (!activeNominateElectionId) return;
    if (onAddCandidate) {
      onAddCandidate(activeNominateElectionId, {
        learner_id: cand.learner_id || cand.id,
        name: cand.name,
        party: cand.party || 'Independent',
        bench: cand.bench || 'Ruling',
        votes: 0
      });
      onShowToast('Candidate Nominated', `Added ${cand.name} to ballot`, 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Voting Delegate Selector */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
                <Vote className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Assembly Leadership Elections & Ballots
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Nominate candidates from student self-nominations or searchable delegate directory, then open voting with automatic bench-eligibility validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabSection('ELECTIONS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTabSection === 'ELECTIONS'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Post Elections ({elections.length})
            </button>
            <button
              onClick={() => setActiveTabSection('FLASH_VOTES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabSection === 'FLASH_VOTES'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Division Polls ({flashVotes.length})
            </button>
            <button
              onClick={() => setIsNewPostModalOpen(true)}
              className="px-3.5 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-transform hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5" /> + New Post
            </button>
          </div>
        </div>

        {/* Current Voting Delegate Picker */}
        {activeTabSection === 'ELECTIONS' && (
          <div
            className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Active Voting Delegate
                </span>
                {currentVoter ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                      {currentVoter.full_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        currentVoter.bench === 'Ruling'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {currentVoter.bench} Bench
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {currentVoter.party_name || 'Independent'} {currentVoter.constituency_number !== undefined ? `• #${currentVoter.constituency_number} ${currentVoter.constituency_name || ''}` : ''}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">No delegate selected</span>
                )}
              </div>
            </div>

            {/* Voter Select Dropdown with Live Filter */}
            <div className="flex items-center gap-2 w-full md:w-80">
              <select
                value={selectedVoterId}
                onChange={(e) => setSelectedVoterId(e.target.value)}
                className="w-full p-2 rounded-xl border text-xs font-semibold focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {learners.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.bench || 'Delegate'} • {l.party_name || 'Ind'}{l.constituency_number !== undefined ? ` • #${l.constituency_number}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ELECTIONS POSTS GRID */}
      {activeTabSection === 'ELECTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {elections.map((elec) => {
            const electorate = getElectorateType(elec);
            const voterCheck = isVoterEligibleForElection(currentVoter, elec);
            const hasVoted = currentVoter && elec.voted_delegate_ids?.includes(currentVoter.id);
            const isLive = elec.status === 'Live';
            const isClosed = elec.status === 'Closed';
            const isUpcoming = elec.status === 'Upcoming' || !elec.status;
            const sortedCandidates = [...(elec.candidates || [])].sort((a, b) => b.votes - a.votes);
            const leader = sortedCandidates.length > 0 && sortedCandidates[0].votes > 0 ? sortedCandidates[0] : null;

            return (
              <div
                key={elec.id}
                className={`rounded-2xl p-5 md:p-6 border shadow-md space-y-4 flex flex-col justify-between transition-all ${
                  isLive
                    ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isClosed
                    ? 'border-slate-800'
                    : 'border-amber-500/30'
                }`}
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                {/* Post Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        electorate === 'OPPOSITION'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : electorate === 'RULING'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}
                    >
                      {electorate === 'OPPOSITION'
                        ? '🔴 Opposition Bench Only (LOP)'
                        : electorate === 'RULING'
                        ? '🟢 Ruling Bench Only'
                        : '👥 Entire Assembly'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                        isLive
                          ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                          : isClosed
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isLive ? '● Live Voting Open' : isClosed ? '✓ Voting Closed' : '📝 Nomination Phase'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {elec.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Target Post: <strong className="text-amber-400">{elec.position}</strong> • Total Votes Cast: <strong>{elec.total_votes || 0}</strong>
                    </p>
                  </div>
                </div>

                {/* Closed Winner Banner */}
                {isClosed && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
                        Elected Winner
                      </span>
                      <h5 className="text-base font-black text-white">
                        {elec.winner || (leader ? leader.name : 'No winner recorded')}
                      </h5>
                      {leader && (
                        <p className="text-xs text-amber-200/80">
                          {leader.votes} votes ({elec.total_votes > 0 ? Math.round((leader.votes / elec.total_votes) * 100) : 0}%) • {leader.party}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Candidates Roster & Live Voting Bars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-soft)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Nominated Candidates ({elec.candidates?.length || 0})
                    </span>
                    {!isClosed && (
                      <button
                        onClick={() => {
                          setActiveNominateElectionId(elec.id);
                          setCandidateSearchQuery('');
                          setNominationSourceTab('NOMINATIONS');
                        }}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> + Nominate Candidate
                      </button>
                    )}
                  </div>

                  {(!elec.candidates || elec.candidates.length === 0) ? (
                    <div
                      className="p-6 rounded-xl border text-center text-xs italic"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
                    >
                      No candidates nominated yet. Click <strong>"+ Nominate Candidate"</strong> to select from student nominations or the delegate directory.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {elec.candidates.map((cand) => {
                        const pct = elec.total_votes > 0 ? Math.round(((cand.votes || 0) / elec.total_votes) * 100) : 0;
                        const isCandWinner = isClosed && (elec.winner === cand.name || leader?.id === cand.id);

                        return (
                          <div
                            key={cand.id}
                            className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                              isCandWinner
                                ? 'bg-amber-500/10 border-amber-500/40'
                                : 'bg-slate-950/60 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-white">{cand.name}</span>
                                  {isCandWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {cand.party} • <span className={cand.bench === 'Ruling' ? 'text-emerald-400' : 'text-rose-400'}>{cand.bench} Bench</span>
                                </span>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-mono font-black text-white">
                                  {cand.votes || 0} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
                                </div>
                                {!isClosed && !isLive && onRemoveCandidate && (
                                  <button
                                    onClick={() => onRemoveCandidate(elec.id, cand.id)}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                                    title="Remove candidate from ballot"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  cand.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Vote button if Live */}
                            {isLive && (
                              <div className="pt-1">
                                {hasVoted ? (
                                  <button
                                    disabled
                                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center gap-1 cursor-not-allowed opacity-75"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Delegate Already Voted
                                  </button>
                                ) : !voterCheck.eligible ? (
                                  <button
                                    disabled
                                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-400 border border-rose-900/50 flex items-center justify-center gap-1 cursor-not-allowed opacity-75"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Ineligible ({electorate === 'OPPOSITION' ? 'Opposition Only' : 'Ruling Only'})
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (currentVoter) {
                                        onCastVote(elec.id, cand.id, currentVoter.id);
                                        onShowToast('Vote Recorded', `Cast vote for ${cand.name} on behalf of ${currentVoter.full_name}`, 'success');
                                      }
                                    }}
                                    className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-md bg-amber-500 hover:bg-amber-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-101"
                                  >
                                    <Vote className="w-3.5 h-3.5" /> Cast Vote for {cand.name}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Controls / Phase Switchers */}
                <div className="pt-3 border-t flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: 'var(--border-soft)' }}>
                  {isUpcoming && (
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-[11px] text-slate-400">
                        {elec.candidates?.length || 0} candidate(s) ready
                      </span>
                      <button
                        onClick={() => {
                          if (!elec.candidates || elec.candidates.length === 0) {
                            onShowToast('Nominate Candidates', 'Please add at least 1 candidate before opening voting', 'error');
                            return;
                          }
                          if (onSetElectionStatus) onSetElectionStatus(elec.id, 'Live');
                          onShowToast('Voting Opened', `Voting is now Live for ${elec.title}`, 'success');
                        }}
                        disabled={!elec.candidates || elec.candidates.length === 0}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                          !elec.candidates || elec.candidates.length === 0
                            ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-950/40'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Open Voting
                      </button>
                    </div>
                  )}

                  {isLive && (
                    <div className="flex items-center justify-between w-full gap-2">
                      <button
                        onClick={() => {
                          if (onSetElectionStatus) onSetElectionStatus(elec.id, 'Upcoming');
                          onShowToast('Nomination Phase', 'Returned to candidate nomination phase', 'info');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                      >
                        ← Back to Nominations
                      </button>

                      <button
                        onClick={() => {
                          onCloseElection(elec.id);
                          onShowToast('Election Concluded', `Voting closed and winner declared for ${elec.title}`, 'success');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" /> Close Voting & Declare Winner
                      </button>
                    </div>
                  )}

                  {isClosed && (
                    <div className="flex items-center justify-between w-full gap-2">
                      <button
                        onClick={() => {
                          if (onResetElection) onResetElection(elec.id);
                          onShowToast('Election Reset', 'Reset candidate votes and status to upcoming', 'info');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Election
                      </button>

                      <button
                        onClick={() => {
                          if (onSetElectionStatus) onSetElectionStatus(elec.id, 'Live');
                          onShowToast('Voting Re-opened', 'Re-opened voting for this election', 'success');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Re-open Voting
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FLASH DIVISION VOTES SECTION */}
      {activeTabSection === 'FLASH_VOTES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Real-time Division Motions & Rapid Yes/No Polls
              </h4>
              <p className="text-xs text-slate-400">
                Instant electronic division voting on legislative amendments, bills, and urgency motions.
              </p>
            </div>
            <button
              onClick={() => setIsNewPollOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + New Division Motion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashVotes.map(vote => {
              const total = (vote.ayes_count || 0) + (vote.noes_count || 0) + (vote.abstain_count || 0);
              const ayePct = total > 0 ? Math.round(((vote.ayes_count || 0) / total) * 100) : 0;
              const noPct = total > 0 ? Math.round(((vote.noes_count || 0) / total) * 100) : 0;

              return (
                <div
                  key={vote.id}
                  className="rounded-2xl p-5 border border-slate-800 bg-slate-900/90 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {vote.motion_type || 'Division'} • {vote.target_audience} Audience
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${vote.status === 'ACTIVE' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                      {vote.status === 'ACTIVE' ? '● LIVE' : 'CLOSED'}
                    </span>
                  </div>

                  <h5 className="text-sm font-extrabold text-white leading-snug">{vote.question}</h5>

                  {/* Results bars */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                      AYE: {vote.ayes_count || 0} ({ayePct}%)
                    </div>
                    <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400">
                      NO: {vote.noes_count || 0} ({noPct}%)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                      ABSTAIN: {vote.abstain_count || 0}
                    </div>
                  </div>

                  {/* Voting Controls */}
                  {vote.status === 'ACTIVE' && currentVoter && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onCastFlashVote(vote.id, currentVoter, 'AYE');
                          onShowToast('Voted AYE', `Recorded AYE for ${currentVoter.full_name}`, 'success');
                        }}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        ✓ AYE
                      </button>
                      <button
                        onClick={() => {
                          onCastFlashVote(vote.id, currentVoter, 'NO');
                          onShowToast('Voted NO', `Recorded NO for ${currentVoter.full_name}`, 'info');
                        }}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                      >
                        ✕ NO
                      </button>
                      <button
                        onClick={() => {
                          onCastFlashVote(vote.id, currentVoter, 'ABSTAIN');
                          onShowToast('Voted ABSTAIN', `Recorded ABSTAIN for ${currentVoter.full_name}`, 'info');
                        }}
                        className="py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        Abstain
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CANDIDATE NOMINATION MODAL (From Filed Nominations or Search Entire Delegate List) */}
      {activeNominateElectionId && activeElectionForNominate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-xl w-full p-6 border shadow-2xl space-y-4 animate-scale-in max-h-[90vh] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Nominate Candidates for Ballot
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {activeElectionForNominate.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Source Tabs */}
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setNominationSourceTab('NOMINATIONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  nominationSourceTab === 'NOMINATIONS'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                1. From Student Nominations ({relevantFiledNominations.length})
              </button>
              <button
                onClick={() => setNominationSourceTab('ALL_DELEGATES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  nominationSourceTab === 'ALL_DELEGATES'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Search All Assembly Delegates ({learners.length})
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto max-h-[50vh] space-y-3 pr-1">
              
              {/* TAB 1: From Filed Nominations */}
              {nominationSourceTab === 'NOMINATIONS' && (
                <div className="space-y-2">
                  {relevantFiledNominations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic rounded-xl border border-dashed border-slate-800">
                      No self-nominations filed yet for <strong>{activeElectionForNominate.position}</strong>.
                      <br />You can nominate delegates directly from Tab 2 "Search All Assembly Delegates".
                    </div>
                  ) : (
                    relevantFiledNominations.map(nom => {
                      const alreadyIn = activeElectionForNominate.candidates?.some(
                        c => (c.learner_id && c.learner_id === nom.candidate_learner_id) || c.name === nom.candidate_name
                      );

                      return (
                        <div
                          key={nom.id}
                          className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{nom.candidate_name}</span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${nom.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {nom.bench} Bench
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{nom.party_name}</p>
                            {nom.manifesto && (
                              <p className="text-[10px] text-slate-500 italic line-clamp-2">"{nom.manifesto}"</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddCandidateToActiveElection({
                              learner_id: nom.candidate_learner_id,
                              name: nom.candidate_name,
                              party: nom.party_name,
                              bench: nom.bench
                            })}
                            disabled={alreadyIn}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              alreadyIn
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                            }`}
                          >
                            {alreadyIn ? '✓ On Ballot' : '+ Add to Ballot'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Search All Delegates by Name or Constituency # */}
              {nominationSourceTab === 'ALL_DELEGATES' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Delegate Name, Constituency # (e.g. #13), or Party..."
                      value={candidateSearchQuery}
                      onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredCandidateLearners.map(learner => {
                      const alreadyIn = activeElectionForNominate.candidates?.some(
                        c => (c.learner_id && c.learner_id === learner.id) || c.name === learner.full_name
                      );

                      return (
                        <div
                          key={learner.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{learner.full_name}</span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${learner.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {learner.bench || 'Delegate'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {learner.party_name || 'Independent'} {learner.constituency_number !== undefined ? `• #${learner.constituency_number} ${learner.constituency_name || ''}` : ''} • Code: {learner.access_code}
                            </span>
                          </div>

                          <button
                            onClick={() => handleAddCandidateToActiveElection({
                              learner_id: learner.id,
                              name: learner.full_name,
                              party: learner.party_name || 'Independent',
                              bench: learner.bench || 'Ruling'
                            })}
                            disabled={alreadyIn}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              alreadyIn
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                            }`}
                          >
                            {alreadyIn ? '✓ On Ballot' : '+ Nominate'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t flex items-center justify-end" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW POST MODAL */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold text-white">Create New Election Post</h4>
              <button
                onClick={() => setIsNewPostModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomPostSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Election Post Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Public Accounts Committee Chair Election"
                  value={customPostTitle}
                  onChange={(e) => setCustomPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Target Role Category</label>
                <select
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Speaker">Speaker of Assembly</option>
                  <option value="Deputy Speaker">Deputy Speaker</option>
                  <option value="Ruling Party Leader">Ruling Party Leader</option>
                  <option value="Opposition Party Leader">Leader of Opposition (LOP)</option>
                  <option value="Committee Chair">Committee Chairperson</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Electorate Restriction</label>
                <select
                  value={customElectorate}
                  onChange={(e) => setCustomElectorate(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="ALL">All Assembly Delegates (Whole House)</option>
                  <option value="RULING">Ruling Bench Delegates Only</option>
                  <option value="OPPOSITION">Opposition Bench Delegates Only (LOP)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FLASH DIVISION VOTE MODAL */}
      {isNewPollOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold text-white">Create Real-Time Division Motion</h4>
              <button
                onClick={() => setIsNewPollOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pollQuestion.trim()) return;
                onCreateFlashVote(eventId, pollQuestion.trim(), pollAudience, pollMotionType);
                setIsNewPollOpen(false);
                setPollQuestion('');
                onShowToast('Division Motion Created', 'Active for instant Aye/No voting', 'success');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Division Question / Motion *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Should the Youth Legislative Assembly pass Clause 4 of the Digital University Bill?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Target Audience</label>
                  <select
                    value={pollAudience}
                    onChange={(e) => setPollAudience(e.target.value as FlashVoteAudience)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="ALL">Entire House</option>
                    <option value="RULING">Ruling Bench</option>
                    <option value="OPPOSITION">Opposition Bench</option>
                    <option value="MINISTERS">Ministers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Motion Type</label>
                  <select
                    value={pollMotionType}
                    onChange={(e) => setPollMotionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="Division">Division</option>
                    <option value="Closure Motion">Closure Motion</option>
                    <option value="Point of Order">Point of Order</option>
                    <option value="No Confidence">No Confidence</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPollOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-600 shadow-md cursor-pointer"
                >
                  Launch Division Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
