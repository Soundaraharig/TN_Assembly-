import React, { useState, useMemo } from 'react';
import type { Learner, ProceedingsQuestion } from '../../types';
import {
  X,
  Search,
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Users,
  Filter,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export interface SubmittedMemberRecord {
  learner: Learner;
  questions: ProceedingsQuestion[];
}

interface SubmissionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  benchFilter: 'All' | 'Ruling' | 'Opposition';
  onBenchFilterChange?: (bench: 'All' | 'Ruling' | 'Opposition') => void;
  ministryFilter: string;
  submittedList: SubmittedMemberRecord[];
  notSubmittedList: Learner[];
  initialTab?: 'all' | 'submitted' | 'not_submitted';
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmissionListModal: React.FC<SubmissionListModalProps> = ({
  isOpen,
  onClose,
  eventName,
  benchFilter,
  onBenchFilterChange,
  ministryFilter,
  submittedList,
  notSubmittedList,
  initialTab = 'not_submitted',
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'not_submitted'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showCsvMenu, setShowCsvMenu] = useState(false);

  // Sync tab with initialTab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setIsCopied(false);
      setShowCsvMenu(false);
    }
  }, [isOpen, initialTab]);

  const totalEligibleCount = submittedList.length + notSubmittedList.length;

  // Build unified items for filtering
  const allItems = useMemo(() => {
    const list: Array<{
      type: 'submitted' | 'not_submitted';
      learner: Learner;
      questions?: ProceedingsQuestion[];
    }> = [];

    submittedList.forEach(s => {
      list.push({
        type: 'submitted',
        learner: s.learner,
        questions: s.questions
      });
    });

    notSubmittedList.forEach(l => {
      list.push({
        type: 'not_submitted',
        learner: l
      });
    });

    return list;
  }, [submittedList, notSubmittedList]);

  // Filter by Tab and Search Query
  const displayedItems = useMemo(() => {
    let items = allItems;
    if (activeTab === 'submitted') {
      items = items.filter(i => i.type === 'submitted');
    } else if (activeTab === 'not_submitted') {
      items = items.filter(i => i.type === 'not_submitted');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(i => {
        const l = i.learner;
        const nameMatch = (l.full_name || '').toLowerCase().includes(q);
        const constMatch = (l.constituency_name || '').toLowerCase().includes(q) || String(l.constituency_number || '').includes(q);
        const partyMatch = (l.party_name || '').toLowerCase().includes(q);
        const codeMatch = (l.access_code || '').toLowerCase().includes(q);
        const minMatch = i.questions?.some(qst => (qst.ministry || '').toLowerCase().includes(q));
        return nameMatch || constMatch || partyMatch || codeMatch || minMatch;
      });
    }

    return items;
  }, [allItems, activeTab, searchQuery]);

  // Format Helper for Clipboard
  const handleCopyNames = () => {
    if (displayedItems.length === 0) {
      onShowToast('Empty List', 'No participant names to copy under the current filter.', 'info');
      return;
    }

    const tabLabel = activeTab === 'all'
      ? 'ALL ELIGIBLE'
      : activeTab === 'submitted'
      ? 'SUBMITTED'
      : 'NOT SUBMITTED';

    const benchLabel = benchFilter === 'All'
      ? 'ALL BENCHES'
      : `${benchFilter.toUpperCase()} BENCH`;

    const ministryLabel = ministryFilter !== 'All' ? ` — ${ministryFilter.toUpperCase()}` : '';

    const lines: string[] = [
      `${eventName} — ${benchLabel}${ministryLabel} — ${tabLabel} (${displayedItems.length})`,
      '────────────────────────────────────────────────────────────'
    ];

    displayedItems.forEach((item, idx) => {
      const l = item.learner;
      const constituency = l.constituency_name
        ? `${l.constituency_number ? `${l.constituency_number} - ` : ''}${l.constituency_name}`
        : 'Constituency Unassigned';
      const bench = l.bench || 'Bench Unassigned';
      const party = l.party_name ? ` (${l.party_name})` : '';
      const statusNote = item.type === 'submitted'
        ? ` [SUBMITTED: ${item.questions?.length || 1} question(s) - ${item.questions?.[0]?.ministry || 'Question Hour'}]`
        : ' [NOT SUBMITTED]';

      lines.push(`${idx + 1}. ${l.full_name} — ${constituency} — ${bench}${party}${statusNote}`);
    });

    const fullText = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        onShowToast('Names Copied', `Copied ${displayedItems.length} delegate names to clipboard.`, 'success');
      }).catch(() => {
        fallbackCopy(fullText);
      });
    } else {
      fallbackCopy(fullText);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      onShowToast('Names Copied', `Copied ${displayedItems.length} delegate names to clipboard.`, 'success');
    } catch {
      onShowToast('Copy Failed', 'Please manually select and copy the text.', 'error');
    }
  };

  // CSV Export Helper with UTF-8 BOM
  const handleExportCSV = (mode: 'current' | 'all' | 'submitted' | 'not_submitted') => {
    let exportItems = allItems;
    let filenameSuffix = 'all';

    if (mode === 'current') {
      exportItems = displayedItems;
      filenameSuffix = activeTab;
    } else if (mode === 'submitted') {
      exportItems = allItems.filter(i => i.type === 'submitted');
      filenameSuffix = 'submitted';
    } else if (mode === 'not_submitted') {
      exportItems = allItems.filter(i => i.type === 'not_submitted');
      filenameSuffix = 'not_submitted';
    }

    if (exportItems.length === 0) {
      onShowToast('Empty Export', 'No participants found to export.', 'info');
      setShowCsvMenu(false);
      return;
    }

    const headers = [
      '#',
      'Student Name',
      'Access Code',
      'Constituency Number',
      'Constituency Name',
      'Bench',
      'Party',
      'Role',
      'Submission Status',
      'Questions Count',
      'Target Ministry',
      'Latest Question Status',
      'Latest Submitted At'
    ];

    const rows = exportItems.map((item, idx) => {
      const l = item.learner;
      const latestQ = item.questions?.[0];
      const ministries = item.questions?.map(q => q.ministry).filter(Boolean) || [];
      const uniqueMinistries = Array.from(new Set(ministries)).join('; ');

      return [
        idx + 1,
        `"${(l.full_name || '').replace(/"/g, '""')}"`,
        `"${(l.access_code || '').replace(/"/g, '""')}"`,
        `"${l.constituency_number !== undefined ? l.constituency_number : ''}"`,
        `"${(l.constituency_name || '').replace(/"/g, '""')}"`,
        `"${(l.bench || '').replace(/"/g, '""')}"`,
        `"${(l.party_name || '').replace(/"/g, '""')}"`,
        `"${(l.role || '').replace(/"/g, '""')}"`,
        item.type === 'submitted' ? '"Submitted"' : '"Not Submitted"',
        item.questions ? item.questions.length : 0,
        `"${uniqueMinistries.replace(/"/g, '""')}"`,
        latestQ ? `"${(latestQ.status || '').replace(/"/g, '""')}"` : '""',
        latestQ?.created_at ? `"${latestQ.created_at}"` : '""'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const benchPart = benchFilter.toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('download', `question_hour_${benchPart}_${filenameSuffix}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowCsvMenu(false);
    onShowToast('CSV Downloaded', `Exported ${exportItems.length} records to CSV.`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-surface, #0f172a)',
          borderColor: 'var(--border, #334155)',
          color: 'var(--text-primary, #f8fafc)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-900/60"
          style={{ borderColor: 'var(--border-soft, #1e293b)' }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h2 id="submission-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                Question Hour Submission Roster
              </h2>

              {/* Active Filter Badges */}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                benchFilter === 'Opposition'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : benchFilter === 'Ruling'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {benchFilter === 'All' ? 'All Benches' : `${benchFilter} Bench`} ({totalEligibleCount})
              </span>

              {ministryFilter !== 'All' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{ministryFilter}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter-aware breakdown of delegates who have submitted vs not yet submitted questions for {eventName}.
            </p>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Copy Names Button */}
            <button
              type="button"
              onClick={handleCopyNames}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Copy formatted participant names to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Copy Names</span>
                </>
              )}
            </button>

            {/* Download CSV Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCsvMenu(!showCsvMenu)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Download CSV export"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download CSV</span>
              </button>

              {showCsvMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl p-1.5 z-20 space-y-1 animate-scale-in"
                  style={{
                    backgroundColor: 'var(--bg-surface, #0f172a)',
                    borderColor: 'var(--border, #334155)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleExportCSV('current')}
                    className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl hover:bg-amber-500/10 hover:text-amber-500 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                    <span>Current View ({displayedItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCSV('not_submitted')}
                    className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Not Submitted Only ({notSubmittedList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCSV('submitted')}
                    className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Submitted Only ({submittedList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCSV('all')}
                    className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-700/40 pt-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>All Eligible ({totalEligibleCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Bench Selector + Status Tabs + Search */}
        <div
          className="p-4 sm:p-5 border-b space-y-3 shrink-0 bg-slate-950/40"
          style={{ borderColor: 'var(--border-soft, #1e293b)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Status Tabs: Submitted / Not Submitted / All */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('not_submitted')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'not_submitted'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Not Submitted ({notSubmittedList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('submitted')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'submitted'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submitted ({submittedList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Eligible ({totalEligibleCount})</span>
              </button>
            </div>

            {/* Bench Toggle Pills (allowing instant bench switching right inside modal) */}
            {onBenchFilterChange && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-[11px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Bench:</span>
                </span>
                {(['All', 'Ruling', 'Opposition'] as const).map(bn => (
                  <button
                    key={bn}
                    type="button"
                    onClick={() => onBenchFilterChange(bn)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      benchFilter === bn
                        ? bn === 'Opposition'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : bn === 'Ruling'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {bn === 'All' ? 'All Benches' : bn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, constituency, party, access code, or target ministry..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {displayedItems.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-2xl bg-slate-900/30 border border-slate-800/80">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                No delegates match your current filter.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? `No participants found matching "${searchQuery}". Try clearing your search.`
                  : activeTab === 'not_submitted'
                  ? 'Great news! All eligible delegates under this filter have submitted questions.'
                  : activeTab === 'submitted'
                  ? 'No delegates in this bench have submitted questions yet.'
                  : 'No eligible delegates found for this bench filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Student / Member Name</th>
                    <th className="p-3">Constituency</th>
                    <th className="p-3">Bench</th>
                    <th className="p-3">Party</th>
                    <th className="p-3">Submission Status</th>
                    <th className="p-3">Target Ministry</th>
                    <th className="p-3 text-right">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {displayedItems.map((item, idx) => {
                    const l = item.learner;
                    const isSubmitted = item.type === 'submitted';
                    const latestQ = item.questions?.[0];
                    const qCount = item.questions?.length || 0;

                    return (
                      <tr
                        key={l.id || `${l.full_name}-${idx}`}
                        className={`transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/40 ${
                          isSubmitted ? 'bg-emerald-500/[0.02]' : 'bg-rose-500/[0.02]'
                        }`}
                      >
                        {/* Number */}
                        <td className="p-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Name & Access Code */}
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{l.full_name}</span>
                            {l.role && l.role.toLowerCase() !== 'student' && l.role.toLowerCase() !== 'mla' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {l.role}
                              </span>
                            )}
                          </div>
                          {l.access_code && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Code: {l.access_code}
                            </span>
                          )}
                        </td>

                        {/* Constituency */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {l.constituency_name ? (
                            <span>
                              {l.constituency_number ? `${l.constituency_number} - ` : ''}
                              {l.constituency_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Bench */}
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            (l.bench || '').toLowerCase() === 'ruling'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : (l.bench || '').toLowerCase() === 'opposition'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {l.bench || 'Unassigned'}
                          </span>
                        </td>

                        {/* Party */}
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {l.party_name || '—'}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          {isSubmitted ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                latestQ?.status === 'Approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : latestQ?.status === 'Starred'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                  : latestQ?.status === 'Under Review'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  : latestQ?.status === 'Rejected'
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{latestQ?.status || 'Submitted'}</span>
                              </span>
                              {qCount > 1 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {qCount} Qs
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Not Submitted</span>
                            </span>
                          )}
                        </td>

                        {/* Target Ministry */}
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">
                          {isSubmitted && latestQ?.ministry ? (
                            <span>
                              {latestQ.ministry}
                              {qCount > 1 && (
                                <span className="text-[10px] font-normal text-slate-400 ml-1">
                                  (+{qCount - 1} more)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Submitted Time */}
                        <td className="p-3 text-right font-mono text-[11px] text-slate-400">
                          {latestQ?.created_at ? (
                            new Date(latestQ.created_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 sm:p-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-900/60"
          style={{ borderColor: 'var(--border-soft, #1e293b)' }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing <strong>{displayedItems.length}</strong> of <strong>{totalEligibleCount}</strong> eligible delegates</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">{submittedList.length} Submitted</span>
            <span>•</span>
            <span className="text-rose-500 font-bold">{notSubmittedList.length} Not Submitted</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNames}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Copy className="w-3.5 h-3.5 text-amber-500" />
              <span>Copy Names</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV('current')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
