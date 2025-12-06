/**
 * HomeView - Market Overview with Indices and Magnificent 7
 *
 * Features:
 * - Market indices via ETFs (SPY, QQQ, etc.)
 * - Magnificent 7 stocks
 * - Custom watchlist with edit/remove
 * - Compact design
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { RefreshCw, Settings, Minus } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import * as marketData from '@/services/marketData';
import type { StockQuote } from '@/types';

// Market Indices (ETFs that Polygon supports)
const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500', icon: '🇺🇸' },
  { symbol: 'QQQ', name: 'NASDAQ', icon: '📈' },
  { symbol: 'DIA', name: 'Dow Jones', icon: '🏛️' },
  { symbol: 'EWG', name: 'Germany', icon: '🇩🇪' },
  { symbol: 'GLD', name: 'Gold', icon: '🥇' },
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
  onOpenSettings?: () => void;
}

export const HomeView = memo(function HomeView({
  onSelectStock,
  onOpenSettings,
}: HomeViewProps) {
  const { getApiKey } = useApiKeysStore();
  const { items: watchlistItems, removeStock, holdings } = useWatchlistStore();
  const cachedQuotes = useQuoteCacheStore((s) => s.quotes);
  const cachedDataSource = useQuoteCacheStore((s) => s.dataSource);
  const setQuotesCache = useQuoteCacheStore((s) => s.setQuotes);

  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const polygonKey = getApiKey('polygon');

  // Default symbols from indices and Mag7
  const defaultSymbols = useMemo(() => new Set([
    ...MARKET_INDICES.map((i) => i.symbol),
    ...MAG7.map((s) => s.symbol),
  ]), []);

  // Custom watchlist (user added, not in defaults)
  const customWatchlist = useMemo(() =>
    watchlistItems.filter((item) => !defaultSymbols.has(item.symbol)),
  [watchlistItems, defaultSymbols]);

  // All symbols we need to fetch
  const allSymbols = useMemo(() => [
    ...MARKET_INDICES.map((i) => i.symbol),
    ...MAG7.map((s) => s.symbol),
    ...customWatchlist.map((w) => w.symbol),
  ], [customWatchlist]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await marketData.getBulkQuotes(allSymbols);
      setQuotes(result.quotes);
      setLastUpdate(new Date());

      // Update global cache
      if (result.source !== 'unavailable') {
        setQuotesCache(result.quotes, result.source);
      }
    } catch (err) {
      console.error('[HomeView] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [allSymbols, setQuotesCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use cached data on mount
  useEffect(() => {
    if (Object.keys(cachedQuotes).length > 0) {
      const map = new Map<string, StockQuote>();
      Object.entries(cachedQuotes).forEach(([symbol, quote]) => {
        map.set(symbol, quote);
      });
      setQuotes(map);
    }
  }, [cachedQuotes]);

  // Holdings summary
  const holdingsWithShares = useMemo(() =>
    Object.values(holdings).filter((h) => h.shares > 0),
  [holdings]);

  const totalValue = useMemo(() =>
    holdingsWithShares.reduce((sum, h) => {
      const quote = quotes.get(h.symbol);
      return sum + h.shares * (quote?.price || 0);
    }, 0),
  [holdingsWithShares, quotes]);

  const formatTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="flex flex-col h-full bg-inherit min-h-screen">
      {/* Header - Compact */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Home</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Source - Compact */}
      <div className="px-4 pb-2">
        <div
          className={`rounded-lg px-3 py-1.5 text-xs flex justify-between items-center ${
            polygonKey && cachedDataSource === 'polygon'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}
        >
          <span>
            ⚡ {polygonKey && cachedDataSource === 'polygon' ? 'Real-time via Polygon.io' : 'Demo mode'}
          </span>
          {lastUpdate && <span>{formatTime(lastUpdate)}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Portfolio Summary - Compact */}
        {holdingsWithShares.length > 0 && (
          <div className="px-4 mb-3">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-xs">Portfolio Value</p>
                  <p className="text-xl font-bold text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">{holdingsWithShares.length} holdings</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Overview - Compact Grid */}
        <div className="px-4 mb-4">
          <h2 className="text-white font-semibold text-sm mb-2">Market Overview</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {MARKET_INDICES.map((index) => {
              const quote = quotes.get(index.symbol);
              const isUp = (quote?.change ?? 0) >= 0;

              return (
                <div
                  key={index.symbol}
                  onClick={() => onSelectStock(index.symbol)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">{index.icon}</span>
                    <span className="text-slate-400 text-[10px] truncate">{index.name}</span>
                  </div>

                  {quote ? (
                    <>
                      <p className="text-white font-semibold text-sm">${quote.price.toFixed(2)}</p>
                      <p className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(quote.changePercent).toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 text-xs">--</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Magnificent 7 - Compact List */}
        <div className="px-4 mb-4">
          <h2 className="text-white font-semibold text-sm mb-2">Magnificent 7</h2>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            {MAG7.map((stock, idx) => {
              const quote = quotes.get(stock.symbol);
              const isUp = (quote?.change ?? 0) >= 0;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className={`flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    idx < MAG7.length - 1 ? 'border-b border-slate-700/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm w-14">{stock.symbol}</span>
                    <span className="text-slate-400 text-xs">{stock.name}</span>
                  </div>

                  {quote ? (
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">${quote.price.toFixed(2)}</span>
                      <span className={`text-xs w-16 text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">--</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Watchlist - With Remove Button */}
        {customWatchlist.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white font-semibold text-sm">My Watchlist</h2>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`text-xs px-2 py-1 rounded ${
                  isEditMode ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              {customWatchlist.map((item, idx) => {
                const quote = quotes.get(item.symbol);
                const isUp = (quote?.change ?? 0) >= 0;
                const holding = holdings[item.symbol];

                return (
                  <div
                    key={item.symbol}
                    className={`flex items-center px-3 py-2 ${
                      idx < customWatchlist.length - 1 ? 'border-b border-slate-700/30' : ''
                    }`}
                  >
                    {/* Remove Button in Edit Mode */}
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStock(item.symbol);
                        }}
                        className="mr-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                    )}

                    <div
                      className="flex-1 flex justify-between items-center cursor-pointer"
                      onClick={() => onSelectStock(item.symbol)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{item.symbol}</span>
                        {holding?.shares > 0 && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                            {holding.shares} shares
                          </span>
                        )}
                      </div>

                      {quote ? (
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">${quote.price.toFixed(2)}</span>
                          <span className={`text-xs w-16 text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Loading...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default HomeView;
