/**
 * News Intelligence Service
 *
 * Fetches and analyzes news sentiment using OpenAI.
 * Uses GPT-4o-mini for fast, cost-efficient news analysis.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { getOpenAINewsAnalysis } from '@/services/ai/openai';
import type { NewsReport, NewsReportData, NewsHeadline } from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY NAME MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const companyNames: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Google Alphabet',
  AMZN: 'Amazon',
  NVDA: 'NVIDIA',
  META: 'Meta Facebook',
  TSLA: 'Tesla',
  'BRK.B': 'Berkshire Hathaway',
  JPM: 'JPMorgan Chase',
  V: 'Visa',
  JNJ: 'Johnson & Johnson',
  WMT: 'Walmart',
  AMD: 'AMD Advanced Micro Devices',
  INTC: 'Intel',
  NFLX: 'Netflix',
  DIS: 'Disney',
  CRM: 'Salesforce',
  PYPL: 'PayPal',
  SPY: 'S&P 500 ETF',
  QQQ: 'NASDAQ-100 ETF',
};

function getCompanyName(symbol: string): string {
  return companyNames[symbol] || symbol;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather news intelligence using OpenAI
 *
 * @param symbol - Stock symbol
 * @param companyName - Optional company name
 * @param customPrompt - Optional custom prompt from Claude Opus orchestrator
 * @returns News intelligence report or null if unavailable
 */
export async function gatherNewsIntelligence(
  symbol: string,
  companyName?: string,
  customPrompt?: string
): Promise<NewsReport | null> {
  try {
    // Use OpenAI API key
    const apiKey = useApiKeysStore.getState().getApiKey('openai');

    if (!apiKey) {
      console.warn('[News] No OpenAI API key configured');
      return null;
    }

    const company = companyName || getCompanyName(symbol);

    // Fetch news analysis from OpenAI (with custom prompt if provided)
    const result = await getOpenAINewsAnalysis(symbol, company, apiKey, customPrompt);

    if (!result) {
      console.warn(`[News] No news analysis available for ${symbol}`);
      return createEmptyReport(symbol);
    }

    // Convert OpenAI result to headlines format
    const headlines: NewsHeadline[] = result.headlines.map((h) => ({
      title: h.title,
      source: h.source || 'OpenAI',
      url: '',
      publishedAt: result.timestamp,
      sentiment: h.sentiment,
      relevance: 0.9,
    }));

    // Map sentiment
    const overallSentiment: NewsReportData['overallSentiment'] =
      result.overallSentiment === 'bullish'
        ? 'bullish'
        : result.overallSentiment === 'bearish'
        ? 'bearish'
        : 'neutral';

    // Build report data
    const data: NewsReportData = {
      headlines,
      overallSentiment,
      sentimentScore: result.sentimentScore,
      articleCount: headlines.length,
      topSources: ['OpenAI Analysis'],
      keyTopics: result.keyTopics,
      marketImpact: result.marketImpact,
    };

    // Generate summary
    const summary = generateNewsSummary(symbol, data, result);

    return {
      source: 'news-sentiment',
      timestamp: new Date().toISOString(),
      confidence: calculateNewsConfidence(data),
      data,
      summary,
    };
  } catch (error) {
    console.error(`[News] Error gathering intelligence for ${symbol}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY & CONFIDENCE
// ═══════════════════════════════════════════════════════════════════════════

function generateNewsSummary(
  symbol: string,
  data: NewsReportData,
  result: { keyTopics?: string[]; marketImpact?: string }
): string {
  const parts: string[] = [];

  // Overall sentiment
  const sentimentDesc =
    data.overallSentiment === 'bullish'
      ? 'positive'
      : data.overallSentiment === 'bearish'
      ? 'negative'
      : 'mixed';
  parts.push(`OpenAI analyzed recent news for ${symbol}. Overall sentiment is ${sentimentDesc}.`);

  // Key topics
  if (result.keyTopics && result.keyTopics.length > 0) {
    parts.push(`Key topics: ${result.keyTopics.slice(0, 3).join(', ')}.`);
  }

  // Market impact
  if (result.marketImpact) {
    parts.push(`Impact: ${result.marketImpact}`);
  }

  return parts.join(' ');
}

function calculateNewsConfidence(data: NewsReportData): number {
  let confidence = 60; // Base confidence for AI analysis

  // More headlines = more confidence
  if (data.articleCount >= 5) confidence += 15;
  else if (data.articleCount >= 3) confidence += 10;
  else if (data.articleCount >= 1) confidence += 5;

  // Strong sentiment = more confidence
  const sentimentStrength = Math.abs(data.sentimentScore);
  confidence += sentimentStrength * 10;

  return Math.min(90, Math.round(confidence));
}

function createEmptyReport(symbol: string): NewsReport {
  return {
    source: 'news-sentiment',
    timestamp: new Date().toISOString(),
    confidence: 20,
    data: {
      headlines: [],
      overallSentiment: 'neutral',
      sentimentScore: 0,
      articleCount: 0,
      topSources: [],
    },
    summary: `No recent news available for ${symbol}.`,
  };
}
