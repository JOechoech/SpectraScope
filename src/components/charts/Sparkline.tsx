/**
 * Sparkline - Mini chart component for watchlist cards
 *
 * Simple line chart showing price trend, no axes or grid.
 * Color based on first vs last value (up = green, down = red).
 */

import { memo, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export interface SparklineProps {
  /** Array of price values */
  data: number[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Force color override */
  color?: 'bullish' | 'bearish' | 'neutral';
}

export const Sparkline = memo(function Sparkline({
  data,
  width = 100,
  height = 32,
  color,
}: SparklineProps) {
  // Determine color from data trend if not specified
  const chartColor = useMemo(() => {
    if (color) {
      return color === 'bullish'
        ? '#10b981'
        : color === 'bearish'
        ? '#f43f5e'
        : '#3b82f6';
    }

    if (data.length < 2) return '#3b82f6';

    const first = data[0];
    const last = data[data.length - 1];

    if (last > first) return '#10b981'; // Green for up
    if (last < first) return '#f43f5e'; // Red for down
    return '#3b82f6'; // Blue for neutral
  }, [data, color]);

  // Convert data to chart format
  const chartData = useMemo(() => {
    return data.map((value, index) => ({ index, value }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="bg-slate-800/30 rounded animate-pulse"
      />
    );
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={`url(#gradient-${chartColor})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default Sparkline;
