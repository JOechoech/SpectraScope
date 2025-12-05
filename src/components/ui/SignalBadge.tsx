import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Signal } from '@/utils/signals';

type BadgeSize = 'sm' | 'md' | 'lg';

interface SignalBadgeProps {
  /** Signal type: bullish, neutral, or bearish */
  signal: Signal;
  /** Optional label text */
  label?: string;
  /** Badge size */
  size?: BadgeSize;
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 12,
    gap: 'gap-1',
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 14,
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base',
    icon: 16,
    gap: 'gap-2',
  },
};

const signalConfig = {
  bullish: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
    icon: TrendingUp,
    defaultLabel: 'Bullish',
  },
  neutral: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
    icon: Minus,
    defaultLabel: 'Neutral',
  },
  bearish: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-500',
    border: 'border-rose-500/30',
    icon: TrendingDown,
    defaultLabel: 'Bearish',
  },
};

/**
 * SignalBadge - Minimalist signal indicator
 *
 * Displays bullish/neutral/bearish signals with consistent styling:
 * - Bullish: Green (emerald-500)
 * - Neutral: Yellow (amber-500)
 * - Bearish: Red (rose-500)
 *
 * @example
 * <SignalBadge signal="bullish" label="RSI Oversold" />
 * <SignalBadge signal="bearish" size="sm" showIcon />
 */
export const SignalBadge = memo(function SignalBadge({
  signal,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}: SignalBadgeProps) {
  const config = signalConfig[signal];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`
        inline-flex items-center ${sizeStyles.gap}
        ${sizeStyles.badge}
        ${config.bg} ${config.text}
        border ${config.border}
        rounded-full font-medium
        transition-colors duration-200
        ${className}
      `}
    >
      {showIcon && <Icon size={sizeStyles.icon} />}
      {displayLabel}
    </span>
  );
});

/**
 * SignalDot - Minimal dot indicator for list views
 */
interface SignalDotProps {
  signal: Signal;
  size?: 'sm' | 'md';
  className?: string;
}

export const SignalDot = memo(function SignalDot({
  signal,
  size = 'md',
  className = '',
}: SignalDotProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  const dotColors = {
    bullish: 'bg-emerald-500',
    neutral: 'bg-amber-500',
    bearish: 'bg-rose-500',
  };

  return (
    <span
      className={`
        inline-block ${dotSize} rounded-full
        ${dotColors[signal]}
        ${className}
      `}
      aria-label={`${signal} signal`}
    />
  );
});

/**
 * SignalBar - Horizontal bar showing signal strength
 */
interface SignalBarProps {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  showLabels?: boolean;
  className?: string;
}

export const SignalBar = memo(function SignalBar({
  bullishCount,
  bearishCount,
  neutralCount,
  showLabels = false,
  className = '',
}: SignalBarProps) {
  const total = bullishCount + bearishCount + neutralCount;
  if (total === 0) return null;

  const bullishPercent = (bullishCount / total) * 100;
  const neutralPercent = (neutralCount / total) * 100;
  const bearishPercent = (bearishCount / total) * 100;

  return (
    <div className={`${className}`}>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
        {bullishPercent > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${bullishPercent}%` }}
          />
        )}
        {neutralPercent > 0 && (
          <div
            className="bg-amber-500 transition-all duration-300"
            style={{ width: `${neutralPercent}%` }}
          />
        )}
        {bearishPercent > 0 && (
          <div
            className="bg-rose-500 transition-all duration-300"
            style={{ width: `${bearishPercent}%` }}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-emerald-500">{bullishCount} Bull</span>
          <span className="text-amber-500">{neutralCount} Neutral</span>
          <span className="text-rose-500">{bearishCount} Bear</span>
        </div>
      )}
    </div>
  );
});

export default SignalBadge;
