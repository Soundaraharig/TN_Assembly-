import React, { useState, useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear, BenchType } from '../../types';
import { storageService, getResolvedPartyName, getResolvedCommitteeName } from '../../services/storageService';
import { exportFullParticipantDataToCSV } from '../../utils/csvHelper';
import {
  RotateCcw,
  Download,
  Search,
  Sparkles,
  Zap,
  Scale,
  AlertCircle,
  Users,
  Shield,
  Table as TableIcon,
  Lock
} from 'lucide-react';

interface AllocationTabProps {
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventId?: string;
  onExecuteAllocation: (rulingRatio: number) => void;
  onResetAllocation: () => void;
  onUpdateLearner: (learner: Learner) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AllocationTab: React.FC<AllocationTabProps> = ({
  learners,
  parties,
  committees,
  eventId,
  onExecuteAllocation,
  onResetAllocation,
  onUpdateLearner,
  onShowToast
}) => {
  const [activeRosterView, setActiveRosterView] = useState<'party' | 'committee' | 'table'>('party');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBench, setSelectedBench] = useState<string>('ALL');
  const [selectedParty, setSelectedParty] = useState<string>('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const isAllocationLocked = storageService.getAllocationLock(eventId);

  // Delegate currently being manually edited
  const [quickEditLearner, setQuickEditLearner] = useState<Learner | null>(null);

  const totalLearners = learners.length;
  const allocatedCount = learners.filter(l => !!l.bench && !!l.party_name).length;
  const rulingCount = learners.filter(l => l.bench === 'Ruling').length;
  const oppCount = learners.filter(l => l.bench === 'Opposition').length;
  const unallocatedCount = totalLearners - allocatedCount;

  // Academic year distribution
  const yearCounts = useMemo(() => {
    const counts: Record<AcademicYear, number> = {
      '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0
    };
    learners.forEach(l => {
      const yr = l.academic_year || '1st Year';
      counts[yr] = (counts[yr] || 0) + 1;
    });
    return counts;
  }, [learners]);

  // Party breakdown
  const partyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    learners.forEach(l => {
      if (l.party_name) {
        counts[l.party_name] = (counts[l.party_name] || 0) + 1;
      }
    });
    return counts;
  }, [learners]);

  // Filtered delegate roster
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = l.full_name.toLowerCase().includes(q);
        const matchesCode = l.access_code.toLowerCase().includes(q);
        const matchesConstNo = l.constituency_number ? String(l.constituency_number).includes(q) : false;
        const matchesConstName = l.constituency_name ? l.constituency_name.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesConstNo && !matchesConstName) return false;
      }

      if (selectedBench !== 'ALL') {
        if (selectedBench === 'UNALLOCATED') {
          if (l.bench) return false;
        } else if (l.bench !== selectedBench) {
          return false;
        }
      }

      if (selectedParty !== 'ALL' && l.party_name !== selectedParty) return false;
      if (selectedCommittee !== 'ALL' && l.committee_name !== selectedCommittee) return false;
      if (selectedYear !== 'ALL' && l.academic_year !== selectedYear) return false;

      return true;
    });
  }, [learners, searchTerm, selectedBench, selectedParty, selectedCommittee, selectedYear]);

  const handleRunAutoAllocation = () => {
    if (isAllocationLocked) {
      onShowToast('Allocation Locked', 'Unlock allocation in Control Tab to run auto-allocation', 'error');
      return;
    }
    if (totalLearners === 0) {
      onShowToast('No Learners Found', 'Please add or import delegates before running allocation', 'error');
      return;
    }
    onExecuteAllocation(0.55);
    onShowToast(
      '⚡ Auto-Allocation Completed',
      `Allocated ${totalLearners} delegates across ${parties.length} parties, ${committees.length} committees & mapped 1-${Math.min(totalLearners, 234)} TN Constituencies!`,
      'success'
    );
  };

  const handleExportCSV = () => {
    exportFullParticipantDataToCSV(learners, 'TN_Assembly_Allocation_Roster.csv');
    onShowToast('Roster Exported', 'Downloaded complete allocation CSV with constituency mappings', 'info');
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAllocationLocked) {
      onShowToast('Allocation Locked', 'Allocation lock is active. Cannot modify delegate assignment.', 'error');
      return;
    }
    if (!quickEditLearner) return;
    onUpdateLearner(quickEditLearner);
    setQuickEditLearner(null);
    onShowToast('Allocation Updated', `Updated assignment for ${quickEditLearner.full_name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {isAllocationLocked && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Allocation Lock Active — Seat, party, and committee changes are disabled across the assembly.</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">CONTROL LOCK ON</span>
        </div>
      )}

      {/* Top Banner & Action Bar */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Automated TN Assembly Allocation Engine
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Equitable bench distribution, cross-year balance, portfolio assignments & 1–234 TN constituency mapping.
            {learners.length === 0 && <span className="block mt-1 font-semibold" style={{ color: 'var(--rose)' }}>Please add delegates in the Participants Tab before running auto-allocation.</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (isAllocationLocked) {
                onShowToast('Allocation Locked', 'Unlock allocation in Control Tab to reset allocations', 'error');
                return;
              }
              setIsConfirmResetOpen(true);
            }}
            disabled={isAllocationLocked}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title={isAllocationLocked ? 'Allocation is locked' : 'Reset and clear all allocated seats'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>

          <button
            onClick={handleRunAutoAllocation}
            disabled={learners.length === 0 || isAllocationLocked}
            className="px-5 py-2 rounded-xl font-black text-xs text-white shadow-md flex items-center gap-2 transition-transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--amber)',
              opacity: (learners.length === 0 || isAllocationLocked) ? 0.5 : 1,
              cursor: (learners.length === 0 || isAllocationLocked) ? 'not-allowed' : 'pointer'
            }}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>⚡ Run Auto-Allocation Now</span>
          </button>
        </div>
      </div>

      {/* Allocation Engine Config & Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Allocation Info & Controls */}
        <div
          className="lg:col-span-1 rounded-2xl p-5 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Scale className="w-4 h-4 text-amber-500" /> Allocation Config
            </h4>
          </div>

          {/* Allocation Summary */}
          <div
            className="p-3.5 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
          >
            <div className="flex justify-between text-xs">
              <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Total Delegates:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{totalLearners}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Parties Configured:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{parties.length}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Committees Configured:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{committees.length}</strong>
            </div>
            <div className="pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              Set up parties (with Ruling/Opposition bench) in the <strong>Parties Tab</strong> and committees in the <strong>Committees Tab</strong> before running allocation.
            </div>
          </div>
        </div>

        {/* Right Column: Key Summary & Party Seats */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="w-4 h-4 text-emerald-500" /> Current Allocation Status & Distribution
            </h4>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                background: allocatedCount === totalLearners && totalLearners > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                color: allocatedCount === totalLearners && totalLearners > 0 ? 'var(--accent)' : 'var(--amber)',
                borderColor: allocatedCount === totalLearners && totalLearners > 0 ? 'var(--accent)' : 'var(--border)'
              }}
            >
              {allocatedCount} of {totalLearners} Allocated ({totalLearners > 0 ? Math.round((allocatedCount / totalLearners) * 100) : 0}%)
            </span>
          </div>

          {/* Quick Stats 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>Ruling Bench</span>
              <strong className="text-lg font-black text-emerald-500">{rulingCount}</strong>
            </div>
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>Opposition Bench</span>
              <strong className="text-lg font-black text-rose-500">{oppCount}</strong>
            </div>
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>TN Constituencies</span>
              <strong className="text-lg font-black text-blue-500">{Math.min(allocatedCount, 234)} / 234</strong>
            </div>
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>Unallocated</span>
              <strong className="text-lg font-black" style={{ color: unallocatedCount > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>
                {unallocatedCount}
              </strong>
            </div>
          </div>

          {/* Party Breakdown Bars */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Political Party MLA Seat Quotas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parties.map(p => {
                const count = partyCounts[p.name] || 0;
                const pct = totalLearners > 0 ? Math.round((count / totalLearners) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border space-y-1.5"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                  >
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                        {p.name}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{count} Seats ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: p.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Year Breakdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Academic Stratification:</span>
            <span>1st Yr: <strong>{yearCounts['1st Year']}</strong></span>
            <span>2nd Yr: <strong>{yearCounts['2nd Year']}</strong></span>
            <span>3rd Yr: <strong>{yearCounts['3rd Year']}</strong></span>
            <span>4th Yr: <strong>{yearCounts['4th Year']}</strong></span>
          </div>
        </div>

      </div>

      {/* View Switcher Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveRosterView('party')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeRosterView === 'party'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Party</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRosterView('committee')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeRosterView === 'committee'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Committee Distribution</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRosterView('table')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeRosterView === 'table'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Master Delegate Table</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {allocatedCount} of {totalLearners} allocated
        </div>
      </div>

      {/* 1. BY PARTY VIEW (Image 6) */}
      {activeRosterView === 'party' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-600 font-black text-sm">
            <Users className="w-4 h-4" />
            <span>By Party</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parties.map((party) => {
              const partyMembers = learners.filter(l => l.party_name === party.name);

              return (
                <div
                  key={party.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wide">
                      {party.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                      {partyMembers.length}
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {partyMembers.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-6 text-[11px]">
                        No delegates assigned to this party yet. Run auto-allocation above.
                      </p>
                    ) : (
                      partyMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => setQuickEditLearner(member)}
                          className="flex items-center justify-between py-1 text-slate-700 dark:text-slate-300 hover:text-amber-600 cursor-pointer transition-colors"
                        >
                          <span className="font-semibold">{member.full_name}</span>
                          {member.role && member.role !== 'Member of Legislative Assembly (MLA)' ? (
                            <span className="text-[10px] text-slate-400 font-medium text-right shrink-0 ml-2">
                              {member.role}
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COMMITTEE DISTRIBUTION VIEW (Image 5) */}
      {activeRosterView === 'committee' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Committee Distribution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {committees.map((committee, idx) => {
              const members = learners.filter(
                l => l.committee_name === committee.name || l.committee_id === committee.id
              );
              const cRuling = members.filter(m => m.bench === 'Ruling').length;
              const cOpp = members.filter(m => m.bench === 'Opposition').length;

              return (
                <div
                  key={committee.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {idx + 1}. {committee.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {members.length}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold">
                    <span className="text-blue-600">Ruling: {cRuling}</span>{' '}
                    <span className="text-rose-600 ml-2">Opp: {cOpp}</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs divide-y divide-slate-50 dark:divide-slate-800/40">
                    {members.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-6 text-[11px]">
                        No delegates assigned to this committee yet.
                      </p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => setQuickEditLearner(member)}
                          className="flex items-center justify-between pt-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-600 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                member.bench === 'Ruling'
                                  ? 'bg-blue-500'
                                  : member.bench === 'Opposition'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span className="font-semibold text-xs">{member.full_name}</span>
                          </div>

                          {member.role && member.role !== 'Member of Legislative Assembly (MLA)' ? (
                            <span className="text-[10px] text-slate-400 font-medium text-right shrink-0 ml-2">
                              {member.role}
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MASTER DELEGATE TABLE VIEW */}
      {activeRosterView === 'table' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter & Search Bar */}
          <div
            className="rounded-2xl p-4 border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search delegate, access code, constituency # or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={selectedBench}
                  onChange={(e) => setSelectedBench(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Benches</option>
                  <option value="Ruling">Ruling Bench</option>
                  <option value="Opposition">Opposition Bench</option>
                  <option value="UNALLOCATED">Unallocated Only</option>
                </select>

                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Parties</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCommittee}
                  onChange={(e) => setSelectedCommittee(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Committees</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <span>Showing <strong>{filteredLearners.length}</strong> of <strong>{totalLearners}</strong> delegates</span>
              <span>Click on any row or "Edit" to adjust individual allocations manually</span>
            </div>
          </div>

          {/* Allocated Delegates Roster Table */}
          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-extrabold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <th className="py-3 px-3 text-center">S.No</th>
                    <th className="py-3 px-3 text-center">Code</th>
                    <th className="py-3 px-4">Delegate Name</th>
                    <th className="py-3 px-4">Bench</th>
                    <th className="py-3 px-4">Party</th>
                    <th className="py-3 px-3 text-center">Const. No</th>
                    <th className="py-3 px-4">Constituency Name</th>
                    <th className="py-3 px-4">Role / Cabinet</th>
                    <th className="py-3 px-4">Committee</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {filteredLearners.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center italic" style={{ color: 'var(--text-muted)' }}>
                        No delegates found matching filter criteria. Click "⚡ Run Auto-Allocation Now" to allocate all participants.
                      </td>
                    </tr>
                  ) : (
                    filteredLearners.map((learner, idx) => (
                      <tr
                        key={learner.id}
                        className="hover:bg-slate-500/5 transition-colors cursor-pointer"
                        onClick={() => setQuickEditLearner(learner)}
                      >
                        {/* S.No */}
                        <td className="py-3 px-3 text-center font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {idx + 1}
                        </td>

                        {/* Access Code */}
                        <td className="py-3 px-3 text-center">
                          <code
                            className="px-2 py-0.5 rounded font-mono font-bold text-xs border"
                            style={{ backgroundColor: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                          >
                            {learner.access_code}
                          </code>
                        </td>

                        {/* Full Name */}
                        <td className="py-3 px-4">
                          <strong className="block font-bold" style={{ color: 'var(--text-primary)' }}>
                            {learner.full_name}
                          </strong>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {learner.department} • {learner.academic_year}
                          </span>
                        </td>

                        {/* Bench */}
                        <td className="py-3 px-4">
                          {learner.bench ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                learner.bench === 'Ruling'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              }`}
                            >
                              {learner.bench}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Unallocated
                            </span>
                          )}
                        </td>

                        {/* Party */}
                        <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {getResolvedPartyName(learner, parties)}
                        </td>

                        {/* Constituency Number */}
                        <td className="py-3 px-3 text-center font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                          {learner.constituency_number ? (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              #{learner.constituency_number}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Constituency Name */}
                        <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {learner.constituency_name || '—'}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              background: learner.role?.includes('Chief') || learner.role?.includes('Speaker') || learner.role?.includes('Minister')
                                ? 'var(--amber-soft)'
                                : 'var(--bg-elevated)',
                              color: learner.role?.includes('Chief') || learner.role?.includes('Speaker') || learner.role?.includes('Minister')
                                ? 'var(--amber)'
                                : 'var(--text-secondary)',
                              borderColor: 'var(--border)'
                            }}
                          >
                            {learner.role || 'Member of Legislative Assembly (MLA)'}
                          </span>
                        </td>

                        {/* Committee */}
                        <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {getResolvedCommitteeName(learner, committees)}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickEditLearner(learner);
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors hover:bg-amber-500 hover:text-white"
                            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          >
                            Edit
                          </button>
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

      {/* Manual Quick Edit Modal */}
      {quickEditLearner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Manual Seat Adjustment
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {quickEditLearner.full_name} • Code: {quickEditLearner.access_code}
                </p>
              </div>
              <button
                onClick={() => setQuickEditLearner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Bench Assignment</label>
                <select
                  value={quickEditLearner.bench || ''}
                  onChange={(e) => setQuickEditLearner({ ...quickEditLearner, bench: e.target.value as BenchType })}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Unallocated</option>
                  <option value="Ruling">Ruling Bench</option>
                  <option value="Opposition">Opposition Bench</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Political Party</label>
                <select
                  value={quickEditLearner.party_name || ''}
                  onChange={(e) => {
                    const p = parties.find(party => party.name === e.target.value);
                    setQuickEditLearner({
                      ...quickEditLearner,
                      party_name: p ? p.name : '',
                      party_id: p ? p.id : '',
                      bench: p ? p.bench : quickEditLearner.bench
                    });
                  }}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">None / Independent</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.bench})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Const. #</label>
                  <input
                    type="number"
                    min={1}
                    max={234}
                    value={quickEditLearner.constituency_number || ''}
                    onChange={(e) => setQuickEditLearner({ ...quickEditLearner, constituency_number: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Constituency Name</label>
                  <input
                    type="text"
                    value={quickEditLearner.constituency_name || ''}
                    onChange={(e) => setQuickEditLearner({ ...quickEditLearner, constituency_name: e.target.value })}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Parliamentary Role</label>
                <input
                  type="text"
                  value={quickEditLearner.role || ''}
                  placeholder="e.g. Chief Minister, Speaker, MLA"
                  onChange={(e) => setQuickEditLearner({ ...quickEditLearner, role: e.target.value })}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Committee</label>
                <select
                  value={quickEditLearner.committee_name || ''}
                  onChange={(e) => {
                    const c = committees.find(cmt => cmt.name === e.target.value);
                    setQuickEditLearner({
                      ...quickEditLearner,
                      committee_name: c ? c.name : '',
                      committee_id: c ? c.id : ''
                    });
                  }}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">No Committee</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setQuickEditLearner(null)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-sm w-full p-6 border shadow-2xl space-y-4 animate-scale-in text-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Clear All Allocations?
              </h4>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                This will reset party assignments, bench mappings, and constituencies for all {totalLearners} delegates. You can re-run auto-allocation anytime.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetAllocation();
                  setIsConfirmResetOpen(false);
                  onShowToast('Allocations Cleared', 'All delegate party & constituency assignments have been reset', 'info');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
