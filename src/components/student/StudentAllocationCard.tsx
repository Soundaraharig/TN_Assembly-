import React, { useState, useEffect, useMemo } from 'react';
import type { Learner, CollegeEvent, LearnerAllocationConfirmation, AllocationCheckStatus } from '../../types';
import {
  storageService,
  getAllocationCheckStatus,
  isAllocationComplete
} from '../../services/storageService';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Shield,
  BookOpen,
  MapPin,
  Hash,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface StudentAllocationCardProps {
  student: Learner;
  event: CollegeEvent | null;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function formatCheckedDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}

export const StudentAllocationCard: React.FC<StudentAllocationCardProps> = ({
  student,
  event,
  onShowToast
}) => {
  const eventId = event?.id || student.event_id;

  const [confirmation, setConfirmation] = useState<LearnerAllocationConfirmation | null>(() => {
    return storageService.getAllocationConfirmations(eventId).find(c => c.learner_id === student.id) || null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync confirmation on mount or whenever student/eventId changes
  useEffect(() => {
    const local = storageService.getAllocationConfirmations(eventId).find(c => c.learner_id === student.id);
    if (local) setConfirmation(local);

    // Fetch authoritative state from database
    if (eventId && student.id) {
      storageService.fetchStudentAllocationConfirmation(student.id, eventId).then(remote => {
        if (remote) setConfirmation(remote);
      }).catch(() => {});
    }

    const unsub = storageService.subscribe(() => {
      const updated = storageService.getAllocationConfirmations(eventId).find(c => c.learner_id === student.id);
      setConfirmation(updated || null);
    });
    return unsub;
  }, [student.id, eventId]);

  const checkStatus: AllocationCheckStatus = useMemo(() => {
    return getAllocationCheckStatus(student, confirmation);
  }, [student, confirmation]);

  const isComplete = useMemo(() => {
    return isAllocationComplete(student);
  }, [student]);

  const handleConfirm = async () => {
    if (isSaving) return;
    if (!isComplete) {
      onShowToast('Allocation Incomplete', 'Your allocation details are incomplete. Please contact your coordinator.', 'error');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await storageService.confirmStudentAllocation(student.id, eventId, student.access_code);
      if (res.success && res.confirmation) {
        setConfirmation(res.confirmation);
        onShowToast('Allocation Checked', 'Your allocation has been checked successfully.', 'success');
      } else {
        const errMsg = res.error || 'Unable to save your confirmation. Please try again.';
        setSaveError(errMsg);
        onShowToast('Confirmation Failed', errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Unable to save your confirmation. Please try again.';
      setSaveError(errMsg);
      onShowToast('Confirmation Error', errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isRuling = student.bench?.toLowerCase() === 'ruling';
  const isOpposition = student.bench?.toLowerCase() === 'opposition';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 p-6 md:p-8 shadow-xl space-y-6 transition-colors">
      
      {/* Top Header & Live Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/40">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
              Official Allocation Verification
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              YOUR ALLOCATION
            </h2>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex items-center gap-2">
          {checkStatus === 'CHECKED' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-center flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wider">
                ✓ CHECKED
              </span>
            </div>
          )}

          {checkStatus === 'NEEDS RE-CHECK' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-center flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs uppercase text-amber-700 dark:text-amber-400 font-extrabold tracking-wider">
                ! NEEDS RE-CHECK
              </span>
            </div>
          )}

          {checkStatus === 'NOT CHECKED' && (
            <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-center flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs uppercase text-slate-600 dark:text-slate-300 font-extrabold tracking-wider">
                ○ NOT CHECKED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Incomplete Allocation Alert */}
      {!isComplete && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-extrabold">Allocation Incomplete</h5>
            <p className="text-slate-600 dark:text-slate-300">
              One or more required allocation details are not yet assigned. Confirmation is disabled until your complete allocation is configured.
            </p>
          </div>
        </div>
      )}

      {/* Allocation Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Party */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Party
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {student.party_name && student.party_name.trim() ? student.party_name : (
              <span className="text-rose-500 font-semibold italic">Not Assigned</span>
            )}
          </p>
        </div>

        {/* 2. Committee */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Committee
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {student.committee_name && student.committee_name.trim() ? student.committee_name : (
              <span className="text-rose-500 font-semibold italic">Not Assigned</span>
            )}
          </p>
        </div>

        {/* 3. Constituency Name */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Constituency
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {student.constituency_name && student.constituency_name.trim() ? student.constituency_name : (
              <span className="text-rose-500 font-semibold italic">Not Assigned</span>
            )}
          </p>
        </div>

        {/* 4. Constituency Number */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-purple-500" /> Constituency Number
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {student.constituency_number !== undefined && student.constituency_number !== null ? (
              `#${student.constituency_number}`
            ) : (
              <span className="text-rose-500 font-semibold italic font-sans">Not Assigned</span>
            )}
          </p>
        </div>

        {/* 5. Bench */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Bench
            </span>
          </div>
          <div className="flex items-center gap-2">
            {student.bench && student.bench.trim() ? (
              <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wide border ${
                isRuling
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : isOpposition
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {student.bench} Bench
              </span>
            ) : (
              <span className="text-rose-500 font-semibold italic text-sm">Not Assigned</span>
            )}
          </div>
        </div>

      </div>

      {/* Save Error Alert if any */}
      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Confirmation Action Section */}
      <div className="pt-2">
        {checkStatus === 'CHECKED' && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  ✓ Allocation Checked
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Checked on: <strong className="text-slate-900 dark:text-slate-200">{formatCheckedDate(confirmation?.checked_at)}</strong>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              Permanently Recorded
            </span>
          </div>
        )}

        {checkStatus === 'NEEDS RE-CHECK' && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                  Allocation changed after previous confirmation — please verify and confirm again.
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Previous confirmation was at: <strong className="text-slate-800 dark:text-slate-200">{formatCheckedDate(confirmation?.checked_at)}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-amber-500/20">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please review your updated Party, Committee, Constituency, and Bench before re-confirming.
              </p>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving || !isComplete}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> I HAVE CHECKED MY ALLOCATION
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {checkStatus === 'NOT CHECKED' && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> CHECK YOUR ALLOCATION
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please carefully verify all the above details.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving || !isComplete}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> I HAVE CHECKED MY ALLOCATION
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
