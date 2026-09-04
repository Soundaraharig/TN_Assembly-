import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';

interface NominationsTabProps {
  nominations: Nomination[];
  learners: Learner[];
  parties?: Party[];
  eventId: string;
  userRole?: UserRole;
  openPositions?: string[];
  onToggleOpenPosition?: (position: string) => void;
  onAddNomination: (nom: Partial<Nomination>) => void;
  onUpdateStatus?: (id: string, status: 'Pending' | 'Approved' | 'Rejected') => void;
  onDeleteNomination: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_NOMINATION_POSITIONS = [
  'Speaker',
  'Deputy Speaker',
  'Ruling Party Leader',
  'Opposition Party Leader',
  'Committee Chair'
];

export const NominationsTab: React.FC<NominationsTabProps> = ({
  nominations,
  learners,
  parties = [],
  eventId,
  userRole,
  openPositions = ['Speaker', 'Ruling Party Leader', 'Opposition Party Leader'],
  onToggleOpenPosition,
  onAddNomination,
  onDeleteNomination,
  onShowToast
}) => {
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [candidateLearnerId, setCandidateLearnerId] = useState('');
  const [nomPosition, setNomPosition] = useState<NominationPosition>('Speaker');
  const [manifesto, setManifesto] = useState('');

  const filteredNominations = nominations.filter(n => {
    if (selectedPosition !== 'ALL' && n.position !== selectedPosition) return false;
    return true;
  });

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
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-emerald-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Parliamentary Leadership Nominations
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Start or stop nomination periods for positions. Anyone can submit nominations when a position status is Open.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ File Nomination</span>
        </button>
      </div>

      {/* Position Status & Control Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Position Nomination Status Controls
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ALL_NOMINATION_POSITIONS.map(pos => {
            const isOpen = openPositions.includes(pos);
            const count = nominations.filter(n => n.position === pos).length;

            return (
              <div
                key={pos}
                className="rounded-2xl p-3.5 border shadow-sm space-y-3 flex flex-col justify-between"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-extrabold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {pos}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider flex items-center gap-1 ${
                        isOpen
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Open
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          Closed
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-slate-400">
                    {count} {count === 1 ? 'nomination' : 'nominations'} filed
                  </p>
                </div>

                {onToggleOpenPosition && (
                  <button
                    onClick={() => {
                      onToggleOpenPosition(pos);
                      onShowToast(
                        isOpen ? 'Nomination Stopped' : 'Nomination Started',
                        `Nomination process for ${pos} is now ${isOpen ? 'closed' : 'open for delegates'}`,
                        isOpen ? 'info' : 'success'
                      );
                    }}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isOpen
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm'
                    }`}
                  >
                    {isOpen ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        Stop Nomination
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Start Nomination
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Position Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {['ALL', ...ALL_NOMINATION_POSITIONS].map(pos => (
          <button
            key={pos}
            onClick={() => setSelectedPosition(pos)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedPosition === pos ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: selectedPosition === pos ? 'var(--amber)' : 'var(--bg-surface)',
              color: selectedPosition === pos ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedPosition === pos ? 'var(--amber)' : 'var(--border)'
            }}
          >
            {pos === 'ALL' ? 'All Roles' : pos}
          </button>
        ))}
      </div>

      {/* Nominations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNominations.length === 0 ? (
          <div
            className="col-span-full py-12 text-center rounded-2xl border italic text-xs"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No candidate nominations recorded for this position. Click "+ File Nomination" to submit candidate nominations.
          </div>
        ) : (
          filteredNominations.map(nom => (
            <div
              key={nom.id}
              className="rounded-2xl p-5 border shadow-sm space-y-3 flex flex-col justify-between transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      borderColor: 'var(--accent)'
                    }}
                  >
                    {nom.position}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Nominated
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {nom.candidate_name}
                  </h4>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {(() => {
                      const cand = learners.find(l => l.id === nom.candidate_learner_id);
                      return cand ? getResolvedPartyName(cand, parties) : (nom.party_name || 'Independent');
                    })()} • <span className={nom.bench === 'Ruling' ? 'text-emerald-500' : 'text-rose-500'}>{nom.bench} Bench</span>
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl border text-xs italic leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                >
                  "{nom.manifesto}"
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(nom.created_at || Date.now()).toLocaleDateString()}
                </span>

                {canDelete(userRole) && (
                  <button
                    onClick={() => {
                      onDeleteNomination(nom.id);
                      onShowToast('Nomination Removed', 'Removed from nomination roster', 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1"
                    title="Delete nomination record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* File Nomination Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                File Candidate Nomination
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Position *</label>
                <select
                  value={nomPosition}
                  onChange={(e) => setNomPosition(e.target.value as NominationPosition)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="Speaker">Speaker of the Legislative Assembly</option>
                  <option value="Deputy Speaker">Deputy Speaker</option>
                  <option value="Ruling Party Leader">Ruling Party Leader (Chief Minister candidate)</option>
                  <option value="Opposition Party Leader">Leader of the Opposition</option>
                  <option value="Committee Chair">Committee Chairperson</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Select Delegate *</label>
                <select
                  value={candidateLearnerId}
                  onChange={(e) => setCandidateLearnerId(e.target.value)}
                  required
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose registered participant --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.party_name || 'Independent'} • {l.bench || 'No bench'} • Code: {l.access_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Key Manifesto / Candidacy Pitch</label>
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
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
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

