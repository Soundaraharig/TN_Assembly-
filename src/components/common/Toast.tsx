import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // Only display the 3 most recent toasts to keep the UI clean and non-disturbing
  const visibleToasts = toasts.slice(-3);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-3 pointer-events-none">
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColors = {
    success: 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/40',
    error: 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/40',
    info: 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/40'
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
  };

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-up ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-xs leading-snug">{toast.title}</h4>
        {toast.message && <p className="text-[11px] mt-0.5 opacity-85 leading-tight truncate">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

