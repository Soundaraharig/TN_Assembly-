import React from 'react';
import {
  LayoutDashboard,
  Users,
  
  Clock,
  UserCheck,
  FileSpreadsheet,
  
  BookOpen,
  Shield,
  Shuffle,
  Landmark,
  Scale,
  HeartHandshake,
  Sliders,
  Vote,
  FileText,
  
  Grid,
  
  Trophy,
  
  MessageCircle,
  BarChart,
  X
} from 'lucide-react';

export type ActiveNavTab =
  | 'overview'
  | 'team'
  | 'agenda'
  | 'participants'
  | 'nominations'
  | 'committees'
  | 'parties'
  | 'allocation'
  | 'cabinet'
  | 'jury'
  | 'volunteers'
  | 'control'
  | 'elections'
  | 'proceedings'
  | 'awards'
  | 'feedback'
  | 'report';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  completedTabs?: Set<ActiveNavTab>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  completedTabs
}) => {
  const beforeEventItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Clock },
    { id: 'participants', label: 'Participants', icon: UserCheck },
    { id: 'nominations', label: 'Nominations', icon: FileSpreadsheet },
    { id: 'committees', label: 'Committees', icon: BookOpen },
    { id: 'parties', label: 'Parties', icon: Shield },
    { id: 'allocation', label: 'Allocation', icon: Shuffle },
    { id: 'cabinet', label: 'Cabinet', icon: Landmark },
    { id: 'jury', label: 'Jury', icon: Scale },
    { id: 'volunteers', label: 'Volunteers', icon: HeartHandshake }
  ];

  const eventDayItems = [
    { id: 'control', label: 'Control', icon: Sliders },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'proceedings', label: 'Proceedings', icon: FileText },
    { id: 'scoregrid', label: 'Score Grid', icon: Grid }
  ];

  const afterEventItems = [
    { id: 'awards', label: 'Awards', icon: Trophy },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
    { id: 'report', label: 'Report', icon: BarChart }
  ];

  const handleTabClick = (tabId: ActiveNavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="space-y-6 text-xs overflow-y-auto pr-1 pb-10">
      
      {/* BEFORE THE EVENT */}
      <div>
        <h4 className="px-3 text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          BEFORE THE EVENT
        </h4>
        <nav className="space-y-0.5">
          {beforeEventItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDone = completedTabs ? completedTabs.has(item.id as ActiveNavTab) : false;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as ActiveNavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'sidebar-item-active shadow-sm'
                    : 'sidebar-item-hover'
                }`}
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--amber)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>

                {isDone ? (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border"
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      borderColor: 'var(--accent)'
                    }}
                  >
                    ✓
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border opacity-30" style={{ borderColor: 'var(--border)' }}></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* EVENT DAY */}
      <div>
        <h4 className="px-3 text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          EVENT DAY
        </h4>
        <nav className="space-y-0.5">
          {eventDayItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as ActiveNavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'sidebar-item-active shadow-sm'
                    : 'sidebar-item-hover'
                }`}
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--amber)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* AFTER THE EVENT */}
      <div>
        <h4 className="px-3 text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          AFTER THE EVENT
        </h4>
        <nav className="space-y-0.5">
          {afterEventItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as ActiveNavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'sidebar-item-active shadow-sm'
                    : 'sidebar-item-hover'
                }`}
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--amber)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (Permanent vertical menu on lg screens) */}
      <aside className="hidden lg:flex sidebar-theme w-60 p-3 flex-col shrink-0 min-h-[calc(100vh-60px)] sticky top-[57px] self-start max-h-[calc(100vh-60px)]">
        {navContent}
      </aside>

      {/* 2. Mobile Off-Canvas Drawer (Slide-over overlay on mobile screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="relative z-50 w-72 max-w-[85vw] h-full p-4 flex flex-col shadow-2xl sidebar-theme animate-slide-up"
            style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--amber)' }}>
                Navigation Menu
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
