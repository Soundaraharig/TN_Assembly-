import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Learner, Party } from '../../types';
import {
  getResolvedPartyName,
  getResolvedLearnerBench,
  isChiefMinisterRole,
  isSpeakerRole,
  isDeputySpeakerRole,
  isLeaderOfOppositionRole,
  isAssemblyRoleMatching,
  CANONICAL_ROLES
} from '../../services/storageService';
import {
  Landmark,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Search,
  ChevronDown,
  UserCheck,
  Lock,
  Pencil,
  Check,
  X
} from 'lucide-react';

interface CabinetTabProps {
  learners: Learner[];
  parties?: Party[];
  eventId?: string;
  savedMinistries?: string[];
  isLocked?: boolean;
  onSaveCabinet?: (ministries: string[]) => void | Promise<any>;
  onAssignCabinetRole?: (learnerId: string, portfolioRole: string) => void | Promise<any>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export interface MinistryItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

// Helper Searchable Dropdown for assigning delegates to portfolio roles
interface SearchableDelegateSelectProps {
  learners: Learner[];
  parties?: Party[];
  currentLearnerId?: string;
  disabled?: boolean;
  onSelect: (learnerId: string) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  placeholder?: string;
  allLearners?: Learner[];
  assignedMinisterMap?: Map<string, string>;
  portfolioRole?: string;
}

const SearchableDelegateSelect: React.FC<SearchableDelegateSelectProps> = ({
  learners,
  parties = [],
  currentLearnerId,
  disabled = false,
  onSelect,
  onShowToast,
  placeholder = 'Search by name or constituency no...',
  allLearners,
  assignedMinisterMap
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

  const filtered = (learners || []).filter(l => {
    if (!query) return true;
    const q = query.toLowerCase();
    const nameMatch = l.full_name?.toLowerCase().includes(q);
    const constNoMatch = String(l.constituency_number || '').toLowerCase().includes(q);
    const constNameMatch = l.constituency_name?.toLowerCase().includes(q);
    const codeMatch = l.access_code?.toLowerCase().includes(q);
    return nameMatch || constNoMatch || constNameMatch || codeMatch;
  });

  const selectedLearner = (learners || []).find(l => l.id === currentLearnerId) || (allLearners || []).find(l => l.id === currentLearnerId);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => {
          if (disabled) {
            onShowToast?.('Roster Locked', 'Unlock event in Overview tab to edit assignments', 'info');
            return;
          }
          setIsOpen(!isOpen);
        }}
        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors shadow-xs ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
            : 'cursor-pointer hover:border-amber-500'
        }`}
        style={{ backgroundColor: disabled ? undefined : 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        <span className="truncate flex items-center gap-1.5">
          {disabled && <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
          {selectedLearner
            ? `${selectedLearner.full_name} (${selectedLearner.constituency_number ? `Const #${selectedLearner.constituency_number} - ` : ''}${selectedLearner.constituency_name || 'MLA'})`
            : (disabled ? '-- Portfolio Locked --' : '-- Select / Assign Minister --')}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {!disabled && isOpen && (
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
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span>
              <span>Unassign / Clear Role</span>
            </button>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400 px-3 py-3 italic text-center">No matching delegates found</p>
            ) : (
              filtered.map(l => {
                const alreadyAssignedRole = assignedMinisterMap?.get(l.id);
                const isCurrent = l.id === currentLearnerId;
                const isAssignedElsewhere = Boolean(alreadyAssignedRole && !isCurrent);

                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={isAssignedElsewhere}
                    onClick={() => {
                      if (isAssignedElsewhere) {
                        onShowToast?.(
                          'Delegate Already Appointed',
                          `${l.full_name} is already assigned as ${alreadyAssignedRole}. Unassign them from that portfolio first.`,
                          'info'
                        );
                        return;
                      }
                      onSelect(l.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 border cursor-pointer ${
                      isAssignedElsewhere
                        ? 'opacity-40 cursor-not-allowed bg-slate-500/5 border-transparent'
                        : isCurrent
                        ? 'bg-amber-500/15 text-amber-500 font-bold border-amber-500/40 shadow-xs'
                        : 'hover:bg-slate-500/10 border-transparent'
                    }`}
                    style={{ color: isCurrent ? undefined : 'var(--text-primary)' }}
                    title={isAssignedElsewhere ? `Already appointed as ${alreadyAssignedRole}` : undefined}
                  >
                    {/* Top Row: Full Name + Constituency Badge */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-bold text-xs" style={{ color: isCurrent ? undefined : 'var(--text-primary)' }}>
                        {l.full_name}
                      </span>
                      {l.constituency_number ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 font-medium">
                          #{l.constituency_number} {l.constituency_name ? l.constituency_name.split('(')[0].replace(/^[0-9]+\s*-\s*/, '').trim() : ''}
                        </span>
                      ) : l.constituency_name ? (
                        <span className="text-[10px] font-mono text-amber-500 shrink-0">
                          {l.constituency_name}
                        </span>
                      ) : null}
                    </div>

                    {/* Bottom Row: Party & Bench info + Already Assigned Alert */}
                    <div className="flex items-center justify-between gap-2 w-full text-[11px] text-slate-400">
                      <span className="truncate">
                        {getResolvedPartyName(l, parties) || 'Independent'} • {getResolvedLearnerBench(l, parties)} Bench
                      </span>
                      {isAssignedElsewhere && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          Already: {alreadyAssignedRole}
                        </span>
                      )}
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

