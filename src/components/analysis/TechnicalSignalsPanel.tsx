/**
 * TechnicalSignalsPanel - Display technical analysis signals
 *
 * Shows RSI, MACD, SMA signals with aggregate score and glow effect.
 * Tap on any indicator to see educational info about what it means.
 */

import { useMemo, memo, useState } from 'react';
import { Info } from 'lucide-react';
import { SignalBadge } from '@/components/ui/SignalBadge';
import { IndicatorTooltip } from './IndicatorTooltip';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateBollingerBands,
} from '@/utils/technicals';
import {
  getRSISignal,
  getMACDSignal,
  getSMASignal,
  getBollingerSignal,
  calculateAggregateScore,
} from '@/utils/signals';

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalSignalsPanelProps {
  /** Historical price data */
  priceData: HistoricalDataPoint[];
  /** Current stock price */
  currentPrice: number;
}

export const TechnicalSignalsPanel = memo(function TechnicalSignalsPanel({
  priceData,
  currentPrice,
}: TechnicalSignalsPanelProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<{
    name: string;
    signal: 'bullish' | 'neutral' | 'bearish';
  } | null>(null);

  const analysis = useMemo(() => {
    if (priceData.length < 26) return null;

    const closes = priceData.map((d) => d.close);

    try {
      const rsi = calculateRSI(closes);
      const macd = calculateMACD(closes);
      const sma20 = calculateSMA(closes, 20);
      const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : sma20;
      const bollinger = calculateBollingerBands(closes);

      const rsiSignal = getRSISignal(rsi);
      const macdSignal = getMACDSignal(macd.histogram, macd.histogram - macd.signal);
      const sma20Signal = getSMASignal(currentPrice, sma20, 20);
      const sma50Signal = getSMASignal(currentPrice, sma50, 50);
      const bollingerSignal = getBollingerSignal(
        currentPrice,
        bollinger.upper,
        bollinger.middle,
        bollinger.lower
      );

      const signals = [
        {
          name: 'RSI (14)',
          displayValue: rsi.toFixed(1),
          signal: rsiSignal.signal,
          label: rsiSignal.label,
          description: rsiSignal.description,
        },
        {
          name: 'MACD',
          displayValue: macd.histogram.toFixed(3),
          signal: macdSignal.signal,
          label: macdSignal.label,
          description: macdSignal.description,
        },
        {
          name: 'SMA 20',
          displayValue: currentPrice > sma20 ? 'Above' : 'Below',
          signal: sma20Signal.signal,
          label: sma20Signal.label,
          description: sma20Signal.description,
        },
        {
          name: 'SMA 50',
          displayValue: currentPrice > sma50 ? 'Above' : 'Below',
          signal: sma50Signal.signal,
          label: sma50Signal.label,
          description: sma50Signal.description,
        },
        {
          name: 'Bollinger',
          displayValue: getBollingerPosition(currentPrice, bollinger),
          signal: bollingerSignal.signal,
          label: bollingerSignal.label,
          description: bollingerSignal.description,
        },
      ];

      const aggregate = calculateAggregateScore(signals);

      return { signals, aggregate };
    } catch (error) {
      console.error('Technical analysis error:', error);
      return null;
    }
  }, [priceData, currentPrice]);

  if (!analysis) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
        <p className="text-slate-400 text-center">
          Not enough data for analysis
        </p>
      </div>
    );
  }

  const { signals, aggregate } = analysis;

  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4 ${
        aggregate.glowEffect || ''
      }`}
    >
      {/* Header with Aggregate Score */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Technical Signals</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">{aggregate.label}</span>
          <SignalBadge signal={aggregate.sentiment} />
        </div>
      </div>

      {/* Signal List - Tap for info */}
      <div className="space-y-2">
        {signals.map((signal) => (
          <div
            key={signal.name}
            onClick={() =>
              setSelectedIndicator({
                name: signal.name,
                signal: signal.signal,
              })
            }
            className="flex items-center justify-between py-2 px-2 -mx-2 border-b border-slate-800/50 last:border-0 cursor-pointer hover:bg-slate-800/50 rounded transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{signal.name}</span>
              <Info className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-sm">
                {signal.displayValue}
              </span>
              <SignalBadge
                signal={signal.signal}
                label={signal.label}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Signal Summary */}
      <div className="mt-4 pt-3 border-t border-slate-800/50">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            {aggregate.bullishCount} bullish / {aggregate.bearishCount} bearish
          </span>
          <span className="text-slate-400">
            {aggregate.percentage.toFixed(0)}% bullish
          </span>
        </div>
      </div>

      {/* Indicator Info Tooltip */}
      {selectedIndicator && (
        <IndicatorTooltip
          indicatorName={selectedIndicator.name}
          currentSignal={selectedIndicator.signal}
          onClose={() => setSelectedIndicator(null)}
        />
      )}
    </div>
  );
});

function getBollingerPosition(
  price: number,
  bands: { upper: number; lower: number; middle: number }
): string {
  if (price >= bands.upper * 0.98) return 'Upper';
  if (price <= bands.lower * 1.02) return 'Lower';
  return 'Middle';
}

export default TechnicalSignalsPanel;
