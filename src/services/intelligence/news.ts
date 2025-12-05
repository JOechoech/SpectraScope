/**
 * News Intelligence Service
 *
 * Fetches and analyzes news sentiment from Finnhub API.
 * Requires Finnhub API key.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { NewsReport, NewsReportData, NewsHeadline } from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// FINNHUB API
// ═══════════════════════════════════════════════════════════════════════════

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubNewsItem {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface FinnhubSentiment {
  buzz: {
    articlesInLastWeek: number;
    buzz: number;
    weeklyAverage: number;
  };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
  symbol: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather news intelligence from Finnhub
 *
 * @param symbol - Stock symbol
 * @returns News intelligence report or null if unavailable
 */
export async function gatherNewsIntelligence(
  symbol: string
): Promise<NewsReport | null> {
  try {
    const apiKey = useApiKeysStore.getState().getApiKey('finnhub');

    if (!apiKey) {
      console.warn('[News] No Finnhub API key configured');
      return null;
    }

    // Fetch news and sentiment in parallel
    const [newsItems, sentiment] = await Promise.all([
      fetchCompanyNews(symbol, apiKey),
      fetchNewsSentiment(symbol, apiKey),
    ]);

    if (!newsItems || newsItems.length === 0) {
      console.warn(`[News] No news found for ${symbol}`);
      return createEmptyReport(symbol);
    }

    // Process headlines
    const headlines = processHeadlines(newsItems);

    // Calculate overall sentiment
    const { overallSentiment, sentimentScore } = calculateOverallSentiment(
      headlines,
      sentiment
    );

    // Get top sources
    const topSources = getTopSources(headlines);

    // Build report data
    const data: NewsReportData = {
      headlines,
      overallSentiment,
      sentimentScore,
      articleCount: headlines.length,
      topSources,
    };

    // Generate summary
    const summary = generateNewsSummary(symbol, data, sentiment);

    return {
      source: 'news-sentiment',
      timestamp: new Date().toISOString(),
      confidence: calculateNewsConfidence(data, sentiment),
      data,
      summary,
    };
  } catch (error) {
    console.error(`[News] Error gathering intelligence for ${symbol}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchCompanyNews(
  symbol: string,
  apiKey: string
): Promise<FinnhubNewsItem[]> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7); // Last 7 days

  const from = fromDate.toISOString().split('T')[0];
  const to = toDate.toISOString().split('T')[0];

  const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  return response.json();
}

async function fetchNewsSentiment(
  symbol: string,
  apiKey: string
): Promise<FinnhubSentiment | null> {
  try {
    const url = `${FINNHUB_BASE_URL}/news-sentiment?symbol=${symbol}&token=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESSING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function processHeadlines(newsItems: FinnhubNewsItem[]): NewsHeadline[] {
  return newsItems
    .slice(0, 10) // Take top 10 most recent
    .map((item) => ({
      title: item.headline,
      source: item.source,
      url: item.url,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      sentiment: analyzeHeadlineSentiment(item.headline),
      relevance: 0.8, // Finnhub already filters by relevance
    }));
}

function analyzeHeadlineSentiment(
  headline: string
): 'positive' | 'neutral' | 'negative' {
  const lower = headline.toLowerCase();

  // Positive keywords
  const positiveWords = [
    'surge', 'soar', 'jump', 'gain', 'rise', 'climb', 'rally',
    'beat', 'exceed', 'strong', 'growth', 'profit', 'upgrade',
    'breakthrough', 'record', 'bullish', 'boost', 'positive',
  ];

  // Negative keywords
  const negativeWords = [
    'fall', 'drop', 'plunge', 'crash', 'decline', 'sink', 'tumble',
    'miss', 'cut', 'weak', 'loss', 'downgrade', 'concern', 'risk',
    'warning', 'bearish', 'negative', 'layoff', 'lawsuit',
  ];

  const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function calculateOverallSentiment(
  headlines: NewsHeadline[],
  apiSentiment: FinnhubSentiment | null
): { overallSentiment: NewsReportData['overallSentiment']; sentimentScore: number } {
  // Use Finnhub sentiment if available
  if (apiSentiment?.sentiment) {
    const { bullishPercent, bearishPercent } = apiSentiment.sentiment;
    const score = (bullishPercent - bearishPercent) / 100;

    let sentiment: NewsReportData['overallSentiment'] = 'neutral';
    if (score > 0.2) sentiment = 'bullish';
    else if (score < -0.2) sentiment = 'bearish';

    return { overallSentiment: sentiment, sentimentScore: score };
  }

  // Fallback to headline analysis
  const sentimentCounts = headlines.reduce(
    (acc, h) => {
      acc[h.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const total = headlines.length || 1;
  const score = (sentimentCounts.positive - sentimentCounts.negative) / total;

  let sentiment: NewsReportData['overallSentiment'] = 'neutral';
  if (score > 0.3) sentiment = 'bullish';
  else if (score < -0.3) sentiment = 'bearish';

  return { overallSentiment: sentiment, sentimentScore: score };
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
  apiSentiment: FinnhubSentiment | null
): string {
  const parts: string[] = [];

  // Article count
  parts.push(`Found ${data.articleCount} news articles for ${symbol} in the past week.`);

  // Overall sentiment
  const sentimentDesc =
    data.overallSentiment === 'bullish'
      ? 'positive'
      : data.overallSentiment === 'bearish'
      ? 'negative'
      : 'mixed';
  parts.push(`Overall news sentiment is ${sentimentDesc}.`);

  // Buzz level if available
  if (apiSentiment?.buzz) {
    const buzzLevel =
      apiSentiment.buzz.buzz > 1.5
        ? 'high'
        : apiSentiment.buzz.buzz > 0.8
        ? 'moderate'
        : 'low';
    parts.push(`Media attention is ${buzzLevel}.`);
  }

  // Top sources
  if (data.topSources.length > 0) {
    parts.push(`Key sources: ${data.topSources.join(', ')}.`);
  }

  return parts.join(' ');
}

function calculateNewsConfidence(
  data: NewsReportData,
  apiSentiment: FinnhubSentiment | null
): number {
  let confidence = 50;

  // More articles = more confidence
  if (data.articleCount >= 10) confidence += 15;
  else if (data.articleCount >= 5) confidence += 10;
  else if (data.articleCount >= 2) confidence += 5;

  // API sentiment available = more confidence
  if (apiSentiment?.sentiment) confidence += 15;

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
