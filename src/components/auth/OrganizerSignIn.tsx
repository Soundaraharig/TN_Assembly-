import React, { useState } from 'react';
import { LogIn, Landmark } from 'lucide-react';

interface OrganizerSignInProps {
  onSignIn: (email: string, pass: string) => boolean;
}

export const OrganizerSignIn: React.FC<OrganizerSignInProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const success = onSignIn(email.trim(), password.trim());
    if (!success) {
      setError('Invalid credentials. Please check your login ID and password.');
    } else {
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 bg-slate-50">
      
      {/* Brand Header */}
      <div className="text-center space-y-1 mb-8">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 text-emerald-700 mb-3">
          <Landmark className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black tracking-wide text-slate-800">
          TN Assembly
        </h1>
        <p className="text-xs text-slate-500 font-medium">Tamil Nadu Youth Legislative Assembly — Organizer Portal</p>
      </div>

      {/* Sign In Card */}
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-7 shadow-xl space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sign in</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Login ID / Email</label>
            <input
              type="text"
              required
              placeholder="Enter your login ID or email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl leading-snug">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in</span>
          </button>
        </form>
      </div>

    </div>
  );
};
