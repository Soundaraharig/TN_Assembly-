import React, { useState, useEffect, useRef } from 'react';
import type { Committee, Learner, UserRole } from '../../types';
import { canDelete } from '../../utils/permissions';
import { Plus, BookOpen, Users, Edit, Trash2, X, Eye, Layers, UserCheck, Search, ChevronDown, Check } from 'lucide-react';

interface CommitteesTabProps {
  committees: Committee[];
  learners: Learner[];
  eventId: string;
  userRole?: UserRole;
  onAddCommittee: (committee: Partial<Committee>) => void;
  onUpdateCommittee: (committee: Committee) => void;
  onDeleteCommittee: (committeeId: string) => void;
  onSetCommitteeCount?: (count: number) => void | Promise<any>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

interface SearchableChairpersonSelectProps {
  members: Learner[];
  currentChairpersonName?: string;
  onSelect: (name: string) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  placeholder?: string;
}

const SearchableChairpersonSelect: React.FC<SearchableChairpersonSelectProps> = ({
  members = [],
  currentChairpersonName,
  onSelect,
  placeholder = 'Search member name or const no...'
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = members.filter(l => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const nameMatch = l.full_name?.toLowerCase().includes(q);
    const constNoMatch = String(l.constituency_number || '').toLowerCase().includes(q);
    const constNameMatch = l.constituency_name?.toLowerCase().includes(q);
    const partyMatch = l.party_name?.toLowerCase().includes(q);
    const deptMatch = l.department?.toLowerCase().includes(q);
    const codeMatch = l.access_code?.toLowerCase().includes(q);
    return nameMatch || constNoMatch || constNameMatch || partyMatch || deptMatch || codeMatch;
  });

  const selectedMember = members.find(l => l.full_name === currentChairpersonName);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl px-3 py-2 text-xs font-semibold border cursor-pointer flex items-center justify-between transition-colors shadow-xs hover:border-amber-500"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: currentChairpersonName ? 'var(--accent)' : 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        <span className="truncate flex items-center gap-1.5">
          {currentChairpersonName ? (
            <>
              <span className="font-bold">{currentChairpersonName}</span>
              {selectedMember && (
                <span className="text-[10px] text-slate-400">
                  ({selectedMember.party_name || 'Independent'}{selectedMember.constituency_number ? ` • #${selectedMember.constituency_number}` : ''})
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>-- Choose Chairperson from Members --</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div
          className="absolute z-50 left-0 mt-1 w-[360px] sm:w-[420px] max-w-[95vw] rounded-2xl border shadow-2xl p-2.5 space-y-2 max-h-72 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 p-2 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span>
              <span>Unassign / Clear Chairperson</span>
            </button>

            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400 px-3 py-3 italic text-center">
                No matching members found for "{query}"
              </p>
            ) : (
              filtered.map(l => {
                const isCurrent = l.full_name === currentChairpersonName;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      onSelect(l.full_name);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 border cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/15 text-amber-500 font-bold border-amber-500/40 shadow-xs'
                        : 'hover:bg-slate-500/10 border-transparent'
                    }`}
                    style={{ color: isCurrent ? undefined : 'var(--text-primary)' }}
                  >
                    {/* Top Row: Full Name + Constituency Badge */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-bold text-xs" style={{ color: isCurrent ? undefined : 'var(--text-primary)' }}>
                        {l.full_name}
                      </span>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {l.constituency_number ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                            #{l.constituency_number} {l.constituency_name ? l.constituency_name.split('(')[0].replace(/^[0-9]+\s*-\s*/, '').trim() : ''}
                          </span>
                        ) : null}
                        {isCurrent && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </div>

                    {/* Bottom Row: Party & Bench info */}
                    <div className="flex items-center justify-between gap-2 w-full text-[11px] text-slate-400">
                      <span className="truncate">
                        {l.party_name || 'Independent'} • {l.bench ? `${l.bench} Bench` : ''} {l.department ? `(${l.department})` : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CommitteesTab: React.FC<CommitteesTabProps> = ({
  committees,
  learners,
  eventId,
  userRole,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onSetCommitteeCount,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Committee | null>(null);
  const [viewRosterComm, setViewRosterComm] = useState<Committee | null>(null);

  const [committeeCountInput, setCommitteeCountInput] = useState<number>(committees.length || 4);

  // Keep input in sync with actual committees length
  useEffect(() => {
    if (committees.length > 0) {
      setCommitteeCountInput(committees.length);
    }
  }, [committees.length]);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(50);

  const openCreateModal = () => {
    setEditingComm(null);
    setName(`Committee ${committees.length + 1}`);
    setTopic('Legislative Deliberations & Policy Drafts');
    setChairperson('');
    setMaxCapacity(50);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Committee) => {
    setEditingComm(c);
    setName(c.name);
    setTopic(c.topic);
    setChairperson(c.chairperson || '');
    setMaxCapacity(c.max_capacity || 50);
    setIsModalOpen(true);
  };

  const handleApplyCommitteeCount = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.min(20, Number(committeeCountInput) || 1));
    setCommitteeCountInput(count);
    if (onSetCommitteeCount) {
      try {
        await onSetCommitteeCount(count);
        onShowToast('Committees Configured', `Configured ${count} committees (Committee 1 to Committee ${count})`, 'success');
      } catch (err: any) {
        onShowToast('Configuration Error', err?.message || 'Failed to update committees in database', 'error');
      }
    }
  };

  const handleSelectChairperson = (comm: Committee, selectedChairpersonName: string) => {
    onUpdateCommittee({
      ...comm,
      chairperson: selectedChairpersonName
    });
    onShowToast('Committee Chairperson Appointed', `${selectedChairpersonName || 'Chairperson cleared'} appointed for ${comm.name}`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;

    if (editingComm) {
      onUpdateCommittee({
        ...editingComm,
        name: name.trim(),
        topic: topic.trim(),
        chairperson: chairperson.trim(),
        max_capacity: Number(maxCapacity)
      });
      onShowToast('Committee Updated', `Updated details for ${name}`, 'success');
    } else {
      onAddCommittee({
        event_id: eventId,
        name: name.trim(),
        topic: topic.trim(),
        chairperson: chairperson.trim(),
        max_capacity: Number(maxCapacity)
      });
      onShowToast('Committee Created', `Added committee ${name}`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      <div
        className="rounded-2xl p-5 border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              Legislative Committees Control Panel
            </h2>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Manage legislative committee rooms, deliberation topics, and appoint Chairpersons directly from assigned committee members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleApplyCommitteeCount} className="flex items-center gap-2">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-1.5" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Committees:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={committeeCountInput === 0 ? '' : committeeCountInput}
                onChange={(e) => {
                  const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
                  setCommitteeCountInput(val);
                }}
                className="w-12 text-center font-bold text-xs bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
                title="Number of committees"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Set Count (1 to {committeeCountInput || 1})
            </button>
          </form>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Committee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committees.map((comm, index) => {
          const commLearners = (learners || []).filter(
            l => (comm.id && l.committee_id === comm.id) ||
                 (comm.name && l.committee_name && l.committee_name.trim().toLowerCase() === comm.name.trim().toLowerCase())
          );
          const memberCount = commLearners.length;

          return (
            <div
              key={comm.id}
              className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
                    style={{ backgroundColor: 'var(--amber)' }}
                  >
                    #{index + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewRosterComm(comm)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                      title="View Committee Roster"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(comm)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit Committee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {canDelete(userRole) && (
                      <button
                        onClick={() => {
                          onDeleteCommittee(comm.id);
                          onShowToast('Committee Deleted', `Deleted committee ${comm.name}`, 'info');
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Delete Committee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-extrabold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {comm.name}
                </h4>

                {comm.topic && (
                  <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Session Topic & Deliberation Scope
                    </span>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {comm.topic}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> Assigned Members
                  </span>
                  <span
                    className="font-bold px-2.5 py-0.5 rounded-full border text-[11px]"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {memberCount} / {comm.max_capacity || 50} Max
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Committee Chairperson:</span>
                  </label>

                  {memberCount > 0 ? (
                    <SearchableChairpersonSelect
                      members={commLearners}
                      currentChairpersonName={comm.chairperson}
                      onSelect={(selectedName) => handleSelectChairperson(comm, selectedName)}
                      onShowToast={onShowToast}
                      placeholder="Search member name or const no..."
                    />
                  ) : (
                    <div className="p-2 rounded-xl border text-[11px] italic" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                      No members allocated to this committee yet. (Run Auto-Allocation in Allocation Tab).
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border animate-slide-up"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingComm ? 'Edit Committee' : 'Add Committee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Committee 1 - Public Accounts"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Deliberation Topic *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Curriculum Modernization & AI Ethics in Higher Education"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl p-3 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Max Capacity</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  {editingComm ? 'Save Changes' : 'Create Committee'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {viewRosterComm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{viewRosterComm.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assigned Member Delegates Roster</p>
              </div>
              <button onClick={() => setViewRosterComm(null)} className="p-1 rounded-lg hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {learners.filter(l => (viewRosterComm.id && l.committee_id === viewRosterComm.id) || (viewRosterComm.name && l.committee_name && l.committee_name.trim().toLowerCase() === viewRosterComm.name.trim().toLowerCase())).length === 0 ? (
                <p className="text-xs italic py-6 text-center" style={{ color: 'var(--text-muted)' }}>No delegates assigned to this committee yet.</p>
              ) : (
                learners
                  .filter(l => (viewRosterComm.id && l.committee_id === viewRosterComm.id) || (viewRosterComm.name && l.committee_name && l.committee_name.trim().toLowerCase() === viewRosterComm.name.trim().toLowerCase()))
                  .map((learner, i) => (
                    <div
                      key={learner.id}
                      className="p-3 rounded-xl flex items-center justify-between text-xs border"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i + 1}. {learner.full_name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {learner.department} • <span className="font-bold" style={{ color: 'var(--amber)' }}>{learner.academic_year}</span> • {learner.party_name || 'Independent'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{learner.access_code}</span>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{learner.role || 'MLA'}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
