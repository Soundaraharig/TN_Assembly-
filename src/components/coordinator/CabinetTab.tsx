import React from 'react';
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
    <div className="space-y-6">
      
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-600" />
            <span>Youth Cabinet & Parliament Leadership</span>
          </h3>
          <p className="text-xs text-slate-500">
            Formed Council of Ministers, Assembly Speaker, and Opposition Shadow Cabinet
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
          {cabinetList.length} Cabinet Positions Assigned
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cabinetList.length === 0 ? (
          <div className="md:col-span-2 py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <p className="text-sm italic">No cabinet positions assigned yet. Run Auto-Allocation to form cabinet.</p>
          </div>
        ) : (
          cabinetList.map((minister) => (
            <div key={minister.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-extrabold text-lg flex items-center justify-center shrink-0">
                {minister.full_name.charAt(0)}
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {minister.role}
                </span>
                <h4 className="text-base font-extrabold text-slate-900">{minister.full_name}</h4>
                <p className="text-xs text-slate-500">
                  {minister.party_name} • <span className="font-semibold text-slate-700">{minister.constituency_name || 'MLA'}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
