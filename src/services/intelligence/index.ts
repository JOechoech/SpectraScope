/**
 * Intelligence Service
 *
 * Orchestrates data gathering from multiple intelligence sources
 * for synthesis by the Claude Master AI.
 *
 * NEW ORCHESTRATOR PATTERN:
 * 1. Claude Opus analyzes the ticker and generates custom prompts
 * 2. Each AI (Grok, OpenAI, Gemini) receives tailored search instructions
 * 3. Claude Sonnet synthesizes all intelligence into scenarios
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type {
  AggregatedIntelligence,
  AnyIntelligenceReport,
  IntelligenceSource,
} from '@/types/intelligence';
import type { HistoricalDataPoint } from '@/types';

import { gatherTechnicalIntelligence } from './technical';
import { gatherNewsIntelligence } from './news';
import { gatherSocialIntelligence } from './social';
import { gatherResearchIntelligence } from './research';
import { gatherOptionsIntelligence } from './options';
import {
  getOrchestratorInstructions,
  type OrchestratorInstructions,
} from '@/services/ai/orchestrator';

// Re-export individual gatherers
export {
  gatherTechnicalIntelligence,
  gatherNewsIntelligence,
  gatherSocialIntelligence,
  gatherResearchIntelligence,
  gatherOptionsIntelligence,
};

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE AVAILABILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check which intelligence sources are available based on API keys
 */
export function getAvailableSources(): IntelligenceSource[] {
  const store = useApiKeysStore.getState();
  const sources: IntelligenceSource[] = [];

  // Technical analysis is always available (client-side)
  sources.push('technical-analysis');

  // News sentiment - OpenAI (replaces NewsAPI/MediaStack)
  if (store.hasApiKey('openai')) {
    sources.push('news-sentiment');
  }

  // Social sentiment - Grok (xAI)
  if (store.hasApiKey('grok')) {
    sources.push('social-sentiment');
  }

  // Web research - Gemini or Perplexity
  if (store.hasApiKey('gemini') || store.hasApiKey('perplexity')) {
    sources.push('web-research');
  }

  // Options flow - Polygon
  if (store.hasApiKey('polygon')) {
    sources.push('options-flow');
  }

  return sources;
}

/**
 * Get missing sources that could enhance analysis
 */
