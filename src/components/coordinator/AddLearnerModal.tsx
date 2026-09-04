import React, { useState } from 'react';
import type { AcademicYear, Learner } from '../../types';
import { generateAccessCode } from '../../utils/accessCodeGenerator';
import { storageService } from '../../services/storageService';
import { X, UserPlus, Sparkles, Lock } from 'lucide-react';

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  existingCodes: Set<string>;
  onAddLearner: (learner: Partial<Learner>) => void;
}

export const AddLearnerModal: React.FC<AddLearnerModalProps> = ({
  isOpen,
  onClose,
  eventId,
  existingCodes,
  onAddLearner
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState<AcademicYear>('1st Year');

  if (!isOpen) return null;

  const isFrozen = storageService.getRegistrationsFrozen(eventId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFrozen) return;
    if (!fullName.trim()) return;

    const accessCode = generateAccessCode(existingCodes);

    onAddLearner({
      event_id: eventId,
      access_code: accessCode,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      academic_year: academicYear
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
        
        {isFrozen && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Registrations are currently frozen by Assembly Coordinator.</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <UserPlus className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Add Walk-in Student Delegate</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Mechanical"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>6-Character Access Code:</span>
            <span className="font-mono text-emerald-400 font-bold">Auto-Generated on Save</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFrozen}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Save Walk-in Participant
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
