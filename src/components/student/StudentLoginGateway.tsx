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
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-6 text-center animate-slide-up">
      
      {/* Emblem & Branding */}
      <div className="space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-950/50">
          <Landmark className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Student Delegate Login</h2>
          <p className="text-xs text-slate-400 mt-1">Tamil Nadu Youth Legislative Assembly Portal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Enter 6-Character Access Code *
          </label>
          <div className="relative">
            <KeyRound className="w-5 h-5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-lg font-mono font-bold text-indigo-300 tracking-widest uppercase focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all"
        >
          <span>Access My Assembly Pass</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Test Access Codes */}
      {sampleCodes.length > 0 && (
        <div className="pt-4 border-t border-slate-800 text-left space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Click Sample Code to Test:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCodes.slice(0, 4).map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setAccessCode(item.code);
                  onLoginWithCode(item.code);
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-left transition-colors"
              >
                <code className="text-xs font-mono font-bold text-emerald-400 block">{item.code}</code>
                <span className="text-[11px] text-slate-300 font-semibold truncate block">{item.name}</span>
                <span className="text-[10px] text-amber-300 block">{item.role || 'MLA'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
