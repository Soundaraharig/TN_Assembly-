import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BillProceeding, Learner, EventDeadline, ProceedingsQuestion, ProceedingsMotion, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { getEventSlug } from '../../utils/slug';
import {
  FileText,
  Plus,
  HelpCircle,
  Clock,
  Send,
  Download,
  Printer,
  Tv,
  Star,
  Check,
  X,
  Trash2,
  Users,
  Building2,
  RefreshCw,
  Lock,
  Unlock,
  Eye
} from 'lucide-react';

interface ProceedingsTabProps {
  proceedings: BillProceeding[];
  learners: Learner[];
  eventId: string;
  eventSlug?: string;
  userRole?: UserRole;
  onAddBill: (bill: Partial<BillProceeding>) => void;
  onUpdateBillStatus: (id: string, status: BillProceeding['status'], ayes?: number, noes?: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProceedingsTab: React.FC<ProceedingsTabProps> = ({
  proceedings,
  learners,
  eventId,
  eventSlug,
  userRole,
  onAddBill,
  onUpdateBillStatus,
  onShowToast
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'questions' | 'motions' | 'bills') || 'questions';

  const authoritativeEventId = eventId || (eventSlug ? storageService.getEvents().find(e => (e.slug && e.slug.toLowerCase() === eventSlug.toLowerCase()) || getEventSlug(e).toLowerCase() === eventSlug.toLowerCase())?.id : undefined) || '';
  const targetSlug = authoritativeEventId || eventSlug || '';

  // Deadlines & Data State
  const [deadline, setDeadline] = useState<EventDeadline>(() => storageService.getEventDeadline(authoritativeEventId || eventSlug || ''));
  const [questions, setQuestions] = useState<ProceedingsQuestion[]>(() => storageService.getProceedingsQuestions(authoritativeEventId || eventSlug || ''));
  const [motions, setMotions] = useState<ProceedingsMotion[]>(() => storageService.getProceedingsMotions(authoritativeEventId || eventSlug || ''));
  const [isTogglingDeadline, setIsTogglingDeadline] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ProceedingsQuestion | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Submitted' | 'Under Review' | 'Approved' | 'Starred' | 'Rejected'>('All');
  const [benchFilter, setBenchFilter] = useState<'All' | 'Ruling' | 'Opposition'>('All');
  const [ministryFilter, setMinistryFilter] = useState<string>('All');

  // Dynamic ministries from Cabinet configuration and submitted questions
  const availableMinistries = useMemo(() => {
    const fromConfig = authoritativeEventId ? storageService.getCabinetMinistries(authoritativeEventId) : [];
    const fromQuestions = questions.map(q => q.ministry).filter(Boolean);
    return Array.from(new Set([...fromConfig, ...fromQuestions]));
  }, [authoritativeEventId, questions]);

  // Modals & Inputs
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billSummary, setBillSummary] = useState('');
  const [billIntroducerId, setBillIntroducerId] = useState('');

  const [isAddMotionOpen, setIsAddMotionOpen] = useState(false);
  const [motionTitle, setMotionTitle] = useState('');
  const [motionProposer, setMotionProposer] = useState('');
  const [motionBench, setMotionBench] = useState<'Ruling' | 'Opposition'>('Ruling');
  const [motionRoom, setMotionRoom] = useState('General Assembly Chamber');
  const [motionContent, setMotionContent] = useState('');

  // Selected Committee Room Filter for Motions
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Sync data on tab or storage updates
  const refreshData = () => {
    const key = authoritativeEventId || eventSlug || '';
    setDeadline(storageService.getEventDeadline(key));
    setQuestions(storageService.getProceedingsQuestions(key));
    setMotions(storageService.getProceedingsMotions(key));
  };

  useEffect(() => {
    refreshData();

    // On-demand authoritative fetch from Supabase
    const fetchTarget = authoritativeEventId || eventSlug;
    if (fetchTarget) {
      storageService.fetchProceedingsQuestionsOnDemand(fetchTarget).then(fetchedQs => {
        console.log('[Proceedings] eventId =', authoritativeEventId, 'returned questions =', fetchedQs.length);
        refreshData();
      }).catch(err => {
        console.warn('[Proceedings] fetch error:', err);
      });
    }

    const unsub = storageService.subscribe(() => {
      refreshData();
      setSelectedQuestion(prev => {
        if (!prev) return null;
        const fresh = storageService.getProceedingsQuestions(authoritativeEventId || eventSlug || '').find(q => q.id === prev.id);
        return fresh || null;
      });
    });

    const handleQuestionUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.eventId || detail.eventId === authoritativeEventId || detail.eventId === eventId) {
        refreshData();
        setSelectedQuestion(prev => {
          if (!prev) return null;
          const fresh = storageService.getProceedingsQuestions(authoritativeEventId || eventSlug || '').find(q => q.id === prev.id);
          return fresh || null;
        });
      }
    };

    window.addEventListener('tn_assembly_proceedings_question_update', handleQuestionUpdate as EventListener);
    window.addEventListener('storage', refreshData);

    return () => {
      unsub();
      window.removeEventListener('tn_assembly_proceedings_question_update', handleQuestionUpdate as EventListener);
      window.removeEventListener('storage', refreshData);
    };
  }, [authoritativeEventId, eventSlug, eventId]);

  const setTab = (tab: 'questions' | 'motions' | 'bills') => {
    setSearchParams({ tab });
  };

  // Deadline Handlers
  const handleToggleQuestionStatus = async (isOpen: boolean) => {
    if (isTogglingDeadline) return;
    setIsTogglingDeadline(true);
    try {
      const updated = storageService.updateEventDeadlineStatus(targetSlug, isOpen, eventId);
      setDeadline(updated);
      onShowToast(
        isOpen ? 'Question Submissions Opened' : 'Question Submissions Closed',
        isOpen ? 'Student delegates can now submit questions for Question Hour.' : 'Question submission window is now locked for students.',
        isOpen ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Failed to toggle submission window:', err);
      onShowToast('Sync Error', 'Failed to update submission window status. Please try again.', 'error');
    } finally {
      setIsTogglingDeadline(false);
    }
  };

  // Question Actions with toggle support
  const handleUpdateQuestionStatus = (id: string, actionStatus: 'Submitted' | 'Under Review' | 'Approved' | 'Starred' | 'Rejected') => {
    const targetQ = questions.find(q => q.id === id);
    const currentStatus = normalizeStatus(targetQ?.status);

    // Toggle: if already in this state, clicking it reverts back to Submitted (Pending)
    const nextStatus = currentStatus === actionStatus ? 'Submitted' : actionStatus;
    const actorName = 'Speaker / Admin';

    const res = storageService.updateProceedingsQuestionStatus(
      id,
      nextStatus,
      actorName,
      eventId || targetSlug,
      { role: userRole || 'super_admin', name: actorName }
    );

    if (!res.success) {
      onShowToast('Action Blocked', res.error || 'Unauthorized action.', 'error');
      return;
    }

    // Keep modal state in sync if open
    setSelectedQuestion(prev => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        status: nextStatus,
        approved_by: nextStatus === 'Approved' ? actorName : prev.approved_by,
        approved_at: nextStatus === 'Approved' ? new Date().toISOString() : prev.approved_at
      };
    });

    refreshData();
    onShowToast(
      'Status Updated',
      nextStatus === 'Submitted'
        ? 'Question status reverted to Pending Approval'
        : `Question status changed to ${nextStatus}`,
      'success'
    );
  };

  const handleDeleteQuestion = (id: string) => {
    // Immediate optimistic UI update
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedQuestion?.id === id) {
      setSelectedQuestion(null);
    }
    storageService.deleteProceedingsQuestion(id, eventId || targetSlug);
    refreshData();
    onShowToast('Question Deleted', 'Removed question from floor queue', 'info');
  };

  // Motion Submissions
  const handleAddMotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motionTitle.trim()) return;

    storageService.addProceedingsMotion({
      event_slug: targetSlug,
      title: motionTitle.trim(),
      proposed_by: motionProposer.trim() || 'Hon. Member',
      bench: motionBench,
      committee_room: motionRoom,
      content: motionContent.trim() || 'Motion submitted for floor reading',
      status: 'Submitted'
    });

    setIsAddMotionOpen(false);
    setMotionTitle('');
    setMotionContent('');
    refreshData();
    onShowToast('Motion Tabled', 'Submitted new legislative motion', 'success');
  };

  // Export & Action Bar Helpers — Full un-truncated database field with BOM
  const handleExportCSV = () => {
    const headers = [
      '#',
      'Student Name',
      'Party',
      'Committee',
      'Bench',
      'Constituency',
      'Constituency Number',
      'Target Ministry',
      'Question Type',
      'Status',
      'Queue',
      'Question Text',
      'Submitted At',
      'Approved At',
      'Approved By'
    ];
    const rows = questions.map((q, idx) => {
      const submitter = learners.find(
        l => l.id === q.student_id || l.full_name?.toLowerCase() === q.student_name?.toLowerCase()
      );
      return [
        idx + 1,
        `"${(q.student_name || '').replace(/"/g, '""')}"`,
        `"${(submitter?.party_name || '').replace(/"/g, '""')}"`,
        `"${(submitter?.committee_name || '').replace(/"/g, '""')}"`,
        `"${(q.bench || '').replace(/"/g, '""')}"`,
        `"${(submitter?.constituency_name || q.constituency || '').replace(/"/g, '""')}"`,
        `"${submitter?.constituency_number !== undefined ? submitter.constituency_number : ''}"`,
        `"${(q.ministry || '').replace(/"/g, '""')}"`,
        `"${(q.question_type || '').replace(/"/g, '""')}"`,
        `"${(q.status || '').replace(/"/g, '""')}"`,
        `"${q.queue_order || idx + 1}"`,
        `"${(q.question_text || '').replace(/"/g, '""')}"`,
        `"${q.created_at || ''}"`,
        `"${q.approved_at || ''}"`,
        `"${(q.approved_by || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `proceedings_questions_${targetSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('CSV Exported', `Exported ${questions.length} questions to CSV`, 'success');
  };

  const handlePrintOrderPaper = () => {
    window.print();
  };

  // Canonical status normalizer
  const normalizeStatus = (status?: string): 'Submitted' | 'Under Review' | 'Approved' | 'Starred' | 'Rejected' => {
    if (!status) return 'Submitted';
    const s = status.toLowerCase().trim();
    if (s === 'approved') return 'Approved';
    if (s === 'starred') return 'Starred';
    if (s === 'rejected') return 'Rejected';
    if (s === 'under review' || s === 'under_review') return 'Under Review';
    return 'Submitted';
  };

  // Calculations for Questions Sub-Tab
  const uniqueSubmittersCount = new Set(questions.map(q => q.student_name)).size;
  const totalMembersCount = learners.length || 196;
  const progressPct = Math.min(100, Math.round((uniqueSubmittersCount / totalMembersCount) * 100));

  const totalSubmitted = questions.length;
  const pendingCount = questions.filter(q => normalizeStatus(q.status) === 'Submitted').length;
  const underReviewCount = questions.filter(q => normalizeStatus(q.status) === 'Under Review').length;
  const approvedCount = questions.filter(q => normalizeStatus(q.status) === 'Approved').length;
  const starredCount = questions.filter(q => normalizeStatus(q.status) === 'Starred').length;
  const rejectedCount = questions.filter(q => normalizeStatus(q.status) === 'Rejected').length;
  const readyToPutCount = approvedCount + starredCount;

  const filteredQuestions = questions.filter(q => {
    const canonicalStatus = normalizeStatus(q.status);
    if (statusFilter !== 'All' && canonicalStatus !== statusFilter) return false;
    if (benchFilter !== 'All' && (q.bench || '').toLowerCase() !== benchFilter.toLowerCase()) return false;
    if (ministryFilter !== 'All' && q.ministry !== ministryFilter) return false;
    return true;
  });

  const passedBills = proceedings.filter(p => p.status === 'Passed');

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Card */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500 bg-amber-500/10 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Official Assembly Hansard & Proceedings
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage Question Hour deadlines, review parliamentary questions, table motions & resolutions, and record enacted youth statutes.
          </p>
        </div>

        {/* Sub-Tab Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'questions'
                ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('motions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'motions'
                ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Motions ({motions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('bills')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'bills'
                ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bills & Acts ({proceedings.length})</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: QUESTIONS HOUR ────────────────────────────────────────── */}
      {currentTab === 'questions' && (
        <div className="space-y-6">
          
          {/* Admin Deadlines & Controls Box */}
          <div
            className="rounded-2xl p-5 border space-y-4 shadow-sm"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Question Hour Submission Window & Schedule Controls
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Target Event: <strong className="font-mono text-amber-500">{targetSlug}</strong>
              </span>
            </div>

            {/* Single Animated Toggle Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm">
              
              {/* Dynamic Status Indicator */}
              <div className="flex items-center gap-3.5">
                <div className={`relative p-3 rounded-2xl border transition-all duration-500 ${
                  deadline.is_open !== false && deadline.status !== 'CLOSED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/50'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-950/50'
                }`}>
                  {deadline.is_open !== false && deadline.status !== 'CLOSED' ? (
                    <>
                      <Unlock className="w-5 h-5 animate-pulse text-emerald-400" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
                    </>
                  ) : (
                    <Lock className="w-5 h-5 text-rose-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Submission Window:</span>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide border transition-all duration-300 ${
                      deadline.is_open !== false && deadline.status !== 'CLOSED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-xs shadow-rose-500/20'
                    }`}>
                      {deadline.is_open !== false && deadline.status !== 'CLOSED' ? '🟢 OPEN FOR QUESTIONS' : '🔴 CLOSED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {deadline.is_open !== false && deadline.status !== 'CLOSED'
                      ? 'Student delegates can submit parliamentary questions from their portal.'
                      : 'Submission window is locked. Students cannot submit new questions right now.'}
                  </p>
                </div>
              </div>

              {/* ONE Neat Animated Toggle Button */}
              {(() => {
                const isCurrentlyOpen = deadline.is_open !== false && deadline.status !== 'CLOSED';
                return (
                  <button
                    type="button"
                    disabled={isTogglingDeadline}
                    onClick={() => handleToggleQuestionStatus(!isCurrentlyOpen)}
                    className={`relative group overflow-hidden px-6 py-3 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl border active:scale-95 hover:scale-102 ${
                      isTogglingDeadline
                        ? 'opacity-60 cursor-not-allowed bg-slate-700 text-slate-300 border-slate-600'
                        : isCurrentlyOpen
                        ? 'cursor-pointer bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-rose-500/30 shadow-rose-950/50 hover:shadow-rose-600/40 ring-1 ring-rose-500/20'
                        : 'cursor-pointer bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white border-emerald-400/30 shadow-emerald-950/50 hover:shadow-emerald-500/40 ring-1 ring-emerald-400/20'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isTogglingDeadline ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Window...</span>
                        </>
                      ) : isCurrentlyOpen ? (
                        <>
                          <Lock className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                          <span>Close Question Submissions</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 animate-bounce" />
                          <span>Open Question Submissions</span>
                        </>
                      )}
                    </span>
                    
                    {/* Shiny overlay animation on hover */}
                    {!isTogglingDeadline && (
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    )}
                  </button>
                );
              })()}

            </div>

            {/* Real-time Submissions Progress Bar */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Participant Submission Progress</span>
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">
                  {uniqueSubmittersCount} of {totalMembersCount} members asked a question ({progressPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

          </div>

          {/* Metric Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Submitted</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white">{totalSubmitted}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-amber-500/5 border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Pending</span>
              <strong className="text-2xl font-black text-amber-500">{pendingCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-blue-500/5 border-blue-500/30">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Under Review</span>
              <strong className="text-2xl font-black text-blue-500">{underReviewCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-emerald-500/5 border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Approved</span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-amber-500/5 border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Starred Questions</span>
              <strong className="text-2xl font-black text-amber-500">{starredCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-purple-500/5 border-purple-500/30">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Ready to Put</span>
              <strong className="text-2xl font-black text-purple-600 dark:text-purple-400">{readyToPutCount}</strong>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {(['All', 'Submitted', 'Under Review', 'Approved', 'Starred', 'Rejected'] as const).map(st => {
                  const countLabel = st === 'Submitted'
                    ? `Pending (${pendingCount})`
                    : st === 'Under Review'
                    ? `Under Review (${underReviewCount})`
                    : st === 'Approved'
                    ? `Approved (${approvedCount})`
                    : st === 'Starred'
                    ? `Starred (${starredCount})`
                    : st === 'Rejected'
                    ? `Rejected (${rejectedCount})`
                    : `All (${totalSubmitted})`;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {countLabel}
                    </button>
                  );
                })}
              </div>

              {/* Bench Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {(['All', 'Ruling', 'Opposition'] as const).map(bn => (
                  <button
                    key={bn}
                    type="button"
                    onClick={() => setBenchFilter(bn)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      benchFilter === bn
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {bn === 'All' ? 'All benches' : `${bn} Bench`}
                  </button>
                ))}
              </div>

              {/* Ministry Filter */}
              {availableMinistries.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Ministry:</span>
                  <select
                    id="proceedings-ministry-filter"
                    value={ministryFilter}
                    onChange={(e) => setMinistryFilter(e.target.value)}
                    aria-label="Filter questions by ministry"
                    className="bg-transparent font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none pr-1"
                  >
                    <option value="All" className="dark:bg-slate-900">All Ministries ({questions.length})</option>
                    {availableMinistries.map((min: string) => {
                      const count = questions.filter(q => q.ministry === min).length;
                      return (
                        <option key={min} value={min} className="dark:bg-slate-900">
                          {min} {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Action Bar Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrintOrderPaper}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Order Paper (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => onShowToast('Projector Display', 'Showing Questions Order Paper on live floor projector', 'info')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Show on projector</span>
              </button>
            </div>

          </div>

          {/* Data Table */}
          <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Bench</th>
                    <th className="p-3.5">Constituency</th>
                    <th className="p-3.5">Ministry</th>
                    <th className="p-3.5 max-w-xs">Question</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Queue</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center italic text-slate-400">
                        No questions match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{q.student_name}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {q.bench}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">{q.constituency || 'Assembly Delegate'}</td>
                        <td className="p-3.5 text-amber-600 dark:text-amber-400 font-bold">{q.ministry}</td>
                        <td
                          className="p-3.5 max-w-xs cursor-pointer group hover:bg-amber-500/5 transition-colors"
                          onClick={() => setSelectedQuestion(q)}
                          title="Click to view full question details"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-medium">
                              {q.question_text}
                            </span>
                            <span className="p-1 rounded bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 group-hover:text-amber-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] font-bold">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{q.question_type}</td>
                        <td className="p-3.5">
                          {(() => {
                            const canonicalStatus = normalizeStatus(q.status);
                            const isUnderReview = canonicalStatus === 'Under Review';
                            const isApproved = canonicalStatus === 'Approved';
                            const isStarred = canonicalStatus === 'Starred';
                            const isRejected = canonicalStatus === 'Rejected';

                            return (
                              <>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border shadow-xs inline-flex items-center gap-1.5 ${
                                  isApproved
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    : isStarred
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                    : isRejected
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                    : isUnderReview
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40 font-black ring-1 ring-blue-400/30'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold'
                                }`}>
                                  {isUnderReview && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                  {canonicalStatus === 'Submitted' ? 'Pending Approval' : canonicalStatus}
                                </span>
                                {(() => {
                                  const reviewerDisplay = q.reviewed_by || (q.reviewer_name ? `${q.reviewer_name} (${q.reviewer_role || 'Reviewer'})` : null);
                                  return (q.flagged_for_admin || isUnderReview || reviewerDisplay) && reviewerDisplay ? (
                                    <span className="block text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-1">
                                      ★ Flagged by {reviewerDisplay}
                                    </span>
                                  ) : null;
                                })()}
                              </>
                            );
                          })()}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">#{q.queue_order || idx + 1}</td>
                        <td className="p-3.5 text-right">
                          {(() => {
                            const currentCanonical = normalizeStatus(q.status);
                            const isApproved = currentCanonical === 'Approved';
                            const isStarred = currentCanonical === 'Starred';
                            const isRejected = currentCanonical === 'Rejected';

                            return (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuestion(q)}
                                  title="View / Review Question Details"
                                  className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center"
                                >
                                  <Eye className="w-3.5 h-3.5 stroke-2" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestionStatus(q.id, 'Approved')}
                                  title={isApproved ? "Approved (Click to revert to Pending)" : "Approve Question"}
                                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    isApproved
                                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400 scale-105 font-bold'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600'
                                  }`}
                                >
                                  <Check className={`w-3.5 h-3.5 ${isApproved ? 'stroke-[3]' : 'stroke-2'}`} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestionStatus(q.id, 'Starred')}
                                  title={isStarred ? "Starred (Click to unstar)" : "Star Question"}
                                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    isStarred
                                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400 scale-105 font-bold'
                                      : 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-white stroke-white stroke-[2.5]' : 'stroke-2'}`} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestionStatus(q.id, 'Rejected')}
                                  title={isRejected ? "Rejected (Click to revert to Pending)" : "Reject Question"}
                                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    isRejected
                                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400 scale-105 font-bold'
                                      : 'bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600'
                                  }`}
                                >
                                  <X className={`w-3.5 h-3.5 ${isRejected ? 'stroke-[3]' : 'stroke-2'}`} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  title="Delete Question"
                                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-2" />
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Details Modal */}
          {selectedQuestion && (() => {
            const submitter = learners.find(
              l => l.id === selectedQuestion.student_id || l.full_name?.toLowerCase() === selectedQuestion.student_name?.toLowerCase()
            );
            const currentCanonical = normalizeStatus(selectedQuestion.status);
            const isUnderReview = currentCanonical === 'Under Review' || selectedQuestion.status === 'Under Review';
            const isApproved = currentCanonical === 'Approved';
            const isStarred = currentCanonical === 'Starred';
            const isRejected = currentCanonical === 'Rejected';

            const reviewerName = selectedQuestion.reviewer_name || (selectedQuestion.reviewed_by ? selectedQuestion.reviewed_by.replace(/\s*\([^)]*\)$/, '') : 'Reviewer');
            const reviewerRole = selectedQuestion.reviewer_role || (selectedQuestion.reviewed_by?.includes('Journalist') ? 'Journalist' : 'Administrator');
            const reviewerFullDisplay = selectedQuestion.reviewed_by || `${reviewerName} (${reviewerRole})`;

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
                onClick={() => setSelectedQuestion(null)}
              >
                <div
                  className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden animate-scale-in"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            Question Details &amp; Review
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Queue #{selectedQuestion.queue_order || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Parliamentary Question Hour Submission
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedQuestion(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Student Member
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {selectedQuestion.student_name}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Member / Seat No.
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {submitter?.constituency_number !== undefined ? `#${submitter.constituency_number}` : (selectedQuestion.seat_number ? `#${selectedQuestion.seat_number}` : '—')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Bench Position
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedQuestion.bench === 'Ruling'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                        }`}>
                          {selectedQuestion.bench}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Constituency
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate">
                          {submitter?.constituency_name || selectedQuestion.constituency || 'Assembly Delegate'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Party
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {submitter?.party_name || 'Assembly Delegate'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Target Ministry
                        </span>
                        <p className="font-bold text-amber-600 dark:text-amber-400 truncate">
                          {selectedQuestion.ministry}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Question Type
                        </span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {selectedQuestion.question_type}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Status
                        </span>
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black border shadow-xs ${
                          isApproved
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : isStarred
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : isRejected
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            : isUnderReview
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40 ring-1 ring-blue-400/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold'
                        }`}>
                          {isUnderReview
                            ? 'Under Review'
                            : selectedQuestion.status === 'Submitted'
                            ? 'Pending Approval'
                            : selectedQuestion.status}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Submitted At
                        </span>
                        <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                          {selectedQuestion.created_at ? new Date(selectedQuestion.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Review Details if Forwarded / Under Review */}
                    {(selectedQuestion.reviewed_by || selectedQuestion.flagged_for_admin || isUnderReview) && (
                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-900 dark:text-blue-200 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <span className="text-blue-600 dark:text-blue-400 font-black">★</span>
                            <span>Flagged for Main Admin Review</span>
                          </div>
                          {selectedQuestion.reviewed_at && (
                            <span className="font-mono text-[11px] text-blue-700/80 dark:text-blue-300/80">
                              {new Date(selectedQuestion.reviewed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-500/20 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                              Flagged By
                            </span>
                            <div className="flex items-center gap-1.5 font-extrabold text-blue-950 dark:text-blue-100">
                              <span>{reviewerName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30">
                                {reviewerRole}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                              Attribution
                            </span>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              ★ Flagged by {reviewerFullDisplay}
                            </p>
                          </div>
                        </div>

                        {selectedQuestion.review_note && (
                          <div className="pt-2 border-t border-blue-500/20">
                            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider block mb-1">
                              Reviewer Recommendation Note
                            </span>
                            <p className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-blue-500/20 text-slate-800 dark:text-slate-200 text-xs italic font-medium leading-relaxed">
                              &ldquo;{selectedQuestion.review_note}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Complete Original Question Text */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Complete Original Question
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {selectedQuestion.question_text.length} characters
                        </span>
                      </div>
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-sans text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words select-text max-h-[40vh] overflow-y-auto">
                        {selectedQuestion.question_text}
                      </div>
                    </div>

                    {/* Approval Details if Approved */}
                    {selectedQuestion.approved_at && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                        <span>Approved by <strong>{selectedQuestion.approved_by || 'Speaker / Admin'}</strong></span>
                        <span className="font-mono text-[11px]">{new Date(selectedQuestion.approved_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    <button
                      type="button"
                      onClick={() => setSelectedQuestion(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Close
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestionStatus(selectedQuestion.id, 'Approved')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isApproved
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-2" />
                        <span>{isApproved ? 'Approved ✓' : 'FINAL APPROVE'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateQuestionStatus(selectedQuestion.id, 'Starred')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isStarred
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                            : 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600'
                        }`}
                      >
                        <Star className="w-4 h-4 stroke-2" />
                        <span>{isStarred ? 'Starred ★' : 'Star'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateQuestionStatus(selectedQuestion.id, 'Rejected')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isRejected
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                            : 'bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600'
                        }`}
                      >
                        <X className="w-4 h-4 stroke-2" />
                        <span>{isRejected ? 'Rejected ✗' : 'Reject'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 2: MOTIONS & RESOLUTIONS ──────────────────────────────────── */}
      {currentTab === 'motions' && (
        <div className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" /> Legislative Motions & Committee Rooms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Collaborative drafting rooms and floor motions for Assembly debate
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMotionOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Table New Motion</span>
            </button>
          </div>

          {/* Tabled Motions List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" /> Tabled Motions & Floor Resolutions ({motions.length})
            </h4>

            {motions.length === 0 ? (
              <div
                className="py-12 text-center rounded-2xl border italic text-xs"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                No legislative motions submitted yet. Click "+ Table New Motion" to initiate a resolution.
              </div>
            ) : (
              <div className="space-y-3">
                {motions
                  .filter(m => !selectedRoom || m.committee_room === selectedRoom)
                  .map(m => (
                    <div
                      key={m.id}
                      className="rounded-2xl p-5 border space-y-3 shadow-sm transition-all"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
                        <div>
                          <span className="text-[10px] font-bold text-amber-500 uppercase font-mono">{m.committee_room}</span>
                          <h5 className="text-base font-extrabold text-slate-900 dark:text-white">{m.title}</h5>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 self-start sm:self-auto">
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{m.content}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-semibold">
                        <span>Proposed by: <strong className="text-slate-900 dark:text-white">{m.proposed_by}</strong> ({m.bench} Bench)</span>
                        <span className="font-mono">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Add Motion Modal */}
          {isAddMotionOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleAddMotionSubmit}
                className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 animate-scale-up"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-500" /> Table New Legislative Motion
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddMotionOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Motion Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Motion on State Education Infrastructure Grants"
                      value={motionTitle}
                      onChange={(e) => setMotionTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Proposed By</label>
                      <input
                        type="text"
                        placeholder="Hon. Delegate Name"
                        value={motionProposer}
                        onChange={(e) => setMotionProposer(e.target.value)}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bench</label>
                      <select
                        value={motionBench}
                        onChange={(e) => setMotionBench(e.target.value as 'Ruling' | 'Opposition')}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Ruling">Ruling Bench</option>
                        <option value="Opposition">Opposition Bench</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Committee / Chamber Room</label>
                    <select
                      value={motionRoom}
                      onChange={(e) => setMotionRoom(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="General Assembly Chamber">General Assembly Chamber</option>
                      <option value="Ministry of Education Room">Ministry of Education Room</option>
                      <option value="Ministry of Health Room">Ministry of Health Room</option>
                      <option value="Ministry of Finance Room">Ministry of Finance Room</option>
                      <option value="Ministry of Home Affairs Room">Ministry of Home Affairs Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Motion Text & Recommendations</label>
                    <textarea
                      rows={4}
                      placeholder="Enter resolution details, preamble, and floor recommendation..."
                      value={motionContent}
                      onChange={(e) => setMotionContent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddMotionOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer"
                  >
                    Submit Motion
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ── TAB 3: LEGISLATIVE BILLS & ACTS ────────────────────────────────── */}
      {currentTab === 'bills' && (
        <div className="space-y-6">
          
          {/* Bill Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Tabled Legislative Bills & Youth Acts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage reading of bills, division votes (ayes/noes), and enacted youth statutes
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onShowToast('Refresh', 'Refreshed bills list from server', 'info')}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => onShowToast('Download All', 'Downloading all enacted bills as PDF dossier', 'success')}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download all</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddBillOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Bill</span>
              </button>
            </div>
          </div>

          {/* Hansard Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bills Tabled</span>
              <strong className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{proceedings.length}</strong>
            </div>
            <div className="p-4 rounded-2xl border shadow-sm bg-emerald-500/5 border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Enacted Legislative Acts</span>
              <strong className="text-2xl font-black text-emerald-600">{passedBills.length} Passed</strong>
            </div>
            <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Under Active Floor Debate</span>
              <strong className="text-2xl font-black text-amber-500">
                {proceedings.filter(p => p.status === 'Debating' || p.status === 'Introduced').length}
              </strong>
            </div>
          </div>

          {/* Grid View of Ministry / Committee Rooms */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" /> Active Ministry & Committee Rooms
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Ministry of Education Room', desc: 'Higher education & school infrastructure policy', icon: '🎓' },
                { name: 'Ministry of Health Room', desc: 'Public health & medical emergency response', icon: '🏥' },
                { name: 'Ministry of Finance Room', desc: 'State budget allocations & taxation policy', icon: '💰' },
                { name: 'Ministry of Home Affairs Room', desc: 'Law & order, law enforcement, public safety', icon: '🛡️' },
                { name: 'Ministry of Defence Room', desc: 'Border security, coastal defense & youth cadet corps', icon: '🎖️' },
                { name: 'General Assembly Floor', desc: 'Plenary chamber floor debates & zero-hour resolutions', icon: '🏛️' }
              ].map(room => (
                <div
                  key={room.name}
                  className={`p-5 rounded-2xl border space-y-3 shadow-sm transition-all ${
                    selectedRoom === room.name
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{room.icon}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      Active Room
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">{room.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{room.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoom(selectedRoom === room.name ? null : room.name);
                      onShowToast('Room Selected', `Filtering bills for ${room.name}`, 'info');
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Room →</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Legislative Bills List */}
          <div className="space-y-4">
            {proceedings.length === 0 ? (
              <div
                className="py-12 text-center rounded-2xl border italic text-xs"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                No legislative bills tabled yet. Click "+ Add Bill" to initiate legislation.
              </div>
            ) : (
              proceedings.map(bill => (
                <div
                  key={bill.id}
                  className="rounded-2xl p-5 border shadow-sm space-y-4 transition-all"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        {bill.bill_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bill.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {bill.bench} Bench Bill
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      bill.status === 'Passed'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : bill.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                      {bill.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{bill.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{bill.summary}</p>
                    <p className="text-[11px] text-slate-400 mt-2">Introduced by: <strong className="text-slate-700 dark:text-slate-300">{bill.introduced_by}</strong></p>
                  </div>

                  {/* Division Voting Action Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="text-xs font-mono text-slate-500">
                      Division Result: <span className="font-bold text-emerald-600">Ayes: {bill.ayes || 0}</span> | <span className="font-bold text-rose-600">Noes: {bill.noes || 0}</span>
                    </div>

                    {bill.status !== 'Passed' && bill.status !== 'Rejected' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const ayes = Math.floor(100 + Math.random() * 40);
                            const noes = Math.floor(40 + Math.random() * 30);
                            onUpdateBillStatus(bill.id, 'Passed', ayes, noes);
                            onShowToast('🎉 Bill Passed', `Enacted with ${ayes} Ayes to ${noes} Noes`, 'success');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs cursor-pointer"
                        >
                          Record Passed Division
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ayes = Math.floor(40 + Math.random() * 30);
                            const noes = Math.floor(100 + Math.random() * 40);
                            onUpdateBillStatus(bill.id, 'Rejected', ayes, noes);
                            onShowToast('Bill Defeated', `Defeated with ${noes} Noes to ${ayes} Ayes`, 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600 cursor-pointer"
                        >
                          Record Rejected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Bill Modal */}
          {isAddBillOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!billTitle.trim()) return;
                  const delegate = learners.find(l => l.id === billIntroducerId) || learners[0];
                  const introducedBy = delegate ? `${delegate.full_name} (${delegate.role || 'MLA'})` : 'Hon. Member';
                  const bench = delegate?.bench || 'Ruling';

                  onAddBill({
                    event_id: eventId,
                    bill_number: `TN-BILL-${Math.floor(10 + Math.random() * 90)}/2026`,
                    title: billTitle.trim(),
                    introduced_by: introducedBy,
                    bench,
                    summary: billSummary.trim() || 'A legislative statute tabled before the Assembly for consideration.',
                    status: 'Debating'
                  });

                  setIsAddBillOpen(false);
                  setBillTitle('');
                  setBillSummary('');
                  onShowToast('Bill Tabled', `Tabled ${billTitle}`, 'success');
                }}
                className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 animate-scale-up"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-500" /> Table New Legislative Bill
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddBillOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bill Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tamil Nadu Youth Employment & Skill Empowerment Bill 2026"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Introduced By (Delegate)</label>
                    <select
                      value={billIntroducerId}
                      onChange={(e) => setBillIntroducerId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Select Member / Minister --</option>
                      {learners.map(l => (
                        <option key={l.id} value={l.id}>{l.full_name} ({l.party_name || 'Independent'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Preamble & Objects Summary</label>
                    <textarea
                      rows={4}
                      placeholder="Enter legislative preamble, statutory objectives, and provisions..."
                      value={billSummary}
                      onChange={(e) => setBillSummary(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddBillOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer"
                  >
                    Table Bill
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
