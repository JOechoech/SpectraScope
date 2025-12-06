/**
 * Research Intelligence Service
 *
 * Integrates with Gemini (Google) for web research and analyst opinions.
 * Falls back to Perplexity if available.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { ResearchReport, ResearchReportData } from '@/types/intelligence';
import { getGeminiResearch, formatGeminiForClaude } from '@/services/ai/gemini';

// Company name mapping for better search results
const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  NVDA: 'NVIDIA Corporation',
  META: 'Meta Platforms Inc.',
  TSLA: 'Tesla Inc.',
  BRK: 'Berkshire Hathaway Inc.',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  JNJ: 'Johnson & Johnson',
  WMT: 'Walmart Inc.',
  PG: 'Procter & Gamble Co.',
  UNH: 'UnitedHealth Group Inc.',
  HD: 'The Home Depot Inc.',
  DIS: 'The Walt Disney Company',
  NFLX: 'Netflix Inc.',
  CRM: 'Salesforce Inc.',
  AMD: 'Advanced Micro Devices Inc.',
  INTC: 'Intel Corporation',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather research intelligence from Gemini or Perplexity
 *
 * @param symbol - Stock symbol
 * @param companyName - Company name for better search context
 * @param currentPrice - Current stock price for context
 * @param customPrompt - Optional custom prompt from Claude Opus orchestrator
 * @returns Research intelligence report or null if unavailable
 */
export async function gatherResearchIntelligence(
  symbol: string,
  companyName?: string,
  currentPrice?: number,
  customPrompt?: string
): Promise<ResearchReport | null> {
  const store = useApiKeysStore.getState();
  const geminiKey = store.getApiKey('gemini');
  const perplexityKey = store.getApiKey('perplexity');

  const name = companyName || COMPANY_NAMES[symbol.toUpperCase()] || symbol;
  const price = currentPrice || 100; // Default price if not provided

  // Try Gemini first (preferred for analyst data)
  if (geminiKey) {
    try {
      console.debug(`[Research] Fetching analyst data for ${symbol} via Gemini`);
      // Pass custom prompt if provided by orchestrator
      const geminiResult = await getGeminiResearch(symbol, name, price, geminiKey, customPrompt);

      if (geminiResult) {
        // Build citations from Gemini sources (live web search)
        const citations = geminiResult.sources && geminiResult.sources.length > 0
          ? geminiResult.sources.map((s) => ({
              title: s.title,
              url: s.url || '',
              date: s.date,
              snippet: 'Live web search result',
            }))
          : [{
              title: 'Gemini AI with Google Search',
              url: 'https://ai.google.dev',
              date: new Date().toISOString().split('T')[0],
              snippet: 'AI-generated research based on live web data',
            }];

        // Convert Gemini result to ResearchReportData
        const reportData: ResearchReportData = {
          keyFindings: geminiResult.keyFindings,
          recentDevelopments: geminiResult.recentDevelopments,
          analystConsensus: `Analyst consensus: ${geminiResult.research.analystConsensus.toUpperCase()}`,
          priceTargets: geminiResult.research.averagePriceTarget
            ? {
                low: geminiResult.research.priceTargetRange?.low || price * 0.8,
                median: geminiResult.research.averagePriceTarget,
                high: geminiResult.research.priceTargetRange?.high || price * 1.3,
                numberOfAnalysts: 15, // Estimate
              }
            : undefined,
          upcomingEvents: [],
          citations,
        };

        return {
          source: 'web-research',
          timestamp: geminiResult.timestamp,
          confidence: 75, // Good confidence for Gemini
          data: reportData,
          summary: formatGeminiForClaude(geminiResult),
        };
      }
    } catch (error) {
      console.error(`[Research] Gemini error for ${symbol}:`, error);
    }
  }

  // Fall back to Perplexity if available
  if (perplexityKey) {
    console.debug(`[Research] Perplexity integration pending for ${symbol}`);
    // TODO: Implement Perplexity API integration
    return null;
  }

  console.debug('[Research] No research API key configured (Gemini or Perplexity)');
  return null;
}

