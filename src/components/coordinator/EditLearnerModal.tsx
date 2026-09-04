import React, { useState } from 'react';
import type { Learner, Party, Committee, AcademicYear, BenchType } from '../../types';
import { TN_CONSTITUENCIES } from '../../data/tnConstituencies';
import { X, Save, Edit3 } from 'lucide-react';

interface EditLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: Learner;
  parties: Party[];
  committees: Committee[];
  onSave: (updated: Learner) => void;
}

export const EditLearnerModal: React.FC<EditLearnerModalProps> = ({
  isOpen,
  onClose,
  learner,
  parties,
  committees,
  onSave
}) => {
  const [fullName, setFullName] = useState(learner.full_name);
  const [accessCode, setAccessCode] = useState(learner.access_code);
  const [email, setEmail] = useState(learner.email || '');
  const [phone, setPhone] = useState(learner.phone || '');
  const [department, setDepartment] = useState(learner.department || 'Computer Science');
  const [academicYear, setAcademicYear] = useState<AcademicYear>(learner.academic_year || '1st Year');
  
  const [partyName, setPartyName] = useState(learner.party_name || '');
  const [bench, setBench] = useState<BenchType>(learner.bench || 'Ruling');
  const [role, setRole] = useState(learner.role || 'Member of Legislative Assembly (MLA)');
  const [committeeName, setCommitteeName] = useState(learner.committee_name || '');
  const [selectedConstNo, setSelectedConstNo] = useState<number>(learner.constituency_number || 109);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const matchedConst = TN_CONSTITUENCIES.find(c => c.number === Number(selectedConstNo)) || TN_CONSTITUENCIES[0];
    const selectedParty = parties.find(p => p.name === partyName);
    const selectedComm = committees.find(c => c.name === committeeName);

    const updated: Learner = {
      ...learner,
      full_name: fullName.trim(),
      access_code: accessCode.trim().toUpperCase(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      academic_year: academicYear,
      party_name: partyName || undefined,
      party_id: selectedParty?.id || learner.party_id,
      bench: selectedParty ? selectedParty.bench : bench,
      role: role.trim(),
      committee_name: committeeName || undefined,
      committee_id: selectedComm?.id || learner.committee_id,
      constituency_number: matchedConst.number,
      constituency_name: `${matchedConst.number} - ${matchedConst.name} (${matchedConst.district})`,
      district: matchedConst.district
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <Edit3 className="w-5 h-5" />
            <h3 className="text-base font-extrabold text-slate-900">Edit Participant Details</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Access Code *</label>
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 uppercase focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Political Party</label>
              <select
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {parties.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bench</label>
              <select
                value={bench}
                onChange={(e) => setBench(e.target.value as BenchType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Ruling">Ruling</option>
                <option value="Opposition">Opposition</option>
                <option value="Independent">Independent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role / Position</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Committee</label>
              <select
                value={committeeName}
                onChange={(e) => setCommitteeName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {committees.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">TN Assembly Constituency</label>
            <select
              value={selectedConstNo}
              onChange={(e) => setSelectedConstNo(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              {TN_CONSTITUENCIES.map(c => (
                <option key={c.number} value={c.number}>
                  {c.number} - {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
