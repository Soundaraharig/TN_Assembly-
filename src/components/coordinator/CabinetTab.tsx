import React, { useState, useEffect, useRef } from 'react';
import type { Learner } from '../../types';
import {
  Landmark,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Users,
  Search,
  ChevronDown,
  UserCheck,
  Lock
} from 'lucide-react';

interface CabinetTabProps {
  learners: Learner[];
  eventId?: string;
  savedMinistries?: string[];
  isLocked?: boolean;
  onSaveCabinet?: (ministries: string[]) => void;
  onAssignCabinetRole?: (learnerId: string, portfolioRole: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export interface MinistryItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

export const DEFAULT_MINISTRY_ITEMS: MinistryItem[] = [
  { id: 'min_edu', name: 'Ministry of Education' },
  { id: 'min_wcd', name: 'Ministry of Women & Child Development' },
  { id: 'min_sports', name: 'Ministry of Youth Affairs & Sports' },
  { id: 'min_health', name: 'Ministry of Health & Family Welfare' },
  { id: 'min_social', name: 'Ministry of Social Justice & Empowerment' },
  { id: 'min_transport', name: 'Ministry of Road Transport & Highways' },
  { id: 'min_rural', name: 'Ministry of Rural Development' },
  { id: 'min_science', name: 'Ministry of Science & Technology' },
  { id: 'min_msme', name: 'Ministry of MSME' },
  { id: 'min_env', name: 'Ministry of Environment, Forest, & Climate Change' },
  { id: 'min_skill', name: 'Ministry of Skill Development & Entrepreneurship' },
  { id: 'min_it', name: 'Ministry of Electronics & IT' },
  { id: 'min_jal', name: 'Ministry of Jal Shakti' },
  { id: 'min_urban', name: 'Ministry of Housing & Urban Affairs' },
  { id: 'min_finance', name: 'Ministry of Finance' },
  { id: 'min_home', name: 'Ministry of Home Affairs' },
  { id: 'min_defence', name: 'Ministry of Defence' },
  { id: 'min_agri', name: 'Ministry of Agriculture' },
  { id: 'min_power', name: 'Ministry of Power' },
  { id: 'min_railways', name: 'Ministry of Railways' },
  { id: 'min_parliament', name: 'Ministry of Parliamentary Affairs' },
  { id: 'min_tourism', name: 'Ministry of Tourism & Culture' }
];

export const DEFAULT_MINISTRIES = DEFAULT_MINISTRY_ITEMS.map((m: MinistryItem) => m.name);

export const DEFAULT_CUSTOM_ITEMS: MinistryItem[] = [
  { id: 'custom_environment', name: 'Ministry of Environment', isCustom: true }
];

export const DEFAULT_SELECTED_IDS: string[] = [
  'min_edu',
  'min_wcd',
  'min_sports',
  'min_health',
  'min_skill',
  'min_finance',
  'min_home',
  'min_defence',
  'min_agri',
  'min_it',
  'min_tourism',
  'custom_environment'
];

const getStoredCustomMinistries = (eId?: string): MinistryItem[] => {
  if (!eId || typeof window === 'undefined') return DEFAULT_CUSTOM_ITEMS;
  try {
    const raw = localStorage.getItem(`tn_assembly_custom_ministries_${eId}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_CUSTOM_ITEMS;
};

const saveStoredCustomMinistries = (eId: string | undefined, customs: MinistryItem[]) => {
  if (!eId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`tn_assembly_custom_ministries_${eId}`, JSON.stringify(customs));
  } catch {
    // ignore
  }
};

// Helper Searchable Dropdown for assigning delegates to portfolio roles
const SearchableDelegateSelect: React.FC<{
  learners: Learner[];
  currentLearnerId?: string;
  disabled?: boolean;
  onSelect: (learnerId: string) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  placeholder?: string;
}> = ({ learners, currentLearnerId, disabled = false, onSelect, onShowToast, placeholder = 'Search by name or constituency no...' }) => {
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

  const selectedLearner = (learners || []).find(l => l.id === currentLearnerId);

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
          className="absolute z-40 left-0 right-0 mt-1 rounded-xl border shadow-2xl p-2 space-y-2 max-h-64 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              ✕ Unassign / Clear Role
            </button>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400 px-2 py-2 italic text-center">No matching delegates found</p>
            ) : (
              filtered.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    onSelect(l.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    l.id === currentLearnerId
                      ? 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: l.id === currentLearnerId ? undefined : 'var(--text-primary)' }}
                >
                  <div className="truncate">
                    <span className="font-bold">{l.full_name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({l.party_name || 'Independent'})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 shrink-0">
                    {l.constituency_number ? `#${l.constituency_number} ` : ''}{l.constituency_name || ''}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CabinetTab: React.FC<CabinetTabProps> = ({
  learners,
  eventId,
  savedMinistries,
  isLocked = false,
  onSaveCabinet,
  onAssignCabinetRole,
  onShowToast
}) => {
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>(DEFAULT_SELECTED_IDS);
  const [customMinistries, setCustomMinistries] = useState<MinistryItem[]>(() => getStoredCustomMinistries(eventId));
  const [newMinistryInput, setNewMinistryInput] = useState('');
  const [viewMode, setViewMode] = useState<'roster' | 'config'>('roster');

  const isInitializedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const prevSavedMinistriesRef = useRef<string[] | undefined>(savedMinistries);
  const prevEventIdRef = useRef<string | undefined>(eventId);

  const allMinistries: MinistryItem[] = [...DEFAULT_MINISTRY_ITEMS, ...customMinistries];
  const activeCount = selectedMinistryIds.length;

  useEffect(() => {
    // If event changed, reset initialization and dirty flags and reload event-specific custom ministries
    if (eventId !== prevEventIdRef.current) {
      prevEventIdRef.current = eventId;
      isInitializedRef.current = false;
      isDirtyRef.current = false;
      setCustomMinistries(getStoredCustomMinistries(eventId));
    }

    const savedChanged = JSON.stringify(prevSavedMinistriesRef.current) !== JSON.stringify(savedMinistries);

    // Only sync from props if component is uninitialized, OR if user hasn't made unsaved edits and savedMinistries content actually changed
    if (!isInitializedRef.current || (!isDirtyRef.current && savedChanged)) {
      prevSavedMinistriesRef.current = savedMinistries;
      if (Array.isArray(savedMinistries) && savedMinistries.length > 0) {
        const newSelectedIds: string[] = [];
        const currentCustoms = getStoredCustomMinistries(eventId);
        const newCustoms: MinistryItem[] = [...currentCustoms];

        savedMinistries.forEach((savedItemStr) => {
          // Find matching standard item by ID or Name
          const standardMatch = DEFAULT_MINISTRY_ITEMS.find(m => m.id === savedItemStr || m.name === savedItemStr);
          if (standardMatch) {
            if (!newSelectedIds.includes(standardMatch.id)) {
              newSelectedIds.push(standardMatch.id);
            }
            return;
          }

          // Find matching custom item by ID or Name
          const customMatch = newCustoms.find(m => m.id === savedItemStr || m.name === savedItemStr);
          if (customMatch) {
            if (!newSelectedIds.includes(customMatch.id)) {
              newSelectedIds.push(customMatch.id);
            }
            return;
          }

          // If not found in standard or custom, create a new custom item
          const newItem: MinistryItem = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: savedItemStr,
            isCustom: true
          };
          newCustoms.push(newItem);
          newSelectedIds.push(newItem.id);
        });

        setCustomMinistries(newCustoms);
        saveStoredCustomMinistries(eventId, newCustoms);
        setSelectedMinistryIds(newSelectedIds);
        isInitializedRef.current = true;
      } else if (!isInitializedRef.current) {
        setSelectedMinistryIds(DEFAULT_SELECTED_IDS);
        if (Array.isArray(savedMinistries)) {
          isInitializedRef.current = true;
        }
      }
    }
  }, [savedMinistries, eventId]);

  const toggleSelection = (id: string) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    isDirtyRef.current = true;
    setSelectedMinistryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    isDirtyRef.current = true;
    setSelectedMinistryIds(allMinistries.map(m => m.id));
  };

  const handleClearAll = () => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    isDirtyRef.current = true;
    setSelectedMinistryIds([]);
  };

