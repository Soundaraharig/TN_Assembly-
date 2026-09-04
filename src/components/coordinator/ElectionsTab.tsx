import React, { useState } from 'react';
import React, { useState, useMemo } from 'react';
import type { Election, LiveFlashVote, Learner, FlashVoteAudience, ElectionCandidate, Nomination } from '../../types';
import {
  Vote,
  Plus,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Zap
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
  onCloseFlashVote,
  onShowToast
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'ELECTIONS' | 'FLASH_VOTES'>('ELECTIONS');
  const [isAddElectionOpen, setIsAddElectionOpen] = useState(false);
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string>('');

  // New Election Form
  const [elecTitle, setElecTitle] = useState('');
  const [elecPosition, setElecPosition] = useState('Speaker of the Legislative Assembly');
  const [elecType, setElecType] = useState<Election['type']>('SPEAKER');
  // Modal State for adding a new election post
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [customPostTitle, setCustomPostTitle] = useState('');
  const [customPosition, setCustomPosition] = useState('Speaker');
  const [customElectorate, setCustomElectorate] = useState<'ALL' | 'RULING' | 'OPPOSITION'>('ALL');

  // New Flash Poll Form
  // Modal State for Nominating / Adding candidates to an election
  const [activeNominateElectionId, setActiveNominateElectionId] = useState<string | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [nominationSourceTab, setNominationSourceTab] = useState<'NOMINATIONS' | 'ALL_DELEGATES'>('NOMINATIONS');

  // Flash vote form
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollAudience, setPollAudience] = useState<FlashVoteAudience>('ALL');
  const [pollMotionType, setPollMotionType] = useState<LiveFlashVote['motion_type']>('Division');

  const [selectedVoterId, setSelectedVoterId] = useState<string>('');

  // Default selected voter
  React.useEffect(() => {
    if (!selectedVoterId && learners.length > 0) {
      setSelectedVoterId(learners[0].id);
    }
  }, [learners, selectedVoterId]);

  // Ensure default flash vote exists if empty so sudden Yes/No is immediately active
  // Active selected voter object
  const currentVoter = useMemo(() => {
    return learners.find(l => l.id === selectedVoterId) || learners[0] || null;
  }, [learners, selectedVoterId]);

  // Auto-initialize standard 4 posts if no elections exist for this event
  React.useEffect(() => {
    if (flashVotes.length === 0 && eventId) {
      onCreateFlashVote(
        eventId,
        'Should the Youth Assembly pass Clause 4 of the Digital University Bill 2026 immediately?',
        'ALL',
        'Division'
      );
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
  }, [flashVotes.length, eventId]);
  }, [elections.length, eventId]);

  const handleCreateElectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elecTitle.trim()) return;
  const getElectorateType = (election: Election): 'ALL' | 'RULING' | 'OPPOSITION' => {
    const pos = (election.position || election.title || '').toLowerCase();
    if (pos.includes('opposition') || pos.includes('lop')) return 'OPPOSITION';
    if (pos.includes('ruling') || pos.includes('chief minister')) return 'RULING';
    return 'ALL';
  };

    // Check if filed nominations exist for this position
    const matchingNoms = (nominations || []).filter(n => {
      if (elecType === 'SPEAKER' && (n.position === 'Speaker' || elecPosition.toLowerCase().includes('speaker'))) return true;
      if (elecType === 'DEPUTY_SPEAKER' && n.position === 'Deputy Speaker') return true;
      if (elecType === 'LEADERSHIP' && (n.position === 'Ruling Party Leader' || n.position === 'Opposition Party Leader')) return true;
      if (elecType === 'COMMITTEE' && n.position === 'Committee Chair') return true;
      return n.position.toLowerCase() === elecPosition.toLowerCase();
    });
  const isVoterEligibleForElection = (voter: Learner | null, election: Election): { eligible: boolean; reason?: string } => {
    if (!voter) return { eligible: false, reason: 'No voter selected' };
    const electorate = getElectorateType(election);

    let candidates: ElectionCandidate[];
    if (electorate === 'OPPOSITION' && voter.bench !== 'Opposition') {
      return { eligible: false, reason: 'Leader of Opposition (LOP) election is restricted to Opposition Bench delegates only.' };
    }
    if (electorate === 'RULING' && voter.bench !== 'Ruling') {
      return { eligible: false, reason: 'Ruling Party Leader election is restricted to Ruling Bench delegates only.' };
    }
    return { eligible: true };
  };

    if (matchingNoms.length > 0) {
      candidates = matchingNoms.map(nom => ({
        id: `c_${nom.candidate_learner_id}`,
        learner_id: nom.candidate_learner_id,
        name: nom.candidate_name,
        party: nom.party_name || 'Independent',
        bench: nom.bench || 'Ruling',
        votes: 0
      }));
    } else {
      // Fallback candidate generator based on election type and learners
      switch (elecType) {
        case 'SPEAKER':
          candidates = learners.slice(0, 5).map(l => ({
            id: `c_${l.id}`,
            learner_id: l.id,
            name: l.full_name,
            party: l.party_name || 'Independent',
            bench: l.bench || 'Ruling',
            votes: 0
          }));
          break;
  const handleCreateCustomPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPostTitle.trim()) return;

        case 'LEADERSHIP':
          const uniqueParties = [...new Set(learners.map(l => l.party_name).filter(Boolean))];
          candidates = uniqueParties.map(party => {
            const partyLearners = learners.filter(l => l.party_name === party);
            const leader = partyLearners[0];
            return {
              id: `c_${leader.id}`,
              learner_id: leader.id,
              name: leader.full_name,
              party: party || 'Independent',
              bench: leader.bench || 'Ruling',
              votes: 0
            };
          });
          break;

        case 'DEPUTY_SPEAKER':
          candidates = learners.slice(0, 3).map(l => ({
            id: `c_${l.id}`,
            learner_id: l.id,
            name: l.full_name,
            party: l.party_name || 'Independent',
            bench: l.bench || 'Ruling',
            votes: 0
          }));
          break;

        case 'COMMITTEE':
          candidates = learners.slice(0, 3).map(l => ({
            id: `c_${l.id}`,
            learner_id: l.id,
            name: l.full_name,
            party: l.party_name || 'Independent',
            bench: l.bench || 'Ruling',
            votes: 0
          }));
          break;

        default:
          candidates = learners.slice(0, 3).map(l => ({
            id: `c_${l.id}`,
            learner_id: l.id,
            name: l.full_name,
            party: l.party_name || 'Independent',
            bench: l.bench || 'Ruling',
            votes: 0
          }));
      }
    }

    onCreateElection({
      event_id: eventId,
      title: elecTitle.trim(),
      position: elecPosition,
      type: elecType,
      status: 'Live',
      candidates
      title: customPostTitle.trim(),
      position: customPosition,
      type: customPosition === 'Speaker' ? 'SPEAKER' : customPosition === 'Deputy Speaker' ? 'DEPUTY_SPEAKER' : customPosition === 'Committee Chair' ? 'COMMITTEE' : 'LEADERSHIP',
      status: 'Upcoming',
      candidates: [],
      total_votes: 0,
      voted_delegate_ids: []
    });

    setIsAddElectionOpen(false);
    setElecTitle('');
    onShowToast('Election Created', `Launched ${elecTitle} ballot`, 'success');
    setIsNewPostModalOpen(false);
    setCustomPostTitle('');
    onShowToast('Election Post Created', `Created ${customPostTitle}`, 'success');
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
  const activeElectionForNominate = useMemo(() => {
    return elections.find(e => e.id === activeNominateElectionId) || null;
  }, [elections, activeNominateElectionId]);

    onCreateFlashVote(eventId, pollQuestion.trim(), pollAudience, pollMotionType);
    setIsNewPollOpen(false);
    setPollQuestion('');
    onShowToast('Live Division Poll Started', `Broadcasting sudden Yes/No poll to ${pollAudience}`, 'success');
  };
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

  const handleVoteCandidate = (electionId: string, candidateId: string) => {
    const voterId = selectedVoterId || learners[0]?.id;
    if (!voterId) {
      onShowToast('Voting Error', 'Please select a voting delegate first', 'error');
      return;
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
    onCastVote(electionId, candidateId, voterId);
    onShowToast('Vote Recorded', 'Digital secret ballot cast successfully!', 'success');
  };

  const handleVoteFlash = (voteId: string, decision: 'AYE' | 'NO' | 'ABSTAIN') => {
    const voter = learners.find(l => l.id === selectedVoterId) || learners[0];
    if (!voter) {
      onShowToast('Voting Error', 'No active delegate selected for flash vote', 'error');
      return;
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
    onCastFlashVote(voteId, voter, decision);
    onShowToast(`Vote Cast: ${decision}`, `Recorded ${decision} from ${voter.full_name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & Mode Switcher */}
      {/* Top Header & Voting Delegate Selector */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        className="rounded-2xl p-5 md:p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-emerald-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Vote className="w-5 h-5" />
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
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Assembly Digital Ballot & Live Division Polls
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Nominate candidates from student self-nominations or searchable delegate directory, then open voting with automatic bench-eligibility validation.
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Conduct formal secret ballot elections for Speaker, CM & Opposition leaders, or launch sudden Yes/No division polls for MLAs and Ministers.
          </p>
        </div>

        {/* Section Toggle Pill */}
        <div className="flex items-center gap-2">
          <div
            className="p-1 rounded-xl border flex items-center gap-1"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
          >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabSection('ELECTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'ELECTIONS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTabSection === 'ELECTIONS'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              🏛️ Key Elections ({elections.length})
              Post Elections ({elections.length})
            </button>
            <button
              onClick={() => setActiveTabSection('FLASH_VOTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'FLASH_VOTES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabSection === 'FLASH_VOTES'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              ⚡ Sudden Yes/No Polls ({flashVotes.length})
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
      </div>

      {/* Delegate Voting Switcher Bar */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Current Voting Delegate:</span>
          <select
            value={selectedVoterId}
            onChange={(e) => setSelectedVoterId(e.target.value)}
            className="px-2.5 py-1 rounded-lg border font-semibold focus:outline-none"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        {/* Current Voting Delegate Picker */}
        {activeTabSection === 'ELECTIONS' && (
          <div
            className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
          >
            {learners.map(l => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({l.role || 'MLA'} • {l.bench || 'No bench'} • #{l.constituency_number || '—'})
              </option>
            ))}
          </select>
        </div>
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

        <div className="flex items-center gap-2 shrink-0">
          {activeTabSection === 'ELECTIONS' ? (
            <button
              onClick={() => setIsAddElectionOpen(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--amber)' }}
            >
              <Plus className="w-3.5 h-3.5" /> New Election Ballot
            </button>
          ) : (
            <button
              onClick={() => setIsNewPollOpen(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Zap className="w-3.5 h-3.5" /> + Trigger Instant Poll
            </button>
          )}
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

      {/* SECTION 1: KEY ELECTIONS (Speaker, Party Leader, Deputy Speaker) */}
      {/* ELECTIONS POSTS GRID */}
      {activeTabSection === 'ELECTIONS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {elections.map((elec) => (
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
                className="rounded-2xl p-5 border shadow-sm space-y-4 flex flex-col justify-between transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                className={`rounded-2xl p-5 md:p-6 border shadow-md space-y-4 flex flex-col justify-between transition-all ${
                  isLive
                    ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isClosed
                    ? 'border-slate-800'
                    : 'border-amber-500/30'
                }`}
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                {/* Post Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                      style={{
                        backgroundColor: 'var(--amber-soft)',
                        color: 'var(--amber)',
                        borderColor: 'var(--amber)'
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        electorate === 'OPPOSITION'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : electorate === 'RULING'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}
                    >
                      {elec.type} ELECTION
                      {electorate === 'OPPOSITION'
                        ? '🔴 Opposition Bench Only (LOP)'
                        : electorate === 'RULING'
                        ? '🟢 Ruling Bench Only'
                        : '👥 Entire Assembly'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        elec.status === 'Live'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                        isLive
                          ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                          : isClosed
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      ● {elec.status}
                      {isLive ? '● Live Voting Open' : isClosed ? '✓ Voting Closed' : '📝 Nomination Phase'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    <h4 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {elec.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Target Role: <strong>{elec.position}</strong> • Total Votes: <strong>{elec.total_votes}</strong>
                      Target Post: <strong className="text-amber-400">{elec.position}</strong> • Total Votes Cast: <strong>{elec.total_votes || 0}</strong>
                    </p>
                  </div>
                </div>

                  {/* Winner Banner if closed */}
                  {elec.winner && elec.status === 'Closed' && (
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
                      className="p-3 rounded-xl border flex items-center gap-3"
                      style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}
                      className="p-6 rounded-xl border text-center text-xs italic"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
                    >
                      <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500 block">Elected Leader</span>
                        <strong className="text-sm" style={{ color: 'var(--text-primary)' }}>{elec.winner}</strong>
                      </div>
                      No candidates nominated yet. Click <strong>"+ Nominate Candidate"</strong> to select from student nominations or the delegate directory.
                    </div>
                  )}
                  ) : (
                    <div className="space-y-2.5">
                      {elec.candidates.map((cand) => {
                        const pct = elec.total_votes > 0 ? Math.round(((cand.votes || 0) / elec.total_votes) * 100) : 0;
                        const isCandWinner = isClosed && (elec.winner === cand.name || leader?.id === cand.id);

                  {/* Candidate Vote Tally & Buttons */}
                  <div className="space-y-2.5 pt-1">
                    {(elec.candidates && elec.candidates.length > 0
                      ? elec.candidates
                      : learners.slice(0, 3).map(l => ({
                          id: `c_${l.id}`,
                          learner_id: l.id,
                          name: l.full_name,
                          party: l.party_name || 'Independent',
                          bench: l.bench || 'Ruling',
                          votes: 0
                        }))
                    ).map((cand) => {
                      const pct = elec.total_votes > 0 ? Math.round((cand.votes / elec.total_votes) * 100) : 0;
                      return (
                        <div
                          key={cand.id}
                          className="p-3 rounded-xl border space-y-2"
                          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <strong className="block text-sm" style={{ color: 'var(--text-primary)' }}>
                                {cand.name}
                              </strong>
                              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                {cand.party} • <span className={cand.bench === 'Ruling' ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{cand.bench} Bench</span>
                              </span>
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

                            <div className="text-right">
                              <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                                {cand.votes} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
                              </span>
                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  cand.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cand.bench === 'Ruling' ? '#10b981' : '#f43f5e'
                              }}
                            ></div>
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

                          {/* Vote button if Live */}
                          {elec.status === 'Live' && (
                            <button
                              onClick={() => handleVoteCandidate(elec.id, cand.id)}
                              className="w-full py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500 hover:text-white"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <Vote className="w-3.5 h-3.5" /> Cast Vote for {cand.name.split(' ')[0]}
                            </button>
                          )}
                        </div>
                      );
                    })}
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

                {/* Election Actions */}
                {elec.status === 'Live' && (
                  <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-soft)' }}>
                    <button
                      onClick={() => {
                        onCloseElection(elec.id);
                        onShowToast('Election Concluded', `Results locked for ${elec.title}`, 'info');
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold text-rose-500 hover:bg-rose-50 border-rose-200 cursor-pointer"
                    >
                      Conclude Ballot & Declare Winner
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2: SUDDEN YES/NO DIVISION VOTING */}
      {/* FLASH DIVISION VOTES SECTION */}
      {activeTabSection === 'FLASH_VOTES' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {flashVotes.length === 0 ? (
              <div
                className="py-12 text-center rounded-2xl border italic text-xs"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                No active division polls. Click "+ Trigger Instant Poll" to ask an urgent Yes/No question to the House.
              </div>
            ) : (
              flashVotes.map((poll) => {
                const totalPollVotes = poll.ayes_count + poll.noes_count + poll.abstain_count;
                const ayesPct = totalPollVotes > 0 ? Math.round((poll.ayes_count / totalPollVotes) * 100) : 0;
                const noesPct = totalPollVotes > 0 ? Math.round((poll.noes_count / totalPollVotes) * 100) : 0;
                const absPct = totalPollVotes > 0 ? Math.round((poll.abstain_count / totalPollVotes) * 100) : 0;
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

                return (
                  <div
                    key={poll.id}
                    className="rounded-2xl p-5 md:p-6 border shadow-sm space-y-4"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          {poll.motion_type} MOTION
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                          Audience: {poll.target_audience}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{poll.created_at}</span>
                      </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashVotes.map(vote => {
              const total = (vote.ayes_count || 0) + (vote.noes_count || 0) + (vote.abstain_count || 0);
              const ayePct = total > 0 ? Math.round(((vote.ayes_count || 0) / total) * 100) : 0;
              const noPct = total > 0 ? Math.round(((vote.noes_count || 0) / total) * 100) : 0;

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          poll.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          ● {poll.status}
                        </span>
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

                        {poll.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              onCloseFlashVote(poll.id);
                              onShowToast('Division Closed', 'Poll recorded to official Hansard log', 'info');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                          >
                            Close Poll
                          </button>
                        )}
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

                    {/* Question Prompt */}
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                        "{poll.question}"
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Total Division Ballots Received: <strong>{totalPollVotes}</strong>
                      </p>
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

                    {/* Live Results Bar & 3-Cards */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-600 block">AYES (YES)</span>
                        <strong className="text-2xl font-black text-emerald-600">{poll.ayes_count}</strong>
                        <span className="text-xs text-emerald-700 block font-semibold">{ayesPct}%</span>
                      </div>
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

                      <div className="p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-rose-600 block">NOES (NO)</span>
                        <strong className="text-2xl font-black text-rose-600">{poll.noes_count}</strong>
                        <span className="text-xs text-rose-700 block font-semibold">{noesPct}%</span>
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

                      <div className="p-3.5 rounded-xl border bg-slate-500/5 border-slate-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">ABSTAIN</span>
                        <strong className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{poll.abstain_count}</strong>
                        <span className="text-xs text-slate-400 block font-semibold">{absPct}%</span>
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

                    {/* Dual Color Bar Visual */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${ayesPct}%` }}></div>
                      <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${noesPct}%` }}></div>
                      <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${absPct}%` }}></div>
                    </div>
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

                    {/* Instant Live Voting Buttons for Current Delegate */}
                    {poll.status === 'ACTIVE' && (
                      <div
                        className="p-4 rounded-xl border space-y-2.5"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            Cast Immediate Vote for: <span className="text-amber-500">{learners.find(l => l.id === selectedVoterId)?.full_name}</span>
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>1-Click Instant Record</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleVoteFlash(poll.id, 'AYE')}
                            className="py-2.5 rounded-xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform hover:scale-102"
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
                            <CheckCircle2 className="w-4 h-4" /> AYE (YES)
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
                            onClick={() => handleVoteFlash(poll.id, 'NO')}
                            className="py-2.5 rounded-xl font-black text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform hover:scale-102"
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
                            <XCircle className="w-4 h-4" /> NO (NAY)
                            {alreadyIn ? '✓ On Ballot' : '+ Nominate'}
                          </button>
                          <button
                            onClick={() => handleVoteFlash(poll.id, 'ABSTAIN')}
                            className="py-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-500/20"
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          >
                            ABSTAIN
                          </button>
                        </div>
                      </div>
                    )}
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

                    {/* Individual Recorded Votes Log */}
                    {poll.votes && poll.votes.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                          Live Floor Division Roll-Call ({poll.votes.length} Votes Recorded):
                        </span>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {poll.votes.map((v, i) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs"
                              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${v.vote === 'AYE' ? 'bg-emerald-500' : v.vote === 'NO' ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                                <strong style={{ color: 'var(--text-primary)' }}>{v.learner_name}</strong>
                                <span className="text-[10px] text-slate-400">({v.role} • {v.bench})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  v.vote === 'AYE' ? 'text-emerald-500 bg-emerald-500/10' : v.vote === 'NO' ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 bg-slate-500/10'
                                }`}>
                                  {v.vote}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{v.timestamp}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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

      {/* MODAL 1: CREATE ELECTION */}
      {isAddElectionOpen && (
      {/* CREATE NEW POST MODAL */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Create Assembly Election Ballot
              </h4>
              <h4 className="text-base font-bold text-white">Create New Election Post</h4>
              <button
                onClick={() => setIsAddElectionOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                onClick={() => setIsNewPostModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateElectionSubmit} className="space-y-3 text-xs">
            <form onSubmit={handleCreateCustomPostSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Election Title *</label>
                <label className="block font-semibold mb-1 text-slate-300">Election Post Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deputy Speaker Election or Public Health Committee Chair"
                  value={elecTitle}
                  onChange={(e) => setElecTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="e.g. Public Accounts Committee Chair Election"
                  value={customPostTitle}
                  onChange={(e) => setCustomPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Position</label>
                <input
                  type="text"
                  value={elecPosition}
                  onChange={(e) => setElecPosition(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
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
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <label className="block font-semibold mb-1 text-slate-300">Electorate Restriction</label>
                <select
                  value={elecType}
                  onChange={(e) => setElecType(e.target.value as Election['type'])}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  value={customElectorate}
                  onChange={(e) => setCustomElectorate(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="SPEAKER">Speaker Election</option>
                  <option value="DEPUTY_SPEAKER">Deputy Speaker Election</option>
                  <option value="LEADERSHIP">Party Leadership (CM / Opp Leader)</option>
                  <option value="COMMITTEE">Committee Chairperson</option>
                  <option value="ALL">All Assembly Delegates (Whole House)</option>
                  <option value="RULING">Ruling Bench Delegates Only</option>
                  <option value="OPPOSITION">Opposition Bench Delegates Only (LOP)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddElectionOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--amber)' }}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  Launch Ballot
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRIGGER INSTANT FLASH POLL */}
      {/* CREATE FLASH DIVISION VOTE MODAL */}
      {isNewPollOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Trigger Live Yes/No Division Poll
                </h4>
              </div>
              <h4 className="text-base font-bold text-white">Create Real-Time Division Motion</h4>
              <button
                onClick={() => setIsNewPollOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-3 text-xs">
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
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Poll Question / Motion Prompt *</label>
                <label className="block font-semibold mb-1 text-slate-300">Division Question / Motion *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Should the Youth Legislative Assembly pass Clause 4 of the Digital University Bill?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Do you support tabling the Emergency Public Healthcare Allocation Amendment?"
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Audience</label>
                  <label className="block font-semibold mb-1 text-slate-300">Target Audience</label>
                  <select
                    value={pollAudience}
                    onChange={(e) => setPollAudience(e.target.value as FlashVoteAudience)}
                    className="w-full p-2 rounded-xl border focus:outline-none font-semibold"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="ALL">All Delegates</option>
                    <option value="MINISTERS">Only Ministers & Cabinet</option>
                    <option value="RULING">Only Ruling Bench</option>
                    <option value="OPPOSITION">Only Opposition Bench</option>
                    <option value="MLAS">All MLAs</option>
                    <option value="ALL">Entire House</option>
                    <option value="RULING">Ruling Bench</option>
                    <option value="OPPOSITION">Opposition Bench</option>
                    <option value="MINISTERS">Ministers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Motion Type</label>
                  <label className="block font-semibold mb-1 text-slate-300">Motion Type</label>
                  <select
                    value={pollMotionType}
                    onChange={(e) => setPollMotionType(e.target.value as LiveFlashVote['motion_type'])}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    onChange={(e) => setPollMotionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="Division">Division Vote</option>
                    <option value="Confidence Motion">Confidence Motion</option>
                    <option value="Resolution">Resolution Voting</option>
                    <option value="Zero Hour Poll">Zero Hour Flash Poll</option>
                    <option value="Sudden Yes/No">Sudden Yes/No</option>
                    <option value="Division">Division</option>
                    <option value="Closure Motion">Closure Motion</option>
                    <option value="Point of Order">Point of Order</option>
                    <option value="No Confidence">No Confidence</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPollOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-600 shadow-md cursor-pointer"
                >
                  Broadcast Poll Now
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
