import React, { useState } from 'react';
import type { ScoreRecord, Learner } from '../../types';
import {
  Grid,
  Plus
} from 'lucide-react';

interface ScoreGridTabProps {
  scores: ScoreRecord[];
  learners: Learner[];
  eventId: string;
  onSaveScore: (score: ScoreRecord) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ScoreGridTab: React.FC<ScoreGridTabProps> = ({
  scores,
  learners,
  eventId,
  onSaveScore,
  onShowToast
}) => {
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [jurorName, setJurorName] = useState('Adv. K. Balasubramanian');
  const [oratory, setOratory] = useState(22);
  const [policy, setPolicy] = useState(23);
  const [conduct, setConduct] = useState(24);
  const [debate, setDebate] = useState(23);
  const [remarks, setRemarks] = useState('');

  // Sorted Leaderboard
  const leaderboard = [...scores].sort((a, b) => b.total - a.total);

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
      total,
      juror_name: jurorName,
      feedback: remarks.trim() || 'Strong delivery and parliamentary acumen.',
      updated_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

        <button
          onClick={() => setIsGradeModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Grade Delegate Score</span>
        </button>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="p-3.5 pl-4">Rank</th>
                <th className="p-3.5">Delegate Participant</th>
                <th className="p-3.5">Party & Bench</th>
                <th className="p-3.5 text-center">Oratory (25)</th>
                <th className="p-3.5 text-center">Policy (25)</th>
                <th className="p-3.5 text-center">Conduct (25)</th>
                <th className="p-3.5 text-center">Debate (25)</th>
                <th className="p-3.5 text-right font-black">Total (/100)</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {leaderboard.map((sc, idx) => (
                <tr key={sc.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-3.5 pl-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>{sc.learner_name}</td>
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
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Evaluating Juror</label>
                <input
                  type="text"
                  value={jurorName}
                  onChange={(e) => setJurorName(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
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
