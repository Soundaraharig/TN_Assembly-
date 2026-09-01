import React, { useState, useEffect } from 'react';
import type { Coordinator } from '../../types';
import { generateRandomPassword } from '../../utils/accessCodeGenerator';
import { X, User, Mail, Key, Sparkles, Copy, Check, ShieldAlert } from 'lucide-react';

interface EditCoordinatorModalProps {
  isOpen: boolean;
  coordinator: Coordinator | null;
  eventName?: string;
  onClose: () => void;
  onSave: (updated: Coordinator) => void;
}

export const EditCoordinatorModal: React.FC<EditCoordinatorModalProps> = ({
  isOpen,
  coordinator,
  eventName,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (coordinator) {
      setName(coordinator.name || '');
      setEmail(coordinator.email || '');
      setPassword(coordinator.password_hash || coordinator.raw_temp_password || '');
    }
  }, [coordinator]);

  if (!isOpen || !coordinator) return null;

  const handleRegeneratePassword = () => {
    setPassword(generateRandomPassword(10));
    setCopied(false);
  };

  const handleCopyCredentials = () => {
    const text = `TN Assembly Coordinator Credentials\nEvent: ${eventName || 'College Event'}\nName: ${name}\nEmail: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    onSave({
      ...coordinator,
      name: name.trim(),
      email: email.trim(),
      password_hash: password.trim(),
      raw_temp_password: password.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Reset Coordinator Details</h3>
              <p className="text-xs text-slate-400">
                {eventName ? `Event: ${eventName}` : 'Update login ID, email, or reset password'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Coordinator Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Coordinator Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Hari & Yuva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Coordinator Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Coordinator Email (Login ID) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="e.g. hari@hari.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Password Reset Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password *
              </label>
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Generate Random Password
              </button>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-sm font-mono text-amber-300 font-bold tracking-wider focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 shadow-lg shadow-amber-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Save Credentials
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
