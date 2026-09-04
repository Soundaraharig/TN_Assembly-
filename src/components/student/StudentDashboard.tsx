import React, { useState, useEffect } from 'react';
import type {
  Learner,
  CollegeEvent,
  AgendaItem,
  Party,
  Committee,
  Nomination,
  NominationPosition,
  Election,
  LiveFlashVote
} from '../../types';
import {
  Landmark,
  MapPin,
  BookOpen,
  Clock,
  Hand,
  CheckCircle2,
  Sparkles,
  Radio,
  FileSpreadsheet,
  Send,
  Lock,
  UserCheck,
  Vote,
  Zap,
  Check,
  Crown,
  AlertCircle
} from 'lucide-react';

interface StudentDashboardProps {
  student: Learner;
  event: CollegeEvent | null;
  agenda: AgendaItem[];
  party: Party | null;
  committee: Committee | null;
  nominations?: Nomination[];
  openNominationPositions?: string[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  onFileNomination?: (nom: Partial<Nomination>) => void;
  onCastVote?: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCastFlashVote?: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  event,
  agenda,
  committee,
  nominations = [],
  openNominationPositions = [],
  elections = [],
  flashVotes = [],
  onFileNomination,
  onCastVote,
  onCastFlashVote,
  onShowToast
}) => {
  const [floorRequested, setFloorRequested] = useState(false);

  // Nomination form state
  const [selectedNomPosition, setSelectedNomPosition] = useState<string>(
    openNominationPositions.length > 0 ? openNominationPositions[0] : 'Speaker'
  );
  const [nomManifesto, setNomManifesto] = useState('');
  const [nomSubmitted, setNomSubmitted] = useState(false);

  // Synchronize selected position whenever open positions list updates
  useEffect(() => {
    if (openNominationPositions && openNominationPositions.length > 0) {
      if (!openNominationPositions.includes(selectedNomPosition)) {
        setSelectedNomPosition(openNominationPositions[0]);
      }
    }
  }, [openNominationPositions, selectedNomPosition]);

  const isRuling = student.bench === 'Ruling';
  const currentAgendaItem = agenda.find(a => a.is_current) || agenda[0];

  // Check electorate eligibility for a student
  const isStudentEligibleForElection = (elec: Election): { eligible: boolean; reason?: string } => {
    const title = (elec.title || '').toLowerCase();
    const pos = (elec.position || '').toLowerCase();

    // Party Leader election check
    if (title.includes('party leader') && !title.includes('ruling') && !title.includes('opposition')) {
      if (student.party_name && title.includes(student.party_name.toLowerCase())) {
        return { eligible: true };
      }
      return { eligible: false, reason: 'Restricted to members of that specific political party.' };
    }

    if (pos.includes('opposition') || title.includes('opposition') || title.includes('lop')) {
      if (student.bench !== 'Opposition') {
        return { eligible: false, reason: 'Restricted to Opposition Bench MLAs only.' };
      }
      return { eligible: true };
    }

    if (pos.includes('ruling') || title.includes('ruling') || title.includes('chief minister') || title.includes('prime minister')) {
      if (student.bench !== 'Ruling') {
        return { eligible: false, reason: 'Restricted to Ruling Bench MLAs only.' };
      }
      return { eligible: true };
    }

    return { eligible: true };
  };

  const liveElections = elections.filter(e => e.status === 'Live');
  const activeFlashVotes = flashVotes.filter(f => f.status === 'ACTIVE');

  const handleRequestFloor = () => {
    setFloorRequested(true);
    onShowToast(
      'Point of Order Submitted',
      `Floor request sent to Assembly Speaker for ${student.full_name} (${student.constituency_name || 'MLA'})`,
      'success'
    );
    setTimeout(() => setFloorRequested(false), 5000);
  };

  const handleStudentNominationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onFileNomination) return;

    onFileNomination({
      event_id: student.event_id || '',
      position: selectedNomPosition as NominationPosition,
      candidate_learner_id: student.id,
      candidate_name: student.full_name,
      party_name: student.party_name || 'Independent',
      bench: student.bench || 'Ruling',
      manifesto: nomManifesto.trim() || 'Committed to upholding parliamentary rules, student welfare, and progressive policy debate.',
      status: 'Approved'
    });

    setNomSubmitted(true);
    setNomManifesto('');
    onShowToast(
      'Nomination Submitted',
      `Your nomination for ${selectedNomPosition} has been filed successfully!`,
      'success'
    );
    setTimeout(() => setNomSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Delegate Assembly Pass Card (WITHOUT openly exposed access code) */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 p-6 md:p-8 shadow-xl space-y-6 transition-colors">
        
        {/* Pass Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                Official Delegate Pass
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {event ? event.college_name : 'Tamil Nadu Youth Legislative Assembly'}
              </h2>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-emerald-500/30 text-center flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wider">
              Verified MLA Delegate
            </span>
          </div>
        </div>

        {/* Delegate Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Avatar & Name */}
          <div className="space-y-3 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-amber-950/40 mx-auto md:mx-0">
              {student.full_name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{student.full_name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{student.department} • <span className="text-amber-600 dark:text-amber-400 font-semibold">{student.academic_year}</span></p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{student.email}</p>
            </div>
          </div>

          {/* Assembly Bench & Constituency */}
          <div className="space-y-4 md:col-span-2">
            
            {/* Role & Portfolio Highlight */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Assigned Legislative Role</span>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{student.role || 'Member of Legislative Assembly (MLA)'}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Bench & Party */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Bench Position</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    isRuling
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {student.bench || 'DELEGATE'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{student.party_name || 'Unassigned'}</span>
                </div>
              </div>

              {/* TN Constituency */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" /> TN Assembly Constituency
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {student.constituency_number !== undefined ? `#${student.constituency_number} ` : ''}
                  {student.constituency_name || 'Unassigned'}
                </p>
              </div>

            </div>

            {/* Committee Room */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-blue-500" /> Legislative Committee Room
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {student.committee_name || 'Unassigned Committee'}
              </p>
              {committee?.topic && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">Topic: "{committee.topic}"</p>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ── LIVE ELECTIONS & BALLOT VOTING SECTION ── */}
      {liveElections.length > 0 && onCastVote && (
        <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl p-5 md:p-6 shadow-xl space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                <Vote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Official Assembly Ballots (Live Now)
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white animate-pulse">
                    VOTING OPEN
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cast your official vote for House Leadership and Party Leader positions
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {liveElections.length} Active Ballot{liveElections.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-6">
            {liveElections.map((elec) => {
              const eligibleCheck = isStudentEligibleForElection(elec);
              const hasVoted = elec.voted_delegate_ids?.includes(student.id);

              return (
                <div
                  key={elec.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{elec.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total Ballots Cast in House: <strong>{elec.total_votes || 0}</strong>
                      </p>
                    </div>

                    <div>
                      {hasVoted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Ballot Cast
                        </span>
                      ) : eligibleCheck.eligible ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse">
                          Your Vote Awaited
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Ineligible
                        </span>
                      )}
                    </div>
                  </div>

                  {!eligibleCheck.eligible && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{eligibleCheck.reason}</span>
                    </div>
                  )}

                  {/* Candidate Ballot Options */}
                  {(!elec.candidates || elec.candidates.length === 0) ? (
                    <div className="p-4 text-center rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 italic">
                      Candidates for this election are being finalized by the Presiding Officer.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {elec.candidates.map((cand) => (
                        <div
                          key={cand.id}
                          className={`p-4 rounded-xl border space-y-3 transition-all ${
                            hasVoted
                              ? 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-80'
                              : eligibleCheck.eligible
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-500/60'
                              : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{cand.name}</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {cand.party} • <span className={cand.bench === 'Ruling' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{cand.bench} Bench</span>
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                              {cand.votes || 0} votes
                            </span>
                          </div>

                          {eligibleCheck.eligible && !hasVoted && (
                            <button
                              onClick={() => {
                                onCastVote(elec.id, cand.id, student.id);
                                onShowToast('Vote Recorded', `You voted for ${cand.name} in ${elec.title}`, 'success');
                              }}
                              className="w-full py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Vote className="w-4 h-4" /> Vote for {cand.name}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIVE FLOOR DIVISIONS / FLASH VOTES ── */}
      {activeFlashVotes.length > 0 && onCastFlashVote && (
        <div className="bg-white dark:bg-slate-900 border border-teal-500/40 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-500 border border-teal-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Floor Division & Motion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cast your division vote: AYE / NO / ABSTAIN</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40 animate-pulse">
              Active Division
            </span>
          </div>

          <div className="space-y-4">
            {activeFlashVotes.map(fv => {
              const myVote = fv.votes?.find(v => v.learner_id === student.id)?.vote;

              return (
                <div key={fv.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {fv.motion_type || 'Floor Motion'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{fv.question}</h4>
                    </div>
                    {myVote && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Voted: {myVote}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => {
                        onCastFlashVote(fv.id, student, 'AYE');
                        onShowToast('Division Vote Cast', 'Recorded vote: AYE', 'success');
                      }}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        myVote === 'AYE'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      AYE ({fv.ayes_count || 0})
                    </button>
                    <button
                      onClick={() => {
                        onCastFlashVote(fv.id, student, 'NO');
                        onShowToast('Division Vote Cast', 'Recorded vote: NO', 'info');
                      }}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        myVote === 'NO'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-lg'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      NO ({fv.noes_count || 0})
                    </button>
                    <button
                      onClick={() => {
                        onCastFlashVote(fv.id, student, 'ABSTAIN');
                        onShowToast('Division Vote Cast', 'Recorded vote: ABSTAIN', 'info');
                      }}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        myVote === 'ABSTAIN'
                          ? 'bg-slate-600 text-white border-slate-500 shadow-lg'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                      }`}
                    >
                      ABSTAIN ({fv.abstain_count || 0})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Self-Nomination Filing Section */}
      {openNominationPositions.length > 0 && onFileNomination ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Parliamentary Candidacy Nominations
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                    OPEN NOW
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open positions: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{openNominationPositions.join(', ')}</span>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleStudentNominationSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Open Position *
                </label>
                <select
                  value={selectedNomPosition}
                  onChange={(e) => setSelectedNomPosition(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {openNominationPositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Name & Bench
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${student.full_name} (${student.party_name || 'Independent'} • ${student.bench || 'Delegate'})`}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manifesto / Candidacy Statement *
              </label>
              <textarea
                rows={3}
                value={nomManifesto}
                onChange={(e) => setNomManifesto(e.target.value)}
                placeholder="Share your goals, vision for the assembly, and proposed reforms..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={nomSubmitted}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                  nomSubmitted
                    ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/50'
                }`}
              >
                {nomSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Nomination Filed!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Nomination
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300">Nominations Currently Closed</h5>
              <p className="text-[11px] text-slate-500">The Assembly Coordinator will open nomination windows for Speaker and Leadership during proceedings.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            Awaiting Open
          </span>
        </div>
      )}

      {/* Filed Nominations Tracker */}
      {nominations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Active Candidate Nominations ({nominations.length})
            </h4>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Live Roster</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {nominations.map(nom => {
              const isMe = nom.candidate_learner_id === student.id;
              return (
                <div
                  key={nom.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isMe
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {nom.position}
                    </span>
                    {isMe && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white">
                        Your Nomination
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{nom.candidate_name}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{nom.party_name} • {nom.bench} Bench</p>
                  {nom.manifesto && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2">"{nom.manifesto}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Assembly Floor Request */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hand className="w-5 h-5 text-amber-500" /> Request Assembly Floor Time
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit a Point of Order or speech request to the Assembly Speaker during live debates
          </p>
        </div>

        <button
          onClick={handleRequestFloor}
          disabled={floorRequested}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
            floorRequested
              ? 'bg-emerald-600 text-white shadow-emerald-950/50'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-950/50'
          }`}
        >
          {floorRequested ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Request Sent to Speaker!
            </>
          ) : (
            <>
              <Hand className="w-4 h-4" /> Raise Point of Order
            </>
          )}
        </button>
      </div>

      {/* Live Session Agenda Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" /> Legislative Agenda & Timeline
          </h4>
          {currentAgendaItem?.is_current && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
              <Radio className="w-3 h-3" /> Live Now
            </span>
          )}
        </div>

        <div className="space-y-3">
          {agenda.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.is_current
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{item.day} • {item.time}</span>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.title}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                </div>
                {item.is_current && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Current
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
