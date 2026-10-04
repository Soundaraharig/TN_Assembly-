import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Building2,
  FileText,
  User,
  MapPin,
  Clock,
  ShieldAlert,
  History,
  AlertCircle
} from 'lucide-react';
import type { ProceedingsQuestion, UserRole, UserSession } from '../../types';
import { storageService } from '../../services/storageService';
import { canEditProceedingsQuestion } from '../../utils/permissions';

interface EditQuestionModalProps {
  isOpen: boolean;
  question: ProceedingsQuestion | null;
  eventId: string;
  availableMinistries: string[];
  userSession?: UserSession | null;
  userRole?: UserRole | string;
  onClose: () => void;
  onSuccess: (updatedQuestion: ProceedingsQuestion) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  question,
  eventId,
  availableMinistries,
  userSession,
  userRole,
  onClose,
  onSuccess,
  onShowToast
}) => {
  const [ministry, setMinistry] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [bench, setBench] = useState<'Ruling' | 'Opposition'>('Ruling');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setMinistry(question.ministry || question.target_ministry_name || '');
      setQuestionText(question.question_text || '');
      setBench(question.bench || 'Ruling');
      setErrorMessage(null);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const isAuthorized = canEditProceedingsQuestion(userSession?.role || userRole, userSession);

  // Combine and deduplicate ministries to ensure the question's current ministry is always an option
  const ministryOptions = Array.from(
    new Set([
      ...availableMinistries,
      question.ministry,
      question.target_ministry_name
    ].filter(Boolean) as string[])
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setErrorMessage('You are not authorized to edit this question.');
      onShowToast('Unauthorized', 'Only administrators can edit Question Hour questions.', 'error');
      return;
    }

    const trimmedMinistry = ministry.trim();
    if (!trimmedMinistry) {
      setErrorMessage('Please select a Target Ministry.');
      return;
    }

    const trimmedText = questionText.trim();
    if (!trimmedText) {
      setErrorMessage('Question text cannot be empty.');
      return;
    }

    // Check if anything actually changed
    const ministryChanged = trimmedMinistry !== question.ministry;
    const textChanged = trimmedText !== question.question_text;
    const benchChanged = bench !== question.bench;

    if (!ministryChanged && !textChanged && !benchChanged) {
      onShowToast('No Changes', 'No edits were made to this question.', 'info');
      onClose();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await storageService.updateProceedingsQuestion(
        question.id,
        {
          ministry: trimmedMinistry,
          question_text: trimmedText,
          bench
        },
        {
          role: userSession?.role || (typeof userRole === 'string' ? userRole : 'admin'),
          name: userSession?.name || 'Administrator',
          email: userSession?.email,
          activeEventId: eventId
        }
      );

      if (!res.success || !res.question) {
        const err = res.error || 'Failed to save question changes.';
        setErrorMessage(err);
        onShowToast('Save Failed', err, 'error');
        return;
      }

      onShowToast(
        'Question Updated',
        `Target Ministry updated to "${trimmedMinistry}". Status remained "${res.question.status}".`,
        'success'
      );
      onSuccess(res.question);
      onClose();
    } catch (err: any) {
      console.error('[EditQuestionModal] Save error:', err);
      const errText = err?.message || 'An unexpected error occurred while saving.';
      setErrorMessage(errText);
      onShowToast('Error', errText, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'Starred':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'Under Review':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40';
      default:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Edit Question Hour Details
                </h3>
                <span data-testid="modal-question-number" className="font-mono text-xs px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {question.question_number || question.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative correction for Question Hour routing and target ministry
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-5">
          {!isAuthorized && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>You do not have administrative permission to edit this question.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Immutable Metadata Card */}
          <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 space-y-3" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                  <User className="w-3 h-3" /> Student MLA
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {question.student_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Constituency
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 font-mono truncate block">
                  {question.constituency || 'Assembly Delegate'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Submitted At
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] block">
                  {question.created_at ? new Date(question.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Status (Preserved)
                </span>
                <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-black border ${getStatusBadgeClass(question.status)}`}>
                  {question.status}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Requirement: Target Ministry Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                Target Ministry / Minister
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Controls Minister Dashboard routing
              </span>
            </label>
            <div className="relative">
              <select
                id="target-ministry-select"
                data-testid="target-ministry-select"
                disabled={isSaving || !isAuthorized}
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border font-bold text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60 cursor-pointer shadow-xs"
                style={{ borderColor: 'var(--border)' }}
              >
                {ministryOptions.map((min) => (
                  <option key={min} value={min}>
                    {min}
                  </option>
                ))}
              </select>
            </div>
            {question.ministry !== ministry && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-0.5">
                <span>Routing change:</span>
                <span className="line-through text-slate-400">{question.ministry}</span>
                <span>→</span>
                <span className="font-bold underline">{ministry}</span>
              </p>
            )}
          </div>

          {/* Parliamentary Bench Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Parliamentary Bench
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSaving || !isAuthorized}
                onClick={() => setBench('Ruling')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bench === 'Ruling'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ruling Bench
              </button>
              <button
                type="button"
                disabled={isSaving || !isAuthorized}
                onClick={() => setBench('Opposition')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bench === 'Opposition'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Opposition Bench
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Question Text
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              disabled={isSaving || !isAuthorized}
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter question text..."
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60 resize-y shadow-xs"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          {/* Edit History (if any past edits exist) */}
          {question.edit_history && question.edit_history.length > 0 && (
            <div className="p-3.5 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <History className="w-3.5 h-3.5" />
                Administrative Edit History ({question.edit_history.length})
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {question.edit_history.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 border-l-2 border-amber-500/40 pl-2 py-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{entry.field}</span>: {' '}
                    <span className="line-through text-slate-400">{entry.old_value}</span> → <span className="font-semibold text-amber-600 dark:text-amber-400">{entry.new_value}</span>
                    <span className="text-slate-400 block text-[10px]">
                      By {entry.admin_name} ({entry.admin_role}) on {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !isAuthorized}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
