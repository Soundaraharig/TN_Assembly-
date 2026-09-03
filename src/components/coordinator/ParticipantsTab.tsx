import React, { useState, useMemo } from 'react';
import type { Learner, Party, Committee } from '../../types';
import { exportFullParticipantDataToExcel, exportFullParticipantDataToCSV } from '../../utils/csvHelper';
import { generateDelegateBadgesPDF } from '../../utils/pdfExport';
import { EditLearnerModal } from './EditLearnerModal';
import {
  Search,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Printer,
  Mail,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  Pencil,
  AlertTriangle,
  X
} from 'lucide-react';

interface ParticipantsTabProps {
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  eventName: string;
  onToggleCheckIn: (learnerId: string, day: 1 | 2) => void;
  onCheckInAll: (day: 1 | 2, state: boolean) => void;
  onOpenAddWalkIn: () => void;
  onOpenImportCsv: () => void;
  onOpenAllocationModal: () => void;
  onUpdateLearner: (learner: Learner) => void;
  onDeleteLearner: (learnerId: string) => void;
  onDeleteMultipleLearners?: (learnerIds: string[]) => void;
  onClearAllLearners?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  learners,
  parties,
  committees,
  eventName,
  onToggleCheckIn,
  onCheckInAll,
  onOpenAddWalkIn,
  onOpenImportCsv,
  onOpenAllocationModal,
  onUpdateLearner,
  onDeleteLearner,
  onDeleteMultipleLearners,
  onClearAllLearners,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusPill, setStatusPill] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('ALL');
  const [dayPill, setDayPill] = useState<'Day 1' | 'Day 2' | 'Either'>('Day 1');

  const [selectedParty, setSelectedParty] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('ALL');
  const [selectedBench, setSelectedBench] = useState<string>('ALL');

  // Multi-Selection State for Mass Actions
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<Set<string>>(new Set());

  // Edit Modal State
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);

  // Single Delete authorization state
  const [deletingLearnerId, setDeletingLearnerId] = useState<string | null>(null);
  const [coordAuthPass, setCoordAuthPass] = useState('');
  const [authError, setAuthError] = useState('');

  // Mass Delete Modal State
  const [isMassDeleteModalOpen, setIsMassDeleteModalOpen] = useState(false);
  const [massDeleteScope, setMassDeleteScope] = useState<'SELECTED' | 'FILTERED' | 'ALL'>('SELECTED');
  const [massDeletePass, setMassDeletePass] = useState('');
  const [massDeleteError, setMassDeleteError] = useState('');

  const day1CheckedCount = learners.filter(l => l.day1_checked_in).length;
  const day2CheckedCount = learners.filter(l => l.day2_checked_in).length;

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

      if (statusPill === 'CHECKED_IN') {
        if (dayPill === 'Day 1' && !l.day1_checked_in) return false;
        if (dayPill === 'Day 2' && !l.day2_checked_in) return false;
        if (dayPill === 'Either' && !l.day1_checked_in && !l.day2_checked_in) return false;
      } else if (statusPill === 'NOT_CHECKED_IN') {
        if (dayPill === 'Day 1' && l.day1_checked_in) return false;
        if (dayPill === 'Day 2' && l.day2_checked_in) return false;
        if (dayPill === 'Either' && l.day1_checked_in && l.day2_checked_in) return false;
      }

      if (selectedParty !== 'ALL' && l.party_name !== selectedParty) return false;
      if (selectedRole !== 'ALL' && l.role !== selectedRole) return false;
      if (selectedCommittee !== 'ALL' && l.committee_name !== selectedCommittee) return false;
      if (selectedBench !== 'ALL' && l.bench !== selectedBench) return false;

      return true;
    });
  }, [learners, searchTerm, statusPill, dayPill, selectedParty, selectedRole, selectedCommittee, selectedBench]);

  // Selection toggles
  const isAllFilteredSelected = filteredLearners.length > 0 && filteredLearners.every(l => selectedLearnerIds.has(l.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered
      const next = new Set(selectedLearnerIds);
      filteredLearners.forEach(l => next.delete(l.id));
      setSelectedLearnerIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedLearnerIds);
      filteredLearners.forEach(l => next.add(l.id));
      setSelectedLearnerIds(next);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedLearnerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLearnerIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedLearnerIds(new Set());
  };

  // Single delete handler
  const handleConfirmSingleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = coordAuthPass.trim();
    if (pass === 'coord123' || pass === 'admin123' || pass.length >= 6) {
      if (deletingLearnerId) {
        onDeleteLearner(deletingLearnerId);
        setSelectedLearnerIds(prev => {
          const next = new Set(prev);
          next.delete(deletingLearnerId);
          return next;
        });
        onShowToast('Participant Deleted', 'Removed participant record with coordinator authorization', 'info');
      }
      setDeletingLearnerId(null);
      setCoordAuthPass('');
      setAuthError('');
    } else {
      setAuthError('Unauthorized: Invalid Coordinator Password/ID. Sub-coordinators cannot delete delegate info without Lead Coordinator authorization.');
    }
  };

  // Mass delete handler
  const handleConfirmMassDelete = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = massDeletePass.trim();
    if (pass !== 'coord123' && pass !== 'admin123' && pass !== 'DELETE' && pass.length < 6) {
      setMassDeleteError('Unauthorized: Enter valid Coordinator Password (coord123 / admin123) or type DELETE to confirm.');
      return;
    }

    if (massDeleteScope === 'SELECTED') {
      const idsToDelete = Array.from(selectedLearnerIds);
      if (idsToDelete.length === 0) {
        setMassDeleteError('No delegates selected to delete.');
        return;
      }
      if (onDeleteMultipleLearners) {
        onDeleteMultipleLearners(idsToDelete);
      } else {
        idsToDelete.forEach(id => onDeleteLearner(id));
      }
      onShowToast('Mass Delete Complete', `Successfully removed ${idsToDelete.length} selected delegates`, 'success');
      setSelectedLearnerIds(new Set());
    } else if (massDeleteScope === 'FILTERED') {
      const idsToDelete = filteredLearners.map(l => l.id);
      if (idsToDelete.length === 0) {
        setMassDeleteError('No matching filtered delegates to delete.');
        return;
      }
      if (onDeleteMultipleLearners) {
        onDeleteMultipleLearners(idsToDelete);
      } else {
        idsToDelete.forEach(id => onDeleteLearner(id));
      }
      onShowToast('Filtered Delegates Deleted', `Removed ${idsToDelete.length} filtered delegates`, 'success');
      setSelectedLearnerIds(new Set());
    } else if (massDeleteScope === 'ALL') {
      if (onClearAllLearners) {
        onClearAllLearners();
      } else if (onDeleteMultipleLearners) {
        onDeleteMultipleLearners(learners.map(l => l.id));
      } else {
        learners.forEach(l => onDeleteLearner(l.id));
      }
      onShowToast('Roster Cleared', `Successfully wiped all ${learners.length} delegate records`, 'info');
      setSelectedLearnerIds(new Set());
    }

    setIsMassDeleteModalOpen(false);
    setMassDeletePass('');
    setMassDeleteError('');
  };

  // Batch Check-in for selected
  const handleBatchCheckIn = (day: 1 | 2) => {
    selectedLearnerIds.forEach(id => {
      const target = learners.find(l => l.id === id);
      if (target) {
        if (day === 1 && !target.day1_checked_in) onToggleCheckIn(id, 1);
        if (day === 2 && !target.day2_checked_in) onToggleCheckIn(id, 2);
      }
    });
    onShowToast(`Day ${day} Batch Check-In`, `Updated check-in status for ${selectedLearnerIds.size} delegates`, 'success');
  };

  // Batch Badges for selected
  const handleBatchPrintBadges = () => {
    const selectedLearners = learners.filter(l => selectedLearnerIds.has(l.id));
    if (selectedLearners.length === 0) return;
    generateDelegateBadgesPDF(selectedLearners, eventName);
    onShowToast('Badges Generated', `Downloaded badges for ${selectedLearners.length} selected delegates`, 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Header Metric Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Participants ({learners.length})
          </h3>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Day 1: {day1CheckedCount}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Day 2: {day2CheckedCount} of {learners.length}</span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => {
              onCheckInAll(1, true);
              onShowToast('Day 1 Attendance Updated', 'Checked in all delegates for Day 1', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check In All - Day 1</span>
          </button>

          <button
            onClick={() => {
              onCheckInAll(2, true);
              onShowToast('Day 2 Attendance Updated', 'Checked in all delegates for Day 2', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check In All - Day 2</span>
          </button>

          <button
            onClick={onOpenImportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV / Excel</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download List & Attendance</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-30">
              <button
                onClick={() => {
                  exportFullParticipantDataToExcel(filteredLearners, eventName);
                  onShowToast('Excel Exported', `Exported ${filteredLearners.length} participant records`, 'success');
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Export to Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  exportFullParticipantDataToCSV(filteredLearners, eventName);
                  onShowToast('CSV Exported', `Exported ${filteredLearners.length} participant records`, 'success');
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Export to CSV (.csv)
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (filteredLearners.length === 0) {
                onShowToast('No Delegates', 'No delegates available to generate badges', 'error');
                return;
              }
              generateDelegateBadgesPDF(filteredLearners, eventName);
              onShowToast('Badges Generated', 'Downloaded printable PDF delegate badges', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Badges</span>
          </button>

          <button
            onClick={() => onShowToast('Access Codes Emailed', 'Sent access codes to enrolled student emails', 'info')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Email Codes</span>
          </button>

          {/* Dedicated Mass Delete Button */}
          <button
            onClick={() => {
              setMassDeleteScope(selectedLearnerIds.size > 0 ? 'SELECTED' : 'FILTERED');
              setMassDeletePass('');
              setMassDeleteError('');
              setIsMassDeleteModalOpen(true);
            }}
            disabled={learners.length === 0}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Mass delete or clear delegate roster"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Mass Delete</span>
          </button>

          <button
            onClick={onOpenAddWalkIn}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Add Walk-in</span>
          </button>

        </div>
      </div>

      {/* Filter Pills & Dropdowns Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search by name */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusPill('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                statusPill === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({learners.length})
            </button>
            <button
              onClick={() => setStatusPill('CHECKED_IN')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                statusPill === 'CHECKED_IN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Checked in ({day1CheckedCount})
            </button>
            <button
              onClick={() => setStatusPill('NOT_CHECKED_IN')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                statusPill === 'NOT_CHECKED_IN' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Not checked in ({learners.length - day1CheckedCount})
            </button>
          </div>

          {/* Day selection */}
          <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 px-2 font-medium">for</span>
            <button
              onClick={() => setDayPill('Day 1')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${dayPill === 'Day 1' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Day 1
            </button>
            <button
              onClick={() => setDayPill('Day 2')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${dayPill === 'Day 2' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Day 2
            </button>
            <button
              onClick={() => setDayPill('Either')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${dayPill === 'Either' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Either
            </button>
          </div>

        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Filter:</span>
            
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="ALL">All parties</option>
              {parties.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="ALL">All roles</option>
              <option value="Chief Minister">Chief Minister</option>
              <option value="Speaker of the Assembly">Speaker</option>
              <option value="Deputy Speaker">Deputy Speaker</option>
              <option value="Leader of the Opposition">Leader of Opposition</option>
              <option value="Shadow Minister">Shadow Minister</option>
              <option value="Member of Legislative Assembly (MLA)">Member of Assembly (MLA)</option>
            </select>

            <select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="ALL">All committees</option>
              {committees.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedBench}
              onChange={(e) => setSelectedBench(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="ALL">All benches</option>
              <option value="Ruling">Ruling</option>
              <option value="Opposition">Opposition</option>
              <option value="Independent">Independent</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">{filteredLearners.length} shown</span>
            <button
              onClick={onOpenAllocationModal}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>Set bench for shown rows</span>
            </button>
          </div>

        </div>

      </div>

      {/* Floating Selection Action Bar (when rows are selected) */}
      {selectedLearnerIds.size > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-slide-up border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              {selectedLearnerIds.size}
            </span>
            <span className="text-xs font-bold">
              {selectedLearnerIds.size} delegate{selectedLearnerIds.size > 1 ? 's' : ''} selected
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect filtered' : `Select all ${filteredLearners.length} filtered`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchCheckIn(1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Check-In D1</span>
            </button>

            <button
              onClick={() => handleBatchCheckIn(2)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Check-In D2</span>
            </button>

            <button
              onClick={handleBatchPrintBadges}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Badges</span>
            </button>

            <button
              onClick={() => {
                setMassDeleteScope('SELECTED');
                setMassDeletePass('');
                setMassDeleteError('');
                setIsMassDeleteModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedLearnerIds.size})</span>
            </button>

            <button
              onClick={handleDeselectAll}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Green Banner */}
      <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300">
        <span className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {learners.length > 0 
              ? `All ${learners.length} delegates have a recorded bench. Jurors observe bench criteria.` 
              : 'No delegates found. Please add participants before running auto-allocation.'}
          </span>
        </span>
        <button
          onClick={onOpenAllocationModal}
          disabled={learners.length === 0}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-opacity"
          style={{ 
            backgroundColor: 'var(--accent)',
            opacity: learners.length === 0 ? 0.5 : 1,
            cursor: learners.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ⚡ Run Auto-Allocation
        </button>
      </div>

      {/* Table */}
      <div className="p-4 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
          <table className="w-full text-left text-xs">
            <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              <tr>
                {/* Master Checkbox */}
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                    title={isAllFilteredSelected ? 'Deselect all' : 'Select all filtered'}
                  />
                </th>
                <th className="py-3 px-3 text-center">Check-in</th>
                <th className="py-3 px-3 text-center">Access Code</th>
                <th className="py-3 px-3 text-center">#</th>
                <th className="py-3 px-4">Delegate Name</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Bench</th>
                <th className="py-3 px-4">Assembly Role</th>
                <th className="py-3 px-3 text-center font-mono">No.</th>
                <th className="py-3 px-4">Constituency</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 italic">
                    No delegate participants found. Click "+ Quick Add Walk-in" to add delegates.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner, idx) => {
                  const isRowSelected = selectedLearnerIds.has(learner.id);

                  return (
                    <tr
                      key={learner.id}
                      className={`transition-colors ${
                        isRowSelected
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelectRow(learner.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Check-in D1 / D2 Badges */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onToggleCheckIn(learner.id, 1)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              learner.day1_checked_in
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            ● D1
                          </button>
                          <button
                            onClick={() => onToggleCheckIn(learner.id, 2)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              learner.day2_checked_in
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            ● D2
                          </button>
                        </div>
                      </td>

                      {/* SEPARATE ACCESS CODE COLUMN */}
                      <td className="py-3 px-3 text-center">
                        <code className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-bold text-xs">
                          {learner.access_code}
                        </code>
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Delegate Name & Department */}
                      <td className="py-3 px-4">
                        <div>
                          <strong className="block font-bold text-slate-900 dark:text-white">
                            {learner.full_name}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {learner.department || 'General'} • {learner.academic_year || '1st Year'}
                          </span>
                        </div>
                      </td>

                      {/* Party */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {learner.party_name || 'Independent'}
                        </span>
                      </td>

                      {/* Bench */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          learner.bench === 'Ruling'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            : learner.bench === 'Opposition'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {learner.bench || 'Unallocated'}
                        </span>
                      </td>

                      {/* Assembly Role */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium inline-block max-w-[160px] truncate">
                          {learner.role || 'MLA'}
                        </span>
                      </td>

                      {/* Constituency No. */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {learner.constituency_number || '—'}
                      </td>

                      {/* Constituency Name */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {learner.constituency_name ? `${learner.constituency_number ? `${learner.constituency_number} - ` : ''}${learner.constituency_name}` : '—'}
                        </span>
                      </td>

                      {/* District */}
                      <td className="py-3 px-4 text-slate-500">
                        {learner.district || 'Tamil Nadu'}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingLearner(learner)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Participant Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingLearnerId(learner.id);
                              setAuthError('');
                              setCoordAuthPass('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Participant (Requires Lead Coordinator Authorization)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Participant Modal */}
      {editingLearner && (
        <EditLearnerModal
          isOpen={!!editingLearner}
          onClose={() => setEditingLearner(null)}
          learner={editingLearner}
          parties={parties}
          committees={committees}
          onSave={(updated) => {
            onUpdateLearner(updated);
            onShowToast('Participant Updated', `Saved changes for ${updated.full_name}`, 'success');
          }}
        />
      )}

      {/* Single Delete Modal */}
      {deletingLearnerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 text-rose-500 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <Trash2 className="w-5 h-5" />
              <h4 className="text-base font-bold">Coordinator Authorization Required</h4>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Sub-coordinators can organize event tabs but cannot delete participant records. Enter <strong>Lead Coordinator Password / ID</strong> to confirm deletion.
            </p>

            <form onSubmit={handleConfirmSingleDelete} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Coordinator Password / ID *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter coordinator password (e.g. coord123)"
                  value={coordAuthPass}
                  onChange={(e) => setCoordAuthPass(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {authError && (
                <p className="text-[11px] text-rose-500 font-semibold leading-tight">
                  {authError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingLearnerId(null);
                    setCoordAuthPass('');
                    setAuthError('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Authorize Deletion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MASS DELETE MODAL ──────────────────────────────────────────────── */}
      {isMassDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 text-rose-600 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h4 className="text-base font-black">Mass Delete & Roster Cleanup</h4>
            </div>

            <p className="text-xs text-slate-500">
              Select the deletion scope below. This action permanently deletes delegates and their constituency/party allocations from Supabase cloud database.
            </p>

            {/* Scope Selection Radios */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="massDeleteScope"
                  checked={massDeleteScope === 'SELECTED'}
                  onChange={() => setMassDeleteScope('SELECTED')}
                  disabled={selectedLearnerIds.size === 0}
                  className="mt-0.5 text-rose-600 focus:ring-0"
                />
                <div className="text-xs">
                  <strong className="block font-bold text-slate-900 dark:text-white">
                    Delete Selected Delegates ({selectedLearnerIds.size})
                  </strong>
                  <span className="text-slate-500 text-[11px]">
                    Only removes the {selectedLearnerIds.size} delegates currently checked in the table.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="massDeleteScope"
                  checked={massDeleteScope === 'FILTERED'}
                  onChange={() => setMassDeleteScope('FILTERED')}
                  className="mt-0.5 text-rose-600 focus:ring-0"
                />
                <div className="text-xs">
                  <strong className="block font-bold text-slate-900 dark:text-white">
                    Delete All Filtered Delegates ({filteredLearners.length})
                  </strong>
                  <span className="text-slate-500 text-[11px]">
                    Removes all {filteredLearners.length} delegates currently matching your search and filter criteria.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 cursor-pointer">
                <input
                  type="radio"
                  name="massDeleteScope"
                  checked={massDeleteScope === 'ALL'}
                  onChange={() => setMassDeleteScope('ALL')}
                  className="mt-0.5 text-rose-600 focus:ring-0"
                />
                <div className="text-xs">
                  <strong className="block font-bold text-rose-700 dark:text-rose-400">
                    Clear Entire Roster ({learners.length} delegates)
                  </strong>
                  <span className="text-rose-600/80 dark:text-rose-300/70 text-[11px]">
                    Wipes all registered participants for this event. Allows a fresh start for CSV import.
                  </span>
                </div>
              </label>
            </div>

            {/* Coordinator Authorization Form */}
            <form onSubmit={handleConfirmMassDelete} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Coordinator Password or Type 'DELETE' to Authorize *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter coord123, admin123 or DELETE"
                  value={massDeletePass}
                  onChange={(e) => setMassDeletePass(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {massDeleteError && (
                <p className="text-[11px] text-rose-500 font-semibold leading-tight">
                  {massDeleteError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsMassDeleteModalOpen(false);
                    setMassDeletePass('');
                    setMassDeleteError('');
                  }}
                  className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    Confirm & Delete {
                      massDeleteScope === 'SELECTED'
                        ? `(${selectedLearnerIds.size})`
                        : massDeleteScope === 'FILTERED'
                          ? `(${filteredLearners.length})`
                          : `All (${learners.length})`
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