  const handleResetToDefault = () => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    isDirtyRef.current = true;
    setCustomMinistries(DEFAULT_CUSTOM_ITEMS);
    saveStoredCustomMinistries(eventId, DEFAULT_CUSTOM_ITEMS);
    setSelectedMinistryIds(DEFAULT_SELECTED_IDS);
    onShowToast('Reset Complete', 'Restored default cabinet ministries', 'info');
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    const trimmed = newMinistryInput.trim();
    if (!trimmed) return;

    const exists = allMinistries.some(m => m.name.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      isDirtyRef.current = true;
      const newItem: MinistryItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        isCustom: true
      };
      const updatedCustoms = [...customMinistries, newItem];
      setCustomMinistries(updatedCustoms);
      setSelectedMinistryIds(prev => [...prev, newItem.id]);
      saveStoredCustomMinistries(eventId, updatedCustoms);
      setNewMinistryInput('');
      onShowToast('Ministry Added', `Added ${trimmed} to custom list`, 'success');
    } else {
      onShowToast('Already Exists', 'This ministry is already in the list', 'info');
    }
  };

  const handleRemoveCustom = (id: string) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    isDirtyRef.current = true;
    const itemToRemove = customMinistries.find(item => item.id === id);
    const updatedCustoms = customMinistries.filter(item => item.id !== id);
    setCustomMinistries(updatedCustoms);
    setSelectedMinistryIds(prev => prev.filter(item => item !== id));
    saveStoredCustomMinistries(eventId, updatedCustoms);
    onShowToast('Ministry Deleted', `Removed ${itemToRemove?.name || 'custom ministry'} from list`, 'info');
  };

  const handleSave = () => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to edit cabinet ministries', 'info');
      return;
    }
    const selectedMinistryNames = selectedMinistryIds
      .map(id => allMinistries.find(m => m.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    saveStoredCustomMinistries(eventId, customMinistries);
    prevSavedMinistriesRef.current = selectedMinistryNames;
    isInitializedRef.current = true;
    isDirtyRef.current = false;
    if (onSaveCabinet) {
      onSaveCabinet(selectedMinistryNames);
    }
    onShowToast('Cabinet Saved', `Saved ${selectedMinistryNames.length} active ministries for this event`, 'success');
  };

  const handleAssignRole = (learnerId: string, portfolioRole: string) => {
    if (isLocked) {
      onShowToast('Roster Locked', 'Unlock event in Overview tab to assign cabinet ministers', 'info');
      return;
    }
    if (onAssignCabinetRole) {
      onAssignCabinetRole(learnerId, portfolioRole);
      const learner = (learners || []).find(l => l.id === learnerId);
      if (learner) {
        onShowToast('Minister Appointed', `Assigned ${learner.full_name} as ${portfolioRole}`, 'success');
      } else {
        onShowToast('Role Unassigned', `Cleared assignment for ${portfolioRole}`, 'info');
      }
    }
  };

  // Build active ministry portfolios based on selected Ministry IDs
  const cabinetPortfolios = selectedMinistryIds
    .map(id => allMinistries.find(m => m.id === id))
    .filter((m): m is MinistryItem => Boolean(m))
    .map(m => {
      const shortName = m.name.replace(/^Ministry of\s+/, '');
      return {
        id: m.id,
        ministry: m.name,
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
                <CheckSquare className="w-3.5 h-3.5" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { role: 'Speaker of Legislative Assembly', title: 'Assembly Speaker', bench: 'Neutral / Presiding' },
                { role: 'Chief Minister (Leader of the House)', title: 'Chief Minister', bench: 'Ruling Bench' },
                { role: 'Leader of the Opposition', title: 'Leader of Opposition', bench: 'Opposition Bench' }
              ].map(item => {
                const holder = (learners || []).find(l => l.role === item.role);
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
                      learners={learners}
                      currentLearnerId={holder?.id}
                      disabled={isLocked}
                      onSelect={(learnerId) => handleAssignRole(learnerId, item.role)}
                      onShowToast={onShowToast}
                      placeholder={`Search name or const no for ${item.title}...`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cabinetPortfolios.map(port => {
                const rulingHolder = (learners || []).find(l => l.role === port.rulingRole);
                const shadowHolder = (learners || []).find(l => l.role === port.shadowRole);

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
                              {rulingHolder.party_name || 'Ruling'}
                            </span>
                          )}
                        </div>
                        <SearchableDelegateSelect
                          learners={learners}
                          currentLearnerId={rulingHolder?.id}
                          disabled={isLocked}
                          onSelect={(learnerId) => handleAssignRole(learnerId, port.rulingRole)}
                          onShowToast={onShowToast}
                          placeholder="Search minister name or const no..."
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
                              {shadowHolder.party_name || 'Opposition'}
                            </span>
                          )}
                        </div>
                        <SearchableDelegateSelect
                          learners={learners}
                          currentLearnerId={shadowHolder?.id}
                          disabled={isLocked}
                          onSelect={(learnerId) => handleAssignRole(learnerId, port.shadowRole)}
                          onShowToast={onShowToast}
                          placeholder="Search shadow minister name or const no..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Configuration Checklist View */
        <div className="space-y-4">
          
          {/* Select all / Clear links */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Select all {allMinistries.length}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save cabinet</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetToDefault();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to default</span>
              </button>
            </div>
          </div>

          {/* Standard Catalogue List */}
          <div className="space-y-2.5">
            {DEFAULT_MINISTRY_ITEMS.map((item) => {
              const isSelected = selectedMinistryIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(item.id);
                  }}
                  className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-0.5 rounded transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Custom (this event) Section */}
          <div className="pt-4 space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Custom (this event)
            </label>

            <div className="space-y-2.5">
              {customMinistries.map((item) => {
                const isSelected = selectedMinistryIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(item.id);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className={`p-0.5 rounded ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustom(item.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Delete custom ministry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add custom ministry bottom input */}
          <form onSubmit={handleAddCustom} className="pt-2 space-y-2">
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                placeholder="Add your own ministry (e.g. Ministry of Space)"
                value={newMinistryInput}
                onChange={(e) => setNewMinistryInput(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!newMinistryInput.trim()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Not in the official catalogue? Add a ministry just for this round — it works in voting, Questions Hour and the projection like any other. Remember to Save cabinet after adding.
            </p>
          </form>

        </div>
      )}

    </div>
  );
};

