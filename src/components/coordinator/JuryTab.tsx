import React, { useState } from 'react';
import type { JuryMember, BenchType } from '../../types';
import { Scale, Plus, UserCheck, Trash2, X } from 'lucide-react';

interface JuryTabProps {
  jury: JuryMember[];
  eventId: string;
  onAddJury: (j: Partial<JuryMember>) => void;
  onDeleteJury: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const JuryTab: React.FC<JuryTabProps> = ({ jury, eventId, onAddJury, onDeleteJury, onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bench, setBench] = useState<BenchType>('Ruling');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddJury({
      event_id: eventId,
      name: name.trim(),
      designation: designation.trim(),
      assigned_bench: bench
    });

    onShowToast('Juror Added', `Assigned ${name} to evaluate ${bench} bench`, 'success');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <span>Parliament Jury Panel & Evaluation</span>
          </h3>
          <p className="text-xs text-slate-500">
            Jurors observe assembly debates and evaluate delegates based on bench-specific criteria
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Juror
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jury.map((j) => (
          <div key={j.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{j.name}</h4>
                <p className="text-xs text-slate-500">{j.designation}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Assigned Bench: {j.assigned_bench}
                </span>
              </div>
            </div>
            <button onClick={() => onDeleteJury(j.id)} className="text-slate-400 hover:text-rose-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Assembly Juror</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Juror Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Justice K. Chandru (Retd.)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Parliamentary Analyst"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Bench</label>
                <select
                  value={bench}
                  onChange={(e) => setBench(e.target.value as BenchType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Ruling">Ruling Bench</option>
                  <option value="Opposition">Opposition Bench</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Save Juror</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
