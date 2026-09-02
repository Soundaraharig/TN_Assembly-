import React, { useState, useEffect } from 'react';
import type { CollegeEvent, EventStage, EventStatus } from '../../types';
import { Building2, MapPin, Calendar, Save, X } from 'lucide-react';

interface EditEventModalProps {
  isOpen: boolean;
  event: CollegeEvent | null;
  onClose: () => void;
  onSave: (updatedEvent: CollegeEvent) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSave
}) => {
  const [collegeName, setCollegeName] = useState('');
  const [location, setLocation] = useState('');
  const [dates, setDates] = useState('');
  const [eventStage, setEventStage] = useState<EventStage>('College Round');
  const [status, setStatus] = useState<EventStatus>('Pre-Event');
  const [coordName, setCoordName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');

  useEffect(() => {
    if (event) {
      setCollegeName(event.college_name || '');
      setLocation(event.location || 'Main Auditorium');
      setDates(event.dates || 'Day 1 & Day 2');
      setEventStage(event.event_stage || 'College Round');
      setStatus(event.status || 'Pre-Event');
      setCoordName(event.assigned_coordinator_name || '');
      setCoordEmail(event.assigned_coordinator_email || '');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim()) return;

    onSave({
      ...event,
      college_name: collegeName.trim(),
      location: location.trim(),
      dates: dates.trim(),
      event_stage: eventStage,
      status,
      assigned_coordinator_name: coordName.trim(),
      assigned_coordinator_email: coordEmail.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-5 animate-scale-in"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Edit Assembly Event Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              College / Institution Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full p-2.5 pl-8 rounded-xl border focus:outline-none font-bold"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Event Stage</label>
              <select
                value={eventStage}
                onChange={(e) => setEventStage(e.target.value as EventStage)}
                className="w-full p-2.5 rounded-xl border focus:outline-none font-semibold"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="College Round">College Round</option>
                <option value="District Round">District Round</option>
                <option value="State Quarter Finals">State Quarter Finals</option>
                <option value="State Semi Finals">State Semi Finals</option>
                <option value="Final Round">Final Round</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full p-2.5 rounded-xl border focus:outline-none font-semibold"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="Draft">Draft</option>
                <option value="Pre-Event">Pre-Event</option>
                <option value="Day 1 Live">Day 1 Live</option>
                <option value="Day 2 Live">Day 2 Live</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Dates</label>
              <div className="relative">
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  placeholder="e.g. Day 1 & Day 2"
                  className="w-full p-2.5 pl-8 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Venue / Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  className="w-full p-2.5 pl-8 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
            <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-wider">Assigned Coordinator</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input
                  type="text"
                  value={coordName}
                  onChange={(e) => setCoordName(e.target.value)}
                  className="w-full p-2 rounded-lg border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  value={coordEmail}
                  onChange={(e) => setCoordEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-semibold cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--amber)' }}
            >
              <Save className="w-4 h-4" /> Save Event Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
