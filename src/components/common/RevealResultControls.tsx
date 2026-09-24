import React from 'react';
import { Eye, Monitor, CheckCircle2 } from 'lucide-react';

export interface RevealResultControlsProps {
  voteId: string;
  title?: string;
  status?: string;
  votesCast: number;
  totalEligible: number;
  isRevealed: boolean;
  isDismissed?: boolean;
  onReveal: () => void;
  onDismiss: () => void;
  disabled?: boolean;
  className?: string;
  revealLabel?: string;
  dismissLabel?: string;
}

/**
 * Standardized Voting Result Control Component
 * Used across:
 * 1. Bill / Floor Division Voting
 * 2. Speaker & Deputy Speaker Elections
 * 3. Leadership & Committee Elections
 * 4. Live Flash Votes
 */
export const RevealResultControls: React.FC<RevealResultControlsProps> = ({
  voteId: _voteId,
  title,
  status: _status,
  votesCast,
  totalEligible,
  isRevealed,
  isDismissed = false,
  onReveal,
  onDismiss,
  disabled = false,
  className = '',
  revealLabel = 'Reveal Results',
  dismissLabel = 'Dismiss & show session'
}) => {
  const safeTotal = Math.max(0, totalEligible);
  const safeCast = Math.max(0, votesCast);
  const percentage = safeTotal > 0 ? Math.min(100, Math.round((safeCast / safeTotal) * 100)) : 0;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
        isRevealed
          ? 'bg-purple-950/20 dark:bg-purple-950/30 border-purple-500/30 dark:border-purple-500/40'
          : 'bg-slate-900/60 dark:bg-slate-900/80 border-slate-700/60 dark:border-slate-800'
      } ${className}`}
      data-testid="reveal-result-controls"
    >
      {/* Header: Title / Section Name & Votes Cast Counter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-300 dark:text-slate-200">
            Votes Cast
          </span>
          {title && (
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              • {title}
            </span>
          )}
          {isRevealed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              REVEALED
            </span>
          )}
          {isDismissed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              Session Shown
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm sm:text-base text-white">
            {safeCast} / {safeTotal}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            ({percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-950/80 overflow-hidden border border-slate-800/80">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            isRevealed
              ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400'
              : 'bg-gradient-to-r from-amber-500 to-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Action Buttons: [ 👁 Reveal Results ] [ ◉ Dismiss & show session ] */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1">
        {/* Button 1: Reveal Results */}
        <button
          type="button"
          disabled={disabled}
          onClick={onReveal}
          title={isRevealed ? 'Results currently projected on stage screen. Click to refresh projection.' : 'Reveal and broadcast official results to projector and delegates'}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
            isRevealed
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-emerald-950/50'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-950/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRevealed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Results Revealed 👁</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>{revealLabel}</span>
            </>
          )}
        </button>

        {/* Button 2: Dismiss & Show Session */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDismiss}
          title="Hide the voting/result display and return stage & screen to normal active session/agenda"
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
            isDismissed
              ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 hover:border-slate-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Monitor className="w-4 h-4 text-indigo-400" />
          <span>{dismissLabel}</span>
        </button>
      </div>
    </div>
  );
};
