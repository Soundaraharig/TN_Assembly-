import React, { useState } from 'react';
import type { FeedbackEntry } from '../../types';
import {
  MessageCircle,
  Star,
  Plus
} from 'lucide-react';

interface FeedbackTabProps {
  feedbackList: FeedbackEntry[];
  eventId: string;
  onSubmitFeedback: (fb: Partial<FeedbackEntry>) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FeedbackTab: React.FC<FeedbackTabProps> = ({
  feedbackList,
  eventId,
  onSubmitFeedback,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [delegateName, setDelegateName] = useState('');
  const [rating, setRating] = useState(5);
  const [debateQuality, setDebateQuality] = useState(5);
  const [logisticsRating, setLogisticsRating] = useState(5);
  const [comments, setComments] = useState('');

  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const avgDebate = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.debate_quality, 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const avgLogistics = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.logistics_rating, 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    onSubmitFeedback({
      event_id: eventId,
      delegate_name: delegateName.trim() || 'Delegate Participant',
      rating: Number(rating),
      debate_quality: Number(debateQuality),
      logistics_rating: Number(logisticsRating),
      comments: comments.trim()
    });

    setIsModalOpen(false);
    setDelegateName('');
    setComments('');
    onShowToast('Feedback Submitted', 'Thank you for your valuable feedback review', 'success');
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
            <div className="p-2 rounded-xl text-emerald-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Delegate Experience & Quality Feedback Center
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Real-time satisfaction ratings, parliamentary debate reviews, and attendee surveys.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Submit Feedback</span>
        </button>
      </div>

      {/* Metrics 3-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border shadow-sm space-y-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold text-slate-400">Overall Assembly Rating</span>
          <div className="flex items-center gap-2">
            <strong className="text-3xl font-black text-amber-500">{avgRating}</strong>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 block">{feedbackList.length} Survey Responses</span>
        </div>

        <div className="p-5 rounded-2xl border shadow-sm space-y-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold text-slate-400">Debate Rigour & Procedure</span>
          <div className="flex items-center gap-2">
            <strong className="text-3xl font-black text-emerald-500">{avgDebate}</strong>
            <span className="text-xs font-bold text-emerald-600">/ 5.0 Rating</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Question Hour & Division Voting</span>
        </div>

        <div className="p-5 rounded-2xl border shadow-sm space-y-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold text-slate-400">Logistics & Secretariat</span>
          <div className="flex items-center gap-2">
            <strong className="text-3xl font-black text-blue-500">{avgLogistics}</strong>
            <span className="text-xs font-bold text-blue-600">/ 5.0 Rating</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Badges, Stage, Audio & Food</span>
        </div>
      </div>

      {/* Feedback Reviews List */}
      <div className="space-y-4">
        {feedbackList.map(fb => (
          <div
            key={fb.id}
            className="rounded-2xl p-5 border shadow-sm space-y-3 transition-all"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {fb.delegate_name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span>Overall: <strong>{fb.rating}/5</strong></span>
                  <span>•</span>
                  <span>Debate: <strong>{fb.debate_quality}/5</strong></span>
                  <span>•</span>
                  <span>Logistics: <strong>{fb.logistics_rating}/5</strong></span>
                </div>
              </div>

              <div className="flex text-amber-400">
                {[...Array(fb.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>

            <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              "{fb.comments}"
            </p>
          </div>
        ))}
      </div>

      {/* Feedback Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Delegate Feedback Review
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Delegate / Reviewer Name</label>
                <input
                  type="text"
                  placeholder="e.g. A. Sharini"
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Overall: {rating}★</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Debate: {debateQuality}★</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={debateQuality}
                    onChange={(e) => setDebateQuality(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Logistics: {logisticsRating}★</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={logisticsRating}
                    onChange={(e) => setLogisticsRating(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Comments & Feedback *</label>
                <textarea
                  rows={3}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share your experience on parliamentary conduct, bills debated, and simulation quality..."
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Submit Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
