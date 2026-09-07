import React, { useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear } from '../../types';
import { storageService } from '../../services/storageService';
import { Zap, X, CheckCircle2, Sparkles, Lock } from 'lucide-react';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventId?: string;
  onExecuteAllocation: (rulingRatio: number) => void;
  onAllocateParties?: (options?: any) => void;
  onAllocateCommittees?: (options?: any) => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  learners,
  parties,
  committees,
  eventId,
  onExecuteAllocation,
  onAllocateParties,
  onAllocateCommittees
}) => {
  const isLocked = storageService.getAllocationLock(eventId);
  const totalLearners = learners.length;
  const unassignedParties = learners.filter(l => !l.party_id && !l.party_name).length;
  const unassignedCommittees = learners.filter(l => !l.committee_id && !l.committee_name).length;

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        
        {isLocked && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Seat Allocation is currently locked by Assembly Coordinator.</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">TN Assembly Allocation Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Independent party & committee assignments with cross-year balance</p>
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
              <Sparkles className="w-3.5 h-3.5" /> Allocation Status Summary
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Total Learners</span>
                <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{totalLearners}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Unassigned Parties</span>
                <strong className="text-sm text-blue-600 dark:text-blue-400 font-extrabold">{unassignedParties}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Unassigned Committees</span>
                <strong className="text-sm text-amber-600 dark:text-amber-300 font-extrabold">{unassignedCommittees}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Active Parties</span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold">{parties.length} Parties</strong>
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

          {/* Independent Options */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Run Independent Allocation Steps
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLocked || totalLearners === 0}
                onClick={() => {
                  if (onAllocateParties) {
                    onAllocateParties({ mode: 'UNASSIGNED_ONLY' });
                  } else {
                    onExecuteAllocation(0.55);
                  }
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-left hover:border-blue-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Allocate Parties Only</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Fills unallocated parties & constituencies. Leaves committees and benches untouched.
                </p>
              </button>

              <button
                type="button"
                disabled={isLocked || totalLearners === 0 || committees.length === 0}
                onClick={() => {
                  if (onAllocateCommittees) {
                    onAllocateCommittees({ mode: 'UNASSIGNED_ONLY' });
                  }
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-left hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Allocate Committees Only</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Distributes unassigned delegates into committees. Leaves parties, benches, and constituencies 100% intact.
                </p>
              </button>
            </div>
          </div>

          {/* Allocation Rules Checklist */}
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <h5 className="font-bold text-slate-900 dark:text-slate-200">Engine Allocation Rules:</h5>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Distributes delegates equally across all {parties.length} parties (~{parties.length > 0 ? Math.round(totalLearners / parties.length) : 0} seats each).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Maps official TN Assembly Constituency numbers (1-234) and names with zero duplicates.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Non-destructive by default: preserves existing party and committee values unless reallocated.</span>
              </li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isLocked) return;
                onExecuteAllocation(0.55);
                onClose();
              }}
              disabled={isLocked}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Full Reallocation (Both)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
