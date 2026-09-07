import React, { useState } from 'react';
import type { UserRole, CollegeEvent, Coordinator, Learner, UserSession } from '../../types';
import { LogOut, Landmark, Sun, Moon, Menu, X, Copy, Check } from 'lucide-react';
import type { Theme } from '../../lib/theme';

interface HeaderProps {
  role: UserRole;
  events: CollegeEvent[];
  currentEvent: CollegeEvent | null;
  currentCoordinator: Coordinator | null;
  currentStudent: Learner | null;
  userSession?: UserSession | null;
  onRoleChange: (newRole: UserRole) => void;
  onEventChange: (event: CollegeEvent) => void;
  onLogout: () => void;
  onGoHome: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  currentEvent,
  currentCoordinator,
  currentStudent,
  userSession,
  onLogout,
  onGoHome,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const isDark = theme === 'dark';
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyEventId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentEvent?.id) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentEvent.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Determine user display name dynamically
  const displayName =
    role === 'student' && currentStudent
      ? `${currentStudent.full_name} (${currentStudent.party_name || 'MLA'})`
      : userSession?.name
      ? userSession.name
      : currentCoordinator?.name
      ? currentCoordinator.name
      : role === 'super_admin'
      ? currentEvent ? `Super Admin • ${currentEvent.college_name}` : 'Super Admin'
      : '';

  return (
    <header className="header-theme sticky top-0 z-40 px-3 sm:px-4 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-full mx-auto flex items-center justify-between gap-3">

        {/* Left Side: Mobile Menu Button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(role === 'coordinator' || role === 'super_admin') && onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl border text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand — click to go home */}
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 group focus:outline-none cursor-pointer text-left"
            title="Go to Events Home"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors shrink-0"
              style={{
                background: 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)'
              }}
            >
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none group-hover:text-emerald-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                TN Assembly
              </h1>
              <span className="text-[10px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                {role === 'super_admin' ? (currentEvent ? 'Super Admin • Event Active' : 'Super Admin') : role === 'coordinator' ? 'Coordinator Portal' : 'Delegate Portal'}
              </span>
            </div>
          </button>
        </div>

        {/* Active Event ID Badge (Visible to Super Admin & Coordinator) */}
        {currentEvent && (
          <div
            onClick={handleCopyEventId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono select-all transition-all hover:border-amber-500/50 cursor-pointer shadow-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            title={`Active Event ID: ${currentEvent.id} (Click to copy)`}
          >
            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-sans">
              EVENT ID
            </span>
            <span className="text-amber-400 font-bold font-mono text-[11px]">
              {currentEvent.id}
            </span>
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-200 shrink-0" />
            )}
            {currentEvent.college_name && (
              <span className="text-slate-400 font-sans hidden xl:inline max-w-[180px] truncate text-[11px]">
                • {currentEvent.college_name}
              </span>
            )}
          </div>
        )}

        {/* Right side: theme toggle + user info + sign out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Hub button for Super Admin inside an event */}
          {role === 'super_admin' && currentEvent && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)'
              }}
              title="Return to All Events Dashboard"
            >
              <span>←</span>
              <span className="hidden sm:inline">All Events Hub</span>
              <span className="sm:hidden">Events</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {displayName && (
            <span
              className="text-xs font-bold hidden md:inline px-2.5 py-1 rounded-lg border truncate max-w-[220px]"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {displayName}
            </span>
          )}

          <button
            onClick={onLogout}
            className="btn-ghost px-2.5 sm:px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

      </div>
    </header>
  );
};
