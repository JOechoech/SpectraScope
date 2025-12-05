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
  CartesianGrid,
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

  // Calculate Y-axis domain with padding
  const { minPrice, maxPrice } = useMemo(() => {
    if (filteredData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const prices = filteredData.map((d) => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05;
    return {
      minPrice: Math.floor((min - padding) * 100) / 100,
      maxPrice: Math.ceil((max + padding) * 100) / 100,
    };
  }, [filteredData]);

  // Format date based on timeframe
  const formatDate = (date: string) => {
    const d = new Date(date);
    switch (timeframe) {
      case '1W':
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      case '1M':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
      case '1Y':
        return d.toLocaleDateString('en-US', { month: 'short' });
      default:
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  // Format price for Y-axis
  const formatPrice = (value: number) => `$${value.toFixed(0)}`;

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
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />

            {/* X Axis - Dates */}
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            {/* Y Axis - Prices */}
            <YAxis
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={formatPrice}
              width={50}
              orientation="right"
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
            />

            {/* Area */}
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
