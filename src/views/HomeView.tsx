/**
 * HomeView - Market Overview with Indices and Magnificent 7
 *
 * Features:
 * - Market indices via ETFs (SPY, QQQ, etc.)
 * - Magnificent 7 stocks
 * - Data source indicator
 * - Real-time refresh
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { Header } from '@/components/layout';
import { NewsCarousel } from '@/components/news/NewsCarousel';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import * as marketData from '@/services/marketData';
import type { StockQuote } from '@/types';

// Market Indices (ETFs that track indices - Polygon supports these)
const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500', icon: '🇺🇸' },
  { symbol: 'QQQ', name: 'NASDAQ', icon: '📈' },
  { symbol: 'EWG', name: 'Germany', icon: '🇩🇪' },
  { symbol: 'GLD', name: 'Gold', icon: '🥇' },
  { symbol: 'USO', name: 'Oil', icon: '🛢️' },
  { symbol: 'BITO', name: 'Bitcoin', icon: '₿' },
];

// Magnificent 7
const MAG7 = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
];

interface HomeViewProps {
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
}

export const HomeView = memo(function HomeView({
  onSelectStock,
  onOpenSettings,
}: HomeViewProps) {
  const { getApiKey } = useApiKeysStore();
  const cachedQuotes = useQuoteCacheStore((s) => s.quotes);
  const cachedDataSource = useQuoteCacheStore((s) => s.dataSource);
  const setQuotesCache = useQuoteCacheStore((s) => s.setQuotes);

  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const polygonKey = getApiKey('polygon');

  // All symbols we need
  const allSymbols = [
    ...MARKET_INDICES.map((i) => i.symbol),
    ...MAG7.map((s) => s.symbol),
  ];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await marketData.getBulkQuotes(allSymbols);
      setQuotes(result.quotes);

      // Update global cache
      if (result.source !== 'unavailable') {
        setQuotesCache(result.quotes, result.source);
      }

      if (result.errors && result.errors.length > 0) {
        console.warn('[HomeView] Some quotes failed:', result.errors);
      }
    } catch (err) {
      console.error('[HomeView] Failed to load:', err);
      setError('Failed to load market data');
    } finally {
      setIsLoading(false);
    }
  }, [allSymbols, setQuotesCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use cached data if available
  useEffect(() => {
    if (Object.keys(cachedQuotes).length > 0) {
      const map = new Map<string, StockQuote>();
      Object.entries(cachedQuotes).forEach(([symbol, quote]) => {
        map.set(symbol, quote);
      });
      setQuotes(map);
    }
  }, [cachedQuotes]);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="SpectraScope"
        subtitle="AI-Powered Analysis"
        showSettings
        onSettings={onOpenSettings}
      />

      {/* Data Source Indicator */}
      <div className="px-5 mb-3">
        {isLoading ? (
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <RefreshCw size={16} className="text-slate-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading market data...</p>
          </div>
        ) : polygonKey && cachedDataSource === 'polygon' ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <Zap size={16} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm">Real-time via Polygon.io</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertCircle size={16} className="text-amber-400" />
            <p className="text-amber-400 text-sm">
              Add Polygon API key in Settings for live data
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-5 mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* News Carousel */}
      <NewsCarousel />

      {/* Market Overview */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Market Overview</h2>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MARKET_INDICES.map((index) => {
            const quote = quotes.get(index.symbol);
            const isUp = (quote?.change ?? 0) >= 0;

            return (
              <div
                key={index.symbol}
                onClick={() => onSelectStock(index.symbol)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{index.icon}</span>
                  <span className="text-slate-400 text-xs truncate">
                    {index.name}
                  </span>
                </div>

                {quote ? (
                  <>
                    <p className="text-white font-semibold">
                      ${quote.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? '▲' : '▼'} {isUp ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">--</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Magnificent 7 */}
      <div className="px-5 py-4">
        <h2 className="text-white font-semibold mb-3">Magnificent 7</h2>
        <div className="space-y-2">
          {MAG7.map((stock) => {
            const quote = quotes.get(stock.symbol);
            const isUp = (quote?.change ?? 0) >= 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div>
                  <span className="text-white font-semibold">{stock.symbol}</span>
                  <p className="text-slate-400 text-sm">{stock.name}</p>
                </div>

                {quote ? (
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ${quote.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm flex items-center gap-1 justify-end ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isUp ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">--</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default HomeView;
