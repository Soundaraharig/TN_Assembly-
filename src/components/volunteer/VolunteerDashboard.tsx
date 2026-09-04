import React, { useState, useMemo, useEffect } from 'react';
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
  Moon,
  Lock,
  Vote,
  Shield,
  Crown,
  X,
  Check,
  Flame,
  AlertCircle
} from 'lucide-react';
import type { Volunteer, Learner, CollegeEvent, ChecklistItem, Party, Committee, Election, LiveFlashVote } from '../../types';
import { useTheme } from '../../lib/theme';
import { storageService, getResolvedPartyName, getResolvedCommitteeName } from '../../services/storageService';

export interface YuvaAssignment {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerPhone: string;
  targetType: 'party' | 'committee';
  targetId: string;
  targetName: string;
}
interface VolunteerDashboardProps {
  volunteer?: Volunteer | null;
  event?: CollegeEvent | null;
  learners: Learner[];
  checklist?: ChecklistItem[];
  parties?: Party[];
  committees?: Committee[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  onToggleCheckIn: (id: string, day: 1 | 2) => void;
  onCheckInAll?: (day: 1 | 2, state: boolean) => void;
  onAddWalkIn?: (learner: Partial<Learner>) => void;
  onCastVote?: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCastFlashVote?: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onToggleVolunteerArrival?: (volunteerId: string) => void;
  onLogout: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  volunteer,
  event,
  learners,
  checklist = [],
  parties: _parties = [],
  committees: _committees = [],
  elections = [],
  flashVotes = [],
  onToggleCheckIn,
  onCheckInAll,
  onAddWalkIn,
  onCastVote,
  onCastFlashVote,
  onToggleVolunteerArrival,
  onLogout,
  onShowToast
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [isOnDuty, setIsOnDuty] = useState(volunteer?.has_arrived ?? true);
  const [activeTab, setActiveTab] = useState<'yuvadesk' | 'checkin' | 'walkin' | 'checklist'>('yuvadesk');

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDept, setWalkInDept] = useState('');
  const [walkInYear, setWalkInYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');

  // YUVA Assignments State (Persisted via StorageService)
  const eventId = event?.id || volunteer?.event_id || 'ev_tn_assembly_2026';

  const [yuvaAssignments, setYuvaAssignments] = useState<YuvaAssignment[]>(() =>
    storageService.getYuvaAssignments(eventId)
  );

  useEffect(() => {
    setYuvaAssignments(storageService.getYuvaAssignments(eventId));
    const unsubscribe = storageService.subscribe(() => {
      setYuvaAssignments(storageService.getYuvaAssignments(eventId));
    });
    return unsubscribe;
  }, [eventId]);

  // Find assignments for logged in volunteer
  const userAssignments = useMemo(() => {
    if (!volunteer) return yuvaAssignments;
    const vName = (volunteer.name || '').toLowerCase().trim();
    const vPhone = (volunteer.phone || '').replace(/\D/g, '');
    const vStation = (volunteer.station || '').toLowerCase().trim();
    const vRole = (volunteer.role || '').toLowerCase().trim();

    const match = yuvaAssignments.filter(a => {
      const aName = (a.volunteerName || '').toLowerCase().trim();
      const aPhone = (a.volunteerPhone || '').replace(/\D/g, '');
      const aTarget = (a.targetName || '').toLowerCase().trim();

      if (volunteer.id && a.volunteerId === volunteer.id) return true;
      if (vPhone && aPhone && (vPhone.endsWith(aPhone) || aPhone.endsWith(vPhone))) return true;
      if (vName && aName && (vName.includes(aName) || aName.includes(vName))) return true;
      if (vStation && aTarget && (vStation.includes(aTarget) || aTarget.includes(vStation))) return true;
      if (vRole && aTarget && (vRole.includes(aTarget) || aTarget.includes(vRole))) return true;

      return false;
    });

    return match.length > 0 ? match : [];
  }, [yuvaAssignments, volunteer]);

  // Unique Desk Options without duplicates
  const uniqueDesks = useMemo(() => {
    const map = new Map<string, { key: string; targetType: 'party' | 'committee'; targetId: string; targetName: string }>();
    userAssignments.forEach(a => {
      const key = `${a.targetType}:::${a.targetId}:::${a.targetName}`;
      if (!map.has(key)) {
        map.set(key, { key, targetType: a.targetType, targetId: a.targetId, targetName: a.targetName });
      }
    });
    return Array.from(map.values());
  }, [userAssignments]);

  // Selected desk key: 'type:::id:::name' or 'ALL' or 'NONE'
  const [selectedDeskKey, setSelectedDeskKey] = useState<string>(() => {
    if (uniqueDesks.length > 1) {
      return 'ALL';
    }
    return uniqueDesks.length === 1 ? uniqueDesks[0].key : 'NONE';
  });

  useEffect(() => {
    if (uniqueDesks.length > 1 && (!selectedDeskKey || selectedDeskKey === 'NONE')) {
      setSelectedDeskKey('ALL');
    } else if (uniqueDesks.length === 1 && (!selectedDeskKey || selectedDeskKey === 'NONE')) {
      setSelectedDeskKey(uniqueDesks[0].key);
    }
  }, [uniqueDesks]);

  const [checkinScope, setCheckinScope] = useState<'ASSIGNED' | 'ALL'>('ASSIGNED');

  const [isRegistrationsFrozen, setIsRegistrationsFrozen] = useState<boolean>(() =>
    storageService.getRegistrationsFrozen(eventId) || storageService.getRegistrationsFrozen()
  );

  useEffect(() => {
    const checkFrozen = () => {
      setIsRegistrationsFrozen(storageService.getRegistrationsFrozen(eventId) || storageService.getRegistrationsFrozen());
    };
    checkFrozen();
    const unsubscribe = storageService.subscribe(checkFrozen);
    return unsubscribe;
  }, [eventId]);

  // Proxy Voting Modal State
  const [proxyModalLearner, setProxyModalLearner] = useState<Learner | null>(null);
  const [selectedCandidateForElection, setSelectedCandidateForElection] = useState<Record<string, string>>({});

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
    if (storageService.getRegistrationsFrozen(event?.id)) {
      onShowToast('Registrations Frozen', 'Walk-in registrations are currently frozen by Assembly Coordinator', 'error');
      return;
    }
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

    onShowToast('Walk-in Registered', `Registered ${walkInName}`, 'success');
    setWalkInName('');
    setWalkInEmail('');
    setWalkInPhone('');
    setWalkInDept('');
    setActiveTab('checkin');
  };

