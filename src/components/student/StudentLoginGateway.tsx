import React, { useState } from 'react';
import { KeyRound, Landmark, ArrowRight, Sparkles } from 'lucide-react';

interface StudentLoginGatewayProps {
  onLoginWithCode: (code: string) => boolean;
  sampleCodes: { name: string; code: string; role?: string }[];
}

export const StudentLoginGateway: React.FC<StudentLoginGatewayProps> = ({ onLoginWithCode, sampleCodes }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    const success = onLoginWithCode(accessCode.trim());
    if (!success) {
      setError('Invalid Access Code. Please verify your 6-character code.');
    } else {
      setError('');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 text-center animate-slide-up transition-colors">
      
      {/* Emblem & Branding */}
      <div className="space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-950/50">
          <Landmark className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Delegate Login</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tamil Nadu Youth Legislative Assembly Portal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Enter 6-Character Access Code *
          </label>
          <div className="relative">
            <KeyRound className="w-5 h-5 text-indigo-500 dark:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 89F2A1"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-lg font-mono font-bold text-indigo-600 dark:text-indigo-300 tracking-widest uppercase focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          {error && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Access My Assembly Pass</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Test Access Codes */}
      {sampleCodes.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-left space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Click Sample Code to Test:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCodes.slice(0, 4).map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setAccessCode(item.code);
                  onLoginWithCode(item.code);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-xl text-left transition-colors cursor-pointer"
              >
                <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{item.code}</code>
                <span className="text-[11px] text-slate-800 dark:text-slate-300 font-semibold truncate block">{item.name}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-300 block">{item.role || 'MLA'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
