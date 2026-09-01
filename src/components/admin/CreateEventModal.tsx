import React, { useState } from 'react';
import { generateRandomPassword } from '../../utils/accessCodeGenerator';
import { X, Building2, User, Mail, Key, Copy, Check, Sparkles } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collegeName: string, coordinatorName: string, coordinatorEmail: string, password: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [collegeName, setCollegeName] = useState('');
  const [coordName, setCoordName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [tempPassword, setTempPassword] = useState(() => generateRandomPassword(10));
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRegeneratePassword = () => {
    setTempPassword(generateRandomPassword(10));
    setCopied(false);
  };

  const handleCopyCredentials = () => {
    const text = `TN Assembly Credentials\nEvent: ${collegeName}\nCoordinator: ${coordName}\nEmail: ${coordEmail}\nPassword: ${tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !coordName.trim() || !coordEmail.trim()) return;
    onSubmit(collegeName.trim(), coordName.trim(), coordEmail.trim(), tempPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New College Event</h3>
              <p className="text-xs text-slate-400">Provision event details & coordinator access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* College / Event Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              College / Event Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. JKKNCET Youth Assembly 2026"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Coordinator Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Coordinator Name(s) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Hari & Yuva"
                value={coordName}
                onChange={(e) => setCoordName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Coordinator Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Coordinator Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="e.g. hari.yuva@jkkncet.edu.in"
                value={coordEmail}
                onChange={(e) => setCoordEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Auto-Generated Credentials Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Auto-Generated Password
              </span>
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="text-[11px] text-slate-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Regenerate
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-sm font-mono text-amber-300 font-bold tracking-wider">
                {tempPassword}
              </div>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Coordinators will use their email and this auto-generated password to log in.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 shadow-lg shadow-amber-950/50 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Provision Event & Coordinator
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
