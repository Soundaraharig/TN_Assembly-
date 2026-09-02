import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import {
  MessageSquare,
  Send,
  Radio
} from 'lucide-react';

interface ChatTabProps {
  messages: ChatMessage[];
  eventId: string;
  onSendMessage: (eventId: string, senderName: string, senderRole: string, message: string, isAnnouncement?: boolean) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  eventId,
  onSendMessage,
  onShowToast
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [senderName, setSenderName] = useState('Secretariat Lead');
  const [senderRole, setSenderRole] = useState('Coordinator');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(eventId, senderName, senderRole, inputText.trim(), isAnnouncement);
    setInputText('');
    onShowToast(
      isAnnouncement ? '📢 Broadcast Dispatched' : 'Message Sent',
      isAnnouncement ? 'Alert sent to all floor managers & delegates' : 'Sent to intercom channel',
      'success'
    );
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
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Assembly Floor Intercom & Broadcast Center
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Instant coordination channel between Speaker Dais, Jury Panel, Floor Marshals, and Delegates.
          </p>
        </div>

        <span
          className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Intercom Active
        </span>
      </div>

      {/* Main Chat Box Container */}
      <div
        className="rounded-2xl border shadow-sm flex flex-col h-[520px] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                msg.is_announcement
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
              style={{
                backgroundColor: msg.is_announcement ? 'var(--amber-soft)' : 'var(--bg-elevated)',
                borderColor: msg.is_announcement ? 'var(--amber)' : 'var(--border-soft)'
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {msg.is_announcement && (
                    <span className="px-2 py-0.2 rounded font-black text-[10px] bg-amber-500 text-white uppercase tracking-wide">
                      📢 Broadcast
                    </span>
                  )}
                  <strong className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {msg.sender_name}
                  </strong>
                  <span className="text-[10px] px-1.5 py-0.2 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {msg.sender_role}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {msg.message}
              </p>
            </div>
          ))}
        </div>

        {/* Input Message Form Footer */}
        <form
          onSubmit={handleSend}
          className="p-3.5 border-t space-y-2.5"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-400">Post as:</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="px-2 py-0.5 rounded border text-xs focus:outline-none w-32"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <select
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                className="px-2 py-0.5 rounded border text-xs focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="Coordinator">Coordinator</option>
                <option value="Speaker Desk">Speaker Desk</option>
                <option value="Jury Chief">Jury Chief</option>
                <option value="Floor Marshal">Floor Marshal</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-500">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>📢 Mark as High-Priority Broadcast</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="Type dispatch message or assembly announcement..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
