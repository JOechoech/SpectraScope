/**
 * MarketStatusBar - Shows current market session status
 *
 * Displays:
 * - Current session (Pre-Market, Open, After Hours, Closed)
 * - Time until next session change
 * - Last data update time
 */

import { useState, useEffect, memo } from 'react';
import { getMarketStatus, type MarketStatus } from '@/utils/marketStatus';

interface MarketStatusBarProps {
  /** Last time data was refreshed */
  lastUpdated?: Date | null;
}

export const MarketStatusBar = memo(function MarketStatusBar({
  lastUpdated,
}: MarketStatusBarProps) {
  const [status, setStatus] = useState<MarketStatus>(getMarketStatus());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800">
      {/* Market Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status.session === 'open'
              ? 'bg-emerald-400 animate-pulse'
              : status.session === 'pre-market'
                ? 'bg-blue-400'
                : status.session === 'after-hours'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
          }`}
        />
        <span className={`text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
        {status.nextEvent && status.session !== 'open' && (
          <span className="text-slate-500 text-sm">
            {status.nextEvent.label} in {status.nextEvent.countdown}
          </span>
        )}
        {status.nextEvent && status.session === 'open' && (
          <span className="text-slate-500 text-sm">
            {status.nextEvent.label} in {status.nextEvent.countdown}
          </span>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <span className="text-slate-500 text-sm">
          Updated {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  );
});

export default MarketStatusBar;
