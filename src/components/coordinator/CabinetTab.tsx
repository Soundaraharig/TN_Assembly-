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
  UserCheck
} from 'lucide-react';

interface CabinetTabProps {
  learners: Learner[];
  eventId?: string;
  savedMinistries?: string[];
  onSaveCabinet?: (ministries: string[]) => void;
  onAssignCabinetRole?: (learnerId: string, portfolioRole: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DEFAULT_MINISTRIES = [
  "Ministry of Education",
  "Ministry of Women & Child Development",
  "Ministry of Youth Affairs & Sports",
  "Ministry of Health & Family Welfare",
  "Ministry of Social Justice & Empowerment",
  "Ministry of Road Transport & Highways",
  "Ministry of Rural Development",
  "Ministry of Science & Technology",
  "Ministry of MSME",
  "Ministry of Environment, Forest, & Climate Change",
  "Ministry of Skill Development & Entrepreneurship",
  "Ministry of Electronics & Information Technology",
  "Ministry of Jal Shakti",
  "Ministry of Housing & Urban Affairs",
  "Ministry of Finance",
  "Ministry of Home Affairs",
  "Ministry of Defence",
  "Ministry of Agriculture",
  "Ministry of Power",
  "Ministry of Railways",
  "Ministry of Parliamentary Affairs"
];

// Helper Searchable Dropdown for assigning delegates to portfolio roles
const SearchableDelegateSelect: React.FC<{
  learners: Learner[];
  currentLearnerId?: string;
  onSelect: (learnerId: string) => void;
  placeholder?: string;
}> = ({ learners, currentLearnerId, onSelect, placeholder = 'Search by name or constituency no...' }) => {
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

  const filtered = learners.filter(l => {
    if (!query) return true;
    const q = query.toLowerCase();
    const nameMatch = l.full_name?.toLowerCase().includes(q);
    const constNoMatch = String(l.constituency_number || '').toLowerCase().includes(q);
    const constNameMatch = l.constituency_name?.toLowerCase().includes(q);
    const codeMatch = l.access_code?.toLowerCase().includes(q);
    return nameMatch || constNoMatch || constNameMatch || codeMatch;
  });

  const selectedLearner = learners.find(l => l.id === currentLearnerId);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl border bg-slate-900 border-slate-700 text-white text-xs font-semibold flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors shadow-sm"
      >
        <span className="truncate">
          {selectedLearner
            ? `${selectedLearner.full_name} (${selectedLearner.constituency_number ? `Const #${selectedLearner.constituency_number} - ` : ''}${selectedLearner.constituency_name || 'MLA'})`
            : '-- Select / Assign Minister --'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-2 max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-white text-xs focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              ✕ Unassign / Clear Role
            </button>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-500 px-2 py-2 italic text-center">No matching delegates found</p>
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
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold">{l.full_name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({l.party_name || 'Independent'})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 shrink-0">
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
  savedMinistries,
  onSaveCabinet,
  onAssignCabinetRole,
  onShowToast
}) => {
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [customMinistries, setCustomMinistries] = useState<string[]>([
    "Ministry of Electronics & IT",
    "Ministry of Tourism & Culture",
    "Ministry of Environment"
  ]);
  const [newMinistryInput, setNewMinistryInput] = useState('');
  const [viewMode, setViewMode] = useState<'roster' | 'config'>('roster');

  useEffect(() => {
    if (savedMinistries && savedMinistries.length > 0) {
      setSelectedMinistries(savedMinistries);
    } else {
      setSelectedMinistries([
        "Ministry of Education",
        "Ministry of Women & Child Development",
        "Ministry of Youth Affairs & Sports",
        "Ministry of Health & Family Welfare",
        "Ministry of Skill Development & Entrepreneurship",
        "Ministry of Finance",
        "Ministry of Home Affairs",
        "Ministry of Defence",
        "Ministry of Agriculture",
        "Ministry of Electronics & IT",
        "Ministry of Tourism & Culture",
        "Ministry of Environment"
      ]);
    }
  }, [savedMinistries]);

  const toggleMinistry = (ministry: string) => {
    setSelectedMinistries(prev =>
      prev.includes(ministry)
        ? prev.filter(m => m !== ministry)
        : [...prev, ministry]
    );
  };

  const handleSelectAll = () => {
    const all = Array.from(new Set([...DEFAULT_MINISTRIES, ...customMinistries]));
    setSelectedMinistries(all);
  };

  const handleClearAll = () => {
    setSelectedMinistries([]);
  };

  const handleResetToDefault = () => {
    setSelectedMinistries([
      "Ministry of Education",
      "Ministry of Women & Child Development",
      "Ministry of Youth Affairs & Sports",
      "Ministry of Health & Family Welfare",
      "Ministry of Skill Development & Entrepreneurship",
      "Ministry of Finance",
      "Ministry of Home Affairs",
      "Ministry of Defence",
      "Ministry of Agriculture",
      "Ministry of Electronics & IT",
      "Ministry of Tourism & Culture",
      "Ministry of Environment"
    ]);
    onShowToast('Reset Complete', 'Restored default cabinet ministries', 'info');
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMinistryInput.trim();
    if (!trimmed) return;

    if (!customMinistries.includes(trimmed) && !DEFAULT_MINISTRIES.includes(trimmed)) {
      setCustomMinistries(prev => [...prev, trimmed]);
      setSelectedMinistries(prev => [...prev, trimmed]);
      setNewMinistryInput('');
      onShowToast('Ministry Added', `Added ${trimmed} to custom list`, 'success');
    } else {
      onShowToast('Already Exists', 'This ministry is already in the list', 'info');
    }
  };

  const handleRemoveCustom = (m: string) => {
    setCustomMinistries(prev => prev.filter(item => item !== m));
    setSelectedMinistries(prev => prev.filter(item => item !== m));
  };

  const handleSave = () => {
    if (onSaveCabinet) {
      onSaveCabinet(selectedMinistries);
    }
    onShowToast('Cabinet Saved', `Saved ${selectedMinistries.length} active ministries for this event`, 'success');
  };

  const handleAssignRole = (learnerId: string, portfolioRole: string) => {
    if (onAssignCabinetRole) {
      onAssignCabinetRole(learnerId, portfolioRole);
      const learner = learners.find(l => l.id === learnerId);
      if (learner) {
        onShowToast('Minister Appointed', `Assigned ${learner.full_name} as ${portfolioRole}`, 'success');
      } else {
        onShowToast('Role Unassigned', `Cleared assignment for ${portfolioRole}`, 'info');
      }
    }
  };

  // Build active ministry portfolios based on selected Ministries
  const cabinetPortfolios = selectedMinistries.map(m => {
    const shortName = m.replace(/^Ministry of\s+/, '');
    return {
      ministry: m,
      rulingRole: `Minister for ${shortName}`,
      shadowRole: `Shadow Minister for ${shortName}`
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
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
            {selectedMinistries.length} Active Portfolios
          </span>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'roster' ? 'config' : 'roster')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === 'roster' ? (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Configure Active Ministries ({selectedMinistries.length})</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { role: 'Speaker of Legislative Assembly', title: 'Assembly Speaker', bench: 'Neutral / Presiding' },
                { role: 'Deputy Speaker', title: 'Deputy Speaker', bench: 'Neutral / Presiding' },
                { role: 'Chief Minister (Leader of the House)', title: 'Chief Minister', bench: 'Ruling Bench' },
                { role: 'Leader of the Opposition', title: 'Leader of Opposition', bench: 'Opposition Bench' }
              ].map(item => {
                const holder = learners.find(l => l.role === item.role);
                return (
                  <div
                    key={item.role}
                    className="rounded-2xl p-4 border bg-slate-900 border-slate-800 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          {item.bench}
                        </span>
                        <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                      </div>
                      {holder && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Appointed
                        </span>
                      )}
                    </div>

                    <SearchableDelegateSelect
                      learners={learners}
                      currentLearnerId={holder?.id}
                      onSelect={(learnerId) => handleAssignRole(learnerId, item.role)}
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
                const rulingHolder = learners.find(l => l.role === port.rulingRole);
                const shadowHolder = learners.find(l => l.role === port.shadowRole);

                return (
                  <div
                    key={port.ministry}
                    className="rounded-2xl p-5 border bg-slate-900 border-slate-800 space-y-4 shadow-sm"
                  >
                    <div className="border-b border-slate-800 pb-2">
                      <h4 className="text-base font-extrabold text-white">{port.ministry}</h4>
                      <p className="text-[11px] text-slate-400">Assign Cabinet Minister & Opposition Counterpart</p>
                    </div>

                    <div className="space-y-3">
                      {/* Ruling Cabinet Minister */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
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
                          onSelect={(learnerId) => handleAssignRole(learnerId, port.rulingRole)}
                          placeholder="Search minister name or const no..."
                        />
                      </div>

                      {/* Shadow Cabinet Minister */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-400 flex items-center gap-1">
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
                          onSelect={(learnerId) => handleAssignRole(learnerId, port.shadowRole)}
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
                onClick={handleSelectAll}
                className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Select all {DEFAULT_MINISTRIES.length + customMinistries.length}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save cabinet</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to default</span>
              </button>
            </div>
          </div>

          {/* Standard Catalogue List */}
          <div className="space-y-2.5">
            {DEFAULT_MINISTRIES.map((ministry) => {
              const isSelected = selectedMinistries.includes(ministry);
              return (
                <div
                  key={ministry}
                  onClick={() => toggleMinistry(ministry)}
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
                    {ministry}
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
              {customMinistries.map((ministry) => {
                const isSelected = selectedMinistries.includes(ministry);
                return (
                  <div
                    key={ministry}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div
                      onClick={() => toggleMinistry(ministry)}
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
                        {ministry}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCustom(ministry)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
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

