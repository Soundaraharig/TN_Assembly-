import React, { useState } from 'react';
import type { Election, LiveFlashVote, Learner, FlashVoteAudience } from '../../types';
import {
  Vote,
  Plus,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';

interface ElectionsTabProps {
  elections: Election[];
  flashVotes: LiveFlashVote[];
  learners: Learner[];
  eventId: string;
  onCastVote: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCloseElection: (electionId: string) => void;
  onCreateElection: (elec: Partial<Election>) => void;
  onCreateFlashVote: (eventId: string, question: string, audience: FlashVoteAudience, motionType: LiveFlashVote['motion_type']) => void;
  onCastFlashVote: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onCloseFlashVote: (voteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ElectionsTab: React.FC<ElectionsTabProps> = ({
  elections,
  flashVotes,
  learners,
  eventId,
  onCastVote,
  onCloseElection,
  onCreateElection,
  onCreateFlashVote,
  onCastFlashVote,
  onCloseFlashVote,
  onShowToast
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'ELECTIONS' | 'FLASH_VOTES'>('ELECTIONS');
  const [isAddElectionOpen, setIsAddElectionOpen] = useState(false);
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);

  // New Election Form
  const [elecTitle, setElecTitle] = useState('');
  const [elecPosition, setElecPosition] = useState('Speaker of the Legislative Assembly');
  const [elecType, setElecType] = useState<Election['type']>('SPEAKER');

  // New Flash Poll Form
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollAudience, setPollAudience] = useState<FlashVoteAudience>('ALL');
  const [pollMotionType, setPollMotionType] = useState<LiveFlashVote['motion_type']>('Division');

  const [selectedVoterId, setSelectedVoterId] = useState<string>('');

  React.useEffect(() => {
    if (!selectedVoterId && learners.length > 0) {
      setSelectedVoterId(learners[0].id);
    }
  }, [learners, selectedVoterId]);

  // Ensure default flash vote exists if empty so sudden Yes/No is immediately active
  React.useEffect(() => {
    if (flashVotes.length === 0 && eventId) {
      onCreateFlashVote(
        eventId,
        'Should the Youth Assembly pass Clause 4 of the Digital University Bill 2026 immediately?',
        'ALL',
        'Division'
      );
    }
  }, [flashVotes.length, eventId]);

  const handleCreateElectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elecTitle.trim()) return;

    // Pick top candidates from learners matching position
    const candidates = learners.slice(0, 3).map(l => ({
      id: `c_${l.id}`,
      learner_id: l.id,
      name: l.full_name,
      party: l.party_name || 'Independent',
      bench: l.bench || 'Ruling',
      votes: 0
    }));

    onCreateElection({
      event_id: eventId,
      title: elecTitle.trim(),
      position: elecPosition,
      type: elecType,
      status: 'Live',
      candidates
    });

    setIsAddElectionOpen(false);
    setElecTitle('');
    onShowToast('Election Created', `Launched ${elecTitle} ballot`, 'success');
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;

    onCreateFlashVote(eventId, pollQuestion.trim(), pollAudience, pollMotionType);
    setIsNewPollOpen(false);
    setPollQuestion('');
    onShowToast('Live Division Poll Started', `Broadcasting sudden Yes/No poll to ${pollAudience}`, 'success');
  };

  const handleVoteCandidate = (electionId: string, candidateId: string) => {
    const voterId = selectedVoterId || learners[0]?.id;
    if (!voterId) {
      onShowToast('Voting Error', 'Please select a voting delegate first', 'error');
      return;
    }
    onCastVote(electionId, candidateId, voterId);
    onShowToast('Vote Recorded', 'Digital secret ballot cast successfully!', 'success');
  };

  const handleVoteFlash = (voteId: string, decision: 'AYE' | 'NO' | 'ABSTAIN') => {
    const voter = learners.find(l => l.id === selectedVoterId) || learners[0];
    if (!voter) {
      onShowToast('Voting Error', 'No active delegate selected for flash vote', 'error');
      return;
    }
    onCastFlashVote(voteId, voter, decision);
    onShowToast(`Vote Cast: ${decision}`, `Recorded ${decision} from ${voter.full_name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & Mode Switcher */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-emerald-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Vote className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Assembly Digital Ballot & Live Division Polls
            </h3>
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
            <button
              onClick={() => setActiveTabSection('ELECTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'ELECTIONS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏛️ Key Elections ({elections.length})
            </button>
            <button
              onClick={() => setActiveTabSection('FLASH_VOTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'FLASH_VOTES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Sudden Yes/No Polls ({flashVotes.length})
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
          >
            {learners.map(l => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({l.role || 'MLA'} • {l.bench || 'No bench'} • #{l.constituency_number || '—'})
              </option>
            ))}
          </select>
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
      </div>

      {/* SECTION 1: KEY ELECTIONS (Speaker, Party Leader, Deputy Speaker) */}
      {activeTabSection === 'ELECTIONS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {elections.map((elec) => (
              <div
                key={elec.id}
                className="rounded-2xl p-5 border shadow-sm space-y-4 flex flex-col justify-between transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                      style={{
                        backgroundColor: 'var(--amber-soft)',
                        color: 'var(--amber)',
                        borderColor: 'var(--amber)'
                      }}
                    >
                      {elec.type} ELECTION
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        elec.status === 'Live'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      ● {elec.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      {elec.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Target Role: <strong>{elec.position}</strong> • Total Votes: <strong>{elec.total_votes}</strong>
                    </p>
                  </div>

                  {/* Winner Banner if closed */}
                  {elec.winner && elec.status === 'Closed' && (
                    <div
                      className="p-3 rounded-xl border flex items-center gap-3"
                      style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}
                    >
                      <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500 block">Elected Leader</span>
                        <strong className="text-sm" style={{ color: 'var(--text-primary)' }}>{elec.winner}</strong>
                      </div>
                    </div>
                  )}

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
                            </div>

                            <div className="text-right">
                              <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                                {cand.votes} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
                              </span>
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
        </div>
      )}

      {/* SECTION 2: SUDDEN YES/NO DIVISION VOTING */}
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

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          poll.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          ● {poll.status}
                        </span>

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
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                        "{poll.question}"
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Total Division Ballots Received: <strong>{totalPollVotes}</strong>
                      </p>
                    </div>

                    {/* Live Results Bar & 3-Cards */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-600 block">AYES (YES)</span>
                        <strong className="text-2xl font-black text-emerald-600">{poll.ayes_count}</strong>
                        <span className="text-xs text-emerald-700 block font-semibold">{ayesPct}%</span>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-rose-600 block">NOES (NO)</span>
                        <strong className="text-2xl font-black text-rose-600">{poll.noes_count}</strong>
                        <span className="text-xs text-rose-700 block font-semibold">{noesPct}%</span>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-slate-500/5 border-slate-500/30">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">ABSTAIN</span>
                        <strong className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{poll.abstain_count}</strong>
                        <span className="text-xs text-slate-400 block font-semibold">{absPct}%</span>
                      </div>
                    </div>

                    {/* Dual Color Bar Visual */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${ayesPct}%` }}></div>
                      <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${noesPct}%` }}></div>
                      <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${absPct}%` }}></div>
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
                          >
                            <CheckCircle2 className="w-4 h-4" /> AYE (YES)
                          </button>
                          <button
                            onClick={() => handleVoteFlash(poll.id, 'NO')}
                            className="py-2.5 rounded-xl font-black text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform hover:scale-102"
                          >
                            <XCircle className="w-4 h-4" /> NO (NAY)
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
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE ELECTION */}
      {isAddElectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Create Assembly Election Ballot
              </h4>
              <button
                onClick={() => setIsAddElectionOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateElectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Election Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deputy Speaker Election or Public Health Committee Chair"
                  value={elecTitle}
                  onChange={(e) => setElecTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={elecType}
                  onChange={(e) => setElecType(e.target.value as Election['type'])}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="SPEAKER">Speaker Election</option>
                  <option value="DEPUTY_SPEAKER">Deputy Speaker Election</option>
                  <option value="LEADERSHIP">Party Leadership (CM / Opp Leader)</option>
                  <option value="COMMITTEE">Committee Chairperson</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddElectionOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  Launch Ballot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRIGGER INSTANT FLASH POLL */}
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
              <button
                onClick={() => setIsNewPollOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Poll Question / Motion Prompt *</label>
                <textarea
                  rows={3}
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Do you support tabling the Emergency Public Healthcare Allocation Amendment?"
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Audience</label>
                  <select
                    value={pollAudience}
                    onChange={(e) => setPollAudience(e.target.value as FlashVoteAudience)}
                    className="w-full p-2 rounded-xl border focus:outline-none font-semibold"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="ALL">All Delegates</option>
                    <option value="MINISTERS">Only Ministers & Cabinet</option>
                    <option value="RULING">Only Ruling Bench</option>
                    <option value="OPPOSITION">Only Opposition Bench</option>
                    <option value="MLAS">All MLAs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Motion Type</label>
                  <select
                    value={pollMotionType}
                    onChange={(e) => setPollMotionType(e.target.value as LiveFlashVote['motion_type'])}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Division">Division Vote</option>
                    <option value="Confidence Motion">Confidence Motion</option>
                    <option value="Resolution">Resolution Voting</option>
                    <option value="Zero Hour Poll">Zero Hour Flash Poll</option>
                    <option value="Sudden Yes/No">Sudden Yes/No</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsNewPollOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Broadcast Poll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
