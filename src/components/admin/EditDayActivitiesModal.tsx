import React, { useState, useEffect } from 'react';
import type { EventDay, EventDayStatus } from '../../types';
import { STANDARD_TN_ACTIVITIES } from '../../types';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Calendar, CheckCircle, Sparkles } from 'lucide-react';

interface EditDayActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  day?: EventDay | null;
  eventId: string;
  nextDayNumber?: number;
  existingDays?: EventDay[];
  onSave: (dayData: Partial<EventDay>) => Promise<void>;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditDayActivitiesModal: React.FC<EditDayActivitiesModalProps> = ({
  isOpen,
  onClose,
  day,
  eventId,
  nextDayNumber = 1,
  existingDays = [],
  onSave,
  onShowToast
}) => {
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [status, setStatus] = useState<EventDayStatus>('Upcoming');
  const [mainDay, setMainDay] = useState<1 | 2 | null>(null);
  const [assignedActivities, setAssignedActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (day) {
      setDayNumber(day.day_number);
      setName(day.name || `Day ${day.day_number}`);
      setDate(day.date || '');
      setStatus(day.status || 'Upcoming');
      setMainDay(day.main_day ?? null);
      setAssignedActivities(day.activities ? [...day.activities] : []);
    } else {
      const num = nextDayNumber;
      setDayNumber(num);
      setName(`Day ${num}`);
      setDate('');
      setStatus(num === 1 ? 'Active' : 'Upcoming');
      setMainDay(null);
      // Fresh start: do not auto-seed default activities
      setAssignedActivities([]);
    }
    setCustomActivity('');
  }, [day, nextDayNumber, isOpen]);

  if (!isOpen) return null;

  const handleAddStandardActivity = (act: string) => {
    if (assignedActivities.includes(act)) {
      setAssignedActivities(prev => prev.filter(a => a !== act));
    } else {
      setAssignedActivities(prev => [...prev, act]);
    }
  };

  const handleAddCustomActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customActivity.trim();
    if (!clean) return;
    if (assignedActivities.includes(clean)) {
      onShowToast?.('Already Added', 'This activity is already assigned to this day.', 'info');
      return;
    }
    setAssignedActivities(prev => [...prev, clean]);
    setCustomActivity('');
  };

  const handleRemoveActivity = (index: number) => {
    setAssignedActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setAssignedActivities(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= assignedActivities.length - 1) return;
    setAssignedActivities(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || `Day ${dayNumber}`;

    // Validate duplicate day number
    if (existingDays && existingDays.length > 0) {
      const duplicate = existingDays.find(d => Number(d.day_number) === Number(dayNumber) && (!day || d.id !== day.id));
      if (duplicate) {
        onShowToast?.('Duplicate Day Number', `Day ${dayNumber} (${duplicate.name}) already exists. Please choose a unique day number.`, 'error');
        return;
      }
    }

    if (assignedActivities.length === 0) {
      onShowToast?.('Missing Activities', 'Please assign at least one activity to this day.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(day ? { id: day.id } : {}),
        event_id: eventId,
        day_number: dayNumber,
        name: cleanName,
        date: date.trim(),
        status,
        main_day: mainDay,
        activities: assignedActivities
      });
      onShowToast?.(day ? 'Day Updated' : 'Day Created', `Successfully configured ${cleanName}`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast?.('Error', err?.message || 'Failed to save event day', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
              {day ? 'EDIT EVENT DAY' : 'CREATE NEW EVENT DAY'}
            </span>
            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {day ? `Configure ${day.name}` : `Add Day ${dayNumber} Schedule`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Day Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Day Number
              </label>
              <input
                type="number"
                min={1}
                value={dayNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setDayNumber(val);
                  if (!day) setName(`Day ${val}`);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm font-semibold border outline-none transition"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Day Label / Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Day 1, Inaugural Session"
                className="w-full px-3 py-2 rounded-xl text-sm font-semibold border outline-none transition"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. 15 March 2026"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-semibold border outline-none transition"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 opacity-50" />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Day Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Upcoming', 'Active', 'Completed'] as EventDayStatus[]).map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected ? 'shadow-sm ring-1 ring-amber-500' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? st === 'Active'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : st === 'Completed'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'var(--accent-soft)'
                        : 'var(--bg-elevated)',
                      borderColor: isSelected
                        ? st === 'Active'
                          ? '#10b981'
                          : st === 'Completed'
                          ? '#6366f1'
                          : 'var(--accent)'
                        : 'var(--border)',
                      color: isSelected
                        ? st === 'Active'
                          ? '#10b981'
                          : st === 'Completed'
                          ? '#818cf8'
                          : 'var(--accent)'
                        : 'var(--text-secondary)'
                    }}
                  >
                    <span>{st === 'Active' ? '● LIVE / ACTIVE' : st}</span>
                  </button>
                );
              })}
            </div>
            {status === 'Active' && (
              <p className="text-[11px] mt-1.5 text-emerald-500 font-medium">
                Marking this day as Active will automatically display this day and its activities in the Volunteer Attendance terminal.
              </p>
            )}
          </div>

          {/* Main Assembly Day Check-in Mapping */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Main Assembly Day Check-in Mapping
              </label>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">
                Reflects in D1 / D2 Badges
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: null, label: 'None', sub: 'Activity Session', desc: 'Will NOT alter D1 / D2 check-in' },
                { val: 1 as const, label: '⭐️ Main Day 1', sub: 'Syncs with D1', desc: 'Attendance updates D1 check-in' },
                { val: 2 as const, label: '⭐️ Main Day 2', sub: 'Syncs with D2', desc: 'Attendance updates D2 check-in' }
              ].map((opt) => {
                const isSel = mainDay === opt.val;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setMainDay(opt.val)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSel ? 'shadow-sm ring-2 ring-amber-500' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSel
                        ? opt.val === 1
                          ? 'rgba(245, 158, 11, 0.15)'
                          : opt.val === 2
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'var(--bg-surface)'
                        : 'var(--bg-elevated)',
                      borderColor: isSel
                        ? opt.val === 1
                          ? '#f59e0b'
                          : opt.val === 2
                          ? '#3b82f6'
                          : 'var(--border)'
                        : 'var(--border)',
                      color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    <div>
                      <span className="text-xs font-black block">{opt.label}</span>
                      <span className="text-[10px] font-semibold text-amber-500 block">{opt.sub}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-1.5 text-slate-400">
              {mainDay === 1
                ? 'Marking attendance (Forenoon / Afternoon) on this day will automatically update Delegate Day 1 (D1) Check-in.'
                : mainDay === 2
                ? 'Marking attendance (Forenoon / Afternoon) on this day will automatically update Delegate Day 2 (D2) Check-in.'
                : 'Regular event session. Attendance recorded on this day is tracked independently and will NOT alter D1/D2 check-in.'}
            </p>
          </div>

          {/* Activity Selector: Standard TN Assembly Activities */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>TN Assembly Activities (Click to Assign)</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-500">
                {assignedActivities.length} assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STANDARD_TN_ACTIVITIES.map((act) => {
                const isAssigned = assignedActivities.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => handleAddStandardActivity(act)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-start justify-between gap-2 cursor-pointer ${
                      isAssigned ? 'shadow-sm ring-1 ring-amber-500' : 'hover:border-amber-500/40'
                    }`}
                    style={{
                      backgroundColor: isAssigned ? 'var(--amber-soft)' : 'var(--bg-elevated)',
                      borderColor: isAssigned ? 'var(--amber)' : 'var(--border)',
                      color: isAssigned ? 'var(--amber)' : 'var(--text-secondary)'
                    }}
                  >
                    <span className="flex-1">{act}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
                      isAssigned ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-500'
                    }`}>
                      {isAssigned ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Activity Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              placeholder="Or add a custom activity (e.g. Zero Hour Calling Attention, Valedictory Speech)"
              className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border outline-none transition"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomActivity();
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAddCustomActivity()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/40 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Assigned Activities Order & List */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Assigned Day Schedule ({assignedActivities.length} items)
            </label>

            {assignedActivities.length === 0 ? (
              <div
                className="p-4 rounded-xl border text-center text-xs italic"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                No activities assigned yet. Select from standard TN Assembly activities above or type a custom one.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {assignedActivities.map((act, idx) => (
                  <div
                    key={`${act}_${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border transition"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {act}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-500/20 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === assignedActivities.length - 1}
                        className="p-1 rounded hover:bg-slate-500/20 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(idx)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title="Remove Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border transition hover:bg-slate-500/10 cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : day ? 'Save Changes' : 'Create Event Day'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
