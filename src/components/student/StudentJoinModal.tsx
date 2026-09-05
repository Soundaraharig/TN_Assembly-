import React, { useState } from 'react';
import { Landmark, KeyRound, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import type { Learner } from '../../types';
import { storageService } from '../../services/storageService';

interface StudentJoinViewProps {
  onLoginSuccess: (student: Learner) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentJoinView: React.FC<StudentJoinViewProps> = ({ onLoginSuccess, onShowToast }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter your 6-character access code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const student = storageService.authenticateStudent(cleanCode);
      setIsSubmitting(false);

      if (student) {
        onShowToast('Welcome Delegate', `Logged in as ${student.full_name}`, 'success');
        onLoginSuccess(student);
      } else {
        setError('Invalid access code. Please check your delegate pass or code.');
        onShowToast('Authentication Failed', 'Access code not found.', 'error');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Landmark className="w-9 h-9 text-slate-950" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">
              TAMIL NADU YOUTH LEGISLATIVE ASSEMBLY
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Participant Portal Login
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your 6-character participant Access Code to access the Legislative House
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Participant Access Code
            </label>
            <input
              type="text"
              maxLength={10}
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. 89F2A1"
              className="w-full text-center tracking-widest font-mono text-xl font-black py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 placeholder:text-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !accessCode.trim()}
            className="w-full py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verifying Code...' : 'Join Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-2 text-[11px] text-slate-500">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Delegate Authentication Portal</span>
          </div>
          <p className="flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" /> Need help? Ask your Floor Volunteer for your Access Code.
          </p>
        </div>

      </div>
    </div>
  );
};
