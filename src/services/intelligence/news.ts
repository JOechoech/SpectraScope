/**
 * News Intelligence Service
 *
 * Fetches and analyzes news sentiment from NewsAPI.
 * Requires NewsAPI key.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { getStockNews, getNewsSentimentScore, type NewsArticle } from '@/services/api/newsapi';
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
  PG: 'Procter & Gamble',
  MA: 'Mastercard',
  UNH: 'UnitedHealth',
  HD: 'Home Depot',
  DIS: 'Disney',
  BAC: 'Bank of America',
  XOM: 'Exxon Mobil',
  NFLX: 'Netflix',
  AMD: 'AMD Advanced Micro Devices',
  INTC: 'Intel',
  CRM: 'Salesforce',
  ADBE: 'Adobe',
  PYPL: 'PayPal',
  COST: 'Costco',
  PEP: 'PepsiCo',
  KO: 'Coca-Cola',
  NKE: 'Nike',
  MCD: 'McDonald\'s',
};

function getCompanyName(symbol: string): string {
  return companyNames[symbol] || symbol;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather news intelligence from NewsAPI
 *
 * @param symbol - Stock symbol
 * @param companyName - Optional company name for better search results
 * @returns News intelligence report or null if unavailable
 */
export async function gatherNewsIntelligence(
  symbol: string,
  companyName?: string
): Promise<NewsReport | null> {
  try {
    const apiKey = useApiKeysStore.getState().getApiKey('newsapi');

    if (!apiKey) {
      console.warn('[News] No NewsAPI key configured');
      return null;
    }

    const company = companyName || getCompanyName(symbol);

    // Fetch news from NewsAPI
    const articles = await getStockNews(symbol, company, apiKey);

    if (!articles || articles.length === 0) {
      console.warn(`[News] No news found for ${symbol}`);
      return createEmptyReport(symbol);
    }

    // Process headlines
    const headlines = processHeadlines(articles);

    // Calculate overall sentiment
    const sentimentResult = getNewsSentimentScore(articles);
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

function processHeadlines(articles: NewsArticle[]): NewsHeadline[] {
  return articles
    .slice(0, 10) // Take top 10 most recent
    .map((article) => ({
      title: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      sentiment: article.sentiment || 'neutral',
      relevance: 0.8,
    }));
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