  const activeParties = useMemo(() => {
    return _parties.length > 0 ? _parties : storageService.getParties(eventId);
  }, [_parties, eventId]);

  const activeCommittees = useMemo(() => {
    return _committees.length > 0 ? _committees : storageService.getCommittees(eventId);
  }, [_committees, eventId]);

  // Helper for deterministic, stable sorting by constituency number then name
  const sortLearners = (list: Learner[]): Learner[] => {
    return [...list].sort((a, b) => {
      const numA = Number(a.constituency_number) || 999999;
      const numB = Number(b.constituency_number) || 999999;
      if (numA !== numB) return numA - numB;
      const codeA = a.access_code || '';
      const codeB = b.access_code || '';
      if (codeA !== codeB) return codeA.localeCompare(codeB);
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  };

  // Filter learners for YUVA Desk & Assigned Scope
  const assignedDeskLearners = useMemo(() => {
    let result: Learner[] = [];
    if (selectedDeskKey && selectedDeskKey !== 'ALL') {
      const [tType, tId, tName] = selectedDeskKey.split(':::');
      result = learners.filter(l => {
        const pName = getResolvedPartyName(l, activeParties);
        const cName = getResolvedCommitteeName(l, activeCommittees);

        if (tType === 'party') {
          return (
            l.party_id === tId ||
            (pName && tName && (
              pName.toLowerCase().includes(tName.toLowerCase()) ||
              tName.toLowerCase().includes(pName.toLowerCase())
            ))
          );
        } else {
          return (
            l.committee_id === tId ||
            (cName && tName && (
              cName.toLowerCase().includes(tName.toLowerCase()) ||
              tName.toLowerCase().includes(cName.toLowerCase())
            ))
          );
        }
      });
    } else if (userAssignments.length > 0) {
      result = learners.filter(l => {
        const pName = getResolvedPartyName(l, activeParties);
        const cName = getResolvedCommitteeName(l, activeCommittees);
        return userAssignments.some(a =>
          a.targetType === 'party'
            ? (l.party_id === a.targetId || (pName && (pName.toLowerCase().includes(a.targetName.toLowerCase()) || a.targetName.toLowerCase().includes(pName.toLowerCase()))))
            : (l.committee_id === a.targetId || (cName && (cName.toLowerCase().includes(a.targetName.toLowerCase()) || a.targetName.toLowerCase().includes(cName.toLowerCase()))))
        );
      });
    } else if (volunteer?.station || volunteer?.role) {
      const vStation = (volunteer.station || volunteer.role || '').toLowerCase();
      const matched = learners.filter(l => {
        const pName = getResolvedPartyName(l, activeParties);
        const cName = getResolvedCommitteeName(l, activeCommittees);
        return (
          (pName && vStation.includes(pName.toLowerCase())) ||
          (cName && vStation.includes(cName.toLowerCase())) ||
          (l.party_name && vStation.includes(l.party_name.toLowerCase())) ||
          (l.committee_name && vStation.includes(l.committee_name.toLowerCase()))
        );
      });
      if (matched.length > 0) result = matched;
    }

    return sortLearners(result);
  }, [learners, selectedDeskKey, userAssignments, activeParties, activeCommittees, volunteer]);

  // Filter learners for General Check-in Terminal
  const filteredLearners = useMemo(() => {
    const baseList = checkinScope === 'ASSIGNED' ? assignedDeskLearners : learners;
    const filtered = baseList.filter(l => {
      const pName = getResolvedPartyName(l, activeParties);
      const matchesSearch =
        l.full_name.toLowerCase().includes(search.toLowerCase()) ||
        l.access_code.toLowerCase().includes(search.toLowerCase()) ||
        (pName && pName.toLowerCase().includes(search.toLowerCase())) ||
        (l.constituency_name && l.constituency_name.toLowerCase().includes(search.toLowerCase()));

      const isPresent = selectedDay === 1 ? l.day1_checked_in : l.day2_checked_in;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT' && isPresent) ||
        (statusFilter === 'ABSENT' && !isPresent);

      return matchesSearch && matchesStatus;
    });
    return sortLearners(filtered);
  }, [learners, assignedDeskLearners, checkinScope, search, selectedDay, statusFilter, activeParties]);

  const filteredYuvaMembers = useMemo(() => {
    const filtered = assignedDeskLearners.filter(l => {
      const pName = getResolvedPartyName(l, activeParties);
      const matchesSearch =
        l.full_name.toLowerCase().includes(search.toLowerCase()) ||
        l.access_code.toLowerCase().includes(search.toLowerCase()) ||
        (pName && pName.toLowerCase().includes(search.toLowerCase())) ||
        (l.constituency_name && l.constituency_name.toLowerCase().includes(search.toLowerCase()));

      const isPresent = selectedDay === 1 ? l.day1_checked_in : l.day2_checked_in;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT' && isPresent) ||
        (statusFilter === 'ABSENT' && !isPresent);

      return matchesSearch && matchesStatus;
    });
    return sortLearners(filtered);
  }, [assignedDeskLearners, search, selectedDay, statusFilter, activeParties]);

  const day1Present = learners.filter(l => l.day1_checked_in).length;
  const day2Present = learners.filter(l => l.day2_checked_in).length;
  const currentPresent = selectedDay === 1 ? day1Present : day2Present;
  const attendanceRate = learners.length > 0 ? Math.round((currentPresent / learners.length) * 100) : 0;

  // Live Elections & Live Flash Votes
  const activeElectionsList = useMemo(() => {
    const list = elections.length > 0 ? elections : storageService.getElections(eventId);
    return list.filter(e => e.status === 'Live');
  }, [elections, eventId]);

  const activeFlashVotesList = useMemo(() => {
    const list = flashVotes.length > 0 ? flashVotes : storageService.getFlashVotes(eventId);
    return list.filter(f => f.status === 'ACTIVE');
  }, [flashVotes, eventId]);

  // Execute Proxy Vote for Election
  const handleExecuteProxyVote = (electionId: string) => {
    if (!proxyModalLearner) return;
    const candId = selectedCandidateForElection[electionId];
    if (!candId) {
      onShowToast('Select Candidate', 'Please select a candidate before casting vote', 'error');
      return;
    }

    if (onCastVote) {
      onCastVote(electionId, candId, proxyModalLearner.id);
    } else {
      storageService.castVoteInElection(electionId, candId, proxyModalLearner.id);
    }

    onShowToast('Proxy Vote Cast', `Cast vote for ${proxyModalLearner.full_name}`, 'success');
  };

  // Execute Proxy Vote for Flash Vote
  const handleExecuteProxyFlashVote = (voteId: string, decision: 'AYE' | 'NO' | 'ABSTAIN') => {
    if (!proxyModalLearner) return;

    if (onCastFlashVote) {
      onCastFlashVote(voteId, proxyModalLearner, decision);
    } else {
      storageService.castFlashVote(voteId, proxyModalLearner, decision);
    }

    onShowToast('Proxy Vote Recorded', `Recorded ${decision} for ${proxyModalLearner.full_name}`, 'success');
  };

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
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 cursor-pointer"
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
          <div className="flex rounded-xl p-1 border flex-wrap gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('yuvadesk')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'yuvadesk' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'yuvadesk' ? 'var(--amber)' : 'transparent',
                color: activeTab === 'yuvadesk' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <Shield className="w-3.5 h-3.5" /> My YUVA Desk & Proxy Voting
            </button>

            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'checkin' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'checkin' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'checkin' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <UserCheck className="w-3.5 h-3.5" /> All Delegates Terminal
            </button>

            <button
              onClick={() => setActiveTab('walkin')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'walkin' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'walkin' ? (isRegistrationsFrozen ? 'var(--amber)' : 'var(--accent)') : 'transparent',
                color: activeTab === 'walkin' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Walk-In</span>
              {isRegistrationsFrozen && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white flex items-center gap-0.5 ml-0.5">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
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

          {(activeTab === 'checkin' || activeTab === 'yuvadesk') && onCheckInAll && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCheckInAll(selectedDay, true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition hover:opacity-80 flex items-center gap-1 cursor-pointer"
                style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--emerald)', borderColor: 'var(--emerald)' }}
              >
                <CheckCircle className="w-3 h-3" /> Check In All (Day {selectedDay})
              </button>
              <button
                onClick={() => onCheckInAll(selectedDay, false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition hover:opacity-80 flex items-center gap-1 cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: '#ef4444' }}
              >
                <XCircle className="w-3 h-3" /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Tab 0: YUVA DESK & PROXY VOTING */}
        {activeTab === 'yuvadesk' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header Desk Info Banner */}
            <div className="rounded-2xl p-5 border shadow-sm space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        YUVA Desk Operations & Proxy Voting
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        Assigned Floor Support
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Manage assigned party/committee delegates, perform instant check-ins, and cast votes for delegates without mobile access.
                    </p>
                  </div>
                </div>

                {/* Desk Switcher Select */}
                <div className="w-full sm:w-auto">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Switch Assigned Desk:
                  </label>
                  <select
                    value={selectedDeskKey}
                    onChange={(e) => setSelectedDeskKey(e.target.value)}
                    className="input-theme text-xs font-bold py-2 px-3 rounded-xl border w-full sm:w-72"
                  >
                    {uniqueDesks.length > 1 && (
                      <option value="ALL">All Assigned Desks ({uniqueDesks.length})</option>
                    )}
                    {uniqueDesks.length === 0 && (
                      <option value="NONE">No Desks Assigned</option>
                    )}
                    {uniqueDesks.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.targetType === 'party' ? '🚩 Party Desk:' : '🏛️ Committee:'} {d.targetName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Live Status Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Assigned Members</div>
                  <div className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>{assignedDeskLearners.length}</div>
                </div>
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Day {selectedDay} Present</div>
                  <div className="text-xl font-black mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {assignedDeskLearners.filter(l => selectedDay === 1 ? l.day1_checked_in : l.day2_checked_in).length}
                  </div>
                </div>
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Active Live Elections</div>
                  <div className="text-xl font-black mt-0.5 text-amber-600 dark:text-amber-400">{activeElectionsList.length}</div>
                </div>
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Live Flash Votes</div>
                  <div className="text-xl font-black mt-0.5 text-sky-600 dark:text-sky-400">{activeFlashVotesList.length}</div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="rounded-2xl p-5 border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search assigned members, code, party..."
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
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

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b uppercase" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Delegate Name</th>
                      <th className="py-2.5 px-3">Party & Bench</th>
                      <th className="py-2.5 px-3">Role / Constituency</th>
                      <th className="py-2.5 px-3 text-center">Floor Check-In</th>
                      <th className="py-2.5 px-3 text-center">Proxy Voting (No Mobile)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filteredYuvaMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                          No members found for this desk assignment.
                        </td>
                      </tr>
                    ) : (
                      filteredYuvaMembers.map(learner => {
                        const isPresent = selectedDay === 1 ? learner.day1_checked_in : learner.day2_checked_in;
                        return (
                          <tr key={learner.id} className="hover:opacity-90">
                            <td className="py-3 px-3 font-mono font-bold" style={{ color: 'var(--amber)' }}>
                              {learner.constituency_number !== undefined ? `#${learner.constituency_number}` : '-'}
                            </td>
                            <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                              {learner.full_name}
                            </td>
                            <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-semibold">{learner.party_name || 'Independent'}</span>
                              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-500/20">
                                {learner.bench || 'Ruling'}
                              </span>
                            </td>
                            <td className="py-3 px-3" style={{ color: 'var(--text-muted)' }}>
                              {learner.constituency_name || learner.role || 'Floor Delegate'}
                            </td>

                            {/* Check In Action */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => onToggleCheckIn(learner.id, selectedDay)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                {isPresent ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 text-white" /> PRESENT
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-slate-400" /> ABSENT
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Proxy Vote Action */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setProxyModalLearner(learner)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:scale-102 cursor-pointer"
                              >
                                <Vote className="w-3.5 h-3.5" />
                                <span>Cast Proxy Vote</span>
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
          </div>
        )}

        {/* Tab 1: Check-in Terminal */}
        {activeTab === 'checkin' && (
          <div className="rounded-2xl p-6 border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Scan badge or search name, code, party..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-theme pl-8 py-2 text-xs w-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCheckinScope('ASSIGNED')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      checkinScope === 'ASSIGNED'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-slate-500/5 text-slate-500 border-slate-500/20 hover:border-slate-400'
                    }`}
                  >
                    My Desk ({assignedDeskLearners.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckinScope('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      checkinScope === 'ALL'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-slate-500/5 text-slate-500 border-slate-500/20 hover:border-slate-400'
                    }`}
                  >
                    All Benches ({learners.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
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
                    <th className="py-2.5 px-3">#</th>
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
                          <td className="py-3 px-3 font-mono font-bold" style={{ color: 'var(--amber)' }}>
                            {learner.constituency_number !== undefined ? `#${learner.constituency_number}` : '-'}
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
                                isPresent
                                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-white" /> PRESENT
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-400" /> ABSENT
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
            {isRegistrationsFrozen ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Floor Walk-in Registration Frozen
                  </h2>
                  <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400">
                    On-the-spot delegate registration has been frozen/locked by the Assembly Coordinator. No new walk-in badges can be issued at this time.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                  <Lock className="w-3.5 h-3.5" /> Registrations Locked by Admin
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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

      {/* PROXY VOTING MODAL FOR DELEGATES WITHOUT MOBILE */}
      {proxyModalLearner && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30">
                  <Vote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Proxy Voting: {proxyModalLearner.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {proxyModalLearner.constituency_number !== undefined ? `#${proxyModalLearner.constituency_number} · ` : ''}{proxyModalLearner.party_name || 'Independent'} ({proxyModalLearner.bench || 'Ruling'})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProxyModalLearner(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>YUVA Volunteer Proxy Mode: Submitting official parliamentary vote on behalf of delegate.</span>
            </div>

            {/* Section 1: Live Elections */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" /> Active Live Elections ({activeElectionsList.length})
              </h4>

              {activeElectionsList.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  No live elections currently open for voting.
                </div>
              ) : (
                activeElectionsList.map(elec => {
                  const hasVoted = elec.voted_delegate_ids?.includes(proxyModalLearner.id);
                  const selectedCandId = selectedCandidateForElection[elec.id];

                  return (
                    <div
                      key={elec.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{elec.title}</h5>
                          <p className="text-[11px] text-slate-500">{elec.position}</p>
                        </div>
                        {hasVoted && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Voted
                          </span>
                        )}
                      </div>

                      {!hasVoted && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Select Candidate:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {elec.candidates.map(cand => (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() => setSelectedCandidateForElection(prev => ({ ...prev, [elec.id]: cand.id }))}
                                className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                                  selectedCandId === cand.id
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/30'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <div>{cand.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{cand.party || 'Nominee'}</div>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExecuteProxyVote(elec.id)}
                            className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Vote className="w-3.5 h-3.5" /> Cast Proxy Vote in Election
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Section 2: Active Flash Votes */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-sky-500" /> Active Live Flash Votes / Polls ({activeFlashVotesList.length})
              </h4>

              {activeFlashVotesList.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  No active live flash votes / division polls currently running.
                </div>
              ) : (
                activeFlashVotesList.map(flash => {
                  const hasVoted = flash.voter_ids?.includes(proxyModalLearner.id);

                  return (
                    <div
                      key={flash.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{flash.question}</h5>
                        {hasVoted && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Voted
                          </span>
                        )}
                      </div>

                      {!hasVoted && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleExecuteProxyFlashVote(flash.id, 'AYE')}
                            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> AYE (Yes)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExecuteProxyFlashVote(flash.id, 'NO')}
                            className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> NO (Against)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExecuteProxyFlashVote(flash.id, 'ABSTAIN')}
                            className="py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Abstain
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setProxyModalLearner(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
