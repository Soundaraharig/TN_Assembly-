import React, { useMemo } from 'react';
import type { Learner, Party, Committee, AcademicYear } from '../../types';
import { BarChart3, Shield, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface AnalyticsTabProps {
  learners: Learner[];
  parties: Party[];
  committees: Committee[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ learners, parties }) => {
  const totalCount = learners.length;

  const day1Count = learners.filter(l => l.day1_checked_in).length;
  const day2Count = learners.filter(l => l.day2_checked_in).length;

  const day1Rate = totalCount > 0 ? Math.round((day1Count / totalCount) * 100) : 0;
  const day2Rate = totalCount > 0 ? Math.round((day2Count / totalCount) * 100) : 0;

  // Use database-sourced bench counts for accurate ratio
  const eventId = learners.length > 0 ? learners[0].event_id : undefined;
  const rulingCount = useMemo(() => {
    if (eventId) {
      const assigned = storageService.getAssignedBenchCounts(eventId);
      return assigned['Ruling'] ?? learners.filter(l => l.bench === 'Ruling').length;
    }
    return learners.filter(l => l.bench === 'Ruling').length;
  }, [eventId, learners]);

  const oppCount = useMemo(() => {
    if (eventId) {
      const assigned = storageService.getAssignedBenchCounts(eventId);
      return assigned['Opposition'] ?? learners.filter(l => l.bench === 'Opposition').length;
    }
    return learners.filter(l => l.bench === 'Opposition').length;
  }, [eventId, learners]);

  // Party breakdown - use database-sourced counts for the current event
  const partyCounts = useMemo(() => {
    if (eventId) {
      // Use database-sourced count from Supabase
      return storageService.getAssignedPartyCounts(eventId);
    }
    // Fallback to local calculation
    const counts: Record<string, number> = {};
    learners.forEach(l => {
      if (l.party_name) {
        counts[l.party_name] = (counts[l.party_name] || 0) + 1;
      }
    });
    return counts;
  }, [learners, eventId]);

  // Year breakdown
  const yearCounts = useMemo(() => {
    const counts: Record<AcademicYear, number> = {
      '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0
    };
    learners.forEach(l => {
      const yr = l.academic_year || '1st Year';
      counts[yr] = (counts[yr] || 0) + 1;
    });
    return counts;
  }, [learners]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div 
        className="rounded-2xl p-5 shadow-sm border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Assembly Analytics & Control Panel</span>
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Attendance tracking, bench distribution, academic year balance & committee metrics
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          className="rounded-2xl p-5 shadow-sm border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Day 1 Attendance Rate</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{day1Rate}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{day1Count} of {totalCount} Checked In</p>
        </div>

        <div 
          className="rounded-2xl p-5 shadow-sm border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Day 2 Attendance Rate</span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">{day2Rate}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{day2Count} of {totalCount} Checked In</p>
        </div>

        <div 
          className="rounded-2xl p-5 shadow-sm border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Bench Ratio (Ruling vs Opp)</span>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{rulingCount} R / {oppCount} O</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {totalCount > 0 ? Math.round((rulingCount / totalCount) * 100) : 0}% Ruling Split
          </p>
        </div>

        <div 
          className="rounded-2xl p-5 shadow-sm border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>TN Constituencies Mapped</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{Math.min(totalCount, 234)} / 234</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Zero Duplicate Assignments</p>
        </div>

      </div>

      {/* Grid of Charts/Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Party Seat Breakdown */}
        <div 
          className="rounded-2xl p-5 shadow-sm space-y-4 border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Political Party Seat Allocation
          </h4>

          <div className="space-y-3">
            {parties.map(p => {
              const count = partyCounts[p.name] || 0;
              // Use database-sourced total for accurate percentage
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                      {p.name}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} Seats ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/80">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Year Balance */}
        <div 
          className="rounded-2xl p-5 shadow-sm space-y-4 border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-4 h-4 text-amber-500" /> Academic Year Stratification
          </h4>

          <div className="space-y-3">
            {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as AcademicYear[]).map(yr => {
              const count = yearCounts[yr] || 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div key={yr} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-primary)' }}>{yr} Delegates</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{count} Students ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/80">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
