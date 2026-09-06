import React, { useState, useMemo } from 'react';
import type { AgendaItem, AgendaDay, AgendaStatus, AgendaCategory } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Clock,
  Plus,
  Radio,
  User,
  X,
  GripVertical,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AgendaTabProps {
  agenda: AgendaItem[];
  eventId: string;
  userRole?: string;
  onAddAgendaItem: (item: Partial<AgendaItem>) => void;
  onUpdateAgendaItem?: (item: AgendaItem) => void;
  onDeleteAgendaItem?: (itemId: string) => void;
  onDuplicateAgendaItem?: (itemId: string) => void;
  onReorderAgendaItems?: (day: AgendaDay, orderedIds: string[]) => void;
  onToggleEnableAgendaItem?: (itemId: string) => void;
  onSetAgendaStatus?: (itemId: string, status: AgendaStatus) => void;
  onSetCurrentItem: (itemId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_OPTIONS: AgendaCategory[] = [
  'General',
  'Voting',
  'Speaker Election',
  'Committee Discussion',
  'Break',
  'Ceremony',
  'Question Hour',
  'Bill Presentation',
  'Valedictory',
  'Inaugural',
  'Oath Taking',
  'Party Formation',
  'Opening Speech',
  'Adjournment',
  'Cabinet Intro',
  'Zero Hour'
];

const DURATION_PRESETS = [5, 10, 15, 30, 45, 60, 90, 105, 120];

export const AgendaTab: React.FC<AgendaTabProps> = ({
  agenda = [],
  eventId,
  onAddAgendaItem,
  onUpdateAgendaItem,
  onDeleteAgendaItem,
  onDuplicateAgendaItem,
  onReorderAgendaItems,
  onToggleEnableAgendaItem,
  onSetAgendaStatus,
  onSetCurrentItem,
  onShowToast
}) => {
  const [activeDay, setActiveDay] = useState<AgendaDay>('Pre-Event');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AgendaStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AgendaItem | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State (used for both Add & Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDay, setFormDay] = useState<AgendaDay>('Pre-Event');
  const [formDate, setFormDate] = useState('15 Jun 2026');
  const [formTime, setFormTime] = useState('09:00 AM');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formDescription, setFormDescription] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formStatus, setFormStatus] = useState<AgendaStatus>('Upcoming');
  const [formEnabled, setFormEnabled] = useState(true);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Drag & drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Auto-seed if agenda is completely empty for this event
  const currentEventAgenda = useMemo(() => {
    const items = agenda.filter(a => a.event_id === eventId);
    if (items.length === 0 && eventId) {
      return storageService.getAgenda(eventId);
    }
    return items;
  }, [agenda, eventId]);

  // Filter items by active tab day, search, status, and category
  const activeDayItems = useMemo(() => {
    return currentEventAgenda
      .filter(a => a.day === activeDay)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [currentEventAgenda, activeDay]);

  const filteredItems = useMemo(() => {
    return activeDayItems.filter(item => {
      // Search term filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = (item.category || '').toLowerCase().includes(q);
        const matchesSpeaker = (item.speaker_role || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesStatus = (item.status || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesSpeaker && !matchesDesc && !matchesStatus) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [activeDayItems, searchQuery, statusFilter, categoryFilter]);

  // Calculated End Time display for modal form
  const computedFormEndTime = useMemo(() => {
    return storageService.calculateEndTime(formTime, formDuration);
  }, [formTime, formDuration]);

  // Open Modal Helpers
  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormDay(activeDay);
    setFormDate(activeDay === 'Pre-Event' ? '15 Jun 2026' : activeDay === 'Day 1' ? '16 Jun 2026' : '17 Jun 2026');
    setFormTime('09:00 AM');
    setFormDuration(30);
    setFormCategory('General');
    setFormDescription('');
    setFormSpeaker('');
    setFormStatus('Upcoming');
    setFormEnabled(true);
    setIsFormDirty(false);
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: AgendaItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDay(item.day);
    setFormDate(item.date || '15 Jun 2026');
    setFormTime(item.time || '09:00 AM');
    setFormDuration(item.duration_minutes || 30);
    setFormCategory(item.category || 'General');
    setFormDescription(item.description || '');
    setFormSpeaker(item.speaker_role || '');
    setFormStatus(item.status || 'Upcoming');
    setFormEnabled(item.enabled ?? true);
    setIsFormDirty(false);
    setIsAddModalOpen(true);
  };

  const handleCloseModalWithCheck = () => {
    if (isFormDirty) {
      setShowUnsavedPrompt(true);
    } else {
      setIsAddModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      const updated: AgendaItem = {
        ...editingItem,
        title: formTitle.trim(),
        day: formDay,
        date: formDate.trim(),
        time: formTime.trim(),
        duration_minutes: formDuration,
        endTime: computedFormEndTime,
        category: formCategory,
        description: formDescription.trim(),
        speaker_role: formSpeaker.trim(),
        status: formStatus,
        enabled: formEnabled
      };

      if (onUpdateAgendaItem) {
        onUpdateAgendaItem(updated);
      } else {
        storageService.updateAgendaItem(updated);
      }
      onShowToast('Agenda Updated', `Saved changes for "${updated.title}"`, 'success');

      // If day assignment changed, switch active tab to target day so user sees the moved item
      if (formDay !== activeDay) {
        setActiveDay(formDay);
      }
    } else {
      const newItem: Partial<AgendaItem> = {
        event_id: eventId,
        title: formTitle.trim(),
        day: formDay,
        date: formDate.trim(),
        time: formTime.trim(),
        duration_minutes: formDuration,
        endTime: computedFormEndTime,
        category: formCategory,
        description: formDescription.trim(),
        speaker_role: formSpeaker.trim(),
        status: formStatus,
        enabled: formEnabled
      };

      if (onAddAgendaItem) {
        onAddAgendaItem(newItem);
      } else {
        storageService.addAgendaItem(newItem);
      }
      onShowToast('Agenda Item Added', `Created new item: "${newItem.title}"`, 'success');
      
      if (formDay !== activeDay) {
        setActiveDay(formDay);
      }
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
    setIsFormDirty(false);
    setShowUnsavedPrompt(false);
  };

  // Reordering handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const items = [...activeDayItems];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    const orderedIds = items.map(i => i.id);

    if (onReorderAgendaItems) {
      onReorderAgendaItems(activeDay, orderedIds);
    } else {
      storageService.reorderAgendaItems(eventId, activeDay, orderedIds);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= activeDayItems.length - 1) return;
    const items = [...activeDayItems];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    const orderedIds = items.map(i => i.id);

    if (onReorderAgendaItems) {
      onReorderAgendaItems(activeDay, orderedIds);
    } else {
      storageService.reorderAgendaItems(eventId, activeDay, orderedIds);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;

    const items = [...activeDayItems];
    const dragIdx = items.findIndex(i => i.id === draggedItemId);
    const targetIdx = items.findIndex(i => i.id === targetId);

    if (dragIdx === -1 || targetIdx === -1) return;

    const [removed] = items.splice(dragIdx, 1);
    items.splice(targetIdx, 0, removed);

    const orderedIds = items.map(i => i.id);
    if (onReorderAgendaItems) {
      onReorderAgendaItems(activeDay, orderedIds);
    } else {
      storageService.reorderAgendaItems(eventId, activeDay, orderedIds);
    }
    setDraggedItemId(null);
  };

  // Day Quick Switch Action
  const handleQuickDaySwitch = (item: AgendaItem, targetDay: AgendaDay) => {
    if (item.day === targetDay) return;
    const updated = { ...item, day: targetDay };
    if (onUpdateAgendaItem) {
      onUpdateAgendaItem(updated);
    } else {
      storageService.updateAgendaItem(updated);
    }
    onShowToast('Moved Session', `Moved "${item.title}" to ${targetDay}`, 'info');
  };

  // Status badge styling helper
  const renderStatusBadge = (status?: AgendaStatus, isCurrent?: boolean) => {
    if (isCurrent || status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse shrink-0">
          <Radio className="w-3.5 h-3.5" /> ● In Progress
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Done
        </span>
      );
    }
    if (status === 'Skipped') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0">
          — Skipped
        </span>
      );
    }
    // Default: Upcoming
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
        ● Upcoming
      </span>
    );
  };

  // Category chip styling helper
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Voting':
      case 'Speaker Election':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'Break':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Ceremony':
      case 'Inaugural':
      case 'Oath Taking':
      case 'Valedictory':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'Committee Discussion':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
      case 'Question Hour':
      case 'Zero Hour':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Event Agenda Management</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Fresh Event
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Builder & live schedule controller for Pre-Event, Day 1 & Day 2 proceedings
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-inner">
            {(['Pre-Event', 'Day 1', 'Day 2'] as AgendaDay[]).map((day) => {
              const count = currentEventAgenda.filter(a => a.day === day).length;
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{day}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              storageService.resetEventAgendaToDefault(eventId);
              onShowToast('Fresh Agenda Loaded', 'Seeded default upcoming agenda for Pre-Event, Day 1 & Day 2', 'success');
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Reset or seed full fresh default agenda items"
          >
            <span>✨ Seed Fresh Agenda</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Agenda Item</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search agenda by title, category, speaker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {(['All', 'Upcoming', 'In Progress', 'Completed', 'Skipped'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st === 'Completed' ? 'Done' : st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
            >
              <option value="All">All Categories ▼</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Agenda Items List */}
      {filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No agenda items yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                ? 'No items match your active search or filter criteria. Try clearing filters.'
                : `Create your first agenda item for the ${activeDay} session.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                storageService.resetEventAgendaToDefault(eventId);
                onShowToast('Fresh Agenda Loaded', 'Seeded default upcoming agenda for Pre-Event, Day 1 & Day 2', 'success');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>✨ Seed Fresh Event Agenda</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Custom Item</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const isItemDisabled = item.enabled === false;
            const itemEndTime = item.endTime || storageService.calculateEndTime(item.time, item.duration_minutes || 30);

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 md:p-5 shadow-sm transition-all duration-200 ${
                  isItemDisabled ? 'opacity-50 grayscale' : 'hover:shadow-md'
                } ${
                  item.is_current || item.status === 'In Progress'
                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Desktop & Mobile Responsive Grid */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                  {/* Left Side: Drag handle, Order Number, Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Drag handle */}
                    <div className="flex flex-col items-center gap-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0">
                      <GripVertical className="w-5 h-5" />
                      {/* Reorder fallback buttons for quick touch / keyboard */}
                      <div className="hidden group-hover:flex items-center gap-0.5 -mt-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-0.5 text-[10px] text-slate-400 hover:text-emerald-500 disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === activeDayItems.length - 1}
                          className="p-0.5 text-[10px] text-slate-400 hover:text-emerald-500 disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Order Number */}
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-black flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {index + 1}
                    </span>

                    {/* Title & Description */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {/* Category Chip */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(item.category)}`}>
                          {item.category || 'General'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {item.description}
                        </p>
                      )}

                      {item.speaker_role && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Role: {item.speaker_role}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Info: Date, Time Range, Duration */}
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center text-xs flex-wrap">
                    {/* Date */}
                    {item.date && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.date}
                      </span>
                    )}

                    {/* Time Range */}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                      {item.time} – {itemEndTime}
                    </span>

                    {/* Duration */}
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {item.duration_minutes || 30} min
                    </span>
                  </div>

                  {/* Right Side: Actions (Day switcher, Status, Enable toggle, Edit, Copy, Delete) */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    
                    {/* Day assignment quick switch */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      {(['Pre-Event', 'Day 1', 'Day 2'] as AgendaDay[]).map((dayCode) => (
                        <button
                          key={dayCode}
                          onClick={() => handleQuickDaySwitch(item, dayCode)}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                            item.day === dayCode
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          title={`Move to ${dayCode}`}
                        >
                          {dayCode === 'Pre-Event' ? 'Pre' : dayCode === 'Day 1' ? 'D1' : 'D2'}
                        </button>
                      ))}
                    </div>

                    {/* Status Badge & Selector */}
                    <div className="relative group/status">
                      {renderStatusBadge(item.status, item.is_current)}
                      
                      {/* Status Dropdown Menu on hover/click */}
                      <div className="absolute right-0 top-full mt-1 hidden group-hover/status:block z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl space-y-0.5 w-32">
                        <button
                          onClick={() => onSetAgendaStatus ? onSetAgendaStatus(item.id, 'Upcoming') : storageService.setAgendaItemStatus(item.id, 'Upcoming')}
                          className="w-full text-left px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          ● Upcoming
                        </button>
                        <button
                          onClick={() => {
                            if (onSetAgendaStatus) {
                              onSetAgendaStatus(item.id, 'In Progress');
                            } else {
                              storageService.setAgendaItemStatus(item.id, 'In Progress');
                            }
                            if (onSetCurrentItem) {
                              onSetCurrentItem(item.id);
                            }
                          }}
                          className="w-full text-left px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          ● In Progress
                        </button>
                        <button
                          onClick={() => onSetAgendaStatus ? onSetAgendaStatus(item.id, 'Completed') : storageService.setAgendaItemStatus(item.id, 'Completed')}
                          className="w-full text-left px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          ✓ Done
                        </button>
                        <button
                          onClick={() => onSetAgendaStatus ? onSetAgendaStatus(item.id, 'Skipped') : storageService.setAgendaItemStatus(item.id, 'Skipped')}
                          className="w-full text-left px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          — Skipped
                        </button>
                      </div>
                    </div>

                    {/* Enable / Disable Toggle Switch */}
                    <button
                      onClick={() => onToggleEnableAgendaItem ? onToggleEnableAgendaItem(item.id) : storageService.toggleEnableAgendaItem(item.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        item.enabled !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={item.enabled !== false ? 'Enabled (Click to disable)' : 'Disabled (Click to enable)'}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        item.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>

                    {/* Action Buttons: Edit, Duplicate, Delete */}
                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit agenda item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (onDuplicateAgendaItem) {
                            onDuplicateAgendaItem(item.id);
                          } else {
                            storageService.duplicateAgendaItem(item.id);
                          }
                          onShowToast('Agenda Duplicated', `Created copy of "${item.title}"`, 'info');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Duplicate item"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Agenda Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-slide-up space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span>{editingItem ? 'Edit Agenda Item' : 'Add New Agenda Item'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure session timing, day assignment, and parliamentary categories
                </p>
              </div>
              <button
                onClick={handleCloseModalWithCheck}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              
              {/* Agenda Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Agenda Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome Address & Opening Ceremony"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    setIsFormDirty(true);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Day Assignment & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Day *
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => {
                      const d = e.target.value as AgendaDay;
                      setFormDay(d);
                      setFormDate(d === 'Pre-Event' ? '15 Jun 2026' : d === 'Day 1' ? '16 Jun 2026' : '17 Jun 2026');
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pre-Event">Pre-Event</option>
                    <option value="Day 1">Day 1</option>
                    <option value="Day 2">Day 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 Jun 2026"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Start Time & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM"
                    value={formTime}
                    onChange={(e) => {
                      setFormTime(e.target.value);
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Duration *
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => {
                      setFormDuration(Number(e.target.value));
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {DURATION_PRESETS.map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                    Expected End
                  </label>
                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {computedFormEndTime}
                  </div>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => {
                      setFormStatus(e.target.value as AgendaStatus);
                      setIsFormDirty(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Upcoming">● Upcoming</option>
                    <option value="In Progress">● In Progress</option>
                    <option value="Completed">✓ Done</option>
                    <option value="Skipped">— Skipped</option>
                  </select>
                </div>
              </div>

              {/* Speaker / Lead Role */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Speaker / Lead Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hon. Speaker of the Legislative Assembly"
                  value={formSpeaker}
                  onChange={(e) => {
                    setFormSpeaker(e.target.value);
                    setIsFormDirty(true);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Proceedings Brief
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief details of proceedings..."
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    setIsFormDirty(true);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enable Agenda Item in Timeline
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormEnabled(!formEnabled);
                    setIsFormDirty(true);
                  }}
                  className={`relative w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                    formEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    formEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModalWithCheck}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add Agenda Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Unsaved Changes</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You have unsaved changes in this agenda form. Do you want to save them before leaving?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={(e) => handleSaveModal(e as any)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                  setIsFormDirty(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowUnsavedPrompt(false)}
                className="w-full py-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Agenda?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingItem.title}"</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteAgendaItem) {
                    onDeleteAgendaItem(deletingItem.id);
                  } else {
                    storageService.deleteAgendaItem(deletingItem.id);
                  }
                  onShowToast('Agenda Deleted', `Removed "${deletingItem.title}"`, 'error');
                  setDeletingItem(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
