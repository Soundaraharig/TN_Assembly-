import React, { useState } from 'react';
import { Landmark, LogIn, KeyRound, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import type { UserSession, Learner } from '../../types';

interface UnifiedLoginPageProps {
  onLoginCredentials: (email: string, pass: string) => UserSession | null;
  onLoginAccessCode: (code: string) => Learner | null;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginCredentials,
  onLoginAccessCode,
  onShowToast
}) => {
  // Organizer state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coordError, setCoordError] = useState('');

  // Access Code state
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const session = onLoginCredentials(email, password);
    if (!session) {
      setCoordError('Invalid credentials. For Super Admin use admin@tnassembly.in / admin123 or Coordinator hari@hari.com / hari1234');
    } else {
      setCoordError('');
      onShowToast('Signed In', `Welcome back ${session.name || session.email}`, 'success');
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    const learner = onLoginAccessCode(accessCode);
    if (!learner) {
      setCodeError('Invalid Access Code. Please enter a valid 6-character delegate code (e.g. 89F2A1)');
    } else {
      setCodeError('');
      onShowToast('Delegate Access Verified', `Logged in as ${learner.full_name}`, 'success');
    }
  };

  const fillQuickSuperAdmin = () => {
    setEmail('admin@tnassembly.in');
    setPassword('admin123');
    setCoordError('');
  };

  const fillQuickCoordinator = () => {
    setEmail('hari@hari.com');
    setPassword('hari1234');
    setCoordError('');
  };

  const fillQuickStudentCode = () => {
    setAccessCode('89F2A1');
    setCodeError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4">
      
      {/* Brand Header */}
      <div className="max-w-md mx-auto w-full text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 text-emerald-700 shadow-sm mb-1">
          <Landmark className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Tamil Nadu Youth Legislative Assembly
        </h1>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          State Event Governance & Delegation Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        
        {/* Organizer Login Form */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Organizer Sign In</h2>
              <p className="text-xs text-slate-500">Super Admin & College Coordinator Login</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
              Admin Portal
            </span>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@tnassembly.in or hari@hari.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCoordError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCoordError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner font-medium"
              />
            </div>

            {coordError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl leading-snug">
                {coordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Organizer</span>
            </button>
          </form>

          {/* Demo Quick Fill Buttons */}
          <div className="flex items-center justify-center gap-2 pt-3">
            <button
              type="button"
              onClick={fillQuickSuperAdmin}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3 h-3" /> Fill Super Admin
            </button>
            <button
              type="button"
              onClick={fillQuickCoordinator}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              <UserCheck className="w-3 h-3" /> Fill Coordinator
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-3 text-slate-400">Or Join with Access Code</span>
          </div>
        </div>

        {/* Access Code Form */}
        <div className="bg-gradient-to-b from-amber-50/50 to-emerald-50/30 p-4 border border-amber-200/80 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Student & Delegate Access</h3>
              <p className="text-[10px] text-slate-500">Enter 6-character access code provided on your badge</p>
            </div>
          </div>

          <form onSubmit={handleAccessCodeSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 89F2A1"
                maxLength={8}
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-center text-sm font-mono font-black text-emerald-950 uppercase tracking-widest focus:outline-none focus:border-emerald-600 shadow-inner"
              />
            </div>

            {codeError && (
              <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                {codeError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Join Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={fillQuickStudentCode}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-[11px]"
                title="Fill sample code"
              >
                Sample
              </button>
            </div>
          </form>
        </div>

      </div>

      <p className="text-center text-[11px] text-slate-400 font-medium mt-6">
        Tamil Nadu Youth Legislative Assembly System • State Level Assembly Portal
      </p>

    </div>
  );
};
