import React, { useState } from 'react';
import type { Nomination, Learner, NominationPosition } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  XCircle,
  Check
} from 'lucide-react';

interface NominationsTabProps {
  nominations: Nomination[];
  learners: Learner[];
  parties?: any;
  eventId: string;
  onAddNomination: (nom: Partial<Nomination>) => void;
  onUpdateStatus: (id: string, status: 'Pending' | 'Approved' | 'Rejected') => void;
  onDeleteNomination: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const NominationsTab: React.FC<NominationsTabProps> = ({
  nominations,
  learners,
  eventId,
  onAddNomination,
  onUpdateStatus,
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
      status: 'Approved' // Auto-approve or pending
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
            File and review nominations for Speaker, Deputy Speaker, Ruling Party Leader & Opposition Leader. Approved nominees directly sync to Elections.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ File New Nomination</span>
        </button>
      </div>

      {/* Position Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'Speaker', 'Deputy Speaker', 'Ruling Party Leader', 'Opposition Party Leader', 'Committee Chair'].map(pos => (
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
            No candidate nominations recorded for this position. Click "+ File New Nomination" to submit candidates.
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

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      nom.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : nom.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}
                  >
                    ● {nom.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {nom.candidate_name}
                  </h4>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {nom.party_name} • <span className={nom.bench === 'Ruling' ? 'text-emerald-500' : 'text-rose-500'}>{nom.bench} Bench</span>
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl border text-xs italic leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                >
                  "{nom.manifesto}"
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onUpdateStatus(nom.id, 'Approved');
                      onShowToast('Nomination Approved', `${nom.candidate_name} added to Election ballot`, 'success');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${
                      nom.status === 'Approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                    title="Approve and link to live ballot"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>

                  <button
                    onClick={() => {
                      onUpdateStatus(nom.id, 'Rejected');
                      onShowToast('Nomination Rejected', `${nom.candidate_name} status updated`, 'info');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${
                      nom.status === 'Rejected' ? 'bg-rose-600 text-white border-rose-600' : 'hover:bg-rose-50 hover:text-rose-700'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>

                <button
                  onClick={() => {
                    onDeleteNomination(nom.id);
                    onShowToast('Nomination Deleted', 'Removed from roster', 'info');
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Delete
                </button>
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
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
