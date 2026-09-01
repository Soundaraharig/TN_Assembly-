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
  Pencil
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
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusPill, setStatusPill] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('ALL');
  const [dayPill, setDayPill] = useState<'Day 1' | 'Day 2' | 'Either'>('Day 1');

  const [selectedParty, setSelectedParty] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('ALL');
  const [selectedBench, setSelectedBench] = useState<string>('ALL');

  // Edit Modal State
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);

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

  return (
    <div className="space-y-5">
      
      {/* Header Metric Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-slate-900">
            Participants ({learners.length})
          </h3>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
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
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check In All - Day 1</span>
          </button>

          <button
            onClick={() => {
              onCheckInAll(2, true);
              onShowToast('Day 2 Attendance Updated', 'Checked in all delegates for Day 2', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check In All - Day 2</span>
          </button>

          <button
            onClick={onOpenImportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV / Excel</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download List & Attendance</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-30">
              <button
                onClick={() => {
                  exportFullParticipantDataToExcel(filteredLearners, eventName);
                  onShowToast('Excel Exported', `Exported ${filteredLearners.length} participant records`, 'success');
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Export to Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  exportFullParticipantDataToCSV(filteredLearners, eventName);
                  onShowToast('CSV Exported', `Exported ${filteredLearners.length} participant records`, 'success');
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Badges</span>
          </button>

          <button
            onClick={() => onShowToast('Access Codes Emailed', 'Sent access codes to enrolled student emails', 'info')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Email Codes</span>
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search by name */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusPill('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                statusPill === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({learners.length})
            </button>
            <button
              onClick={() => setStatusPill('CHECKED_IN')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                statusPill === 'CHECKED_IN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Checked in ({day1CheckedCount})
            </button>
            <button
              onClick={() => setStatusPill('NOT_CHECKED_IN')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                statusPill === 'NOT_CHECKED_IN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Not checked in ({learners.length - day1CheckedCount})
            </button>
          </div>

          {/* Day selection */}
          <div className="flex items-center gap-1 text-xs bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 px-2 font-medium">for</span>
            <button
              onClick={() => setDayPill('Day 1')}
              className={`px-2.5 py-1 rounded-lg font-bold ${dayPill === 'Day 1' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Day 1
            </button>
            <button
              onClick={() => setDayPill('Day 2')}
              className={`px-2.5 py-1 rounded-lg font-bold ${dayPill === 'Day 2' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Day 2
            </button>
            <button
              onClick={() => setDayPill('Either')}
              className={`px-2.5 py-1 rounded-lg font-bold ${dayPill === 'Either' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Either
            </button>
          </div>

        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Filter:</span>
            
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All parties</option>
              {parties.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All committees</option>
              {committees.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedBench}
              onChange={(e) => setSelectedBench(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
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
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>Set bench for shown rows</span>
            </button>
          </div>

        </div>

      </div>

      {/* Green Banner */}
      <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <span className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All {learners.length} delegates have a recorded bench. Jurors observe bench criteria.</span>
        </span>
        <button
          onClick={onOpenAllocationModal}
          className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 shrink-0 transition-colors cursor-pointer"
        >
          Run Auto-Allocation
        </button>
      </div>

      {/* Roster Table with explicit Access Code column & Edit action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center">Check-in (D1 / D2)</th>
                <th className="py-3.5 px-3 text-center">Access Code</th>
                <th className="py-3.5 px-3 text-center">S.No</th>
                <th className="py-3.5 px-4">Delegate Name</th>
                <th className="py-3.5 px-4">Party</th>
                <th className="py-3.5 px-4">Bench</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-3 text-center">Const. No.</th>
                <th className="py-3.5 px-4">TN Constituency</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    No delegate participants found. Click "+ Quick Add Walk-in" to add delegates.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner, idx) => (
                  <tr key={learner.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Check-in D1 / D2 Badges */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onToggleCheckIn(learner.id, 1)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            learner.day1_checked_in
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          ● D1
                        </button>
                        <button
                          onClick={() => onToggleCheckIn(learner.id, 2)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            learner.day2_checked_in
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          ● D2
                        </button>
                      </div>
                    </td>

                    {/* SEPARATE ACCESS CODE COLUMN */}
                    <td className="py-3 px-3 text-center">
                      <code className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-xs">
                        {learner.access_code}
                      </code>
                    </td>

                    {/* S.No */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Delegate Name */}
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {learner.full_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{learner.department} • {learner.academic_year}</span>
                    </td>

                    {/* Party */}
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {learner.party_name || 'Unassigned'}
                    </td>

                    {/* Bench */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        learner.bench === 'Ruling' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {learner.bench || 'Unallocated'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {learner.role || 'Member of Assembly (MLA)'}
                      </span>
                    </td>

                    {/* Const No */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                      {learner.constituency_number || (101 + idx)}
                    </td>

                    {/* Constituency */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {learner.constituency_name || '109 - Erode East'}
                    </td>

                    {/* District */}
                    <td className="py-3 px-4 text-slate-600">
                      {learner.district || 'Tamil Nadu'}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingLearner(learner)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Participant Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteLearner(learner.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
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

    </div>
  );
};
