/**
 * NewsPanel - Display news articles with sentiment
 *
 * Shows recent news headlines with sentiment indicators
 */

import { memo } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import type { NewsArticle } from '@/services/api/newsapi';

interface NewsPanelProps {
  articles: NewsArticle[];
  isLoading?: boolean;
}

export const NewsPanel = memo(function NewsPanel({
  articles,
  isLoading,
}: NewsPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-800 rounded w-1/3" />
          <div className="h-20 bg-slate-800 rounded" />
          <div className="h-20 bg-slate-800 rounded" />
          <div className="h-20 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Newspaper className="w-5 h-5" />
          <span>No recent news available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-slate-400" />
        <h3 className="text-white font-semibold">Recent News</h3>
        <span className="text-slate-500 text-sm">({articles.length})</span>
      </div>

      <div className="space-y-3">
        {articles.slice(0, 5).map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <SentimentIcon sentiment={article.sentiment} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-slate-500 text-xs">
                    {article.source.name}
                  </span>
                  <span className="text-slate-600 text-xs">·</span>
                  <span className="text-slate-500 text-xs">
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Sentiment Summary */}
      {articles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/50">
          <SentimentSummary articles={articles} />
        </div>
      )}
    </div>
  );
});

function SentimentIcon({ sentiment }: { sentiment?: string }) {
  switch (sentiment) {
    case 'positive':
      return (
        <div className="p-1.5 rounded-lg bg-emerald-500/20 flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
      );
    case 'negative':
      return (
        <div className="p-1.5 rounded-lg bg-rose-500/20 flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-rose-500" />
        </div>
      );
    default:
      return (
        <div className="p-1.5 rounded-lg bg-slate-700/50 flex-shrink-0">
          <Minus className="w-4 h-4 text-slate-500" />
        </div>
      );
  }
}

function SentimentSummary({ articles }: { articles: NewsArticle[] }) {
  const positive = articles.filter((a) => a.sentiment === 'positive').length;
  const negative = articles.filter((a) => a.sentiment === 'negative').length;
  const neutral = articles.filter((a) => a.sentiment === 'neutral').length;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">Sentiment breakdown:</span>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-400">{positive}</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-400">{neutral}</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-rose-400">{negative}</span>
        </span>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default NewsPanel;
