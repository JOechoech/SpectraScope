/**
 * Finnhub API Service
 *
 * Documentation: https://finnhub.io/docs/api
 *
 * Features:
 * - Company news with sentiment inference
 * - News sentiment aggregation
 */

const BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubNews {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  category?: string;
  related?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKET NEWS (General - FREE!)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get general market news (FREE - 60 calls/min)
 */
export async function getMarketNews(
  apiKey: string,
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'
): Promise<FinnhubNews[]> {
  const url = `${BASE_URL}/news?category=${category}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Finnhub market news error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('Finnhub returned unexpected data format');
      return [];
    }

    return data.slice(0, 10).map((item: any) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      datetime: item.datetime,
      image: item.image,
      category: item.category,
      related: item.related,
      sentiment: inferSentiment(item.headline),
    }));
  } catch (error) {
    console.error('Finnhub market news error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY NEWS
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyNews(
  symbol: string,
  apiKey: string,
  daysBack: number = 7
): Promise<FinnhubNews[]> {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const url = `${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Finnhub API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('Finnhub returned unexpected data format');
      return [];
    }

    return data.slice(0, 10).map((item: any) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      datetime: item.datetime,
      sentiment: inferSentiment(item.headline),
    }));
  } catch (error) {
    console.error('Finnhub API error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT INFERENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple rule-based sentiment inference from headlines
 */
function inferSentiment(headline: string): 'positive' | 'neutral' | 'negative' {
  const lower = headline.toLowerCase();

  const positiveWords = [
    'surge',
    'jump',
    'gain',
    'rise',
    'beat',
    'profit',
    'growth',
    'bullish',
    'upgrade',
    'record',
    'soar',
    'rally',
    'boost',
    'exceed',
    'outperform',
    'strong',
    'positive',
  ];

  const negativeWords = [
    'fall',
    'drop',
    'decline',
    'loss',
    'miss',
    'cut',
    'bearish',
    'downgrade',
    'crash',
    'plunge',
    'tumble',
    'sink',
    'weak',
    'negative',
    'concern',
    'risk',
    'warning',
  ];

  const positiveCount = positiveWords.filter((word) =>
    lower.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    lower.includes(word)
  ).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS SENTIMENT AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

export async function getNewsSentiment(
  symbol: string,
  apiKey: string
): Promise<{ score: number; label: string; newsCount: number }> {
  const news = await getCompanyNews(symbol, apiKey);

  if (news.length === 0) {
    return { score: 0, label: 'neutral', newsCount: 0 };
  }

  const scores: number[] = news.map((n) => {
    if (n.sentiment === 'positive') return 1;
    if (n.sentiment === 'negative') return -1;
    return 0;
  });

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    score: avgScore,
    label: avgScore > 0.2 ? 'bullish' : avgScore < -0.2 ? 'bearish' : 'neutral',
    newsCount: news.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKET STATUS
// ═══════════════════════════════════════════════════════════════════════════

export async function getMarketStatus(apiKey: string): Promise<{
  exchange: string;
  isOpen: boolean;
  session: string;
}> {
  const url = `${BASE_URL}/stock/market-status?exchange=US&token=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      exchange: data.exchange || 'US',
      isOpen: data.isOpen || false,
      session: data.session || 'closed',
    };
  } catch (error) {
    console.error('Market status error:', error);
    return {
      exchange: 'US',
      isOpen: false,
      session: 'unknown',
    };
  }
}
