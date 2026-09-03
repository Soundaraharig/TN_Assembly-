import React, { useState } from 'react';
import { Landmark, LogIn, KeyRound, ArrowRight, ShieldCheck, UserCheck, Sun, Moon } from 'lucide-react';
import type { UserSession, Learner } from '../../types';
import type { Theme } from '../../lib/theme';

interface UnifiedLoginPageProps {
  onLoginCredentials: (email: string, pass: string) => UserSession | null;
  onLoginAccessCode: (code: string) => Learner | null;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginCredentials,
  onLoginAccessCode,
  onShowToast,
  theme,
  onToggleTheme
}) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [coordError, setCoordError] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError]   = useState('');
  const [isOrganizerLoading, setIsOrganizerLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading]           = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsOrganizerLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief animation
    const session = onLoginCredentials(email, password);
    setIsOrganizerLoading(false);
    if (!session) {
      setCoordError('Invalid credentials. Please try again.');
    } else {
      setCoordError('');
      onShowToast('Signed In', `Welcome back, ${session.name || session.email}`, 'success');
    }
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setIsCodeLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const learner = onLoginAccessCode(accessCode);
    setIsCodeLoading(false);
    if (!learner) {
      setCodeError('Invalid access code. Please check your delegate badge and try again.');
    } else {
      setCodeError('');
      onShowToast('Delegate Access Verified', `Welcome, ${learner.full_name}`, 'success');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, var(--amber) 0%, transparent 70%)', animationDelay: '1.5s' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Theme Toggle — top right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onToggleTheme}
          className="theme-toggle"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-10 px-4">

        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8 animate-slide-up">
          <div
            className="inline-flex items-center justify-center p-4 rounded-2xl border mb-2 animate-float"
            style={{
              background: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)'
            }}
          >
            <Landmark className="w-10 h-10" />
          </div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            TN <span style={{ color: 'var(--accent)' }}>Assembly</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            State Event Governance &amp; Delegation Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-md rounded-3xl p-7 space-y-6 animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* ── Organizer Login ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Organizer Sign In
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Super Admin &amp; College Coordinator Login
                </p>
              </div>
              <span
                className="px-2.5 py-1 rounded-lg font-bold text-[10px] border"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                Admin Portal
              </span>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin@tnassembly.in"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setCoordError(''); }}
                  className="input-theme"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setCoordError(''); }}
                  className="input-theme"
                />
              </div>

              {coordError && (
                <p className="text-xs p-2.5 rounded-xl border animate-fade-in" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {coordError}
                </p>
              )}

              <button
                type="submit"
                disabled={isOrganizerLoading}
                className="btn-primary w-full justify-center py-3"
                style={{ opacity: isOrganizerLoading ? 0.7 : 1 }}
              >
                {isOrganizerLoading
                  ? <span className="animate-spin-once inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  : <LogIn className="w-4 h-4" />
                }
                <span>{isOrganizerLoading ? 'Signing in...' : 'Sign In as Organizer'}</span>
              </button>
            </form>

            {/* Quick Fill */}
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => { setEmail('admin@tnassembly.in'); setPassword('admin123'); setCoordError(''); }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors"
                style={{ background: 'var(--amber-soft)', color: 'var(--amber)', borderColor: 'var(--amber)' }}
              >
                <ShieldCheck className="w-3 h-3" /> Super Admin
              </button>
              <button
                type="button"
                onClick={() => { setEmail('hari@hari.com'); setPassword('hari1234'); setCoordError(''); }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                <UserCheck className="w-3 h-3" /> Coordinator
              </button>
            </div>
          </div>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="px-3" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                Or Join with Access Code
              </span>
            </div>
          </div>

          {/* ── Small Join Access Code Button ───────────────────── */}
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => { setAccessCode(''); setCodeError(''); }}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer hover:scale-102 transition-transform"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Join with Access Code</span>
            </button>
          </div>

          {/* ── Student / Delegate Access ─────────────────────────── */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl"
                style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}
              >
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  Student &amp; Delegate Access
                </h3>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Enter the 6–8 character code on your delegate badge
                </p>
              </div>
            </div>

            <form onSubmit={handleAccessCodeSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. 89F2A1"
                maxLength={8}
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value.toUpperCase()); setCodeError(''); }}
                className="input-theme text-center font-mono font-black text-lg tracking-widest uppercase"
                style={{ letterSpacing: '0.25em' }}
              />

              {codeError && (
                <p className="text-[11px] p-2 rounded-lg border animate-fade-in" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {codeError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCodeLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  style={{
                    background: 'var(--amber)',
                    color: '#fff',
                    opacity: isCodeLoading ? 0.7 : 1,
                    boxShadow: '0 4px 12px var(--amber-soft)'
                  }}
                >
                  {isCodeLoading
                    ? <span className="animate-spin-once inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    : <><span>Join Session</span><ArrowRight className="w-3.5 h-3.5" /></>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] mt-6 animate-fade-in" style={{ color: 'var(--text-muted)' }}>
          Tamil Nadu Youth Legislative Assembly System • State Level Assembly Portal
        </p>
      </div>
    </div>
  );
};
