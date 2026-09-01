import React, { useState } from 'react';
import type { CollegeEvent, ChiefGuest } from '../../types';
import { Calendar, MapPin, Edit, Users, Vote, Lock, Play, Plus, Share2, Save, Trash2 } from 'lucide-react';

interface EventOverviewTabProps {
  event: CollegeEvent;
  onUpdateEvent: (updated: CollegeEvent) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EventOverviewTab: React.FC<EventOverviewTabProps> = ({ event, onUpdateEvent, onShowToast }) => {
  // Local state for Chief Guests
  const [guestName, setGuestName] = useState('');
  const [guestDesignation, setGuestDesignation] = useState('');
  const [guestOrg, setGuestOrg] = useState('');

  // Local state for Social Coverage
  const [postLinks, setPostLinks] = useState(event.social_coverage?.post_links || 'https://instagram.com/p/example1\nhttps://instagram.com/p/example2');
  const [totalReach, setTotalReach] = useState(event.social_coverage?.total_reach || '12500');

  const chiefGuests = event.chief_guests || [];

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newGuest: ChiefGuest = {
      id: `cg_${Date.now()}`,
      name: guestName.trim(),
      designation: guestDesignation.trim(),
      organization: guestOrg.trim()
    };

    const updatedEvent = {
      ...event,
      chief_guests: [...chiefGuests, newGuest]
    };

    onUpdateEvent(updatedEvent);
    setGuestName('');
    setGuestDesignation('');
    setGuestOrg('');
    onShowToast('Chief Guest Added', `Added ${newGuest.name} to guest list`, 'success');
  };

  const handleRemoveGuest = (id: string) => {
    const updatedEvent = {
      ...event,
      chief_guests: chiefGuests.filter(g => g.id !== id)
    };
    onUpdateEvent(updatedEvent);
    onShowToast('Guest Removed', 'Removed guest from list', 'info');
  };

  const handleSaveSocialCoverage = () => {
    const updatedEvent = {
      ...event,
      social_coverage: {
        post_links: postLinks,
        total_reach: totalReach
      }
    };
    onUpdateEvent(updatedEvent);
    onShowToast('Social Coverage Saved', 'Updated social reach & links', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Event Details Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">THE EVENT</span>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{event.college_name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Level: <strong>{event.level}</strong></span>
              <span>•</span>
              <span>Chapter: <strong>{event.chapter}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {event.dates}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {event.status}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.location}
        </p>
      </div>

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900">{event.participant_count}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Participants</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900">{event.elections_count || 3}</p>
            <p className="text-xs text-slate-500 mt-0.5">Key Elections</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Vote className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900">{event.is_locked ? 'Locked' : 'Unlocked'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Allocations & Cabinet</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
            <Lock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Next Steps Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Steps</span>
        <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Go Live</h4>
              <p className="text-[11px] text-emerald-800">Start Day 1 of the parliament session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Reporting Section */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Event Reporting</span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Chief Guests Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" /> Chief Guests
            </h4>

            {chiefGuests.length > 0 && (
              <div className="space-y-2">
                {chiefGuests.map(cg => (
                  <div key={cg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{cg.name}</p>
                      <p className="text-[11px] text-slate-500">{cg.designation} • {cg.organization}</p>
                    </div>
                    <button onClick={() => handleRemoveGuest(cg.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddGuest} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. V. Rajeshwari IAS"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. District Collector"
                    value={guestDesignation}
                    onChange={(e) => setGuestDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. District Admin"
                    value={guestOrg}
                    onChange={(e) => setGuestOrg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add guest
              </button>
            </form>
          </div>

          {/* Social Coverage Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" /> Social Coverage
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Post links (one URL per line)</label>
                <textarea
                  rows={3}
                  placeholder="https://instagram.com/p/..."
                  value={postLinks}
                  onChange={(e) => setPostLinks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total reach / impressions</label>
                <input
                  type="text"
                  placeholder="e.g. 12500"
                  value={totalReach}
                  onChange={(e) => setTotalReach(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSocialCoverage}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
