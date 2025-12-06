/**
 * StockCard - Watchlist item card with glow effects
 *
 * Features:
 * - Clean dark glassmorphism card
 * - Price with change indicator (green/red)
 * - Mini sparkline chart
 * - Signal score badge
 * - Holdings badge with value
 * - Glow effect for strong signals (>=80% bullish or <=20%)
 * - Scoped origin and performance tracking
 */

import { memo } from 'react';
import { Telescope } from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import { SignalBadge } from '@/components/ui/SignalBadge';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { AggregateScore } from '@/utils/signals';

// Sector icon mapping
const SECTOR_ICONS: Record<string, string> = {
  tech: '💻',
  biotech: '🧬',
  finance: '🏦',
  energy: '⚡',
  healthcare: '🏥',
  retail: '🛒',
  gaming: '🎮',
  meme: '🚀',
};

// Format date in European format
function formatScopedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export interface StockCardProps {
  /** Stock symbol (e.g., "AAPL") */
  symbol: string;
  /** Company name */
  name: string;
  /** Current price */
  price: number;
  /** Price change in dollars */
  change: number;
  /** Price change percentage */
  changePercent: number;
  /** Sparkline data (last 20 data points) */
  sparklineData?: number[];
  /** Technical signal score */
  signalScore?: AggregateScore;
  /** Scoped from sector */
  scopedFrom?: string;
  /** Scoped at timestamp */
  scopedAt?: string;
  /** Price when scoped */
  scopedPrice?: number;
  /** Click handler */
  onClick?: () => void;
}

export const StockCard = memo(function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  sparklineData = [],
  signalScore,
  scopedFrom,
  scopedAt,
  scopedPrice,
  onClick,
}: StockCardProps) {
  const { holdings } = useWatchlistStore();
  const holding = holdings[symbol];
  const shares = holding?.shares || 0;
  const holdingValue = shares * price;

  const isPositive = change >= 0;

  // Calculate performance since scoped
  const scopedPerformance = scopedPrice && scopedPrice > 0
    ? ((price - scopedPrice) / scopedPrice) * 100
    : null;
  const isScopedPositive = scopedPerformance !== null && scopedPerformance >= 0;

  // Determine glow effect based on signal score
  const glowClass = signalScore
    ? signalScore.percentage >= 80
      ? 'glow-bullish'
      : signalScore.percentage <= 20
      ? 'glow-bearish'
      : ''
    : '';

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left
        bg-slate-900/50 backdrop-blur-sm
        border border-slate-800/50
        rounded-2xl p-4
        transition-all duration-300
        hover:bg-slate-800/50 hover:border-slate-700/50
        active:scale-[0.98]
        ${glowClass}
      `}
    >
      {/* Top Row: Symbol & Price */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-lg">{symbol}</h3>
            {shares > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                {shares} shares
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm truncate max-w-[180px]">{name}</p>
          {/* Scoped Origin Info */}
          {scopedFrom && scopedAt && (
            <div className="flex items-center gap-1.5 mt-1">
              <Telescope className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400">
                {SECTOR_ICONS[scopedFrom] || '📊'} {scopedFrom.charAt(0).toUpperCase() + scopedFrom.slice(1)}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">{formatScopedDate(scopedAt)}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-white font-semibold text-lg">
            ${price.toFixed(2)}
          </p>
          <p
            className={`text-sm font-medium ${
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </p>
          {/* Performance since scoped */}
          {scopedPerformance !== null && (
            <p className={`text-xs mt-0.5 ${isScopedPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isScopedPositive ? '📈' : '📉'} {isScopedPositive ? '+' : ''}{scopedPerformance.toFixed(1)}% since scoped
            </p>
          )}
        </div>
      </div>

      {/* Holdings Value Row */}
      {shares > 0 && (
        <div className="flex justify-between items-center py-2 border-t border-slate-800/50 mt-2 mb-1">
          <span className="text-slate-400 text-sm">Your Value</span>
          <span className="text-white font-medium">
            ${holdingValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {/* Bottom Row: Sparkline & Signal Score */}
      <div className="flex items-center justify-between mt-3">
        {/* Sparkline */}
        <div className="flex-1">
          {sparklineData.length > 0 ? (
            <Sparkline
              data={sparklineData}
              width={120}
              height={32}
              color={isPositive ? 'bullish' : 'bearish'}
            />
          ) : (
            <div className="w-[120px] h-8 bg-slate-800/30 rounded animate-pulse" />
          )}
        </div>

        {/* Signal Score Badge */}
        {signalScore && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-white font-medium text-sm">
              {signalScore.label}
            </span>
            <SignalBadge signal={signalScore.sentiment} size="sm" />
          </div>
        )}
      </div>
    </button>
  );
});

export default StockCard;
