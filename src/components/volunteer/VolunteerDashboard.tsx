import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  LogOut,
  Users,
  MapPin,
  UserPlus,
  CheckSquare,
  Sun,
  Moon
} from 'lucide-react';
import type { Volunteer, Learner, CollegeEvent, ChecklistItem } from '../../types';
import { useTheme } from '../../lib/theme';

interface VolunteerDashboardProps {
  volunteer?: Volunteer | null;
  event?: CollegeEvent | null;
  learners: Learner[];
  checklist?: ChecklistItem[];
  onToggleCheckIn: (id: string, day: 1 | 2) => void;
  onCheckInAll?: (day: 1 | 2, state: boolean) => void;
  onAddWalkIn?: (learner: Partial<Learner>) => void;
  onToggleVolunteerArrival?: (volunteerId: string) => void;
  onLogout: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  volunteer,
  event,
  learners,
  checklist = [],
  onToggleCheckIn,
  onCheckInAll,
  onAddWalkIn,
  onToggleVolunteerArrival,
  onLogout,
  onShowToast
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [isOnDuty, setIsOnDuty] = useState(volunteer?.has_arrived ?? true);
  const [activeTab, setActiveTab] = useState<'checkin' | 'walkin' | 'checklist'>('checkin');

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDept, setWalkInDept] = useState('');
  const [walkInYear, setWalkInYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');

  const handleToggleDuty = () => {
    const nextState = !isOnDuty;
    setIsOnDuty(nextState);
    if (volunteer && onToggleVolunteerArrival) {
      onToggleVolunteerArrival(volunteer.id);
    }
    onShowToast(
      nextState ? 'Checked On Duty' : 'Checked Off Duty',
      nextState ? 'Marked active on assembly floor duty.' : 'Shift concluded.',
      'info'
    );
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;

    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newLearner: Partial<Learner> = {
      event_id: event?.id || volunteer?.event_id || '',
      full_name: walkInName.trim(),
      email: walkInEmail.trim(),
      phone: walkInPhone.trim(),
      department: walkInDept.trim() || 'General',
      academic_year: walkInYear,
      access_code: accessCode,
      day1_checked_in: selectedDay === 1,
      day2_checked_in: selectedDay === 2
    };

    if (onAddWalkIn) {
      onAddWalkIn(newLearner);
    }

    onShowToast('Walk-in Registered', `Registered ${walkInName} (Code: ${accessCode})`, 'success');
    setWalkInName('');
    setWalkInEmail('');
    setWalkInPhone('');
    setWalkInDept('');
    setActiveTab('checkin');
  };

  const filteredLearners = learners.filter(l => {
    const matchesSearch =
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.access_code.toLowerCase().includes(search.toLowerCase()) ||
      (l.party_name && l.party_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.constituency_name && l.constituency_name.toLowerCase().includes(search.toLowerCase()));

    const isPresent = selectedDay === 1 ? l.day1_checked_in : l.day2_checked_in;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PRESENT' && isPresent) ||
      (statusFilter === 'ABSENT' && !isPresent);

    return matchesSearch && matchesStatus;
  });

  const day1Present = learners.filter(l => l.day1_checked_in).length;
  const day2Present = learners.filter(l => l.day2_checked_in).length;
  const currentPresent = selectedDay === 1 ? day1Present : day2Present;
  const attendanceRate = learners.length > 0 ? Math.round((currentPresent / learners.length) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top Header */}
      <header
        className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl border flex items-center justify-center"
            style={{
              background: 'rgba(5,150,105,0.12)',
              color: 'var(--emerald)',
              borderColor: 'var(--emerald)'
            }}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Volunteer Operations Desk
              </h1>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                {event?.college_name || 'Tamil Nadu Youth Assembly'}
              </span>
            </div>
            <p className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <span>Official: <strong style={{ color: 'var(--text-primary)' }}>{volunteer?.name || 'Floor Volunteer'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" /> {volunteer?.station || 'Main Assembly Floor'}
              </span>
              {volunteer?.is_yuva && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  YUVA
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Duty Status Toggle */}
          <button
            onClick={handleToggleDuty}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              isOnDuty ? 'shadow-sm' : 'opacity-70'
            }`}
            style={{
              backgroundColor: isOnDuty ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.12)',
              borderColor: isOnDuty ? 'var(--emerald)' : '#ef4444',
              color: isOnDuty ? 'var(--emerald)' : '#ef4444'
            }}
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-80"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Total Delegates
                </p>
                <p className="text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                  {learners.length}
                </p>
              </div>
              <Users className="w-8 h-8 opacity-40" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Day {selectedDay} Present
                </p>
                <p className="text-2xl font-black mt-1" style={{ color: 'var(--emerald)' }}>
                  {currentPresent} <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>({attendanceRate}%)</span>
                </p>
              </div>
              <UserCheck className="w-8 h-8 opacity-40 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Day {selectedDay} Absent
                </p>
                <p className="text-2xl font-black mt-1 text-rose-500">
                  {Math.max(0, learners.length - currentPresent)}
                </p>
              </div>
              <XCircle className="w-8 h-8 opacity-40 text-rose-500" />
            </div>
          </div>

          {/* Day Floor Switcher */}
          <div className="p-2.5 rounded-2xl border flex flex-col justify-center gap-1.5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
              Active Floor Day
            </p>
            <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setSelectedDay(1)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDay === 1 ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: selectedDay === 1 ? 'var(--emerald)' : 'transparent',
                  color: selectedDay === 1 ? '#fff' : 'var(--text-primary)'
                }}
              >
                Day 1 ({day1Present})
              </button>
              <button
                onClick={() => setSelectedDay(2)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDay === 2 ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: selectedDay === 2 ? 'var(--emerald)' : 'transparent',
                  color: selectedDay === 2 ? '#fff' : 'var(--text-primary)'
                }}
              >
                Day 2 ({day2Present})
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'checkin' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'checkin' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'checkin' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <UserCheck className="w-3.5 h-3.5" /> Check-in Terminal
            </button>
            <button
              onClick={() => setActiveTab('walkin')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'walkin' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'walkin' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'walkin' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register Walk-In
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'checklist' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'checklist' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'checklist' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Floor Checklist ({checklist.length})
            </button>
          </div>

          {activeTab === 'checkin' && onCheckInAll && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCheckInAll(selectedDay, true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition hover:opacity-80 flex items-center gap-1"
                style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--emerald)', borderColor: 'var(--emerald)' }}
              >
                <CheckCircle className="w-3 h-3" /> Check In All (Day {selectedDay})
              </button>
              <button
                onClick={() => onCheckInAll(selectedDay, false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition hover:opacity-80 flex items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: '#ef4444' }}
              >
                <XCircle className="w-3 h-3" /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Check-in Terminal */}
        {activeTab === 'checkin' && (
          <div className="rounded-2xl p-6 border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Scan badge or search name, code, party..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-theme pl-8 py-2 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                      statusFilter === f ? 'border-current' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      background: statusFilter === f ? 'var(--accent-soft)' : 'transparent',
                      color: statusFilter === f ? 'var(--accent)' : 'var(--text-muted)',
                      borderColor: statusFilter === f ? 'var(--accent)' : 'var(--border)'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b uppercase" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <tr>
                    <th className="py-2.5 px-3">Access Code</th>
                    <th className="py-2.5 px-3">Seat / Const #</th>
                    <th className="py-2.5 px-3">Delegate Name</th>
                    <th className="py-2.5 px-3">Party & Bench</th>
                    <th className="py-2.5 px-3">Constituency / Role</th>
                    <th className="py-2.5 px-3 text-center">Day {selectedDay} Floor Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredLearners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                        No delegates found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLearners.map(learner => {
                      const isPresent = selectedDay === 1 ? learner.day1_checked_in : learner.day2_checked_in;
                      return (
                        <tr key={learner.id} className="hover:opacity-90">
                          <td className="py-3 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                            {learner.access_code}
                            {learner.constituency_number !== undefined ? `#${learner.constituency_number}` : '—'}
                          </td>
                          <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                            {learner.full_name}
                          </td>
                          <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                            {learner.party_name || 'Independent'} ({learner.bench || 'Ruling'})
                          </td>
                          <td className="py-3 px-3" style={{ color: 'var(--text-muted)' }}>
                            {learner.constituency_name || learner.role || 'Floor Delegate'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onToggleCheckIn(learner.id, selectedDay)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer ${
                                isPresent ? 'shadow-sm' : 'hover:scale-102'
                              }`}
                              style={{
                                backgroundColor: isPresent ? 'var(--emerald)' : 'var(--bg-elevated)',
                                color: isPresent ? '#fff' : 'var(--text-muted)',
                                border: isPresent ? 'none' : '1px solid var(--border)'
                              }}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" /> PRESENT
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" /> ABSENT
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Walk-In Registration */}
        {activeTab === 'walkin' && (
          <div className="max-w-xl mx-auto rounded-2xl p-6 border space-y-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Floor Walk-in Registration
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Directly register a new delegate on the spot and generate their access badge.
                </p>
              </div>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Delegate Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Vignesh"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="input-theme text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="delegate@college.edu"
                    value={walkInEmail}
                    onChange={e => setWalkInEmail(e.target.value)}
                    className="input-theme text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={walkInPhone}
                    onChange={e => setWalkInPhone(e.target.value)}
                    className="input-theme text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Department / Major
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={walkInDept}
                    onChange={e => setWalkInDept(e.target.value)}
                    className="input-theme text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Academic Year
                  </label>
                  <select
                    value={walkInYear}
                    onChange={e => setWalkInYear(e.target.value as any)}
                    className="input-theme text-xs w-full"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md cursor-pointer hover:scale-102 transition-transform"
              >
                <UserPlus className="w-4 h-4" /> Register & Check In Immediately
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Floor Checklist */}
        {activeTab === 'checklist' && (
          <div className="rounded-2xl p-6 border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Operational Assembly Checklist
            </h2>
            <div className="space-y-2.5">
              {checklist.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No checklist items configured for this event.
                </div>
              ) : (
                checklist.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border flex items-center justify-between"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--accent)' }}
                      >
                        {item.category}
                      </span>
                      <p className={`text-xs font-medium ${item.is_completed ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>
                        {item.task}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: item.is_completed ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
                        color: item.is_completed ? 'var(--emerald)' : '#ef4444'
                      }}
                    >
                      {item.is_completed ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
