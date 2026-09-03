import React from 'react';
import type { CollegeEvent } from '../../types';
import { Calendar, MapPin, Users, Vote, Lock, Play, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';

interface EventOverviewTabProps {
  event: CollegeEvent;
  participantCount?: number;
  onUpdateEvent: (updated: CollegeEvent) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EventOverviewTab: React.FC<EventOverviewTabProps> = ({
  event,
  participantCount,
  onUpdateEvent,
  onShowToast
}) => {
  const handleToggleLock = () => {
    const updated = { ...event, is_locked: !event.is_locked };
    onUpdateEvent(updated);
    onShowToast(
      updated.is_locked ? 'Event Locked' : 'Event Unlocked',
      updated.is_locked ? 'Allocations & Cabinet are locked for live session' : 'Unlocked for modifications',
      'info'
    );
  };

  const handleStartSession = () => {
    const updated = { ...event, status: 'Day 1 Live' as const };
    onUpdateEvent(updated);
    onShowToast('House in Session', 'Day 1 of the Youth Parliament has commenced!', 'success');
  };

  const displayCount = participantCount !== undefined ? participantCount : (event.participant_count || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Event Details Header */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm transition-all"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <span className="text-[10px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--amber)' }}>
          THE EVENT • TAMIL NADU YOUTH ASSEMBLY
        </span>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 my-3" style={{ borderColor: 'var(--border-soft)' }}>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {event.college_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 opacity-70" /> Level: <strong style={{ color: 'var(--text-primary)' }}>{event.level}</strong>
              </span>
              <span>•</span>
              <span>Chapter: <strong style={{ color: 'var(--text-primary)' }}>{event.chapter}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 opacity-70" /> {event.dates}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                background: event.status.includes('Live') ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                color: event.status.includes('Live') ? 'var(--accent)' : 'var(--text-secondary)',
                borderColor: event.status.includes('Live') ? 'var(--accent)' : 'var(--border)'
              }}
            >
              ● {event.status}
            </span>
          </div>
        </div>

        <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" /> {event.location}
        </p>
      </div>

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div
          className="rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {displayCount}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Registered Delegates
            </p>
            <span className="text-[10px] mt-1 inline-block font-semibold" style={{ color: 'var(--accent)' }}>
              Official TN Constituency Mappings
            </span>
          </div>
          <div className="p-3.5 rounded-2xl" style={{ backgroundColor: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {event.elections_count || 3}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Leadership Elections
            </p>
            <span className="text-[10px] mt-1 inline-block font-semibold" style={{ color: 'var(--accent)' }}>
              Speaker, CM & Opposition Leader
            </span>
          </div>
          <div className="p-3.5 rounded-2xl" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Vote className="w-6 h-6" />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {event.is_locked ? 'Locked' : 'Unlocked'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Allocations & Cabinet Roster
            </p>
            <button
              onClick={handleToggleLock}
              className="text-[10px] mt-1 font-bold underline cursor-pointer hover:opacity-80"
              style={{ color: 'var(--amber)' }}
            >
              {event.is_locked ? 'Click to Unlock for Edits' : 'Click to Lock Roster'}
            </button>
          </div>
          <div
            onClick={handleToggleLock}
            className="p-3.5 rounded-2xl cursor-pointer hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <Lock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Assembly Live Next Steps Banner */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
          PARLIAMENT STATUS & ACTION
        </span>

        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl text-white shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {event.status.includes('Live') ? 'Assembly Session Active' : 'Ready to Commence Session'}
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {event.status.includes('Live')
                  ? 'Day 1 Hansard proceedings, Question Hour, and live division voting are active.'
                  : 'Commence Day 1 proceedings, initiate Question Hour, and enable digital floor voting.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Zap className="w-4 h-4" />
            <span>{event.status.includes('Live') ? 'Session Running (Active)' : 'Start Day 1 Now'}</span>
          </button>
        </div>
      </div>

      {/* Assembly Protocol Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div
          className="rounded-2xl p-5 border shadow-sm space-y-3"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-4 h-4 text-emerald-500" /> TN Assembly Parliamentary Rules
          </h4>
          <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Official 234 TN Assembly constituencies mapped with zero duplicates.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Multi-tiered stratification across 1st, 2nd, 3rd & 4th academic years.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Council of Ministers & Shadow Cabinet formed with portfolio allocations.</span>
            </li>
          </ul>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm space-y-3"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-4 h-4 text-amber-500" /> Digital Parliament Suite
          </h4>
          <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>Instant division voting and live yes/no polls for MLAs and Cabinet.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>Speaker Gavel control, countdown timer and real-time floor speech queue.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span>Jury live score grid, automated leaderboard and certificate generation.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
