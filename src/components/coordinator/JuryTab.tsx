import React, { useState } from 'react';
import type { JuryMember, BenchType, UserRole } from '../../types';
import { canDelete } from '../../utils/permissions';
import {
  Users,
  Plus,
  Copy,
  Check,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Link2
} from 'lucide-react';

interface JuryTabProps {
  jury: JuryMember[];
  eventId: string;
  userRole?: UserRole;
  onAddJury: (j: Partial<JuryMember>) => void;
  onDeleteJury: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  juryAccessUrl?: string;
}

export const JuryTab: React.FC<JuryTabProps> = ({
  jury,
  eventId,
  userRole,
  onAddJury,
  onDeleteJury,
  onShowToast,
  juryAccessUrl
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionsBannerOpen, setIsSessionsBannerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const effectiveJuryUrl = juryAccessUrl || (typeof window !== 'undefined' ? `${window.location.origin}/join` : 'https://tnassembly.vercel.app/join');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Parliamentary Juror');
  const [bench, setBench] = useState<BenchType>('Ruling');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveJuryUrl);
    setCopiedLink(true);
    onShowToast('Link Copied', 'Jury access link copied to clipboard', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast('Code Copied', `Access code ${code} copied to clipboard`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddJury({
      event_id: eventId,
      name: name.trim(),
      email: email.trim() || undefined,
      designation: designation.trim(),
      assigned_bench: bench,
      status: 'Active'
    });

    setName('');
    setEmail('');
    setIsModalOpen(false);
    onShowToast('Juror Added', `Added ${name} to jury panel`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Assign Jurors to Sessions Collapsible Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setIsSessionsBannerOpen(!isSessionsBannerOpen)}
          className="w-full flex items-center justify-between text-left font-bold text-xs text-amber-900 dark:text-amber-300"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Assign jurors to sessions</span>
          </div>
          {isSessionsBannerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isSessionsBannerOpen && (
          <div className="pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-amber-200/50 dark:border-amber-900/40 mt-3">
            <p>Assign specific jurors to score Question Hour, Bill Debates, or Committee Presentations.</p>
            <p className="text-[11px] text-slate-500">Each juror logs in with their individual 6-character access code below to access the live evaluation scorecard.</p>
          </div>
        )}
      </div>

      {/* Jury Access Link Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Jury access link
          </label>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <span>{effectiveJuryUrl}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jurors open this link and enter their access code (below) to start scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-0">
        
        {/* Table Header Row */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Jury Members ({jury.length})
          </h3>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Jury</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-5 font-bold">Name</th>
                <th className="py-3 px-5 font-bold">Email</th>
                <th className="py-3 px-5 font-bold">Access Code</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 text-right font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jury.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No jury members added yet. Click "+ Add Jury" to register jurors.
                  </td>
                </tr>
              ) : (
                jury.map((j, idx) => {
                  const displayCode = (j.access_code && j.access_code.trim() ? j.access_code : `JURY${String(idx + 1).padStart(2, '0')}`).replace('JURY-', 'JURY');

                  return (
                    <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Name */}
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 dark:text-white">
                        {j.name}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-medium">
                        {j.email || '—'}
                      </td>

                      {/* Access Code */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                            {displayCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(displayCode)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                            title="Copy access code"
                          >
                            {copiedCode === displayCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={effectiveJuryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-amber-500 p-0.5"
                            title="Open Jury Login"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {j.status || 'Active'}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-5 text-right">
                      {canDelete(userRole) && (
                        <button
                          type="button"
                          onClick={() => onDeleteJury(j.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete jury member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Jury Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Jury Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Juror Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Krishnaveni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="juror@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Parliamentary Analyst"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Evaluation Focus</label>
                <select
                  value={bench}
                  onChange={(e) => setBench(e.target.value as BenchType)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Ruling">Ruling Bench Focus</option>
                  <option value="Opposition">Opposition Bench Focus</option>
                  <option value="Independent">General / Both Benches</option>
                </select>
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
                  Save Juror
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
