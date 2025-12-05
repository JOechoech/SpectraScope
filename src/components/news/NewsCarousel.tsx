/**
 * NewsCarousel - Horizontal scrolling news headlines
 *
 * Displays top business news in a carousel format.
 * Uses NewsAPI for headlines when API key is available.
 */

import { useState, useEffect, memo } from 'react';
import { Newspaper, ExternalLink, AlertCircle } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { getTopBusinessNews, type NewsArticle } from '@/services/api/newsapi';

// Mock news for when no API key is available
const MOCK_NEWS: NewsArticle[] = [
  {
    title: 'Markets rally on positive economic data',
    description: 'Stocks surge as employment numbers exceed expectations',
    source: { name: 'Financial Times' },
    url: '#',
    publishedAt: new Date().toISOString(),
    sentiment: 'positive',
  },
  {
    title: 'Tech sector leads market gains',
    description: 'Technology stocks outperform broader market indices',
    source: { name: 'Bloomberg' },
    url: '#',
    publishedAt: new Date().toISOString(),
    sentiment: 'positive',
  },
  {
    title: 'Federal Reserve signals steady rates',
    description: 'Central bank maintains current monetary policy stance',
    source: { name: 'Reuters' },
    url: '#',
    publishedAt: new Date().toISOString(),
    sentiment: 'neutral',
  },
  {
    title: 'Q4 earnings season kicks off',
    description: 'Major companies set to report quarterly results',
    source: { name: 'CNBC' },
    url: '#',
    publishedAt: new Date().toISOString(),
    sentiment: 'neutral',
  },
];

export const NewsCarousel = memo(function NewsCarousel() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getApiKey } = useApiKeysStore();
  const newsApiKey = getApiKey('newsapi');

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);
      setError(null);

      if (!newsApiKey) {
        // Use mock news when no API key
        setNews(MOCK_NEWS);
        setIsLoading(false);
        return;
      }

      try {
        const articles = await getTopBusinessNews(newsApiKey);
        if (articles.length > 0) {
          setNews(articles);
        } else {
          setNews(MOCK_NEWS);
        }
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news');
        setNews(MOCK_NEWS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNews();
  }, [newsApiKey]);

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Newspaper size={16} className="text-slate-500" />
          <h2 className="text-slate-400 font-medium text-sm">Market News</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-24 bg-slate-800/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-slate-500" />
          <h2 className="text-slate-400 font-medium text-sm">Market News</h2>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-amber-400 text-xs">
            <AlertCircle size={12} />
            <span>Demo Mode</span>
          </div>
        )}
        {!newsApiKey && (
          <span className="text-slate-600 text-xs">Add NewsAPI key for live news</span>
        )}
      </div>

      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
        {news.map((article, index) => (
          <a
            key={`${article.title}-${index}`}
            href={article.url !== '#' ? article.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex-shrink-0 w-72 p-4 rounded-xl
              border ${getSentimentColor(article.sentiment)}
              snap-start
              transition-all duration-200
              ${article.url !== '#' ? 'hover:bg-slate-800/50 cursor-pointer' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-slate-500 text-xs">{article.source.name}</span>
              <span className="text-slate-600 text-xs">{formatTime(article.publishedAt)}</span>
            </div>
            <h3 className="text-white text-sm font-medium line-clamp-2 mb-2">
              {article.title}
            </h3>
            {article.url !== '#' && (
              <div className="flex items-center gap-1 text-blue-400 text-xs">
                <ExternalLink size={10} />
                <span>Read more</span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
});

export default NewsCarousel;
