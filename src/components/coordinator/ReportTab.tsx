import React from 'react';
import type { CollegeEvent, Learner, Party, Committee, BillProceeding, ScoreRecord } from '../../types';
import { exportFullParticipantDataToCSV } from '../../utils/csvHelper';
import {
  BarChart,
  FileText,
  Download,
  Printer,
  Users,
  Landmark
} from 'lucide-react';

interface ReportTabProps {
  event: CollegeEvent;
  learners: Learner[];
  parties?: Party[];
  committees?: Committee[];
  proceedings: BillProceeding[];
  scores?: ScoreRecord[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  event,
  learners,
  proceedings,
  onShowToast
}) => {
  const totalLearners = learners.length;
  const d1CheckIn = learners.filter(l => l.day1_checked_in).length;
  const d2CheckIn = learners.filter(l => l.day2_checked_in).length;
  const rulingCount = learners.filter(l => l.bench === 'Ruling').length;
  const oppCount = learners.filter(l => l.bench === 'Opposition').length;

  const handlePrintDossier = () => {
    window.print();
  };

  const handleDownloadFullCSV = () => {
    exportFullParticipantDataToCSV(learners, `${event.college_name.replace(/\s+/g, '_')}_Final_Report.csv`);
    onShowToast('Report Dossier Exported', 'Complete parliamentary roster and metrics downloaded', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* Header Action Bar */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <BarChart className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Executive Assembly Dossier & Post-Event Report
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Official legislative summary, attendance analytics, enacted statutes, and parliamentary honours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadFullCSV}
            className="px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrintDossier}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-102"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Dossier</span>
          </button>
        </div>
      </div>

      {/* Official Executive Report Document Container */}
      <div
        className="rounded-3xl p-6 sm:p-10 border shadow-md space-y-8 print:border-none print:shadow-none print:p-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Document Header */}
        <div className="text-center border-b pb-6 space-y-2" style={{ borderColor: 'var(--border-soft)' }}>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
            TAMIL NADU YOUTH LEGISLATIVE ASSEMBLY SECRETARIAT
          </span>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            Official Post-Session Legislative Report
          </h2>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {event.college_name} • {event.dates} • {event.location}
          </p>
        </div>

        {/* Section 1: Executive Statistical Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Users className="w-4 h-4" /> 1. Assembly Attendance & Bench Allocation
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Registered</span>
              <strong className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{totalLearners}</strong>
            </div>
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Day 1 Attendance</span>
              <strong className="text-xl font-black text-emerald-500">
                {totalLearners > 0 ? Math.round((d1CheckIn / totalLearners) * 100) : 0}% ({d1CheckIn})
              </strong>
            </div>
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Day 2 Attendance</span>
              <strong className="text-xl font-black text-emerald-500">
                {totalLearners > 0 ? Math.round((d2CheckIn / totalLearners) * 100) : 0}% ({d2CheckIn})
              </strong>
            </div>
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bench Split</span>
              <strong className="text-xl font-black text-blue-500">{rulingCount} R / {oppCount} O</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Legislative Enactments & Passed Acts */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 2. Enacted Acts of Parliament & Division Outcomes
          </h4>

          <div className="space-y-2">
            {proceedings.map(bill => (
              <div
                key={bill.id}
                className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                      {bill.bill_number}
                    </span>
                    <strong className="text-xs" style={{ color: 'var(--text-primary)' }}>{bill.title}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Introduced by: {bill.introduced_by}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    bill.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    ● {bill.status} (Ayes: {bill.ayes}, Noes: {bill.noes})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Council of Ministers & Key Office Bearers */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Landmark className="w-4 h-4" /> 3. Formed Parliament Leadership
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {learners.filter(l => l.role && (l.role.includes('Chief') || l.role.includes('Speaker') || l.role.includes('Leader') || l.role.includes('Minister'))).map(m => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border space-y-1"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
              >
                <span className="text-[10px] uppercase font-bold text-amber-500 block">{m.role}</span>
                <strong className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{m.full_name}</strong>
                <p className="text-xs text-slate-400">{m.party_name} • #{m.constituency_number || 'MLA'} {m.constituency_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Secretariat Signoff */}
        <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-end gap-6 text-xs" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}>
          <div>
            <p className="font-bold">Prepared by: Youth Assembly Secretariat</p>
            <p className="text-[11px] text-slate-400">Signed on: {new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <div className="text-right">
            <p className="font-black" style={{ color: 'var(--text-primary)' }}>Speaker of the Legislative Assembly</p>
            <p className="text-[10px] text-slate-400">Authenticated with Official Parliamentary Seal</p>
          </div>
        </div>

      </div>

    </div>
  );
};
