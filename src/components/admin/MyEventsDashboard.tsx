import React, { useState } from 'react';
import type { CollegeEvent, Coordinator } from '../../types';
import { CreateEventModal } from './CreateEventModal';
import { Search, Plus, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';

interface MyEventsDashboardProps {
  events: CollegeEvent[];
  coordinators: Coordinator[];
  onCreateEvent: (collegeName: string, coordName: string, coordEmail: string, password: string) => void;
  onSelectEvent: (event: CollegeEvent) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const MyEventsDashboard: React.FC<MyEventsDashboardProps> = ({
  events,
  onCreateEvent,
  onSelectEvent,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('South - Tamil Nadu 3');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  const filteredEvents = events.filter(e => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesName = e.college_name.toLowerCase().includes(q);
      const matchesLoc = e.location.toLowerCase().includes(q);
      const matchesChap = e.chapter.toLowerCase().includes(q);
      if (!matchesName && !matchesLoc && !matchesChap) return false;
    }
    if (statusFilter !== 'All statuses' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Organiser Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">ORGANISER</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Events</h2>
          <p className="text-xs text-slate-500">Manage your Young Indians Parliament & TN Assembly events</p>
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

      {/* Search & Filter Toolbar Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event, chapter or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Statuses Dropdown & Sort */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="All statuses">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Day 2 Live">Day 2 Live</option>
              <option value="Pre-Event">Pre-Event</option>
            </select>

            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
              <option>Recently created</option>
              <option>Alphabetical</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pl-2 cursor-pointer">
              <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-400" />
              <span>Show demo</span>
            </label>
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium border-t border-slate-100 pt-3">
          {['All regions', 'East 0', 'West 0', 'North 0', 'North East 0', 'South - Tamil Nadu 3', 'South - TK/KA/KL/AP 0'].map((reg) => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                activeRegion === reg
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 font-medium pt-1">
          Showing {filteredEvents.length} of {events.length} events
        </p>

      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredEvents.map((event) => {
          const isCompleted = event.status === 'Completed';
          const isLive = event.status === 'Day 2 Live' || event.status === 'Day 1 Live';

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 flex flex-col justify-between group hover:border-amber-400"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
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

                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
                  {event.college_name}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{event.dates}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{event.participant_count} participants</span>
                </p>
              </div>

            </div>
          );
        })}
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
