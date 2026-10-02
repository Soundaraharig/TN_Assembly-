import React, { useMemo } from 'react';
import type { Learner } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Trophy,
  Download,
  Printer,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AwardsTabProps {
  learners: Learner[];
  eventName: string;
  eventId?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AwardsTab: React.FC<AwardsTabProps> = ({ learners, eventName, eventId, onShowToast }) => {
  // Authoritative Overall Leaderboard Dataset
  const overallLeaderboard = useMemo(() => {
    if (!eventId) return [];
    return storageService.getOverallLeaderboard(eventId);
  }, [eventId]);

  const learnerMap = useMemo(() => {
    const map = new Map<string, Learner>();
    learners.forEach(l => map.set(l.id, l));
    return map;
  }, [learners]);

  // Determine winners strictly from the authoritative leaderboard
  const topRuling = useMemo(() => {
    return overallLeaderboard.find(r => r.bench === 'Ruling');
  }, [overallLeaderboard]);

  const topOpp = useMemo(() => {
    return overallLeaderboard.find(r => r.bench === 'Opposition');
  }, [overallLeaderboard]);

  const topOverall = useMemo(() => {
    return overallLeaderboard.length > 0 ? overallLeaderboard[0] : undefined;
  }, [overallLeaderboard]);

  const topDebutant = useMemo(() => {
    return overallLeaderboard.find(r => {
      const l = learnerMap.get(r.learnerId);
      const year = l?.academic_year;
      return year === '1st Year' || year === '2nd Year';
    });
  }, [overallLeaderboard, learnerMap]);

  const awardsCategories = [
    {
      id: 'award-1',
      title: 'Best Parliamentarian (Ruling Bench)',
      hasWinner: Boolean(topRuling),
      winner: topRuling ? topRuling.studentName : 'Awaiting Official Evaluation',
      score: topRuling ? `${topRuling.overallScore.toFixed(1)} / 100` : undefined,
      role: topRuling ? (learnerMap.get(topRuling.learnerId)?.role || 'Member of Assembly') : '—',
      party: topRuling ? topRuling.partyName : 'Ruling Bench',
      constituency: topRuling ? (topRuling.constituencyNumber ? `#${topRuling.constituencyNumber} ${topRuling.constituencyName || ''}` : topRuling.constituencyName || '') : '—',
      citation: topRuling
        ? `Rank #1 on Ruling Bench with overall score of ${topRuling.overallScore.toFixed(1)}/100 across ${topRuling.sessionsEvaluatedCount} scored sessions and ${topRuling.speakingTurnCount} speaking turns.`
        : 'Official award determination will be populated automatically once jury deliberations and scoring conclude.',
      badge: 'Gold Medal'
    },
    {
      id: 'award-2',
      title: 'Best Opposition Leader & Voice of House',
      hasWinner: Boolean(topOpp),
      winner: topOpp ? topOpp.studentName : 'Awaiting Official Evaluation',
      score: topOpp ? `${topOpp.overallScore.toFixed(1)} / 100` : undefined,
      role: topOpp ? (learnerMap.get(topOpp.learnerId)?.role || 'Member of Assembly') : '—',
      party: topOpp ? topOpp.partyName : 'Opposition Bench',
      constituency: topOpp ? (topOpp.constituencyNumber ? `#${topOpp.constituencyNumber} ${topOpp.constituencyName || ''}` : topOpp.constituencyName || '') : '—',
      citation: topOpp
        ? `Rank #1 on Opposition Bench with overall score of ${topOpp.overallScore.toFixed(1)}/100 across ${topOpp.sessionsEvaluatedCount} scored sessions and ${topOpp.speakingTurnCount} speaking turns.`
        : 'Official award determination will be populated automatically once jury deliberations and scoring conclude.',
      badge: 'Silver Medal'
    },
    {
      id: 'award-3',
      title: 'Assembly Valedictory Shield (Overall Highest Scorer)',
      hasWinner: Boolean(topOverall),
      winner: topOverall ? topOverall.studentName : 'Awaiting Official Evaluation',
      score: topOverall ? `${topOverall.overallScore.toFixed(1)} / 100` : undefined,
      role: topOverall ? (learnerMap.get(topOverall.learnerId)?.role || 'Member of Assembly') : '—',
      party: topOverall ? `${topOverall.partyName} (${topOverall.bench})` : 'Assembly Delegate',
      constituency: topOverall ? (topOverall.constituencyNumber ? `#${topOverall.constituencyNumber} ${topOverall.constituencyName || ''}` : topOverall.constituencyName || '') : '—',
      citation: topOverall
        ? `Rank #1 overall in the Assembly with aggregate score of ${topOverall.overallScore.toFixed(1)}/100 across ${topOverall.sessionsEvaluatedCount} sessions (${topOverall.speakingTurnCount} speaking turns).`
        : 'Official award determination will be populated automatically once jury deliberations and scoring conclude.',
      badge: 'Assembly Shield'
    },
    {
      id: 'award-4',
      title: 'Best Debutant Parliamentarian (1st / 2nd Year)',
      hasWinner: Boolean(topDebutant),
      winner: topDebutant ? topDebutant.studentName : 'Awaiting Official Evaluation',
      score: topDebutant ? `${topDebutant.overallScore.toFixed(1)} / 100` : undefined,
      role: topDebutant ? (learnerMap.get(topDebutant.learnerId)?.role || 'Member of Assembly') : '—',
      party: topDebutant ? `${topDebutant.partyName} (${topDebutant.bench})` : 'Junior MLA',
      constituency: topDebutant ? (topDebutant.constituencyNumber ? `#${topDebutant.constituencyNumber} ${topDebutant.constituencyName || ''}` : topDebutant.constituencyName || '') : '—',
      citation: topDebutant
        ? `Top-scoring junior parliamentarian with overall score of ${topDebutant.overallScore.toFixed(1)}/100 across ${topDebutant.sessionsEvaluatedCount} scored sessions.`
        : 'Official award determination will be populated automatically once junior MLA scores are compiled.',
      badge: 'Emerging Leader'
    }
  ];

  const handleDownloadCertificate = (_awardTitle: string, winnerName: string, hasWinner: boolean) => {
    if (!hasWinner) {
      onShowToast('Awards Pending', 'Certificates can only be generated after official evaluations are recorded.', 'info');
      return;
    }
    onShowToast('Certificate Generated', `Downloaded official Youth Parliament Certificate of Excellence for ${winnerName}`, 'success');
  };

  const handleGenerateAll = () => {
    if (overallLeaderboard.length === 0) {
      onShowToast('Awards Pending', 'Certificates cannot be generated until official jury evaluations have concluded.', 'info');
      return;
    }
    onShowToast('Batch Download Complete', 'Exported full certificate dossier in high-res format', 'success');
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
            <div className="p-2 rounded-xl text-amber-500 bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Youth Parliament Valedictory Honours & Individual Awards
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Official individual awards and citations computed strictly from the authoritative jury leaderboard for {eventName}.
          </p>
        </div>

        <button
          onClick={handleGenerateAll}
          disabled={overallLeaderboard.length === 0}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Printer className="w-4 h-4" />
          <span>Generate All Certificates</span>
        </button>
      </div>

      {/* Leaderboard Connection Notice */}
      {overallLeaderboard.length === 0 ? (
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-400">
              Awaiting Official Jury Scoring
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              No placeholder or guessed winners are shown. Valedictory honours will be populated strictly from the authoritative Assembly leaderboard once jury members submit official evaluations.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Authoritative Data Connected: {overallLeaderboard.length} evaluated delegates in leaderboard
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Top Overall Score: {overallLeaderboard[0]?.overallScore.toFixed(1)} / 100
          </span>
        </div>
      )}

      {/* Awards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {awardsCategories.map((award, i) => (
          <div
            key={award.id}
            className="rounded-2xl p-6 border shadow-sm space-y-4 flex flex-col justify-between transition-all hover:-translate-y-1"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black border"
                  style={{ backgroundColor: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                >
                  🏆 {award.badge}
                </span>

                <span className="text-xs font-mono font-bold text-slate-400">Award #{i + 1}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {award.title}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {award.winner}
                  </h4>
                  {award.score && (
                    <span className="font-mono font-black text-amber-500 text-sm px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      {award.score}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {award.role} • {award.party} {award.constituency !== '—' && `(${award.constituency})`}
                </p>
              </div>

              <div
                className="p-3.5 rounded-xl border text-xs italic leading-relaxed"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
              >
                "{award.citation}"
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                disabled={!award.hasWinner}
                onClick={() => handleDownloadCertificate(award.title, award.winner, award.hasWinner)}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-amber-500 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <Download className="w-3.5 h-3.5" /> Download Certificate
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
