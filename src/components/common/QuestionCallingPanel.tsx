import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ProceedingsQuestion, Learner } from '../../types';
import { storageService } from '../../services/storageService';
import { formatMemberConstituency } from '../../utils/memberIdentity';
import {
  Play,
  Eye,
  Tv,
  CheckCircle2,
  ArrowUpDown,
  MessageSquare,
  Star,
  X
} from 'lucide-react';

export interface QuestionCallingPanelProps {
  eventId: string;
  userRole?: string; // 'super_admin' | 'coordinator' | 'Assembly Speaker' | 'Deputy Speaker' | etc.
  userName?: string;
  learners?: Learner[];
  onOpenArrangeModal?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuestionCallingPanel: React.FC<QuestionCallingPanelProps> = ({
  eventId,
  userRole = 'super_admin',
  userName = 'Presiding Officer',
  learners = [],
  onOpenArrangeModal,
  onShowToast
}) => {
  const [questionsList, setQuestionsList] = useState<ProceedingsQuestion[]>(() =>
    eventId
      ? storageService.getProceedingsQuestions(eventId).filter(
          q => q.status === 'Approved' || q.status === 'Starred'
        )
      : []
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(() =>
    eventId ? storageService.getActiveQuestionId(eventId) : null
  );
  const [inspectQuestion, setInspectQuestion] = useState<ProceedingsQuestion | null>(null);
  const [isCallingNextQ, setIsCallingNextQ] = useState<boolean>(false);
  const [isCompletingQ, setIsCompletingQ] = useState<boolean>(false);

  const isMainAdmin =
    userRole === 'super_admin' ||
    userRole === 'admin' ||
    userRole?.toLowerCase().includes('super') ||
    userRole?.toLowerCase().includes('coordinator');

  // Synchronize questions from authoritative storage
  const syncQuestions = useCallback(() => {
    if (!eventId) return;
    const qs = storageService.getProceedingsQuestions(eventId).filter(
      q => q.status === 'Approved' || q.status === 'Starred'
    );
    setQuestionsList(qs);
    setActiveQuestionId(storageService.getActiveQuestionId(eventId));
  }, [eventId]);

  useEffect(() => {
    syncQuestions();
    const unsub = storageService.subscribe(syncQuestions);
    const handleQUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail?.eventId || detail.eventId === eventId) {
        syncQuestions();
      }
    };
    window.addEventListener('tn_assembly_proceedings_question_update', handleQUpdate as EventListener);
    window.addEventListener('storage', syncQuestions);
    return () => {
      unsub();
      window.removeEventListener('tn_assembly_proceedings_question_update', handleQUpdate as EventListener);
      window.removeEventListener('storage', syncQuestions);
    };
  }, [eventId, syncQuestions]);

  const learnersMap = useMemo(() => {
    return new Map<string, Learner>(learners.map(l => [l.id, l]));
  }, [learners]);

  const activeQuestion = useMemo(() => {
    return (
      questionsList.find(q => q.id === activeQuestionId) ||
      questionsList.find(q => q.called_status === 'calling') ||
      null
    );
  }, [questionsList, activeQuestionId]);

  const uncalledQuestions = useMemo(() => {
    return questionsList.filter(
      q => q.called_status !== 'completed' && q.id !== activeQuestion?.id
    );
  }, [questionsList, activeQuestion]);

  const nextQuestionToCall = useMemo(() => {
    return uncalledQuestions[0] || null;
  }, [uncalledQuestions]);

  const completedQuestionsList = useMemo(() => {
    return questionsList.filter(q => q.called_status === 'completed');
  }, [questionsList]);

  // Upcoming items to display below the current / next card
  const upcomingQueue = useMemo(() => {
    return activeQuestion ? uncalledQuestions : uncalledQuestions.slice(1);
  }, [activeQuestion, uncalledQuestions]);

