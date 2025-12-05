import { memo } from 'react';
import {
  BarChart3,
  Newspaper,
  MessageCircle,
  Search,
  TrendingUp,
  Check,
  X,
  Info,
} from 'lucide-react';
import type { IntelligenceSource, AggregatedIntelligence } from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SourceAttributionProps {
  availableSources: IntelligenceSource[];
  missingSources: IntelligenceSource[];
  dataQuality?: AggregatedIntelligence['dataQuality'];
  showDetails?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

interface SourceConfig {
  id: IntelligenceSource;
  label: string;
  shortLabel: string;
  icon: typeof BarChart3;
  emoji: string;
  description: string;
  color: string;
}

const sourceConfigs: SourceConfig[] = [
  {
    id: 'technical-analysis',
    label: 'Technical Analysis',
    shortLabel: 'Tech',
    icon: BarChart3,
    emoji: '📊',
    description: 'RSI, MACD, Moving Averages',
    color: 'text-blue-400',
  },
  {
    id: 'news-sentiment',
    label: 'News Sentiment',
    shortLabel: 'News',
    icon: Newspaper,
    emoji: '📰',
    description: 'Financial news analysis',
    color: 'text-amber-400',
  },
  {
    id: 'social-sentiment',
    label: 'Social Sentiment',
    shortLabel: 'Social',
    icon: MessageCircle,
    emoji: '🐦',
    description: 'Twitter/X via Grok',
    color: 'text-cyan-400',
  },
  {
    id: 'web-research',
    label: 'Web Research',
    shortLabel: 'Research',
    icon: Search,
    emoji: '🔍',
    description: 'Perplexity AI research',
    color: 'text-purple-400',
  },
  {
    id: 'options-flow',
    label: 'Options Flow',
    shortLabel: 'Options',
    icon: TrendingUp,
    emoji: '📈',
    description: 'Institutional positioning',
    color: 'text-emerald-400',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SourceAttribution - Shows which intelligence sources contributed to analysis
 *
 * Visual indicator of data completeness with icons for each source.
 */
export const SourceAttribution = memo(function SourceAttribution({
  availableSources,
  missingSources,
  dataQuality,
  showDetails = false,
  className = '',
}: SourceAttributionProps) {
  const sourceCount = availableSources.length;
  const totalSources = sourceConfigs.length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-slate-500" />
          <span className="text-slate-400 text-sm font-medium">
            Data Sources
          </span>
        </div>
        <span className="text-slate-500 text-xs">
          {sourceCount}/{totalSources} available
        </span>
      </div>

      {/* Source Icons Row */}
      <div className="flex items-center gap-2">
        {sourceConfigs.map((config) => {
          const isAvailable = availableSources.includes(config.id);
          return (
            <SourceIcon
              key={config.id}
              config={config}
              isAvailable={isAvailable}
              showDetails={showDetails}
            />
          );
        })}
      </div>

      {/* Data Quality Badge */}
      {dataQuality && (
        <DataQualityBadge quality={dataQuality} />
      )}

      {/* Details (optional) */}
      {showDetails && missingSources.length > 0 && (
        <MissingSourcesHint missingSources={missingSources} />
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface SourceIconProps {
  config: SourceConfig;
  isAvailable: boolean;
  showDetails: boolean;
}

const SourceIcon = memo(function SourceIcon({
  config,
  isAvailable,
  showDetails,
}: SourceIconProps) {
  const Icon = config.icon;

  return (
    <div
      className={`
        relative group flex items-center gap-1.5 px-2 py-1.5 rounded-lg
        transition-all duration-200
        ${
          isAvailable
            ? 'bg-slate-800/50 border border-slate-700/50'
            : 'bg-slate-900/30 border border-slate-800/30 opacity-50'
        }
      `}
      title={`${config.label}: ${isAvailable ? 'Available' : 'Not configured'}`}
    >
      {/* Icon */}
      <Icon
        size={14}
        className={isAvailable ? config.color : 'text-slate-600'}
      />

      {/* Label (on larger screens or when showDetails) */}
      {showDetails && (
        <span
          className={`text-xs font-medium ${
            isAvailable ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {config.shortLabel}
        </span>
      )}

      {/* Status indicator */}
      <div
        className={`
          absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full
          flex items-center justify-center
          ${isAvailable ? 'bg-emerald-500' : 'bg-slate-700'}
        `}
      >
        {isAvailable ? (
          <Check size={8} className="text-white" />
        ) : (
          <X size={8} className="text-slate-400" />
        )}
      </div>

      {/* Tooltip on hover */}
      <div
        className={`
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg
          text-xs text-slate-300 whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-200 z-10
        `}
      >
        {config.label}
        <div className="text-slate-500">{config.description}</div>
      </div>
    </div>
  );
});

interface DataQualityBadgeProps {
  quality: AggregatedIntelligence['dataQuality'];
}

const DataQualityBadge = memo(function DataQualityBadge({
  quality,
}: DataQualityBadgeProps) {
  const config = {
    excellent: { color: 'text-emerald-400 bg-emerald-500/20', label: 'Excellent Data' },
    good: { color: 'text-blue-400 bg-blue-500/20', label: 'Good Data' },
    limited: { color: 'text-amber-400 bg-amber-500/20', label: 'Limited Data' },
    minimal: { color: 'text-slate-400 bg-slate-500/20', label: 'Minimal Data' },
  };

  const { color, label } = config[quality.label];

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${color}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs opacity-70">({quality.score}%)</span>
    </div>
  );
});

interface MissingSourcesHintProps {
  missingSources: IntelligenceSource[];
}

const MissingSourcesHint = memo(function MissingSourcesHint({
  missingSources,
}: MissingSourcesHintProps) {
  const missingConfigs = sourceConfigs.filter((c) =>
    missingSources.includes(c.id)
  );

  return (
    <div className="text-xs text-slate-500 bg-slate-900/30 border border-slate-800/50 rounded-lg p-2.5">
      <p className="font-medium text-slate-400 mb-1">
        Enhance your analysis by adding:
      </p>
      <ul className="space-y-0.5">
        {missingConfigs.map((config) => (
          <li key={config.id} className="flex items-center gap-2">
            <span>{config.emoji}</span>
            <span>{config.label}</span>
            <span className="text-slate-600">- {config.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT
// ═══════════════════════════════════════════════════════════════════════════

interface SourceAttributionCompactProps {
  availableSources: IntelligenceSource[];
  className?: string;
}

/**
 * Compact version - just shows emoji indicators
 */
export const SourceAttributionCompact = memo(function SourceAttributionCompact({
  availableSources,
  className = '',
}: SourceAttributionCompactProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-slate-500 text-xs mr-1">Sources:</span>
      {sourceConfigs.map((config) => {
        const isAvailable = availableSources.includes(config.id);
        return (
          <span
            key={config.id}
            className={isAvailable ? '' : 'opacity-30'}
            title={`${config.label}: ${isAvailable ? '✓' : '✗'}`}
          >
            {config.emoji}
          </span>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for cards)
// ═══════════════════════════════════════════════════════════════════════════

interface SourceAttributionInlineProps {
  availableSources: IntelligenceSource[];
  missingSources: IntelligenceSource[];
}

/**
 * Inline version for scenario cards
 */
export const SourceAttributionInline = memo(function SourceAttributionInline({
  availableSources,
  missingSources,
}: SourceAttributionInlineProps) {
  const count = availableSources.length;
  const total = count + missingSources.length;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>Analysis based on {count}/{total} sources</span>
      <div className="flex items-center gap-0.5">
        {sourceConfigs.map((config) => (
          <span
            key={config.id}
            className={`text-[10px] ${
              availableSources.includes(config.id)
                ? 'text-emerald-400'
                : 'text-slate-600'
            }`}
          >
            {availableSources.includes(config.id) ? '●' : '○'}
          </span>
        ))}
      </div>
    </div>
  );
});

export default SourceAttribution;
