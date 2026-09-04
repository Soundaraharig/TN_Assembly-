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
  CheckCircle2,
  Search,
  Users,
  Info,
  Landmark,
  Shield,
  Crown,
  Scale,
  Sparkles,
  Award
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
  onUpdateStatus?: (id: string, status: 'Pending' | 'Approved' | 'Rejected') => void;
  onDeleteNomination: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ALL_NOMINATION_ROLES: { id: NominationPosition; label: string; description: string; icon: any }[] = [
  {
    id: 'Administrator',
    label: 'Administrator',
    description: 'Supports the Speaker with impartial procedure and record-keeping.',
    icon: Shield
  },
  {
    id: 'Speaker',
    label: 'Speaker',
    description: 'Runs the House and every session with strict neutrality.',
    icon: Crown
  },
  {
    id: 'Party Leader',
    label: 'Party Leader',
    description: "Leads your party's coalition negotiations and represents it going forward.",
    icon: Landmark
  },
  {
    id: 'Student Journalist',
    label: 'Student Journalist',
    description: 'Covers the House across both days and reports on it — neutral about their own party.',
    icon: Sparkles
  },
  {
    id: 'Chief Minister',
    label: 'Prime Minister / CM',
    description: 'Heads the Government, sets the legislative agenda, and answers for the ruling coalition.',
    icon: Award
  },
  {
    id: 'Leader of Opposition',
    label: 'Leader of Opposition',
    description: 'Leads the Opposition benches, holds the Government to account, and offers the alternative.',
    icon: Scale
  },
  {
    id: 'Cabinet Minister',
    label: 'Cabinet Minister',
    description: 'Holds portfolios in Government — answers for them in Question Hour and tables Bills.',
    icon: Users
  },
  {
    id: 'Shadow Minister',
    label: 'Shadow Minister',
    description: 'Shadows portfolios from the Opposition benches — scrutinises them and offers the alternative.',
    icon: Shield
  },
  {
    id: 'Deputy Speaker',
    label: 'Deputy Speaker',
    description: 'Assists the Speaker and presides over parliamentary sessions in their absence.',
    icon: Crown
  },
  {
    id: 'Committee Chair',
    label: 'Committee Chair',
    description: 'Presides over committee policy hearings, witness testimonies, and bill scrutiny.',
    icon: FileSpreadsheet
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
  onDeleteNomination,
  onShowToast
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'party' | 'name'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

      {/* ── 3. METRIC SUMMARY CARDS GRID (Matching Image 3) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
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
            Total unique delegates filed nominations across all assembly roles.
          </p>
        </div>

        {/* Card 2: Speaker */}
        <div
          onClick={() => setSelectedFilter('Speaker')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Speaker' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Speaker' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            SPEAKER
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Speaker'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Runs the House and every session with strict neutrality.
          </p>
        </div>

        {/* Card 3: Party Leader */}
        <div
          onClick={() => setSelectedFilter('Party Leader')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Party Leader' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Party Leader' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            PARTY LEADER
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Party Leader'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Leads your party's coalition negotiations and represents it going forward.
          </p>
        </div>

        {/* Card 4: Student Journalist */}
        <div
          onClick={() => setSelectedFilter('Student Journalist')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Student Journalist' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Student Journalist' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            STUDENT JOURNALIST
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Student Journalist'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Covers the House across both days and reports on it — neutral about party.
          </p>
        </div>

        {/* Card 5: Chief Minister */}
        <div
          onClick={() => setSelectedFilter('Chief Minister')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Chief Minister' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Chief Minister' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            PRIME MINISTER / CM
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Chief Minister'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Heads the Government, sets legislative agenda, and answers for ruling coalition.
          </p>
        </div>

        {/* Card 6: Leader of Opposition */}
        <div
          onClick={() => setSelectedFilter('Leader of Opposition')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Leader of Opposition' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Leader of Opposition' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            LEADER OF OPPOSITION
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Leader of Opposition'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Leads the Opposition benches, holds Government to account, and offers alternative.
          </p>
        </div>

        {/* Card 7: Cabinet Minister */}
        <div
          onClick={() => setSelectedFilter('Cabinet Minister')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Cabinet Minister' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Cabinet Minister' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            CABINET MINISTER
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Cabinet Minister'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Holds portfolios in Government — answers in Question Hour and tables Bills.
          </p>
        </div>

        {/* Card 8: Shadow Minister */}
        <div
          onClick={() => setSelectedFilter('Shadow Minister')}
          className={`rounded-2xl p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
            selectedFilter === 'Shadow Minister' ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-500/5' : ''
          }`}
          style={{ backgroundColor: selectedFilter === 'Shadow Minister' ? undefined : 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            SHADOW MINISTER
          </span>
          <div className="text-3xl font-black my-1 text-slate-900 dark:text-white">
            {roleCounts['Shadow Minister'] || 0}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Shadows portfolios from Opposition benches — scrutinises and offers alternative.
          </p>
        </div>

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
        <div className="flex items-center gap-1.5">
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

      {/* ── 6. NOMINATED CANDIDATE CARDS GRID ── */}
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

            return (
              <div
                key={nom.id}
                className="rounded-3xl p-5 border shadow-sm space-y-3.5 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="space-y-3">
                  
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        borderColor: 'var(--accent)'
                      }}
                    >
                      {nom.position}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Nominated
                    </span>
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

                    {learner && (learner.constituency_number || learner.constituency_name) && (
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        AC #{learner.constituency_number || '—'} {learner.constituency_name || ''}
                      </p>
                    )}
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
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
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
            );
          })
        )}
      </div>

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
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.party_name || 'Independent'} • {l.bench || 'No bench'} • Code: {l.access_code})
                      {l.full_name} ({l.party_name || 'Independent'} • {l.bench || 'Delegate'}{l.constituency_number !== undefined ? ` • #${l.constituency_number}` : ''})
                    </option>
                  ))}
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


