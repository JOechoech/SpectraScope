/**
 * PortfolioProjectionChart - Combined portfolio scenario projections
 *
 * Shows bull/base/bear scenarios for entire portfolio over time
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PortfolioProjectionChartProps {
  currentValue: number;
  projections: {
    bull: number;
    base: number;
    bear: number;
  };
  timeframeMonths?: number;
}

export function PortfolioProjectionChart({
  currentValue,
  projections,
  timeframeMonths = 6,
}: PortfolioProjectionChartProps) {
  const chartData = useMemo(() => {
    const points = 12;
    const data = [];

    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const month = Math.round(progress * timeframeMonths);
      const ease = easeInOutCubic(progress);

      data.push({
        month: i === 0 ? 'Now' : `${month}M`,
        bull: currentValue + (projections.bull - currentValue) * ease,
        base: currentValue + (projections.base - currentValue) * ease,
        bear: currentValue + (projections.bear - currentValue) * ease,
      });
    }

    return data;
  }, [currentValue, projections, timeframeMonths]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-4">Portfolio Projection</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="portfolioBull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="portfolioBear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={formatValue}
              width={60}
            />

            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatValue(value)]}
            />

            <ReferenceLine y={currentValue} stroke="#64748b" strokeDasharray="3 3" />

            <Area
              type="monotone"
              dataKey="bull"
              stroke="#10b981"
              fill="url(#portfolioBull)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="base"
              stroke="#3b82f6"
              fill="none"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="bear"
              stroke="#f43f5e"
              fill="url(#portfolioBear)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-emerald-400">{formatValue(projections.bull)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-blue-400">{formatValue(projections.base)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-rose-400">{formatValue(projections.bear)}</span>
        </div>
      </div>
    </div>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default PortfolioProjectionChart;
