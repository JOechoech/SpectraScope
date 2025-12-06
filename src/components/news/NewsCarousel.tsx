/**
 * NewsCarousel - Horizontal scrolling news headlines
 *
 * Displays top business news in a carousel format.
 * Uses Finnhub for real-time market news (FREE API).
 */

import { useState, useEffect, memo } from 'react';
import { Newspaper, ExternalLink, TrendingUp } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { getMarketNews, type FinnhubNews } from '@/services/api/finnhub';

interface DisplayNews {
  id: string | number;
  headline: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// Mock news for when no API key is available
const MOCK_NEWS: DisplayNews[] = [
  {
    id: 1,
    headline: 'Markets rally on positive economic data',
    source: 'Financial Times',
    url: '#',
    datetime: Date.now() / 1000 - 3600,
    sentiment: 'positive',
  },
  {
    id: 2,
    headline: 'Tech sector leads market gains',
    source: 'Bloomberg',
    url: '#',
    datetime: Date.now() / 1000 - 7200,
    sentiment: 'positive',
  },
  {
    id: 3,
    headline: 'Federal Reserve signals steady rates',
    source: 'Reuters',
    url: '#',
    datetime: Date.now() / 1000 - 14400,
    sentiment: 'neutral',
  },
  {
    id: 4,
    headline: 'Q4 earnings season kicks off',
    source: 'CNBC',
    url: '#',
    datetime: Date.now() / 1000 - 21600,
    sentiment: 'neutral',
  },
];

export const NewsCarousel = memo(function NewsCarousel() {
  const [news, setNews] = useState<DisplayNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'finnhub' | 'mock'>('mock');

  const { getApiKey } = useApiKeysStore();
  const finnhubKey = getApiKey('finnhub');

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);

      // Try Finnhub (FREE - 60 calls/min)
      if (finnhubKey) {
        try {
          const articles = await getMarketNews(finnhubKey);
          if (articles.length > 0) {
            setNews(articles.map((a: FinnhubNews) => ({
              id: a.id,
              headline: a.headline,
              source: a.source,
              url: a.url,
              datetime: a.datetime,
              image: a.image,
              sentiment: a.sentiment,
            })));
            setSource('finnhub');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Finnhub news error:', err);
        }
      }

      // Use mock news as fallback
      setNews(MOCK_NEWS);
      setSource('mock');
      setIsLoading(false);
    }

    fetchNews();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [finnhubKey]);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'negative':
        return 'border-rose-500/30 bg-rose-500/5';
      default:
        return 'border-slate-700/50 bg-slate-900/30';
    }
  };

  const formatTime = (timestamp: number) => {
    const hours = Math.floor((Date.now() / 1000 - timestamp) / 3600);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // No Finnhub key - show hint
  if (!finnhubKey && !isLoading) {
    return (
      <div className="px-5 py-4">
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-slate-400 text-sm">Add Finnhub API key for free market news</p>
            <p className="text-slate-500 text-xs">finnhub.io - 60 free calls/minute</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 px-5 mb-3">
          <Newspaper size={16} className="text-slate-500" />
          <h2 className="text-slate-400 font-medium text-sm">Market News</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-32 bg-slate-800/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-slate-500" />
          <h2 className="text-slate-400 font-medium text-sm">Market News</h2>
        </div>
        <span className="text-slate-600 text-xs">
          {source === 'finnhub' ? 'via Finnhub' : 'Demo'}
        </span>
      </div>

      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
        {news.map((article) => (
          <a
            key={article.id}
            href={article.url !== '#' ? article.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-64 bg-slate-800/70 rounded-xl overflow-hidden hover:bg-slate-800 transition-colors snap-start"
          >
            {/* Thumbnail */}
            {article.image ? (
              <div
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: `url(${article.image})` }}
              />
            ) : (
              <div className="h-24 bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-400/50" />
              </div>
            )}

            {/* Content */}
            <div className={`p-3 border-t ${getSentimentColor(article.sentiment)}`}>
              <h3 className="text-white text-sm font-medium line-clamp-2 leading-tight mb-2">
                {article.headline}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs truncate max-w-[100px]">
                    {article.source}
                  </span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-slate-500 text-xs">
                    {formatTime(article.datetime)}
                  </span>
                </div>
                {article.url !== '#' && (
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
});

export default NewsCarousel;
