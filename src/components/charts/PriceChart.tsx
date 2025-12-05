/**
 * PriceChart - Interactive price chart with timeframe selector
 *
 * Features:
 * - Area chart with gradient fill
 * - Timeframe selector (1W, 1M, 3M, 1Y, ALL)
 * - Tooltip with price details
 * - Color based on price direction
 */

import { useState, useMemo, memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceChartProps {
  /** Historical price data */
  data: HistoricalDataPoint[];
  /** Current price */
  currentPrice: number;
  /** Price change in dollars */
  change: number;
  /** Price change percentage */
  changePercent: number;
}

type Timeframe = '1W' | '1M' | '3M' | '1Y' | 'ALL';

export const PriceChart = memo(function PriceChart({
  data,
  currentPrice,
  change,
  changePercent,
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  const filteredData = useMemo(
    () => filterByTimeframe(data, timeframe),
    [data, timeframe]
  );

  const isPositive = change >= 0;
  const color = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
      {/* Price Header */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-white">
          ${currentPrice.toFixed(2)}
        </div>
        <div
          className={`text-lg font-medium ${
            isPositive ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)} ({isPositive ? '+' : ''}
          {changePercent.toFixed(2)}%)
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-center gap-2 mt-4">
        {(['1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
});

function filterByTimeframe(
  data: HistoricalDataPoint[],
  timeframe: Timeframe
): HistoricalDataPoint[] {
  if (timeframe === 'ALL') return data;

  const now = new Date();
  let daysBack: number;

  switch (timeframe) {
    case '1W':
      daysBack = 7;
      break;
    case '1M':
      daysBack = 30;
      break;
    case '3M':
      daysBack = 90;
      break;
    case '1Y':
      daysBack = 365;
      break;
    default:
      return data;
  }

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

export default PriceChart;
