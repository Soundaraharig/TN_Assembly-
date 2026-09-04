import React, { useState } from 'react';
import type { Party, BenchType, Learner } from '../../types';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  X,
  Crown,
  Shield,
  Layers
} from 'lucide-react';

interface PartiesTabProps {
  parties: Party[];
  learners: Learner[];
  eventId: string;
  treasuryWhatsApp?: string;
  oppositionWhatsApp?: string;
  onSaveWhatsAppLinks?: (treasury: string, opposition: string) => void;
  onUpdatePartyWhatsApp?: (partyId: string, link: string) => void;
  onAddParty: (party: Partial<Party>) => void;
  onUpdateParty: (party: Party) => void;
  onDeleteParty: (partyId: string) => void;
  onSetPartyCount?: (count: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PartiesTab: React.FC<PartiesTabProps> = ({
  parties,
  learners,
  eventId,
  onUpdatePartyWhatsApp,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
  onSetPartyCount,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Dynamic Party Count Setup (Party 1 to Party N)
  const [partyCountInput, setPartyCountInput] = useState<number>(parties.length || 4);

  const [name, setName] = useState('');
  const [bench, setBench] = useState<BenchType>('Independent');
  const [color, setColor] = useState('#059669');
  const [leader, setLeader] = useState('');
  const [manifesto, setManifesto] = useState('');

  const openCreateModal = () => {
    setEditingParty(null);
    setName(`Party ${parties.length + 1}`);
    setBench('Independent');
    setColor('#059669');
    setLeader('');
    setManifesto('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Party) => {
    setEditingParty(p);
    setName(p.name);
    setBench(p.bench);
    setColor(p.color || '#059669');
    setLeader(p.leader || '');
    setManifesto(p.manifesto || '');
    setIsModalOpen(true);
  };

  const handleApplyPartyCount = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(partyCountInput);
    if (isNaN(count) || count < 1) {
      onShowToast('Invalid Count', 'Please enter a valid number of parties (minimum 1)', 'error');
      return;
    }
    if (onSetPartyCount) {
      onSetPartyCount(count);
      onShowToast('Parties Configured', `Configured ${count} parties (Party 1 to Party ${count})`, 'success');
    }
  };

  const handlePartyWhatsAppBlur = (partyId: string, link: string) => {
    if (onUpdatePartyWhatsApp) {
      onUpdatePartyWhatsApp(partyId, link);
      onShowToast('Party Link Updated', 'WhatsApp group link saved for this party', 'info');
    }
  };

  const handleSelectLeader = (party: Party, selectedLeaderName: string) => {
    onUpdateParty({
      ...party,
      leader: selectedLeaderName
    });
    onShowToast('Party Leader Appointed', `${selectedLeaderName || 'Leader cleared'} appointed for ${party.name}`, 'success');
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
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      {/* Top Header & Party Count Generator */}
      <div
        className="rounded-2xl p-5 border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              Political Parties Configuration
            </h2>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Configure political parties and appoint Party Leaders directly from enrolled party delegates.
          </p>
        </div>

        {/* Dynamic Number of Parties Form & Quick Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleApplyPartyCount} className="flex items-center gap-2">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-1.5" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Parties:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={partyCountInput}
                onChange={(e) => setPartyCountInput(Number(e.target.value))}
                className="w-12 text-center font-bold text-xs bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
                title="Number of political parties"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Set Count (1 to {partyCountInput})
            </button>
          </form>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Party</span>
          </button>
        </div>
      </div>

      {/* Grid of Political Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parties.map((party, index) => {
          const partyLearners = learners.filter(
            l => l.party_id === party.id || l.party_name === party.name
          );
          const memberCount = partyLearners.length;

          return (
            <div
              key={party.id}
              className="rounded-2xl p-4 border shadow-sm flex flex-col justify-between space-y-4 transition-all"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {/* Card Header: Party Number & Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
                      style={{ backgroundColor: party.color || 'var(--accent)' }}
                    >
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      {party.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(party)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit Party Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteParty(party.id);
                        onShowToast('Party Deleted', `Deleted party ${party.name}`, 'info');
                      }}
                      className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete Party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Optional WhatsApp Group Link for this party */}
                <div className="pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Party WhatsApp Group (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://chat.whatsapp.com/..."
                    defaultValue={party.whatsapp_group_link || ''}
                    onBlur={(e) => handlePartyWhatsAppBlur(party.id, e.target.value)}
                    className="w-full rounded-xl px-3 py-1.5 text-[11px] font-mono focus:outline-none border"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Party Members Count & Leader Selector Dropdown */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span>{memberCount} enrolled members</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {party.bench || 'Independent'}
                  </span>
                </div>

                {/* Party Leader Selection Dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--amber)' }}>
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>Party Leader / Floor Leader:</span>
                  </label>

                  {memberCount > 0 ? (
                    <select
                      value={party.leader || ''}
                      onChange={(e) => handleSelectLeader(party, e.target.value)}
                      className="w-full rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: party.leader ? 'var(--amber)' : 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">-- Choose Leader from Members --</option>
                      {partyLearners.map((learner) => (
                        <option key={learner.id} value={learner.full_name}>
                          {learner.full_name} ({learner.department || 'MLA'} • {learner.academic_year || 'Delegate'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 rounded-xl border text-[11px] italic" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                      No members allocated to {party.name} yet. (Run Auto-Allocation or add participants first).
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal for Create/Edit Party */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingParty ? 'Edit Political Party' : 'Add Political Party'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:opacity-80 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Party 1 or TAMIL DESIYA KATCHI"
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
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Party Color Theme</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-8 rounded-lg border cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>{color}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Party Manifesto / Vision (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief party vision or policy priorities..."
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
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
                  style={{ backgroundColor: 'var(--accent)' }}
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
