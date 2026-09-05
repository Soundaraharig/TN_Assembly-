import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BillProceeding, Learner, EventDeadline, ProceedingsQuestion, ProceedingsMotion } from '../../types';
import { storageService } from '../../services/storageService';
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
  RefreshCw
} from 'lucide-react';

interface ProceedingsTabProps {
  proceedings: BillProceeding[];
  learners: Learner[];
  eventId: string;
  eventSlug?: string;
  onAddBill: (bill: Partial<BillProceeding>) => void;
  onUpdateBillStatus: (id: string, status: BillProceeding['status'], ayes?: number, noes?: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProceedingsTab: React.FC<ProceedingsTabProps> = ({
  proceedings,
  learners,
  eventId,
  eventSlug = 'jkkncet-tn-assembly-2026',
  onAddBill,
  onUpdateBillStatus,
  onShowToast
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'questions' | 'motions' | 'bills') || 'questions';

  const targetSlug = eventSlug || eventId || 'jkkncet-tn-assembly-2026';

  // Deadlines & Data State
  const [deadline, setDeadline] = useState<EventDeadline>(() => storageService.getEventDeadline(targetSlug));
  const [questions, setQuestions] = useState<ProceedingsQuestion[]>(() => storageService.getProceedingsQuestions(targetSlug));
  const [motions, setMotions] = useState<ProceedingsMotion[]>(() => storageService.getProceedingsMotions(targetSlug));

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Submitted' | 'Approved' | 'Starred' | 'Rejected'>('All');
  const [benchFilter, setBenchFilter] = useState<'All' | 'Ruling' | 'Opposition'>('All');

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
    setDeadline(storageService.getEventDeadline(targetSlug));
    setQuestions(storageService.getProceedingsQuestions(targetSlug));
    setMotions(storageService.getProceedingsMotions(targetSlug));
  };

  useEffect(() => {
    refreshData();
    const unsub = storageService.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [targetSlug]);

  const setTab = (tab: 'questions' | 'motions' | 'bills') => {
    setSearchParams({ tab });
  };

  // Deadline Handlers
  const handleUpdateOpenAt = (val: string) => {
    const updated = storageService.updateEventDeadline(targetSlug, val, deadline.questions_deadline_at);
    setDeadline(updated);
    onShowToast('Schedule Updated', 'Question opening time saved', 'info');
  };

  const handleUpdateDeadlineAt = (val: string) => {
    const updated = storageService.updateEventDeadline(targetSlug, deadline.questions_open_at, val);
    setDeadline(updated);
    onShowToast('Schedule Updated', 'Question deadline timestamp saved', 'info');
  };

  const handleExtendDeadline = (hours: number) => {
    const baseMs = deadline.questions_deadline_at ? new Date(deadline.questions_deadline_at).getTime() : Date.now();
    const newDeadlineIso = new Date(baseMs + hours * 3600 * 1000).toISOString();
    const updated = storageService.updateEventDeadline(targetSlug, deadline.questions_open_at, newDeadlineIso);
    setDeadline(updated);
    onShowToast('Deadline Extended', `Added +${hours}h to Question Hour deadline`, 'success');
  };

  // Question Actions
  const handleUpdateQuestionStatus = (id: string, status: 'Submitted' | 'Approved' | 'Starred' | 'Rejected') => {
    storageService.updateProceedingsQuestionStatus(id, status);
    refreshData();
    onShowToast('Status Updated', `Question status changed to ${status}`, 'success');
  };

  const handleDeleteQuestion = (id: string) => {
    storageService.deleteProceedingsQuestion(id);
    refreshData();
    onShowToast('Question Deleted', 'Removed test question from queue', 'info');
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

  // Export & Action Bar Helpers
  const handleExportCSV = () => {
    const headers = ['#', 'Student Name', 'Bench', 'Constituency', 'Ministry', 'Question Type', 'Status', 'Question Text', 'Created At'];
    const rows = questions.map((q, idx) => [
      idx + 1,
      `"${q.student_name}"`,
      `"${q.bench}"`,
      `"${q.constituency || ''}"`,
      `"${q.ministry}"`,
      `"${q.question_type}"`,
      `"${q.status}"`,
      `"${q.question_text.replace(/"/g, '""')}"`,
      `"${q.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proceedings_questions_${targetSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('CSV Exported', `Exported ${questions.length} questions to CSV`, 'success');
  };

  const handlePrintOrderPaper = () => {
    window.print();
  };

  // Calculations for Questions Sub-Tab
  const uniqueSubmittersCount = new Set(questions.map(q => q.student_name)).size;
  const totalMembersCount = learners.length || 196;
  const progressPct = Math.min(100, Math.round((uniqueSubmittersCount / totalMembersCount) * 100));

  const totalSubmitted = questions.length;
  const approvedCount = questions.filter(q => q.status === 'Approved').length;
  const starredCount = questions.filter(q => q.status === 'Starred').length;
  const readyToPutCount = approvedCount + starredCount;

  const filteredQuestions = questions.filter(q => {
    if (statusFilter !== 'All' && q.status !== statusFilter) return false;
    if (benchFilter !== 'All' && q.bench !== benchFilter) return false;
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

            {/* Datetime Controls & Extensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              
              {/* Question Submissions Open */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Question Submissions Open
                </label>
                <input
                  type="datetime-local"
                  value={deadline.questions_open_at ? deadline.questions_open_at.slice(0, 16) : ''}
                  onChange={(e) => handleUpdateOpenAt(new Date(e.target.value).toISOString())}
                  className="w-full p-2.5 rounded-xl border text-xs font-mono font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Question Submission Deadline */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Question Submission Deadline
                </label>
                <input
                  type="datetime-local"
                  value={deadline.questions_deadline_at ? deadline.questions_deadline_at.slice(0, 16) : ''}
                  onChange={(e) => handleUpdateDeadlineAt(new Date(e.target.value).toISOString())}
                  className="w-full p-2.5 rounded-xl border text-xs font-mono font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Extension Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Extend Deadline
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendDeadline(6)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    +6 hours
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDeadline(24)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    +1 day
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDeadline(72)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    +3 days
                  </button>
                </div>
              </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Submitted</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white">{totalSubmitted}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-emerald-500/5 border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Approved</span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-amber-500/5 border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Starred Questions</span>
              <strong className="text-2xl font-black text-amber-500">{starredCount}</strong>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm bg-blue-500/5 border-blue-500/30">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Ready to Put</span>
              <strong className="text-2xl font-black text-blue-600 dark:text-blue-400">{readyToPutCount}</strong>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {(['All', 'Submitted', 'Approved', 'Starred', 'Rejected'] as const).map(st => (
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
                    {st}
                  </button>
                ))}
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
                        <td className="p-3.5 max-w-xs truncate text-slate-800 dark:text-slate-200" title={q.question_text}>
                          {q.question_text}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{q.question_type}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            q.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : q.status === 'Starred'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : q.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">#{q.queue_order || idx + 1}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestionStatus(q.id, 'Approved')}
                              title="Approve Question"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateQuestionStatus(q.id, 'Starred')}
                              title="Star Question"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 transition-colors cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateQuestionStatus(q.id, 'Rejected')}
                              title="Reject Question"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              title="Delete Question"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                      onShowToast('Room Selected', `Filtering motions for ${room.name}`, 'info');
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Room →</span>
                  </button>
                </div>
              ))}
            </div>
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
