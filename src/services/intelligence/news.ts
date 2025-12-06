/**
 * News Intelligence Service
 *
 * Fetches and analyzes news sentiment from Finnhub.
 * Uses Finnhub API (no CORS issues, works in browser).
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { getCompanyNews, type FinnhubNews } from '@/services/api/finnhub';
import type { NewsReport, NewsReportData, NewsHeadline } from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather news intelligence from Finnhub
 *
 * @param symbol - Stock symbol
 * @param companyName - Optional company name (not used by Finnhub)
 * @returns News intelligence report or null if unavailable
 */
export async function gatherNewsIntelligence(
  symbol: string,
  _companyName?: string
): Promise<NewsReport | null> {
  try {
    // Use Finnhub API key (no CORS issues)
    const apiKey = useApiKeysStore.getState().getApiKey('finnhub');

    if (!apiKey) {
      console.warn('[News] No Finnhub API key configured');
      return null;
    }

    // Fetch news from Finnhub
    const articles = await getCompanyNews(symbol, apiKey);

    if (!articles || articles.length === 0) {
      console.warn(`[News] No news found for ${symbol}`);
      return createEmptyReport(symbol);
    }

    // Process headlines from Finnhub format
    const headlines = processFinnhubHeadlines(articles);

    // Calculate overall sentiment from Finnhub articles
    const sentimentResult = calculateFinnhubSentiment(articles);
    const overallSentiment: NewsReportData['overallSentiment'] =
      sentimentResult.label === 'bullish'
        ? 'bullish'
        : sentimentResult.label === 'bearish'
        ? 'bearish'
        : 'neutral';

    // Get top sources
    const topSources = getTopSources(headlines);

    // Build report data
    const data: NewsReportData = {
      headlines,
      overallSentiment,
      sentimentScore: sentimentResult.score,
      articleCount: headlines.length,
      topSources,
    };

    // Generate summary
    const summary = generateNewsSummary(symbol, data, sentimentResult.breakdown);

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
// PROCESSING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function processFinnhubHeadlines(articles: FinnhubNews[]): NewsHeadline[] {
  return articles
    .slice(0, 10) // Take top 10 most recent
    .map((article) => ({
      title: article.headline,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      sentiment: article.sentiment || 'neutral',
      relevance: 0.8,
    }));
}

function calculateFinnhubSentiment(articles: FinnhubNews[]): {
  score: number;
  label: 'bullish' | 'neutral' | 'bearish';
  breakdown: { positive: number; neutral: number; negative: number };
} {
  if (articles.length === 0) {
    return { score: 0, label: 'neutral', breakdown: { positive: 0, neutral: 0, negative: 0 } };
  }

  const breakdown = {
    positive: articles.filter((a) => a.sentiment === 'positive').length,
    neutral: articles.filter((a) => a.sentiment === 'neutral').length,
    negative: articles.filter((a) => a.sentiment === 'negative').length,
  };

  const score = (breakdown.positive - breakdown.negative) / articles.length;

  return {
    score,
    label: score > 0.2 ? 'bullish' : score < -0.2 ? 'bearish' : 'neutral',
    breakdown,
  };
}

function getTopSources(headlines: NewsHeadline[]): string[] {
  const sourceCounts = headlines.reduce((acc, h) => {
    acc[h.source] = (acc[h.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([source]) => source);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY & CONFIDENCE
// ═══════════════════════════════════════════════════════════════════════════

function generateNewsSummary(
  symbol: string,
  data: NewsReportData,
  breakdown: { positive: number; neutral: number; negative: number }
): string {
  const parts: string[] = [];

  // Article count
  parts.push(`Found ${data.articleCount} news articles for ${symbol}.`);

  // Overall sentiment
  const sentimentDesc =
    data.overallSentiment === 'bullish'
      ? 'positive'
      : data.overallSentiment === 'bearish'
      ? 'negative'
      : 'mixed';
  parts.push(`Overall news sentiment is ${sentimentDesc}.`);

  // Sentiment breakdown
  if (breakdown.positive > 0 || breakdown.negative > 0) {
    parts.push(
      `Breakdown: ${breakdown.positive} positive, ${breakdown.neutral} neutral, ${breakdown.negative} negative.`
    );
  }

  // Top sources
  if (data.topSources.length > 0) {
    parts.push(`Key sources: ${data.topSources.join(', ')}.`);
  }

  return parts.join(' ');
}

function calculateNewsConfidence(data: NewsReportData): number {
  let confidence = 50;

  // More articles = more confidence
  if (data.articleCount >= 10) confidence += 20;
  else if (data.articleCount >= 5) confidence += 15;
  else if (data.articleCount >= 2) confidence += 8;

  // Strong sentiment agreement
  const sentimentStrength = Math.abs(data.sentimentScore);
  confidence += sentimentStrength * 15;

  return Math.min(95, Math.round(confidence));
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
    summary: `No recent news articles found for ${symbol}.`,
  };
}
