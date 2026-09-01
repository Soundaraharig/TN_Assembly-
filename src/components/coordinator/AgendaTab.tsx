import React, { useState } from 'react';
import type { AgendaItem } from '../../types';
import { Clock, Plus, Radio, User, X } from 'lucide-react';

interface AgendaTabProps {
  agenda: AgendaItem[];
  eventId: string;
  onAddAgendaItem: (item: Partial<AgendaItem>) => void;
  onSetCurrentItem: (itemId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgendaTab: React.FC<AgendaTabProps> = ({
  agenda,
  eventId,
  onAddAgendaItem,
  onSetCurrentItem,
  onShowToast
}) => {
  const [activeDay, setActiveDay] = useState<'Day 1' | 'Day 2'>('Day 1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');

  const filteredAgenda = agenda.filter(a => a.day === activeDay);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;

    onAddAgendaItem({
      event_id: eventId,
      day: activeDay,
      time: time.trim(),
      title: title.trim(),
      description: description.trim(),
      speaker_role: speakerRole.trim()
    });

    onShowToast('Agenda Item Added', `Added session: ${title}`, 'success');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Assembly Session Agenda & Timeline</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure Day 1 & Day 2 legislative timetable and mark live session progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Day Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveDay('Day 1')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDay === 'Day 1'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Day 1 Schedule
            </button>
            <button
              onClick={() => setActiveDay('Day 2')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDay === 'Day 2'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Day 2 Schedule
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Session</span>
          </button>
        </div>
      </div>

      {/* Agenda Timeline List */}
      <div className="space-y-3">
        {filteredAgenda.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all ${
              item.is_current
                ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-950/30'
                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-amber-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {item.time}
                  </span>
                  {item.is_current && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                      <Radio className="w-3 h-3" /> Live Session Now
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                {item.speaker_role && (
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> Lead: {item.speaker_role}
                  </p>
                )}
              </div>

              {!item.is_current && (
                <button
                  onClick={() => {
                    onSetCurrentItem(item.id);
                    onShowToast('Live Session Updated', `Marked "${item.title}" as current session`, 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 shrink-0 self-start sm:self-center"
                >
                  Set as Current Session
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Agenda Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Add Agenda Session ({activeDay})</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:00 AM - 11:30 AM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Motion Debate on State Education Reform"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Description</label>
                <textarea
                  rows={3}
                  placeholder="Details of proceedings..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Speaker / Lead Role</label>
                <input
                  type="text"
                  placeholder="e.g. Speaker of the Assembly"
                  value={speakerRole}
                  onChange={(e) => setSpeakerRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
