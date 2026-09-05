import React, { useState, useMemo, useEffect } from 'react';
import type { Election, LiveFlashVote, Learner, FlashVoteAudience, ElectionCandidate, Nomination, Party } from '../../types';
import {
  Vote,
  Plus,
  Trophy,
  Users,
  Zap,
  Play,
  RotateCcw,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Crown,
  Scale,
  Landmark,
  Layers,
  Check,
  Search,
  X,
  AlertCircle,
  Lock,
  BarChart3,
  History,
  Trash2
} from 'lucide-react';

interface ElectionsTabProps {
  elections: Election[];
  flashVotes: LiveFlashVote[];
  learners: Learner[];
  parties?: Party[];
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
  onCastFlashVote?: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onCloseFlashVote: (voteId: string) => void;
  onDeleteFlashVote?: (voteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const CONSTITUTIONAL_POSTS = [
  {
    key: 'speaker',
    title: 'Assembly Speaker Election',
    position: 'Speaker',
    type: 'SPEAKER' as const,
    electorate: 'ALL' as const,
    electorateLabel: 'Whole House (All Delegates)',
    description: 'Whole House (Ruling, Opposition & Independent delegates)',
    icon: Crown
  },
  {
    key: 'cm',
    title: 'Ruling Party Leader & Chief Minister Election',
    position: 'Ruling Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'RULING' as const,
    electorateLabel: 'Ruling Bench Only',
    description: 'Ruling Bench delegates only',
    icon: Trophy
  },
  {
    key: 'deputy_speaker',
    title: 'Deputy Speaker Election',
    position: 'Deputy Speaker',
    type: 'DEPUTY_SPEAKER' as const,
    electorate: 'ALL' as const,
    electorateLabel: 'Whole House (All Delegates)',
    description: 'Whole House (Ruling, Opposition & Independent delegates)',
    icon: Crown
  },
  {
    key: 'lop',
    title: 'Leader of the Opposition (LOP) Election',
    position: 'Opposition Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'OPPOSITION' as const,
    electorateLabel: 'Opposition Bench Only',
    description: 'Opposition Bench delegates only',
    icon: Scale
  }
];

export const ElectionsTab: React.FC<ElectionsTabProps> = ({
  elections,
  flashVotes,
  learners,
  parties = [],
  nominations = [],
  eventId,
  onCastVote,
  onCloseElection,
  onSetElectionStatus,
  onAddCandidate,
  onRemoveCandidate,
  onResetElection,
  onDeleteElection,
  onCreateElection,
  onCreateFlashVote,
  onCloseFlashVote,
  onDeleteFlashVote,
  onShowToast
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'ELECTIONS' | 'FLASH_VOTES' | 'HISTORY'>('ELECTIONS');
  const [selectedHistoryElection, setSelectedHistoryElection] = useState<Election | null>(null);
  
  const [expandedElectionIds, setExpandedElectionIds] = useState<Set<string>>(new Set());
  const [selectedVoterPerElection, setSelectedVoterPerElection] = useState<Record<string, string>>({});
  const [activeNominateElectionId, setActiveNominateElectionId] = useState<string | null>(null);
  const [nominationSourceTab, setNominationSourceTab] = useState<'NOMINATIONS' | 'ALL_DELEGATES'>('NOMINATIONS');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollMotionType, setPollMotionType] = useState<LiveFlashVote['motion_type']>('Division');

  // Auto-create standard constitutional election rows & party leader elections if missing
  useEffect(() => {
    if (eventId) {
      CONSTITUTIONAL_POSTS.forEach(post => {
        const exists = elections.some(e =>
          e.position?.toLowerCase() === post.position.toLowerCase() ||
          e.title?.toLowerCase() === post.title.toLowerCase()
        );
        if (!exists) {
          onCreateElection({
            event_id: eventId,
            title: post.title,
            position: post.position,
            type: post.type,
            status: 'Upcoming',
            candidates: [],
            total_votes: 0,
            voted_delegate_ids: []
          });
        }
      });

      // Auto-create Party Leader Elections for all assigned parties
      if (parties && parties.length > 0) {
        parties.forEach(p => {
          const exists = elections.some(e =>
            (e.party_id === p.id) ||
            (e.title.toLowerCase().includes(p.name.toLowerCase()) &&
             (e.title.toLowerCase().includes('leader') || e.position?.toLowerCase().includes('leader')))
          );
          if (!exists) {
            onCreateElection({
              event_id: eventId,
              party_id: p.id,
              title: `${p.name} Leader Election`,
              position: 'Party Leader',
              type: 'LEADERSHIP',
              status: 'Upcoming',
              candidates: [],
              total_votes: 0,
              voted_delegate_ids: []
            });
          }
        });
      }
    }
  }, [elections, eventId, parties]);

  const toggleAccordion = (id: string) => {
    setExpandedElectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getElectorateRule = (election: Election): { type: 'ALL' | 'RULING' | 'OPPOSITION' | 'PARTY'; partyId?: string; partyName?: string; label: string } => {
    const partyLeaderParty = getPartyLeaderElectionParty(election);
    if (partyLeaderParty) {
      return { type: 'PARTY', partyId: partyLeaderParty.id, partyName: partyLeaderParty.name, label: `${partyLeaderParty.name} Members Only` };
    }

    const title = (election.title || '').toLowerCase();
    const pos = (election.position || '').toLowerCase();

    if (pos.includes('opposition') || title.includes('opposition') || title.includes('lop')) {
      return { type: 'OPPOSITION', label: 'Opposition Bench Only' };
    }
    if (pos.includes('ruling') || title.includes('ruling') || title.includes('chief minister') || title.includes('prime minister')) {
      return { type: 'RULING', label: 'Ruling Bench Only' };
    }
    return { type: 'ALL', label: 'Whole Assembly (All Delegates)' };
  };

  const checkVoterEligibility = (voter: Learner | null, election: Election): { eligible: boolean; reason?: string } => {
    if (!voter) return { eligible: false, reason: 'No voter selected' };
    const rule = getElectorateRule(election);

    if (rule.type === 'PARTY') {
      if (rule.partyId && voter.party_id !== rule.partyId && voter.party_name?.toLowerCase() !== rule.partyName?.toLowerCase()) {
        return { eligible: false, reason: `This election is restricted to ${rule.partyName || 'Party'} delegates only.` };
      }
    } else if (rule.type === 'OPPOSITION' && voter.bench !== 'Opposition') {
      return { eligible: false, reason: 'Restricted to Opposition Bench delegates only.' };
    } else if (rule.type === 'RULING' && voter.bench !== 'Ruling') {
      return { eligible: false, reason: 'Restricted to Ruling Bench delegates only.' };
    }

    if (election.voted_delegate_ids?.includes(voter.id)) {
      return { eligible: false, reason: `${voter.full_name} has already voted in this election.` };
    }

    return { eligible: true };
  };

  const { constitutionalElections, partyLeaderElections, customElections } = useMemo(() => {
    const constitutional: Election[] = [];
    const partyLeaders: Election[] = [];
    const custom: Election[] = [];

    elections.forEach(elec => {
      const title = (elec.title || '').toLowerCase();
      const pos = (elec.position || '').toLowerCase();

      // Skip Deputy Speaker election as requested by user
      if (title.includes('deputy') || pos.includes('deputy')) {
        return;
      }

      if ((title.includes('party leader') && !title.includes('ruling') && !title.includes('opposition')) || (pos === 'party leader')) {
        partyLeaders.push(elec);
      } else if (
        pos.includes('speaker') || pos.includes('ruling') || pos.includes('opposition') ||
        title.includes('speaker') || title.includes('chief minister') || title.includes('prime minister') || title.includes('leader of opposition')
      ) {
        constitutional.push(elec);
      } else {
        custom.push(elec);
      }
    });

    const orderMap: Record<string, number> = { 'speaker': 1, 'ruling': 2, 'chief minister': 2, 'prime minister': 2, 'opposition': 3, 'lop': 3 };
    constitutional.sort((a, b) => {
      const aKey = Object.keys(orderMap).find(k => (a.title + a.position).toLowerCase().includes(k)) || 'speaker';
      const bKey = Object.keys(orderMap).find(k => (b.title + b.position).toLowerCase().includes(k)) || 'speaker';
      return (orderMap[aKey] || 99) - (orderMap[bKey] || 99);
    });

    partyLeaders.sort((a, b) => {
      const pIndexA = parties.findIndex(p => (p.id && p.id === a.party_id) || a.title.toLowerCase().includes(p.name.toLowerCase()));
      const pIndexB = parties.findIndex(p => (p.id && p.id === b.party_id) || b.title.toLowerCase().includes(p.name.toLowerCase()));

      if (pIndexA !== -1 && pIndexB !== -1 && pIndexA !== pIndexB) {
        return pIndexA - pIndexB;
      }

      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    return { constitutionalElections: constitutional, partyLeaderElections: partyLeaders, customElections: custom };
  }, [elections, parties]);

  const closedElections = useMemo(() => {
    return elections.filter(e => e.status === 'Closed' || e.winner !== undefined);
  }, [elections]);

  const getPartyLeaderElectionParty = (election: Election | null): Party | null => {
    if (!election) return null;
    if (election.party_id) {
      const match = parties.find(p => p.id === election.party_id);
      if (match) return match;
    }
    const title = (election.title || '').toLowerCase();
    const pos = (election.position || '').toLowerCase();
    if ((pos === 'party leader' || title.includes('party leader')) && !title.includes('ruling') && !title.includes('opposition')) {
      const match = parties.find(p => title.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(title.replace('leader election', '').trim()));
      if (match) return match;
    }
    return null;
  };

  const activeElectionForNominate = useMemo(() => {
    return elections.find(e => e.id === activeNominateElectionId) || null;
  }, [elections, activeNominateElectionId]);

  const activePartyLeaderParty = useMemo(() => {
    return getPartyLeaderElectionParty(activeElectionForNominate);
  }, [activeElectionForNominate, parties]);



  const relevantStudentNominations = useMemo(() => {
    if (!activeElectionForNominate) return [];
    const targetPos = (activeElectionForNominate.position || activeElectionForNominate.title).toLowerCase();
    return nominations.filter(n => {
      if (activePartyLeaderParty) {
        const matchLearner = learners.find(l => l.id === n.candidate_learner_id || l.full_name?.toLowerCase() === n.candidate_name?.toLowerCase());
        const nomineePartyId = matchLearner?.party_id;
        const nomineePartyName = matchLearner?.party_name || n.party_name;

        const isPartyMatch = nomineePartyId
          ? nomineePartyId === activePartyLeaderParty.id
          : nomineePartyName?.toLowerCase() === activePartyLeaderParty.name.toLowerCase();

        if (!isPartyMatch) return false;
      }

      const nPos = n.position.toLowerCase();
      if (targetPos.includes('speaker') && !targetPos.includes('deputy') && nPos.includes('speaker') && !nPos.includes('deputy')) return true;
      if (targetPos.includes('deputy') && nPos.includes('deputy')) return true;
      if ((targetPos.includes('ruling') || targetPos.includes('chief minister') || targetPos.includes('prime minister')) && (nPos.includes('ruling') || nPos.includes('chief minister') || nPos.includes('prime minister'))) return true;
      if ((targetPos.includes('opposition') || targetPos.includes('lop')) && (nPos.includes('opposition') || nPos.includes('leader of opposition'))) return true;
      if (targetPos.includes('party leader') && nPos.includes('party leader')) return true;
      if (nPos === targetPos) return true;
      return false;
    });
  }, [nominations, activeElectionForNominate, activePartyLeaderParty, learners]);

  const filteredCandidatePool = useMemo(() => {
    if (!activeElectionForNominate) return [];
    let pool = learners;

    if (activePartyLeaderParty) {
      pool = pool.filter(l => l.party_id === activePartyLeaderParty.id || l.party_name?.toLowerCase() === activePartyLeaderParty.name.toLowerCase());
    } else {
      const rule = getElectorateRule(activeElectionForNominate);
      if (rule.type === 'PARTY' && rule.partyId) {
        pool = pool.filter(l => l.party_id === rule.partyId || l.party_name?.toLowerCase() === rule.partyName?.toLowerCase());
      } else if (rule.type === 'OPPOSITION') {
        pool = pool.filter(l => l.bench === 'Opposition');
      } else if (rule.type === 'RULING') {
        pool = pool.filter(l => l.bench === 'Ruling');
      }
    }

    if (candidateSearchQuery.trim()) {
      const q = candidateSearchQuery.toLowerCase();
      pool = pool.filter(l =>
        l.full_name?.toLowerCase().includes(q) ||
        l.party_name?.toLowerCase().includes(q) ||
        l.constituency_name?.toLowerCase().includes(q) ||
        String(l.constituency_number || '').includes(q)
      );
    }

    return pool;
  }, [learners, activeElectionForNominate, activePartyLeaderParty, candidateSearchQuery]);

  const handleAddCandidateToElection = (learner: Learner) => {
    if (!activeElectionForNominate || !onAddCandidate) return;

    if (activePartyLeaderParty) {
      const isMatch = learner.party_id
        ? learner.party_id === activePartyLeaderParty.id
        : learner.party_name?.toLowerCase() === activePartyLeaderParty.name.toLowerCase();

      if (!isMatch) {
        onShowToast('Ineligible Candidate', `${learner.full_name} is not a member of ${activePartyLeaderParty.name}. Candidate must be a member of the party holding this election.`, 'error');
        return;
      }
    }

    const alreadyIn = activeElectionForNominate.candidates?.some(
      c => (c.learner_id && c.learner_id === learner.id) || c.name.toLowerCase() === learner.full_name.toLowerCase()
    );
    if (alreadyIn) {
      onShowToast('Candidate Exists', `${learner.full_name} is already nominated for this election.`, 'error');
      return;
    }

    onAddCandidate(activeElectionForNominate.id, {
      name: learner.full_name,
      learner_id: learner.id,
      party: learner.party_name || activePartyLeaderParty?.name || 'Independent',
      bench: learner.bench || activePartyLeaderParty?.bench || 'Ruling',
      votes: 0
    });

    onShowToast('Candidate Nominated', `${learner.full_name} was added to the ballot.`, 'success');
  };

  const renderElectionRow = (elec: Election, index: number) => {
    const isExpanded = expandedElectionIds.has(elec.id);
    const isLive = elec.status === 'Live';
    const isClosed = elec.status === 'Closed';
    const isUpcoming = elec.status === 'Upcoming' || !elec.status;
    const sortedCandidates = [...(elec.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const leader = sortedCandidates.length > 0 && sortedCandidates[0].votes > 0 ? sortedCandidates[0] : null;
    const rule = getElectorateRule(elec);

    const totalEligible = (() => {
      if (rule.type === 'PARTY') {
        return learners.filter(l => l.party_id === rule.partyId || l.party_name?.toLowerCase() === rule.partyName?.toLowerCase()).length;
      }
      if (rule.type === 'RULING') return learners.filter(l => l.bench === 'Ruling').length;
      if (rule.type === 'OPPOSITION') return learners.filter(l => l.bench === 'Opposition').length;
      return learners.length;
    })();

    const liveVotedCount = elec.voted_delegate_ids?.length || 0;
    const liveTurnoutPct = totalEligible > 0 ? Math.round((liveVotedCount / totalEligible) * 100) : 0;
    const liveRemainingCount = Math.max(0, totalEligible - liveVotedCount);

    const selectedVoterId = selectedVoterPerElection[elec.id] || (learners[0]?.id || '');
    const currentVoter = learners.find(l => l.id === selectedVoterId) || learners[0] || null;
    const voterCheck = checkVoterEligibility(currentVoter, elec);
    const hasVoted = currentVoter && elec.voted_delegate_ids?.includes(currentVoter.id);

    return (
      <div
        key={elec.id}
        className="rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:border-slate-400 dark:hover:border-slate-500"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
      >
        {/* Accordion Row Header (Compact & sleek UI) */}
        <div
          onClick={() => toggleAccordion(elec.id)}
          className="py-2.5 px-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-500/5 transition-colors select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Chevron toggle */}
            <div className="text-slate-400 shrink-0">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>

            {/* Status Circle Indicator */}
            {isClosed ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            ) : isLive ? (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center text-xs font-semibold shrink-0">
                {index + 1}
              </div>
            )}

            {/* Election Icon + Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-500 shrink-0">
                <Crown className="w-4 h-4" />
              </span>
              <span className="font-semibold text-sm sm:text-base tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {elec.title}
              </span>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isClosed ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Done
              </span>
            ) : isLive ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                Live Voting
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                Not started
              </span>
            )}
          </div>
        </div>

        {/* Accordion Content when Expanded */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 border-t space-y-4" style={{ borderColor: 'var(--border-soft)', backgroundColor: 'var(--bg-elevated)' }}>
            {/* Action Bar / Electorate Rule & Status Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Electorate:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {rule.label}
                  </span>
                  <span className="text-[11px] text-slate-400">• Total Votes: <strong>{elec.total_votes || 0}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {rule.type === 'OPPOSITION' && 'Only Opposition Bench delegates are permitted to vote.'}
                  {rule.type === 'RULING' && 'Only Ruling Bench delegates are permitted to vote.'}
                  {rule.type === 'PARTY' && `Only members of ${rule.partyName || 'the party'} are permitted to vote.`}
                  {rule.type === 'ALL' && 'All delegates across the House are eligible to participate.'}
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isUpcoming && (
                  <button
                    onClick={() => onSetElectionStatus && onSetElectionStatus(elec.id, 'Live')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Live Voting
                  </button>
                )}

                {isLive && (
                  <button
                    onClick={() => onCloseElection(elec.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Close & Announce Winner
                  </button>
                )}

                {isClosed && (
                  <button
                    onClick={() => onResetElection && onResetElection(elec.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Ballot
                  </button>
                )}

                {onDeleteElection && elec.type !== 'LEADERSHIP' && elec.type !== 'SPEAKER' && elec.type !== 'DEPUTY_SPEAKER' && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the "${elec.title}" ballot?`)) {
                        onDeleteElection(elec.id);
                        onShowToast('Ballot Deleted', `Deleted "${elec.title}" successfully.`, 'info');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-all"
                    title="Delete Election Ballot"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Live Voter Progress Bar */}
            {isLive && (
              <div className="p-3.5 rounded-xl border space-y-2 bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500" /> Live Voter Progress
                  </span>
                  <span className="font-mono font-bold text-white">
                    {liveVotedCount} / {totalEligible} voted ({liveTurnoutPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${liveTurnoutPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {liveVotedCount} Voted
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> {liveRemainingCount} Remaining
                  </span>
                </div>
              </div>
            )}

            {/* Winner Banner if Closed */}
            {isClosed && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block">
                    Elected Winner
                  </span>
                  <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {elec.winner || (leader ? leader.name : 'No winner declared')}
                  </h4>
                  {leader && (
                    <p className="text-[11px] text-slate-400">
                      Won with {leader.votes} votes ({elec.total_votes > 0 ? Math.round((leader.votes / elec.total_votes) * 100) : 0}%) • {leader.party}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Nominated Candidates Roster */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-soft)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ballot Candidates ({elec.candidates?.length || 0})
                </span>
                {!isClosed && !isLive ? (
                  <button
                    onClick={() => {
                      setActiveNominateElectionId(elec.id);
                      setCandidateSearchQuery('');
                      setNominationSourceTab('NOMINATIONS');
                    }}
                    className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Nominate Candidate
                  </button>
                ) : isLive ? (
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Nominations Locked (Voting is live)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                    <Lock className="w-3 h-3" /> Nominations Closed
                  </span>
                )}
              </div>

              {(!elec.candidates || elec.candidates.length === 0) ? (
                <div className="p-4 rounded-lg border border-dashed text-center text-xs italic" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                  No candidates nominated yet. Click <strong>"+ Nominate Candidate"</strong> to select from student nominations or the delegate directory.
                </div>
              ) : (
                <div className="space-y-2">
                  {elec.candidates.map((cand) => {
                    const pct = elec.total_votes > 0 ? Math.round(((cand.votes || 0) / elec.total_votes) * 100) : 0;
                    const isWinner = isClosed && (elec.winner === cand.name || leader?.id === cand.id);

                    return (
                      <div
                        key={cand.id}
                        className={`p-3 rounded-lg border space-y-2 transition-all ${
                          isWinner
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'border-slate-800'
                        }`}
                        style={{ backgroundColor: isWinner ? undefined : 'var(--bg-surface)' }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{cand.name}</span>
                              {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {cand.party} • <span className={cand.bench === 'Ruling' ? 'text-emerald-400' : 'text-rose-400'}>{cand.bench} Bench</span>
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                              {cand.votes || 0} <span className="text-[10px] font-normal text-slate-400">({pct}%)</span>
                            </div>
                            {!isClosed && !isLive && onRemoveCandidate && (
                              <button
                                onClick={() => onRemoveCandidate(elec.id, cand.id)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              cand.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIVE FLOOR VOTING CONSOLE (when Live) */}
            {isLive && (
              <div className="p-3.5 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      Cast Floor Ballot
                    </h5>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {elec.voted_delegate_ids?.length || 0} / {learners.length} Voted
                  </span>
                </div>

                {/* Delegate Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Voting Delegate:
                  </label>
                  <select
                    value={selectedVoterId}
                    onChange={(e) => setSelectedVoterPerElection(prev => ({ ...prev, [elec.id]: e.target.value }))}
                    className="w-full p-2 rounded-lg border text-xs font-medium focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {learners.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.bench || 'Delegate'} • {l.party_name || 'Ind'}{l.constituency_number !== undefined ? ` • #${l.constituency_number}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voter eligibility notice */}
                {!voterCheck.eligible && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{voterCheck.reason}</span>
                  </div>
                )}

                {/* Candidate Voting Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {elec.candidates?.map((cand) => (
                    <button
                      key={cand.id}
                      disabled={!voterCheck.eligible || hasVoted}
                      onClick={() => onCastVote(elec.id, cand.id, currentVoter?.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-all ${
                        voterCheck.eligible && !hasVoted
                          ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-white cursor-pointer'
                          : 'opacity-50 cursor-not-allowed border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Vote for {cand.name}</div>
                        <div className="text-[10px] text-slate-400">{cand.party}</div>
                      </div>
                      <Vote className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Elections & House Ballots
          </h2>
          <p className="text-xs text-slate-400">
            Official legislative ballots, Speaker elections, Party Leadership votes, and live House divisions.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
          <button
            onClick={() => setActiveTabSection('ELECTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTabSection === 'ELECTIONS'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Leadership Ballots ({elections.length})
          </button>
          <button
            onClick={() => setActiveTabSection('FLASH_VOTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTabSection === 'FLASH_VOTES'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Floor Divisions ({flashVotes.length})
          </button>
          <button
            onClick={() => setActiveTabSection('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTabSection === 'HISTORY'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Election Results & History ({closedElections.length})
          </button>
        </div>
      </div>

      {/* ELECTIONS TAB CONTENT */}
      {activeTabSection === 'ELECTIONS' && (
        <div className="space-y-6">
          {/* DIVISION 1: HOUSE LEADERSHIP & CONSTITUTIONAL ELECTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  House Leadership & Key Constitutional Elections
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {constitutionalElections.length} Ballots
              </span>
            </div>

            <div className="space-y-2">
              {constitutionalElections.map((elec, idx) => renderElectionRow(elec, idx))}
            </div>
          </div>

          {/* DIVISION 2: POLITICAL PARTY LEADER ELECTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Political Party Leader Elections
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {partyLeaderElections.length} Ballots
              </span>
            </div>

            {partyLeaderElections.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed text-center space-y-2.5" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs text-slate-400">
                  Party leader ballots will automatically be generated once political parties are assigned in the event configuration.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {partyLeaderElections.map((elec, idx) => renderElectionRow(elec, idx))}
              </div>
            )}
          </div>

          {/* CUSTOM ELECTIONS (if any) */}
          {customElections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Special & Custom Ballots
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{customElections.length} Ballots</span>
              </div>
              <div className="space-y-2">
                {customElections.map((elec, idx) => renderElectionRow(elec, idx))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLASH VOTES TAB CONTENT */}
      {activeTabSection === 'FLASH_VOTES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Live Assembly Floor Divisions & Motions
            </h3>
            <button
              onClick={() => setIsNewPollOpen(true)}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Floor Division
            </button>
          </div>

          {flashVotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              No active flash votes or floor divisions. Launch one using the button above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashVotes.map((fv) => (
                <div key={fv.id} className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        {fv.motion_type || 'Division Motion'}
                      </span>
                      <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{fv.question}</h4>
                    </div>
                    {fv.status === 'ACTIVE' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Concluded
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-lg font-black text-emerald-400">{fv.ayes_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-500/80">AYES</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-lg font-black text-rose-400">{fv.noes_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-rose-500/80">NOES</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20">
                      <div className="text-lg font-black text-slate-400">{fv.abstain_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">ABSTAIN</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    {fv.status === 'ACTIVE' && (
                      <button
                        onClick={() => onCloseFlashVote(fv.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
                      >
                        Close Floor Division
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${fv.question}" vote?`)) {
                          onDeleteFlashVote?.(fv.id);
                          onShowToast('Floor Division Deleted', `Deleted "${fv.question}" vote successfully.`, 'info');
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${fv.status !== 'ACTIVE' ? 'w-full' : ''}`}
                      title="Delete Floor Division"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Vote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ELECTION HISTORY & RESULTS TAB CONTENT */}
      {activeTabSection === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Election Results & Historical Ballots
              </h3>
              <p className="text-xs text-slate-400">
                Archive of completed legislative elections, declared winners, vote counts, and turnout metrics.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shrink-0">
              {closedElections.length} Completed {closedElections.length === 1 ? 'Election' : 'Elections'}
            </span>
          </div>

          {closedElections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed space-y-2" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <History className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No Election History Available Yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Completed and closed elections will automatically appear here with complete vote breakdowns, declared winners, and turnout statistics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedElections.map((elec) => {
                const sortedCandidates = [...(elec.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                const leader = sortedCandidates[0] || null;
                const winnerName = elec.winner || (leader ? leader.name : 'Declared Winner');
                const rule = getElectorateRule(elec);

                let totalEligible = learners.length;
                if (rule.type === 'RULING') totalEligible = learners.filter(l => l.bench === 'Ruling').length;
                else if (rule.type === 'OPPOSITION') totalEligible = learners.filter(l => l.bench === 'Opposition').length;
                else if (rule.type === 'PARTY' && rule.partyId) totalEligible = learners.filter(l => l.party_id === rule.partyId || l.party_name?.toLowerCase() === rule.partyName?.toLowerCase()).length;

                const totalVotes = elec.total_votes || 0;
                const turnoutPct = totalEligible > 0 ? Math.round((totalVotes / totalEligible) * 100) : 0;
                const completedAtText = elec.completed_at ? new Date(elec.completed_at).toLocaleString() : 'Concluded';

                return (
                  <div
                    key={elec.id}
                    className="p-5 rounded-2xl border space-y-4 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">
                            {elec.position || 'Ballot Position'}
                          </span>
                          <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {elec.title}
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Closed
                        </span>
                      </div>

                      {/* Winner Card */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block">
                            Elected Winner
                          </span>
                          <h5 className="text-sm font-bold text-white truncate">
                            {winnerName}
                          </h5>
                          {leader && (
                            <p className="text-[11px] text-slate-300 truncate">
                              {leader.party} • {leader.votes} votes ({totalVotes > 0 ? Math.round((leader.votes / totalVotes) * 100) : 0}%)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Total Votes</div>
                          <div className="font-bold text-white font-mono mt-0.5">{totalVotes}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Eligible</div>
                          <div className="font-bold text-white font-mono mt-0.5">{totalEligible}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Turnout</div>
                          <div className="font-bold text-emerald-400 font-mono mt-0.5">{turnoutPct}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
                      <span className="text-[11px] text-slate-400 truncate">
                        {completedAtText}
                      </span>
                      <button
                        onClick={() => setSelectedHistoryElection(elec)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> View Results
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ELECTION HISTORY DETAILED RESULTS MODAL */}
      {selectedHistoryElection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider block">
                  Official Ballot Result Breakdown
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedHistoryElection.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryElection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(() => {
                const sorted = [...(selectedHistoryElection.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                const top = sorted[0];
                const totalV = selectedHistoryElection.total_votes || 0;
                const rule = getElectorateRule(selectedHistoryElection);

                let totalEligible = learners.length;
                if (rule.type === 'RULING') totalEligible = learners.filter(l => l.bench === 'Ruling').length;
                else if (rule.type === 'OPPOSITION') totalEligible = learners.filter(l => l.bench === 'Opposition').length;
                else if (rule.type === 'PARTY' && rule.partyId) totalEligible = learners.filter(l => l.party_id === rule.partyId || l.party_name?.toLowerCase() === rule.partyName?.toLowerCase()).length;

                const turnout = totalEligible > 0 ? Math.round((totalV / totalEligible) * 100) : 0;

                return (
                  <>
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center space-y-1">
                      <Trophy className="w-7 h-7 text-amber-500 mx-auto" />
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
                        Declared Winner
                      </span>
                      <h4 className="text-xl font-extrabold text-white">
                        {selectedHistoryElection.winner || (top ? top.name : 'No winner')}
                      </h4>
                      {top && (
                        <p className="text-xs text-amber-200/90 font-medium">
                          {top.party} • {top.votes} Votes ({totalV > 0 ? Math.round((top.votes / totalV) * 100) : 0}%)
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Votes</div>
                        <div className="text-base font-black text-white font-mono">{totalV}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Eligible Voters</div>
                        <div className="text-base font-black text-white font-mono">{totalEligible}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Turnout %</div>
                        <div className="text-base font-black text-emerald-400 font-mono">{turnout}%</div>
                      </div>
                    </div>

                    {/* Candidate Vote Breakdown */}
                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5 border-slate-800">
                        Candidate Ballots & Share
                      </h5>
                      {sorted.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No candidates recorded.</p>
                      ) : (
                        sorted.map((c, i) => {
                          const cPct = totalV > 0 ? Math.round(((c.votes || 0) / totalV) * 100) : 0;
                          const isWinner = (selectedHistoryElection.winner === c.name) || (i === 0 && (c.votes || 0) > 0);

                          return (
                            <div
                              key={c.id}
                              className={`p-3.5 rounded-xl border space-y-2 ${
                                isWinner ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{c.name}</span>
                                  {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <span className="font-mono font-bold text-white">
                                  {c.votes || 0} votes ({cPct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full ${isWinner ? 'bg-amber-500' : c.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${cPct}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex justify-between">
                                <span>{c.party} ({c.bench || 'Delegate'})</span>
                                <span>Rank #{i + 1}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end border-slate-800">
              <button
                onClick={() => setSelectedHistoryElection(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE NOMINATION MODAL (From Student Nominations or Delegate Directory) */}
      {activeElectionForNominate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider">
                  Nominate Candidate for Ballot
                </span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeElectionForNominate.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Party Candidate Restriction Notice */}
            {activePartyLeaderParty && (
              <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Party Candidate Restriction:</strong> Only registered members of <strong>{activePartyLeaderParty.name}</strong> can be nominated for this election.
                </span>
              </div>
            )}

            {/* Source Tab Switcher */}
            <div className="px-5 pt-4 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setNominationSourceTab('NOMINATIONS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  nominationSourceTab === 'NOMINATIONS'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                From Student Submissions ({relevantStudentNominations.length})
              </button>
              <button
                onClick={() => setNominationSourceTab('ALL_DELEGATES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  nominationSourceTab === 'ALL_DELEGATES'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                From Delegate Directory ({filteredCandidatePool.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search delegate by name, party, or constituency number..."
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Candidate List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {nominationSourceTab === 'NOMINATIONS' ? (
                relevantStudentNominations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    No student submissions found for this position. Switch to "From Delegate Directory" to nominate any MLA.
                  </div>
                ) : (
                  relevantStudentNominations.map((nom) => {
                    const matchLearner = learners.find(l => l.full_name?.toLowerCase() === nom.candidate_name?.toLowerCase() || l.id === nom.candidate_learner_id);
                    const isAlreadyCandidate = activeElectionForNominate.candidates?.some(c => c.name.toLowerCase() === nom.candidate_name.toLowerCase());

                    return (
                      <div
                        key={nom.id}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{nom.candidate_name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {nom.position}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {nom.party_name || matchLearner?.party_name || 'Independent'} • {matchLearner?.bench || nom.bench || 'Opposition'} Bench
                            {nom.manifesto ? ` • "${nom.manifesto.substring(0, 60)}..."` : ''}
                          </p>
                        </div>

                        <button
                          disabled={isAlreadyCandidate}
                          onClick={() => {
                            if (matchLearner) {
                              handleAddCandidateToElection(matchLearner);
                            } else {
                              onAddCandidate && onAddCandidate(activeElectionForNominate.id, {
                                name: nom.candidate_name,
                                party: nom.party_name || 'Independent',
                                bench: nom.bench || 'Opposition',
                                votes: 0
                              });
                              onShowToast('Candidate Added', `${nom.candidate_name} nominated for ballot`, 'success');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAlreadyCandidate
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                          }`}
                        >
                          {isAlreadyCandidate ? 'Nominated ✓' : '+ Add to Ballot'}
                        </button>
                      </div>
                    );
                  })
                )
              ) : (
                filteredCandidatePool.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    No delegates match your search or eligibility criteria.
                  </div>
                ) : (
                  filteredCandidatePool.map((l) => {
                    const isAlreadyCandidate = activeElectionForNominate.candidates?.some(c => c.name.toLowerCase() === l.full_name.toLowerCase());

                    return (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{l.full_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              l.bench === 'Ruling'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}>
                              {l.bench || 'Opposition'} Bench
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {l.party_name || 'Independent'} {l.constituency_number !== undefined ? `• Const #${l.constituency_number} ${l.constituency_name || ''}` : ''}
                          </p>
                        </div>

                        <button
                          disabled={isAlreadyCandidate}
                          onClick={() => handleAddCandidateToElection(l)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAlreadyCandidate
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                          }`}
                        >
                          {isAlreadyCandidate ? 'Nominated ✓' : '+ Add to Ballot'}
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW FLASH VOTE MODAL */}
      {isNewPollOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl animate-scaleIn" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Launch House Floor Division</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pollQuestion.trim()) return;
                onCreateFlashVote(eventId, pollQuestion, 'ALL', pollMotionType);
                setPollQuestion('');
                setIsNewPollOpen(false);
                onShowToast('Floor Division Launched', 'Delegates can now vote AYE / NO / ABSTAIN', 'success');
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Motion Question / Title</label>
                <textarea
                  rows={3}
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g., That this House has no confidence in the Council of Ministers..."
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Motion Type</label>
                <select
                  value={pollMotionType}
                  onChange={(e) => setPollMotionType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="Division">Division</option>
                  <option value="Closure Motion">Closure Motion</option>
                  <option value="Point of Order">Point of Order</option>
                  <option value="No Confidence">No Confidence</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsNewPollOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 shadow cursor-pointer"
                >
                  Launch Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
