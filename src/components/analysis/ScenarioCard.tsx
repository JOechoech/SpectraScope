/**
 * ScenarioCard - Display AI-generated scenario (Bull/Bear/Base)
 *
 * Shows probability, price target, summary, catalysts, and risks
 */

import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Scenario } from '@/types';

export interface ScenarioCardProps {
  /** Scenario type */
  type: 'bull' | 'bear' | 'base';
  /** Scenario data */
  scenario: Scenario;
}

const scenarioConfig = {
  bull: {
    icon: TrendingUp,
    label: 'Bull Case',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-500',
    accentColor: 'text-emerald-400',
  },
  bear: {
    icon: TrendingDown,
    label: 'Bear Case',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-500',
    accentColor: 'text-rose-400',
  },
  base: {
    icon: Minus,
    label: 'Base Case',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-500',
    accentColor: 'text-blue-400',
  },
};

export const ScenarioCard = memo(function ScenarioCard({
  type,
  scenario,
}: ScenarioCardProps) {
  const config = scenarioConfig[type];
  const Icon = config.icon;

  // Handle null/undefined scenario
  if (!scenario) {
    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.textColor}`} />
          <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">No data available</p>
      </div>
    );
  }

  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.textColor}`} />
          <span className={`font-semibold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">
            {scenario.probability ?? 0}%
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-white font-medium mb-2">{scenario.title || 'Untitled'}</h4>

      {/* Price Target */}
      <div className={`${config.accentColor} text-sm mb-3`}>
        Target: {scenario.priceTarget || 'N/A'} ({scenario.timeframe || 'Unknown'})
      </div>

      {/* Summary */}
      <p className="text-slate-300 text-sm mb-4">{scenario.summary || 'No summary available.'}</p>

      {/* Catalysts */}
      {scenario.catalysts && scenario.catalysts.length > 0 && (
        <div className="mb-3">
          <h5 className="text-slate-400 text-xs uppercase mb-2 font-medium">
            Catalysts
          </h5>
          <ul className="space-y-1">
            {scenario.catalysts.map((catalyst, i) => (
              <li
                key={i}
                className="text-slate-300 text-sm flex items-start gap-2"
              >
                <span className={config.textColor}>\u2022</span>
                {catalyst}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {scenario.risks && scenario.risks.length > 0 && (
        <div>
          <h5 className="text-slate-400 text-xs uppercase mb-2 font-medium">
            Risks
          </h5>
          <ul className="space-y-1">
            {scenario.risks.map((risk, i) => (
              <li
                key={i}
                className="text-slate-400 text-sm flex items-start gap-2"
              >
                <span className="text-slate-500">\u2022</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default ScenarioCard;
