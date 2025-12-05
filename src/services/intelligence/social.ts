/**
 * Social Intelligence Service
 *
 * Integrates with Grok (xAI) for X/Twitter sentiment analysis.
 * Provides real-time social sentiment from the X platform.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { SocialReport, SocialReportData } from '@/types/intelligence';
import { getXSentiment, formatGrokForClaude } from '@/services/ai/grok';

// Company name mapping for better search results
const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Google Alphabet',
  AMZN: 'Amazon',
  NVDA: 'NVIDIA',
  META: 'Meta Facebook',
  TSLA: 'Tesla',
  BRK: 'Berkshire Hathaway',
  JPM: 'JPMorgan Chase',
  V: 'Visa',
  JNJ: 'Johnson & Johnson',
  WMT: 'Walmart',
  PG: 'Procter & Gamble',
  UNH: 'UnitedHealth',
  HD: 'Home Depot',
  DIS: 'Disney',
  NFLX: 'Netflix',
  CRM: 'Salesforce',
  AMD: 'AMD',
  INTC: 'Intel',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather social sentiment intelligence from Grok/X
 *
 * @param symbol - Stock symbol (e.g., AAPL)
 * @param companyName - Optional company name for better search context
 * @returns Social intelligence report or null if unavailable
 */
export async function gatherSocialIntelligence(
  symbol: string,
  companyName?: string
): Promise<SocialReport | null> {
  try {
    const apiKey = useApiKeysStore.getState().getApiKey('grok');

    if (!apiKey) {
      console.debug('[Social] No Grok API key configured');
      return null;
    }

    const name = companyName || COMPANY_NAMES[symbol.toUpperCase()] || symbol;
    console.debug(`[Social] Fetching X/Twitter sentiment for ${symbol} via Grok`);

    const grokResult = await getXSentiment(symbol, name, apiKey);

    if (!grokResult) {
      console.debug(`[Social] No Grok result for ${symbol}`);
      return null;
    }

    // Convert Grok result to SocialReportData
    const reportData: SocialReportData = {
      platform: 'twitter',
      mentionCount: grokResult.metrics.mentionCount,
      sentimentScore: grokResult.sentiment.score,
      trending: grokResult.metrics.trending,
      topTakes: grokResult.topTakes.map((t) => t.text),
      retailVsInstitutional: grokResult.retailVsInstitutional,
      engagementMetrics: {
        likes: grokResult.topTakes.reduce((sum, t) => sum + t.engagement, 0),
        retweets: Math.floor(
          grokResult.topTakes.reduce((sum, t) => sum + t.engagement, 0) * 0.3
        ),
        replies: Math.floor(
          grokResult.topTakes.reduce((sum, t) => sum + t.engagement, 0) * 0.1
        ),
      },
      influentialPosts: grokResult.topTakes.map((t) => ({
        author: 'X User',
        text: t.text,
        engagement: t.engagement,
        sentiment: t.sentiment,
      })),
    };

    // Calculate confidence based on data quality
    const confidence = Math.min(
      95,
      Math.max(50, grokResult.sentiment.confidence)
    );

    return {
      source: 'social-sentiment',
      timestamp: grokResult.timestamp,
      confidence,
      data: reportData,
      summary: formatGrokForClaude(grokResult),
    };
  } catch (error) {
    console.error(`[Social] Error gathering intelligence for ${symbol}:`, error);
    return null;
  }
}

