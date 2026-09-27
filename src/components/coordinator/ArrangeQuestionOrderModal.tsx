import React, { useState, useEffect, useMemo } from 'react';
import type { ProceedingsQuestion, UserRole, UserSession } from '../../types';
import { getCanonicalQuestionStatus } from '../../types';
import { storageService } from '../../services/storageService';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Star,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Lock,
  Save,
  X,
  Play,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface ArrangeQuestionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventSlug?: string;
  eventName?: string;
  userRole?: UserRole;
  userSession?: UserSession | null;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ArrangeQuestionOrderModal: React.FC<ArrangeQuestionOrderModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventSlug,
  eventName = 'TN Legislative Assembly',
  userRole,
  userSession,
  onShowToast
}) => {
  const targetKey = eventId || eventSlug || '';

  // Determine if caller is Main Admin / Super Admin authorized to edit
  const isMainAdmin = useMemo(() => {
    const role = (userSession?.role || userRole || '').toLowerCase().trim();
    const email = (userSession?.email || '').toLowerCase().trim();
    return (
      role === 'super_admin' ||
      role === 'coordinator' ||
      role === 'organiser' ||
      email.includes('admin') ||
      email.includes('superadmin') ||
      email.includes('organiser')
    );
  }, [userRole, userSession]);

  // Working list of approved questions
  const [orderedQuestions, setOrderedQuestions] = useState<ProceedingsQuestion[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Full Question View Modal state
  const [inspectQuestion, setInspectQuestion] = useState<ProceedingsQuestion | null>(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load and synchronize questions
  const loadQuestions = () => {
    if (!targetKey) return;
    const allQs = storageService.getProceedingsQuestions(targetKey);
    // ONLY Approved and Starred questions are permitted in Question Calling Order
    const approvedOnly = allQs.filter(q => {
      const canonical = getCanonicalQuestionStatus(q);
      return canonical === 'Approved' || canonical === 'Starred';
    });

    setOrderedQuestions(approvedOnly);
  };

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
      setShowConfirmDialog(false);
      setInspectQuestion(null);
    }
  }, [isOpen, targetKey]);

  // Newly approved questions that do not yet have an assigned calling_order
  const newlyApprovedCount = useMemo(() => {
    return orderedQuestions.filter(q => q.calling_order === undefined).length;
  }, [orderedQuestions]);

  // Check if any questions have already been called or completed
  const hasCompletedOrActiveQuestions = useMemo(() => {
    return orderedQuestions.some(
      q => q.called_status === 'completed' || q.called_status === 'calling'
    );
  }, [orderedQuestions]);

  // Reorder handlers
  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (!isMainAdmin) return;
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= orderedQuestions.length) return;

    // Safety: If source or target is a completed question, do not allow displacing completed history
    const fromQ = orderedQuestions[fromIndex];
    const toQ = orderedQuestions[toIndex];
    if (fromQ.called_status === 'completed' || toQ.called_status === 'completed') {
      onShowToast(
        'Order Locked',
        'Already called / completed questions cannot be moved.',
        'info'
      );
      return;
    }

    const next = [...orderedQuestions];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedQuestions(next);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isMainAdmin) return;
    const q = orderedQuestions[index];
    if (q.called_status === 'completed') {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isMainAdmin || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!isMainAdmin || draggedIndex === null) return;
    e.preventDefault();
    moveQuestion(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Auto-place newly approved questions at the end
  const handleAutoPlaceNewQuestions = () => {
    if (!isMainAdmin) return;
    const ordered = orderedQuestions.filter(q => q.calling_order !== undefined);
    const unordered = orderedQuestions.filter(q => q.calling_order === undefined);
    setOrderedQuestions([...ordered, ...unordered]);
    onShowToast('Questions Placed', 'Newly approved questions positioned at the end of the queue.', 'info');
  };

  // Save handler
  const handleConfirmSave = async () => {
    if (!isMainAdmin || isSaving) return;
    setIsSaving(true);
    try {
      const orderedIds = orderedQuestions.map(q => q.id);
      const res = await storageService.saveQuestionCallingOrder(targetKey, orderedIds, {
        role: userSession?.role || userRole || 'super_admin',
        name: userSession?.name || 'Main Admin'
      });

      if (!res.success) {
        onShowToast('Save Failed', res.error || 'Could not save question order.', 'error');
        return;
      }

      onShowToast('Saved Successfully', 'Question order saved successfully.', 'success');
      setShowConfirmDialog(false);
      onClose();
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to persist official order.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden bg-slate-900 border-slate-700 text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                QUESTION CALLING ORDER
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">{eventName}</span>
              <span>•</span>
              <span>Parliamentary Question Hour Calling Sequence</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isMainAdmin && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Read-Only View
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Read-Only Notice for Volunteers / Administrators */}
        {!isMainAdmin && (
          <div className="px-6 py-2.5 bg-sky-950/40 border-b border-sky-800/40 flex items-center gap-2 text-xs text-sky-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
            <span>
              Official question calling order is published and managed by Main Admin. You have view-only access.
            </span>
          </div>
        )}

        {/* Newly Approved Questions Alert Banner */}
        {newlyApprovedCount > 0 && isMainAdmin && (
          <div className="px-6 py-3 bg-amber-950/50 border-b border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
              <span>
                <strong>{newlyApprovedCount} newly approved question{newlyApprovedCount > 1 ? 's' : ''}</strong> need ordering.
                They are placed at the bottom and will not disturb the published order until saved.
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoPlaceNewQuestions}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 self-start sm:self-auto cursor-pointer"
            >
              Place at End
            </button>
          </div>
        )}

        {/* Active Session Warning */}
        {hasCompletedOrActiveQuestions && isMainAdmin && (
          <div className="px-6 py-2.5 bg-purple-950/40 border-b border-purple-800/40 flex items-center gap-2 text-xs text-purple-200">
            <Play className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>
              Question Hour is currently in progress. Completed and active questions are anchored in history.
              You may reorder the remaining uncalled questions.
            </span>
          </div>
        )}

        {/* Order List Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {orderedQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-300">No Approved Questions Available</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Only questions that have reached <strong>APPROVED</strong> or <strong>STARRED</strong> status by Main Admin appear in the official calling order.
              </p>
            </div>
          ) : (
            orderedQuestions.map((q, idx) => {
              const displayOrder = idx + 1;
              const isCompleted = q.called_status === 'completed';
              const isCalling = q.called_status === 'calling';
              const isNewlyApproved = q.calling_order === undefined;
              const isDragging = draggedIndex === idx;
              const isDragOver = dragOverIndex === idx;

              return (
                <div
                  key={q.id}
                  draggable={isMainAdmin && !isCompleted}
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group relative p-4 rounded-2xl border transition-all duration-150 flex items-center gap-3 md:gap-4 ${
                    isCompleted
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : isCalling
                        ? 'bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/20 shadow-lg shadow-amber-950/40'
                        : isDragOver
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]'
                          : isDragging
                            ? 'opacity-40 border-dashed border-amber-500 bg-slate-800'
                            : isNewlyApproved
                              ? 'bg-amber-950/15 border-amber-800/40 hover:border-amber-700/60'
                              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  {/* Drag Handle (Admins only, uncompleted only) */}
                  {isMainAdmin && !isCompleted ? (
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 p-1"
                      title="Drag up or down to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-5 shrink-0 text-slate-600 flex justify-center">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  )}

                  {/* Position Badge */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-inner ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isCalling
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-pulse'
                            : 'bg-slate-950 text-amber-400 border border-slate-700'
                      }`}
                    >
                      #{displayOrder}
                    </span>
                  </div>

                  {/* Question Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-white truncate">
                        {q.student_name}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.bench === 'Ruling'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {q.bench}
                      </span>

                      {q.constituency && (
                        <span className="text-xs text-slate-400 font-mono">
                          {q.constituency}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {q.ministry}
                      </span>

                      {q.status === 'Starred' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Starred
                        </span>
                      )}

                      {/* State Badges */}
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Called & Answered
                        </span>
                      )}
                      {isCalling && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 animate-pulse">
                          Current Question
                        </span>
                      )}
                      {isNewlyApproved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Newly Approved
                        </span>
                      )}
                    </div>

                    {/* Question text snippet */}
                    <p className="text-xs text-slate-300 line-clamp-1 italic">
                      "{q.question_text}"
                    </p>
                  </div>

                  {/* Actions: View Full & Up/Down buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectQuestion(q)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="View Full Question Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">View Full</span>
                    </button>

                    {isMainAdmin && !isCompleted && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0 || orderedQuestions[idx - 1]?.called_status === 'completed'}
                          onClick={() => moveQuestion(idx, idx - 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedQuestions.length - 1}
                          onClick={() => moveQuestion(idx, idx + 1)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>
              Total Approved Questions: <strong className="text-white font-mono">{orderedQuestions.length}</strong>
            </span>
            {hasCompletedOrActiveQuestions && (
              <span className="ml-2 text-emerald-400">
                • {orderedQuestions.filter(q => q.called_status === 'completed').length} completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
            >
              Close
            </button>

            {isMainAdmin && (
              <button
                type="button"
                disabled={orderedQuestions.length === 0}
                onClick={() => setShowConfirmDialog(true)}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Question Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 bg-slate-900 border-slate-700 text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                SAVE QUESTION ORDER?
              </h3>
            </div>

            <div className="space-y-2 text-xs md:text-sm text-slate-300 leading-relaxed">
              {hasCompletedOrActiveQuestions ? (
                <>
                  <p className="font-semibold text-amber-300">
                    Some questions have already been called.
                  </p>
                  <p>
                    Changing the order will affect the remaining questions only. Already called questions will not be reset.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    This will set the official Speaker calling order for <strong>{eventName}</strong>.
                  </p>
                  <p className="text-slate-400">
                    Questions will be called by the Speaker according to this sequence.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>
                    {hasCompletedOrActiveQuestions ? 'Update Remaining Order' : 'Save Order'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Question Inspection View Modal (Requirement 20) */}
      {inspectQuestion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 bg-slate-900 border-slate-700 text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Full Parliamentary Question</h3>
                  <p className="text-xs text-slate-400">Order Position #{orderedQuestions.findIndex(q => q.id === inspectQuestion.id) + 1}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Member Name</span>
                  <div className="font-bold text-white text-sm mt-0.5">{inspectQuestion.student_name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bench & Constituency</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {inspectQuestion.bench} • {inspectQuestion.constituency || 'General Assembly'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Target Ministry</span>
                  <div className="font-bold text-amber-400 mt-0.5">{inspectQuestion.ministry}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Question Type</span>
                  <div className="font-bold text-slate-200 mt-0.5">{inspectQuestion.question_type || 'Standard'}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Full Question Text</span>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-wrap">
                  "{inspectQuestion.question_text}"
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Status: <strong className="text-emerald-400">{inspectQuestion.status}</strong></span>
                {inspectQuestion.approved_by && (
                  <span>Approved by: <strong className="text-white">{inspectQuestion.approved_by}</strong></span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