export const CabinetTab: React.FC<CabinetTabProps> = ({
  learners,
  parties = [],
  eventId,
  savedMinistries,
  isLocked = false,
  onSaveCabinet,
  onAssignCabinetRole,
  onShowToast
}) => {
  // Ministries come ONLY from Supabase via savedMinistries prop — NO defaults
  const [ministries, setMinistries] = useState<string[]>(() => {
    if (Array.isArray(savedMinistries) && savedMinistries.length > 0) {
      return savedMinistries;
    }
    if (eventId && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`tn_assembly_cabinet_${eventId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return Array.isArray(savedMinistries) ? savedMinistries : [];
  });
  const [newMinistryInput, setNewMinistryInput] = useState('');
  const [viewMode, setViewMode] = useState<'roster' | 'config'>('roster');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const prevEventIdRef = useRef<string | undefined>(eventId);

  // Sync ministries from savedMinistries prop (Supabase source of truth)
  useEffect(() => {
    console.log("Question Hour event ID:", eventId);
    if (Array.isArray(savedMinistries)) {
      setMinistries(savedMinistries);
    } else if (eventId && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`tn_assembly_cabinet_${eventId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setMinistries(parsed);
            return;
          }
        }
      } catch {}
    }
  }, [savedMinistries, eventId]);

  // Reset editing state when event changes
  useEffect(() => {
    if (eventId !== prevEventIdRef.current) {
      prevEventIdRef.current = eventId;
      setEditingIndex(null);
      setEditingName('');
      setNewMinistryInput('');
    }
  }, [eventId]);

  const eventLearners = useMemo(() => {
    return eventId ? (learners || []).filter(l => l.event_id === eventId) : (learners || []);
  }, [learners, eventId]);

  const eventParties = useMemo(() => {
    return eventId ? (parties || []).filter(p => p.event_id === eventId) : (parties || []);
  }, [parties, eventId]);

  // Map of learner_id -> portfolio role for any delegate currently assigned a cabinet, shadow, or leadership role
  const assignedMinisterMap = useMemo(() => {
    const map = new Map<string, string>();
    (eventLearners || []).forEach(l => {
      if (l.role) {
        if (isChiefMinisterRole(l.role)) {
          map.set(l.id, CANONICAL_ROLES.CHIEF_MINISTER);
        } else if (isSpeakerRole(l.role)) {
          map.set(l.id, CANONICAL_ROLES.SPEAKER);
        } else if (isDeputySpeakerRole(l.role)) {
          map.set(l.id, CANONICAL_ROLES.DEPUTY_SPEAKER);
        } else if (isLeaderOfOppositionRole(l.role)) {
          map.set(l.id, CANONICAL_ROLES.LEADER_OF_OPPOSITION);
        } else if (l.role.startsWith('Minister for') || l.role.startsWith('Shadow Minister for')) {
          map.set(l.id, l.role);
        }
      }
    });
    return map;
  }, [eventLearners]);

  const activeCount = ministries.length;

  // Persist ministries to Supabase via the existing onSaveCabinet callback
  const persistMinistries = useCallback(async (updated: string[]) => {
    if (eventId && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`tn_assembly_cabinet_${eventId}`, JSON.stringify(updated));
      } catch {}
    }
    if (!onSaveCabinet) return;
    setIsSaving(true);
    try {
      const result = await onSaveCabinet(updated);
      if (result && result.success === false) {
        onShowToast('Save Failed', 'Failed to persist ministries to database. Please retry.', 'error');
      }
    } catch {
      onShowToast('Save Failed', 'An error occurred while saving. Please retry.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [eventId, onSaveCabinet, onShowToast]);

  const handleAddMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    const trimmed = newMinistryInput.trim();
    if (!trimmed) return;

    // Check for duplicate (case-insensitive) within this event
    const exists = ministries.some(m => m.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      onShowToast('Already Exists', 'This ministry is already configured for this event', 'info');
      return;
    }

    const updated = [...ministries, trimmed];
    setMinistries(updated);
    setNewMinistryInput('');
    await persistMinistries(updated);
    onShowToast('Ministry Added', `Added "${trimmed}" to this event`, 'success');
  };

  const handleDeleteMinistry = async (index: number) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    const name = ministries[index];
    const shortName = name.replace(/^Ministry\s+(of|for)\s+/i, '').trim();
    const rulingRole = `Minister for ${shortName}`;
    const shadowRole = `Shadow Minister for ${shortName}`;

    // Clear any learner assignments for this ministry
    if (onAssignCabinetRole) {
      const rulingHolder = eventLearners.find(l => isAssemblyRoleMatching(l.role, rulingRole));
      const shadowHolder = eventLearners.find(l => isAssemblyRoleMatching(l.role, shadowRole));
      if (rulingHolder) {
        await onAssignCabinetRole('', rulingRole);
      }
      if (shadowHolder) {
        await onAssignCabinetRole('', shadowRole);
      }
    }

    const updated = ministries.filter((_, i) => i !== index);
    setMinistries(updated);
    setEditingIndex(null);
    await persistMinistries(updated);
    onShowToast('Ministry Removed', `Removed "${name}" from this event`, 'info');
  };

  const handleStartRename = (index: number) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    setEditingIndex(index);
    setEditingName(ministries[index]);
  };

  const handleCancelRename = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleConfirmRename = async () => {
    if (editingIndex === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      onShowToast('Invalid Name', 'Ministry name cannot be empty', 'error');
      return;
    }

    const oldName = ministries[editingIndex];
    if (trimmed === oldName) {
      handleCancelRename();
      return;
    }

    // Check for duplicate
    const exists = ministries.some((m, i) => i !== editingIndex && m.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      onShowToast('Already Exists', 'Another ministry with this name already exists for this event', 'info');
      return;
    }

    // Update ministry name in the list
    const updated = ministries.map((m, i) => i === editingIndex ? trimmed : m);
    setMinistries(updated);
    setEditingIndex(null);
    setEditingName('');

    // Update learner role names if assigned
    const oldShort = oldName.replace(/^Ministry\s+(of|for)\s+/i, '').trim();
    const newShort = trimmed.replace(/^Ministry\s+(of|for)\s+/i, '').trim();
    const oldRuling = `Minister for ${oldShort}`;
    const oldShadow = `Shadow Minister for ${oldShort}`;
    const newRuling = `Minister for ${newShort}`;
    const newShadow = `Shadow Minister for ${newShort}`;

    if (onAssignCabinetRole) {
      const rulingHolder = eventLearners.find(l => isAssemblyRoleMatching(l.role, oldRuling));
      const shadowHolder = eventLearners.find(l => isAssemblyRoleMatching(l.role, oldShadow));

      // Reassign with new role names to keep them connected
      if (rulingHolder) {
        await onAssignCabinetRole(rulingHolder.id, newRuling);
      }
      if (shadowHolder) {
        await onAssignCabinetRole(shadowHolder.id, newShadow);
      }
    }

    await persistMinistries(updated);
    onShowToast('Ministry Renamed', `Renamed "${oldName}" → "${trimmed}"`, 'success');
  };

  const handleAssignRole = async (learnerId: string, portfolioRole: string) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to assign cabinet ministers', 'info');
      return;
    }

    if (learnerId) {
      const learner = (eventLearners || []).find(l => l.id === learnerId);
      if (learner) {
        const bench = getResolvedLearnerBench(learner, eventParties);
        if (isChiefMinisterRole(portfolioRole) && bench === 'Opposition') {
          onShowToast('Bench Rule Violation', 'Chief Minister must belong to the Ruling party / bench.', 'error');
          return;
        }
        if (isLeaderOfOppositionRole(portfolioRole) && bench === 'Ruling') {
          onShowToast('Bench Rule Violation', 'Leader of Opposition must belong to the Opposition party / bench.', 'error');
          return;
        }
      }
    }

    if (onAssignCabinetRole) {
      const result = await onAssignCabinetRole(learnerId, portfolioRole);
      if (result && result.success === false) {
        onShowToast('Assignment Failed', result.message || 'Failed to assign role. Please retry.', 'error');
        return;
      }
      const learner = (eventLearners || []).find(l => l.id === learnerId);
      if (learner) {
        onShowToast('Minister Appointed', `Assigned ${learner.full_name} as ${portfolioRole}`, 'success');
      } else {
        onShowToast('Role Unassigned', `Cleared assignment for ${portfolioRole}`, 'info');
      }
    }
  };

  // Build active ministry portfolios from the event-specific ministry list
  const cabinetPortfolios = ministries.map((name, index) => {
    const shortName = name.replace(/^Ministry\s+(of|for)\s+/i, '').trim();
    return {
      id: `ministry_${index}`,
      ministry: name,
      rulingRole: `Minister for ${shortName}`,
      shadowRole: `Shadow Minister for ${shortName}`
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Lock Notice Banner */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Cabinet Roster & Assignments Locked</p>
              <p className="text-[11px] text-rose-500/80 font-normal mt-0.5">
                Event is currently locked for live parliament session. Unlock in Event Overview tab to configure active ministries or reassign delegates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Cabinet & Shadow Ministry Roster</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Search delegates by Name, Access Code, or Constituency Number / Name to assign Cabinet Ministers and Shadow Ministers directly to each portfolio slot.
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {activeCount} Active Portfolios
          </span>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'roster' ? 'config' : 'roster')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === 'roster' ? (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>Configure Active Ministries ({activeCount})</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>View & Assign Cabinet Roster</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'roster' ? (
        /* Roster View with Searchable Dropdown Selectors for Each Ministry */
        <div className="space-y-6">
          
          {/* Key Parliamentary Leadership Positions */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Key Assembly Leadership Roles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { role: CANONICAL_ROLES.SPEAKER, title: 'Assembly Speaker', bench: 'Neutral / Presiding', allowedBench: undefined },
                { role: CANONICAL_ROLES.DEPUTY_SPEAKER, title: 'Deputy Speaker', bench: 'Neutral / Presiding', allowedBench: undefined },
                { role: CANONICAL_ROLES.CHIEF_MINISTER, title: 'Chief Minister', bench: 'Ruling Bench', allowedBench: 'Ruling' as const },
                { role: CANONICAL_ROLES.LEADER_OF_OPPOSITION, title: 'Leader of Opposition', bench: 'Opposition Bench', allowedBench: 'Opposition' as const }
              ].map(item => {
                const holder = (eventLearners || []).find(l => {
                  if (item.role === CANONICAL_ROLES.CHIEF_MINISTER) return isChiefMinisterRole(l.role);
                  if (item.role === CANONICAL_ROLES.SPEAKER) return isSpeakerRole(l.role);
                  if (item.role === CANONICAL_ROLES.DEPUTY_SPEAKER) return isDeputySpeakerRole(l.role);
                  if (item.role === CANONICAL_ROLES.LEADER_OF_OPPOSITION) return isLeaderOfOppositionRole(l.role);
                  return false;
                });

                const eligibleLearners = (eventLearners || []).filter(l => {
                  if (holder && l.id === holder.id) return true;
                  if (!item.allowedBench) return true;
                  const b = getResolvedLearnerBench(l, eventParties);
                  return b === item.allowedBench;
                });

                return (
                  <div
                    key={item.role}
                    className="rounded-2xl p-4 border space-y-3 shadow-sm transition-all"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                          {item.bench}
                        </span>
                        <h4 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                      </div>
                      {holder && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Appointed
                        </span>
                      )}
                    </div>

                    <SearchableDelegateSelect
                      learners={eligibleLearners}
                      parties={eventParties}
                      allLearners={eventLearners}
                      currentLearnerId={holder?.id}
                      disabled={isLocked}
                      onSelect={(learnerId) => handleAssignRole(learnerId, item.role)}
                      onShowToast={onShowToast}
                      assignedMinisterMap={assignedMinisterMap}
                      portfolioRole={item.role}
                      placeholder={
                        item.allowedBench
                          ? `Search ${item.allowedBench} delegates for ${item.title}...`
                          : `Search delegates for ${item.title}...`
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cabinet & Shadow Ministries Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-500" /> Ministry Portfolio Assignments ({cabinetPortfolios.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Select delegates for Ruling Cabinet Ministers & Opposition Shadow Ministers
              </p>
            </div>

            {cabinetPortfolios.length === 0 ? (
              <div className="rounded-2xl p-8 border border-dashed text-center space-y-3" style={{ borderColor: 'var(--border-soft)' }}>
                <Landmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No ministries configured for this event.</p>
                <p className="text-xs text-slate-400">
                  Switch to <strong>Configure Active Ministries</strong> to add your custom ministries.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cabinetPortfolios.map(port => {
                  const rulingHolder = (eventLearners || []).find(l => isAssemblyRoleMatching(l.role, port.rulingRole));
                  const shadowHolder = (eventLearners || []).find(l => isAssemblyRoleMatching(l.role, port.shadowRole));

                  return (
                    <div
                      key={port.id}
                      className="rounded-2xl p-5 border space-y-4 shadow-sm transition-all"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
                    >
                      <div className="border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
                        <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{port.ministry}</h4>
                        <p className="text-[11px] text-slate-400">Assign Cabinet Minister & Opposition Counterpart</p>
                      </div>

                      <div className="space-y-3">
                        {/* Ruling Cabinet Minister */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-500 flex items-center gap-1">
                              ● {port.rulingRole}
                            </span>
                            {rulingHolder && (
                              <span className="text-[10px] text-slate-400">
                                {getResolvedPartyName(rulingHolder, eventParties) || 'Ruling'}
                              </span>
                            )}
                          </div>
                          <SearchableDelegateSelect
                            learners={eventLearners}
                            parties={eventParties}
                            currentLearnerId={rulingHolder?.id}
                            disabled={isLocked}
                            onSelect={(learnerId) => handleAssignRole(learnerId, port.rulingRole)}
                            onShowToast={onShowToast}
                            placeholder="Search minister name or const no..."
                            assignedMinisterMap={assignedMinisterMap}
                            portfolioRole={port.rulingRole}
                          />
                        </div>

                        {/* Shadow Cabinet Minister */}
                        <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-rose-500 flex items-center gap-1">
                              ● {port.shadowRole}
                            </span>
                            {shadowHolder && (
                              <span className="text-[10px] text-slate-400">
                                {getResolvedPartyName(shadowHolder, eventParties) || 'Opposition'}
                              </span>
                            )}
                          </div>
                          <SearchableDelegateSelect
                            learners={eventLearners}
                            parties={eventParties}
                            currentLearnerId={shadowHolder?.id}
                            disabled={isLocked}
                            onSelect={(learnerId) => handleAssignRole(learnerId, port.shadowRole)}
                            onShowToast={onShowToast}
                            placeholder="Search shadow minister name or const no..."
                            assignedMinisterMap={assignedMinisterMap}
                            portfolioRole={port.shadowRole}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Configuration View — Add/Rename/Delete Ministries */
        <div className="space-y-4">
          
          {/* Add ministry input at top */}
          <form onSubmit={handleAddMinistry} className="space-y-2">
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                placeholder="Add your own ministry (e.g. Ministry of Environment)"
                value={newMinistryInput}
                onChange={(e) => setNewMinistryInput(e.target.value)}
                disabled={isLocked || isSaving}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newMinistryInput.trim() || isLocked || isSaving}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-bold text-xs border border-amber-600 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Add ministries for this event. Each ministry you add is saved to the database immediately and persists across browser refreshes and sessions.
            </p>
          </form>

          {/* Ministry list */}
          {ministries.length === 0 ? (
            <div className="rounded-2xl p-8 border border-dashed text-center space-y-3" style={{ borderColor: 'var(--border-soft)' }}>
              <Landmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No ministries configured for this event.</p>
              <p className="text-xs text-slate-400">
                Use the input above to add your custom ministries. They will be saved to the database permanently.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Event Ministries ({ministries.length})
              </label>

              {ministries.map((name, index) => (
                <div
                  key={`ministry_${index}_${name}`}
                  className="w-full p-3 rounded-2xl border transition-all bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80 shadow-xs flex items-center justify-between gap-3"
                >
                  {editingIndex === index ? (
                    /* Inline rename mode */
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmRename}
                        disabled={isSaving}
                        className="text-emerald-500 hover:text-emerald-600 p-1 transition-colors cursor-pointer"
                        title="Confirm rename"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                        title="Cancel rename"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Normal display mode */
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 w-6 text-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartRename(index)}
                          disabled={isLocked || isSaving}
                          className="text-slate-400 hover:text-amber-600 p-1 transition-colors cursor-pointer disabled:opacity-40"
                          title="Rename ministry"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMinistry(index)}
                          disabled={isLocked || isSaving}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete ministry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
