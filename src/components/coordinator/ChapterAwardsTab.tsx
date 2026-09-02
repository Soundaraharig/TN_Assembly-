import React from 'react';
import {
  Award,
  Download
} from 'lucide-react';

interface ChapterAwardsTabProps {
  eventName?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChapterAwardsTab: React.FC<ChapterAwardsTabProps> = ({ eventName, onShowToast }) => {
  const chapterStandings = [
    { rank: 1, college: 'JKKNCET Youth Assembly (Namakkal Chapter)', points: 485, delegates: 64, billsPassed: 4, shield: 'Overall Rolling Championship Trophy' },
    { rank: 2, college: 'Erode Engineering College Assembly (Erode Chapter)', points: 432, delegates: 58, billsPassed: 3, shield: 'Best Delegation Runner-Up Shield' },
    { rank: 3, college: 'Salem Govt Arts & Science (Salem Chapter)', points: 390, delegates: 50, billsPassed: 2, shield: 'Outstanding Policy Research Shield' }
  ];

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
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Chapter Excellence Trophies & College Leaderboard
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Institutional rolling trophies, delegation shields, and district chapter performance standings for {eventName || 'Youth Parliament'}.
          </p>
        </div>

        <button
          onClick={() => {
            onShowToast('Shield Dossier Exported', 'Downloaded complete institutional standings report', 'success');
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Download className="w-4 h-4" />
          <span>Export Chapter Standings</span>
        </button>
      </div>

      {/* Chapter Cards */}
      <div className="space-y-4">
        {chapterStandings.map((ch) => (
          <div
            key={ch.rank}
            className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: ch.rank === 1 ? 'var(--amber)' : 'var(--border)'
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 ${
                  ch.rank === 1 ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                #{ch.rank}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 block">
                  🏆 {ch.shield}
                </span>
                <h4 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  {ch.college}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>Delegates: <strong>{ch.delegates}</strong></span>
                  <span>•</span>
                  <span>Bills Enacted: <strong>{ch.billsPassed} Acts</strong></span>
                  <span>•</span>
                  <span>Cumulative Score: <strong className="text-emerald-500 font-bold">{ch.points} Pts</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onShowToast('Chapter Shield Issued', `Rolling trophy awarded to ${ch.college}`, 'success')}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-amber-500 hover:text-white cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Issue Chapter Shield
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
