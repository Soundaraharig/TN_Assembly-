import React, { useState } from 'react';
import type { Learner, CollegeEvent, AgendaItem, Party, Committee, Nomination, NominationPosition } from '../../types';
import { Landmark, MapPin, BookOpen, Clock, Hand, CheckCircle2, Sparkles, Radio, FileSpreadsheet, Send } from 'lucide-react';

interface StudentDashboardProps {
  student: Learner;
  event: CollegeEvent | null;
  agenda: AgendaItem[];
  party: Party | null;
  committee: Committee | null;
  openNominationPositions?: string[];
  onFileNomination?: (nom: Partial<Nomination>) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  event,
  agenda,
  committee,
  openNominationPositions = [],
  onFileNomination,
  onShowToast
}) => {
  const [floorRequested, setFloorRequested] = useState(false);

  // Nomination form state
  const [selectedNomPosition, setSelectedNomPosition] = useState<string>(
    openNominationPositions.length > 0 ? openNominationPositions[0] : 'Speaker'
  );
  const [nomManifesto, setNomManifesto] = useState('');
  const [nomSubmitted, setNomSubmitted] = useState(false);

  const isRuling = student.bench === 'Ruling';
  const currentAgendaItem = agenda.find(a => a.is_current) || agenda[0];

  const handleRequestFloor = () => {
    setFloorRequested(true);
    onShowToast(
      'Point of Order Submitted',
      `Floor request sent to Assembly Speaker for ${student.full_name} (${student.constituency_name || 'MLA'})`,
      'success'
    );
    setTimeout(() => setFloorRequested(false), 5000);
  };

  const handleStudentNominationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onFileNomination) return;

    onFileNomination({
      event_id: student.event_id || '',
      position: selectedNomPosition as NominationPosition,
      candidate_learner_id: student.id,
      candidate_name: student.full_name,
      party_name: student.party_name || 'Independent',
      bench: student.bench || 'Ruling',
      manifesto: nomManifesto.trim() || 'Committed to upholding parliamentary rules, student welfare, and progressive policy debate.',
      status: 'Approved'
    });

    setNomSubmitted(true);
    setNomManifesto('');
    onShowToast(
      'Nomination Submitted',
      `Your nomination for ${selectedNomPosition} has been filed successfully!`,
      'success'
    );
    setTimeout(() => setNomSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Delegate Assembly Pass Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Pass Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Official Delegate Pass
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {event ? event.college_name : 'Tamil Nadu Youth Legislative Assembly'}
              </h2>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Access Code</span>
            <code className="text-lg font-mono font-bold text-emerald-400 tracking-widest">{student.access_code}</code>
          </div>
        </div>

        {/* Delegate Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Avatar & Name */}
          <div className="space-y-3 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-amber-950/40 mx-auto md:mx-0">
              {student.full_name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-extrabold text-white leading-snug">{student.full_name}</h3>
              <p className="text-xs text-slate-400">{student.department} • <span className="text-amber-400">{student.academic_year}</span></p>
              <p className="text-xs text-slate-500 mt-1">{student.email}</p>
            </div>
          </div>

          {/* Assembly Bench & Constituency */}
          <div className="space-y-4 md:col-span-2">
            
            {/* Role & Portfolio Highlight */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Legislative Role</span>
              <p className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{student.role || 'Member of Legislative Assembly (MLA)'}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Bench & Party */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bench Position</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    isRuling
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {student.bench || 'DELEGATE'}
                  </span>
                  <span className="text-xs font-bold text-white truncate">{student.party_name || 'Unassigned'}</span>
                </div>
              </div>

              {/* TN Constituency */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> TN Assembly Constituency
                </span>
                <p className="text-xs font-bold text-white font-mono">
                  {student.constituency_name || 'Unassigned'}
                </p>
              </div>

            </div>

            {/* Committee Room */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-blue-400" /> Legislative Committee Room
              </span>
              <p className="text-xs font-bold text-slate-200">
                {student.committee_name || 'Unassigned Committee'}
              </p>
              {committee?.topic && (
                <p className="text-[11px] text-slate-400 italic mt-0.5">Topic: "{committee.topic}"</p>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Self-Nomination Filing Section (When Nominations are Open) */}
      {openNominationPositions.length > 0 && onFileNomination && (
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  Parliamentary Candidacy Nominations
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                    OPEN NOW
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  File your candidacy nomination for parliamentary leadership positions directly
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleStudentNominationSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Open Position *
                </label>
                <select
                  value={selectedNomPosition}
                  onChange={(e) => setSelectedNomPosition(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {openNominationPositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Name & Bench
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${student.full_name} (${student.party_name || 'Independent'} • ${student.bench || 'Delegate'})`}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Manifesto / Candidacy Statement *
              </label>
              <textarea
                rows={3}
                value={nomManifesto}
                onChange={(e) => setNomManifesto(e.target.value)}
                placeholder="Share your goals, vision for the assembly, and proposed reforms..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={nomSubmitted}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                  nomSubmitted
                    ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/50'
                }`}
              >
                {nomSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Nomination Filed!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Nomination
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Assembly Floor Request */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Hand className="w-5 h-5 text-amber-400" /> Request Assembly Floor Time
          </h4>
          <p className="text-xs text-slate-400">
            Submit a Point of Order or speech request to the Assembly Speaker during live debates
          </p>
        </div>

        <button
          onClick={handleRequestFloor}
          disabled={floorRequested}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
            floorRequested
              ? 'bg-emerald-600 text-white shadow-emerald-950/50'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-950/50'
          }`}
        >
          {floorRequested ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Request Sent to Speaker!
            </>
          ) : (
            <>
              <Hand className="w-4 h-4" /> Raise Point of Order
            </>
          )}
        </button>
      </div>

      {/* Live Session Agenda Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> Legislative Agenda & Timeline
          </h4>
          {currentAgendaItem?.is_current && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
              <Radio className="w-3 h-3" /> Live Now
            </span>
          )}
        </div>

        <div className="space-y-3">
          {agenda.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.is_current
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">{item.day} • {item.time}</span>
                  <h5 className="text-sm font-bold text-white mt-0.5">{item.title}</h5>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>
                {item.is_current && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Current
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

