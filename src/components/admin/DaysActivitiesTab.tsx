import React, { useState, useMemo } from 'react';
import type { EventDay, Learner, DayAttendanceRecord, CollegeEvent, Party, Committee, DayAttendanceStatus } from '../../types';
import { EditDayActivitiesModal } from './EditDayActivitiesModal';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ArrowLeft,
  Calendar,
  Sparkles,
  Download,
  AlertTriangle,
  PlayCircle,
  CheckSquare
} from 'lucide-react';

interface DaysActivitiesTabProps {
  event: CollegeEvent;
  eventDays: EventDay[];
  dayAttendance: DayAttendanceRecord[];
  learners: Learner[];
  parties?: Party[];
  committees?: Committee[];
  onAddDay: (dayData: Partial<EventDay>) => Promise<EventDay>;
  onUpdateDay: (day: EventDay) => Promise<EventDay>;
  onDeleteDay: (dayId: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  onSetActiveDay: (dayId: string) => Promise<void>;
  onSetStudentDayAttendance: (
    dayId: string,
    studentId: string,
    status: DayAttendanceStatus,
    markedBy?: string
  ) => Promise<DayAttendanceRecord>;
  onBatchSetDayAttendance: (
    dayId: string,
    studentIds: string[],
    status: DayAttendanceStatus,
    markedBy?: string
  ) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DaysActivitiesTab: React.FC<DaysActivitiesTabProps> = ({
  event,
  eventDays,
  dayAttendance,
  learners,
  parties = [],
  committees: _committees = [],
  onAddDay,
  onUpdateDay,
  onDeleteDay,
  onSetActiveDay,
  onSetStudentDayAttendance,
  onBatchSetDayAttendance,
  onShowToast
}) => {
  // Navigation mode: 'days' (overview of all days) or 'attendance' (drilldown into a specific day)
  const [viewMode, setViewMode] = useState<'days' | 'attendance'>('days');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<EventDay | null>(null);

  // Deletion Confirmation Modal State
  const [deletingDay, setDeletingDay] = useState<EventDay | null>(null);
  const [deleteConfirmCount, setDeleteConfirmCount] = useState<number>(0);

  // Attendance drilldown search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // Sorted days
  const sortedDays = useMemo(() => {
    return [...eventDays].sort((a, b) => (a.order_index ?? a.day_number) - (b.order_index ?? b.day_number));
  }, [eventDays]);

  // Active day
  const activeDay = useMemo(() => {
    return sortedDays.find(d => d.status === 'Active') || sortedDays[0];
  }, [sortedDays]);

  // Currently inspected day in attendance view
  const currentAttendanceDay = useMemo(() => {
    if (selectedDayId) {
      const found = sortedDays.find(d => d.id === selectedDayId);
      if (found) return found;
    }
    return activeDay || sortedDays[0];
  }, [sortedDays, selectedDayId, activeDay]);

  // Overall attendance statistics across all days
  const overallSummary = useMemo(() => {
    const totalStudents = learners.length;
    return sortedDays.map(day => {
      const dayAtt = dayAttendance.filter(a => a.day_id === day.id);
      const presentCount = dayAtt.filter(a => a.status === 'Present').length;
      const absentCount = Math.max(0, totalStudents - presentCount);
      const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      return {
        day,
        totalStudents,
        presentCount,
        absentCount,
        percentage
      };
    });
  }, [sortedDays, dayAttendance, learners.length]);

  // Attendance for current viewed day
  const currentDayStats = useMemo(() => {
    if (!currentAttendanceDay) return { presentCount: 0, absentCount: 0, percentage: 0 };
    const dayAtt = dayAttendance.filter(a => a.day_id === currentAttendanceDay.id);
    const presentCount = dayAtt.filter(a => a.status === 'Present').length;
    const absentCount = Math.max(0, learners.length - presentCount);
    const percentage = learners.length > 0 ? Math.round((presentCount / learners.length) * 100) : 0;
    return { presentCount, absentCount, percentage };
  }, [currentAttendanceDay, dayAttendance, learners.length]);

  // Filtered learners for attendance view
  const filteredLearners = useMemo(() => {
    if (!currentAttendanceDay) return [];
    const dayAttMap = new Map<string, DayAttendanceRecord>();
    dayAttendance
      .filter(a => a.day_id === currentAttendanceDay.id)
      .forEach(a => dayAttMap.set(a.student_id, a));

    return learners.filter(l => {
      const party = parties.find(p => p.id === l.party_id);
      const partyName = party?.name || l.party_name || '';
      const constName = l.constituency_name || '';

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        l.full_name.toLowerCase().includes(query) ||
        (l.access_code && l.access_code.toLowerCase().includes(query)) ||
        partyName.toLowerCase().includes(query) ||
        constName.toLowerCase().includes(query) ||
        (l.department && l.department.toLowerCase().includes(query));

      const attRecord = dayAttMap.get(l.id);
      const isPresent = attRecord ? attRecord.status === 'Present' : false;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT' && isPresent) ||
        (statusFilter === 'ABSENT' && !isPresent);

      return matchesSearch && matchesStatus;
    });
  }, [learners, dayAttendance, currentAttendanceDay, searchQuery, statusFilter, parties]);

  // Handlers
  const handleOpenAddDay = () => {
    setEditingDay(null);
    setIsModalOpen(true);
  };

  const handleOpenEditDay = (day: EventDay) => {
    setEditingDay(day);
    setIsModalOpen(true);
  };

  const handleOpenAttendance = (day: EventDay) => {
    setSelectedDayId(day.id);
    setViewMode('attendance');
  };

  const handlePromptDeleteDay = (day: EventDay) => {
    const attCount = dayAttendance.filter(a => a.day_id === day.id).length;
    setDeletingDay(day);
    setDeleteConfirmCount(attCount);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDay) return;
    try {
      const res = await onDeleteDay(deletingDay.id, true);
      if (res.success) {
        onShowToast('Day Removed', `Removed ${deletingDay.name} and archived any associated records.`, 'info');
        setDeletingDay(null);
        if (selectedDayId === deletingDay.id) {
          setViewMode('days');
        }
      } else {
        onShowToast('Cannot Delete', res.error || 'Failed to delete event day', 'error');
      }
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Deletion failed', 'error');
    }
  };

  const handleExportAttendanceCsv = () => {
    if (!currentAttendanceDay) return;
    const dayAttMap = new Map<string, DayAttendanceRecord>();
    dayAttendance
      .filter(a => a.day_id === currentAttendanceDay.id)
      .forEach(a => dayAttMap.set(a.student_id, a));

    const headers = [
      'Student Name',
      'Access Code / ID',
      'Department',
      'Academic Year',
      'Constituency',
      'Party',
      'Bench',
      'Status',
      'Marked At',
      'Marked By'
    ];

    const rows = learners.map(l => {
      const party = parties.find(p => p.id === l.party_id);
      const att = dayAttMap.get(l.id);
      const status = att ? att.status : 'Absent';
      const markedAt = att?.marked_at ? new Date(att.marked_at).toLocaleString() : 'N/A';
      const markedBy = att?.marked_by || 'N/A';

      return [
        `"${l.full_name}"`,
        `"${l.access_code}"`,
        `"${l.department || ''}"`,
        `"${l.academic_year || ''}"`,
        `"${l.constituency_name || ''}"`,
        `"${party?.name || l.party_name || ''}"`,
        `"${l.bench || ''}"`,
        `"${status}"`,
        `"${markedAt}"`,
        `"${markedBy}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.college_name.replace(/\s+/g, '_')}_${currentAttendanceDay.name}_Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('CSV Exported', `Downloaded attendance report for ${currentAttendanceDay.name}`, 'success');
  };

  const handleMarkAll = async (status: DayAttendanceStatus) => {
    if (!currentAttendanceDay) return;
    const studentIds = learners.map(l => l.id);
    try {
      await onBatchSetDayAttendance(currentAttendanceDay.id, studentIds, status, 'Admin Batch Action');
      onShowToast('Batch Updated', `Marked all ${learners.length} students as ${status} for ${currentAttendanceDay.name}`, 'success');
    } catch (err: any) {
      onShowToast('Batch Save Failed', err?.message || 'Could not save batch attendance in database', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: DAYS & ACTIVITIES OVERVIEW                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'days' && (
        <>
          {/* Header Banner */}
          <div
            className="rounded-2xl p-6 border shadow-sm transition-all"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                    EVENT MANAGEMENT
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    {sortedDays.length} Days Configured
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
                  Days & Activities
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Event: <strong style={{ color: 'var(--text-primary)' }}>{event.college_name}</strong> • Define session days, assign dynamic TN Assembly activities, switch active floor day, and track day-wise attendance.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleOpenAddDay}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Day</span>
                </button>
              </div>
            </div>

            {/* Overall Attendance Summary Bar */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Overall Event Attendance Summary ({learners.length} Registered Delegates)</span>
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Click [Attendance] on any day to inspect details
                </span>
              </div>

              {sortedDays.length === 0 ? (
                <div
                  className="p-5 rounded-xl border border-dashed text-center text-xs text-slate-400 space-y-1"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <p className="font-semibold text-slate-300">No assembly days configured yet.</p>
                  <p className="text-[11px]">Click "+ Add Day" above to configure your first day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {overallSummary.map(({ day, totalStudents, presentCount, percentage }) => {
                    const isActive = day.status === 'Active';
                    return (
                      <div
                        key={day.id}
                        onClick={() => handleOpenAttendance(day)}
                        className={`p-3 rounded-xl border transition cursor-pointer hover:border-amber-500/50 flex flex-col justify-between ${
                          isActive ? 'ring-1 ring-emerald-500' : ''
                        }`}
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {day.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-500/15 text-slate-400'
                          }`}>
                            {isActive ? 'ACTIVE' : day.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            {presentCount} <span className="text-xs font-normal opacity-70">/ {totalStudents}</span>
                          </span>
                          <span className="text-xs font-bold text-emerald-500">
                            {percentage}% Present
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-700/30 overflow-hidden mt-1.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: isActive ? 'var(--emerald)' : 'var(--amber)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Days Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Configured Assembly Days ({sortedDays.length})
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No fixed limit • Assign any combination of activities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedDays.length === 0 ? (
                <div
                  className="col-span-full p-12 rounded-2xl border-2 border-dashed text-center space-y-4 shadow-sm"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      No Assembly Days Configured (0)
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Start fresh by creating Day 1. You can configure any number of days and assign activities dynamically without automatic pre-seeding.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddDay}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Day</span>
                  </button>
                </div>
              ) : (
                sortedDays.map((day) => {
                const isActive = day.status === 'Active';
                const dayAtt = dayAttendance.filter(a => a.day_id === day.id);
                const presentCount = dayAtt.filter(a => a.status === 'Present').length;
                const totalStudents = learners.length;
                const percent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

                return (
                  <div
                    key={day.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${
                      isActive ? 'ring-2 ring-emerald-500/80 shadow-emerald-500/10' : ''
                    }`}
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                              {day.name}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          {day.date && (
                            <p className="text-xs flex items-center gap-1 mt-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{day.date}</span>
                            </p>
                          )}
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                            : day.status === 'Completed'
                            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                        }`}>
                          Status: {day.status}
                        </span>
                      </div>

                      {/* Activities Section */}
                      <div className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                            Activities:
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {day.activities?.length || 0} scheduled
                          </span>
                        </div>

                        {day.activities && day.activities.length > 0 ? (
                          <ul className="space-y-1.5">
                            {day.activities.map((act, idx) => (
                              <li
                                key={idx}
                                className="text-xs font-semibold flex items-start gap-2"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                <span className="text-amber-500 font-bold shrink-0">•</span>
                                <span className="leading-snug">{act}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs italic text-slate-500">No activities assigned yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer & Actions */}
                    <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                      {/* Attendance Quick Progress */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400">Attendance:</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {presentCount} / {totalStudents} <span className="text-emerald-500">({percent}%)</span>
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {!isActive && (
                          <button
                            onClick={async () => {
                              await onSetActiveDay(day.id);
                              onShowToast('Active Day Changed', `Switched active floor day to ${day.name}. Volunteers will now see this day.`, 'success');
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Make this day the active session for floor operations and volunteer terminal"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Set Active</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditDay(day)}
                          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border hover:bg-slate-500/10 flex items-center justify-center gap-1 transition cursor-pointer"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleOpenAttendance(day)}
                          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Attendance</span>
                        </button>

                        <button
                          onClick={() => handlePromptDeleteDay(day)}
                          className="p-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                          title="Delete Day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Bottom Add Day Button */}
            <div className="pt-2 text-center">
              <button
                onClick={handleOpenAddDay}
                className="px-6 py-3 rounded-xl border-2 border-dashed hover:border-amber-500 text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>+ Add Day</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 2: DAY ATTENDANCE DRILLDOWN                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'attendance' && currentAttendanceDay && (
        <div className="space-y-6">
          {/* Header & Day Switcher */}
          <div
            className="rounded-2xl p-6 border shadow-sm transition-all"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('days')}
                  className="p-2.5 rounded-xl border hover:bg-slate-500/15 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Days & Activities</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {currentAttendanceDay.name} — Attendance
                    </h2>
                    {currentAttendanceDay.status === 'Active' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
                        ACTIVE DAY
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Event: <strong style={{ color: 'var(--text-primary)' }}>{event.college_name}</strong> • Record and inspect student delegate attendance.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAttendanceCsv}
                  className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-500/10"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Day Switcher Pills */}
            <div className="mt-5 pt-4 border-t flex flex-wrap items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                Switch Day:
              </span>
              {sortedDays.map((d) => {
                const isCurrent = d.id === currentAttendanceDay.id;
                const dAtt = dayAttendance.filter(a => a.day_id === d.id);
                const pres = dAtt.filter(a => a.status === 'Present').length;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayId(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      isCurrent ? 'shadow-sm ring-1 ring-amber-500' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? 'var(--amber)' : 'var(--bg-elevated)',
                      color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: isCurrent ? 'var(--amber)' : 'var(--border)'
                    }}
                  >
                    <span>{d.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isCurrent ? 'bg-black/20 text-white' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {pres}/{learners.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Assigned Activities for this day */}
            <div className="mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  Today's Activities:
                </span>
                <span className="text-xs text-slate-300">
                  {currentAttendanceDay.activities?.join(' • ') || 'No activities assigned'}
                </span>
              </div>
              <button
                onClick={() => handleOpenEditDay(currentAttendanceDay)}
                className="text-xs text-amber-500 hover:underline font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Edit Activities →
              </button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
              <p className="text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                {learners.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Enrolled student delegates</p>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Present Count</p>
              <p className="text-2xl font-black mt-1 text-emerald-500">
                {currentDayStats.presentCount}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{currentDayStats.percentage}% of delegates</p>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Absent Count</p>
              <p className="text-2xl font-black mt-1 text-rose-500">
                {currentDayStats.absentCount}
              </p>
              <p className="text-[11px] text-rose-400 mt-0.5">Not checked in on this day</p>
            </div>

            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</p>
              <p className="text-2xl font-black mt-1 text-amber-500">
                {currentDayStats.percentage}%
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-700/40 mt-1.5 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentDayStats.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Search, Filters & Batch Actions */}
          <div
            className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name, ID code, party, constituency..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold border outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>

              {/* Status Filter */}
              <div className="flex rounded-xl p-1 border shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map((sf) => (
                  <button
                    key={sf}
                    onClick={() => setStatusFilter(sf)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      statusFilter === sf ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sf}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reset All Absent</span>
              </button>
            </div>
          </div>

          {/* Students List Table */}
          <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Student Attendance List ({filteredLearners.length} displayed)
              </span>
              <span className="text-xs text-slate-400">
                Attendance records are stored separately for {currentAttendanceDay.name}
              </span>
            </div>

            {filteredLearners.length === 0 ? (
              <div className="p-12 text-center text-xs italic text-slate-400">
                No students match your search or filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[11px] uppercase font-bold text-slate-400" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Access Code / ID</th>
                      <th className="py-3 px-4">Dept & Year</th>
                      <th className="py-3 px-4">Constituency & Party</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                      <th className="py-3 px-4">Audit Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filteredLearners.map((learner) => {
                      const att = dayAttendance.find(a => a.day_id === currentAttendanceDay.id && a.student_id === learner.id);
                      const isPresent = att ? att.status === 'Present' : false;
                      const party = parties.find(p => p.id === learner.party_id);

                      return (
                        <tr
                          key={learner.id}
                          className="hover:bg-slate-500/5 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                              {learner.full_name}
                            </div>
                            <div className="text-[11px] text-slate-400">{learner.email || 'No email'}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-500/15 text-slate-300">
                              {learner.access_code}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-300">
                            <div>{learner.department || 'General'}</div>
                            <div className="text-[10px] text-slate-500">{learner.academic_year || '1st Year'}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {learner.constituency_name ? `#${learner.constituency_number || ''} ${learner.constituency_name}` : 'Unallocated'}
                            </div>
                            <div className="text-[11px] text-amber-500 font-bold">
                              {party?.name || learner.party_name || 'No Party'}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPresent
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                            }`}>
                              {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              <span>{isPresent ? 'Present' : 'Absent'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  try {
                                    await onSetStudentDayAttendance(currentAttendanceDay.id, learner.id, 'Present', 'Admin');
                                  } catch (err: any) {
                                    onShowToast('Save Failed', err?.message || 'Could not record attendance in database', 'error');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await onSetStudentDayAttendance(currentAttendanceDay.id, learner.id, 'Absent', 'Admin');
                                  } catch (err: any) {
                                    onShowToast('Save Failed', err?.message || 'Could not record attendance in database', 'error');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  !isPresent
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'border border-rose-500/40 text-rose-400 hover:bg-rose-500/15'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {att?.marked_at ? (
                              <div>
                                <span>{new Date(att.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-[10px] text-slate-500 block">by {att.marked_by || 'Volunteer'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unmarked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT / CREATE DAY MODAL                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <EditDayActivitiesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={editingDay}
        eventId={event.id}
        nextDayNumber={sortedDays.length + 1}
        existingDays={sortedDays}
        onSave={async (data) => {
          if (editingDay) {
            await onUpdateDay({ ...editingDay, ...data } as EventDay);
          } else {
            await onAddDay(data);
          }
        }}
        onShowToast={onShowToast}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION SAFETY MODAL                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {deletingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  Delete {deletingDay.name}?
                </h3>
                <p className="text-xs text-slate-400">
                  Data safety confirmation
                </p>
              </div>
            </div>

            {deleteConfirmCount > 0 ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                <p className="font-bold">
                  ⚠️ This day currently contains {deleteConfirmCount} student attendance record(s).
                </p>
                <p>
                  Deleting this day will remove its schedule and attendance records. Previous and future days' attendance will NOT be affected.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Are you sure you want to delete <strong>{deletingDay.name}</strong>? This day currently has 0 recorded attendance entries.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingDay(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition hover:bg-slate-500/10 cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
