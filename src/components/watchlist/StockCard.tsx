/**
 * StockCard - Watchlist item card with glow effects
 *
 * Features:
 * - Clean dark glassmorphism card
 * - Price with change indicator (green/red)
 * - Mini sparkline chart
 * - Signal score badge
 * - Glow effect for strong signals (>=80% bullish or <=20%)
 */

import { memo } from 'react';
import { Sparkline } from '@/components/charts/Sparkline';
import { SignalBadge } from '@/components/ui/SignalBadge';
import type { AggregateScore } from '@/utils/signals';

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
  onClick,
}: StockCardProps) {
  const isPositive = change >= 0;

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
          <h3 className="text-white font-semibold text-lg">{symbol}</h3>
          <p className="text-slate-400 text-sm truncate max-w-[180px]">{name}</p>
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
        </div>
      </div>

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
