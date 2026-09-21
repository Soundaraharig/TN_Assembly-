import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  const refreshConfirmations = useCallback(async (silent = false) => {
    if (!eventId) return;
    setIsRefreshing(true);
    try {
      const records = await storageService.fetchAllAllocationConfirmations(eventId);
      setConfirmations(records);
      if (!silent) {
        onShowToast('Refreshed', `Fetched latest status for ${records.length} confirmations.`, 'success');
      }
    } catch (err: any) {
      if (!silent) {
        onShowToast('Refresh Error', err?.message || 'Failed to refresh confirmations', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId, onShowToast]);

  useEffect(() => {
    if (eventId) {
      refreshConfirmations(true);
    }
    const unsub = storageService.subscribe(() => {
      setConfirmations(storageService.getAllocationConfirmations(eventId));
    });
    return unsub;
  }, [eventId, refreshConfirmations]);

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
      if (benchFilter !== 'ALL' && bench !== benchFilter) return false;

      // Constituency filter
      if (constituencyFilter !== 'ALL' && constName !== constituencyFilter) return false;

      // Search Query
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
    onShowToast('Export Complete', `Exported ${rows.length} rows to CSV.`, 'success');
  };

  // Selected learner detail helper
  const selectedRowData = useMemo(() => {
    if (!selectedLearner) return null;
    return learnersWithStatus.find(i => i.learner.id === selectedLearner.id) || null;
  }, [selectedLearner, learnersWithStatus]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Live Delegate Allocation Status
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Allocation Confirmation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verification of student delegate allocations across Party, Committee, Constituency, and Bench.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshConfirmations(false)}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Total Students
          </span>
          <div className="text-3xl font-black text-white">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-500">Roster delegate records</p>
        </div>

        {/* Checked */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
              Checked
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {checkedCount}
          </div>
          <p className="text-[11px] text-emerald-500/80">
            {totalCount > 0 ? `${Math.round((checkedCount / totalCount) * 100)}% confirmed` : '0%'}
          </p>
        </div>

        {/* Not Checked */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Not Checked
          </span>
          <div className="text-3xl font-black text-slate-300">
            {notCheckedCount}
          </div>
          <p className="text-[11px] text-slate-500">Awaiting student check</p>
        </div>

        {/* Needs Re-check */}
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
              Needs Re-check
            </span>
            {needsRecheckCount > 0 && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <div className="text-3xl font-black text-amber-400">
            {needsRecheckCount}
          </div>
          <p className="text-[11px] text-amber-500/80">Allocation changed post-check</p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, access code, constituency, party, committee, bench..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CHECKED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'CHECKED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✓ Checked ({checkedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_CHECKED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'NOT_CHECKED'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ○ Not Checked ({notCheckedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NEEDS_RECHECK')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'NEEDS_RECHECK'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ! Needs Re-check ({needsRecheckCount})
            </button>
          </div>

        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
          
          {/* Party Filter */}
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Constituency: All</option>
            {uniqueConstituencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

        </div>

      </div>

      {/* Main Searchable Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-3">Access Code</th>
                <th className="py-3.5 px-3">Party</th>
                <th className="py-3.5 px-3">Committee</th>
                <th className="py-3.5 px-3">Constituency</th>
                <th className="py-3.5 px-2 text-center">No.</th>
                <th className="py-3.5 px-3">Bench</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Checked At</th>
                <th className="py-3.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
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
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Student */}
                      <td className="py-3 px-4 font-bold text-white group-hover:text-amber-400 transition-colors">
                        <div>{learner.full_name}</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          {learner.department || 'General'} • {learner.academic_year || '1st Year'}
                        </div>
                      </td>

                      {/* Access Code */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                            {learner.access_code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(learner.access_code);
                            }}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === learner.access_code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Party */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200 truncate max-w-[140px] block">
                          {party || <span className="text-slate-600 italic">Unassigned</span>}
                        </span>
                      </td>

                      {/* Committee */}
                      <td className="py-3 px-3">
                        <span className="text-slate-300 truncate max-w-[160px] block" title={committee}>
                          {committee || <span className="text-slate-600 italic">Unassigned</span>}
                        </span>
                      </td>

                      {/* Constituency */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 truncate max-w-[140px] block">
                          {constName || <span className="text-slate-600 italic">Unassigned</span>}
                        </span>
                      </td>

                      {/* No. */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-400">
                        {constNum ? `#${constNum}` : '—'}
                      </td>

                      {/* Bench */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isRuling
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isOpposition
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {bench || 'DELEGATE'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {status === 'CHECKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            ✓ CHECKED
                          </span>
                        )}
                        {status === 'NEEDS RE-CHECK' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap animate-pulse">
                            ! NEEDS RE-CHECK
                          </span>
                        )}
                        {status === 'NOT CHECKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                            ○ NOT CHECKED
                          </span>
                        )}
                      </td>

                      {/* Checked At */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
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
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredRows.length} of {totalCount} students</span>
          <span className="text-[11px] text-slate-500">Click any student row to view full allocation details</span>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedLearner && selectedRowData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Delegate Record Detail
                </span>
                <h3 className="text-xl font-black text-white">
                  {selectedLearner.full_name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedLearner.department} • {selectedLearner.academic_year}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLearner(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Alert Banner */}
            {selectedRowData.status === 'CHECKED' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-extrabold text-emerald-400">Allocation Checked</div>
                  <div className="text-slate-400">
                    Confirmed on {formatCheckedDate(selectedRowData.conf?.checked_at)}
                  </div>
                </div>
              </div>
            )}

            {selectedRowData.status === 'NEEDS RE-CHECK' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-xs text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Allocation changed after previous confirmation — student must check again.</span>
                </div>
                <div className="text-xs text-slate-400 pl-6">
                  Previously checked on {formatCheckedDate(selectedRowData.conf?.checked_at)}
                </div>
              </div>
            )}

            {selectedRowData.status === 'NOT CHECKED' && (
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-extrabold text-slate-200">Not Checked</div>
                  <div className="text-slate-400">Student has not yet explicitly confirmed their allocation.</div>
                </div>
              </div>
            )}

            {/* Current Allocation Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Current Allocation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Access Code</span>
                  <p className="font-mono font-bold text-amber-300">{selectedLearner.access_code}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Bench</span>
                  <p className="font-bold text-white">{selectedRowData.bench || 'Not Assigned'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Party</span>
                  <p className="font-bold text-white">{selectedRowData.party || 'Not Assigned'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Committee</span>
                  <p className="font-bold text-white truncate">{selectedRowData.committee || 'Not Assigned'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Constituency Name</span>
                  <p className="font-bold text-white">{selectedRowData.constName || 'Not Assigned'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Constituency Number</span>
                  <p className="font-mono font-bold text-white">{selectedRowData.constNum ? `#${selectedRowData.constNum}` : 'Not Assigned'}</p>
                </div>

              </div>
            </div>

            {/* If NEEDS RE-CHECK: show what was previously confirmed */}
            {selectedRowData.status === 'NEEDS RE-CHECK' && selectedRowData.conf && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                  Previously Confirmed Snapshot
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-slate-300">
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
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
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
