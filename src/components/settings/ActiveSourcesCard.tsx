/**
 * ActiveSourcesCard - Shows currently active intelligence sources
 *
 * Displays which sources are configured and provides a quality score
 * based on the number of active sources.
 *
 * IMPORTANT: Uses individual selectors for reactivity when keys change.
 */

import { memo, useMemo } from 'react';
import {
  BarChart3,
  Newspaper,
  MessageCircle,
  Search,
  TrendingUp,
  Check,
  X,
} from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { IntelligenceSource } from '@/types/intelligence';

interface SourceConfig {
  id: IntelligenceSource;
  label: string;
  icon: typeof BarChart3;
  requiredKeys: string[]; // Keys that enable this source (OR logic)
  alwaysActive?: boolean;
}

const sourceConfigs: SourceConfig[] = [
  {
    id: 'technical-analysis',
    label: 'Technicals',
    icon: BarChart3,
    requiredKeys: [],
    alwaysActive: true, // Always available (client-side)
  },
  {
    id: 'news-sentiment',
    label: 'News',
    icon: Newspaper,
    requiredKeys: ['newsapi', 'mediastack', 'finnhub'], // Any of these
  },
  {
    id: 'social-sentiment',
    label: 'Social',
    icon: MessageCircle,
    requiredKeys: ['grok'],
  },
  {
    id: 'web-research',
    label: 'Research',
    icon: Search,
    requiredKeys: ['gemini', 'perplexity'], // Either Gemini or Perplexity
  },
  {
    id: 'options-flow',
    label: 'Options',
    icon: TrendingUp,
    requiredKeys: ['polygon'],
  },
];

export const ActiveSourcesCard = memo(function ActiveSourcesCard() {
  // IMPORTANT: Subscribe to individual keys for reactivity!
  // When any of these change, the component re-renders
  const encodedKeys = useApiKeysStore((state) => state.encodedKeys);
  const { hasApiKey } = useApiKeysStore();

  // Calculate which sources are active based on current keys
  const sourceStates = useMemo(() => {
    return sourceConfigs.map((source) => {
      const isActive = source.alwaysActive ||
        source.requiredKeys.some((key) => hasApiKey(key as any));
      return { ...source, isActive };
    });
  }, [encodedKeys, hasApiKey]);

  const activeCount = sourceStates.filter((s) => s.isActive).length;

  const totalSources = sourceConfigs.length;
  const qualityPercent = Math.round((activeCount / totalSources) * 100);

  // Quality label
  let qualityLabel: string;
  let qualityColor: string;
  if (qualityPercent >= 80) {
    qualityLabel = 'Excellent';
    qualityColor = 'text-emerald-400';
  } else if (qualityPercent >= 60) {
    qualityLabel = 'Good';
    qualityColor = 'text-blue-400';
  } else if (qualityPercent >= 40) {
    qualityLabel = 'Limited';
    qualityColor = 'text-amber-400';
  } else {
    qualityLabel = 'Minimal';
    qualityColor = 'text-rose-400';
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-4">
        Active Intelligence Sources
      </h3>

      {/* Source grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {sourceStates.map((source) => {
          const Icon = source.icon;

          return (
            <div
              key={source.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                source.isActive
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-slate-800/30 border border-slate-700/30'
              }`}
            >
              <Icon
                size={16}
                className={source.isActive ? 'text-emerald-400' : 'text-slate-500'}
              />
              <span
                className={`text-sm ${
                  source.isActive ? 'text-emerald-300' : 'text-slate-500'
                }`}
              >
                {source.label}
              </span>
              {source.isActive ? (
                <Check size={14} className="ml-auto text-emerald-400" />
              ) : (
                <X size={14} className="ml-auto text-slate-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* Quality bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Analysis Quality</span>
          <span className={qualityColor}>
            {qualityLabel} ({activeCount}/{totalSources} sources)
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              qualityPercent >= 80
                ? 'bg-emerald-500'
                : qualityPercent >= 60
                ? 'bg-blue-500'
                : qualityPercent >= 40
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${qualityPercent}%` }}
          />
        </div>
      </div>

      {/* Tip */}
      {activeCount < totalSources && (
        <p className="text-slate-500 text-xs mt-3">
          Add more API keys below to improve analysis quality and unlock
          additional intelligence sources.
        </p>
      )}
    </div>
  );
});

export default ActiveSourcesCard;
