import React, { useState } from 'react';
import type { BillProceeding, Learner } from '../../types';
import {
  FileText,
  Plus,
  Vote,
  CheckCircle2
} from 'lucide-react';

interface ProceedingsTabProps {
  proceedings: BillProceeding[];
  learners: Learner[];
  eventId: string;
  onAddBill: (bill: Partial<BillProceeding>) => void;
  onUpdateBillStatus: (id: string, status: BillProceeding['status'], ayes?: number, noes?: number) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProceedingsTab: React.FC<ProceedingsTabProps> = ({
  proceedings,
  learners,
  eventId,
  onAddBill,
  onUpdateBillStatus,
  onShowToast
}) => {
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billSummary, setBillSummary] = useState('');
  const [billIntroducerId, setBillIntroducerId] = useState('');

  const passedBills = proceedings.filter(p => p.status === 'Passed');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim()) return;

    const delegate = learners.find(l => l.id === billIntroducerId) || learners[0];
    const introducedBy = delegate ? `${delegate.full_name} (${delegate.role || 'MLA'})` : 'Hon. Member';
    const bench = delegate?.bench || 'Ruling';

    onAddBill({
      event_id: eventId,
      bill_number: `TN-BILL-${Math.floor(10 + Math.random() * 90)}/2026`,
      title: billTitle.trim(),
      introduced_by: introducedBy,
      bench,
      summary: billSummary.trim() || 'A legislative statute tabled before the Assembly for consideration and enactment.',
      status: 'Debating'
    });

    setIsAddBillOpen(false);
    setBillTitle('');
    setBillSummary('');
    onShowToast('Bill Tabled', `Tabled ${billTitle} for floor reading & division`, 'success');
  };

  const handleEnactBill = (id: string, ayes: number, noes: number) => {
    const isPassed = ayes > noes;
    const status = isPassed ? 'Passed' : 'Rejected';
    onUpdateBillStatus(id, status, ayes, noes);
    onShowToast(
      isPassed ? '🎉 Bill Enacted as Act' : 'Bill Defeated in Division',
      `Ayes: ${ayes}, Noes: ${noes}`,
      isPassed ? 'success' : 'info'
    );
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
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Official Assembly Hansard & Legislative Proceedings
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Record bills tabled, floor debates, clause-by-clause divisions, and enacted youth statutes.
          </p>
        </div>

        <button
          onClick={() => setIsAddBillOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Table Legislative Bill</span>
        </button>
      </div>

      {/* Hansard Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bills Tabled</span>
          <strong className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{proceedings.length}</strong>
        </div>
        <div className="p-4 rounded-2xl border shadow-sm bg-emerald-500/5 border-emerald-500/30">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Enacted Legislative Acts</span>
          <strong className="text-2xl font-black text-emerald-600">{passedBills.length} Passed</strong>
        </div>
        <div className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Under Active Floor Debate</span>
          <strong className="text-2xl font-black text-amber-500">
            {proceedings.filter(p => p.status === 'Debating' || p.status === 'Introduced').length}
          </strong>
        </div>
      </div>

      {/* Legislative Bills List */}
      <div className="space-y-4">
        {proceedings.length === 0 ? (
          <div
            className="py-12 text-center rounded-2xl border italic text-xs"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No legislative bills tabled yet. Click "+ Table Legislative Bill" to initiate legislation.
          </div>
        ) : (
          proceedings.map(bill => (
            <div
              key={bill.id}
              className="rounded-2xl p-5 border shadow-sm space-y-4 transition-all"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30">
                    {bill.bill_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    bill.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {bill.bench} Bench Bill
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                  bill.status === 'Passed'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : bill.status === 'Rejected'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                }`}>
                  ● {bill.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {bill.title}
                </h4>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Sponsor: <strong style={{ color: 'var(--text-primary)' }}>{bill.introduced_by}</strong>
                </p>
                <div
                  className="p-3 rounded-xl border text-xs leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                >
                  {bill.summary}
                </div>
              </div>

              {/* Division Voting Action Controls */}
              {bill.status === 'Debating' && (
                <div
                  className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Vote className="w-4 h-4 text-emerald-500" /> Division Call (Ayes vs Noes):
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnactBill(bill.id, 28, 12)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      ✓ Pass Bill (Ayes: 28, Noes: 12)
                    </button>
                    <button
                      onClick={() => handleEnactBill(bill.id, 10, 30)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      ✕ Defeat Bill (Ayes: 10, Noes: 30)
                    </button>
                  </div>
                </div>
              )}

              {bill.status === 'Passed' && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enacted into Law by majority vote (Ayes: {bill.ayes}, Noes: {bill.noes})</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table Bill Modal */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Table New Legislative Bill
              </h4>
              <button onClick={() => setIsAddBillOpen(false)} className="p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Bill Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamil Nadu Renewable Energy & Student Innovation Act 2026"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Bill Sponsor (MLA / Minister)</label>
                <select
                  value={billIntroducerId}
                  onChange={(e) => setBillIntroducerId(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Member of Assembly --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} ({l.role || 'MLA'} • {l.party_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Preamble & Legislative Objective</label>
                <textarea
                  rows={3}
                  value={billSummary}
                  onChange={(e) => setBillSummary(e.target.value)}
                  placeholder="Outline key clauses, state funding provisions, and implementation timeline..."
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  Table Bill in House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