  // Action: CALL QUESTION
  const handleCallQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId || isCallingNextQ) return;
    setIsCallingNextQ(true);
    try {
      await storageService.setActiveQuestion(eventId, q.id, {
        role: userRole,
        name: userName
      });
      syncQuestions();
      onShowToast(
        'Question Called',
        `Question #${q.calling_order || q.queue_order || 1} by ${q.student_name} called to floor and projected.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to call question.', 'error');
    } finally {
      setIsCallingNextQ(false);
    }
  };

  // Action: SET AS CURRENT
  const handleSetAsCurrentQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId) return;
    try {
      await storageService.setActiveQuestion(eventId, q.id, {
        role: userRole,
        name: userName
      });
      syncQuestions();
      onShowToast(
        'Current Question Set',
        `Question #${q.calling_order || q.queue_order || 1} (${q.student_name}) is now the official current question.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to set current question.', 'error');
    }
  };

  // Action: MARK ANSWERED & NEXT
  const handleCompleteQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId || isCompletingQ) return;
    setIsCompletingQ(true);
    try {
      await storageService.completeActiveQuestion(eventId, q.id, {
        role: userRole,
        name: userName
      });
      syncQuestions();
      onShowToast(
        'Question Answered',
        `Question #${q.calling_order || q.queue_order || 1} answered and completed. Advanced to next official question.`,
        'info'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to complete question.', 'error');
    } finally {
      setIsCompletingQ(false);
    }
  };

  // Action: YIELD
  const handleSkipQuestion = async (q: ProceedingsQuestion) => {
    if (!eventId) return;
    try {
      await storageService.skipActiveQuestion(eventId, q.id, {
        role: userRole,
        name: userName
      });
      syncQuestions();
      onShowToast('Question Yielded', 'Active question returned to uncalled status.', 'info');
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to yield question.', 'error');
    }
  };

  // Action: PROJECT SLIDE
  const handleProjectSlide = (q: ProceedingsQuestion) => {
    if (!eventId) return;
    const ps = storageService.getProjectorSettings(eventId);
    storageService.saveProjectorSettings(eventId, {
      ...ps,
      activeQuestionId: q.id,
      displayScene: 'question_hour'
    });
    onShowToast('Projector Updated', 'Displaying Question Hour slide on auditorium projector', 'info');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            🎙️ Question Calling Order
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {questionsList.length} approved
          </span>
          {completedQuestionsList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {completedQuestionsList.length} answered
            </span>
          )}
        </div>

        {/* Admin-only Arrange Order Trigger */}
        {isMainAdmin && onOpenArrangeModal && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenArrangeModal}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
              <span>Arrange Order</span>
            </button>
          </div>
        )}
      </div>

      {/* ── CURRENT ACTIVE QUESTION BANNER (When a question is active) ── */}
      {activeQuestion ? (
        <div className="p-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/50 dark:via-amber-950/20 space-y-3 shadow-md shadow-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                NOW ON FLOOR
              </span>
              <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                #{activeQuestion.calling_order || activeQuestion.queue_order || 1}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleProjectSlide(activeQuestion)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Display slide on auditorium projector"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Project Slide</span>
              </button>
              <button
                type="button"
                onClick={() => handleSkipQuestion(activeQuestion)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors"
              >
                Yield
              </button>
              <button
                type="button"
                disabled={isCompletingQ}
                onClick={() => handleCompleteQuestion(activeQuestion)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCompletingQ ? 'Advancing...' : 'Mark Answered & Next'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-base text-slate-900 dark:text-white">
                {activeQuestion.student_name}
              </span>
              {formatMemberConstituency(activeQuestion, learnersMap) && (
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatMemberConstituency(activeQuestion, learnersMap)}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeQuestion.bench === 'Ruling'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {activeQuestion.bench}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {activeQuestion.ministry}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-serif italic pt-1">
              "{activeQuestion.question_text}"
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInspectQuestion(activeQuestion)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>VIEW FULL QUESTION</span>
          </button>
        </div>
      ) : nextQuestionToCall ? (
        /* ── NEXT QUESTION CARD (When floor is open) ── */
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                NEXT QUESTION
              </span>
              <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                #{nextQuestionToCall.calling_order || nextQuestionToCall.queue_order || 1}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {nextQuestionToCall.student_name}
              </span>
              {formatMemberConstituency(nextQuestionToCall, learnersMap) && (
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatMemberConstituency(nextQuestionToCall, learnersMap)}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  nextQuestionToCall.bench === 'Ruling'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {nextQuestionToCall.bench}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {nextQuestionToCall.ministry}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1">
              "{nextQuestionToCall.question_text}"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              disabled={isCallingNextQ}
              onClick={() => handleCallQuestion(nextQuestionToCall)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all self-stretch sm:self-auto shrink-0 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>CALL QUESTION</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetAsCurrentQuestion(nextQuestionToCall)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-colors self-stretch sm:self-auto shrink-0"
              title="Designate as official current question"
            >
              <span>SET AS CURRENT</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectQuestion(nextQuestionToCall)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors self-stretch sm:self-auto shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>VIEW FULL</span>
            </button>
          </div>
        </div>
      ) : questionsList.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          No approved questions available for Question Hour yet.
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          All approved questions have been called and answered!
        </div>
      )}

      {/* ── UPCOMING OFFICIAL QUEUE ── */}
      {upcomingQueue.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>UPCOMING OFFICIAL QUEUE ({upcomingQueue.length})</span>
            <span className="text-slate-500">Deterministic sequence</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {upcomingQueue.map((q, idx) => (
              <div
                key={q.id}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    #{q.calling_order || (idx + (activeQuestion ? 1 : 2))}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 break-words">
                      {q.student_name}
                    </span>
                    {formatMemberConstituency(q, learnersMap) && (
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold break-words">
                        {formatMemberConstituency(q, learnersMap)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      q.bench === 'Ruling'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {q.bench}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 hidden sm:inline">
                    {q.ministry}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetAsCurrentQuestion(q)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer transition-colors"
                    title="Set as authoritative current question"
                  >
                    SET AS CURRENT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallQuestion(q)}
                    className="px-2 py-1 rounded-lg text-[10px] font-black uppercase text-slate-950 bg-amber-500 hover:bg-amber-400 cursor-pointer transition-colors"
                    title="Call immediately to floor"
                  >
                    CALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectQuestion(q)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    VIEW
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPLETED QUESTIONS LIST ── */}
      {completedQuestionsList.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>COMPLETED QUESTIONS ({completedQuestionsList.length})</span>
            <span className="text-emerald-500 font-bold">Answered</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {completedQuestionsList.map(q => (
              <div
                key={q.id}
                className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/30 flex items-center justify-between gap-2 text-xs opacity-75"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    #{q.calling_order || q.queue_order || '?'}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                    {q.student_name}
                  </span>
                  {formatMemberConstituency(q, learnersMap) && (
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold hidden sm:inline">
                      ({formatMemberConstituency(q, learnersMap)})
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px] truncate hidden md:inline">{q.ministry}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectQuestion(q)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1 transition-colors shrink-0"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FULL QUESTION INSPECTION MODAL ── */}
      {inspectQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setInspectQuestion(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Full Parliamentary Question</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order Position #{questionsList.findIndex(q => q.id === inspectQuestion.id) + 1} of {questionsList.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Member Name</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{inspectQuestion.student_name}</div>
                  {formatMemberConstituency(inspectQuestion, learnersMap) && (
                    <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatMemberConstituency(inspectQuestion, learnersMap)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bench</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inspectQuestion.bench === 'Ruling'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {inspectQuestion.bench}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Constituency</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 font-mono">
                    {formatMemberConstituency(inspectQuestion, learnersMap) || inspectQuestion.constituency || 'General Assembly'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Target Ministry</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">{inspectQuestion.ministry}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Question Type</span>
                  <div className="font-bold text-slate-700 dark:text-slate-200 text-sm mt-0.5 flex items-center gap-1.5">
                    {inspectQuestion.question_type || 'Standard'}
                    {inspectQuestion.status === 'Starred' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Calling Status</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        inspectQuestion.called_status === 'calling'
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : inspectQuestion.called_status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {inspectQuestion.called_status === 'calling'
                        ? 'CURRENT'
                        : inspectQuestion.called_status === 'completed'
                          ? 'ANSWERED'
                          : 'QUEUED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Full Question Text</span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-wrap break-words">
                  "{inspectQuestion.question_text}"
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span>
                    Approval Status:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">{inspectQuestion.status}</strong>
                  </span>
                  {inspectQuestion.approved_by && (
                    <span>
                      Approved by:{' '}
                      <strong className="text-slate-700 dark:text-white">{inspectQuestion.approved_by}</strong>
                    </span>
                  )}
                </div>
                {inspectQuestion.created_at && (
                  <div className="flex items-center justify-between">
                    <span>
                      Submitted:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {new Date(inspectQuestion.created_at).toLocaleString()}
                      </strong>
                    </span>
                    {inspectQuestion.approved_at && (
                      <span>
                        Approved:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {new Date(inspectQuestion.approved_at).toLocaleString()}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectQuestion(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white cursor-pointer transition-colors"
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
