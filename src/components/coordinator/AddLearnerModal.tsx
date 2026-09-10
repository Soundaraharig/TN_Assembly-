import React, { useState, useMemo } from 'react';
import type { AcademicYear, Learner, Party, Committee, BenchType } from '../../types';
import { generateAccessCode } from '../../utils/accessCodeGenerator';
import { storageService } from '../../services/storageService';
import { TN_CONSTITUENCIES } from '../../data/tnConstituencies';
import { X, UserPlus, Sparkles, Lock, Landmark, Users, MapPin, Wand2 } from 'lucide-react';

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  existingCodes: Set<string>;
  parties?: Party[];
  committees?: Committee[];
  existingLearners?: Learner[];
  onAddLearner: (learner: Partial<Learner>) => void | Promise<any>;
}

export const AddLearnerModal: React.FC<AddLearnerModalProps> = ({
  isOpen,
  onClose,
  eventId,
  existingCodes,
  parties = [],
  committees = [],
  existingLearners = [],
  onAddLearner
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState<AcademicYear>('1st Year');

  // Combined Allocation Fields
  const [partyId, setPartyId] = useState('');
  const [bench, setBench] = useState<string>('');
  const [committeeId, setCommitteeId] = useState('');
  const [constituencyNumber, setConstituencyNumber] = useState<number | ''>('');
  const [constituencySearch, setConstituencySearch] = useState('');

  if (!isOpen) return null;

  const isFrozen = storageService.getRegistrationsFrozen(eventId);
  const isAllocationLocked = storageService.getAllocationLock(eventId);

  const eventParties = useMemo(() => {
    return eventId ? parties.filter(p => !p.event_id || p.event_id === eventId) : parties;
  }, [parties, eventId]);

  const eventCommittees = useMemo(() => {
    return eventId ? committees.filter(c => !c.event_id || c.event_id === eventId) : committees;
  }, [committees, eventId]);

  // Set of constituency numbers already assigned to members in this event
  const allocatedConstNumbers = useMemo(() => {
    const list = eventId ? existingLearners.filter(l => l.event_id === eventId) : existingLearners;
    return new Set(list.map(l => l.constituency_number).filter((n): n is number => Boolean(n)));
  }, [existingLearners, eventId]);

  const handlePartyChange = (pId: string) => {
    setPartyId(pId);
    const p = eventParties.find(x => x.id === pId);
    if (p && p.bench) {
      setBench(p.bench);
    } else {
      setBench('');
    }
  };

  const handleAutoAssignConstituency = () => {
    const nextFree = TN_CONSTITUENCIES.find(c => !allocatedConstNumbers.has(c.number));
    if (nextFree) {
      setConstituencyNumber(nextFree.number);
    }
  };

  const filteredConstituencies = useMemo(() => {
    if (!constituencySearch.trim()) return TN_CONSTITUENCIES.slice(0, 50);
    const q = constituencySearch.trim().toLowerCase();
    return TN_CONSTITUENCIES.filter(c =>
      String(c.number).includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q)
    );
  }, [constituencySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFrozen) return;
    if (!fullName.trim()) return;

    const accessCode = generateAccessCode(existingCodes);
    const selectedParty = eventParties.find(p => p.id === partyId);
    const selectedComm = eventCommittees.find(c => c.id === committeeId);
    const matchedConst = constituencyNumber ? TN_CONSTITUENCIES.find(c => c.number === Number(constituencyNumber)) : undefined;

    await onAddLearner({
      event_id: eventId,
      access_code: accessCode,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      academic_year: academicYear,
      party_id: selectedParty ? selectedParty.id : undefined,
      party_name: selectedParty ? selectedParty.name : undefined,
      bench: (bench as BenchType) || (selectedParty ? selectedParty.bench : undefined),
      committee_id: selectedComm ? selectedComm.id : undefined,
      committee_name: selectedComm ? selectedComm.name : undefined,
      constituency_number: matchedConst ? matchedConst.number : undefined,
      constituency_name: matchedConst ? `${matchedConst.number} - ${matchedConst.name} (${matchedConst.district})` : undefined,
      district: matchedConst ? matchedConst.district : undefined
    });

    onClose();
  };

  const selectedParty = eventParties.find(p => p.id === partyId);
  const selectedComm = eventCommittees.find(c => c.id === committeeId);
  const matchedConst = constituencyNumber ? TN_CONSTITUENCIES.find(c => c.number === Number(constituencyNumber)) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-slide-up my-6 max-h-[92vh] overflow-y-auto">
        
        {isFrozen && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Registrations are currently frozen by Assembly Coordinator.</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <UserPlus className="w-5 h-5" />
            <div>
              <h3 className="text-base font-extrabold text-white">Add Walk-in Student Delegate</h3>
              <p className="text-[11px] text-slate-400 font-normal">Register and allocate Party, Committee & Constituency in one step</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECTION 1: Personal & College Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              1. Personal & Academic Details
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science / Mechanical"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Combined Assembly Allocation */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> 2. Combined Assembly Allocation (Assign All)
              </h4>
              {isAllocationLocked && (
                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Allocations Locked
                </span>
              )}
            </div>

            {/* Party & Auto-Derived Bench */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Political Party
                </label>
                <select
                  value={partyId}
                  disabled={isAllocationLocked}
                  onChange={(e) => handlePartyChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Unassigned Party --</option>
                  {eventParties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.bench || 'Independent'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Bench Allocation</span>
                  <span className="text-[10px] text-slate-400 font-normal">Auto-derived</span>
                </label>
                <select
                  value={bench}
                  disabled={isAllocationLocked}
                  onChange={(e) => setBench(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Auto / Unassigned (—) --</option>
                  <option value="Ruling">Ruling Bench</option>
                  <option value="Opposition">Opposition Bench</option>
                  <option value="Independent">Independent / Cross-bench</option>
                </select>
              </div>
            </div>

            {/* Committee Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Departmental / Legislative Committee</span>
              </label>
              <select
                value={committeeId}
                disabled={isAllocationLocked}
                onChange={(e) => setCommitteeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Unassigned Committee --</option>
                {eventCommittees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Constituency Assignment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tamil Nadu Constituency (234 Assembly Seats)</span>
                </label>
                <button
                  type="button"
                  disabled={isAllocationLocked}
                  onClick={handleAutoAssignConstituency}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Auto-picks the lowest unallocated constituency number"
                >
                  <Wand2 className="w-3 h-3" /> Auto-Pick Free Seat
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Filter name / district..."
                  value={constituencySearch}
                  onChange={(e) => setConstituencySearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 sm:col-span-1"
                />
                <select
                  value={constituencyNumber}
                  disabled={isAllocationLocked}
                  onChange={(e) => setConstituencyNumber(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 sm:col-span-2 font-mono"
                >
                  <option value="">-- Select Constituency (Seat) --</option>
                  {filteredConstituencies.map(c => {
                    const isTaken = allocatedConstNumbers.has(c.number);
                    return (
                      <option key={c.number} value={c.number}>
                        #{c.number} {c.name} ({c.district}) {isTaken ? '• [Already Assigned]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick Allocation Preview Card */}
            {(selectedParty || bench || selectedComm || matchedConst) && (
              <div className="p-3 bg-slate-950/90 rounded-2xl border border-emerald-500/20 text-xs space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                  <span>Allocation Summary:</span>
                  <span className="font-mono text-slate-400">Ready to save</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Party & Bench</span>
                    <span className="font-semibold text-white">
                      {selectedParty ? selectedParty.name : '—'}
                    </span>
                    {bench && (
                      <span className={`inline-block ml-1 text-[9px] px-1 rounded font-bold ${
                        bench === 'Ruling' ? 'bg-blue-500/20 text-blue-400' :
                        bench === 'Opposition' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {bench}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Committee</span>
                    <span className="font-semibold text-white">
                      {selectedComm ? selectedComm.name : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Constituency</span>
                    <span className="font-semibold text-amber-300 font-mono">
                      {matchedConst ? `#${matchedConst.number} ${matchedConst.name}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>6-Character Access Code:</span>
            <span className="font-mono text-emerald-400 font-bold">Auto-Generated on Save</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFrozen}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" /> Save & Fully Allocate Delegate
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
