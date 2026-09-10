import React, { useState, useMemo } from 'react';
import type { Nomination, Learner, NominationPosition, Party, UserRole } from '../../types';
import { canDelete } from '../../utils/permissions';
import { getResolvedPartyName } from '../../services/storageService';
import {
  FileSpreadsheet,
  Plus,
  Play,
  Square,
  Trash2,
  Search,
  Info,
  Landmark,
  Crown,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  History,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';

interface NominationsTabProps {
  nominations: Nomination[];
  learners: Learner[];
  parties?: Party[];
  eventId: string;
  userRole?: UserRole;
  openPositions?: string[];
  onToggleOpenPosition?: (position: string) => void;
  onSetAllOpenPositions?: (open: boolean, positions: string[]) => void;
  onAddNomination: (nom: Partial<Nomination>) => void;
  onUpdateStatus?: (id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn') => void;
  onDeleteNomination: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ALL_NOMINATION_ROLES: { id: NominationPosition; label: string; description: string; icon: any }[] = [
  {
    id: 'Chief Minister',
    label: 'Chief Minister (CM)',
    description: 'Heads the Government, sets the legislative agenda, and answers for the ruling bench.',
    icon: Award
  },
  {
    id: 'Speaker',
    label: 'Speaker',
    description: 'Runs the House and every session with strict neutrality.',
    icon: Crown
  },
  {
    id: 'Leader of Opposition',
    label: 'Leader of Opposition (LOP)',
    description: 'Leads the Opposition benches, holds the Government to account, and offers the alternative.',
    icon: Scale
  },
  {
    id: 'Party Leader',
    label: 'Party Leader',
    description: "Leads your party's coalition negotiations and represents it going forward.",
    icon: Landmark
  }
];

export const NominationsTab: React.FC<NominationsTabProps> = ({
  nominations,
  learners,
  parties = [],
  eventId,
  userRole,
  openPositions = [],
  onToggleOpenPosition,
  onSetAllOpenPositions,
  onAddNomination,
  onUpdateStatus,
  onDeleteNomination,
  onShowToast
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'party' | 'name'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Issue #1: Global default is CLOSED / collapsed for all nomination panels across all events
  const [expandedNominationIds, setExpandedNominationIds] = useState<Set<string>>(new Set());
  // Issue #2: Dedicated view for Nomination History & Audit Trail
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'history'>('cards');

  const toggleExpand = (nomId: string) => {
    setExpandedNominationIds(prev => {
      const next = new Set(prev);
      if (next.has(nomId)) next.delete(nomId);
      else next.add(nomId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNominationIds(new Set(displayedNominations.map(n => n.id)));
  };

  const collapseAll = () => {
    setExpandedNominationIds(new Set());
  };

  // Modal Form state
  const [candidateLearnerId, setCandidateLearnerId] = useState('');
  const [nomPosition, setNomPosition] = useState<NominationPosition>('Speaker');
  const [manifesto, setManifesto] = useState('');

  // Determine if nominations are currently open overall
  const isAnyOpen = openPositions.length > 0;
  const allRoleIds = ALL_NOMINATION_ROLES.map(r => r.id);

  // Total unique students nominated
  const uniqueStudentIds = useMemo(() => {
    return new Set(nominations.map(n => n.candidate_learner_id)).size;
  }, [nominations]);

  // Counts per role
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_NOMINATION_ROLES.forEach(r => {
      counts[r.id] = nominations.filter(n => {
        if (r.id === 'Chief Minister' && (n.position === 'Chief Minister' || n.position === 'Ruling Party Leader')) return true;
        if (r.id === 'Leader of Opposition' && (n.position === 'Leader of Opposition' || n.position === 'Opposition Party Leader')) return true;
        return n.position === r.id;
      }).length;
    });
    return counts;
  }, [nominations]);

  // Filtered and sorted nominations
  const displayedNominations = useMemo(() => {
    let result = nominations.filter(n => {
      // Role filter
      if (selectedFilter !== 'ALL') {
        if (selectedFilter === 'Chief Minister' && (n.position === 'Chief Minister' || n.position === 'Ruling Party Leader')) {
          // match
        } else if (selectedFilter === 'Leader of Opposition' && (n.position === 'Leader of Opposition' || n.position === 'Opposition Party Leader')) {
          // match
        } else if (n.position !== selectedFilter) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const candName = (n.candidate_name || '').toLowerCase();
        const party = (n.party_name || '').toLowerCase();
        const learner = learners.find(l => l.id === n.candidate_learner_id);
        const constNo = learner?.constituency_number ? String(learner.constituency_number) : '';
        const constName = (learner?.constituency_name || '').toLowerCase();
        if (!candName.includes(q) && !party.includes(q) && !constNo.includes(q) && !constName.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.candidate_name.localeCompare(b.candidate_name));
    } else if (sortBy === 'party') {
      result.sort((a, b) => (a.party_name || '').localeCompare(b.party_name || ''));
    }

    return result;
  }, [nominations, selectedFilter, searchQuery, sortBy, learners]);

  const handleGlobalToggle = () => {
    if (onSetAllOpenPositions) {
      onSetAllOpenPositions(!isAnyOpen, allRoleIds);
    } else if (onToggleOpenPosition) {
      if (isAnyOpen) {
        openPositions.forEach(p => onToggleOpenPosition(p));
      } else {
        allRoleIds.forEach(p => {
          if (!openPositions.includes(p)) onToggleOpenPosition(p);
        });
      }
    }
    onShowToast(
      isAnyOpen ? 'Nominations Closed' : 'Nominations Started',
      isAnyOpen
        ? 'Nominations are now closed for all delegate positions'
        : 'Nominations are now open on delegate portals for all roles',
      isAnyOpen ? 'info' : 'success'
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const learner = learners.find(l => l.id === candidateLearnerId);
    if (!learner) {
      onShowToast('Select Delegate', 'Please pick a valid registered delegate', 'error');
      return;
    }

    // Guard 1: Assigned Speaker or Deputy Speaker cannot nominate
    if (learner.role?.toLowerCase().includes('speaker')) {
      onShowToast(
        'Ineligible Candidate',
        `${learner.full_name} is assigned as ${learner.role} and cannot be nominated. Presiding officers must maintain institutional neutrality.`,
        'error'
      );
      return;
    }

    // Guard 2: Each member is eligible only one time to nominate of a post
    const alreadyNominated = nominations.some(
      n => n.candidate_learner_id === learner.id && n.position === nomPosition && n.status !== 'Rejected'
    );
    if (alreadyNominated) {
      onShowToast(
        'Already Nominated',
        `${learner.full_name} is already nominated for ${nomPosition}. Each member is eligible only once per post.`,
        'error'
      );
      return;
    }

    onAddNomination({
      event_id: eventId,
      position: nomPosition,
      candidate_learner_id: learner.id,
      candidate_name: learner.full_name,
      party_name: learner.party_name || 'Independent',
      bench: learner.bench || 'Ruling',
      manifesto: manifesto.trim() || 'Committed to upholding parliamentary rules, student welfare, and progressive policy debate.',
      status: 'Approved'
    });

    setIsAddModalOpen(false);
    setCandidateLearnerId('');
    setManifesto('');
    onShowToast('Nomination Filed', `Filed nomination for ${learner.full_name} as ${nomPosition}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* ── 1. TOP NOMINATIONS CONTROL BANNER (Matching Image 3) ── */}
      <div
        className="rounded-3xl p-5 md:p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Indicator & Helper Text */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  isAnyOpen ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <h3 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {isAnyOpen ? 'Nominations open' : 'Nominations closed'}
              </h3>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {isAnyOpen
                ? 'Students can submit and edit nominations on their Delegate Portal. Open roles are marked below.'
                : 'Students cannot submit or edit. Anything already submitted is kept and stays visible to them.'}
            </p>
          </div>

          {/* Master Start/Stop Action & Add Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>+ Manual Add</span>
            </button>

            <button
              onClick={handleGlobalToggle}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-102 ${
                isAnyOpen
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-950/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/30'
              }`}
            >
              {isAnyOpen ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop nominations</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start nominations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Role Pills Row with Individual Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          {ALL_NOMINATION_ROLES.map(role => {
            const isOpen = openPositions.includes(role.id) ||
              (role.id === 'Chief Minister' && openPositions.includes('Ruling Party Leader')) ||
              (role.id === 'Leader of Opposition' && openPositions.includes('Opposition Party Leader'));

            return (
              <button
                key={role.id}
                onClick={() => {
                  if (onToggleOpenPosition) {
                    onToggleOpenPosition(role.id);
                    onShowToast(
                      isOpen ? `${role.label} Closed` : `${role.label} Opened`,
                      `Self-nominations for ${role.label} are now ${isOpen ? 'closed' : 'open'}`,
                      isOpen ? 'info' : 'success'
                    );
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isOpen
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                    : 'bg-slate-500/5 text-slate-500 dark:text-slate-400 border-slate-500/20 hover:border-slate-400'
                }`}
                title={`Click to ${isOpen ? 'close' : 'open'} nominations for ${role.label}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. NOTICE BANNER (Matching Image 3) ── */}
      <div
        className="rounded-2xl p-4 border flex items-start gap-3 text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--amber-soft, rgba(245, 158, 11, 0.08))',
          borderColor: 'var(--amber, rgba(245, 158, 11, 0.3))',
          color: 'var(--text-primary)'
        }}
      >
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">This is a list to read, not a ballot.</span> Nothing is added automatically — when you open the Speaker or Party Leader ballots on the <span className="font-bold text-amber-500 underline decoration-amber-500/40 cursor-pointer">Elections tab</span>, pick your candidates from these names so nobody who nominated is missed.
        </div>
      </div>

      {/* ── 3. METRIC SUMMARY CARDS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Students Nominated (Highlighted) */}
        <div
          onClick={() => setSelectedFilter('ALL')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'ALL'
              ? 'ring-2 ring-amber-500/50 bg-amber-500/5 border-amber-500/40'
              : 'border-amber-500/20'
          }`}
          style={{ backgroundColor: selectedFilter === 'ALL' ? undefined : 'var(--bg-surface)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
            STUDENTS NOMINATED
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {uniqueStudentIds}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Total unique delegates filed nominations across assembly roles.
          </p>
        </div>

        {/* Cards for each election nomination role */}
        {ALL_NOMINATION_ROLES.map((roleItem) => {
          const isSelected = selectedFilter === roleItem.id;
          const count = roleCounts[roleItem.id] || 0;

          return (
            <div
              key={roleItem.id}
              onClick={() => setSelectedFilter(roleItem.id)}
              className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
                isSelected ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
              }`}
              style={{ backgroundColor: isSelected ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {roleItem.label.toUpperCase()}
              </span>
              <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
                {count}
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                {roleItem.description}
              </p>
            </div>
          );
        })}

      </div>

      {/* ── 4. FILTER PILLS BAR (Matching Image 3) ── */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedFilter === 'ALL'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
          }`}
        >
          <span>All</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${selectedFilter === 'ALL' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
            {nominations.length}
          </span>
        </button>

        {ALL_NOMINATION_ROLES.map(role => {
          const count = roleCounts[role.id] || 0;
          const isActive = selectedFilter === role.id;

          return (
            <button
              key={role.id}
              onClick={() => setSelectedFilter(role.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <span>{role.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 5. SEARCH & SORT TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        
        {/* Sort Pill Buttons (Matching Image 3: Newest first | Group by party | Name A–Z) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1">Sort:</span>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              sortBy === 'newest'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            Newest first
          </button>
          <button
            onClick={() => setSortBy('party')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              sortBy === 'party'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            Group by party
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              sortBy === 'name'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            Name A–Z
          </button>

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Quick Collapse / Expand Controls (Issue #1) */}
          <button
            onClick={expandAll}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-500/10 cursor-pointer"
            title="Expand all nomination panels"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-500/10 cursor-pointer"
            title="Collapse all nomination panels (default)"
          >
            Collapse All
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, party, constituency..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* ── SUB-TAB SWITCHER: Candidate Cards vs History Audit Trail (Issue #2) ── */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
        <button
          onClick={() => setActiveSubTab('cards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cards'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-500/10'
          }`}
        >
          <span>Nomination Panels</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-current font-mono">
            {displayedNominations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-500/10'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Nomination History & Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-current font-mono">
            {nominations.length}
          </span>
        </button>
      </div>

      {/* ── 6A. NOMINATED CANDIDATE CARDS GRID (DEFAULT CLOSED - Issue #1) ── */}
      {activeSubTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedNominations.length === 0 ? (
            <div
              className="col-span-full py-16 text-center rounded-3xl border italic text-xs space-y-2"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <FileSpreadsheet className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
              <p className="font-semibold">
                No candidate nominations found {selectedFilter !== 'ALL' ? `for ${selectedFilter}` : ''}.
              </p>
              <p className="text-[11px] not-italic">
                Delegates can self-nominate when positions are opened, or you can click "+ Manual Add" above.
              </p>
            </div>
          ) : (
            displayedNominations.map(nom => {
              const learner = learners.find(l => l.id === nom.candidate_learner_id);
              const partyName = learner ? getResolvedPartyName(learner, parties) : (nom.party_name || 'Independent');
              const isRuling = nom.bench === 'Ruling';
              const isExpanded = expandedNominationIds.has(nom.id);
              const nominator = nom.nominated_by_name || nom.candidate_name || 'Self-nominated';

              return (
                <div
                  key={nom.id}
                  className={`rounded-3xl border shadow-sm transition-all flex flex-col justify-between ${
                    isExpanded ? 'p-5 ring-1 ring-amber-500/40 space-y-4' : 'p-4 hover:border-amber-500/50 cursor-pointer space-y-2.5'
                  }`}
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  {/* Clickable Header for Card Accordion (Closed by default) */}
                  <div
                    onClick={() => toggleExpand(nom.id)}
                    className="cursor-pointer select-none space-y-2.5"
                    title={isExpanded ? 'Click to collapse panel' : 'Click to expand panel details'}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          borderColor: 'var(--accent)'
                        }}
                      >
                        {nom.position}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          nom.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : nom.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : nom.status === 'Withdrawn'
                            ? 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}>
                          {nom.status || 'Pending'}
                        </span>

                        <div className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Identity */}
                    <div>
                      <h4 className="text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {nom.candidate_name}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <span>{partyName}</span>
                        <span>•</span>
                        <span className={isRuling ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                          {nom.bench || 'Independent'} Bench
                        </span>
                      </div>
                    </div>

                    {/* Hint when closed */}
                    {!isExpanded && (
                      <p className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1 pt-1 border-t border-slate-500/10">
                        <span>Click to view manifesto, AC #{learner?.constituency_number || '—'} & history</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </p>
                    )}
                  </div>

                  {/* Expanded Content Section (Only shown when explicitly clicked) */}
                  {isExpanded && (
                    <div className="space-y-3.5 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                      {learner && (learner.constituency_number || learner.constituency_name) && (
                        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                          <span>Constituency:</span>
                          <span className="font-semibold text-slate-200">
                            AC #{learner.constituency_number || '—'} {learner.constituency_name || ''}
                          </span>
                        </div>
                      )}

                      {/* Who Nominated Whom */}
                      <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                        <span>Nominated by:</span>
                        <span className="font-semibold text-amber-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {nominator}
                        </span>
                      </div>

                      {/* Manifesto Quote */}
                      <div
                        className="p-3.5 rounded-2xl border text-xs italic leading-relaxed"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-soft)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        "{nom.manifesto || 'Committed to upholding parliamentary rules, student welfare, and progressive policy debate.'}"
                      </div>

                      {/* Timeline history inside card */}
                      {Array.isArray(nom.history) && nom.history.length > 0 && (
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Audit History
                          </div>
                          <div className="space-y-1">
                            {nom.history.map((h, i) => (
                              <div key={h.id || i} className="text-[10px] flex items-center justify-between text-slate-400">
                                <span>{h.status} by <strong className="text-slate-300">{h.changed_by}</strong></span>
                                <span className="font-mono text-[9px]">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Management Actions (Coordinator) */}
                      {userRole !== 'student' && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {nom.status !== 'Approved' && (
                            <button
                              onClick={() => {
                                onUpdateStatus?.(nom.id, 'Approved');
                                onShowToast('Nomination Approved', `Approved ${nom.candidate_name} for ${nom.position}`, 'success');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {nom.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                onUpdateStatus?.(nom.id, 'Rejected');
                                onShowToast('Nomination Rejected', `Rejected ${nom.candidate_name}'s nomination`, 'info');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          {nom.status !== 'Withdrawn' && (
                            <button
                              onClick={() => {
                                onUpdateStatus?.(nom.id, 'Withdrawn');
                                onShowToast('Nomination Withdrawn', `Marked ${nom.candidate_name}'s nomination as withdrawn`, 'info');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20 cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(nom.created_at || Date.now()).toLocaleDateString()}
                        </span>

                        {canDelete(userRole) && (
                          <button
                            onClick={() => {
                              onDeleteNomination(nom.id);
                              onShowToast('Nomination Removed', `Removed ${nom.candidate_name}'s nomination`, 'info');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1"
                            title="Delete nomination record"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 6B. DEDICATED NOMINATION HISTORY & AUDIT TRAIL VIEW (Issue #2) ── */}
      {activeSubTab === 'history' && (
        <div
          className="rounded-3xl p-6 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h4 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <History className="w-5 h-5 text-amber-500" />
                <span>Nomination History & Audit Trail</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit log showing who nominated whom, timestamps, and status changes strictly scoped to this event.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
              {nominations.length} total records
            </span>
          </div>

          {nominations.length === 0 ? (
            <div className="py-12 text-center text-xs italic text-slate-400">
              No nomination history recorded for this event.
            </div>
          ) : (
            <div className="divide-y divide-slate-500/10 space-y-2">
              {nominations.map(nom => {
                const nominator = nom.nominated_by_name || nom.candidate_name || 'Self-nominated';
                const historyEntries = Array.isArray(nom.history) && nom.history.length > 0
                  ? nom.history
                  : [
                      {
                        id: 'init',
                        status: nom.status || 'Submitted',
                        changed_by: nominator,
                        timestamp: nom.created_at || new Date().toISOString(),
                        comment: 'Nomination filed'
                      }
                    ];

                return (
                  <div key={nom.id} className="pt-3 pb-2 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                          style={{
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent)',
                            borderColor: 'var(--accent)'
                          }}
                        >
                          {nom.position}
                        </span>
                        <h5 className="text-sm font-bold text-slate-100">
                          {nom.candidate_name}
                        </h5>
                        <span className="text-xs text-slate-400 font-semibold">
                          ({nom.party_name} • {nom.bench} Bench)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Nominated by:</span>
                        <span className="font-bold text-amber-400">{nominator}</span>
                      </div>
                    </div>

                    {/* Progression Timeline */}
                    <div className="flex flex-wrap items-center gap-2 pl-2 border-l-2 border-amber-500/30">
                      {historyEntries.map((step, idx) => (
                        <div key={step.id || idx} className="flex items-center gap-2 text-xs">
                          {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                          <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                step.status === 'Approved'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : step.status === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : step.status === 'Withdrawn'
                                  ? 'bg-slate-500/20 text-slate-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {step.status}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                by <strong className="text-slate-200">{step.changed_by}</strong>
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-500">
                              {new Date(step.timestamp).toLocaleString()}
                            </div>
                            {step.comment && (
                              <div className="text-[10px] italic text-slate-400">
                                {step.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 7. MANUAL NOMINATION MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                File Manual Candidate Nomination
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Target Position *
                </label>
                <select
                  value={nomPosition}
                  onChange={(e) => setNomPosition(e.target.value as NominationPosition)}
                  className="w-full p-2.5 rounded-xl border focus:outline-none font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {ALL_NOMINATION_ROLES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Select Delegate *
                </label>
                <select
                  value={candidateLearnerId}
                  onChange={(e) => setCandidateLearnerId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border focus:outline-none font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose registered delegate --</option>
                  {learners.map(l => {
                    const isSpeaker = Boolean(l.role && l.role.toLowerCase().includes('speaker'));
                    const isAlreadyNom = nominations.some(
                      n => n.candidate_learner_id === l.id && n.position === nomPosition && n.status !== 'Rejected'
                    );
                    let tag = '';
                    if (isSpeaker) tag = ' [Presiding Officer - Ineligible]';
                    else if (isAlreadyNom) tag = ` [Already Nominated for ${nomPosition}]`;
                    return (
                      <option key={l.id} value={l.id} disabled={isSpeaker || isAlreadyNom}>
                        {l.full_name} ({l.party_name || 'Independent'} • {l.bench || 'Delegate'}{l.constituency_number !== undefined ? ` • #${l.constituency_number}` : ''}){tag}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Key Manifesto / Candidacy Pitch
                </label>
                <textarea
                  rows={3}
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="Outline key policy priorities, parliamentary reform vision, and leadership promise..."
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  File Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


