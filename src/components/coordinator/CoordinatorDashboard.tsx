import React, { useState } from 'react';
import type { CollegeEvent, Learner, Party, Committee, AgendaItem } from '../../types';
import { ParticipantsTab } from './ParticipantsTab';
import { PartiesTab } from './PartiesTab';
import { CommitteesTab } from './CommitteesTab';
import { AgendaTab } from './AgendaTab';
import { AnalyticsTab } from './AnalyticsTab';
import { AddLearnerModal } from './AddLearnerModal';
import { CsvImportModal } from './CsvImportModal';
import { AllocationModal } from './AllocationModal';
import { Users, Shield, BookOpen, Clock, BarChart3, Building2 } from 'lucide-react';

interface CoordinatorDashboardProps {
  currentEvent: CollegeEvent;
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
  agenda: AgendaItem[];
  onToggleCheckIn: (learnerId: string, day: 1 | 2) => void;
  onCheckInAll: (day: 1 | 2, state: boolean) => void;
  onAddLearner: (learner: Partial<Learner>) => void;
  onBulkImportLearners: (newLearners: Partial<Learner>[]) => void;
  onUpdateLearner: (learner: Learner) => void;
  onDeleteLearner: (learnerId: string) => void;
  onAddParty: (party: Partial<Party>) => void;
  onUpdateParty: (party: Party) => void;
  onDeleteParty: (partyId: string) => void;
  onAddCommittee: (committee: Partial<Committee>) => void;
  onUpdateCommittee: (committee: Committee) => void;
  onDeleteCommittee: (committeeId: string) => void;
  onAddAgendaItem: (item: Partial<AgendaItem>) => void;
  onSetCurrentAgendaItem: (itemId: string) => void;
  onExecuteAllocation: (rulingRatio: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  currentEvent,
  learners,
  parties,
  committees,
  agenda,
  onToggleCheckIn,
  onCheckInAll,
  onAddLearner,
  onBulkImportLearners,
  onUpdateLearner,
  onDeleteLearner,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onAddAgendaItem,
  onSetCurrentAgendaItem,
  onExecuteAllocation,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'participants' | 'parties' | 'committees' | 'agenda' | 'analytics'>('participants');

  const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const existingCodes = new Set(learners.map(l => l.access_code));

  return (
    <div className="space-y-6">
      
      {/* Event Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-950/40 font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{currentEvent.college_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {currentEvent.event_stage}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">College Event Dashboard • Coordinator Control Panel</p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 text-xs font-semibold">
            <strong className="text-white font-extrabold">{learners.length}</strong> Delegates
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 text-xs font-semibold">
            <strong className="text-emerald-400 font-extrabold">{parties.length}</strong> Parties
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 text-xs font-semibold">
            <strong className="text-amber-400 font-extrabold">{committees.length}</strong> Committees
          </span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl flex flex-wrap items-center gap-1">
        
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'participants'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants & Check-in</span>
        </button>

        <button
          onClick={() => setActiveTab('parties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'parties'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Parties Control</span>
        </button>

        <button
          onClick={() => setActiveTab('committees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'committees'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Committees Control</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'agenda'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Session Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Control Panel</span>
        </button>

      </div>

      {/* Active Tab View Rendering */}
      {activeTab === 'participants' && (
        <ParticipantsTab
          learners={learners}
          parties={parties}
          committees={committees}
          eventName={currentEvent.college_name}
          onToggleCheckIn={onToggleCheckIn}
          onCheckInAll={onCheckInAll}
          onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
          onOpenImportCsv={() => setIsImportCsvOpen(true)}
          onOpenAllocationModal={() => setIsAllocationModalOpen(true)}
          onUpdateLearner={onUpdateLearner}
          onDeleteLearner={onDeleteLearner}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'parties' && (
        <PartiesTab
          parties={parties}
          learners={learners}
          eventId={currentEvent.id}
          onAddParty={onAddParty}
          onUpdateParty={onUpdateParty}
          onDeleteParty={onDeleteParty}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'committees' && (
        <CommitteesTab
          committees={committees}
          learners={learners}
          eventId={currentEvent.id}
          onAddCommittee={onAddCommittee}
          onUpdateCommittee={onUpdateCommittee}
          onDeleteCommittee={onDeleteCommittee}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'agenda' && (
        <AgendaTab
          agenda={agenda}
          eventId={currentEvent.id}
          onAddAgendaItem={onAddAgendaItem}
          onSetCurrentItem={onSetCurrentAgendaItem}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          learners={learners}
          parties={parties}
          committees={committees}
        />
      )}

      {/* Shared Modals */}
      <AddLearnerModal
        isOpen={isAddWalkInOpen}
        onClose={() => setIsAddWalkInOpen(false)}
        eventId={currentEvent.id}
        existingCodes={existingCodes}
        onAddLearner={(l) => {
          onAddLearner(l);
          onShowToast('Walk-in Added', `Registered ${l.full_name} with access code ${l.access_code}`, 'success');
        }}
      />

      <CsvImportModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        eventId={currentEvent.id}
        existingCodes={existingCodes}
        onImportSuccess={onBulkImportLearners}
        onShowToast={onShowToast}
      />

      <AllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        learners={learners}
        parties={parties}
        committees={committees}
        onExecuteAllocation={(rulingRatio) => {
          onExecuteAllocation(rulingRatio);
          onShowToast('Auto-Allocation Complete', 'Mapped TN constituencies, parties, cabinet roles & committees', 'success');
        }}
      />

    </div>
  );
};
