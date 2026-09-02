import React, { useState } from 'react';
import type { ChecklistItem } from '../../types';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  Trash2
} from 'lucide-react';

interface ChecklistTabProps {
  checklist: ChecklistItem[];
  eventId: string;
  onToggleItem: (id: string) => void;
  onAddItem: (item: Partial<ChecklistItem>) => void;
  onDeleteItem: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  checklist,
  eventId,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistItem['category']>('Venue & Stage');
  const [newAssignee, setNewAssignee] = useState('');

  const completedCount = checklist.filter(c => c.is_completed).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = checklist.filter(c => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    onAddItem({
      event_id: eventId,
      task: newTask.trim(),
      category: newCategory,
      assigned_to: newAssignee.trim() || 'Floor Team'
    });

    setNewTask('');
    setNewAssignee('');
    onShowToast('Task Added', 'New readiness checklist item created', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner & Readiness Tracker */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Pre-Event Readiness & Assembly Protocol Checklist
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Operational tracking for venue acoustics, electronic voting kits, 234 constituency badges, and dais protocol.
            </p>
          </div>

          <span
            className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs border shrink-0 text-center"
            style={{
              backgroundColor: progressPct === 100 ? 'var(--accent-soft)' : 'var(--amber-soft)',
              color: progressPct === 100 ? 'var(--accent)' : 'var(--amber)',
              borderColor: progressPct === 100 ? 'var(--accent)' : 'var(--amber)'
            }}
          >
            {completedCount} of {totalCount} Ready ({progressPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? '#10b981' : '#f59e0b'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Add New Checklist Item Form */}
      <form
        onSubmit={handleCreateTask}
        className="rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row items-center gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <input
          type="text"
          required
          placeholder="Add new readiness item (e.g. Test Speaker gavel & bell acoustics)..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 w-full p-2 rounded-xl border text-xs focus:outline-none"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as ChecklistItem['category'])}
          className="p-2 rounded-xl border text-xs font-semibold focus:outline-none shrink-0"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="Venue & Stage">Venue & Stage</option>
          <option value="Audio-Visual">Audio-Visual & Sound</option>
          <option value="Ballot & Voting">Ballot & Digital Voting</option>
          <option value="Delegate Badges">Delegate Badges & Kits</option>
          <option value="Protocol & Dossiers">Protocol & Dossiers</option>
          <option value="Emergency">Emergency & Health</option>
        </select>

        <input
          type="text"
          placeholder="Assignee (e.g. Hari)"
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          className="w-32 p-2 rounded-xl border text-xs focus:outline-none shrink-0"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'Venue & Stage', 'Audio-Visual', 'Ballot & Voting', 'Delegate Badges', 'Protocol & Dossiers', 'Emergency'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedCategory === cat ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: selectedCategory === cat ? 'var(--amber)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedCategory === cat ? 'var(--amber)' : 'var(--border)'
            }}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Checklist Items Roster */}
      <div
        className="rounded-2xl border shadow-sm divide-y"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {filteredItems.length === 0 ? (
          <div className="py-10 text-center italic text-xs" style={{ color: 'var(--text-muted)' }}>
            No checklist items in this category.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => onToggleItem(item.id)}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-500/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-0.5 rounded-lg text-emerald-500 transition-transform hover:scale-110 cursor-pointer"
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white dark:text-slate-900" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div>
                  <span
                    className={`text-xs font-semibold block transition-all ${
                      item.is_completed ? 'line-through opacity-60' : ''
                    }`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.task}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="px-1.5 py-0.2 rounded border" style={{ borderColor: 'var(--border)' }}>
                      {item.category}
                    </span>
                    <span>•</span>
                    <span>Assigned to: <strong>{item.assigned_to || 'Secretariat'}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                  onShowToast('Task Removed', 'Removed checklist task', 'info');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
