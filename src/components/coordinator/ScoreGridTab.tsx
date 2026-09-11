import React, { useState, useMemo, useEffect } from 'react';
import type { ScoreRecord, Learner } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Grid,
  Plus,
  RotateCcw
} from 'lucide-react';

interface ScoreGridTabProps {
  scores: ScoreRecord[];
  learners: Learner[];
  eventId: string;
  onSaveScore: (score: ScoreRecord) => void;
  onResetScores?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ScoreGridTab: React.FC<ScoreGridTabProps> = ({
  scores,
  learners,
  eventId,
  onSaveScore,
  onResetScores,
  onShowToast
}) => {
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const eventJurors = useMemo(() => storageService.getJury(eventId), [eventId]);
  const defaultJuror = useMemo(() => eventJurors[0]?.name || '', [eventJurors]);
  const [jurorName, setJurorName] = useState(() => defaultJuror);

  useEffect(() => {
    if (!jurorName && defaultJuror) {
      setJurorName(defaultJuror);
    }
  }, [defaultJuror]);
  const [oratory, setOratory] = useState(22);
  const [policy, setPolicy] = useState(23);
  const [conduct, setConduct] = useState(24);
  const [debate, setDebate] = useState(23);
  const [remarks, setRemarks] = useState('');

  // Sorted Leaderboard with multi-juror aggregation using storageService
  const leaderboard = useMemo(() => {
    const aggMap = storageService.getAggregatedScores(eventId);
    const aggList = Object.values(aggMap);
    if (aggList.length > 0) {
      return aggList.map(a => ({
        id: a.learner_id,
        learner_id: a.learner_id,
        learner_name: a.learner_name,
        party_name: a.party_name,
        bench: a.bench,
        oratory: Math.round(a.avg_comm),
        policy_knowledge: Math.round(a.avg_research),
        parliamentary_conduct: Math.round(a.avg_conduct),
        rebuttal_debate: Math.round(a.avg_relevance),
        total: Math.round(a.avg_total),
        evalCount: a.juror_count,
        juror_names: a.juror_names
      })).sort((a, b) => b.total - a.total);
    }

    // Fallback if local state provided directly
    const map = new Map<string, any>();
    scores.forEach(s => {
      const existing = map.get(s.learner_id);
      const orat = Number(s.communication_delivery ?? s.oratory ?? 0);
      const pol = Number(s.research_constituency ?? s.policy_knowledge ?? 0);
      const cond = Number(s.parliamentary_conduct ?? 0);
      const deb = Number(s.relevance_agenda ?? s.rebuttal_debate ?? 0);
      const tot = Number(s.total ?? (orat + pol + cond + deb));

      if (!existing) {
        map.set(s.learner_id, {
          learner_id: s.learner_id,
          learner_name: s.learner_name,
          party_name: s.party_name,
          bench: s.bench,
          oratory: orat,
          policy_knowledge: pol,
          parliamentary_conduct: cond,
          rebuttal_debate: deb,
          total: tot,
          evalCount: 1,
          juror_names: [s.juror_name || 'Juror']
        });
      } else {
        existing.oratory += orat;
        existing.policy_knowledge += pol;
        existing.parliamentary_conduct += cond;
        existing.rebuttal_debate += deb;
        existing.total += tot;
        existing.evalCount += 1;
        if (s.juror_name && !existing.juror_names.includes(s.juror_name)) {
          existing.juror_names.push(s.juror_name);
        }
      }
    });

    return Array.from(map.values()).map(item => {
      const avgOrat = Math.round(item.oratory / item.evalCount);
      const avgPol = Math.round(item.policy_knowledge / item.evalCount);
      const avgCond = Math.round(item.parliamentary_conduct / item.evalCount);
      const avgDeb = Math.round(item.rebuttal_debate / item.evalCount);
      return {
        id: item.learner_id,
        learner_id: item.learner_id,
        learner_name: item.learner_name,
        party_name: item.party_name,
        bench: item.bench,
        oratory: avgOrat,
        policy_knowledge: avgPol,
        parliamentary_conduct: avgCond,
        rebuttal_debate: avgDeb,
        total: avgOrat + avgPol + avgCond + avgDeb,
        evalCount: item.evalCount,
        juror_names: item.juror_names
      };
    }).sort((a, b) => b.total - a.total);
  }, [scores, eventId]);

  const handleResetScores = () => {
    if (window.confirm('⚠️ Are you sure you want to RESET ALL jury evaluation scores? All recorded delegate marks and leaderboard rankings will be permanently cleared.')) {
      if (onResetScores) {
        onResetScores();
      }
      onShowToast('Jury Scores Reset', 'All delegate score records have been reset successfully.', 'info');
    }
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLearner = learners.find(l => l.id === selectedLearnerId);
    if (!targetLearner) {
      onShowToast('Select Delegate', 'Please select a valid delegate', 'error');
      return;
    }

    const total = Number(oratory) + Number(policy) + Number(conduct) + Number(debate);

    const scoreItem: ScoreRecord = {
      id: `sc_${targetLearner.id}_${Date.now()}`,
      event_id: eventId,
      learner_id: targetLearner.id,
      learner_name: targetLearner.full_name,
      party_name: targetLearner.party_name || 'Assembly Delegate',
      bench: targetLearner.bench || 'Ruling',
      oratory: Number(oratory),
      policy_knowledge: Number(policy),
      parliamentary_conduct: Number(conduct),
      rebuttal_debate: Number(debate),
      communication_delivery: Number(oratory),
      research_constituency: Number(policy),
      relevance_agenda: Number(debate),
      total,
      juror_name: jurorName,
      feedback: remarks.trim() || 'Strong delivery and parliamentary acumen.',
      updated_at: new Date().toISOString()
    };

    onSaveScore(scoreItem);

    setIsGradeModalOpen(false);
    setSelectedLearnerId('');
    setRemarks('');
    onShowToast('Score Saved', `Recorded ${total}/100 for ${targetLearner.full_name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Grid className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Jury Evaluation Grid & Live House Leaderboard
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Real-time scoring rubric (/100): Oratory (25), Policy Research (25), Parliamentary Decorum (25), & Rebuttal (25).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {scores.length > 0 && (
            <button
              onClick={handleResetScores}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Reset All Jury Scores"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Scores</span>
            </button>
          )}

          <button
            onClick={() => setIsGradeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Grade Delegate Score</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Rank 2 */}
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-2 flex flex-col justify-between order-2 sm:order-1"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">🥈 Silver</span>
            </div>
            <div>
              <h4 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{leaderboard[1].learner_name}</h4>
              <span className="text-xs text-slate-400">{leaderboard[1].party_name}</span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-slate-400">Total Score:</span>
              <strong className="text-lg font-black text-amber-500">{leaderboard[1].total}/100</strong>
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div
            className="p-6 rounded-2xl border-2 shadow-lg space-y-2 flex flex-col justify-between order-1 sm:order-2 ring-4 ring-amber-500/20"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--amber)' }}
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-md">
                1
              </span>
              <span className="text-xs font-black uppercase text-amber-500">🏆 Gold Leader</span>
            </div>
            <div>
              <h4 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{leaderboard[0].learner_name}</h4>
              <span className="text-xs text-amber-600 font-semibold">{leaderboard[0].party_name} ({leaderboard[0].bench} Bench)</span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-slate-400">Total Score:</span>
              <strong className="text-2xl font-black text-amber-500">{leaderboard[0].total}/100</strong>
            </div>
          </div>

          {/* Rank 3 */}
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-2 flex flex-col justify-between order-3 sm:order-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 font-black text-sm flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">🥉 Bronze</span>
            </div>
            <div>
              <h4 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{leaderboard[2].learner_name}</h4>
              <span className="text-xs text-slate-400">{leaderboard[2].party_name}</span>
            </div>
            <div className="pt-2 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-slate-400">Total Score:</span>
              <strong className="text-lg font-black text-amber-500">{leaderboard[2].total}/100</strong>
            </div>
          </div>
        </div>
      )}

      {/* Score Grid Table */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
          <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Complete Jury Score Ledger ({scores.length} Records)
          </h4>
          {scores.length > 0 && (
            <button
              onClick={handleResetScores}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ledger</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="p-3.5 pl-4">Rank</th>
                <th className="p-3.5">Delegate Participant</th>
                <th className="p-3.5">Juror Evaluator</th>
                <th className="p-3.5">Party & Bench</th>
                <th className="p-3.5 text-center">Oratory (25)</th>
                <th className="p-3.5 text-center">Policy (25)</th>
                <th className="p-3.5 text-center">Conduct (25)</th>
                <th className="p-3.5 text-center">Debate (25)</th>
                <th className="p-3.5 text-right font-black">Total (/100)</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {scores.map((sc, idx) => (
                <tr key={sc.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-3.5 pl-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>{sc.learner_name}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {sc.juror_name || 'Juror'}
                    </span>
                  </td>
                  <td className="p-3.5" style={{ color: 'var(--text-secondary)' }}>
                    {sc.party_name} • <span className={sc.bench === 'Ruling' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{sc.bench}</span>
                  </td>
                  <td className="p-3.5 text-center font-mono">{sc.oratory}</td>
                  <td className="p-3.5 text-center font-mono">{sc.policy_knowledge}</td>
                  <td className="p-3.5 text-center font-mono">{sc.parliamentary_conduct}</td>
                  <td className="p-3.5 text-center font-mono">{sc.rebuttal_debate}</td>
                  <td className="p-3.5 text-right font-black text-sm text-amber-500">{sc.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Delegate Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Grade Parliamentary Performance
              </h4>
              <button onClick={() => setIsGradeModalOpen(false)} className="p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleScoreSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Select Delegate *</label>
                <select
                  required
                  value={selectedLearnerId}
                  onChange={(e) => setSelectedLearnerId(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose delegate --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} ({l.role || 'MLA'} • {l.party_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Evaluating Juror *</label>
                {eventJurors.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={eventJurors.some(j => j.name === jurorName) ? jurorName : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          setJurorName(e.target.value);
                        } else {
                          setJurorName('');
                        }
                      }}
                      className="w-full p-2 rounded-xl border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {eventJurors.map(j => (
                        <option key={j.id} value={j.name}>{j.name} ({j.designation || 'Juror'})</option>
                      ))}
                      <option value="__custom__">-- Other / Custom Juror Name --</option>
                    </select>
                    {!eventJurors.some(j => j.name === jurorName) && (
                      <input
                        type="text"
                        required
                        placeholder="Enter juror name"
                        value={jurorName}
                        onChange={(e) => setJurorName(e.target.value)}
                        className="w-full p-2 rounded-xl border focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter juror name"
                    value={jurorName}
                    onChange={(e) => setJurorName(e.target.value)}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Oratory (/25): {oratory}</label>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={oratory}
                    onChange={(e) => setOratory(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Policy Research (/25): {policy}</label>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={policy}
                    onChange={(e) => setPolicy(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Conduct & Decorum (/25): {conduct}</label>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={conduct}
                    onChange={(e) => setConduct(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Debate Rebuttal (/25): {debate}</label>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={debate}
                    onChange={(e) => setDebate(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl border text-center font-black" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <span>Calculated Total: </span>
                <span className="text-amber-500 text-base">{Number(oratory) + Number(policy) + Number(conduct) + Number(debate)} / 100</span>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Juror Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Feedback on speech clarity, legislative posture, and motion delivery..."
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  Submit Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
