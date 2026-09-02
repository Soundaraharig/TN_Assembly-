import React, { useState } from 'react';
import {
  Camera,
  Plus,
  FileText
} from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  category: 'PHOTO' | 'VIDEO' | 'PRESS_RELEASE';
  url: string;
  caption: string;
  timestamp: string;
}

const INITIAL_MEDIA_GALLERY: MediaItem[] = [
  {
    id: 'm-1',
    title: 'Speaker Opening Gavel Strike & Oath Taking Ceremony',
    category: 'PHOTO',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    caption: 'Inaugural sitting of the Youth Assembly with complete 234 constituency delegates seated on ruling and opposition benches.',
    timestamp: 'Day 1 • 09:15 AM'
  },
  {
    id: 'm-2',
    title: 'Fierce Question Hour Cross-Examination on Higher Education',
    category: 'PHOTO',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
    caption: 'Opposition MLAs querying the Education Minister regarding tech subsidies across rural western districts.',
    timestamp: 'Day 1 • 10:30 AM'
  },
  {
    id: 'm-3',
    title: 'Official Press Communiqué — Resolution Passed',
    category: 'PRESS_RELEASE',
    url: '#',
    caption: 'Official Secretariat Release: Tamil Nadu Youth Assembly passes historic Student Incubation Venture Capital Statute.',
    timestamp: 'Day 1 • 01:00 PM'
  }
];

interface MediaTabProps {
  eventName: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const MediaTab: React.FC<MediaTabProps> = ({ eventName, onShowToast }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA_GALLERY);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO' | 'PRESS_RELEASE'>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MediaItem['category']>('PHOTO');
  const [newCaption, setNewCaption] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const filteredMedia = mediaList.filter(m => {
    if (selectedFilter !== 'ALL' && m.category !== selectedFilter) return false;
    return true;
  });

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: MediaItem = {
      id: `m_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      url: newUrl.trim() || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      caption: newCaption.trim() || 'Assembly session highlight.',
      timestamp: 'Just now'
    };

    setMediaList(prev => [newItem, ...prev]);
    setIsAddOpen(false);
    setNewTitle('');
    setNewCaption('');
    setNewUrl('');
    onShowToast('Media Added', 'Photo/bulletin added to assembly press gallery', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Assembly Media Center & Photo Gallery
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            High-definition photographs, recorded floor debates, and official press communiqués from {eventName}.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--amber)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Media Asset</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'PHOTO', 'VIDEO', 'PRESS_RELEASE'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedFilter === cat ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: selectedFilter === cat ? 'var(--amber)' : 'var(--bg-surface)',
              color: selectedFilter === cat ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedFilter === cat ? 'var(--amber)' : 'var(--border)'
            }}
          >
            {cat === 'ALL' ? 'All Media Assets' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedia.map(item => (
          <div
            key={item.id}
            className="rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {item.category === 'PRESS_RELEASE' ? (
              <div
                className="p-6 flex flex-col justify-center items-center text-center space-y-2 min-h-[180px]"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <FileText className="w-10 h-10 text-amber-500" />
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-500">Official Communiqué</span>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
              </div>
            ) : (
              <div className="relative h-48 bg-slate-900 overflow-hidden group">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
              <h4 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </h4>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {item.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Media Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Upload Media / Press Asset
              </h4>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Asset Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day 1 Valedictory Speech by Speaker"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MediaItem['category'])}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="PHOTO">Session Photograph</option>
                  <option value="VIDEO">Floor Video Clip</option>
                  <option value="PRESS_RELEASE">Official Press Communiqué</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Image/Media URL</label>
                <input
                  type="text"
                  placeholder="https://... (Leave empty for default campus image)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Caption / Description</label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Key delegates and parliamentary highlight context..."
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  Publish Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