export function getMissingSources(): IntelligenceSource[] {
  const available = getAvailableSources();
  const allSources: IntelligenceSource[] = [
    'technical-analysis',
    'news-sentiment',
    'social-sentiment',
    'web-research',
    'options-flow',
  ];

  return allSources.filter((s) => !available.includes(s));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface GatherIntelligenceParams {
  symbol: string;
  companyName?: string;
  priceData: HistoricalDataPoint[];
  currentPrice: number;
  sector?: string;
}

/**
 * Gather intelligence from all available sources
 *
 * NEW ORCHESTRATOR FLOW:
 * 1. If Anthropic key available, ask Claude Opus for custom prompts
 * 2. Pass custom prompts to each AI source
 * 3. Gather all intelligence in parallel
 *
 * @param params - Symbol and price data for analysis
 * @returns Aggregated intelligence from all available sources
 */
export async function gatherIntelligence(
  params: GatherIntelligenceParams
): Promise<AggregatedIntelligence> {
  const { symbol, companyName, priceData, currentPrice, sector } = params;
  const availableSources = getAvailableSources();
  const missingSources = getMissingSources();
  const store = useApiKeysStore.getState();

  // Step 1: Get orchestrator instructions from Claude Opus (if available)
  let orchestratorInstructions: OrchestratorInstructions | null = null;
  const anthropicKey = store.getApiKey('anthropic');

  if (anthropicKey && companyName) {
    try {
      console.debug('[Intelligence] Calling Claude Opus orchestrator...');
      orchestratorInstructions = await getOrchestratorInstructions({
        symbol,
        companyName,
        sector,
        currentPrice,
        apiKey: anthropicKey,
      });
      console.debug('[Intelligence] Opus generated custom prompts:', orchestratorInstructions.keyTopics);
    } catch (error) {
      console.error('[Intelligence] Orchestrator failed, using default prompts:', error);
    }
  }

  // Step 2: Gather from all available sources in parallel (with custom prompts)
  const gatherPromises: Promise<AnyIntelligenceReport | null>[] = [];

  // Technical Analysis (always available - no custom prompt needed)
  gatherPromises.push(
    gatherTechnicalIntelligence(symbol, priceData, currentPrice)
  );

  // News Sentiment (OpenAI with custom prompt)
  if (availableSources.includes('news-sentiment')) {
    gatherPromises.push(
      gatherNewsIntelligence(symbol, companyName, orchestratorInstructions?.openaiPrompt)
    );
  } else {
    gatherPromises.push(Promise.resolve(null));
  }

  // Social Sentiment (Grok/X with custom prompt)
  if (availableSources.includes('social-sentiment')) {
    gatherPromises.push(
      gatherSocialIntelligence(symbol, companyName, orchestratorInstructions?.grokPrompt)
    );
  } else {
    gatherPromises.push(Promise.resolve(null));
  }

  // Web Research (Gemini with custom prompt)
  if (availableSources.includes('web-research')) {
    gatherPromises.push(
      gatherResearchIntelligence(symbol, companyName, currentPrice, orchestratorInstructions?.geminiPrompt)
    );
  } else {
    gatherPromises.push(Promise.resolve(null));
  }

  // Options Flow (no custom prompt - data-based)
  if (availableSources.includes('options-flow')) {
    gatherPromises.push(gatherOptionsIntelligence(symbol));
  } else {
    gatherPromises.push(Promise.resolve(null));
  }

  // Wait for all sources
  const results = await Promise.all(gatherPromises);

  // Filter out null results and failed fetches
  const reports = results.filter(
    (r): r is AnyIntelligenceReport => r !== null
  );

  // Calculate data quality
  const dataQuality = calculateDataQualityFromReports(reports, availableSources);

  // Include orchestrator info in the result
  const intelligence: AggregatedIntelligence = {
    symbol,
    companyName,
    timestamp: new Date().toISOString(),
    reports,
    availableSources,
    missingSources,
    dataQuality,
  };

  // Add orchestrator metadata if available
  if (orchestratorInstructions) {
    (intelligence as any).orchestrator = {
      companyType: orchestratorInstructions.companyType,
      keyTopics: orchestratorInstructions.keyTopics,
      tokenUsage: orchestratorInstructions.tokenUsage,
    };
  }

  return intelligence;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA QUALITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateDataQualityFromReports(
  reports: AnyIntelligenceReport[],
  availableSources: IntelligenceSource[]
): AggregatedIntelligence['dataQuality'] {
  // Weight each source
  const sourceWeights: Record<IntelligenceSource, number> = {
    'technical-analysis': 25,
    'news-sentiment': 25,
    'social-sentiment': 15,
    'web-research': 20,
    'options-flow': 15,
  };

  // Calculate base score from available sources
  let score = availableSources.reduce(
    (sum, source) => sum + sourceWeights[source],
    0
  );

  // Adjust based on actual report confidence
  const avgConfidence =
    reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length || 0;
  score = Math.round(score * (avgConfidence / 100));

  // Determine label
  let label: AggregatedIntelligence['dataQuality']['label'];
  if (score >= 80) label = 'excellent';
  else if (score >= 60) label = 'good';
  else if (score >= 40) label = 'limited';
  else label = 'minimal';

  return { score, label };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK GATHER (Technical only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick gather - only technical analysis (free, instant)
 */
export async function gatherQuickIntelligence(
  symbol: string,
  priceData: HistoricalDataPoint[],
  currentPrice: number
): Promise<AggregatedIntelligence> {
  const technicalReport = await gatherTechnicalIntelligence(
    symbol,
    priceData,
    currentPrice
  );

  return {
    symbol,
    timestamp: new Date().toISOString(),
    reports: technicalReport ? [technicalReport] : [],
    availableSources: ['technical-analysis'],
    missingSources: [
      'news-sentiment',
      'social-sentiment',
      'web-research',
      'options-flow',
    ],
    dataQuality: {
      score: 25,
      label: 'minimal',
    },
  };
}
