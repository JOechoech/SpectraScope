/**
 * IndicatorTooltip - Modal explaining technical indicators
 *
 * Shows educational content about what each indicator means
 * and how to interpret the current signal.
 */

import { memo } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getIndicatorInfo } from '@/data/indicatorInfo';

interface IndicatorTooltipProps {
  /** Name of the indicator to show info for */
  indicatorName: string;
  /** Current signal state */
  currentSignal: 'bullish' | 'neutral' | 'bearish';
  /** Callback when modal is closed */
  onClose: () => void;
}

export const IndicatorTooltip = memo(function IndicatorTooltip({
  indicatorName,
  currentSignal,
  onClose,
}: IndicatorTooltipProps) {
  const info = getIndicatorInfo(indicatorName);

  if (!info) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 rounded-t-2xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{info.fullName}</h3>
            <p className="text-slate-400 text-sm">{info.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-300 mb-4">{info.description}</p>

        {/* Range if applicable */}
        {info.range && (
          <div className="mb-4 text-sm text-slate-400">Range: {info.range}</div>
        )}

        {/* Interpretation */}
        <div className="space-y-3">
          <h4 className="text-slate-400 text-sm font-medium uppercase">
            How to Read
          </h4>

          {/* Bullish */}
          <div
            className={`p-3 rounded-lg ${
              currentSignal === 'bullish'
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Bullish</span>
              {currentSignal === 'bullish' && (
                <span className="text-xs bg-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm">
              {info.interpretation.bullish}
            </p>
          </div>

          {/* Neutral */}
          <div
            className={`p-3 rounded-lg ${
              currentSignal === 'neutral'
                ? 'bg-slate-700 border border-slate-600'
                : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">Neutral</span>
              {currentSignal === 'neutral' && (
                <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {info.interpretation.neutral}
            </p>
          </div>

          {/* Bearish */}
          <div
            className={`p-3 rounded-lg ${
              currentSignal === 'bearish'
                ? 'bg-rose-500/20 border border-rose-500/30'
                : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400 font-medium">Bearish</span>
              {currentSignal === 'bearish' && (
                <span className="text-xs bg-rose-500/30 text-rose-400 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm">
              {info.interpretation.bearish}
            </p>
          </div>
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
});

export default IndicatorTooltip;
