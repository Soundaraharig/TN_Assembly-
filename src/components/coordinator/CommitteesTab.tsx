import React, { useState } from 'react';
import type { Committee, Learner, UserRole } from '../../types';
import { canDelete } from '../../utils/permissions';
import { Plus, BookOpen, Users, Edit, Trash2, X, Eye, Layers, UserCheck } from 'lucide-react';

interface CommitteesTabProps {
  committees: Committee[];
  learners: Learner[];
  eventId: string;
  userRole?: UserRole;
  onAddCommittee: (committee: Partial<Committee>) => void;
  onUpdateCommittee: (committee: Committee) => void;
  onDeleteCommittee: (committeeId: string) => void;
  onSetCommitteeCount?: (count: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CommitteesTab: React.FC<CommitteesTabProps> = ({
  committees,
  learners,
  eventId,
  userRole,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onSetCommitteeCount,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Committee | null>(null);
  const [viewRosterComm, setViewRosterComm] = useState<Committee | null>(null);

  const [committeeCountInput, setCommitteeCountInput] = useState<number>(committees.length || 4);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(50);

  const openCreateModal = () => {
    setEditingComm(null);
    setName(`Committee ${committees.length + 1}`);
    setTopic('Legislative Deliberations & Policy Drafts');
    setChairperson('');
    setMaxCapacity(50);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Committee) => {
    setEditingComm(c);
    setName(c.name);
    setTopic(c.topic);
    setChairperson(c.chairperson || '');
    setMaxCapacity(c.max_capacity || 50);
    setIsModalOpen(true);
  };

  const handleApplyCommitteeCount = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(committeeCountInput);
    if (isNaN(count) || count < 1) {
      onShowToast('Invalid Count', 'Please enter a valid number of committees (minimum 1)', 'error');
      return;
    }
    if (onSetCommitteeCount) {
      onSetCommitteeCount(count);
      onShowToast('Committees Configured', `Configured ${count} committees (Committee 1 to Committee ${count})`, 'success');
    }
  };

  const handleSelectChairperson = (comm: Committee, selectedChairpersonName: string) => {
    onUpdateCommittee({
      ...comm,
      chairperson: selectedChairpersonName
    });
    onShowToast('Committee Chairperson Appointed', `${selectedChairpersonName || 'Chairperson cleared'} appointed for ${comm.name}`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;

    if (editingComm) {
      onUpdateCommittee({
        ...editingComm,
        name: name.trim(),
        topic: topic.trim(),
        chairperson: chairperson.trim(),
        max_capacity: Number(maxCapacity)
      });
      onShowToast('Committee Updated', `Updated details for ${name}`, 'success');
    } else {
      onAddCommittee({
        event_id: eventId,
        name: name.trim(),
        topic: topic.trim(),
        chairperson: chairperson.trim(),
        max_capacity: Number(maxCapacity)
      });
      onShowToast('Committee Created', `Added committee ${name}`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      <div
        className="rounded-2xl p-5 border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              Legislative Committees Control Panel
            </h2>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Manage legislative committee rooms, deliberation topics, and appoint Chairpersons directly from assigned committee members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleApplyCommitteeCount} className="flex items-center gap-2">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-1.5" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Committees:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={committeeCountInput}
                onChange={(e) => setCommitteeCountInput(Number(e.target.value))}
                className="w-12 text-center font-bold text-xs bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
                title="Number of committees"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Set Count (1 to {committeeCountInput})
            </button>
          </form>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Committee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committees.map((comm, index) => {
          const commLearners = learners.filter(
            l => l.committee_id === comm.id || l.committee_name === comm.name
          );

          return (
            <div
              key={comm.id}
              className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
                    style={{ backgroundColor: 'var(--amber)' }}
                  >
                    #{index + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewRosterComm(comm)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                      title="View Committee Roster"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(comm)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit Committee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {canDelete(userRole) && (
                      <button
                        onClick={() => {
                          onDeleteCommittee(comm.id);
                          onShowToast('Committee Deleted', `Deleted committee ${comm.name}`, 'info');
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Delete Committee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-extrabold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {comm.name}
                </h4>

                {comm.topic && (
                  <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Session Topic & Deliberation Scope
                    </span>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {comm.topic}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> Assigned Members
                  </span>
                  <span
                    className="font-bold px-2.5 py-0.5 rounded-full border text-[11px]"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {commLearners.length} / {comm.max_capacity || 50} Max
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Committee Chairperson:</span>
                  </label>

                  {commLearners.length > 0 ? (
                    <select
                      value={comm.chairperson || ''}
                      onChange={(e) => handleSelectChairperson(comm, e.target.value)}
                      className="w-full rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: comm.chairperson ? 'var(--accent)' : 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">-- Choose Chairperson from Members --</option>
                      {commLearners.map((learner) => (
                        <option key={learner.id} value={learner.full_name}>
                          {learner.full_name} ({learner.party_name || 'MLA'} • {learner.academic_year || 'Delegate'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 rounded-xl border text-[11px] italic" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                      No members allocated to this committee yet. (Run Auto-Allocation in Allocation Tab).
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border animate-slide-up"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingComm ? 'Edit Committee' : 'Add Committee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Committee 1 - Public Accounts"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Deliberation Topic *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Curriculum Modernization & AI Ethics in Higher Education"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl p-3 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Max Capacity</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  {editingComm ? 'Save Changes' : 'Create Committee'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {viewRosterComm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{viewRosterComm.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assigned Member Delegates Roster</p>
              </div>
              <button onClick={() => setViewRosterComm(null)} className="p-1 rounded-lg hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {learners.filter(l => l.committee_id === viewRosterComm.id || l.committee_name === viewRosterComm.name).length === 0 ? (
                <p className="text-xs italic py-6 text-center" style={{ color: 'var(--text-muted)' }}>No delegates assigned to this committee yet.</p>
              ) : (
                learners
                  .filter(l => l.committee_id === viewRosterComm.id || l.committee_name === viewRosterComm.name)
                  .map((learner, i) => (
                    <div
                      key={learner.id}
                      className="p-3 rounded-xl flex items-center justify-between text-xs border"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i + 1}. {learner.full_name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {learner.department} • <span className="font-bold" style={{ color: 'var(--amber)' }}>{learner.academic_year}</span> • {learner.party_name || 'Independent'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{learner.access_code}</span>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{learner.role || 'MLA'}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
