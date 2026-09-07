import React, { useState, useMemo } from 'react';
import type { Learner, Party, Committee } from '../../types';
import {
  EXPORT_COLUMNS_REGISTRY,
  exportCustomParticipantData
} from '../../utils/csvHelper';
import {
  Download,
  X,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  Filter,
  Users,
  Sparkles
} from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  filteredLearners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventName: string;
  activeFilterSummary?: string;
  onShowToast: (title: string, desc: string, type: 'success' | 'error' | 'info') => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  learners,
  filteredLearners,
  parties,
  committees,
  eventName,
  activeFilterSummary,
  onShowToast
}) => {
  // Scope selection: FILTERED vs ALL
  const [scope, setScope] = useState<'FILTERED' | 'ALL'>('FILTERED');

  // Format selection: csv vs xlsx
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  // Selected column keys
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    EXPORT_COLUMNS_REGISTRY.filter(c => c.defaultSelected).map(c => c.key)
  );

  // Determine current active dataset based on scope
  const targetLearners = useMemo(() => {
    return scope === 'FILTERED' ? filteredLearners : learners;
  }, [scope, filteredLearners, learners]);

  if (!isOpen) return null;

  const handleToggleColumn = (key: string) => {
    if (selectedKeys.includes(key)) {
      if (selectedKeys.length <= 1) {
        onShowToast('Column Required', 'At least one column must remain selected for export.', 'error');
        return;
      }
      setSelectedKeys(selectedKeys.filter(k => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAll = () => {
    setSelectedKeys(EXPORT_COLUMNS_REGISTRY.map(c => c.key));
  };

  const handleResetToDefault = () => {
    setSelectedKeys(EXPORT_COLUMNS_REGISTRY.filter(c => c.defaultSelected).map(c => c.key));
  };

  const handleDownload = () => {
    if (targetLearners.length === 0) {
      onShowToast('No Records', 'There are no delegates in the chosen scope to export.', 'error');
      return;
    }
    if (selectedKeys.length === 0) {
      onShowToast('No Columns', 'Please select at least one column to export.', 'error');
      return;
    }

    const scopeLabel = scope === 'FILTERED' ? 'Filtered' : 'All';
    const fileName = `${eventName.replace(/\s+/g, '_')}_${scopeLabel}_${targetLearners.length}_Delegates`;

    const exportedCount = exportCustomParticipantData({
      learners: targetLearners,
      selectedKeys,
      format,
      customFileName: fileName,
      eventName,
      parties,
      committees
    });

    onShowToast(
      'Export Successful',
      `Exported ${exportedCount} delegate records (${selectedKeys.length} columns) as ${format.toUpperCase()}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="border rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scale-in max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Export Delegate Data
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Choose export scope, pick custom columns, and download clean reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1">

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              1. Export Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('FILTERED')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  scope === 'FILTERED' ? 'ring-2 ring-amber-500 shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: scope === 'FILTERED' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: scope === 'FILTERED' ? 'var(--amber)' : 'var(--border)'
                }}
              >
                <div className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10 mt-0.5">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span>Filtered Delegates</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {filteredLearners.length}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {activeFilterSummary || 'Matches the currently filtered rows in the table'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  scope === 'ALL' ? 'ring-2 ring-emerald-500 shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: scope === 'ALL' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: scope === 'ALL' ? 'var(--emerald)' : 'var(--border)'
                }}
              >
                <div className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span>All Enrolled Delegates</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      {learners.length}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Complete assembly roster across all parties and committees
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              2. File Format
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer transition-all ${
                  format === 'csv' ? 'ring-2 ring-blue-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: format === 'csv' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: format === 'csv' ? 'var(--accent)' : 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>CSV (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer transition-all ${
                  format === 'xlsx' ? 'ring-2 ring-emerald-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: format === 'xlsx' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: format === 'xlsx' ? '#10b981' : 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Excel Spreadsheet (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Column Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                3. Choose Columns ({selectedKeys.length} of {EXPORT_COLUMNS_REGISTRY.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              {EXPORT_COLUMNS_REGISTRY.map((col) => {
                const isChecked = selectedKeys.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => handleToggleColumn(col.key)}
                    className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`truncate font-medium ${
                        isChecked ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {col.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Sanity Counter Banner */}
          <div
            className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold">Ready to export: </span>
                <strong className="font-black text-emerald-600 dark:text-emerald-400">
                  {targetLearners.length} rows
                </strong>{' '}
                across{' '}
                <strong className="font-black text-emerald-600 dark:text-emerald-400">
                  {selectedKeys.length} columns
                </strong>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
              {format.toUpperCase()}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={targetLearners.length === 0 || selectedKeys.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 transition-all cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--emerald)' }}
          >
            <Download className="w-4 h-4" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
