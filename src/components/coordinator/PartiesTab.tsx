import React, { useState } from 'react';
import type { Party, BenchType, Learner } from '../../types';
import { Plus, Users, Shield, Edit, Trash2, X } from 'lucide-react';

interface PartiesTabProps {
  parties: Party[];
  learners: Learner[];
  eventId: string;
  onAddParty: (party: Partial<Party>) => void;
  onUpdateParty: (party: Party) => void;
  onDeleteParty: (partyId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PartiesTab: React.FC<PartiesTabProps> = ({
  parties,
  learners,
  eventId,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const [name, setName] = useState('');
  const [bench, setBench] = useState<BenchType>('Ruling');
  const [color, setColor] = useState('#059669');
  const [leader, setLeader] = useState('');
  const [manifesto, setManifesto] = useState('');

  const openCreateModal = () => {
    setEditingParty(null);
    setName('');
    setBench('Ruling');
    setColor('#2563eb');
    setLeader('');
    setManifesto('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Party) => {
    setEditingParty(p);
    setName(p.name);
    setBench(p.bench);
    setColor(p.color || '#2563eb');
    setLeader(p.leader || '');
    setManifesto(p.manifesto || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingParty) {
      onUpdateParty({
        ...editingParty,
        name: name.trim(),
        bench,
        color,
        leader: leader.trim(),
        manifesto: manifesto.trim()
      });
      onShowToast('Party Updated', `Updated details for ${name}`, 'success');
    } else {
      onAddParty({
        event_id: eventId,
        name: name.trim(),
        bench,
        color,
        leader: leader.trim(),
        manifesto: manifesto.trim()
      });
      onShowToast('Party Created', `Added political party ${name}`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Political Parties Control Panel</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure parties, bench distribution (Ruling vs Opposition), colors, leaders & manifestos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Political Party</span>
        </button>
      </div>

      {/* Grid of Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map((party) => {
          const partyLearners = learners.filter(l => l.party_name === party.name);
          const isRuling = party.bench === 'Ruling';

          return (
            <div
              key={party.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              style={{ borderLeft: `5px solid ${party.color}` }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    isRuling
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {party.bench} Bench
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(party)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Party"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteParty(party.id);
                        onShowToast('Party Deleted', `Deleted party ${party.name}`, 'info');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Party"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: party.color }}></span>
                  <span>{party.name}</span>
                </h4>

                {party.leader && (
                  <p className="text-xs text-amber-300 font-semibold">
                    Leader: {party.leader}
                  </p>
                )}

                {party.manifesto && (
                  <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    "{party.manifesto}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Allocated Delegates
                </span>
                <span className="text-sm font-extrabold text-white bg-slate-800 px-3 py-1 rounded-lg">
                  {partyLearners.length} Delegates
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
                {editingParty ? 'Edit Political Party' : 'Add Political Party'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. APJ Abdul Kalam Youth Front"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bench Assignment</label>
                  <select
                    value={bench}
                    onChange={(e) => setBench(e.target.value as BenchType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ruling">Ruling Bench</option>
                    <option value="Opposition">Opposition Bench</option>
                    <option value="Independent">Independent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Party Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Party Leader (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hariharan S"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Manifesto / Focus (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Key legislative policies and goals..."
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  {editingParty ? 'Save Changes' : 'Create Party'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
