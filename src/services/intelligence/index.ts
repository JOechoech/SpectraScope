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

export interface GatherIntelligenceProgress {
  phase: 'orchestrating' | 'searching' | 'synthesizing';
  keywords?: string[];
  agentProgress?: {
    grok?: { progress: number; keywords: string[] };
    openai?: { progress: number; keywords: string[] };
    gemini?: { progress: number; keywords: string[] };
  };
}

export interface GatherIntelligenceParams {
  symbol: string;
  companyName?: string;
  priceData: HistoricalDataPoint[];
  currentPrice: number;
  sector?: string;
  onProgress?: (progress: GatherIntelligenceProgress) => void;
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
  const { symbol, companyName, priceData, currentPrice, sector, onProgress } = params;
  const availableSources = getAvailableSources();
  const missingSources = getMissingSources();
  const store = useApiKeysStore.getState();

  // Step 1: Get orchestrator instructions from Claude Opus (if available)
  let orchestratorInstructions: OrchestratorInstructions | null = null;
  const anthropicKey = store.getApiKey('anthropic');

  // Report orchestrating phase
  onProgress?.({ phase: 'orchestrating' });

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

      // Report keywords from orchestrator
      onProgress?.({
        phase: 'orchestrating',
        keywords: orchestratorInstructions.keyTopics,
      });
    } catch (error) {
      console.error('[Intelligence] Orchestrator failed, using default prompts:', error);
    }
  }

  // Step 2: Gather from all available sources in parallel (with custom prompts)
  // Report searching phase
  onProgress?.({
    phase: 'searching',
    keywords: orchestratorInstructions?.keyTopics,
    agentProgress: {
      grok: { progress: 0, keywords: [] },
      openai: { progress: 0, keywords: [] },
      gemini: { progress: 0, keywords: [] },
    },
  });

  // Extract keywords for each agent from their prompts
  const extractKeywords = (prompt?: string): string[] => {
    if (!prompt) return [];
    // Extract key terms from the prompt (simplified extraction)
    const words = prompt.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = ['this', 'that', 'with', 'from', 'have', 'what', 'when', 'where', 'which', 'will', 'about', 'your', 'their', 'these', 'those', 'would', 'could', 'should', 'being', 'having'];
    return [...new Set(words.filter(w => !stopWords.includes(w)))].slice(0, 4);
  };

  const grokKeywords = extractKeywords(orchestratorInstructions?.grokPrompt) || ['sentiment', 'trending', 'viral'];
  const openaiKeywords = extractKeywords(orchestratorInstructions?.openaiPrompt) || ['earnings', 'press', 'news'];
  const geminiKeywords = extractKeywords(orchestratorInstructions?.geminiPrompt) || ['analyst', 'target', 'rating'];

  // Track individual agent progress
  const agentProgress = {
    grok: { progress: 0, keywords: grokKeywords },
    openai: { progress: 0, keywords: openaiKeywords },
    gemini: { progress: 0, keywords: geminiKeywords },
  };

  // Technical Analysis (always available - no custom prompt needed)
  const technicalPromise = gatherTechnicalIntelligence(symbol, priceData, currentPrice);

  // News Sentiment (OpenAI with custom prompt)
  const newsPromise = availableSources.includes('news-sentiment')
    ? gatherNewsIntelligence(symbol, companyName, orchestratorInstructions?.openaiPrompt)
        .then((result) => {
          agentProgress.openai.progress = 100;
          onProgress?.({ phase: 'searching', keywords: orchestratorInstructions?.keyTopics, agentProgress });
          return result;
        })
    : Promise.resolve(null);

  // Social Sentiment (Grok/X with custom prompt)
  const socialPromise = availableSources.includes('social-sentiment')
    ? gatherSocialIntelligence(symbol, companyName, orchestratorInstructions?.grokPrompt)
        .then((result) => {
          agentProgress.grok.progress = 100;
          onProgress?.({ phase: 'searching', keywords: orchestratorInstructions?.keyTopics, agentProgress });
          return result;
        })
    : Promise.resolve(null);

  // Web Research (Gemini with custom prompt)
  const researchPromise = availableSources.includes('web-research')
    ? gatherResearchIntelligence(symbol, companyName, currentPrice, orchestratorInstructions?.geminiPrompt)
        .then((result) => {
          agentProgress.gemini.progress = 100;
          onProgress?.({ phase: 'searching', keywords: orchestratorInstructions?.keyTopics, agentProgress });
          return result;
        })
    : Promise.resolve(null);

  // Options Flow (no custom prompt - data-based)
  const optionsPromise = availableSources.includes('options-flow')
    ? gatherOptionsIntelligence(symbol)
    : Promise.resolve(null);

  // Wait for all sources
  const results = await Promise.all([
    technicalPromise,
    newsPromise,
    socialPromise,
    researchPromise,
    optionsPromise,
  ]);

  // Report synthesizing phase
  onProgress?.({ phase: 'synthesizing' });

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
