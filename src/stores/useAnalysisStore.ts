import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scenario, TechnicalIndicators } from '@/types';
import type { AggregateScore } from '@/utils/signals';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalysisInputData {
  price: number;
  change: number;
  changePercent: number;
  technicals: TechnicalIndicators;
  aggregateScore: AggregateScore;
  newsHeadlines: string[];
}

export interface AnalysisResult {
  bull: Scenario;
  bear: Scenario;
  base: Scenario;
  confidence: number;
  reasoning: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface AnalysisEntry {
  id: string;
  symbol: string;
  timestamp: string;
  type: 'quick-scan' | 'deep-dive';

  // Input snapshot (for reproducibility)
  inputData: AnalysisInputData;

  // AI Result
  result: AnalysisResult;

  // Cost tracking
  tokenUsage: TokenUsage;
  cost: number;

  // Dominant scenario for quick reference
  dominantScenario: 'bull' | 'bear' | 'base';
}

interface AnalysisState {
  // Storage: symbol -> analysis history
  analyses: Record<string, AnalysisEntry[]>;

  // Aggregate stats
  totalCost: number;
  totalAnalyses: number;

  // Current analysis state
  isAnalyzing: boolean;
  currentSymbol: string | null;

  // Actions
  addAnalysis: (symbol: string, entry: AnalysisEntry) => void;
  getLatestAnalysis: (symbol: string) => AnalysisEntry | null;
  getHistory: (symbol: string) => AnalysisEntry[];
  clearHistory: (symbol?: string) => void;
  setAnalyzing: (isAnalyzing: boolean, symbol?: string) => void;

  // Stats
  getTotalCostForSymbol: (symbol: string) => number;
  getAnalysisCount: (symbol: string) => number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDominantScenario(result: AnalysisResult): 'bull' | 'bear' | 'base' {
  // Handle null/undefined result or scenarios
  if (!result) return 'base';

  const bull = result.bull;
  const bear = result.bear;
  const base = result.base;

  // Handle missing scenarios
  const bullProb = bull?.probability ?? 0;
  const bearProb = bear?.probability ?? 0;
  const baseProb = base?.probability ?? 0;

  if (bullProb >= bearProb && bullProb >= baseProb) {
    return 'bull';
  }
  if (bearProb >= bullProb && bearProb >= baseProb) {
    return 'bear';
  }
  return 'base';
}

function cleanOldEntries(
  analyses: Record<string, AnalysisEntry[]>,
  maxAgeDays: number = 30
): Record<string, AnalysisEntry[]> {
  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const cleaned: Record<string, AnalysisEntry[]> = {};

  Object.entries(analyses).forEach(([symbol, entries]) => {
    const validEntries = entries.filter(
      (entry) => new Date(entry.timestamp).getTime() > cutoffTime
    );
    if (validEntries.length > 0) {
      cleaned[symbol] = validEntries;
    }
  });

  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      analyses: {},
      totalCost: 0,
      totalAnalyses: 0,
      isAnalyzing: false,
      currentSymbol: null,

      addAnalysis: (symbol, entry) => {
        const entryWithId: AnalysisEntry = {
          ...entry,
          id: entry.id || generateId(),
          symbol,
          dominantScenario: getDominantScenario(entry.result),
        };

        set((state) => {
          const existing = state.analyses[symbol] || [];
          // Keep max 10 entries per symbol, newest first
          const updated = [entryWithId, ...existing].slice(0, 10);

          return {
            analyses: { ...state.analyses, [symbol]: updated },
            totalCost: state.totalCost + entry.cost,
            totalAnalyses: state.totalAnalyses + 1,
          };
        });
      },

      getLatestAnalysis: (symbol) => {
        const history = get().analyses[symbol];
        return history?.[0] || null;
      },

      getHistory: (symbol) => {
        return get().analyses[symbol] || [];
      },

      clearHistory: (symbol) => {
        set((state) => {
          if (symbol) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [symbol]: removed, ...rest } = state.analyses;
            const removedCost = (state.analyses[symbol] || []).reduce(
              (sum, entry) => sum + entry.cost,
              0
            );
            return {
              analyses: rest,
              totalCost: Math.max(0, state.totalCost - removedCost),
            };
          }
          return { analyses: {}, totalCost: 0, totalAnalyses: 0 };
        });
      },

      setAnalyzing: (isAnalyzing, symbol) => {
        set({ isAnalyzing, currentSymbol: symbol || null });
      },

      getTotalCostForSymbol: (symbol) => {
        const entries = get().analyses[symbol] || [];
        return entries.reduce((sum, entry) => sum + entry.cost, 0);
      },

      getAnalysisCount: (symbol) => {
        return (get().analyses[symbol] || []).length;
      },
    }),
    {
      name: 'spectrascope-analysis',
      version: 1,
      // Clean up old entries on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.analyses = cleanOldEntries(state.analyses);
          // Reset transient state
          state.isAnalyzing = false;
          state.currentSymbol = null;
        }
      },
      // Only persist these fields
      partialize: (state) => ({
        analyses: state.analyses,
        totalCost: state.totalCost,
        totalAnalyses: state.totalAnalyses,
      }),
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Calculate cost from token usage
// ═══════════════════════════════════════════════════════════════════════════

// Claude Sonnet pricing (as of 2025)
const CLAUDE_PRICING = {
  input: 0.003, // $3 per 1M tokens
  output: 0.015, // $15 per 1M tokens
};

export function calculateCost(tokenUsage: TokenUsage): number {
  const inputCost = (tokenUsage.input / 1_000_000) * CLAUDE_PRICING.input;
  const outputCost = (tokenUsage.output / 1_000_000) * CLAUDE_PRICING.output;
  return inputCost + outputCost;
}

export function estimateCost(inputTokens: number = 2000, outputTokens: number = 1500): {
  min: number;
  max: number;
  avg: number;
} {
  // Estimate ranges based on typical analysis
  const minInput = inputTokens * 0.8;
  const maxInput = inputTokens * 1.2;
  const minOutput = outputTokens * 0.8;
  const maxOutput = outputTokens * 1.2;

  return {
    min: calculateCost({ input: minInput, output: minOutput, total: minInput + minOutput }),
    max: calculateCost({ input: maxInput, output: maxOutput, total: maxInput + maxOutput }),
    avg: calculateCost({ input: inputTokens, output: outputTokens, total: inputTokens + outputTokens }),
  };
}

export default useAnalysisStore;
