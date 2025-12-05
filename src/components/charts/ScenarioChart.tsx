/**
 * ScenarioChart - Visual projection of Bull/Bear/Base scenarios
 *
 * Shows three price paths from current price to projected targets
 * with smooth curves and uncertainty shading.
 */

import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import type { Scenario } from '@/types';

interface ScenarioChartProps {
  currentPrice: number;
  scenarios: {
    bull: Scenario;
    base: Scenario;
    bear: Scenario;
  };
  timeframeMonths?: number;
}

export function ScenarioChart({
  currentPrice,
  scenarios,
  timeframeMonths = 6,
}: ScenarioChartProps) {
  const chartData = useMemo(() => {
    // Parse price targets (handle "$210" or "+15%" formats)
    const bullTarget = parsePriceTarget(scenarios.bull.priceTarget, currentPrice);
    const baseTarget = parsePriceTarget(scenarios.base.priceTarget, currentPrice);
    const bearTarget = parsePriceTarget(scenarios.bear.priceTarget, currentPrice);

    // Generate data points for smooth curves
    const points = 12; // Monthly points
    const data = [];

    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const month = Math.round((i / points) * timeframeMonths);

      // Easing function for realistic curve (not linear)
      const easeProgress = easeInOutCubic(progress);

      data.push({
        month: i === 0 ? 'Now' : `${month}M`,
        monthNum: month,
        bull: currentPrice + (bullTarget - currentPrice) * easeProgress,
        base: currentPrice + (baseTarget - currentPrice) * easeProgress,
        bear: currentPrice + (bearTarget - currentPrice) * easeProgress,
        current: i === 0 ? currentPrice : null,
      });
    }

    return data;
  }, [currentPrice, scenarios, timeframeMonths]);

  const { bullTarget, baseTarget, bearTarget } = useMemo(
    () => ({
      bullTarget: parsePriceTarget(scenarios.bull.priceTarget, currentPrice),
      baseTarget: parsePriceTarget(scenarios.base.priceTarget, currentPrice),
      bearTarget: parsePriceTarget(scenarios.bear.priceTarget, currentPrice),
    }),
    [scenarios, currentPrice]
  );

  const minPrice = Math.min(bearTarget, currentPrice) * 0.95;
  const maxPrice = Math.max(bullTarget, currentPrice) * 1.05;

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Price Scenarios</h3>
        <span className="text-slate-400 text-sm">
          {timeframeMonths} month outlook
        </span>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={50}
            />

            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />

            {/* Reference line at current price */}
            <ReferenceLine
              y={currentPrice}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{ value: 'Current', fill: '#64748b', fontSize: 10 }}
            />

            {/* Area between bull and bear for uncertainty range */}
            <Area dataKey="bull" stroke="none" fill="url(#bullGradient)" />
            <Area dataKey="bear" stroke="none" fill="url(#bearGradient)" />

            {/* Scenario lines */}
            <Line
              type="monotone"
              dataKey="bull"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Bull"
            />
            <Line
              type="monotone"
              dataKey="base"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Base"
            />
            <Line
              type="monotone"
              dataKey="bear"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              name="Bear"
            />

            {/* Current price dot */}
            <Line
              type="monotone"
              dataKey="current"
              stroke="#ffffff"
              strokeWidth={0}
              dot={{ r: 6, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with targets */}
      <div className="flex justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Bull:</span>
          <span className="text-emerald-400 font-medium">
            ${bullTarget.toFixed(2)} ({formatChange(bullTarget, currentPrice)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-400">Base:</span>
          <span className="text-blue-400 font-medium">
            ${baseTarget.toFixed(2)} ({formatChange(baseTarget, currentPrice)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-400">Bear:</span>
          <span className="text-rose-400 font-medium">
            ${bearTarget.toFixed(2)} ({formatChange(bearTarget, currentPrice)})
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function parsePriceTarget(target: string, currentPrice: number): number {
  if (!target) return currentPrice;

  // Handle "$210" format
  if (target.startsWith('$')) {
    return parseFloat(target.replace('$', ''));
  }

  // Handle "+15%" or "-10%" format
  const percentMatch = target.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    return currentPrice * (1 + percent / 100);
  }

  // Handle "210" format
  const numericValue = parseFloat(target);
  if (!isNaN(numericValue)) {
    // If it's close to a percentage (small number), treat as percent
    if (
      numericValue > -50 &&
      numericValue < 100 &&
      Math.abs(numericValue) < currentPrice * 0.5
    ) {
      return currentPrice * (1 + numericValue / 100);
    }
    return numericValue;
  }

  return currentPrice;
}

function formatChange(target: number, current: number): string {
  const change = ((target - current) / current) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default ScenarioChart;
