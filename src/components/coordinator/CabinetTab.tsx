import type { Learner } from '../../types';
import { Landmark, Sparkles } from 'lucide-react';

interface CabinetTabProps {
  learners: Learner[];
}

export const CabinetTab: React.FC<CabinetTabProps> = ({ learners }) => {
  // Cabinet ministers & leadership roles
  const cabinetList = learners.filter(l => 
    l.role && (
      l.role.includes('Minister') ||
      l.role.includes('Chief') ||
      l.role.includes('Speaker') ||
      l.role.includes('Leader')
    )
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Youth Cabinet & Parliament Leadership
            </h3>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Council of Ministers, Assembly Presiding Officers, and Opposition Shadow Cabinet formed via Auto-Allocation.
          </p>
        </div>

        <span
          className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs border shrink-0 text-center"
          style={{
            backgroundColor: 'var(--amber-soft)',
            color: 'var(--amber)',
            borderColor: 'var(--amber)'
          }}
        >
          {cabinetList.length} Cabinet Positions Assigned
        </span>
      </div>

      {/* Grid of Ministers & Leadership Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cabinetList.length === 0 ? (
          <div
            className="md:col-span-2 py-14 text-center rounded-2xl border italic text-xs space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <p className="text-sm font-semibold">No cabinet positions assigned yet.</p>
            <p>Go to the <strong>Allocation Tab</strong> and click <strong>"⚡ Run Auto-Allocation Now"</strong> to instantly assign the Council of Ministers.</p>
          </div>
        ) : (
          cabinetList.map((minister) => (
            <div
              key={minister.id}
              className="rounded-2xl p-5 border shadow-sm flex items-start gap-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl border shadow-sm flex items-center justify-center font-black text-lg shrink-0"
                style={{ backgroundColor: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--amber)' }}
              >
                {minister.full_name.charAt(0)}
              </div>

              <div className="space-y-1 flex-1">
                <span
                  className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1"
                  style={{ color: 'var(--amber)' }}
                >
                  <Sparkles className="w-3 h-3" /> {minister.role}
                </span>
                <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {minister.full_name}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {minister.party_name} • <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{minister.constituency_name || 'MLA'}</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] pt-1" style={{ color: 'var(--text-muted)' }}>
                  <span className={`px-2 py-0.2 rounded font-bold ${minister.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {minister.bench} Bench
                  </span>
                  <span>•</span>
                  <span>Code: <code className="font-mono font-bold text-amber-500">{minister.access_code}</code></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
