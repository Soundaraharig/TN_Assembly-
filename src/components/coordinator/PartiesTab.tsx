import React, { useState } from 'react';
import type { Party, BenchType, Learner } from '../../types';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  X,
  Crown,
  RefreshCw
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
  onRebalanceCommittees?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PartiesTab: React.FC<PartiesTabProps> = ({
  parties,
  learners,
  eventId,
  treasuryWhatsApp = '',
  oppositionWhatsApp = '',
  onSaveWhatsAppLinks,
  onUpdatePartyWhatsApp,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
  onRebalanceCommittees,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const [treasuryLink, setTreasuryLink] = useState(treasuryWhatsApp);
  const [oppositionLink, setOppositionLink] = useState(oppositionWhatsApp);

  const [name, setName] = useState('');
  const [bench, setBench] = useState<BenchType>('Independent');
  const [color, setColor] = useState('#059669');
  const [leader, setLeader] = useState('');
  const [manifesto, setManifesto] = useState('');

  const openCreateModal = () => {
    setEditingParty(null);
    setName('');
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

  const handleSaveLinks = () => {
    if (onSaveWhatsAppLinks) {
      onSaveWhatsAppLinks(treasuryLink, oppositionLink);
      onShowToast('Links Saved', 'Updated Bench WhatsApp group links', 'success');
    }
  };

  const handlePartyWhatsAppBlur = (partyId: string, link: string) => {
    if (onUpdatePartyWhatsApp) {
      onUpdatePartyWhatsApp(partyId, link);
      onShowToast('Party Link Updated', 'WhatsApp invite link saved', 'info');
    }
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
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Political Parties</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Equal parties with manifesto & symbol. Ruling vs Opposition is decided on event day — not here.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Party</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Bench WhatsApp groups
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Each student is shown the group for the bench they sit on, on their own page and in their access-code email. In WhatsApp: open the group → Group info → Invite via link → Copy link. It looks like https://chat.whatsapp.com/...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Treasury (ruling) bench
            </label>
            <input
              type="text"
              placeholder="https://chat.whatsapp.com/FOGg0tFOTXx3kyzVVBT9gG"
              value={treasuryLink}
              onChange={(e) => setTreasuryLink(e.target.value)}
              onBlur={handleSaveLinks}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Opposition bench
            </label>
            <input
              type="text"
              placeholder="https://chat.whatsapp.com/LCJCf92uSMQ0jntlfMk736"
              value={oppositionLink}
              onChange={(e) => setOppositionLink(e.target.value)}
              onBlur={handleSaveLinks}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Committees</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spread students evenly across committees by party (mixed committees). Only the Speaker & Deputy Speakers are excluded — they preside. Allocation runs this automatically; use this to re-balance without changing parties.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onRebalanceCommittees) onRebalanceCommittees();
            onShowToast('Committees Re-balanced', 'Equalized committee seat distribution across parties', 'success');
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Assign / Re-balance Committees</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parties.map((party, index) => {
          const partyLearners = learners.filter(l => l.party_name === party.name);
          const memberCount = partyLearners.length;

          return (
            <div
              key={party.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-500">
                    #
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-600 text-white">
                    #{index + 1}
                  </span>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wide">
                    {party.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(party)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    title="Edit Party"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteParty(party.id);
                      onShowToast('Party Deleted', `Deleted party ${party.name}`, 'info');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Party"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  defaultValue={party.whatsapp_group_link || ''}
                  onBlur={(e) => handlePartyWhatsAppBlur(party.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{memberCount} members</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {party.leader ? (
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[11px]">
                      <Crown className="w-3 h-3 text-amber-500" />
                      <span>{party.leader}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">No leader</span>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(party)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    {party.leader ? 'Change' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingParty ? 'Edit Political Party' : 'Add Political Party'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RASHTRA NIRMAN PARTY"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Leader Name</label>
                <input
                  type="text"
                  placeholder="e.g. D. Arjun"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Manifesto / Focus</label>
                <textarea
                  rows={2}
                  placeholder="Brief party vision or policy priorities..."
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
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
