import React, { useState } from 'react';
import type { CollegeEvent, Coordinator } from '../../types';
import { CreateEventModal } from './CreateEventModal';
import { EditCoordinatorModal } from './EditCoordinatorModal';
import { Plus, ArrowRight, Calendar, MapPin, Users, KeyRound, UserCheck } from 'lucide-react';

interface MyEventsDashboardProps {
  events: CollegeEvent[];
  coordinators: Coordinator[];
  onCreateEvent: (collegeName: string, coordName: string, coordEmail: string, password: string) => void;
  onUpdateCoordinator?: (coordinator: Coordinator) => void;
  onSelectEvent: (event: CollegeEvent) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const MyEventsDashboard: React.FC<MyEventsDashboardProps> = ({
  events,
  coordinators,
  onCreateEvent,
  onUpdateCoordinator,
  onSelectEvent,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);
  const [editingEventName, setEditingEventName] = useState<string>('');

  const handleOpenEditCoordinator = (e: React.MouseEvent, event: CollegeEvent) => {
    e.stopPropagation(); // Don't trigger event selection
    // Find matching coordinator for this event
    const coord = coordinators.find(c => c.event_id === event.id || c.email.toLowerCase() === event.assigned_coordinator_email?.toLowerCase());

    if (coord) {
      setEditingCoordinator(coord);
    } else {
      // Create transient coordinator object if not found
      setEditingCoordinator({
        id: `coord_${event.id}`,
        event_id: event.id,
        name: event.assigned_coordinator_name || 'Coordinator',
        email: event.assigned_coordinator_email || 'coordinator@college.edu',
        password_hash: 'coord123',
        raw_temp_password: 'coord123'
      });
    }
    setEditingEventName(event.college_name);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Organiser Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">ORGANISER</span>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>My Events</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your Young Indians Parliament & TN Assembly events</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Onboarding Started', 'Welcome to TN Assembly Organiser onboarding', 'info')}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Start onboarding</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {events.map((event) => {
          const isCompleted = event.status === 'Completed';
          const isLive = event.status === 'Day 2 Live' || event.status === 'Day 1 Live';
          const coord = coordinators.find(c => c.event_id === event.id || c.email.toLowerCase() === event.assigned_coordinator_email?.toLowerCase());
          const coordName = coord?.name || event.assigned_coordinator_name || 'Assigned Coordinator';
          const coordEmail = coord?.email || event.assigned_coordinator_email || 'No email';

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="card p-5 cursor-pointer space-y-4 flex flex-col justify-between group transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {event.event_stage}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : isLive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold group-hover:text-amber-500 transition-colors leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {event.college_name}
                </h3>
              </div>

              {/* Coordinator Badge & Reset Button */}
              <div
                className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <UserCheck className="w-4 h-4 shrink-0 text-amber-500" />
                  <div className="truncate">
                    <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {coordName}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {coordEmail}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleOpenEditCoordinator(e, event)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border hover:border-amber-500 hover:text-amber-500 transition-all shrink-0 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  title="Reset email, name, or password"
                >
                  <KeyRound className="w-3 h-3 text-amber-500" />
                  <span>Reset Credentials</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span>{event.dates}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="truncate">{event.location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{event.participant_count} participants</span>
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(cName, coordName, coordEmail, pass) => {
          onCreateEvent(cName, coordName, coordEmail, pass);
          onShowToast('Event Created Successfully', `Provisioned event for ${cName}`, 'success');
        }}
      />

      {/* Edit Coordinator Credentials Modal */}
      <EditCoordinatorModal
        isOpen={!!editingCoordinator}
        coordinator={editingCoordinator}
        eventName={editingEventName}
        onClose={() => setEditingCoordinator(null)}
        onSave={(updated) => {
          if (onUpdateCoordinator) {
            onUpdateCoordinator(updated);
            onShowToast('Coordinator Credentials Updated', `Updated access for ${updated.name} (${updated.email})`, 'success');
          }
        }}
      />

    </div>
  );
};

