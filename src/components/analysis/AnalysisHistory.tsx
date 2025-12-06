import { memo, useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus, ChevronRight, Trash2 } from 'lucide-react';
import type { AnalysisEntry } from '@/stores/useAnalysisStore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalysisHistoryProps {
  symbol: string;
  entries: AnalysisEntry[];
  onSelect: (entry: AnalysisEntry) => void;
  onClear?: () => void;
  maxItems?: number;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

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
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCost(cost: number): string {
  if (cost < 0.001) return '< $0.001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AnalysisHistory - List of past analyses for a symbol
 *
 * Shows:
 * - Relative timestamp
 * - Cost of analysis
 * - Dominant scenario indicator (bull/bear/base)
 */
export const AnalysisHistory = memo(function AnalysisHistory({
  symbol,
  entries,
  onSelect,
  onClear,
  maxItems = 5,
  className = '',
}: AnalysisHistoryProps) {
  const displayedEntries = useMemo(
    () => entries.slice(0, maxItems),
    [entries, maxItems]
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          <h3 className="text-slate-400 font-medium text-sm">
            Analysis History
          </h3>
          <span className="text-slate-600 text-xs">({entries.length})</span>
        </div>
        {onClear && entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-slate-600 hover:text-rose-400 transition-colors p-1 rounded"
            title={`Clear history for ${symbol}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl overflow-hidden divide-y divide-slate-800/50">
        {displayedEntries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} onSelect={() => onSelect(entry)} />
        ))}
      </div>

      {/* Show more indicator */}
      {entries.length > maxItems && (
        <p className="text-center text-slate-600 text-xs">
          + {entries.length - maxItems} more analyses
        </p>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface HistoryItemProps {
  entry: AnalysisEntry;
  onSelect: () => void;
}

const HistoryItem = memo(function HistoryItem({
  entry,
  onSelect,
}: HistoryItemProps) {
  const { timestamp, cost, dominantScenario, result } = entry;

  // Get icon and color based on dominant scenario
  const scenarioConfig = {
    bull: {
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      label: 'Bullish',
    },
    bear: {
      icon: TrendingDown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      label: 'Bearish',
    },
    base: {
      icon: Minus,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      label: 'Neutral',
    },
  };

  const config = scenarioConfig[dominantScenario];
  const Icon = config.icon;

  // Get dominant probability with null check
  const dominantProb = result?.[dominantScenario]?.probability ?? 0;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Scenario Indicator */}
        <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
          <Icon size={14} className={config.color} />
        </div>

        {/* Time Info */}
        <div className="text-left">
          <p className="text-white text-sm font-medium">
            {formatRelativeTime(timestamp)}
          </p>
          <p className="text-slate-500 text-xs">{formatTime(timestamp)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Confidence */}
        <div className="text-right">
          <p className={`text-sm font-medium ${config.color}`}>
            {dominantProb}% {config.label}
          </p>
          <p className="text-slate-600 text-xs">{formatCost(cost)}</p>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={16}
          className="text-slate-600 group-hover:text-slate-400 transition-colors"
        />
      </div>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL COST DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

interface TotalCostProps {
  entries: AnalysisEntry[];
  className?: string;
}

export const TotalCostDisplay = memo(function TotalCostDisplay({
  entries,
  className = '',
}: TotalCostProps) {
  const totalCost = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.cost, 0),
    [entries]
  );

  if (entries.length === 0) return null;

  return (
    <div className={`flex items-center justify-between text-xs ${className}`}>
      <span className="text-slate-500">{entries.length} analyses</span>
      <span className="text-slate-400">Total: {formatCost(totalCost)}</span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPACT HISTORY (for inline use)
// ═══════════════════════════════════════════════════════════════════════════

interface AnalysisHistoryCompactProps {
  entries: AnalysisEntry[];
  onSelect: (entry: AnalysisEntry) => void;
}

export const AnalysisHistoryCompact = memo(function AnalysisHistoryCompact({
  entries,
  onSelect,
}: AnalysisHistoryCompactProps) {
  if (entries.length === 0) return null;

  const latest = entries[0];
  const scenarioColors = {
    bull: 'bg-emerald-500',
    bear: 'bg-rose-500',
    base: 'bg-amber-500',
  };

  return (
    <button
      onClick={() => onSelect(latest)}
      className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
    >
      <div
        className={`w-2 h-2 rounded-full ${scenarioColors[latest.dominantScenario]}`}
      />
      <span className="text-xs">
        Last: {formatRelativeTime(latest.timestamp)}
      </span>
    </button>
  );
});

export default AnalysisHistory;
