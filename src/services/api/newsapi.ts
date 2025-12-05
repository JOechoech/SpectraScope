/**
 * NewsAPI Integration
 * https://newsapi.org/docs
 *
 * Free tier: 100 requests/day, headlines only
 */

const BASE_URL = 'https://newsapi.org/v2';

export interface NewsArticle {
  title: string;
  description: string;
  source: { name: string };
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export async function getStockNews(
  symbol: string,
  companyName: string,
  apiKey: string
): Promise<NewsArticle[]> {
  // NewsAPI searches by keyword, not stock symbol
  // Use company name for better results
  const query = encodeURIComponent(companyName || symbol);

  try {
    const response = await fetch(
      `${BASE_URL}/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.warn('NewsAPI error:', error);
      return [];
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      console.warn('NewsAPI returned non-ok status:', data);
      return [];
    }

    return (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      source: { name: article.source?.name || 'Unknown' },
      url: article.url,
      publishedAt: article.publishedAt,
      sentiment: inferSentiment(article.title + ' ' + (article.description || '')),
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
}

export async function getTopBusinessNews(apiKey: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/top-headlines?category=business&language=en&pageSize=10&apiKey=${apiKey}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      source: { name: article.source?.name || 'Unknown' },
      url: article.url,
      publishedAt: article.publishedAt,
      sentiment: inferSentiment(article.title),
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
}

function inferSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase();

  const positiveWords = [
    'surge', 'jump', 'gain', 'rise', 'beat', 'profit', 'growth',
    'bullish', 'upgrade', 'soar', 'rally', 'boom', 'record', 'best',
    'success', 'win', 'breakthrough', 'innovative',
  ];

  const negativeWords = [
    'fall', 'drop', 'decline', 'loss', 'miss', 'cut', 'bearish',
    'downgrade', 'crash', 'plunge', 'slump', 'fear', 'worry',
    'concern', 'risk', 'warning', 'layoff', 'lawsuit',
  ];

  const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export function getNewsSentimentScore(articles: NewsArticle[]): {
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
