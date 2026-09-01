import React from 'react';
import type { UserRole, CollegeEvent, Coordinator, Learner } from '../../types';
import { LogOut, Landmark, Sun, Moon } from 'lucide-react';
import type { Theme } from '../../lib/theme';

interface HeaderProps {
  role: UserRole;
  events: CollegeEvent[];
  currentEvent: CollegeEvent | null;
  currentCoordinator: Coordinator | null;
  currentStudent: Learner | null;
  onRoleChange: (newRole: UserRole) => void;
  onEventChange: (event: CollegeEvent) => void;
  onLogout: () => void;
  onGoHome: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  currentCoordinator,
  currentStudent,
  onLogout,
  onGoHome,
  theme,
  onToggleTheme
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="header-theme sticky top-0 z-40 px-4 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-full mx-auto flex items-center justify-between gap-3">

        {/* Brand — click to go home */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
          title="Go to Events Home"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors"
            style={{
              background: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)'
            }}
          >
            <Landmark className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black tracking-tight leading-none group-hover:text-emerald-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
              TN Assembly
            </h1>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              {role === 'super_admin' ? 'Super Admin' : role === 'coordinator' ? 'Coordinator Portal' : 'Delegate Portal'}
            </span>
          </div>
        </button>

        {/* Right side: theme toggle + user info + sign out */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className="text-xs font-semibold hidden md:inline" style={{ color: 'var(--text-secondary)' }}>
            {role === 'student' && currentStudent
              ? currentStudent.full_name
              : currentCoordinator
              ? currentCoordinator.name
              : role === 'super_admin'
              ? 'Super Admin'
              : ''}
          </span>

          <button
            onClick={onLogout}
            className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>

      </div>
    </header>
  );
};
