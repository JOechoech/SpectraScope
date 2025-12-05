import { memo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

/**
 * Mini sparkline chart for watchlist items
 * Shows price trend with gradient fill
 */
export const Sparkline = memo(function Sparkline({
  data,
  positive,
  width = 64,
  height = 32,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const color = positive ? '#10b981' : '#f43f5e';
  const gradientId = `spark-${positive ? 'up' : 'down'}-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default Sparkline;
