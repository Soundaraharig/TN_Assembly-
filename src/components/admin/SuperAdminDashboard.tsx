import React, { useState } from 'react';
import type { CollegeEvent, Coordinator, Learner } from '../../types';
import { CreateEventModal } from './CreateEventModal';
import { Building2, Users, ShieldCheck, Plus, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface SuperAdminDashboardProps {
  events: CollegeEvent[];
  coordinators: Coordinator[];
  learners: Learner[];
  onCreateEvent: (collegeName: string, coordName: string, coordEmail: string, password: string) => void;
  onSelectEvent: (event: CollegeEvent) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  events,
  coordinators,
  learners,
  onCreateEvent,
  onSelectEvent,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (coord: Coordinator, collegeName: string) => {
    const text = `TN Assembly Credentials\nEvent: ${collegeName}\nCoordinator: ${coord.name}\nEmail: ${coord.email}\nPassword: ${coord.password_hash}`;
    navigator.clipboard.writeText(text);
    setCopiedId(coord.id);
    onShowToast('Credentials Copied', `Copied login info for ${coord.name}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeEventsCount = events.filter(e => e.status === 'Day 1 Live' || e.status === 'Day 2 Live').length;
  const totalLearnersCount = learners.length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-500/20 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> State Super Admin Control
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Tamil Nadu Youth Assembly Event Management
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Provision college events across Tamil Nadu, auto-generate coordinator credentials, monitor delegate enrollment, and track stage progression.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-xl shadow-amber-950/60 flex items-center gap-2 hover:scale-105 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total College Events</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{events.length}</p>
          <p className="text-xs text-amber-400 mt-1">{activeEventsCount} Live Events Active</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assigned Coordinators</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{coordinators.length}</p>
          <p className="text-xs text-emerald-400 mt-1">Credentials Active</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Enrolled Student Delegates</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalLearnersCount}</p>
          <p className="text-xs text-blue-400 mt-1">Learners across events</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assembly Status</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-400 mt-2">Active</p>
          <p className="text-xs text-slate-400 mt-1">Statewide Network</p>
        </div>

      </div>

      {/* Events & Provisioned Credentials Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">College Events & Provisioned Coordinators</h3>
            <p className="text-xs text-slate-400">Manage credentials and stage progression</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{events.length} Events Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">College / Event Name</th>
                <th className="py-3.5 px-4">Coordinator Details</th>
                <th className="py-3.5 px-4">Auto-Generated Password</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {events.map((event) => {
                const coord = coordinators.find(c => c.event_id === event.id);
                const eventLearnersCount = learners.filter(l => l.event_id === event.id).length;

                return (
                  <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-bold">{event.college_name}</p>
                          <p className="text-[11px] text-slate-400">{eventLearnersCount} Delegates Enrolled</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {coord ? (
                        <div>
                          <p className="font-semibold text-slate-100">{coord.name}</p>
                          <p className="text-[11px] text-slate-400">{coord.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {coord ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-amber-300 font-mono text-xs font-bold">
                            {coord.password_hash}
                          </code>
                          <button
                            onClick={() => handleCopy(coord, event.college_name)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            title="Copy Credentials"
                          >
                            {copiedId === coord.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {event.event_stage}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        event.status.includes('Live')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : event.status === 'Pre-Event'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectEvent(event)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-950/40 cursor-pointer"
                      >
                        <span>Manage Event</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(cName, coordName, coordEmail, pass) => {
          onCreateEvent(cName, coordName, coordEmail, pass);
          onShowToast('Event Created Successfully', `Provisioned event for ${cName}`, 'success');
        }}
      />

    </div>
  );
};
