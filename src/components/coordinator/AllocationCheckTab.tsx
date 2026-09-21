import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Learner, Party, Committee, LearnerAllocationConfirmation } from '../../types';
import {
  storageService,
  getAllocationCheckStatus,
  getResolvedPartyName,
  getResolvedCommitteeName,
  getResolvedLearnerBench
} from '../../services/storageService';
import { formatCheckedDate } from '../student/StudentAllocationCard';
import {
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  X,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';

interface AllocationCheckTabProps {
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventId?: string;
  eventName?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AllocationCheckTab: React.FC<AllocationCheckTabProps> = ({
  learners,
  parties,
  committees,
  eventId,
  eventName,
  onShowToast
}) => {
  const [confirmations, setConfirmations] = useState<LearnerAllocationConfirmation[]>(() => {
    return storageService.getAllocationConfirmations(eventId);
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED' | 'NOT_CHECKED' | 'NEEDS_RECHECK'>('ALL');
  const [partyFilter, setPartyFilter] = useState<string>('ALL');
  const [committeeFilter, setCommitteeFilter] = useState<string>('ALL');
  const [benchFilter, setBenchFilter] = useState<string>('ALL');
  const [constituencyFilter, setConstituencyFilter] = useState<string>('ALL');

  // Selected student for detail modal
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Prevent re-triggering effects from onShowToast reference changes
  const onShowToastRef = useRef(onShowToast);
  useEffect(() => {
    onShowToastRef.current = onShowToast;
  }, [onShowToast]);

  // In-flight guard to prevent duplicate concurrent queries
  const isFetchingRef = useRef(false);

  // Controlled fetch implementation
  const loadConfirmations = useCallback(async (silent = false) => {
    if (!eventId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      const records = await storageService.fetchAllAllocationConfirmations(eventId);
      setConfirmations(records);
      if (!silent) {
        onShowToastRef.current('Refreshed', `Fetched latest status for ${records.length} confirmations.`, 'success');
      }
    } catch (err: any) {
      if (!silent) {
        onShowToastRef.current('Refresh Error', err?.message || 'Failed to refresh confirmations', 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setIsRefreshing(false);
    }
  }, [eventId]);

  // Initial load once on mount or when eventId changes
  useEffect(() => {
    if (eventId) {
      loadConfirmations(true);
    }

    // Subscribe only to local storage updates from other tabs
    const unsub = storageService.subscribe(() => {
      setConfirmations(storageService.getAllocationConfirmations(eventId));
    });

    // Optional controlled periodic refresh every 30 seconds (only when tab is active)
    const interval = setInterval(() => {
      if (!document.hidden && eventId && !isFetchingRef.current) {
        loadConfirmations(true);
      }
    }, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [eventId, loadConfirmations]);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    loadConfirmations(false);
  };

  // Map of learnerId -> confirmation
  const confMap = useMemo(() => {
    const map = new Map<string, LearnerAllocationConfirmation>();
    confirmations.forEach(c => map.set(c.learner_id, c));
    return map;
  }, [confirmations]);

  // Compute status for all learners
  const learnersWithStatus = useMemo(() => {
    return learners.map(l => {
      const conf = confMap.get(l.id);
      const status = getAllocationCheckStatus(l, conf);
      const party = getResolvedPartyName(l, parties) || l.party_name || '';
      const committee = getResolvedCommitteeName(l, committees) || l.committee_name || '';
      const bench = getResolvedLearnerBench(l, parties) || l.bench || '';
      const constName = l.constituency_name || '';
      const constNum = l.constituency_number !== undefined && l.constituency_number !== null
        ? String(l.constituency_number)
        : '';
      return {
        learner: l,
        conf,
        status,
        party,
        committee,
        bench,
        constName,
        constNum
      };
    });
  }, [learners, confMap, parties, committees]);

  // Top summary counts
  const totalCount = learnersWithStatus.length;
  const checkedCount = learnersWithStatus.filter(i => i.status === 'CHECKED').length;
  const notCheckedCount = learnersWithStatus.filter(i => i.status === 'NOT CHECKED').length;
  const needsRecheckCount = learnersWithStatus.filter(i => i.status === 'NEEDS RE-CHECK').length;

  // Filter options
  const uniqueConstituencies = useMemo(() => {
    const set = new Set<string>();
    learners.forEach(l => {
      if (l.constituency_name && l.constituency_name.trim()) set.add(l.constituency_name.trim());
    });
    return Array.from(set).sort();
  }, [learners]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return learnersWithStatus.filter(item => {
      const { learner, status, party, committee, bench, constName, constNum } = item;

      // Status filter
      if (statusFilter === 'CHECKED' && status !== 'CHECKED') return false;
      if (statusFilter === 'NOT_CHECKED' && status !== 'NOT CHECKED') return false;
      if (statusFilter === 'NEEDS_RECHECK' && status !== 'NEEDS RE-CHECK') return false;

      // Party filter
      if (partyFilter !== 'ALL' && party !== partyFilter) return false;

      // Committee filter
      if (committeeFilter !== 'ALL' && committee !== committeeFilter) return false;

      // Bench filter
      if (benchFilter !== 'ALL' && bench.toLowerCase() !== benchFilter.toLowerCase()) return false;

      // Constituency filter
      if (constituencyFilter !== 'ALL' && constName !== constituencyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (learner.full_name || '').toLowerCase().includes(q);
        const codeMatch = (learner.access_code || '').toLowerCase().includes(q);
        const partyMatch = party.toLowerCase().includes(q);
        const commMatch = committee.toLowerCase().includes(q);
        const benchMatch = bench.toLowerCase().includes(q);
        const cNameMatch = constName.toLowerCase().includes(q);
        const cNumMatch = constNum.includes(q);

        if (!nameMatch && !codeMatch && !partyMatch && !commMatch && !benchMatch && !cNameMatch && !cNumMatch) {
          return false;
        }
      }

      return true;
    });
  }, [learnersWithStatus, statusFilter, partyFilter, committeeFilter, benchFilter, constituencyFilter, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Student Name',
      'Access Code',
      'Party',
      'Committee',
      'Constituency Name',
      'Constituency Number',
      'Bench',
      'Status',
      'Checked At'
    ];

    const rows = filteredRows.map(r => [
      `"${(r.learner.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.learner.access_code || '').replace(/"/g, '""')}"`,
      `"${(r.party || '').replace(/"/g, '""')}"`,
      `"${(r.committee || '').replace(/"/g, '""')}"`,
      `"${(r.constName || '').replace(/"/g, '""')}"`,
      r.constNum,
      `"${(r.bench || '').replace(/"/g, '""')}"`,
      r.status,
      r.conf?.checked_at || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(eventName || 'TN_Assembly').replace(/\s+/g, '_')}_Allocation_Confirmation_Status_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToastRef.current('Export Complete', `Exported ${rows.length} rows to CSV.`, 'success');
  };

  // Selected learner detail helper
  const selectedRowData = useMemo(() => {
    if (!selectedLearner) return null;
    return learnersWithStatus.find(i => i.learner.id === selectedLearner.id) || null;
  }, [selectedLearner, learnersWithStatus]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Top Header Card */}
      <div
        className="rounded-2xl p-5 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Allocation Confirmation Status
            </h2>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Real-time verification of student delegate allocations across Party, Committee, Constituency, and Bench.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs hover:opacity-90"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Fetch latest student check status from database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ color: isRefreshing ? 'var(--amber)' : 'var(--text-muted)' }}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-95"
            style={{ backgroundColor: 'var(--accent)' }}
            title="Download CSV report of allocation verification status"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-1"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Students
          </span>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            {totalCount}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Enrolled delegate records</p>
        </div>

        {/* Checked */}
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-1"
          style={{
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            borderColor: 'rgba(5, 150, 105, 0.3)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
              Checked
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {checkedCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
            {totalCount > 0 ? `${Math.round((checkedCount / totalCount) * 100)}% confirmed` : '0%'}
          </p>
        </div>

        {/* Not Checked */}
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-1"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Not Checked
          </span>
          <div className="text-3xl font-black" style={{ color: 'var(--text-secondary)' }}>
            {notCheckedCount}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Awaiting student check</p>
        </div>

        {/* Needs Re-check */}
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-1"
          style={{
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            borderColor: 'rgba(217, 119, 6, 0.3)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300">
              Needs Re-check
            </span>
            {needsRecheckCount > 0 && <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300">
            {needsRecheckCount}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Allocation changed post-check
          </p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div
        className="border rounded-2xl p-4 shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, access code, constituency, party, committee, bench..."
              className="w-full border rounded-xl pl-10 pr-9 py-2 text-xs focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="px-3 py-1 rounded-full font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: statusFilter === 'ALL' ? 'var(--bg-surface)' : 'var(--text-secondary)',
                borderColor: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--border)'
              }}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CHECKED')}
              className="px-3 py-1 rounded-full font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: statusFilter === 'CHECKED' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: statusFilter === 'CHECKED' ? '#ffffff' : 'var(--text-secondary)',
                borderColor: statusFilter === 'CHECKED' ? 'var(--accent)' : 'var(--border)'
              }}
            >
              Checked ({checkedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_CHECKED')}
              className="px-3 py-1 rounded-full font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: statusFilter === 'NOT_CHECKED' ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: statusFilter === 'NOT_CHECKED' ? 'var(--bg-surface)' : 'var(--text-secondary)',
                borderColor: statusFilter === 'NOT_CHECKED' ? 'var(--text-primary)' : 'var(--border)'
              }}
            >
              Not Checked ({notCheckedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NEEDS_RECHECK')}
              className="px-3 py-1 rounded-full font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: statusFilter === 'NEEDS_RECHECK' ? '#d97706' : 'var(--bg-elevated)',
                color: statusFilter === 'NEEDS_RECHECK' ? '#ffffff' : 'var(--text-secondary)',
                borderColor: statusFilter === 'NEEDS_RECHECK' ? '#d97706' : 'var(--border)'
              }}
            >
              Needs Re-check ({needsRecheckCount})
            </button>
          </div>

        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-soft)' }}>
          
          {/* Party Filter */}
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ALL">Party: All</option>
            {parties.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* Committee Filter */}
          <select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ALL">Committee: All</option>
            {committees.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Bench Filter */}
          <select
            value={benchFilter}
            onChange={(e) => setBenchFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ALL">Bench: All</option>
            <option value="Ruling">Ruling</option>
            <option value="Opposition">Opposition</option>
            <option value="Independent">Independent</option>
          </select>

          {/* Constituency Filter */}
          <select
            value={constituencyFilter}
            onChange={(e) => setConstituencyFilter(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ALL">Constituency: All</option>
            {uniqueConstituencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

        </div>

      </div>

      {/* Main Searchable Table */}
      <div
        className="border rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="border-b uppercase text-[10px] tracking-wider font-extrabold"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3 text-center">Access Code</th>
                <th className="py-3 px-3">Party</th>
                <th className="py-3 px-3">Committee</th>
                <th className="py-3 px-3">Constituency</th>
                <th className="py-3 px-2 text-center font-mono">No.</th>
                <th className="py-3 px-3">Bench</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Checked At</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    No matching student records found for the current search/filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ learner, conf, status, party, committee, bench, constName, constNum }) => {
                  const isRuling = bench.toLowerCase() === 'ruling';
                  const isOpposition = bench.toLowerCase() === 'opposition';

                  return (
                    <tr
                      key={learner.id}
                      onClick={() => setSelectedLearner(learner)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Student */}
                      <td className="py-3 px-4 font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
                        <div>{learner.full_name}</div>
                        <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                          {learner.department || 'General'} • {learner.academic_year || '1st Year'}
                        </div>
                      </td>

                      {/* Access Code */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className="font-mono text-xs font-extrabold px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {learner.access_code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(learner.access_code);
                            }}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                            title="Copy code"
                          >
                            {copiedCode === learner.access_code ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Party */}
                      <td className="py-3 px-3">
                        <span className="font-semibold truncate max-w-[140px] block" style={{ color: 'var(--text-primary)' }}>
                          {party || <span className="italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </span>
                      </td>

                      {/* Committee */}
                      <td className="py-3 px-3">
                        <span className="truncate max-w-[150px] block" style={{ color: 'var(--text-secondary)' }}>
                          {committee || <span className="italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </span>
                      </td>

                      {/* Constituency */}
                      <td className="py-3 px-3">
                        <span className="font-medium truncate max-w-[140px] block" style={{ color: 'var(--text-secondary)' }}>
                          {constName || <span className="italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </span>
                      </td>

                      {/* No. */}
                      <td className="py-3 px-2 text-center font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                        {constNum ? `#${constNum}` : '—'}
                      </td>

                      {/* Bench */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isRuling
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            : isOpposition
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                        }`}>
                          {bench || 'DELEGATE'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {status === 'CHECKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>CHECKED</span>
                          </span>
                        )}
                        {status === 'NEEDS RE-CHECK' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>NEEDS RE-CHECK</span>
                          </span>
                        )}
                        {status === 'NOT CHECKED' && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>NOT CHECKED</span>
                          </span>
                        )}
                      </td>

                      {/* Checked At */}
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {conf?.checked_at ? formatCheckedDate(conf.checked_at) : '—'}
                      </td>

                      {/* Details button */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLearner(learner);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          title="View student allocation details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          className="p-4 border-t flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)'
          }}
        >
          <span>Showing {filteredRows.length} of {totalCount} students</span>
          <span className="text-[11px]">Click any student row to view full allocation details</span>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedLearner && selectedRowData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="border rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                  Delegate Record Detail
                </span>
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {selectedLearner.full_name}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedLearner.department} • {selectedLearner.academic_year}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLearner(null)}
                className="p-1.5 rounded-xl border hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Alert Banner */}
            {selectedRowData.status === 'CHECKED' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-300">Allocation Checked</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Confirmed on {formatCheckedDate(selectedRowData.conf?.checked_at)}
                  </div>
                </div>
              </div>
            )}

            {selectedRowData.status === 'NEEDS RE-CHECK' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Allocation changed after previous confirmation — student must check again.</span>
                </div>
                <div className="text-xs pl-6" style={{ color: 'var(--text-secondary)' }}>
                  Previously checked on {formatCheckedDate(selectedRowData.conf?.checked_at)}
                </div>
              </div>
            )}

            {selectedRowData.status === 'NOT CHECKED' && (
              <div
                className="p-4 rounded-2xl border flex items-center gap-3"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
              >
                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-extrabold" style={{ color: 'var(--text-primary)' }}>Not Checked</div>
                  <div style={{ color: 'var(--text-muted)' }}>Student has not yet explicitly confirmed their allocation.</div>
                </div>
              </div>
            )}

            {/* Current Allocation Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Current Allocation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Access Code</span>
                  <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedLearner.access_code}</p>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Bench</span>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRowData.bench || 'Not Assigned'}</p>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Party</span>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRowData.party || 'Not Assigned'}</p>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Committee</span>
                  <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedRowData.committee || 'Not Assigned'}</p>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Constituency Name</span>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRowData.constName || 'Not Assigned'}</p>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-0.5"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Constituency Number</span>
                  <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedRowData.constNum ? `#${selectedRowData.constNum}` : 'Not Assigned'}
                  </p>
                </div>

              </div>
            </div>

            {/* If NEEDS RE-CHECK: show what was previously confirmed */}
            {selectedRowData.status === 'NEEDS RE-CHECK' && selectedRowData.conf && (
              <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
                <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Previously Confirmed Snapshot
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-amber-500/10 border border-amber-500/20" style={{ color: 'var(--text-secondary)' }}>
                  <div><strong>Party:</strong> {selectedRowData.conf.confirmed_party || '—'}</div>
                  <div><strong>Committee:</strong> {selectedRowData.conf.confirmed_committee || '—'}</div>
                  <div><strong>Constituency:</strong> {selectedRowData.conf.confirmed_constituency_name || '—'}</div>
                  <div><strong>No:</strong> {selectedRowData.conf.confirmed_constituency_number !== undefined ? `#${selectedRowData.conf.confirmed_constituency_number}` : '—'}</div>
                  <div className="col-span-2"><strong>Bench:</strong> {selectedRowData.conf.confirmed_bench || '—'}</div>
                </div>
              </div>
            )}

            {/* Modal Close */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLearner(null)}
                className="px-5 py-2.5 rounded-xl border text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
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
