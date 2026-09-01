import React, { useState } from 'react';
import type { Volunteer } from '../../types';
import { HeartHandshake, Plus, Trash2, X, Phone, Mail } from 'lucide-react';

interface VolunteersTabProps {
  volunteers: Volunteer[];
  eventId: string;
  onAddVolunteer: (v: Partial<Volunteer>) => void;
  onDeleteVolunteer: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VolunteersTab: React.FC<VolunteersTabProps> = ({
  volunteers,
  eventId,
  onAddVolunteer,
  onDeleteVolunteer,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Delegate Registration');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddVolunteer({
      event_id: eventId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim()
    });

    onShowToast('Volunteer Registered', `Added ${name} to team`, 'success');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-600" />
            <span>Event Operations & Volunteers</span>
          </h3>
          <p className="text-xs text-slate-500">
            Logistics, registration desk, venue coordination, and technical support team
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Volunteer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {volunteers.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {v.role}
              </span>
              <h4 className="text-base font-extrabold text-slate-900">{v.name}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                {v.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {v.email}</span>}
                {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {v.phone}</span>}
              </p>
            </div>
            <button onClick={() => onDeleteVolunteer(v.id)} className="text-slate-400 hover:text-rose-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Student Volunteer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Volunteer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gokulnath R"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="gokul@erode.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <input
                  type="text"
                  placeholder="e.g. Stage Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs">Save Volunteer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
