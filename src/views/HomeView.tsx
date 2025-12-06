/**
 * HomeView - Market Overview with Indices, Portfolio, and Watchlist
 *
 * Features:
 * - Market indices via ETFs (SPY, QQQ, etc.)
 * - Portfolio value with individual holdings
 * - Watchlist with edit/remove functionality
 * - Compact design
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { RefreshCw, Settings, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import * as marketData from '@/services/marketData';
import type { StockQuote } from '@/types';

// Market Indices (ETFs that Polygon supports)
const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500', icon: '\u{1F1FA}\u{1F1F8}' },  // 🇺🇸
  { symbol: 'QQQ', name: 'NASDAQ', icon: '\u{1F4C8}' },           // 📈
  { symbol: 'DIA', name: 'Dow Jones', icon: '\u{1F3DB}\u{FE0F}' }, // 🏛️
  { symbol: 'VGK', name: 'Europe', icon: '\u{1F1EA}\u{1F1FA}' },   // 🇪🇺
  { symbol: 'GLD', name: 'Gold', icon: '\u{1F947}' },              // 🥇
  { symbol: 'IBIT', name: 'Bitcoin', icon: '\u{20BF}' },           // ₿
];

// Default watchlist stocks
const DEFAULT_WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
];

// Company names lookup
const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  AMZN: 'Amazon',
  NVDA: 'NVIDIA',
  META: 'Meta',
  TSLA: 'Tesla',
  AMD: 'AMD',
  INTC: 'Intel',
  JPM: 'JPMorgan',
  V: 'Visa',
  NFLX: 'Netflix',
};

/**
 * Format price with appropriate decimal places
 * - Under $1: 3 decimals ($0.823)
 * - Under $10: 2 decimals ($1.23)
 * - $10+: 2 decimals ($278.78)
 */
function formatPrice(price: number): string {
  if (price < 1) {
    return price.toFixed(3);
  }
  return price.toFixed(2);
}

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

  // Default watchlist symbols
  const defaultWatchlistSymbols = useMemo(
    () => new Set(DEFAULT_WATCHLIST.map((s) => s.symbol)),
    []
  );

  // Combined watchlist: defaults + user-added stocks from search
  const combinedWatchlist = useMemo(() => {
    const result = [...DEFAULT_WATCHLIST];
    // Add stocks from watchlistItems that aren't in defaults or indices
    const indicesSymbols = new Set(MARKET_INDICES.map((i) => i.symbol));
    watchlistItems.forEach((item) => {
      if (!defaultWatchlistSymbols.has(item.symbol) && !indicesSymbols.has(item.symbol)) {
        result.push({ symbol: item.symbol, name: item.name || COMPANY_NAMES[item.symbol] || item.symbol });
      }
    });
    return result;
  }, [watchlistItems, defaultWatchlistSymbols]);

  // Holdings with shares > 0
  const holdingsWithShares = useMemo(
    () => Object.values(holdings).filter((h) => h.shares > 0),
    [holdings]
  );

  // All symbols we need to fetch
  const allSymbols = useMemo(() => {
    const symbols = new Set<string>();
    MARKET_INDICES.forEach((i) => symbols.add(i.symbol));
    combinedWatchlist.forEach((s) => symbols.add(s.symbol));
    holdingsWithShares.forEach((h) => symbols.add(h.symbol.toUpperCase()));
    return Array.from(symbols);
  }, [combinedWatchlist, holdingsWithShares]);

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

  // Portfolio total value
  const totalValue = useMemo(
    () =>
      holdingsWithShares.reduce((sum, h) => {
        const quote = quotes.get(h.symbol.toUpperCase());
        return sum + h.shares * (quote?.price || 0);
      }, 0),
    [holdingsWithShares, quotes]
  );

  // Portfolio today's change
  const todayChange = useMemo(() => {
    let change = 0;
    holdingsWithShares.forEach((h) => {
      const quote = quotes.get(h.symbol.toUpperCase());
      if (quote) {
        change += h.shares * quote.change;
      }
    });
    return change;
  }, [holdingsWithShares, quotes]);

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
            {polygonKey && cachedDataSource === 'polygon' ? '\u26A1 Real-time via Polygon.io' : '\u26A0 Demo mode'}
          </span>
          {lastUpdate && <span>{formatTime(lastUpdate)}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* 1. Market Overview - Compact Grid */}
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
                      <p className="text-white font-semibold text-sm">${formatPrice(quote.price)}</p>
                      <p className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '\u25B2' : '\u25BC'} {Math.abs(quote.changePercent).toFixed(2)}%
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

        {/* 2. Portfolio Section */}
        {holdingsWithShares.length > 0 && (
          <div className="px-4 mb-4">
            <h2 className="text-white font-semibold text-sm mb-2">Portfolio</h2>

            {/* Portfolio Summary Card */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-xs">Total Value</p>
                  <p className="text-xl font-bold text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Today</p>
                  <p className={`font-semibold ${todayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Holdings */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              {holdingsWithShares.map((holding, idx) => {
                const symbol = holding.symbol.toUpperCase();
                const quote = quotes.get(symbol);
                const isUp = (quote?.change ?? 0) >= 0;
                const value = holding.shares * (quote?.price || 0);
                const dayChange = holding.shares * (quote?.change || 0);

                return (
                  <div
                    key={symbol}
                    onClick={() => onSelectStock(symbol)}
                    className={`flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                      idx < holdingsWithShares.length - 1 ? 'border-b border-slate-700/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm w-14">{symbol}</span>
                      <span className="text-slate-500 text-xs">{holding.shares} shares</span>
                    </div>

                    {quote ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-white text-sm block">${formatPrice(value)}</span>
                          <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}
                          </span>
                        </div>
                        {isUp ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">--</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Watchlist - Combined defaults + user-added */}
        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-white font-semibold text-sm">Watchlist</h2>
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
            {combinedWatchlist.map((stock, idx) => {
              const quote = quotes.get(stock.symbol);
              const isUp = (quote?.change ?? 0) >= 0;
              const holding = holdings[stock.symbol];
              const isUserAdded = !defaultWatchlistSymbols.has(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  className={`flex items-center px-3 py-2 ${
                    idx < combinedWatchlist.length - 1 ? 'border-b border-slate-700/30' : ''
                  }`}
                >
                  {/* Remove Button in Edit Mode (only for user-added stocks) */}
                  {isEditMode && isUserAdded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStock(stock.symbol);
                      }}
                      className="mr-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Minus className="w-3 h-3 text-white" />
                    </button>
                  )}

                  <div
                    className="flex-1 flex justify-between items-center cursor-pointer"
                    onClick={() => onSelectStock(stock.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm w-14">{stock.symbol}</span>
                      <span className="text-slate-400 text-xs">{stock.name}</span>
                      {holding?.shares > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          {holding.shares}
                        </span>
                      )}
                    </div>

                    {quote ? (
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm">${formatPrice(quote.price)}</span>
                        <span className={`text-xs w-16 text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">--</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default HomeView;
