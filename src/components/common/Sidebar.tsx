import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  UserCheck,
  FileSpreadsheet,
  HelpCircle,
  BookOpen,
  Shield,
  Shuffle,
  Landmark,
  Scale,
  HeartHandshake,
  Sliders,
  Vote,
  FileText,
  MessageSquare,
  Grid,
  Camera,
  Trophy,
  Award,
  MessageCircle,
  BarChart
} from 'lucide-react';

export type ActiveNavTab =
  | 'overview'
  | 'team'
  | 'checklist'
  | 'agenda'
  | 'participants'
  | 'nominations'
  | 'questionnaire'
  | 'committees'
  | 'parties'
  | 'allocation'
  | 'cabinet'
  | 'jury'
  | 'volunteers'
  | 'control'
  | 'elections'
  | 'proceedings'
  | 'chat'
  | 'scoregrid'
  | 'media'
  | 'awards'
  | 'chapterawards'
  | 'feedback'
  | 'report';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const beforeEventItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'team', label: 'Team', icon: Users, completed: true },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'agenda', label: 'Agenda', icon: Clock },
    { id: 'participants', label: 'Participants', icon: UserCheck, completed: true },
    { id: 'nominations', label: 'Nominations', icon: FileSpreadsheet },
    { id: 'questionnaire', label: 'Questionnaire', icon: HelpCircle },
    { id: 'committees', label: 'Committees', icon: BookOpen, completed: true },
    { id: 'parties', label: 'Parties', icon: Shield, completed: true },
    { id: 'allocation', label: 'Allocation', icon: Shuffle, completed: true },
    { id: 'cabinet', label: 'Cabinet', icon: Landmark },
    { id: 'jury', label: 'Jury', icon: Scale, completed: true },
    { id: 'volunteers', label: 'Volunteers', icon: HeartHandshake, completed: true }
  ];

  const eventDayItems = [
    { id: 'control', label: 'Control', icon: Sliders },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'proceedings', label: 'Proceedings', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'scoregrid', label: 'Score Grid', icon: Grid },
    { id: 'media', label: 'Media', icon: Camera }
  ];

  const afterEventItems = [
    { id: 'awards', label: 'Awards', icon: Trophy },
    { id: 'chapterawards', label: 'Chapter Awards', icon: Award },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
    { id: 'report', label: 'Report', icon: BarChart }
  ];

  return (
    <aside className="sidebar-theme w-56 p-3 flex flex-col shrink-0 min-h-[calc(100vh-60px)]">
      <div className="space-y-6 text-xs overflow-y-auto pr-1">
        
        {/* BEFORE THE EVENT */}
        <div>
          <h4 className="px-3 text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            BEFORE THE EVENT
          </h4>
          <nav className="space-y-0.5">
            {beforeEventItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as ActiveNavTab)}
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

                  {item.completed ? (
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
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--border)' }}></span>
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
                  onClick={() => onSelectTab(item.id as ActiveNavTab)}
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
                  onClick={() => onSelectTab(item.id as ActiveNavTab)}
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
    </aside>
  );
};
