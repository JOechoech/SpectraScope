import { memo } from 'react';
import { TrendingUp, TrendingDown, Activity, ChevronDown } from 'lucide-react';
import type { ScenarioMock } from '@/services/mockData';

type ScenarioType = 'bull' | 'bear' | 'base';

interface ScenarioCardProps {
  type: ScenarioType;
  data: ScenarioMock;
  expanded: boolean;
  onToggle: () => void;
}

const scenarioConfigs = {
  bull: {
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  bear: {
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
    icon: TrendingDown,
    iconColor: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400',
    ring: 'ring-rose-500/30',
  },
  base: {
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
    icon: Activity,
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    ring: 'ring-blue-500/30',
  },
};

/**
 * ScenarioCard - Bull/Bear/Base case display
 * Expandable card with probability, price target, and catalysts
 */
export const ScenarioCard = memo(function ScenarioCard({
  type,
  data,
  expanded,
  onToggle,
}: ScenarioCardProps) {
  const config = scenarioConfigs[type];
  const Icon = config.icon;

  return (
    <div
      onClick={onToggle}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        bg-gradient-to-br ${config.gradient}
        border ${config.border}
        backdrop-blur-xl
        shadow-lg ${config.glow}
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${expanded ? `ring-2 ${config.ring}` : ''}
      `}
    >
      {/* Animated glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-50 animate-pulse`}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-slate-900/50 ${config.iconColor}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm tracking-wide">
                {data.title}
              </h3>
              <p className="text-slate-400 text-xs">{data.timeframe}</p>
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full ${config.badge} text-sm font-bold`}
          >
            {data.probability}%
          </div>
        </div>

        {/* Price Target */}
        <div className="mb-4">
          <span className="text-slate-500 text-xs uppercase tracking-wider">
            Price Target
          </span>
          <p className={`text-2xl font-bold ${config.iconColor} mt-1`}>
            {data.priceTarget}
          </p>
        </div>

        {/* Summary */}
        <p
          className={`text-slate-300 text-sm leading-relaxed ${
            expanded ? '' : 'line-clamp-2'
          }`}
        >
          {data.summary}
        </p>

        {/* Catalysts (expanded view) */}
        {expanded && data.catalysts && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <span className="text-slate-500 text-xs uppercase tracking-wider">
              Key Catalysts
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.catalysts.map((catalyst, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300"
                >
                  {catalyst}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand indicator */}
        <div className="flex justify-center mt-4">
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
});

export default ScenarioCard;
