import React, { useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear } from '../../types';
import { storageService } from '../../services/storageService';
import { Zap, X, CheckCircle2, Sparkles, Lock, MapPin } from 'lucide-react';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventId?: string;
  onExecuteAllocation: (rulingRatio: number) => void | Promise<any>;
  onAllocateParties?: (options?: any) => void | Promise<any>;
  onAllocateCommittees?: (options?: any) => void | Promise<any>;
  onAllocateConstituencies?: (options?: any) => void | Promise<any>;
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
  onAllocateCommittees,
  onAllocateConstituencies
}) => {
  const isLocked = storageService.getAllocationLock(eventId);
  const totalLearners = learners.length;
  const unassignedParties = learners.filter(l => !l.party_id && !l.party_name).length;
  const unassignedCommittees = learners.filter(l => !l.committee_id && !l.committee_name).length;
  const unassignedConstituencies = learners.filter(l => !l.constituency_number).length;

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Independent constituency, party & committee assignments</p>
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
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">No Constituency</span>
                <strong className="text-sm text-purple-600 dark:text-purple-400 font-extrabold">{unassignedConstituencies}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">No Party</span>
                <strong className="text-sm text-blue-600 dark:text-blue-400 font-extrabold">{unassignedParties}</strong>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">No Committee</span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold">{unassignedCommittees}</strong>
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
              Run Independent Allocation Steps (Non-Destructive)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Constituency Only */}
              <button
                type="button"
                disabled={isLocked || totalLearners === 0}
                onClick={async () => {
                  if (onAllocateConstituencies) {
                    await onAllocateConstituencies({ mode: 'UNASSIGNED_ONLY' });
                  } else if (eventId) {
                    await storageService.allocateConstituenciesForEvent(eventId, { mode: 'UNASSIGNED_ONLY' });
                  }
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-left hover:border-purple-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Constituencies Only</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Assigns 1–234 TN seats to unallocated delegates. Leaves parties & committees untouched.
                  </p>
                </div>
                {unassignedConstituencies > 0 && (
                  <span className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {unassignedConstituencies} unassigned
                  </span>
                )}
              </button>

              {/* Party Only */}
              <button
                type="button"
                disabled={isLocked || totalLearners === 0}
                onClick={async () => {
                  if (onAllocateParties) {
                    await onAllocateParties({ mode: 'UNASSIGNED_ONLY' });
                  } else {
                    await onExecuteAllocation(0.55);
                  }
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-left hover:border-blue-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Parties Only</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Fills unallocated parties with cross-year balance. Leaves committees untouched.
                  </p>
                </div>
                {unassignedParties > 0 && (
                  <span className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {unassignedParties} unassigned
                  </span>
                )}
              </button>

              {/* Committee Only */}
              <button
                type="button"
                disabled={isLocked || totalLearners === 0 || committees.length === 0}
                onClick={async () => {
                  if (onAllocateCommittees) {
                    await onAllocateCommittees({ mode: 'UNASSIGNED_ONLY' });
                  }
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-left hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Committees Only</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Distributes delegates into committees. Leaves parties & constituencies 100% intact.
                  </p>
                </div>
                {unassignedCommittees > 0 && (
                  <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {unassignedCommittees} unassigned
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Allocation Rules Checklist */}
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <h5 className="font-bold text-slate-900 dark:text-slate-200">Engine Allocation Rules:</h5>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>3 independent dimensions: Constituency, Party, and Committee operate with total autonomy.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Maps official TN Assembly Constituency numbers (1-234) and names with zero duplicates.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Non-destructive by default: preserves existing party ({parties.length} configured), committee, and seat values unless reallocated.</span>
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
              onClick={async () => {
                if (isLocked) return;
                await onExecuteAllocation(0.55);
                onClose();
              }}
              disabled={isLocked}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Full Reallocation (All 3 Dimensions)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
