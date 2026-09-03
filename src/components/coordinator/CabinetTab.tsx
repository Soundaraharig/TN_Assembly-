import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';

interface CabinetTabProps {
  learners: Learner[];
  eventId?: string;
  savedMinistries?: string[];
  onSaveCabinet?: (ministries: string[]) => void;
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

export const CabinetTab: React.FC<CabinetTabProps> = ({
  learners,
  savedMinistries,
  onSaveCabinet,
  onShowToast
}) => {
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [customMinistries, setCustomMinistries] = useState<string[]>([
    "Ministry of Electronics & IT",
    "Ministry of Tourism & Culture",
    "Ministry of Environment"
  ]);
  const [newMinistryInput, setNewMinistryInput] = useState('');
  const [viewMode, setViewMode] = useState<'config' | 'roster'>('config');

  useEffect(() => {
    if (savedMinistries && savedMinistries.length > 0) {
      setSelectedMinistries(savedMinistries);
    } else {
      // Default initial selection (12 selected)
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

  // Assigned ministers list
  const cabinetList = learners.filter(l =>
    l.role && (
      l.role.includes('Minister') ||
      l.role.includes('Chief') ||
      l.role.includes('Speaker') ||
      l.role.includes('Leader')
    )
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Cabinet ministries</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose which ministries make up the cabinet for this event. These are the posts students vote for and the Prime Minister picks from (the opposition mirrors them as shadow ministers). Pick some and Reset to use the default cabinet — other chapters are not affected.
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {selectedMinistries.length} selected
          </span>

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

          {cabinetList.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'config' ? 'roster' : 'config')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{viewMode === 'config' ? 'View Appointed Ministers' : 'Configure Ministries'}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'roster' ? (
        /* Roster View of Appointed Ministers */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Appointed Cabinet & Leadership ({cabinetList.length})
            </h3>
            <button
              onClick={() => setViewMode('config')}
              className="text-xs text-amber-600 font-bold hover:underline"
            >
              ← Back to Ministry Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cabinetList.map((minister) => (
              <div
                key={minister.id}
                className="rounded-2xl p-5 border shadow-sm flex items-start gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 flex items-center justify-center font-black text-lg shrink-0">
                  {minister.full_name.charAt(0)}
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {minister.role}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {minister.full_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {minister.party_name} • <span className="font-bold text-slate-800 dark:text-slate-200">{minister.constituency_name || 'MLA'}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] pt-1 text-slate-400">
                    <span className={`px-2 py-0.5 rounded font-bold ${minister.bench === 'Ruling' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {minister.bench} Bench
                    </span>
                    <span>•</span>
                    <span>Code: <code className="font-mono font-bold text-amber-500">{minister.access_code}</code></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Configuration Checklist View */
        <div className="space-y-4">
          
          {/* Select all / Clear links */}
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
