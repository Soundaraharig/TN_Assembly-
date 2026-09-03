import React, { useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear } from '../../types';
import { Zap, X, CheckCircle2, Sparkles } from 'lucide-react';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  onExecuteAllocation: (rulingRatio: number) => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  learners,
  parties,
  committees,
  onExecuteAllocation
}) => {
  if (!isOpen) return null;

  const totalLearners = learners.length;

  // Breakdown by year
  const yearCounts = useMemo(() => {
    const counts: Record<AcademicYear, number> = {
      '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0
    };
    learners.forEach(l => {
      const yr = l.academic_year || '1st Year';
      counts[yr] = (counts[yr] || 0) + 1;
    });
    return counts;
  }, [learners]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Automated TN Assembly Allocation Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cross-year balanced allocation & TN constituency mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Allocation Modal Preview Summary */}
          <div className="border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pre-Allocation Modal Preview
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Total Learners</span>
                <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{totalLearners}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Active Parties</span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold">{parties.length} Parties</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">TN Constituencies</span>
                <strong className="text-sm text-blue-600 dark:text-blue-400 font-extrabold">1 to {Math.min(totalLearners, 234)}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Committees</span>
                <strong className="text-sm text-amber-600 dark:text-amber-300 font-extrabold">{committees.length} Active</strong>
              </div>
            </div>

            {/* Cross-Year Stratification Breakdown */}
            <div className="bg-white/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Cross-Year Stratification Mix
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-100 dark:bg-slate-900 py-1.5 px-2 rounded-lg text-slate-700 dark:text-slate-300">1st Yr: <strong className="text-slate-900 dark:text-white font-bold">{yearCounts['1st Year']}</strong></div>
                <div className="bg-slate-100 dark:bg-slate-900 py-1.5 px-2 rounded-lg text-slate-700 dark:text-slate-300">2nd Yr: <strong className="text-slate-900 dark:text-white font-bold">{yearCounts['2nd Year']}</strong></div>
                <div className="bg-slate-100 dark:bg-slate-900 py-1.5 px-2 rounded-lg text-slate-700 dark:text-slate-300">3rd Yr: <strong className="text-slate-900 dark:text-white font-bold">{yearCounts['3rd Year']}</strong></div>
                <div className="bg-slate-100 dark:bg-slate-900 py-1.5 px-2 rounded-lg text-slate-700 dark:text-slate-300">4th Yr: <strong className="text-slate-900 dark:text-white font-bold">{yearCounts['4th Year']}</strong></div>
              </div>
            </div>
          </div>

          {/* Allocation Rules Checklist */}
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <h5 className="font-bold text-slate-900 dark:text-slate-200">Engine Allocation Rules:</h5>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Maps official TN Assembly Constituency numbers (1-234) and names with zero duplicates.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Stratifies 1st through 4th-year students evenly across Ruling & Opposition parties.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Assigns Chief Minister, Speaker, Opposition Leader & Cabinet Minister portfolios.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Distributes delegates into selected committees in equal proportions.</span>
              </li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onExecuteAllocation(0.55);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Run Auto-Allocation Now
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
