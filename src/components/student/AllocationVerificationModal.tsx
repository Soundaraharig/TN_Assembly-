import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Building2, Users, MapPin, Landmark, Award } from 'lucide-react';
import type { Learner } from '../../types';
import { storageService } from '../../services/storageService';

interface AllocationVerificationModalProps {
  isOpen: boolean;
  student: Learner;
  eventId: string;
  onConfirmed: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AllocationVerificationModal: React.FC<AllocationVerificationModalProps> = ({
  isOpen,
  student,
  eventId,
  onConfirmed,
  onShowToast
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const partyName = student.party_name || 'Independent / Unassigned';
  const committeeName = student.committee_name || 'Standing Committee';
  const constName = student.constituency_name || 'Assembly General';
  const constNumber = student.constituency_number !== undefined && student.constituency_number !== null
    ? `#${student.constituency_number}`
    : 'Not Assigned';
  const bench = student.bench || 'Ruling';
  const isRuling = bench === 'Ruling';

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await storageService.confirmStudentAllocation(
        student.id,
        eventId,
        student.access_code
      );

      if (res.success) {
        onShowToast(
          'Allocation Verified',
          'Your official assembly allocation has been confirmed and saved.',
          'success'
        );
        onConfirmed();
      } else {
        const err = res.error || 'Failed to verify allocation. Please try again.';
        setErrorMessage(err);
        onShowToast('Verification Failed', err, 'error');
      }
    } catch (err: any) {
      const errStr = err?.message || 'An unexpected error occurred during confirmation.';
      setErrorMessage(errStr);
      onShowToast('Verification Error', errStr, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="allocation-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Background glow styling */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-inner mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 id="allocation-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Allocation Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Hon&apos;ble Member <strong>{student.full_name}</strong>, please verify your official parliamentary allocation before proceeding to the Assembly Floor.
          </p>
        </div>

        {/* Allocation Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          {/* Party */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-blue-500" /> Political Party
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {partyName}
            </p>
          </div>

          {/* Bench */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Landmark className="w-3.5 h-3.5 text-amber-500" /> Parliamentary Bench
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isRuling ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-sm font-extrabold ${isRuling ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {bench} Bench
              </span>
            </div>
          </div>

          {/* Committee */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Users className="w-3.5 h-3.5 text-purple-500" /> House Committee
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {committeeName}
            </p>
          </div>

          {/* Constituency */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Constituency & No.
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              <span className="font-mono text-amber-500 mr-1">{constNumber}</span>
              {constName}
            </p>
          </div>
        </div>

        {/* Delegate Meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-slate-400" /> Access Code: <strong className="font-mono">{student.access_code}</strong>
          </span>
          <span>Role: <strong className="text-slate-700 dark:text-slate-200">{student.role || 'Member of Legislative Assembly'}</strong></span>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirm Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide text-white bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>SAVING VERIFICATION...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>I HAVE CHECKED MY ALLOCATION</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
