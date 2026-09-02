import React from 'react';
import type { Learner } from '../../types';
import {
  Trophy,
  Download,
  Printer
} from 'lucide-react';

interface AwardsTabProps {
  learners: Learner[];
  eventName: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AwardsTab: React.FC<AwardsTabProps> = ({ learners, eventName, onShowToast }) => {
  const topRuling = learners.find(l => l.bench === 'Ruling') || learners[0];
  const topOpp = learners.find(l => l.bench === 'Opposition') || learners[1] || learners[0];
  const firstYear = learners.find(l => l.academic_year === '1st Year') || learners[0];

  const awardsCategories = [
    {
      id: 'award-1',
      title: 'Best Parliamentarian (Ruling Bench)',
      winner: topRuling?.full_name || 'Aathira N.S',
      role: topRuling?.role || 'Chief Minister',
      party: topRuling?.party_name || 'Dr. APJ Abdul Kalam Youth Front',
      constituency: topRuling?.constituency_name || '137 - Coimbatore South',
      citation: 'Exemplary leadership on state budget deliberation, question hour poise, and masterclass policy articulation.',
      badge: 'Gold Medal'
    },
    {
      id: 'award-2',
      title: 'Best Opposition Leader & Voice of House',
      winner: topOpp?.full_name || 'A. Sharini',
      role: topOpp?.role || 'Leader of Opposition',
      party: topOpp?.party_name || 'Periyar Progressive Alliance',
      constituency: topOpp?.constituency_name || '109 - Erode East',
      citation: 'Rigorous empirical cross-examination of cabinet ministers, constructive policy alternatives, and fierce advocacy.',
      badge: 'Silver Medal'
    },
    {
      id: 'award-3',
      title: 'Best Assembly Orator & Eloquence Shield',
      winner: learners[1]?.full_name || 'Aaric Oliver J',
      role: learners[1]?.role || 'Speaker of the Assembly',
      party: learners[1]?.party_name || 'Periyar Progressive Alliance',
      constituency: learners[1]?.constituency_name || '11 - Dr. Radhakrishnan Nagar',
      citation: 'Impartial parliamentary conduct, commanding verbal cadence, and flawless adherence to time constraints.',
      badge: 'Oratory Shield'
    },
    {
      id: 'award-4',
      title: 'Best Debutant Parliamentarian (1st / 2nd Year)',
      winner: firstYear?.full_name || 'Aathira N.S',
      role: firstYear?.role || 'Member of Assembly',
      party: firstYear?.party_name || 'Youth Front',
      constituency: firstYear?.constituency_name || 'Constituency Delegate',
      citation: 'Outstanding maiden floor speech during zero hour with thorough preparation on healthcare logistics.',
      badge: 'Emerging Leader'
    }
  ];

  const handleDownloadCertificate = (_awardTitle: string, winnerName: string) => {
    onShowToast('Certificate Generated', `Downloaded official Youth Parliament Certificate of Excellence for ${winnerName}`, 'success');
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
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Youth Parliament Valedictory Honours & Individual Awards
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Official jury citations, Best Parliamentarian trophies, and downloadable certificates for {eventName}.
          </p>
        </div>

        <button
          onClick={() => {
            onShowToast('Batch Download Complete', 'Exported full certificate dossier in high-res format', 'success');
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Printer className="w-4 h-4" />
          <span>Generate All Certificates</span>
        </button>
      </div>

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
                <h4 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {award.winner}
                </h4>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {award.role} • {award.party} ({award.constituency})
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
                onClick={() => handleDownloadCertificate(award.title, award.winner)}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-amber-500 hover:text-white cursor-pointer"
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
