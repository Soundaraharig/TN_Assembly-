import React from 'react';
import type { UserRole, CollegeEvent, Coordinator, Learner } from '../../types';
import { LogOut, Landmark } from 'lucide-react';

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
}

export const Header: React.FC<HeaderProps> = ({
  role,
  currentCoordinator,
  currentStudent,
  onLogout,
  onGoHome
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-2.5 shadow-sm">
      <div className="max-w-full mx-auto flex items-center justify-between gap-3">

        {/* Brand — click to go home */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 group focus:outline-none"
          title="Go to Events Home"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
              TN Assembly
            </h1>
            <span className="text-[10px] font-semibold text-slate-400">
              {role === 'super_admin' ? 'Super Admin' : role === 'coordinator' ? 'Coordinator Portal' : 'Delegate Portal'}
            </span>
          </div>
        </button>

        {/* Right side: user info + sign out */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-semibold hidden md:inline">
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
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
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
