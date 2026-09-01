import React, { useState, useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear } from '../../types';
import { Zap, X, CheckCircle2, Sparkles, Scale } from 'lucide-react';

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
  const [rulingPercent, setRulingPercent] = useState(55);

  if (!isOpen) return null;

  const totalLearners = learners.length;
  const rulingCount = Math.round(totalLearners * (rulingPercent / 100));
  const oppCount = totalLearners - rulingCount;

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Automated TN Assembly Allocation Engine</h3>
              <p className="text-xs text-slate-400">Cross-year balanced allocation & TN constituency mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Bench Split Ratio Control */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" /> Bench Distribution Ratio
              </span>
              <span className="font-extrabold text-amber-300 font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                {rulingPercent}% Ruling / {100 - rulingPercent}% Opposition
              </span>
            </div>

            <input
              type="range"
              min={40}
              max={70}
              step={5}
              value={rulingPercent}
              onChange={(e) => setRulingPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>40% Ruling</span>
              <span>55% Default</span>
              <span>70% Ruling</span>
            </div>
          </div>

          {/* Allocation Modal Preview Summary */}
          <div className="border border-amber-500/20 bg-amber-950/10 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pre-Allocation Modal Preview
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Learners</span>
                <strong className="text-sm text-white font-extrabold">{totalLearners}</strong>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Active Parties</span>
                <strong className="text-sm text-emerald-400 font-extrabold">{parties.length} Parties</strong>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TN Constituencies</span>
                <strong className="text-sm text-blue-400 font-extrabold">1 to {Math.min(totalLearners, 234)}</strong>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Committees</span>
                <strong className="text-sm text-amber-300 font-extrabold">{committees.length} Active</strong>
              </div>
            </div>

            {/* Cross-Year Stratification Breakdown */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cross-Year Stratification Mix
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="bg-slate-900 p-1.5 rounded">1st Yr: <strong className="text-white">{yearCounts['1st Year']}</strong></div>
                <div className="bg-slate-900 p-1.5 rounded">2nd Yr: <strong className="text-white">{yearCounts['2nd Year']}</strong></div>
                <div className="bg-slate-900 p-1.5 rounded">3rd Yr: <strong className="text-white">{yearCounts['3rd Year']}</strong></div>
                <div className="bg-slate-900 p-1.5 rounded">4th Yr: <strong className="text-white">{yearCounts['4th Year']}</strong></div>
              </div>
            </div>

            {/* Bench Distribution Preview */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-400 font-semibold">Ruling Bench: ~{rulingCount} Delegates</span>
              <span className="text-rose-400 font-semibold">Opposition Bench: ~{oppCount} Delegates</span>
            </div>
          </div>

          {/* Allocation Rules Checklist */}
          <div className="space-y-2 text-xs text-slate-300">
            <h5 className="font-semibold text-slate-200">Engine Allocation Rules:</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Maps official TN Assembly Constituency numbers (1-234) and names with zero duplicates.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Stratifies 1st through 4th-year students evenly across Ruling & Opposition parties.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Assigns Chief Minister, Speaker, Opposition Leader & Cabinet Minister portfolios.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Distributes delegates into selected committees in equal proportions.</span>
              </li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onExecuteAllocation(rulingPercent / 100);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-950/60 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> Run Auto-Allocation Now
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
