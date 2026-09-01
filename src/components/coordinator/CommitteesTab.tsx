import React, { useState } from 'react';
import type { Committee, Learner } from '../../types';
import { Plus, BookOpen, User, Users, Edit, Trash2, X, Eye } from 'lucide-react';

interface CommitteesTabProps {
  committees: Committee[];
  learners: Learner[];
  eventId: string;
  onAddCommittee: (committee: Partial<Committee>) => void;
  onUpdateCommittee: (committee: Committee) => void;
  onDeleteCommittee: (committeeId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CommitteesTab: React.FC<CommitteesTabProps> = ({
  committees,
  learners,
  eventId,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Committee | null>(null);

  const [viewRosterComm, setViewRosterComm] = useState<Committee | null>(null);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(50);

  const openCreateModal = () => {
    setEditingComm(null);
    setName('');
    setTopic('');
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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Legislative Committees Control Panel</span>
          </h3>
          <p className="text-xs text-slate-400">
            Manage committee rooms, agenda topics, faculty chairpersons & member capacity
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Legislative Committee</span>
        </button>
      </div>

      {/* Grid of Committees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committees.map((comm) => {
          const commLearners = learners.filter(l => l.committee_name === comm.name);

          return (
            <div
              key={comm.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Committee Room
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewRosterComm(comm)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="View Committee Roster"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(comm)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Committee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteCommittee(comm.id);
                        onShowToast('Committee Deleted', `Deleted committee ${comm.name}`, 'info');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Committee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white leading-snug">
                  {comm.name}
                </h4>

                {comm.topic && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Session Topic</span>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {comm.topic}
                    </p>
                  </div>
                )}

                {comm.chairperson && (
                  <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 pt-1">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Chair: {comm.chairperson}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Assigned Delegates
                </span>
                <span className="text-sm font-extrabold text-white bg-slate-800 px-3 py-1 rounded-lg">
                  {commLearners.length} / {comm.max_capacity} Max
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingComm ? 'Edit Committee' : 'Add Committee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Education & Skill Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agenda / Deliberation Topic *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Curriculum Modernization & AI Ethics in Higher Education"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chairperson</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. A. Ramanathan"
                    value={chairperson}
                    onChange={(e) => setChairperson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
                >
                  {editingComm ? 'Save Changes' : 'Create Committee'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Roster View Modal */}
      {viewRosterComm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">{viewRosterComm.name}</h3>
                <p className="text-xs text-slate-400">Assigned Member Delegates Roster</p>
              </div>
              <button onClick={() => setViewRosterComm(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {learners.filter(l => l.committee_name === viewRosterComm.name).length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No delegates assigned to this committee yet.</p>
              ) : (
                learners
                  .filter(l => l.committee_name === viewRosterComm.name)
                  .map((learner, i) => (
                    <div key={learner.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{i + 1}. {learner.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {learner.department} • <span className="text-amber-400">{learner.academic_year}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-mono font-bold">{learner.access_code}</span>
                        <p className="text-[11px] text-slate-400">{learner.role || 'MLA'}</p>
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
