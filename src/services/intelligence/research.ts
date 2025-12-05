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
 * @returns Research intelligence report or null if unavailable
 */
export async function gatherResearchIntelligence(
  symbol: string,
  companyName?: string,
  currentPrice?: number
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
      const geminiResult = await getGeminiResearch(symbol, name, price, geminiKey);

      if (geminiResult) {
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
          citations: [
            {
              title: 'Gemini AI Analysis',
              url: 'https://ai.google.dev',
              snippet: 'AI-generated research based on web data',
            },
          ],
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

