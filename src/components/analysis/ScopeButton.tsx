import { memo } from 'react';
import { Telescope, Loader2, AlertCircle, Key } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CostEstimate {
  min: number;
  max: number;
  avg: number;
}

export interface ScopeButtonProps {
  symbol: string;
  onAnalyze: () => void;
  isLoading: boolean;
  estimatedCost: CostEstimate;
  disabled?: boolean;
  hasApiKey?: boolean;
  lastAnalysisTime?: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function formatCost(cost: number): string {
  if (cost < 0.001) {
    return '< $0.001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ScopeButton - Main CTA for triggering AI analysis
 *
 * Features:
 * - Shows estimated cost before analysis
 * - Loading state with spinner
 * - Disabled state when no API key configured
 * - Shows last analysis time if available
 */
export const ScopeButton = memo(function ScopeButton({
  symbol,
  onAnalyze,
  isLoading,
  estimatedCost,
  disabled = false,
  hasApiKey = true,
  lastAnalysisTime,
  className = '',
}: ScopeButtonProps) {
  const isDisabled = disabled || isLoading || !hasApiKey;

  // No API key configured
  if (!hasApiKey) {
    return (
      <div className={`space-y-3 ${className}`}>
        <button
          disabled
          className="w-full py-4 px-6 bg-slate-800/50 rounded-xl font-semibold text-slate-500 flex items-center justify-center gap-3 cursor-not-allowed border border-slate-700/50"
        >
          <Key size={20} />
          <span>API Key Required</span>
        </button>
        <p className="text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          <span>Configure your Anthropic API key in Settings</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Button */}
      <button
        onClick={onAnalyze}
        disabled={isDisabled}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold
          flex items-center justify-center gap-3
          transition-all duration-200
          ${
            isDisabled
              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Analyzing {symbol}...</span>
          </>
        ) : (
          <>
            <Telescope size={20} />
            <span>Scope Analysis</span>
            <span
              className={`text-sm ${
                isDisabled ? 'text-slate-600' : 'text-blue-200'
              }`}
            >
              ~{formatCost(estimatedCost.avg)}
            </span>
          </>
        )}
      </button>

      {/* Cost Info */}
      {!isLoading && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={12} />
            <span>
              Estimated: {formatCost(estimatedCost.min)} -{' '}
              {formatCost(estimatedCost.max)}
            </span>
          </div>
          {lastAnalysisTime && (
            <span>Last: {formatRelativeTime(lastAnalysisTime)}</span>
          )}
        </div>
      )}

      {/* Loading Progress Info */}
      {isLoading && (
        <div className="text-center text-slate-500 text-sm">
          <p>Generating 3 scenarios with AI...</p>
          <p className="text-xs mt-1 text-slate-600">This usually takes 3-5 seconds</p>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT
// ═══════════════════════════════════════════════════════════════════════════

export interface ScopeButtonCompactProps {
  onAnalyze: () => void;
  isLoading: boolean;
  estimatedCost: CostEstimate;
  disabled?: boolean;
  hasApiKey?: boolean;
}

/**
 * ScopeButtonCompact - Smaller version for inline use
 */
export const ScopeButtonCompact = memo(function ScopeButtonCompact({
  onAnalyze,
  isLoading,
  estimatedCost,
  disabled = false,
  hasApiKey = true,
}: ScopeButtonCompactProps) {
  const isDisabled = disabled || isLoading || !hasApiKey;

  if (!hasApiKey) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-slate-800/50 rounded-lg text-slate-500 text-sm flex items-center gap-2 cursor-not-allowed"
      >
        <Key size={14} />
        <span>No API Key</span>
      </button>
    );
  }

  return (
    <button
      onClick={onAnalyze}
      disabled={isDisabled}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm
        flex items-center gap-2
        transition-all duration-200
        ${
          isDisabled
            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Telescope size={14} />
          <span>Scope</span>
          <span className={isDisabled ? 'text-slate-600' : 'text-blue-200'}>
            ~{formatCost(estimatedCost.avg)}
          </span>
        </>
      )}
    </button>
  );
});

export default ScopeButton;
